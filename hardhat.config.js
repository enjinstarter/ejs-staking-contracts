const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");

dotenvExpand.expand(dotenv.config());

require("@enjinstarter/hardhat-oklink-verify");
require("@nomicfoundation/hardhat-chai-matchers");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-ethers");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("solidity-coverage");

const SOLIDITY_VERSION = "0.8.19";
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
    timeout: 900000,
  },
  networks: {
    hardhat: {
      accounts: { count: 210 },
    },
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      chainId: 11155111,
      accounts:
        process.env.SEPOLIA_PRIVATE_KEY !== undefined
          ? [process.env.SEPOLIA_PRIVATE_KEY]
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
    polygon_amoy: {
      url: process.env.POLYGON_AMOY_URL || "",
      chainId: 80002,
      accounts:
        process.env.POLYGON_AMOY_PRIVATE_KEY !== undefined
          ? [process.env.POLYGON_AMOY_PRIVATE_KEY]
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
    okc_testnet: {
      chainId: 65,
      url: process.env.OKC_TESTNET_URL || "",
      accounts:
        process.env.OKC_TESTNET_PRIVATE_KEY !== undefined
          ? [`0x${process.env.OKC_TESTNET_PRIVATE_KEY}`]
          : [],
      gasMultiplier: 2, // For testnet only
    },
    okc_mainnet: {
      chainId: 66,
      url: process.env.OKC_MAINNET_URL || "",
      accounts:
        process.env.OKC_MAINNET_PRIVATE_KEY !== undefined
          ? [`0x${process.env.OKC_MAINNET_PRIVATE_KEY}`]
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
      sepolia: process.env.SEPOLIA_ETHERSCAN_API_KEY || "",
      // binance smart chain
      bsc: process.env.BSC_MAINNET_BSCSCAN_API_KEY || "",
      bscTestnet: process.env.BSC_TESTNET_BSCSCAN_API_KEY || "",
      // polygon
      polygon: process.env.POLYGON_MAINNET_POLYGONSCAN_API_KEY || "",
      polygonAmoy: process.env.POLYGON_AMOY_POLYGONSCAN_API_KEY || "",
    },
  },
  oklink: {
    apiKey: {
      // okc
      okc: process.env.OKC_MAINNET_OKLINK_API_KEY || "",
      okcTestnet: process.env.OKC_TESTNET_OKLINK_API_KEY || "",
    },
  },
};
