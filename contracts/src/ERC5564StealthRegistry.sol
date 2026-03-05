// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/// @title ERC5564StealthRegistry
/// @notice Implements ERC-5564 stealth address registry. Contributors register their
///         stealth meta-address (a public key). When payments are made, a one-time stealth
///         address is generated that only they can detect and spend from.
contract ERC5564StealthRegistry {
    /// @dev ENS namehash => stealth meta-address bytes
    mapping(bytes32 => bytes) private _metaAddresses;

    /// @dev Track which ENS namehashes have been registered
    mapping(bytes32 => bool) private _registered;

    event MetaAddressRegistered(bytes32 indexed ensNamehash, address indexed registrant, bytes metaAddress);
    event PaymentAnnounced(
        address indexed recipient,
        bytes announcement
    );

    error AlreadyRegistered(bytes32 ensNamehash);
    error NotRegistered(bytes32 ensNamehash);

    /// @notice Register a stealth meta-address linked to an ENS namehash.
    /// @param ensNamehash The ENS namehash to associate with.
    /// @param metaAddress The stealth meta-address (public key bytes).
    function registerMetaAddress(bytes32 ensNamehash, bytes calldata metaAddress) external {
        if (_registered[ensNamehash]) revert AlreadyRegistered(ensNamehash);

        _metaAddresses[ensNamehash] = metaAddress;
        _registered[ensNamehash] = true;

        emit MetaAddressRegistered(ensNamehash, msg.sender, metaAddress);
    }

    /// @notice Called when a payment is made. Emits an announcement event so the
    ///         recipient can scan and detect funds meant for them.
    /// @param recipient The intended recipient address.
    /// @param announcement The announcement data (ephemeral public key + view tag).
    function announcePayment(address recipient, bytes calldata announcement) external {
        emit PaymentAnnounced(recipient, announcement);
    }

    /// @notice Returns the registered stealth meta-address for a given ENS namehash.
    /// @param ensNamehash The ENS namehash to look up.
    /// @return The stealth meta-address bytes (empty if not registered).
    function getMetaAddress(bytes32 ensNamehash) external view returns (bytes memory) {
        return _metaAddresses[ensNamehash];
    }
}
