const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");

async function closeStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs
) {
  const expectIsOpenBeforeClose = true;
  const expectIsOpenAfterClose = false;
  const expectIsActive = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpenBeforeClose,
    expectIsActive
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .closeStakingPool(stakingPoolConfig.poolId)
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolClosed")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterClose,
    expectIsActive
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .closeStakingPool(stakingPoolConfig.poolId)
  ).to.be.revertedWith("SPool: closed");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterClose,
    expectIsActive
  );
}

async function createStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs
) {
  const expectIsOpen = true;
  const expectIsActive = true;

  const signerAddress = await signer.getAddress();

  await expect(
    stakingPoolContractInstance.getStakingPoolInfo(stakingPoolConfig.poolId)
  ).to.be.revertedWith("SPool: uninitialized");

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .createStakingPool(
        stakingPoolConfig.poolId,
        stakingPoolConfig.stakeDurationDays,
        stakingPoolConfig.stakeTokenInstance.address,
        stakingPoolConfig.stakeTokenDecimals,
        stakingPoolConfig.rewardTokenInstance.address,
        stakingPoolConfig.rewardTokenDecimals,
        stakingPoolConfig.poolAprWei
      )
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolCreated")
    .withArgs(
      stakingPoolConfig.poolId,
      signerAddress,
      stakingPoolConfig.stakeDurationDays,
      stakingPoolConfig.stakeTokenInstance.address,
      stakingPoolConfig.stakeTokenDecimals,
      stakingPoolConfig.rewardTokenInstance.address,
      stakingPoolConfig.rewardTokenDecimals,
      stakingPoolConfig.poolAprWei
    );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .createStakingPool(
        stakingPoolConfig.poolId,
        stakingPoolConfig.stakeDurationDays,
        stakingPoolConfig.stakeTokenInstance.address,
        stakingPoolConfig.stakeTokenDecimals,
        stakingPoolConfig.rewardTokenInstance.address,
        stakingPoolConfig.rewardTokenDecimals,
        stakingPoolConfig.poolAprWei
      )
  ).to.be.revertedWith("SPool: exists");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive
  );
}

async function initializeStakingPoolTestData(
  rewardTokenInfo,
  stakeTokenInfo,
  stakeRewardTokenInfo,
  governanceRoleAccounts,
  contractAdminRoleAccounts,
  contractAdminMintAmountsWei
) {
  const rewardTokenInstance = await testHelpers.newMockErc20Token(
    rewardTokenInfo.tokenName,
    rewardTokenInfo.tokenSymbol,
    rewardTokenInfo.tokenDecimals,
    rewardTokenInfo.tokenCapWei
  );
  const stakeTokenInstance = await testHelpers.newMockErc20Token(
    stakeTokenInfo.tokenName,
    stakeTokenInfo.tokenSymbol,
    stakeTokenInfo.tokenDecimals,
    stakeTokenInfo.tokenCapWei
  );
  const stakeRewardTokenInstance = await testHelpers.newMockErc20Token(
    stakeRewardTokenInfo.tokenName,
    stakeRewardTokenInfo.tokenSymbol,
    stakeRewardTokenInfo.tokenDecimals,
    stakeRewardTokenInfo.tokenCapWei
  );
  const stakingPoolInstance = await newStakingPool();

  const stakingPoolStakeRewardTokenSameConfigs = [
    {
      poolId: hre.ethers.utils.id("49116098-c835-458b-8890-0f1cbaf51c93"),
      stakeDurationDays: 999,
      stakeTokenInstance: stakeRewardTokenInstance,
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstance,
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("100"),
    },
    {
      poolId: hre.ethers.utils.id("0ade03b3-e6d4-4d15-95d7-3d9d5ba8d963"),
      stakeDurationDays: 365,
      stakeTokenInstance: stakeRewardTokenInstance,
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstance,
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("75"),
    },
    {
      poolId: hre.ethers.utils.id("fc1999e6-e88b-4450-bfae-80d4c6bfd775"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeRewardTokenInstance,
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstance,
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("50"),
    },
    {
      poolId: hre.ethers.utils.id("b6fdcc87-6475-4326-967f-8ce616cd9c23"),
      stakeDurationDays: 88,
      stakeTokenInstance: stakeRewardTokenInstance,
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstance,
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("25"),
    },
    {
      poolId: hre.ethers.utils.id("b2507daa-6117-4da1-a037-5483116c1397"),
      stakeDurationDays: 31,
      stakeTokenInstance: stakeRewardTokenInstance,
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstance,
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("5"),
    },
  ];

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    await rewardTokenInstance.transfer(
      await contractAdminRoleAccounts[i].getAddress(),
      contractAdminMintAmountsWei.rewardToken
    );
    await stakeTokenInstance.transfer(
      await contractAdminRoleAccounts[i].getAddress(),
      contractAdminMintAmountsWei.stakeToken
    );
    await stakeRewardTokenInstance.transfer(
      await contractAdminRoleAccounts[i].getAddress(),
      contractAdminMintAmountsWei.stakeRewardToken
    );
  }

  await testHelpers.grantRole(
    stakingPoolInstance,
    testHelpers.GOVERNANCE_ROLE,
    governanceRoleAccounts.slice(1),
    governanceRoleAccounts[0],
    true
  );

  await testHelpers.grantRole(
    stakingPoolInstance,
    testHelpers.CONTRACT_ADMIN_ROLE,
    contractAdminRoleAccounts,
    governanceRoleAccounts[0],
    true
  );

  return [
    rewardTokenInstance,
    stakeTokenInstance,
    stakeRewardTokenInstance,
    stakingPoolInstance,
    stakingPoolStakeRewardTokenSameConfigs,
  ];
}

async function newStakingPool() {
  const StakingPoolFactory = await hre.ethers.getContractFactory("StakingPool");
  const stakingPoolContractInstance = await StakingPoolFactory.deploy();
  await stakingPoolContractInstance.deployed();

  return stakingPoolContractInstance;
}

async function newStakingService(libUnitConverterAddress, stakingPoolAddress) {
  const StakingServiceFactory = await hre.ethers.getContractFactory(
    "StakingService",
    {
      libraries: {
        UnitConverter: libUnitConverterAddress,
      },
    }
  );
  const stakingServiceContractInstance = await StakingServiceFactory.deploy(
    stakingPoolAddress
  );
  await stakingServiceContractInstance.deployed();

  return stakingServiceContractInstance;
}

async function openStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs
) {
  const expectIsOpenBeforeOpen = false;
  const expectIsOpenAfterOpen = true;
  const expectIsActive = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpenBeforeOpen,
    expectIsActive
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .openStakingPool(stakingPoolConfig.poolId)
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolOpened")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterOpen,
    expectIsActive
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .openStakingPool(stakingPoolConfig.poolId)
  ).to.be.revertedWith("SPool: opened");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterOpen,
    expectIsActive
  );
}

async function resumeStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs
) {
  const expectIsOpen = true;
  const expectIsActiveBeforeResume = false;
  const expectIsActiveAfterResume = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActiveBeforeResume
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .resumeStakingPool(stakingPoolConfig.poolId)
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolResumed")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterResume
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .resumeStakingPool(stakingPoolConfig.poolId)
  ).to.be.revertedWith("SPool: active");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterResume
  );
}

async function suspendStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs
) {
  const expectIsOpen = true;
  const expectIsActiveBeforeSuspend = true;
  const expectIsActiveAfterSuspend = false;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActiveBeforeSuspend
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .suspendStakingPool(stakingPoolConfig.poolId)
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolSuspended")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterSuspend
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .suspendStakingPool(stakingPoolConfig.poolId)
  ).to.be.revertedWith("SPool: suspended");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterSuspend
  );
}

async function testCloseOpenStakingPool(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  signers,
  expectAbleToCloseOpen
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToCloseOpen) {
      await closeStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1)
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .closeStakingPool(stakingPoolConfigs[i].poolId)
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive
      );
    }
  }

  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToCloseOpen) {
      await openStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1)
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .openStakingPool(stakingPoolConfigs[i].poolId)
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive
      );
    }
  }
}

async function testCreateStakingPool(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  signers,
  expectAbleToCreate
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToCreate) {
      await createStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1)
      );
    } else {
      await expect(
        stakingPoolContractInstance.getStakingPoolInfo(
          stakingPoolConfigs[i].poolId
        )
      ).to.be.revertedWith("SPool: uninitialized");

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .createStakingPool(
            stakingPoolConfigs[i].poolId,
            stakingPoolConfigs[i].stakeDurationDays,
            stakingPoolConfigs[i].stakeTokenInstance.address,
            stakingPoolConfigs[i].stakeTokenDecimals,
            stakingPoolConfigs[i].rewardTokenInstance.address,
            stakingPoolConfigs[i].rewardTokenDecimals,
            stakingPoolConfigs[i].poolAprWei
          )
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`
      );

      await expect(
        stakingPoolContractInstance.getStakingPoolInfo(
          stakingPoolConfigs[i].poolId
        )
      ).to.be.revertedWith("SPool: uninitialized");
    }
  }
}

async function testSuspendResumeStakingPool(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  signers,
  expectAbleToSuspendResume
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToSuspendResume) {
      await suspendStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1)
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .suspendStakingPool(stakingPoolConfigs[i].poolId)
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive
      );
    }
  }

  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToSuspendResume) {
      await resumeStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1)
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .resumeStakingPool(stakingPoolConfigs[i].poolId)
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive
      );
    }
  }
}

async function verifyStakingPoolInfo(
  stakingPoolContractInstance,
  stakingPoolConfig,
  expectIsOpen,
  expectIsActive
) {
  const stakingPoolInfo = await stakingPoolContractInstance.getStakingPoolInfo(
    stakingPoolConfig.poolId
  );

  expect(stakingPoolInfo.stakeDurationDays).to.equal(
    stakingPoolConfig.stakeDurationDays
  );
  expect(stakingPoolInfo.stakeTokenAddress).to.equal(
    stakingPoolConfig.stakeTokenInstance.address
  );
  expect(stakingPoolInfo.stakeTokenDecimals).to.equal(
    stakingPoolConfig.stakeTokenDecimals
  );
  expect(stakingPoolInfo.rewardTokenAddress).to.equal(
    stakingPoolConfig.rewardTokenInstance.address
  );
  expect(stakingPoolInfo.rewardTokenDecimals).to.equal(
    stakingPoolConfig.rewardTokenDecimals
  );
  expect(stakingPoolInfo.poolAprWei).to.equal(stakingPoolConfig.poolAprWei);
  expect(stakingPoolInfo.isOpen).to.equal(expectIsOpen);
  expect(stakingPoolInfo.isActive).to.equal(expectIsActive);

  return stakingPoolInfo;
}

async function verifyStakingPoolsInfo(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  expectIsOpen,
  expectIsActive
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    await verifyStakingPoolInfo(
      stakingPoolContractInstance,
      stakingPoolConfigs[i],
      expectIsOpen,
      expectIsActive
    );
  }
}

module.exports = {
  closeStakingPoolWithVerify,
  createStakingPoolWithVerify,
  initializeStakingPoolTestData,
  newStakingPool,
  newStakingService,
  openStakingPoolWithVerify,
  resumeStakingPoolWithVerify,
  suspendStakingPoolWithVerify,
  testCloseOpenStakingPool,
  testCreateStakingPool,
  testSuspendResumeStakingPool,
  verifyStakingPoolInfo,
  verifyStakingPoolsInfo,
};
