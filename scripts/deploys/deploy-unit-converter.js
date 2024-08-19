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

  const unitConverterContractName = "UnitConverter";
  const networkName = hre.network.name;

  console.log(`Network: ${networkName}`);

  let isPublicNetwork;

  if (networkName === "sepolia") {
    isPublicNetwork = true;
  } else if (networkName === "mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "bsc_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "bsc_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "okc_testnet") {
    isPublicNetwork = true;
  } else if (networkName === "okc_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "polygon_amoy") {
    isPublicNetwork = true;
  } else if (networkName === "polygon_mainnet") {
    isPublicNetwork = true;
  } else if (networkName === "localhost") {
    isPublicNetwork = false;
  } else {
    throw new Error(`Unknown network: ${networkName}`);
  }

  if (isPublicNetwork === undefined) {
    throw new Error("Unknown is public network");
  }

  const UnitConverterFactory = await hre.ethers.getContractFactory(
    unitConverterContractName,
  );
  const unitConverterArgs = [];
  const unitConverterInstance = await deployHelpers.deployContract(
    UnitConverterFactory,
    unitConverterArgs,
    true,
  );

  await deployHelpers.isDeployed(unitConverterInstance, isPublicNetwork);

  console.log(`${unitConverterContractName}: ${unitConverterInstance.address}`);

  // Verify contract source code if deployed to public network
  if (isPublicNetwork) {
    console.log("Verifying Contracts...");

    await deployHelpers.verifyContract(
      networkName,
      unitConverterInstance.address,
      unitConverterInstance.deployTransaction.hash,
      unitConverterArgs,
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
