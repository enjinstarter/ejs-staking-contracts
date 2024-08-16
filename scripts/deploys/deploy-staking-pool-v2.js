// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const deployHelpers = require("./deploy-helpers");

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  const stakingPoolContractName = "StakingPoolV2";
  const networkName = hre.network.name;

  console.log(`Network: ${networkName}`);

  let isPublicNetwork;

  if (networkName === "arbitrum_one_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "arbitrum_nitro_sepolia_rollup_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "avax_c_chain_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "avax_c_chain_fuji_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "base_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "base_sepolia_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "blast_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "blast_sepolia_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "bsc_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "bsc_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "core_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "core_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "lightlink_phoenix_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "lightlink_pegasus_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "sepolia") {
    isPublicNetwork = true;
  } else if (networkName === "manta_pacific_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "manta_pacific_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "mantle_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "mantle_sepolia_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "okc_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "okc_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "op_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "op_sepolia_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "polygon_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "polygon_amoy") {
    isPublicNetwork = true;
  } else if (networkName === "localhost") {
    isPublicNetwork = false;
  } else {
    throw new Error(`Unknown network: ${networkName}`);
  }

  if (isPublicNetwork === undefined) {
    throw new Error("Unknown is public network");
  }

  const StakingPoolFactory = await hre.ethers.getContractFactory(
    stakingPoolContractName,
  );
  const stakingPoolArgs = [];
  const stakingPoolInstance = await deployHelpers.deployContract(
    StakingPoolFactory,
    stakingPoolArgs,
    true,
  );

  await deployHelpers.isDeployed(stakingPoolInstance, isPublicNetwork);

  console.log(`${stakingPoolContractName}: ${stakingPoolInstance.address}`);

  // Verify contract source code if deployed to public network
  if (isPublicNetwork) {
    console.log("Verifying Contracts...");

    await deployHelpers.verifyContract(
      networkName,
      stakingPoolInstance.address,
      stakingPoolInstance.deployTransaction.hash,
      stakingPoolArgs,
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
