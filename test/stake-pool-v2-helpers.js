const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");

async function closeStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs,
) {
  const expectIsOpenBeforeClose = true;
  const expectIsOpenAfterClose = false;
  const expectIsActive = true;
  const expectIsInitialized = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpenBeforeClose,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .closeStakingPool(stakingPoolConfig.poolId),
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolClosed")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterClose,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .closeStakingPool(stakingPoolConfig.poolId),
  ).to.be.revertedWith("SPool2: closed");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterClose,
    expectIsActive,
    expectIsInitialized,
  );
}

async function createStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs,
) {
  const expectIsOpen = true;
  const expectIsActive = true;
  const expectIsInitialized = true;

  const signerAddress = await signer.getAddress();

  await expect(
    stakingPoolContractInstance.getStakingPoolInfo(stakingPoolConfig.poolId),
  ).to.be.revertedWith("SPool2: uninitialized");

  /*
  console.log(
    `stakeTokenDecimals=${stakingPoolConfig.stakeTokenDecimals}, rewardTokenDecimals=${stakingPoolConfig.rewardTokenDecimals}, poolAprWei=${stakingPoolConfig.poolAprWei}`,
  );
  */

  const stakingPoolDto = {
    stakeDurationDays: stakingPoolConfig.stakeDurationDays,
    stakeTokenAddress: stakingPoolConfig.stakeTokenInstance.address,
    stakeTokenDecimals: stakingPoolConfig.stakeTokenDecimals,
    rewardTokenAddress: stakingPoolConfig.rewardTokenInstance.address,
    rewardTokenDecimals: stakingPoolConfig.rewardTokenDecimals,
    poolAprWei: stakingPoolConfig.poolAprWei,
    earlyUnstakeCooldownPeriodDays:
      stakingPoolConfig.earlyUnstakeCooldownPeriodDays,
    earlyUnstakePenaltyPercentWei:
      stakingPoolConfig.earlyUnstakePenaltyPercentWei,
    revshareStakeDurationExtensionDays:
      stakingPoolConfig.revshareStakeDurationExtensionDays,
  };

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .createStakingPool(stakingPoolConfig.poolId, stakingPoolDto),
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
      stakingPoolConfig.poolAprWei,
      stakingPoolConfig.earlyUnstakeCooldownPeriodDays,
      stakingPoolConfig.earlyUnstakePenaltyPercentWei,
      stakingPoolConfig.revshareStakeDurationExtensionDays,
    );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .createStakingPool(stakingPoolConfig.poolId, stakingPoolDto),
  ).to.be.revertedWith("SPool2: exists");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );
}

async function initializeStakingPoolTestData(
  rewardTokensInfo,
  stakeTokensInfo,
  stakeRewardTokensInfo,
  governanceRoleAccounts,
  contractAdminRoleAccounts,
  contractAdminMintAmountsWei,
) {
  const stakingPoolsRewardBalanceOf = {};

  const rewardTokenInstances = [];
  for (let i = 0; i < rewardTokensInfo.length; i++) {
    const rewardTokenInstance = await testHelpers.newMockErc20Token(
      rewardTokensInfo[i].tokenName,
      rewardTokensInfo[i].tokenSymbol,
      rewardTokensInfo[i].tokenDecimals,
      rewardTokensInfo[i].tokenCapWei,
    );
    rewardTokenInstances.push(rewardTokenInstance);
    stakingPoolsRewardBalanceOf[rewardTokenInstance.address] =
      hre.ethers.constants.Zero;
  }

  const stakeTokenInstances = [];
  for (let i = 0; i < stakeTokensInfo.length; i++) {
    const stakeTokenInstance = await testHelpers.newMockErc20Token(
      stakeTokensInfo[i].tokenName,
      stakeTokensInfo[i].tokenSymbol,
      stakeTokensInfo[i].tokenDecimals,
      stakeTokensInfo[i].tokenCapWei,
    );
    stakeTokenInstances.push(stakeTokenInstance);
    stakingPoolsRewardBalanceOf[stakeTokenInstance.address] =
      hre.ethers.constants.Zero;
  }

  const stakeRewardTokenInstances = [];
  for (let i = 0; i < stakeRewardTokensInfo.length; i++) {
    const stakeRewardTokenInstance = await testHelpers.newMockErc20Token(
      stakeRewardTokensInfo[i].tokenName,
      stakeRewardTokensInfo[i].tokenSymbol,
      stakeRewardTokensInfo[i].tokenDecimals,
      stakeRewardTokensInfo[i].tokenCapWei,
    );
    stakeRewardTokenInstances.push(stakeRewardTokenInstance);
    stakingPoolsRewardBalanceOf[stakeRewardTokenInstance.address] =
      hre.ethers.constants.Zero;
  }

  const stakingPoolInstance = await newStakingPool();

  const stakingPoolStakeRewardTokenSameConfigs = [
    {
      poolUuid: "49116098-c835-458b-8890-0f1cbaf51c93",
      poolId: hre.ethers.utils.id("49116098-c835-458b-8890-0f1cbaf51c93"),
      stakeDurationDays: 999,
      stakeTokenInstance: stakeRewardTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("100"),
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.constants.Zero,
      revshareStakeDurationExtensionDays: 0,
    },
    {
      poolUuid: "0ade03b3-e6d4-4d15-95d7-3d9d5ba8d963",
      poolId: hre.ethers.utils.id("0ade03b3-e6d4-4d15-95d7-3d9d5ba8d963"),
      stakeDurationDays: 365,
      stakeTokenInstance: stakeRewardTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("75"),
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays: 0,
    },
    {
      poolUuid: "fc1999e6-e88b-4450-bfae-80d4c6bfd775",
      poolId: hre.ethers.utils.id("fc1999e6-e88b-4450-bfae-80d4c6bfd775"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeRewardTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("50"),
      earlyUnstakeCooldownPeriodDays: 5,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("10"),
      revshareStakeDurationExtensionDays: 7,
    },
    {
      poolUuid: "b6fdcc87-6475-4326-967f-8ce616cd9c23",
      poolId: hre.ethers.utils.id("b6fdcc87-6475-4326-967f-8ce616cd9c23"),
      stakeDurationDays: 88,
      stakeTokenInstance: stakeRewardTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("25"),
      earlyUnstakeCooldownPeriodDays: 12,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("9"),
      revshareStakeDurationExtensionDays: 3,
    },
    {
      poolUuid: "b2507daa-6117-4da1-a037-5483116c1397",
      poolId: hre.ethers.utils.id("b2507daa-6117-4da1-a037-5483116c1397"),
      stakeDurationDays: 31,
      stakeTokenInstance: stakeRewardTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("5"),
      earlyUnstakeCooldownPeriodDays: 13,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("13"),
      revshareStakeDurationExtensionDays: 13,
    },
    {
      poolUuid: "81bfecad-21aa-4253-8f3c-8e2a5a5a7908",
      poolId: hre.ethers.utils.id("81bfecad-21aa-4253-8f3c-8e2a5a5a7908"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeRewardTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: stakeRewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.constants.Zero,
      earlyUnstakeCooldownPeriodDays: 19,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("25"),
      revshareStakeDurationExtensionDays: 1,
    },
    {
      poolUuid: "c30dbc87-308a-41d9-b1d1-157559a02fe0",
      poolId: hre.ethers.utils.id("c30dbc87-308a-41d9-b1d1-157559a02fe0"),
      stakeDurationDays: 999,
      stakeTokenInstance: stakeRewardTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: stakeRewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("100"),
      earlyUnstakeCooldownPeriodDays: 1,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("18"),
      revshareStakeDurationExtensionDays: 6,
    },
    {
      poolUuid: "79f0bc0b-5059-424a-9567-c7fb9410b279",
      poolId: hre.ethers.utils.id("79f0bc0b-5059-424a-9567-c7fb9410b279"),
      stakeDurationDays: 365,
      stakeTokenInstance: stakeRewardTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: stakeRewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("75"),
      earlyUnstakeCooldownPeriodDays: 30,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("11"),
      revshareStakeDurationExtensionDays: 30,
    },
    {
      poolUuid: "ea254790-ce62-43b5-aaea-2cb3157365d5",
      poolId: hre.ethers.utils.id("ea254790-ce62-43b5-aaea-2cb3157365d5"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeRewardTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: stakeRewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("50"),
      earlyUnstakeCooldownPeriodDays: 60,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("50"),
      revshareStakeDurationExtensionDays: 60,
    },
    {
      poolUuid: "3d80ec2d-7d15-45f4-9367-53dbaf711c71",
      poolId: hre.ethers.utils.id("3d80ec2d-7d15-45f4-9367-53dbaf711c71"),
      stakeDurationDays: 88,
      stakeTokenInstance: stakeRewardTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: stakeRewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("25"),
      earlyUnstakeCooldownPeriodDays: 90,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays: 90,
    },
    {
      poolUuid: "a025b010-defa-4931-9fdd-403fd9ad3e80",
      poolId: hre.ethers.utils.id("a025b010-defa-4931-9fdd-403fd9ad3e80"),
      stakeDurationDays: 31,
      stakeTokenInstance: stakeRewardTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: stakeRewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("5"),
      earlyUnstakeCooldownPeriodDays: 7,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("90"),
      revshareStakeDurationExtensionDays: 7,
    },
    {
      poolUuid: "582f031e-24fc-4a01-b739-e731b46218a6",
      poolId: hre.ethers.utils.id("582f031e-24fc-4a01-b739-e731b46218a6"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeRewardTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: stakeRewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.constants.Zero,
      earlyUnstakeCooldownPeriodDays: 10,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("30"),
      revshareStakeDurationExtensionDays: 60,
    },
    {
      poolUuid: "fe31cb38-ce28-47f9-b5f9-8128f1183f77",
      poolId: hre.ethers.utils.id("fe31cb38-ce28-47f9-b5f9-8128f1183f77"),
      stakeDurationDays: 999,
      stakeTokenInstance: stakeTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: rewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("100"),
      earlyUnstakeCooldownPeriodDays: 180,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("75"),
      revshareStakeDurationExtensionDays: 2,
    },
    {
      poolUuid: "6fb19058-be01-4fc3-8e8f-ce8977b9ddc2",
      poolId: hre.ethers.utils.id("6fb19058-be01-4fc3-8e8f-ce8977b9ddc2"),
      stakeDurationDays: 365,
      stakeTokenInstance: stakeTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: rewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("75"),
      earlyUnstakeCooldownPeriodDays: 365,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("80"),
      revshareStakeDurationExtensionDays: 88,
    },
    {
      poolUuid: "24d8b40e-e375-4045-965d-066726cfff8b",
      poolId: hre.ethers.utils.id("24d8b40e-e375-4045-965d-066726cfff8b"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: rewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("50"),
      earlyUnstakeCooldownPeriodDays: 188,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("68"),
      revshareStakeDurationExtensionDays: 366,
    },
    {
      poolUuid: "5a816f52-9e42-4a84-b71e-03eacccf0ee1",
      poolId: hre.ethers.utils.id("5a816f52-9e42-4a84-b71e-03eacccf0ee1"),
      stakeDurationDays: 88,
      stakeTokenInstance: stakeTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: rewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("25"),
      earlyUnstakeCooldownPeriodDays: 8,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("33"),
      revshareStakeDurationExtensionDays: 0,
    },
    {
      poolUuid: "c8cb576b-c161-49fe-9d62-7620dc6a7040",
      poolId: hre.ethers.utils.id("c8cb576b-c161-49fe-9d62-7620dc6a7040"),
      stakeDurationDays: 31,
      stakeTokenInstance: stakeTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: rewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.utils.parseEther("5"),
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("23"),
      revshareStakeDurationExtensionDays: 4,
    },
    {
      poolUuid: "4c5d59b3-370c-4fd0-b0aa-929c6681f066",
      poolId: hre.ethers.utils.id("4c5d59b3-370c-4fd0-b0aa-929c6681f066"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeTokenInstances[0],
      stakeTokenDecimals: 18,
      rewardTokenInstance: rewardTokenInstances[1],
      rewardTokenDecimals: 6,
      poolAprWei: hre.ethers.constants.Zero,
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.constants.Zero,
      revshareStakeDurationExtensionDays: 11,
    },
    {
      poolUuid: "021a97f0-78ca-4159-9f5b-6c71ea623c4d",
      poolId: hre.ethers.utils.id("021a97f0-78ca-4159-9f5b-6c71ea623c4d"),
      stakeDurationDays: 999,
      stakeTokenInstance: stakeTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: rewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("100"),
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays: 0,
    },
    {
      poolUuid: "1ac44bc3-57ed-4257-81cc-392236608b13",
      poolId: hre.ethers.utils.id("1ac44bc3-57ed-4257-81cc-392236608b13"),
      stakeDurationDays: 365,
      stakeTokenInstance: stakeTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: rewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("75"),
      earlyUnstakeCooldownPeriodDays: 17,
      earlyUnstakePenaltyPercentWei: hre.ethers.constants.Zero,
      revshareStakeDurationExtensionDays: 0,
    },
    {
      poolUuid: "b4b8cedb-bda4-4474-bd2d-2d0ba2cf386a",
      poolId: hre.ethers.utils.id("b4b8cedb-bda4-4474-bd2d-2d0ba2cf386a"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: rewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("50"),
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.constants.Zero,
      revshareStakeDurationExtensionDays: 37,
    },
    {
      poolUuid: "7e5621d8-0282-4f4d-bb4b-a6e4e8ac2eb4",
      poolId: hre.ethers.utils.id("7e5621d8-0282-4f4d-bb4b-a6e4e8ac2eb4"),
      stakeDurationDays: 88,
      stakeTokenInstance: stakeTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: rewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("25.43"),
      earlyUnstakeCooldownPeriodDays: 1,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays: 0,
    },
    {
      poolUuid: "3407b606-52cb-4e37-a9d0-a1761d1dba9d",
      poolId: hre.ethers.utils.id("3407b606-52cb-4e37-a9d0-a1761d1dba9d"),
      stakeDurationDays: 31,
      stakeTokenInstance: stakeTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: rewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.utils.parseEther("5"),
      earlyUnstakeCooldownPeriodDays: 0,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays: 1,
    },
    {
      poolUuid: "77ec9f64-9efb-4dff-b42d-519657a01bfa",
      poolId: hre.ethers.utils.id("77ec9f64-9efb-4dff-b42d-519657a01bfa"),
      stakeDurationDays: 180,
      stakeTokenInstance: stakeTokenInstances[1],
      stakeTokenDecimals: 6,
      rewardTokenInstance: rewardTokenInstances[0],
      rewardTokenDecimals: 18,
      poolAprWei: hre.ethers.constants.Zero,
      earlyUnstakeCooldownPeriodDays: 1,
      earlyUnstakePenaltyPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays: 1,
    },
  ];

  for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
    for (let j = 0; j < rewardTokenInstances.length; j++) {
      await rewardTokenInstances[j].transfer(
        await contractAdminRoleAccounts[i].getAddress(),
        contractAdminMintAmountsWei.rewardToken,
      );
    }

    for (let j = 0; j < stakeTokenInstances.length; j++) {
      await stakeTokenInstances[j].transfer(
        await contractAdminRoleAccounts[i].getAddress(),
        contractAdminMintAmountsWei.stakeToken,
      );
    }

    for (let j = 0; j < stakeRewardTokenInstances.length; j++) {
      await stakeRewardTokenInstances[j].transfer(
        await contractAdminRoleAccounts[i].getAddress(),
        contractAdminMintAmountsWei.stakeRewardToken,
      );
    }
  }

  await testHelpers.grantRole(
    stakingPoolInstance,
    testHelpers.GOVERNANCE_ROLE,
    governanceRoleAccounts.slice(1),
    governanceRoleAccounts[0],
    true,
  );

  await testHelpers.grantRole(
    stakingPoolInstance,
    testHelpers.CONTRACT_ADMIN_ROLE,
    contractAdminRoleAccounts,
    governanceRoleAccounts[0],
    true,
  );

  return [
    rewardTokenInstances,
    stakeTokenInstances,
    stakeRewardTokenInstances,
    stakingPoolInstance,
    stakingPoolStakeRewardTokenSameConfigs,
    stakingPoolsRewardBalanceOf,
  ];
}

async function newMockStakingPool() {
  const MockStakingPoolFactory =
    await hre.ethers.getContractFactory("MockStakingPoolV2");
  const mockStakingPoolContractInstance = await MockStakingPoolFactory.deploy();
  await mockStakingPoolContractInstance.deployed();

  return mockStakingPoolContractInstance;
}

async function newStakingPool() {
  const StakingPoolFactory =
    await hre.ethers.getContractFactory("StakingPoolV2");
  const stakingPoolContractInstance = await StakingPoolFactory.deploy();
  await stakingPoolContractInstance.deployed();

  return stakingPoolContractInstance;
}

async function newStakingService(stakingPoolAddress) {
  const StakingServiceFactory =
    await hre.ethers.getContractFactory("StakingServiceV2");
  const stakingServiceContractInstance =
    await StakingServiceFactory.deploy(stakingPoolAddress);
  await stakingServiceContractInstance.deployed();

  return stakingServiceContractInstance;
}

async function openStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs,
) {
  const expectIsOpenBeforeOpen = false;
  const expectIsOpenAfterOpen = true;
  const expectIsActive = true;
  const expectIsInitialized = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpenBeforeOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .openStakingPool(stakingPoolConfig.poolId),
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolOpened")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .openStakingPool(stakingPoolConfig.poolId),
  ).to.be.revertedWith("SPool2: opened");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpenAfterOpen,
    expectIsActive,
    expectIsInitialized,
  );
}

async function resumeStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs,
) {
  const expectIsOpen = true;
  const expectIsActiveBeforeResume = false;
  const expectIsActiveAfterResume = true;
  const expectIsInitialized = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActiveBeforeResume,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .resumeStakingPool(stakingPoolConfig.poolId),
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolResumed")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterResume,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .resumeStakingPool(stakingPoolConfig.poolId),
  ).to.be.revertedWith("SPool2: active");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterResume,
    expectIsInitialized,
  );
}

async function suspendStakingPoolWithVerify(
  stakingPoolContractInstance,
  stakingPoolConfig,
  signer,
  verifyStakingPoolConfigs,
) {
  const expectIsOpen = true;
  const expectIsActiveBeforeSuspend = true;
  const expectIsActiveAfterSuspend = false;
  const expectIsInitialized = true;

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActiveBeforeSuspend,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .suspendStakingPool(stakingPoolConfig.poolId),
  )
    .to.emit(stakingPoolContractInstance, "StakingPoolSuspended")
    .withArgs(stakingPoolConfig.poolId, await signer.getAddress());

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterSuspend,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(signer)
      .suspendStakingPool(stakingPoolConfig.poolId),
  ).to.be.revertedWith("SPool2: suspended");

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActiveAfterSuspend,
    expectIsInitialized,
  );
}

async function testCloseOpenStakingPool(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  signers,
  expectAbleToCloseOpen,
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToCloseOpen) {
      await closeStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1),
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;
      const expectIsInitialized = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .closeStakingPool(stakingPoolConfigs[i].poolId),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`,
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
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
        stakingPoolConfigs.slice(0, i + 1),
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;
      const expectIsInitialized = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .openStakingPool(stakingPoolConfigs[i].poolId),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`,
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
      );
    }
  }
}

async function testCreateStakingPool(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  signers,
  expectAbleToCreate,
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToCreate) {
      await createStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1),
      );
    } else {
      await expect(
        stakingPoolContractInstance.getStakingPoolInfo(
          stakingPoolConfigs[i].poolId,
        ),
      ).to.be.revertedWith("SPool2: uninitialized");

      const stakingPoolDto = {
        stakeDurationDays: stakingPoolConfigs[i].stakeDurationDays,
        stakeTokenAddress: stakingPoolConfigs[i].stakeTokenInstance.address,
        stakeTokenDecimals: stakingPoolConfigs[i].stakeTokenDecimals,
        rewardTokenAddress: stakingPoolConfigs[i].rewardTokenInstance.address,
        rewardTokenDecimals: stakingPoolConfigs[i].rewardTokenDecimals,
        poolAprWei: stakingPoolConfigs[i].poolAprWei,
        earlyUnstakeCooldownPeriodDays:
          stakingPoolConfigs[i].earlyUnstakeCooldownPeriodDays,
        earlyUnstakePenaltyPercentWei:
          stakingPoolConfigs[i].earlyUnstakePenaltyPercentWei,
        revshareStakeDurationExtensionDays:
          stakingPoolConfigs[i].revshareStakeDurationExtensionDays,
      };

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .createStakingPool(stakingPoolConfigs[i].poolId, stakingPoolDto),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`,
      );

      await expect(
        stakingPoolContractInstance.getStakingPoolInfo(
          stakingPoolConfigs[i].poolId,
        ),
      ).to.be.revertedWith("SPool2: uninitialized");
    }
  }
}

async function testSetEarlyUnstakeCooldownPeriod(
  stakingPoolContractInstance,
  stakingPoolConfig,
  authorizedSigner,
  unauthorizedSigner,
  newCooldownPeriodDays,
  verifyStakingPoolConfigs,
) {
  const expectIsOpen = true;
  const expectIsActive = true;
  const expectIsInitialized = true;
  const unauthorizedSignerAddress = await unauthorizedSigner.getAddress();

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(authorizedSigner)
      .setEarlyUnstakeCooldownPeriod(
        stakingPoolConfig.poolId,
        newCooldownPeriodDays,
      ),
  )
    .to.emit(stakingPoolContractInstance, "EarlyUnstakeCooldownPeriodChanged")
    .withArgs(
      stakingPoolConfig.poolId,
      await authorizedSigner.getAddress(),
      stakingPoolConfig.earlyUnstakeCooldownPeriodDays,
      newCooldownPeriodDays,
    );

  const stakingPoolConfigAfterSet = Object.assign({}, stakingPoolConfig, {
    earlyUnstakeCooldownPeriodDays: newCooldownPeriodDays,
  });

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfigAfterSet,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(unauthorizedSigner)
      .setEarlyUnstakeCooldownPeriod(
        stakingPoolConfig.poolId,
        newCooldownPeriodDays,
      ),
  ).to.be.revertedWith(
    `AccessControl: account ${unauthorizedSignerAddress.toLowerCase()} is missing role ${
      testHelpers.CONTRACT_ADMIN_ROLE
    }`,
  );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );
}

async function testSetEarlyUnstakePenaltyPercent(
  stakingPoolContractInstance,
  stakingPoolConfig,
  authorizedSigner,
  unauthorizedSigner,
  newPenaltyPercentWei,
  verifyStakingPoolConfigs,
) {
  const expectIsOpen = true;
  const expectIsActive = true;
  const expectIsInitialized = true;
  const unauthorizedSignerAddress = await unauthorizedSigner.getAddress();

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(authorizedSigner)
      .setEarlyUnstakePenaltyPercent(
        stakingPoolConfig.poolId,
        newPenaltyPercentWei,
      ),
  )
    .to.emit(stakingPoolContractInstance, "EarlyUnstakePenaltyPercentChanged")
    .withArgs(
      stakingPoolConfig.poolId,
      await authorizedSigner.getAddress(),
      stakingPoolConfig.earlyUnstakePenaltyPercentWei,
      newPenaltyPercentWei,
    );

  const stakingPoolConfigAfterSet = Object.assign({}, stakingPoolConfig, {
    earlyUnstakePenaltyPercentWei: newPenaltyPercentWei,
  });

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfigAfterSet,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(unauthorizedSigner)
      .setEarlyUnstakePenaltyPercent(
        stakingPoolConfig.poolId,
        newPenaltyPercentWei,
      ),
  ).to.be.revertedWith(
    `AccessControl: account ${unauthorizedSignerAddress.toLowerCase()} is missing role ${
      testHelpers.CONTRACT_ADMIN_ROLE
    }`,
  );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );
}

async function testSetRevshareStakeDurationExtension(
  stakingPoolContractInstance,
  stakingPoolConfig,
  authorizedSigner,
  unauthorizedSigner,
  newRevshareStakeDurationExtensionDays,
  verifyStakingPoolConfigs,
) {
  const expectIsOpen = true;
  const expectIsActive = true;
  const expectIsInitialized = true;
  const unauthorizedSignerAddress = await unauthorizedSigner.getAddress();

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfig,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(authorizedSigner)
      .setRevshareStakeDurationExtension(
        stakingPoolConfig.poolId,
        newRevshareStakeDurationExtensionDays,
      ),
  )
    .to.emit(
      stakingPoolContractInstance,
      "RevshareStakeDurationExtensionChanged",
    )
    .withArgs(
      stakingPoolConfig.poolId,
      await authorizedSigner.getAddress(),
      stakingPoolConfig.revshareStakeDurationExtensionDays,
      newRevshareStakeDurationExtensionDays,
    );

  const stakingPoolConfigAfterSet = Object.assign({}, stakingPoolConfig, {
    revshareStakeDurationExtensionDays: newRevshareStakeDurationExtensionDays,
  });

  await verifyStakingPoolInfo(
    stakingPoolContractInstance,
    stakingPoolConfigAfterSet,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );

  await expect(
    stakingPoolContractInstance
      .connect(unauthorizedSigner)
      .setRevshareStakeDurationExtension(
        stakingPoolConfig.poolId,
        newRevshareStakeDurationExtensionDays,
      ),
  ).to.be.revertedWith(
    `AccessControl: account ${unauthorizedSignerAddress.toLowerCase()} is missing role ${
      testHelpers.CONTRACT_ADMIN_ROLE
    }`,
  );

  await verifyStakingPoolsInfo(
    stakingPoolContractInstance,
    verifyStakingPoolConfigs,
    expectIsOpen,
    expectIsActive,
    expectIsInitialized,
  );
}

async function testSuspendResumeStakingPool(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  signers,
  expectAbleToSuspendResume,
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    const signerIndex = i % signers.length;
    const signerAddress = await signers[signerIndex].getAddress();

    if (expectAbleToSuspendResume) {
      await suspendStakingPoolWithVerify(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        signers[signerIndex],
        stakingPoolConfigs.slice(0, i + 1),
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;
      const expectIsInitialized = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .suspendStakingPool(stakingPoolConfigs[i].poolId),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`,
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
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
        stakingPoolConfigs.slice(0, i + 1),
      );
    } else {
      const expectIsOpen = true;
      const expectIsActive = true;
      const expectIsInitialized = true;

      await verifyStakingPoolInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs[i],
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
      );

      await expect(
        stakingPoolContractInstance
          .connect(signers[signerIndex])
          .resumeStakingPool(stakingPoolConfigs[i].poolId),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.CONTRACT_ADMIN_ROLE
        }`,
      );

      await verifyStakingPoolsInfo(
        stakingPoolContractInstance,
        stakingPoolConfigs.slice(0, i + 1),
        expectIsOpen,
        expectIsActive,
        expectIsInitialized,
      );
    }
  }
}

async function verifyStakingPoolInfo(
  stakingPoolContractInstance,
  stakingPoolConfig,
  expectIsOpen,
  expectIsActive,
  expectIsInitialized,
) {
  const stakingPoolInfo = await stakingPoolContractInstance.getStakingPoolInfo(
    stakingPoolConfig.poolId,
  );

  expect(stakingPoolInfo.stakeDurationDays).to.equal(
    stakingPoolConfig.stakeDurationDays,
  );
  expect(stakingPoolInfo.stakeTokenAddress).to.equal(
    stakingPoolConfig.stakeTokenInstance.address,
  );
  expect(stakingPoolInfo.stakeTokenDecimals).to.equal(
    stakingPoolConfig.stakeTokenDecimals,
  );
  expect(stakingPoolInfo.rewardTokenAddress).to.equal(
    stakingPoolConfig.rewardTokenInstance.address,
  );
  expect(stakingPoolInfo.rewardTokenDecimals).to.equal(
    stakingPoolConfig.rewardTokenDecimals,
  );
  expect(stakingPoolInfo.poolAprWei).to.equal(stakingPoolConfig.poolAprWei);
  expect(stakingPoolInfo.earlyUnstakeCooldownPeriodDays).to.equal(
    stakingPoolConfig.earlyUnstakeCooldownPeriodDays,
  );
  expect(stakingPoolInfo.earlyUnstakePenaltyPercentWei).to.equal(
    stakingPoolConfig.earlyUnstakePenaltyPercentWei,
  );
  expect(stakingPoolInfo.revshareStakeDurationExtensionDays).to.equal(
    stakingPoolConfig.revshareStakeDurationExtensionDays,
  );
  expect(stakingPoolInfo.isOpen).to.equal(expectIsOpen);
  expect(stakingPoolInfo.isActive).to.equal(expectIsActive);
  expect(stakingPoolInfo.isInitialized).to.equal(expectIsInitialized);

  return stakingPoolInfo;
}

async function verifyStakingPoolsInfo(
  stakingPoolContractInstance,
  stakingPoolConfigs,
  expectIsOpen,
  expectIsActive,
  expectIsInitialized,
) {
  for (let i = 0; i < stakingPoolConfigs.length; i++) {
    await verifyStakingPoolInfo(
      stakingPoolContractInstance,
      stakingPoolConfigs[i],
      expectIsOpen,
      expectIsActive,
      expectIsInitialized,
    );
  }
}

module.exports = {
  closeStakingPoolWithVerify,
  createStakingPoolWithVerify,
  initializeStakingPoolTestData,
  newMockStakingPool,
  newStakingPool,
  newStakingService,
  openStakingPoolWithVerify,
  resumeStakingPoolWithVerify,
  suspendStakingPoolWithVerify,
  testCloseOpenStakingPool,
  testCreateStakingPool,
  testSetEarlyUnstakeCooldownPeriod,
  testSetEarlyUnstakePenaltyPercent,
  testSetRevshareStakeDurationExtension,
  testSuspendResumeStakingPool,
  verifyStakingPoolInfo,
  verifyStakingPoolsInfo,
};
