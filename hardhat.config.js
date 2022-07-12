const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

dotenvExpand.expand(dotenv.config());

require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-chai-matchers");
require("@atixlabs/hardhat-time-n-mine");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");

const SOLIDITY_VERSION = "0.8.15";
const SOLIDITY_OPTIMIZER_RUNS = 200;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: SOLIDITY_VERSION,
    settings: {
      optimizer: {
        enabled: true,
        runs: SOLIDITY_OPTIMIZER_RUNS,
      },
    },
  },
  mocha: {
    timeout: 300000,
  },
  networks: {
    hardhat: {
      accounts: { count: 210 },
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      chainId: 5,
      accounts:
        process.env.GOERLI_PRIVATE_KEY !== undefined
          ? [process.env.GOERLI_PRIVATE_KEY]
          : [],
    },
    ropsten: {
      url: process.env.ROPSTEN_URL || "",
      chainId: 3,
      accounts:
        process.env.ROPSTEN_PRIVATE_KEY !== undefined
          ? [process.env.ROPSTEN_PRIVATE_KEY]
          : [],
    },
    mainnet: {
      url: process.env.MAINNET_URL || "",
      chainId: 1,
      accounts:
        process.env.MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.MAINNET_PRIVATE_KEY]
          : [],
    },
    bsc_testnet: {
      url: process.env.BSC_TESTNET_URL || "",
      chainId: 97,
      accounts:
        process.env.BSC_TESTNET_PRIVATE_KEY !== undefined
          ? [process.env.BSC_TESTNET_PRIVATE_KEY]
          : [],
      gasMultiplier: 2,
    },
    bsc_mainnet: {
      url: process.env.BSC_MAINNET_URL || "",
      chainId: 56,
      accounts:
        process.env.BSC_MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.BSC_MAINNET_PRIVATE_KEY]
          : [],
      gasMultiplier: 1.02,
    },
    polygon_mumbai: {
      url: process.env.POLYGON_MUMBAI_URL || "",
      chainId: 80001,
      accounts:
        process.env.POLYGON_MUMBAI_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_MUMBAI_PRIVATE_KEY]
          : [],
      gasMultiplier: 2,
    },
    polygon_mainnet: {
      url: process.env.POLYGON_MAINNET_URL || "",
      chainId: 137,
      accounts:
        process.env.POLYGON_MAINNET_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_MAINNET_PRIVATE_KEY]
          : [],
      gasMultiplier: 1.02,
    },
  },
  contractSizer: {
    alphaSort: false,
    disambiguatePaths: false,
    runOnCompile: false,
    strict: false,
  },
  gasReporter: {
    enabled:
      process.env.REPORT_GAS !== undefined &&
      process.env.REPORT_GAS.toLowerCase() === "true",
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY || "",
    noColors: true,
    outputFile: "gas-reporter-output.txt",
  },
  etherscan: {
    apiKey: {
      // ethereum
      mainnet: process.env.MAINNET_ETHERSCAN_API_KEY || "",
      goerli: process.env.GOERLI_ETHERSCAN_API_KEY || "",
      ropsten: process.env.ROPSTEN_ETHERSCAN_API_KEY || "",
      // binance smart chain
      bsc: process.env.BSC_MAINNET_BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSC_TESTNET_BSCSCAN_API_KEY || "",
      // polygon
      polygon: process.env.POLYGON_MAINNET_POLYGONSCAN_API_KEY || "",
      polygonMumbai: process.env.POLYGON_MUMBAI_POLYGONSCAN_API_KEY || "",
    },
  },
};
