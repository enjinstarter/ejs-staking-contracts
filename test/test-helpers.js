const { expect } = require("chai");
const hre = require("hardhat");

const BN_DAYS_IN_YEAR = hre.ethers.BigNumber.from("365");
const BN_PERCENT_100_WEI = hre.ethers.utils.parseEther("100");
const BN_SECONDS_IN_DAYS = hre.ethers.BigNumber.from("86400");
const CONTRACT_ADMIN_ROLE = hre.ethers.utils.id("CONTRACT_ADMIN_ROLE");
const DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
const GOVERNANCE_ROLE = hre.ethers.utils.id("GOVERNANCE_ROLE");
const SECONDS_IN_DAY = 86400;
const TOKEN_MAX_DECIMALS = 18;

function bnAbsDiff(bn1, bn2) {
  return bn1.gt(bn2) ? bn1.sub(bn2) : bn2.sub(bn1);
}

function bnAbsDiffLte(bn1, bn2, bnMaxDiff) {
  const absDiff = bnAbsDiff(bn1, bn2);
  return absDiff.lte(bnMaxDiff);
}

function bnNeg(bn) {
  return ethers.constants.Zero.sub(bn);
}

async function approveTransferWithVerify(
  tokenContractInstance,
  fromSigner,
  toAddress,
  amountWei,
) {
  const fromAddress = await fromSigner.getAddress();
  const tokenDecimals = await tokenContractInstance.decimals();
  const amountDecimals = scaleWeiToDecimals(amountWei, tokenDecimals);

  await expect(
    tokenContractInstance
      .connect(fromSigner)
      .approve(toAddress, amountDecimals),
  )
    .to.emit(tokenContractInstance, "Approval")
    .withArgs(fromAddress, toAddress, amountDecimals);

  const allowance = await tokenContractInstance.allowance(
    fromAddress,
    toAddress,
  );
  expect(allowance).to.equal(amountDecimals);
}

async function getBlockTimestamp(blockHashOrBlockNumber) {
  const block = await hre.ethers.provider.getBlock(blockHashOrBlockNumber);
  return block.timestamp;
}

async function getCurrentBlockTimestamp() {
  const currentBlockNumber = await hre.ethers.provider.getBlockNumber();
  return await getBlockTimestamp(currentBlockNumber);
}

async function getValueOrDefault(value, defaultAsyncFn) {
  if (value !== undefined) {
    return value;
  } else {
    return await defaultAsyncFn();
  }
}

async function grantRole(
  contractInstance,
  role,
  signers,
  expectMsgSender,
  expectAbleToGrantRole,
) {
  const expectMsgSenderAddress = await expectMsgSender.getAddress();

  for (let i = 0; i < signers.length; i++) {
    if (expectAbleToGrantRole) {
      await expect(
        contractInstance
          .connect(expectMsgSender)
          .grantRole(role, await signers[i].getAddress()),
      )
        .to.emit(contractInstance, "RoleGranted")
        .withArgs(role, await signers[i].getAddress(), expectMsgSenderAddress);
    } else {
      await expect(
        contractInstance
          .connect(expectMsgSender)
          .grantRole(role, await signers[i].getAddress()),
      ).to.be.revertedWith(
        `AccessControl: account ${expectMsgSenderAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
      );
    }
  }
}

async function mineBlockAtTime(blockTimestamp) {
  await hre.run("setTime", {
    time: blockTimestamp,
  });
}

async function newLibrary(libname) {
  const LibraryFactory = await hre.ethers.getContractFactory(libname);
  const libraryInstance = await LibraryFactory.deploy();
  await libraryInstance.deployed();

  return libraryInstance;
}

async function newMockErc20Token(
  tokenName,
  tokenSymbol,
  tokenDecimals,
  tokenCapDecimals,
) {
  const defaults = {
    tokenName: "MockErc20Token",
    tokenSymbol: "MERC20",
    tokenDecimals: hre.ethers.BigNumber.from("18"),
    tokenCap: hre.ethers.utils.parseEther("10000000000"),
  };

  const tokenNameValue = await getValueOrDefault(
    tokenName,
    () => defaults.tokenName,
  );
  const tokenSymbolValue = await getValueOrDefault(
    tokenSymbol,
    () => defaults.tokenSymbol,
  );
  const tokenDecimalsValue = await getValueOrDefault(
    tokenDecimals,
    () => defaults.tokenDecimals,
  );
  const tokenCapDecimalsValue = await getValueOrDefault(
    tokenCapDecimals,
    () => defaults.tokenCap,
  );

  const MockErc20TokenFactory =
    await hre.ethers.getContractFactory("MockErc20Token");
  const mockErc20TokenInstance = await MockErc20TokenFactory.deploy(
    tokenNameValue,
    tokenSymbolValue,
    tokenDecimalsValue,
    tokenCapDecimalsValue,
  );
  await mockErc20TokenInstance.deployed();

  return mockErc20TokenInstance;
}

async function newMockErc20TokenWithDeposit(
  tokenName,
  tokenSymbol,
  tokenDecimals,
  tokenCapWei,
  fromAccount,
  depositAddresses,
  depositsWei,
) {
  const tokenInstance = await newMockErc20Token(
    tokenName,
    tokenSymbol,
    tokenDecimals,
    scaleWeiToDecimals(tokenCapWei, tokenDecimals),
  );

  for (let i = 0; i < depositAddresses.length; i++) {
    if (depositsWei[i].gt(ethers.constants.Zero)) {
      const depositDecimals = scaleWeiToDecimals(depositsWei[i], tokenDecimals);

      const transferTransactionResponse = await tokenInstance
        .connect(fromAccount)
        .transfer(depositAddresses[i], depositDecimals);

      const transferTransactionReceipt =
        await transferTransactionResponse.wait();
    }
  }

  return tokenInstance;
}

async function newMockTransferErc20() {
  const contractFactory =
    await hre.ethers.getContractFactory("MockTransferErc20");
  const contractInstance = await contractFactory.deploy();
  await contractInstance.deployed();

  return contractInstance;
}

async function newMockUnitConverter() {
  const MockUnitConverterFactory =
    await hre.ethers.getContractFactory("MockUnitConverter");
  const mockUnitConverterInstance = await MockUnitConverterFactory.deploy();
  await mockUnitConverterInstance.deployed();

  return mockUnitConverterInstance;
}

async function revokeRole(
  contractInstance,
  role,
  signers,
  expectMsgSender,
  expectAbleToGrantRole,
) {
  const expectMsgSenderAddress = await expectMsgSender.getAddress();

  for (let i = 0; i < signers.length; i++) {
    if (expectAbleToGrantRole) {
      await expect(
        contractInstance
          .connect(expectMsgSender)
          .revokeRole(role, await signers[i].getAddress()),
      )
        .to.emit(contractInstance, "RoleRevoked")
        .withArgs(role, await signers[i].getAddress(), expectMsgSenderAddress);
    } else {
      await expect(
        contractInstance
          .connect(expectMsgSender)
          .revokeRole(role, await signers[i].getAddress()),
      ).to.be.revertedWith(
        `AccessControl: account ${expectMsgSenderAddress.toLowerCase()} is missing role ${DEFAULT_ADMIN_ROLE}`,
      );
    }
  }
}

function scaleDecimalsToWei(decimalsAmount, decimals) {
  const decimalsDiff = TOKEN_MAX_DECIMALS - decimals;
  return hre.ethers.BigNumber.from(decimalsAmount).mul(
    hre.ethers.BigNumber.from("10").pow(
      hre.ethers.BigNumber.from(decimalsDiff),
    ),
  );
}

function scaleWeiToDecimals(weiAmount, decimals) {
  const decimalsDiff = TOKEN_MAX_DECIMALS - decimals;
  return hre.ethers.BigNumber.from(weiAmount).div(
    hre.ethers.BigNumber.from("10").pow(
      hre.ethers.BigNumber.from(decimalsDiff),
    ),
  );
}

async function setTimeNextBlock(nextBlockTimestamp) {
  await hre.run("setTimeNextBlock", {
    time: nextBlockTimestamp,
  });
}

async function testGrantRevokeRoles(
  contractInstance,
  governanceRoleAccounts,
  contractAdminRoleAccounts,
  enduserAccounts,
  accountsWithRole,
) {
  await verifyRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    governanceRoleAccounts.slice(0, 1),
    true,
  );
  await verifyRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    governanceRoleAccounts.slice(1),
    false,
  );
  await verifyRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    contractAdminRoleAccounts,
    false,
  );
  await verifyRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    enduserAccounts,
    false,
  );

  await verifyRole(
    contractInstance,
    GOVERNANCE_ROLE,
    governanceRoleAccounts,
    true,
  );
  await verifyRole(
    contractInstance,
    GOVERNANCE_ROLE,
    contractAdminRoleAccounts,
    false,
  );
  await verifyRole(contractInstance, GOVERNANCE_ROLE, enduserAccounts, false);

  await verifyRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    contractAdminRoleAccounts,
    true,
  );
  await verifyRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    governanceRoleAccounts.slice(0, 1),
    true,
  );
  await verifyRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    governanceRoleAccounts.slice(1),
    false,
  );
  await verifyRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    enduserAccounts,
    false,
  );

  const nonDefaultAdminRoleAccounts = accountsWithRole.slice(5, 6);
  const nonGovernanceRoleAccounts = accountsWithRole.slice(6, 8);
  const nonContractAdminRoleAccounts = accountsWithRole.slice(8, 10);

  await grantRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    nonDefaultAdminRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );
  await verifyRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    nonDefaultAdminRoleAccounts,
    true,
  );

  await revokeRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    nonDefaultAdminRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );
  await verifyRole(
    contractInstance,
    DEFAULT_ADMIN_ROLE,
    nonDefaultAdminRoleAccounts,
    false,
  );

  await grantRole(
    contractInstance,
    GOVERNANCE_ROLE,
    nonGovernanceRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );
  await verifyRole(
    contractInstance,
    GOVERNANCE_ROLE,
    nonGovernanceRoleAccounts,
    true,
  );

  await revokeRole(
    contractInstance,
    GOVERNANCE_ROLE,
    nonGovernanceRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );
  await verifyRole(
    contractInstance,
    GOVERNANCE_ROLE,
    nonGovernanceRoleAccounts,
    false,
  );

  await grantRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    nonContractAdminRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );
  await verifyRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    nonContractAdminRoleAccounts,
    true,
  );

  await revokeRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    nonContractAdminRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );
  await verifyRole(
    contractInstance,
    CONTRACT_ADMIN_ROLE,
    nonContractAdminRoleAccounts,
    false,
  );

  for (let i = 1; i < governanceRoleAccounts.length; i++) {
    await grantRole(
      contractInstance,
      DEFAULT_ADMIN_ROLE,
      nonGovernanceRoleAccounts,
      governanceRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await grantRole(
      contractInstance,
      DEFAULT_ADMIN_ROLE,
      nonGovernanceRoleAccounts,
      contractAdminRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < enduserAccounts.length; i++) {
    await grantRole(
      contractInstance,
      DEFAULT_ADMIN_ROLE,
      nonGovernanceRoleAccounts,
      enduserAccounts[i],
      false,
    );
  }

  for (let i = 1; i < governanceRoleAccounts.length; i++) {
    await grantRole(
      contractInstance,
      GOVERNANCE_ROLE,
      nonGovernanceRoleAccounts,
      governanceRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await grantRole(
      contractInstance,
      GOVERNANCE_ROLE,
      nonGovernanceRoleAccounts,
      contractAdminRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < enduserAccounts.length; i++) {
    await grantRole(
      contractInstance,
      GOVERNANCE_ROLE,
      nonGovernanceRoleAccounts,
      enduserAccounts[i],
      false,
    );
  }

  for (let i = 1; i < governanceRoleAccounts.length; i++) {
    await grantRole(
      contractInstance,
      CONTRACT_ADMIN_ROLE,
      nonContractAdminRoleAccounts,
      governanceRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await grantRole(
      contractInstance,
      CONTRACT_ADMIN_ROLE,
      nonContractAdminRoleAccounts,
      contractAdminRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < enduserAccounts.length; i++) {
    await grantRole(
      contractInstance,
      CONTRACT_ADMIN_ROLE,
      nonContractAdminRoleAccounts,
      enduserAccounts[i],
      false,
    );
  }

  for (let i = 1; i < governanceRoleAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      DEFAULT_ADMIN_ROLE,
      nonGovernanceRoleAccounts,
      governanceRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      DEFAULT_ADMIN_ROLE,
      nonGovernanceRoleAccounts,
      contractAdminRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < enduserAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      DEFAULT_ADMIN_ROLE,
      nonGovernanceRoleAccounts,
      enduserAccounts[i],
      false,
    );
  }

  for (let i = 1; i < governanceRoleAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      GOVERNANCE_ROLE,
      nonGovernanceRoleAccounts,
      governanceRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      GOVERNANCE_ROLE,
      nonGovernanceRoleAccounts,
      contractAdminRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < enduserAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      GOVERNANCE_ROLE,
      nonGovernanceRoleAccounts,
      enduserAccounts[i],
      false,
    );
  }

  for (let i = 1; i < governanceRoleAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      CONTRACT_ADMIN_ROLE,
      nonContractAdminRoleAccounts,
      governanceRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      CONTRACT_ADMIN_ROLE,
      nonContractAdminRoleAccounts,
      contractAdminRoleAccounts[i],
      false,
    );
  }

  for (let i = 0; i < enduserAccounts.length; i++) {
    await revokeRole(
      contractInstance,
      CONTRACT_ADMIN_ROLE,
      nonContractAdminRoleAccounts,
      enduserAccounts[i],
      false,
    );
  }
}

async function testPauseUnpauseContract(
  contractInstance,
  signers,
  expectAbleToPauseUnpause,
) {
  const expectPausedBeforePause = false;
  const expectPausedAfterPause = true;
  const expectPausedAfterUnpause = false;

  const pausedBeforePause = await contractInstance.paused();
  expect(pausedBeforePause).to.equal(expectPausedBeforePause);

  for (let i = 0; i < signers.length; i++) {
    const signerAddress = await signers[i].getAddress();

    if (expectAbleToPauseUnpause) {
      await expect(contractInstance.connect(signers[i]).pauseContract())
        .to.emit(contractInstance, "Paused")
        .withArgs(signerAddress);

      const pausedAfterPause = await contractInstance.paused();
      expect(pausedAfterPause).to.equal(expectPausedAfterPause);

      await expect(
        contractInstance.connect(signers[i]).pauseContract(),
      ).to.be.revertedWith("Pausable: paused");

      const pausedAfterPauseAgain = await contractInstance.paused();
      expect(pausedAfterPauseAgain).to.equal(expectPausedAfterPause);

      await expect(contractInstance.connect(signers[i]).unpauseContract())
        .to.emit(contractInstance, "Unpaused")
        .withArgs(signerAddress);

      const pausedAfterUnpause = await contractInstance.paused();
      expect(pausedAfterUnpause).to.equal(expectPausedAfterUnpause);

      await expect(
        contractInstance.connect(signers[i]).unpauseContract(),
      ).to.be.revertedWith("Pausable: not paused");

      const pausedAfterUnpauseAgain = await contractInstance.paused();
      expect(pausedAfterUnpauseAgain).to.equal(expectPausedAfterUnpause);
    } else {
      await expect(
        contractInstance.connect(signers[i]).pauseContract(),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${GOVERNANCE_ROLE}`,
      );

      const pausedAfterPauseFail = await contractInstance.paused();
      expect(pausedAfterPauseFail).to.equal(expectPausedBeforePause);

      await expect(
        contractInstance.connect(signers[i]).unpauseContract(),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${GOVERNANCE_ROLE}`,
      );

      const pausedAfterUnpauseFail = await contractInstance.paused();
      expect(pausedAfterUnpauseFail).to.equal(expectPausedBeforePause);
    }
  }
}

async function testSetAdminWallet(
  contractInstance,
  signers,
  expectAdminWalletBeforeSet,
  expectAdminWalletAfterSet,
  expectAbleToSetAdminWallet,
) {
  const adminWalletBeforeSet = await contractInstance.adminWallet();
  expect(adminWalletBeforeSet).to.equal(expectAdminWalletBeforeSet);

  for (let i = 0; i < signers.length; i++) {
    const signerAddress = await signers[i].getAddress();

    if (expectAbleToSetAdminWallet) {
      await expect(
        contractInstance
          .connect(signers[i])
          .setAdminWallet(expectAdminWalletAfterSet),
      )
        .to.emit(contractInstance, "AdminWalletChanged")
        .withArgs(
          expectAdminWalletBeforeSet,
          expectAdminWalletAfterSet,
          signerAddress,
        );

      const adminWalletAfterSet = await contractInstance.adminWallet();
      expect(adminWalletAfterSet).to.equal(expectAdminWalletAfterSet);

      await expect(
        contractInstance
          .connect(signers[i])
          .setAdminWallet(expectAdminWalletBeforeSet),
      )
        .to.emit(contractInstance, "AdminWalletChanged")
        .withArgs(
          expectAdminWalletAfterSet,
          expectAdminWalletBeforeSet,
          signerAddress,
        );

      const adminWalletAfterRestore = await contractInstance.adminWallet();
      expect(adminWalletAfterRestore).to.equal(expectAdminWalletBeforeSet);
    } else {
      await expect(
        contractInstance
          .connect(signers[i])
          .setAdminWallet(expectAdminWalletAfterSet),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${GOVERNANCE_ROLE}`,
      );

      const adminWalletAfterSetFail = await contractInstance.adminWallet();
      expect(adminWalletAfterSetFail).to.equal(expectAdminWalletBeforeSet);
    }
  }
}

async function transferAndApproveWithVerify(
  tokenContractInstance,
  bankSigner,
  fromSigner,
  toAddress,
  amountWei,
) {
  const bankAddress = await bankSigner.getAddress();
  const fromAddress = await fromSigner.getAddress();
  const tokenDecimals = await tokenContractInstance.decimals();
  const amountDecimals = scaleWeiToDecimals(amountWei, tokenDecimals);

  await expect(
    tokenContractInstance
      .connect(bankSigner)
      .transfer(fromAddress, amountDecimals),
  )
    .to.emit(tokenContractInstance, "Transfer")
    .withArgs(bankAddress, fromAddress, amountDecimals);

  const balanceOf = await tokenContractInstance.balanceOf(fromAddress);
  expect(balanceOf).to.equal(amountDecimals);

  await approveTransferWithVerify(
    tokenContractInstance,
    fromSigner,
    toAddress,
    scaleDecimalsToWei(amountDecimals, tokenDecimals),
  );
}

async function verifyRole(contractInstance, role, signers, expectHasRole) {
  for (let i = 0; i < signers.length; i++) {
    const hasRole = await contractInstance.hasRole(
      role,
      await signers[i].getAddress(),
    );
    expect(hasRole).to.equal(expectHasRole);
  }
}

module.exports = {
  BN_DAYS_IN_YEAR,
  BN_PERCENT_100_WEI,
  BN_SECONDS_IN_DAYS,
  CONTRACT_ADMIN_ROLE,
  DEFAULT_ADMIN_ROLE,
  GOVERNANCE_ROLE,
  SECONDS_IN_DAY,
  TOKEN_MAX_DECIMALS,
  bnAbsDiff,
  bnAbsDiffLte,
  bnNeg,
  approveTransferWithVerify,
  getBlockTimestamp,
  getCurrentBlockTimestamp,
  getValueOrDefault,
  grantRole,
  mineBlockAtTime,
  newLibrary,
  newMockErc20Token,
  newMockErc20TokenWithDeposit,
  newMockTransferErc20,
  newMockUnitConverter,
  revokeRole,
  scaleDecimalsToWei,
  scaleWeiToDecimals,
  setTimeNextBlock,
  testGrantRevokeRoles,
  testPauseUnpauseContract,
  testSetAdminWallet,
  transferAndApproveWithVerify,
  verifyRole,
};
