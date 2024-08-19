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

  const stakingServiceContractName = "StakingServiceV2";
  const networkName = hre.network.name;

  console.log(`Network: ${networkName}`);

  let isPublicNetwork;
  let stakingPoolAddress;

  if (networkName === "arbitrum_one_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.ARBITRUM_ONE_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "arbitrum_nitro_sepolia_rollup_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress =
      process.env.ARBITRUM_NITRO_SEPOLIA_ROLLUP_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "avax_c_chain_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.AVAX_C_CHAIN_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "avax_c_chain_fuji_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress =
      process.env.AVAX_C_CHAIN_FUJI_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "base_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BASE_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "base_sepolia_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BASE_SEPOLIA_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "blast_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BLAST_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "blast_sepolia_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BLAST_SEPOLIA_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "bsc_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BSC_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "bsc_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BSC_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "core_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.CORE_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "core_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.CORE_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "lightlink_phoenix_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress =
      process.env.LIGHTLINK_PHOENIX_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "lightlink_pegasus_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress =
      process.env.LIGHTLINK_PEGASUS_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "sepolia") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.SEPOLIA_STAKING_POOL_ADDRESS;
  } else if (networkName === "manta_pacific_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.MANTA_PACIFIC_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "manta_pacific_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.MANTA_PACIFIC_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "mantle_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.MANTLE_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "mantle_sepolia_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress =
      process.env.MANTLE_SEPOLIA_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "okc_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.OKC_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "okc_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.OKC_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "op_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.OP_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "op_sepolia_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.OP_SEPOLIA_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "polygon_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.POLYGON_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "polygon_amoy") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.POLYGON_AMOY_STAKING_POOL_ADDRESS;
  } else if (networkName === "localhost") {
    isPublicNetwork = false;
    stakingPoolAddress = process.env.LOCALHOST_STAKING_POOL_ADDRESS;
  } else {
    throw new Error(`Unknown network: ${networkName}`);
  }

  if (isPublicNetwork === undefined) {
    throw new Error("Unknown is public network");
  } else if (stakingPoolAddress === undefined) {
    throw new Error("Unknown staking pool address");
  }

  const StakingServiceFactory = await hre.ethers.getContractFactory(
    stakingServiceContractName,
  );
  const stakingServiceArgs = [stakingPoolAddress];
  const stakingServiceInstance = await deployHelpers.deployContract(
    StakingServiceFactory,
    stakingServiceArgs,
    true,
  );

  await deployHelpers.isDeployed(stakingServiceInstance, isPublicNetwork);

  console.log(
    `${stakingServiceContractName}: ${stakingServiceInstance.address}`,
  );

  // Verify contract source code if deployed to public network
  if (isPublicNetwork) {
    console.log("Verifying Contracts...");

    await deployHelpers.verifyContract(
      networkName,
      stakingServiceInstance.address,
      stakingServiceInstance.deployTransaction.hash,
      stakingServiceArgs,
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
