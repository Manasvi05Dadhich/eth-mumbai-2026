// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import {SkillRegistry} from "../src/SkillRegistry.sol";
import {MockVerifier} from "./mocks/Mocks.sol";

contract SkillRegistryTest is Test {
    SkillRegistry public registry;
    MockVerifier public verifier;
    address public contributor = address(0xC);

    function setUp() public {
        verifier = new MockVerifier(true);
        registry = new SkillRegistry(address(verifier));
    }

    function test_validSkillProofStoresVerification() public {
        vm.prank(contributor);
        registry.verifySkill(hex"", new bytes32[](0), 0, 10);

        assertTrue(registry.isSkillVerified(contributor, 0, 10));
    }

    function test_invalidProofReverts() public {
        verifier.setShouldReturn(false);

        vm.prank(contributor);
        vm.expectRevert(SkillRegistry.InvalidSkillProof.selector);
        registry.verifySkill(hex"", new bytes32[](0), 0, 10);
    }

    function test_multipleCategories() public {
        vm.startPrank(contributor);
        registry.verifySkill(hex"", new bytes32[](0), 0, 10); // Solidity
        registry.verifySkill(hex"", new bytes32[](0), 1, 5); // Cairo
        registry.verifySkill(hex"", new bytes32[](0), 2, 8); // Frontend
        vm.stopPrank();

        assertTrue(registry.isSkillVerified(contributor, 0, 10));
        assertTrue(registry.isSkillVerified(contributor, 1, 5));
        assertTrue(registry.isSkillVerified(contributor, 2, 8));

        uint256[] memory categories = registry.getVerifiedCategories(
            contributor
        );
        assertEq(categories.length, 3);
        assertEq(categories[0], 0);
        assertEq(categories[1], 1);
        assertEq(categories[2], 2);
    }

    function test_isSkillVerifiedReturnsFalseForUnverified() public view {
        assertFalse(registry.isSkillVerified(contributor, 0, 10));
        assertFalse(registry.isSkillVerified(contributor, 3, 5));
    }
}
