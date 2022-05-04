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

  const mockErc20TokenContractName = "MockErc20Token";
  const networkName = hre.network.name;

  console.log(`Network: ${networkName}`);

  let isPublicNetwork;
  let mockErc20TokenName;
  let mockErc20TokenSymbol;
  let mockErc20TokenDecimals;
  let mockErc20TokenCapEther;

  if (networkName === "ropsten") {
    isPublicNetwork = true;
    mockErc20TokenName = process.env.ROPSTEN_MOCK_ERC20_TOKEN_NAME;
    mockErc20TokenSymbol = process.env.ROPSTEN_MOCK_ERC20_TOKEN_SYMBOL;
    mockErc20TokenDecimals = process.env.ROPSTEN_MOCK_ERC20_TOKEN_DECIMALS;
    mockErc20TokenCapEther = process.env.ROPSTEN_MOCK_ERC20_TOKEN_CAP_ETHER;
  } else if (networkName === "bsc_testnet") {
    isPublicNetwork = true;
    mockErc20TokenName = process.env.BSC_TESTNET_MOCK_ERC20_TOKEN_NAME;
    mockErc20TokenSymbol = process.env.BSC_TESTNET_MOCK_ERC20_TOKEN_SYMBOL;
    mockErc20TokenDecimals = process.env.BSC_TESTNET_MOCK_ERC20_TOKEN_DECIMALS;
    mockErc20TokenCapEther = process.env.BSC_TESTNET_MOCK_ERC20_TOKEN_CAP_ETHER;
  } else if (networkName === "polygon_mumbai") {
    isPublicNetwork = true;
    mockErc20TokenName = process.env.POLYGON_MUMBAI_MOCK_ERC20_TOKEN_NAME;
    mockErc20TokenSymbol = process.env.POLYGON_MUMBAI_MOCK_ERC20_TOKEN_SYMBOL;
    mockErc20TokenDecimals =
      process.env.POLYGON_MUMBAI_MOCK_ERC20_TOKEN_DECIMALS;
    mockErc20TokenCapEther =
      process.env.POLYGON_MUMBAI_MOCK_ERC20_TOKEN_CAP_ETHER;
  } else if (networkName === "localhost") {
    isPublicNetwork = false;
    mockErc20TokenName = process.env.LOCALHOST_MOCK_ERC20_TOKEN_NAME;
    mockErc20TokenSymbol = process.env.LOCALHOST_MOCK_ERC20_TOKEN_SYMBOL;
    mockErc20TokenDecimals = process.env.LOCALHOST_MOCK_ERC20_TOKEN_DECIMALS;
    mockErc20TokenCapEther = process.env.LOCALHOST_MOCK_ERC20_TOKEN_CAP_ETHER;
  } else {
    throw new Error(`Unknown network: ${networkName}`);
  }

  if (isPublicNetwork === undefined) {
    throw new Error("Unknown is public network");
  } else if (mockErc20TokenName === undefined) {
    throw new Error("Unknown mock ERC20 token name");
  } else if (mockErc20TokenSymbol === undefined) {
    throw new Error("Unknown mock ERC20 token symbol");
  } else if (mockErc20TokenDecimals === undefined) {
    throw new Error("Unknown mock ERC20 token decimals");
  } else if (mockErc20TokenCapEther === undefined) {
    throw new Error("Unknown mock ERC20 token cap in ether");
  }

  const MockErc20TokenFactory = await hre.ethers.getContractFactory(
    mockErc20TokenContractName
  );
  const mockErc20TokenArgs = [
    mockErc20TokenName,
    mockErc20TokenSymbol,
    mockErc20TokenDecimals,
    hre.ethers.utils.parseEther(mockErc20TokenCapEther),
  ];
  const mockErc20TokenInstance = await deployHelpers.deployContract(
    MockErc20TokenFactory,
    mockErc20TokenArgs,
    true
  );

  await deployHelpers.isDeployed(mockErc20TokenInstance, isPublicNetwork);

  console.log(
    `${mockErc20TokenContractName}: ${mockErc20TokenInstance.address}`
  );

  // Verify contract source code if deployed to public network
  if (isPublicNetwork) {
    console.log("Verifying Contracts...");

    await deployHelpers.verifyContract(
      networkName,
      mockErc20TokenInstance.address,
      mockErc20TokenInstance.deployTransaction.hash,
      mockErc20TokenArgs
    );
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
