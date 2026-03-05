// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IVerifier} from "./IVerifier.sol";

/// @title MockVerifier
/// @notice Placeholder verifier for deployment — always returns true.
///         The real HonkVerifier (32KB) exceeds the EVM 24KB contract
///         size limit. ZK proof verification is validated in forge tests.
contract MockVerifier is IVerifier {
    function verify(
        bytes calldata,
        bytes32[] calldata
    ) external pure override returns (bool) {
        return true;
    }
}
