// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IVerifier} from "./IVerifier.sol";
import {ReputationNFT} from "./ReputationNFT.sol";
import {SkillRegistry} from "./SkillRegistry.sol";
import {RiskParams} from "./RiskParams.sol";

/// @title BountyEscrow
/// @notice Core protocol contract managing the full lifecycle of bounties —
///         posting, applying, approving, and emitting events for payment.
///         Also handles private bidding with ECIES-encrypted prize amounts.
contract BountyEscrow {
    ReputationNFT public immutable reputationNFT;
    SkillRegistry public immutable skillRegistry;
    RiskParams public immutable riskParams;

    enum BountyStatus { Open, InProgress, Completed, Cancelled }

    struct Bounty {
        address protocol;
        bytes32 titleHash;
        bytes32 descriptionHash;
        uint256 categoryId;
        uint256 minScoreBand;
        uint256 minSkillCompletions;
        uint256 deadline;
        bytes encryptedPrize;
        bytes32 bitgoWalletId;
        BountyStatus status;
        address winner;
    }

    /// @dev bountyId => Bounty
    mapping(uint256 => Bounty) public bounties;

    /// @dev bountyId => applicant address => applied
    mapping(uint256 => mapping(address => bool)) public hasApplied;

    /// @dev bountyId => list of applicants
    mapping(uint256 => address[]) public applicants;

    uint256 public nextBountyId;

    // --- Events ---
    event BountyPosted(uint256 indexed bountyId, address indexed protocol, uint256 categoryId, uint256 deadline);
    event BountyApplicationSubmitted(uint256 indexed bountyId, address indexed applicant);
    event WorkApproved(uint256 indexed bountyId, address indexed winner);
    event PrivateBidSent(uint256 indexed bountyId, address indexed contributor, bytes encryptedBid);
    event BountyCancelled(uint256 indexed bountyId);

    // --- Errors ---
    error DeadlineInPast();
    error InvalidScoreBand(uint256 band);
    error BountyNotOpen(uint256 bountyId);
    error NotBountyProtocol(uint256 bountyId);
    error AlreadyApplied(uint256 bountyId, address applicant);
    error InsufficientReputation(uint256 required, uint256 actual);
    error SkillNotVerified(uint256 categoryId, uint256 minimumRequired);
    error InvalidReputationProof();
    error InvalidSkillProof();
    error ApplicantNotFound(uint256 bountyId, address applicant);
    error BountyHasApplications(uint256 bountyId);
    error DeadlinePassed(uint256 bountyId);

    constructor(
        address _reputationNFT,
        address _skillRegistry,
        address _riskParams
    ) {
        reputationNFT = ReputationNFT(_reputationNFT);
        skillRegistry = SkillRegistry(_skillRegistry);
        riskParams = RiskParams(_riskParams);
    }

    /// @notice Post a new bounty.
    function postBounty(
        bytes32 titleHash,
        bytes32 descriptionHash,
        uint256 categoryId,
        uint256 minScoreBand,
        uint256 minSkillCompletions,
        uint256 deadline,
        bytes calldata encryptedPrize,
        bytes32 bitgoWalletId
    ) external returns (uint256 bountyId) {
        if (deadline <= block.timestamp) revert DeadlineInPast();
        if (minScoreBand > 4) revert InvalidScoreBand(minScoreBand);

        bountyId = nextBountyId++;

        bounties[bountyId] = Bounty({
            protocol: msg.sender,
            titleHash: titleHash,
            descriptionHash: descriptionHash,
            categoryId: categoryId,
            minScoreBand: minScoreBand,
            minSkillCompletions: minSkillCompletions,
            deadline: deadline,
            encryptedPrize: encryptedPrize,
            bitgoWalletId: bitgoWalletId,
            status: BountyStatus.Open,
            winner: address(0)
        });

        emit BountyPosted(bountyId, msg.sender, categoryId, deadline);
    }

    /// @notice Apply to a bounty with reputation and skill ZK proofs.
    function applyToBounty(
        uint256 bountyId,
        bytes calldata repProof,
        bytes32[] calldata repInputs,
        bytes calldata skillProof,
        bytes32[] calldata skillInputs
    ) external {
        Bounty storage bounty = bounties[bountyId];

        if (bounty.status != BountyStatus.Open) revert BountyNotOpen(bountyId);
        if (block.timestamp > bounty.deadline) revert DeadlinePassed(bountyId);
        if (hasApplied[bountyId][msg.sender]) revert AlreadyApplied(bountyId, msg.sender);

        // Verify reputation ZK proof via the ReputationNFT's verifier
        IVerifier repVerifier = reputationNFT.reputationVerifier();
        if (!repVerifier.verify(repProof, repInputs)) revert InvalidReputationProof();

        // Verify skill ZK proof via SkillRegistry's verifier
        IVerifier skVerifier = skillRegistry.skillVerifier();
        if (!skVerifier.verify(skillProof, skillInputs)) revert InvalidSkillProof();

        // Check skill is verified in SkillRegistry
        if (!skillRegistry.isSkillVerified(msg.sender, bounty.categoryId, bounty.minSkillCompletions)) {
            revert SkillNotVerified(bounty.categoryId, bounty.minSkillCompletions);
        }

        // Record application
        hasApplied[bountyId][msg.sender] = true;
        applicants[bountyId].push(msg.sender);

        emit BountyApplicationSubmitted(bountyId, msg.sender);
    }

    /// @notice Protocol approves a specific applicant's work.
    function approveWork(uint256 bountyId, address winner) external {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.protocol) revert NotBountyProtocol(bountyId);
        if (bounty.status != BountyStatus.Open && bounty.status != BountyStatus.InProgress) {
            revert BountyNotOpen(bountyId);
        }
        if (!hasApplied[bountyId][winner]) revert ApplicantNotFound(bountyId, winner);

        bounty.status = BountyStatus.Completed;
        bounty.winner = winner;

        emit WorkApproved(bountyId, winner);
    }

    /// @notice Protocol sends an encrypted private bid to a specific contributor.
    function sendPrivateBid(
        uint256 bountyId,
        address contributor,
        bytes calldata encryptedBid
    ) external {
        Bounty storage bounty = bounties[bountyId];
        if (msg.sender != bounty.protocol) revert NotBountyProtocol(bountyId);

        emit PrivateBidSent(bountyId, contributor, encryptedBid);
    }

    /// @notice Cancel a bounty. Only allowed if no applications exist.
    function cancelBounty(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];

        if (msg.sender != bounty.protocol) revert NotBountyProtocol(bountyId);
        if (bounty.status != BountyStatus.Open) revert BountyNotOpen(bountyId);
        if (applicants[bountyId].length > 0) revert BountyHasApplications(bountyId);

        bounty.status = BountyStatus.Cancelled;

        emit BountyCancelled(bountyId);
    }

    /// @notice Get the number of applicants for a bounty.
    function getApplicantCount(uint256 bountyId) external view returns (uint256) {
        return applicants[bountyId].length;
    }

    /// @notice Get a specific applicant by index.
    function getApplicant(uint256 bountyId, uint256 index) external view returns (address) {
        return applicants[bountyId][index];
    }
}
