// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title RiskParams
/// @notice Stores the latest DataHaven content hash from the fraud detection agent.
/// @dev Smart contracts read this hash to verify that fraud detection has run recently
///      before allowing reputation minting.
contract RiskParams is Ownable {
    bytes32 private _currentHash;
    uint256 private _lastUpdated;

    uint256 public constant STALE_THRESHOLD = 1 hours;

    event HashUpdated(bytes32 indexed newHash, uint256 timestamp);

    constructor(address agentWallet) Ownable(agentWallet) {}

    /// @notice Update the stored hash. Only callable by the agent's wallet address.
    /// @param newHash The new DataHaven content hash.
    function updateHash(bytes32 newHash) external onlyOwner {
        _currentHash = newHash;
        _lastUpdated = block.timestamp;
        emit HashUpdated(newHash, block.timestamp);
    }

    /// @notice Returns the current hash.
    function getHash() external view returns (bytes32) {
        return _currentHash;
    }

    /// @notice Returns true if more than 1 hour has passed since last update.
    function isStale() external view returns (bool) {
        if (_lastUpdated == 0) return true;
        return (block.timestamp - _lastUpdated) > STALE_THRESHOLD;
    }

    /// @notice Returns timestamp of last update.
    function getLastUpdated() external view returns (uint256) {
        return _lastUpdated;
    }
}
