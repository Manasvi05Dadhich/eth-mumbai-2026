// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";
import {ReputationNFT} from "../src/ReputationNFT.sol";
import {SkillRegistry} from "../src/SkillRegistry.sol";
import {RiskParams} from "../src/RiskParams.sol";
import {MockVerifier, MockENSRegistry} from "./mocks/Mocks.sol";

contract BountyEscrowTest is Test {
    BountyEscrow public escrow;
    ReputationNFT public repNFT;
    SkillRegistry public skillRegistry;
    RiskParams public riskParams;
    MockVerifier public repVerifier;
    MockVerifier public skillVerifier;
    MockENSRegistry public ens;

    address public protocol = address(0x1);
    address public contributor = address(0xC);
    address public agent = address(0xA);
    address public stranger = address(0xF);

    bytes32 public ensNode = keccak256("alice.darkearn.eth");

    function setUp() public {
        repVerifier = new MockVerifier(true);
        skillVerifier = new MockVerifier(true);
        riskParams = new RiskParams(agent);
        ens = new MockENSRegistry();

        repNFT = new ReputationNFT(
            address(repVerifier),
            address(riskParams),
            address(ens)
        );

        skillRegistry = new SkillRegistry(address(skillVerifier));

        escrow = new BountyEscrow(
            address(repNFT),
            address(skillRegistry),
            address(riskParams)
        );

        // Setup: contributor has verified skill
        vm.prank(contributor);
        skillRegistry.verifySkill(hex"", new bytes32[](0), 0, 10);

        // Setup: fresh risk params
        vm.prank(agent);
        riskParams.updateHash(keccak256("fresh"));
    }

    function _postBounty() internal returns (uint256) {
        vm.prank(protocol);
        return
            escrow.postBounty(
                keccak256("Title"),
                keccak256("Description"),
                0, // categoryId: Solidity
                2, // minScoreBand
                10, // minSkillCompletions
                block.timestamp + 7 days,
                hex"aabbccdd",
                keccak256("bitgo-wallet-id")
            );
    }

    function _applyToBounty(uint256 bountyId) internal {
        vm.prank(contributor);
        escrow.applyToBounty(
            bountyId,
            hex"",
            new bytes32[](0),
            hex"",
            new bytes32[](0)
        );
    }

    // --- Post Bounty Tests ---

    function test_postBountyWithValidParams() public {
        uint256 bountyId = _postBounty();

        (address p, , , , , , , , , BountyEscrow.BountyStatus status, ) = escrow
            .bounties(bountyId);
        assertEq(p, protocol);
        assertTrue(status == BountyEscrow.BountyStatus.Open);
    }

    function test_postBountyWithPastDeadlineReverts() public {
        vm.prank(protocol);
        vm.expectRevert(BountyEscrow.DeadlineInPast.selector);
        escrow.postBounty(
            keccak256("Title"),
            keccak256("Description"),
            0,
            2,
            10,
            block.timestamp - 1, // Past deadline
            hex"aabb",
            keccak256("wallet")
        );
    }

    // --- Apply Tests ---

    function test_applyWithValidProofs() public {
        uint256 bountyId = _postBounty();
        _applyToBounty(bountyId);

        assertTrue(escrow.hasApplied(bountyId, contributor));
        assertEq(escrow.getApplicantCount(bountyId), 1);
    }

    function test_applyWithInvalidRepProofReverts() public {
        uint256 bountyId = _postBounty();
        repVerifier.setShouldReturn(false);

        vm.prank(contributor);
        vm.expectRevert(BountyEscrow.InvalidReputationProof.selector);
        escrow.applyToBounty(
            bountyId,
            hex"",
            new bytes32[](0),
            hex"",
            new bytes32[](0)
        );
    }

    function test_applyWithUnverifiedSkillReverts() public {
        uint256 bountyId = _postBounty();

        // New contributor without verified skill
        address newContrib = address(0xD);
        vm.prank(newContrib);
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.SkillNotVerified.selector,
                0,
                10
            )
        );
        escrow.applyToBounty(
            bountyId,
            hex"",
            new bytes32[](0),
            hex"",
            new bytes32[](0)
        );
    }

    function test_applyWithInvalidSkillProofReverts() public {
        uint256 bountyId = _postBounty();
        skillVerifier.setShouldReturn(false);

        vm.prank(contributor);
        vm.expectRevert(BountyEscrow.InvalidSkillProof.selector);
        escrow.applyToBounty(
            bountyId,
            hex"",
            new bytes32[](0),
            hex"",
            new bytes32[](0)
        );
    }

    function test_applyTwiceReverts() public {
        uint256 bountyId = _postBounty();
        _applyToBounty(bountyId);

        vm.prank(contributor);
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.AlreadyApplied.selector,
                bountyId,
                contributor
            )
        );
        escrow.applyToBounty(
            bountyId,
            hex"",
            new bytes32[](0),
            hex"",
            new bytes32[](0)
        );
    }

    // --- Approve Tests ---

    function test_approveWork() public {
        uint256 bountyId = _postBounty();
        _applyToBounty(bountyId);

        vm.prank(protocol);
        vm.expectEmit(true, true, false, false);
        emit BountyEscrow.WorkApproved(bountyId, contributor);
        escrow.approveWork(bountyId, contributor);

        (
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            ,
            BountyEscrow.BountyStatus status,
            address winner
        ) = escrow.bounties(bountyId);
        assertTrue(status == BountyEscrow.BountyStatus.Completed);
        assertEq(winner, contributor);
    }

    function test_nonProtocolCannotApprove() public {
        uint256 bountyId = _postBounty();
        _applyToBounty(bountyId);

        vm.prank(stranger);
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.NotBountyProtocol.selector,
                bountyId
            )
        );
        escrow.approveWork(bountyId, contributor);
    }

    // --- Private Bid Tests ---

    function test_privateBidEmitsEvent() public {
        uint256 bountyId = _postBounty();
        bytes memory encBid = hex"deadbeef01020304";

        vm.prank(protocol);
        vm.expectEmit(true, true, false, true);
        emit BountyEscrow.PrivateBidSent(bountyId, contributor, encBid);
        escrow.sendPrivateBid(bountyId, contributor, encBid);
    }

    // --- Cancel Tests ---

    function test_cancelWithNoApplications() public {
        uint256 bountyId = _postBounty();

        vm.prank(protocol);
        escrow.cancelBounty(bountyId);

        (, , , , , , , , , BountyEscrow.BountyStatus status, ) = escrow
            .bounties(bountyId);
        assertTrue(status == BountyEscrow.BountyStatus.Cancelled);
    }

    function test_cancelWithApplicationsReverts() public {
        uint256 bountyId = _postBounty();
        _applyToBounty(bountyId);

        vm.prank(protocol);
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.BountyHasApplications.selector,
                bountyId
            )
        );
        escrow.cancelBounty(bountyId);
    }
}
