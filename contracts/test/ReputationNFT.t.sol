// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import {ReputationNFT} from "../src/ReputationNFT.sol";
import {RiskParams} from "../src/RiskParams.sol";
import {MockVerifier, MockENSRegistry} from "./mocks/Mocks.sol";

contract ReputationNFTTest is Test {
    ReputationNFT public nft;
    RiskParams public riskParams;
    MockVerifier public verifier;
    MockENSRegistry public ens;

    address public agent = address(0xA);
    address public contributor = address(0xC);
    bytes32 public ensNode = keccak256("alice.darkearn.eth");

    function setUp() public {
        verifier = new MockVerifier(true);
        riskParams = new RiskParams(agent);
        ens = new MockENSRegistry();

        nft = new ReputationNFT(
            address(verifier),
            address(riskParams),
            address(ens)
        );

        // Set up ENS ownership
        ens.setOwner(ensNode, contributor);

        // Set fresh risk params
        vm.prank(agent);
        riskParams.updateHash(keccak256("fresh-hash"));
    }

    function _mint() internal {
        vm.prank(contributor);
        nft.mint(hex"", new bytes32[](0), ensNode, 4, 30);
    }

    function test_validMint() public {
        _mint();

        assertEq(nft.ownerOf(0), contributor);
        assertTrue(nft.ensNodeMinted(ensNode));
    }

    function test_mintFailsWithInvalidProof() public {
        verifier.setShouldReturn(false);

        vm.prank(contributor);
        vm.expectRevert(ReputationNFT.InvalidZKProof.selector);
        nft.mint(hex"", new bytes32[](0), ensNode, 4, 30);
    }

    function test_mintFailsWhenNotENSOwner() public {
        address stranger = address(0xF);
        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(ReputationNFT.NotENSOwner.selector, ensNode)
        );
        nft.mint(hex"", new bytes32[](0), ensNode, 4, 30);
    }

    function test_mintFailsWhenRiskParamsStale() public {
        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(contributor);
        vm.expectRevert(ReputationNFT.RiskParamsStale.selector);
        nft.mint(hex"", new bytes32[](0), ensNode, 4, 30);
    }

    function test_transferAlwaysReverts() public {
        _mint();

        vm.prank(contributor);
        vm.expectRevert(ReputationNFT.SoulboundTransferBlocked.selector);
        nft.transferFrom(contributor, address(0xD), 0);
    }

    function test_duplicateMintReverts() public {
        _mint();

        vm.prank(contributor);
        vm.expectRevert(
            abi.encodeWithSelector(
                ReputationNFT.AlreadyMinted.selector,
                ensNode
            )
        );
        nft.mint(hex"", new bytes32[](0), ensNode, 4, 30);
    }

    function test_tokenURIReturnsValidBase64JSON() public {
        _mint();

        string memory uri = nft.tokenURI(0);

        // Should start with data:application/json;base64,
        assertTrue(bytes(uri).length > 35);
        // Check prefix
        bytes memory prefix = bytes("data:application/json;base64,");
        for (uint256 i = 0; i < prefix.length; i++) {
            assertEq(bytes(uri)[i], prefix[i]);
        }
    }

    function test_invalidScoreBandReverts() public {
        vm.prank(contributor);
        vm.expectRevert(
            abi.encodeWithSelector(ReputationNFT.InvalidScoreBand.selector, 5)
        );
        nft.mint(hex"", new bytes32[](0), ensNode, 5, 30);
    }
}
