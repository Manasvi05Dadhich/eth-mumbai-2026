// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import {RiskParams} from "../src/RiskParams.sol";

contract RiskParamsTest is Test {
    RiskParams public riskParams;
    address public agent = address(0xA);
    address public nonOwner = address(0xB);

    function setUp() public {
        riskParams = new RiskParams(agent);
    }

    function test_ownerCanUpdateHash() public {
        bytes32 hash = keccak256("test-hash");
        vm.prank(agent);
        riskParams.updateHash(hash);

        assertEq(riskParams.getHash(), hash);
        assertGt(riskParams.getLastUpdated(), 0);
    }

    function test_nonOwnerCannotUpdateHash() public {
        bytes32 hash = keccak256("test-hash");
        vm.prank(nonOwner);
        vm.expectRevert();
        riskParams.updateHash(hash);
    }

    function test_isStaleReturnsFalseAfterUpdate() public {
        vm.prank(agent);
        riskParams.updateHash(keccak256("hash"));

        assertFalse(riskParams.isStale());
    }

    function test_isStaleReturnsTrueAfterOneHour() public {
        vm.prank(agent);
        riskParams.updateHash(keccak256("hash"));

        // Warp 1 hour + 1 second
        vm.warp(block.timestamp + 1 hours + 1);

        assertTrue(riskParams.isStale());
    }

    function test_isStaleReturnsTrueWhenNeverUpdated() public view {
        assertTrue(riskParams.isStale());
    }

    function test_getLastUpdatedReturnsCorrectTimestamp() public {
        uint256 ts = block.timestamp;
        vm.prank(agent);
        riskParams.updateHash(keccak256("hash"));

        assertEq(riskParams.getLastUpdated(), ts);
    }
}
