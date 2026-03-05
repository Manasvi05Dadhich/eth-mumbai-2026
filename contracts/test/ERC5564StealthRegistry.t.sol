// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import {ERC5564StealthRegistry} from "../src/ERC5564StealthRegistry.sol";

contract ERC5564StealthRegistryTest is Test {
    ERC5564StealthRegistry public registry;
    address public contributor = address(0xC);

    function setUp() public {
        registry = new ERC5564StealthRegistry();
    }

    function test_registerMetaAddress() public {
        bytes32 ensHash = keccak256("alice.eth");
        bytes memory metaAddr = hex"04abcd1234";

        vm.prank(contributor);
        registry.registerMetaAddress(ensHash, metaAddr);

        bytes memory stored = registry.getMetaAddress(ensHash);
        assertEq(keccak256(stored), keccak256(metaAddr));
    }

    function test_announcePaymentEmitsEvent() public {
        address recipient = address(0xD);
        bytes memory announcement = hex"deadbeef";

        vm.expectEmit(true, false, false, true);
        emit ERC5564StealthRegistry.PaymentAnnounced(recipient, announcement);

        registry.announcePayment(recipient, announcement);
    }

    function test_unregisteredReturnsEmpty() public view {
        bytes32 ensHash = keccak256("nobody.eth");
        bytes memory result = registry.getMetaAddress(ensHash);
        assertEq(result.length, 0);
    }

    function test_cannotRegisterTwice() public {
        bytes32 ensHash = keccak256("alice.eth");
        bytes memory metaAddr = hex"04abcd1234";

        vm.prank(contributor);
        registry.registerMetaAddress(ensHash, metaAddr);

        vm.prank(contributor);
        vm.expectRevert(
            abi.encodeWithSelector(
                ERC5564StealthRegistry.AlreadyRegistered.selector,
                ensHash
            )
        );
        registry.registerMetaAddress(ensHash, hex"04ffff5678");
    }
}
