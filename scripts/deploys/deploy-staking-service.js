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

  const stakingServiceContractName = "StakingService";
  const networkName = hre.network.name;

  console.log(`Network: ${networkName}`);

  let isPublicNetwork;
  let stakingPoolAddress;

  if (networkName === "sepolia") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.SEPOLIA_STAKING_POOL_ADDRESS;
  } else if (networkName === "mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "bsc_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BSC_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "bsc_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.BSC_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "okc_testnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.OKC_TESTNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "okc_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.OKC_MAINNET_STAKING_POOL_ADDRESS;
  } else if (networkName === "polygon_amoy") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.POLYGON_AMOY_STAKING_POOL_ADDRESS;
  } else if (networkName === "polygon_mainnet") {
    isPublicNetwork = true;
    stakingPoolAddress = process.env.POLYGON_MAINNET_STAKING_POOL_ADDRESS;
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
