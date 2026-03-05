// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {IVerifier} from "./IVerifier.sol";

/// @title SkillRegistry
/// @notice Stores verified skill credentials per contributor per category.
///         When a contributor proves a skill via ZK proof, it is permanently recorded.
contract SkillRegistry {
    IVerifier public immutable skillVerifier;

    /// @dev user => categoryId => minimumRequired => verified
    mapping(address => mapping(uint256 => mapping(uint256 => bool))) private _verified;

    /// @dev user => list of verified category IDs
    mapping(address => uint256[]) private _verifiedCategories;

    /// @dev user => categoryId => whether this category has been added to the list
    mapping(address => mapping(uint256 => bool)) private _categoryTracked;

    event SkillVerified(
        address indexed user,
        uint256 indexed categoryId,
        uint256 minimumRequired
    );

    error InvalidSkillProof();

    constructor(address _skillVerifier) {
        skillVerifier = IVerifier(_skillVerifier);
    }

    /// @notice Verify a skill using a ZK proof.
    /// @param zkProof The ZK proof bytes from the skill circuit.
    /// @param publicInputs The public inputs for the ZK proof.
    /// @param categoryId The skill category (0=Solidity, 1=Cairo, etc.).
    /// @param minimumRequired The minimum completions required.
    function verifySkill(
        bytes calldata zkProof,
        bytes32[] calldata publicInputs,
        uint256 categoryId,
        uint256 minimumRequired
    ) external {
        if (!skillVerifier.verify(zkProof, publicInputs)) revert InvalidSkillProof();

        _verified[msg.sender][categoryId][minimumRequired] = true;

        // Track the category if not already tracked
        if (!_categoryTracked[msg.sender][categoryId]) {
            _categoryTracked[msg.sender][categoryId] = true;
            _verifiedCategories[msg.sender].push(categoryId);
        }

        emit SkillVerified(msg.sender, categoryId, minimumRequired);
    }

    /// @notice Check if an address has verified a specific category at a specific minimum.
    function isSkillVerified(
        address user,
        uint256 categoryId,
        uint256 minimumRequired
    ) external view returns (bool) {
        return _verified[user][categoryId][minimumRequired];
    }

    /// @notice Returns all categories an address has verified.
    function getVerifiedCategories(address user) external view returns (uint256[] memory) {
        return _verifiedCategories[user];
    }
}
