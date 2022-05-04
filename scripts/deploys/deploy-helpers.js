const fs = require("fs").promises;
const path = require("path");
const hre = require("hardhat");

const TOKEN_MAX_DECIMALS = 18;

async function deployContract(
  contractFactory,
  constructorArgs,
  logConstructorArgs
) {
  const contractInstance = await contractFactory.deploy(...constructorArgs);

  if (logConstructorArgs) {
    console.log(
      `Constructor arguments for contract at ${contractInstance.address}:`
    );
    constructorArgs.forEach((x) =>
      console.log(
        `  - ${
          x.toString().includes("[object Object]")
            ? JSON.stringify(x)
            : x.toString()
        }`
      )
    );
  }

  return contractInstance;
}

async function deployProxy(
  contractFactory,
  constructorArgs,
  logConstructorArgs
) {
  const contractInstance = await hre.upgrades.deployProxy(
    contractFactory,
    constructorArgs
  );

  if (logConstructorArgs) {
    console.log(
      `Constructor arguments for contract at ${contractInstance.address}:`
    );
    constructorArgs.forEach((x) =>
      console.log(
        `  - ${
          x.toString().includes("[object Object]")
            ? JSON.stringify(x)
            : x.toString()
        }`
      )
    );
  }

  return contractInstance;
}

async function isDeployed(contractInstance, isPublicNetwork) {
  console.log(`Waiting for contract deployment at ${contractInstance.address}`);
  await contractInstance.deployed();

  if (isPublicNetwork) {
    let numberOfConfirmations;

    switch (contractInstance.deployTransaction.chainId) {
      case 56:
        numberOfConfirmations = 20; // 1 min for 3s block time (https://academy.binance.com/en/articles/an-introduction-to-binance-smart-chain-bsc)
        break;
      case 97:
        numberOfConfirmations = 5;
        break;
      case 122:
        numberOfConfirmations = 12; // 1 min for 5s block time (https://developers.fuse.io/fuse-dev-docs/developer-resources-and-tools)
        break;
      case 123:
        numberOfConfirmations = 5;
        break;
      case 137:
        numberOfConfirmations = 30; // 1 min for 2s block time (https://polygonscan.com/chart/blocktime)
        break;
      case 80001:
        numberOfConfirmations = 5;
        break;
      default:
        numberOfConfirmations = 5;
        break;
    }

    console.log(
      `Waiting for ${numberOfConfirmations} confirmations for contract at ${contractInstance.address}`
    );
    await contractInstance.deployTransaction.wait(numberOfConfirmations);
  }

  console.log(`Deployed contract at ${contractInstance.address}`);
}

async function upgradeProxy(proxyAddress, contractFactory) {
  const contractInstance = await hre.upgrades.upgradeProxy(
    proxyAddress,
    contractFactory
  );

  return contractInstance;
}

async function verifyContract(
  networkName,
  contractAddress,
  deployTransactionHash,
  verifyTaskArgs
) {
  let explorer;
  let numberOfConfirmations;
  let verifyTask;

  switch (networkName) {
    case "bsc_mainnet":
      explorer = "BscScan";
      numberOfConfirmations = 20; // 1 min for 3s block time (https://academy.binance.com/en/articles/an-introduction-to-binance-smart-chain-bsc)
      verifyTask = "verify:verify";
      break;
    case "bsc_testnet":
      explorer = "BscScan";
      numberOfConfirmations = 5;
      verifyTask = "verify:verify";
      break;
    case "fuse_mainnet":
      explorer = "Fuse Explorer";
      numberOfConfirmations = 12; // 1 min for 5s block time (https://developers.fuse.io/fuse-dev-docs/developer-resources-and-tools)
      verifyTask = "blockscout-verify";
      break;
    case "fuse_spark":
      explorer = "Fuse Explorer";
      numberOfConfirmations = 5;
      verifyTask = "blockscout-verify";
      break;
    case "polygon_mainnet":
      explorer = "Polygonscan";
      numberOfConfirmations = 30; // 1 min for 2s block time (https://polygonscan.com/chart/blocktime)
      verifyTask = "verify:verify";
      break;
    case "polygon_mumbai":
      explorer = "Polygonscan";
      numberOfConfirmations = 5;
      verifyTask = "verify:verify";
      break;
    default:
      explorer = "Etherscan";
      numberOfConfirmations = 5;
      verifyTask = "verify:verify";
      break;
  }

  try {
    console.log(
      `Verifying the contract ${contractAddress} on ${explorer} after ${numberOfConfirmations} confirmations ...`
    );

    await hre.ethers.provider.waitForTransaction(
      deployTransactionHash,
      numberOfConfirmations,
      1800000
    ); // 30 mins timeout for 300 confirmations in BSC mainnet at 3s block time

    if (verifyTask === "blockscout-verify") {
      const filename = path.basename(verifyTaskArgs);
      const subdir = path.dirname(verifyTaskArgs);

      console.log(`subdir/filename: ${subdir}/${filename}`);
      let projectContractsDirPath;
      let projectFlattenedSourcesDirPath;

      if (subdir === null || subdir.length === 0) {
        projectContractsDirPath = hre.config.paths.sources;
        projectFlattenedSourcesDirPath = path.join(
          hre.config.paths.artifacts,
          "flattenedSources"
        );
      } else {
        projectContractsDirPath = path.join(hre.config.paths.sources, subdir);
        projectFlattenedSourcesDirPath = path.join(
          hre.config.paths.artifacts,
          `flattenedSources/${subdir}`
        );
      }

      const projectContractFilePath = path.join(
        projectContractsDirPath,
        `${filename}.sol`
      );
      const flattenedFileContent = await getFlattenedFileContent([
        projectContractFilePath,
      ]);

      const projectFlattenedSourcesFilename = `${filename}-flattened-${contractAddress}.sol`;
      const projectConstructorArgsFilePath = path.join(
        projectFlattenedSourcesDirPath,
        projectFlattenedSourcesFilename
      );

      await writeFile(
        projectFlattenedSourcesDirPath,
        projectFlattenedSourcesFilename,
        flattenedFileContent
      );

      console.log(
        `Please manually verify ${projectConstructorArgsFilePath} on ${explorer} at address ${contractAddress}`
      );

      /*
      await hre.run(verifyTask, {
        address: contract.address,
        filePath: projectContractFilePath,
      });
      */
    } else {
      console.log(
        `Running ${verifyTask} for address ${contractAddress} with constructor arguments ${verifyTaskArgs}`
      );

      await hre.run(verifyTask, {
        address: contractAddress,
        constructorArguments: verifyTaskArgs,
      });
    }

    return true;
  } catch (err) {
    const REASON_ALREADY_VERIFIED = "Reason: Already Verified";
    const CONTRACT_SOURCE_CODE_ALREADY_VERIFIED =
      "Contract source code already verified";

    if (
      err.toString().includes(REASON_ALREADY_VERIFIED) ||
      err.toString().includes(CONTRACT_SOURCE_CODE_ALREADY_VERIFIED)
    ) {
      console.log(REASON_ALREADY_VERIFIED);
      return true;
    }

    console.error(
      `An error has occurred during verifying on ${explorer}:\n`,
      err
    );

    const network = hre.network.name;

    let verifyCommand;

    if (verifyTask === "blockscout-verify") {
      verifyCommand = "TODO";
    } else {
      if (verifyTaskArgs.toString().includes("[object Object]")) {
        const projectArtifactsDirPath = hre.config.paths.artifacts;
        const projectConstructorArgsDirPath = path.join(
          projectArtifactsDirPath,
          "constructorArgs"
        );
        const projectConstructorArgsFilename = `${contractAddress}.js`;
        const projectConstructorArgsFilePath = path.join(
          projectConstructorArgsDirPath,
          projectConstructorArgsFilename
        );

        await writeFile(
          projectConstructorArgsDirPath,
          projectConstructorArgsFilename,
          `module.exports = ${JSON.stringify(verifyTaskArgs, null, 4)};`
        );

        verifyCommand = `npx hardhat verify --network ${network} --constructor-args ${projectConstructorArgsFilePath} ${contractAddress}`;
      } else {
        const quotedConstructorArgs = verifyTaskArgs.map(
          (x) => `"${x.toString().replace(/"/g, '\\"')}"`
        );
        verifyCommand = `npx hardhat verify --network ${network} ${contractAddress} ${quotedConstructorArgs.join(
          " "
        )}`;
      }
    }

    console.log(
      [
        `Failed to verify on ${explorer}, please run the following command to verify manually:`,
        "--------------------",
        verifyCommand,
        "--------------------",
      ].join("\n")
    );

    return false;
  }
}

function scaleWeiToDecimals(weiAmount, decimals) {
  if (weiAmount.lte(0)) {
    throw new Error(`Invalid wei amount: ${weiAmount}`);
  }

  if (decimals < 0 || decimals > TOKEN_MAX_DECIMALS) {
    throw new Error(`Invalid decimals: ${decimals}`);
  }

  let decimalsAmount;

  if (decimals < TOKEN_MAX_DECIMALS) {
    const decimalsDiff = TOKEN_MAX_DECIMALS - decimals;
    const scale = hre.ethers.utils.parseEther("10").pow(decimalsDiff);
    decimalsAmount = weiAmount.div(scale);
  } else {
    decimalsAmount = weiAmount;
  }

  return decimalsAmount;
}

async function getFlattenedFileContent(filenames) {
  const flattenedSources = await hre.run("flatten:get-flattened-sources", {
    files: filenames,
  });

  let count = 0;
  const flattenedFileContent = flattenedSources.replace(
    /\/\/ SPDX-License-Identifier: [A-Za-z0-9.-]+/gi,
    (x) => {
      if (count === 0) {
        count++;
        return x;
      } else {
        count++;
        return "";
      }
    }
  );

  return flattenedFileContent;
}

async function writeFile(dirAbsPath, filename, fileContent) {
  const fileAbsPath = path.join(dirAbsPath, filename);

  try {
    await fs.mkdir(dirAbsPath);
  } catch (err) {
    if (err.errno === -17 && err.code === "EEXIST") {
      console.log(`${dirAbsPath} exists`);
    } else {
      console.error(`Error while creating directory ${dirAbsPath}:\n`, err);
    }
  }

  await fs.writeFile(fileAbsPath, fileContent, "utf8");
}

module.exports = {
  deployContract,
  deployProxy,
  isDeployed,
  scaleWeiToDecimals,
  upgradeProxy,
  verifyContract,
};
