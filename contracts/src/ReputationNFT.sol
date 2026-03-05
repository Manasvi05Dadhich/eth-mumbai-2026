// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {ERC721} from "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import {Strings} from "openzeppelin-contracts/contracts/utils/Strings.sol";
import {Base64} from "openzeppelin-contracts/contracts/utils/Base64.sol";
import {IVerifier} from "./IVerifier.sol";
import {RiskParams} from "./RiskParams.sol";

/// @title IENS — Minimal ENS registry interface
interface IENS {
    function owner(bytes32 node) external view returns (address);
}

/// @title ReputationNFT
/// @notice Soulbound ERC-721 reputation credentials. Each NFT is tied to an ENS name,
///         cannot be transferred, and can only be minted with a valid ZK proof + fresh
///         DataHaven fraud detection hash.
contract ReputationNFT is ERC721 {
    using Strings for uint256;

    IVerifier public immutable reputationVerifier;
    RiskParams public immutable riskParams;
    IENS public immutable ensRegistry;

    uint256 private _nextTokenId;

    struct ReputationData {
        bytes32 ensNode;
        uint256 scoreBand;
        uint256 completionCount;
        uint256 memberSince;
    }

    /// @dev tokenId => reputation data
    mapping(uint256 => ReputationData) public reputationData;

    /// @dev ensNode => whether an NFT has been minted for this ENS name
    mapping(bytes32 => bool) public ensNodeMinted;

    /// @dev ensNode => tokenId
    mapping(bytes32 => uint256) public ensNodeToTokenId;

    event ReputationMinted(
        address indexed to,
        uint256 indexed tokenId,
        bytes32 ensNode,
        uint256 scoreBand
    );

    error InvalidZKProof();
    error NotENSOwner(bytes32 ensNode);
    error RiskParamsStale();
    error AlreadyMinted(bytes32 ensNode);
    error InvalidScoreBand(uint256 band);
    error SoulboundTransferBlocked();

    constructor(
        address _reputationVerifier,
        address _riskParams,
        address _ensRegistry
    ) ERC721("DarkEarn Reputation", "DREP") {
        reputationVerifier = IVerifier(_reputationVerifier);
        riskParams = RiskParams(_riskParams);
        ensRegistry = IENS(_ensRegistry);
    }

    /// @notice Mint a soulbound reputation NFT.
    /// @param zkProof The ZK proof bytes from the reputation circuit.
    /// @param publicInputs The public inputs for the ZK proof.
    /// @param ensNode The ENS namehash for the contributor's ENS name.
    /// @param scoreBand The reputation score band (0-4).
    /// @param completionCount The number of completed bounties.
    function mint(
        bytes calldata zkProof,
        bytes32[] calldata publicInputs,
        bytes32 ensNode,
        uint256 scoreBand,
        uint256 completionCount
    ) external {
        // Validate score band
        if (scoreBand > 4) revert InvalidScoreBand(scoreBand);

        // Verify ZK proof
        if (!reputationVerifier.verify(zkProof, publicInputs))
            revert InvalidZKProof();

        // Verify ENS ownership
        if (ensRegistry.owner(ensNode) != msg.sender)
            revert NotENSOwner(ensNode);

        // Check fraud detection is fresh
        if (riskParams.isStale()) revert RiskParamsStale();

        // One NFT per ENS name
        if (ensNodeMinted[ensNode]) revert AlreadyMinted(ensNode);

        // Mint
        uint256 tokenId = _nextTokenId++;
        ensNodeMinted[ensNode] = true;
        ensNodeToTokenId[ensNode] = tokenId;

        reputationData[tokenId] = ReputationData({
            ensNode: ensNode,
            scoreBand: scoreBand,
            completionCount: completionCount,
            memberSince: block.timestamp
        });

        _safeMint(msg.sender, tokenId);

        emit ReputationMinted(msg.sender, tokenId, ensNode, scoreBand);
    }

    /// @notice Returns fully on-chain base64 JSON metadata.
    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        _requireOwned(tokenId);

        ReputationData memory data = reputationData[tokenId];

        string memory json = string(
            abi.encodePacked(
                '{"name":"DarkEarn Reputation #',
                tokenId.toString(),
                '","description":"Soulbound ZK-verified reputation credential","attributes":[',
                '{"trait_type":"ENS Node","value":"',
                _bytes32ToHexString(data.ensNode),
                '"},{"trait_type":"Score Band","value":',
                data.scoreBand.toString(),
                '},{"trait_type":"Completion Count","value":',
                data.completionCount.toString(),
                '},{"trait_type":"Member Since","value":',
                data.memberSince.toString(),
                "}]}"
            )
        );

        return
            string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64.encode(bytes(json))
                )
            );
    }

    /// @dev Override _update to block all transfers (soulbound).
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)), block all transfers
        if (from != address(0) && to != address(0)) {
            revert SoulboundTransferBlocked();
        }

        return super._update(to, tokenId, auth);
    }

    /// @dev Convert bytes32 to hex string for metadata.
    function _bytes32ToHexString(
        bytes32 data
    ) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(66); // "0x" + 64 hex chars
        str[0] = "0";
        str[1] = "x";
        for (uint256 i = 0; i < 32; i++) {
            str[2 + i * 2] = alphabet[uint8(data[i] >> 4)];
            str[3 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
