// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IVerifier} from "../../src/IVerifier.sol";

/// @title MockVerifier
/// @notice A controllable mock verifier for testing app-layer contracts.
contract MockVerifier is IVerifier {
    bool private _shouldReturn;

    constructor(bool shouldReturn_) {
        _shouldReturn = shouldReturn_;
    }

    function setShouldReturn(bool val) external {
        _shouldReturn = val;
    }

    function verify(
        bytes calldata,
        bytes32[] calldata
    ) external view override returns (bool) {
        return _shouldReturn;
    }
}

/// @title MockENSRegistry
/// @notice A mock ENS registry for testing ENS ownership checks.
contract MockENSRegistry {
    mapping(bytes32 => address) private _owners;

    function setOwner(bytes32 node, address owner_) external {
        _owners[node] = owner_;
    }

    function owner(bytes32 node) external view returns (address) {
        return _owners[node];
    }
}
