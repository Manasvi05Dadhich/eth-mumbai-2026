// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import {MockVerifier} from "../src/MockVerifier.sol";
import {RiskParams} from "../src/RiskParams.sol";
import {ERC5564StealthRegistry} from "../src/ERC5564StealthRegistry.sol";
import {ReputationNFT} from "../src/ReputationNFT.sol";
import {SkillRegistry} from "../src/SkillRegistry.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";

contract DeployScript is Script {
    // Base Sepolia ENS Registry
    address constant ENS_REGISTRY = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;

    function run() external {
        vm.startBroadcast();

        // 1. Deploy ReputationVerifier (MockVerifier — real HonkVerifier exceeds 24KB limit)
        MockVerifier reputationVerifier = new MockVerifier();
        console.log("ReputationVerifier:", address(reputationVerifier));

        // 2. Deploy SkillVerifier (MockVerifier)
        MockVerifier skillVerifier = new MockVerifier();
        console.log("SkillVerifier:", address(skillVerifier));

        // 3. Deploy RiskParams
        RiskParams riskParams = new RiskParams(msg.sender);
        console.log("RiskParams:", address(riskParams));

        // 4. Deploy ERC5564StealthRegistry
        ERC5564StealthRegistry stealthRegistry = new ERC5564StealthRegistry();
        console.log("ERC5564StealthRegistry:", address(stealthRegistry));

        // 5. Deploy ReputationNFT
        ReputationNFT reputationNFT = new ReputationNFT(
            address(reputationVerifier),
            address(riskParams),
            ENS_REGISTRY
        );
        console.log("ReputationNFT:", address(reputationNFT));

        // 6. Deploy SkillRegistry
        SkillRegistry skillRegistry = new SkillRegistry(address(skillVerifier));
        console.log("SkillRegistry:", address(skillRegistry));

        // 7. Deploy BountyEscrow
        BountyEscrow bountyEscrow = new BountyEscrow(
            address(reputationNFT),
            address(skillRegistry),
            address(riskParams)
        );
        console.log("BountyEscrow:", address(bountyEscrow));

        vm.stopBroadcast();

        // Write addresses to JSON
        string memory json = string(
            abi.encodePacked(
                "{\n",
                '  "ReputationVerifier": "',
                vm.toString(address(reputationVerifier)),
                '",\n',
                '  "SkillVerifier": "',
                vm.toString(address(skillVerifier)),
                '",\n',
                '  "RiskParams": "',
                vm.toString(address(riskParams)),
                '",\n',
                '  "ERC5564StealthRegistry": "',
                vm.toString(address(stealthRegistry)),
                '",\n',
                '  "ReputationNFT": "',
                vm.toString(address(reputationNFT)),
                '",\n',
                '  "SkillRegistry": "',
                vm.toString(address(skillRegistry)),
                '",\n',
                '  "BountyEscrow": "',
                vm.toString(address(bountyEscrow)),
                '"\n',
                "}"
            )
        );
        vm.writeFile("../addresses.json", json);
        console.log("Addresses written to ../addresses.json");
    }
}
