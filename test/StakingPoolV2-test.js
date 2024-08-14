const { expect } = require("chai");
const hre = require("hardhat");
// const timeMachine = require("ganache-time-traveler");
const testHelpers = require("./test-helpers.js");
const stakePoolHelpers = require("./stake-pool-v2-helpers.js");

describe("StakingPoolV2", function () {
  const rewardTokenAdminMintWei = hre.ethers.utils.parseEther("10000000");
  const stakeTokenAdminMintWei = hre.ethers.utils.parseEther("1000000");
  const stakeRewardTokenAdminMintWei = rewardTokenAdminMintWei;

  const rewardToken18DecimalsInfo = [
    {
      tokenName: "MockRewardToken18",
      tokenSymbol: "MREWARD18",
      tokenDecimals: hre.ethers.BigNumber.from(18),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
    {
      tokenName: "MockRewardToken06",
      tokenSymbol: "MREWARD06",
      tokenDecimals: hre.ethers.BigNumber.from(6),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
  ];

  const stakeRewardToken18DecimalsInfo = [
    {
      tokenName: "MockStakeRewardToken18",
      tokenSymbol: "MSTAKEREWARD18",
      tokenDecimals: hre.ethers.BigNumber.from(18),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
    {
      tokenName: "MockStakeRewardToken06",
      tokenSymbol: "MSTAKEREWARD06",
      tokenDecimals: hre.ethers.BigNumber.from(6),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
  ];

  const stakeToken18DecimalsInfo = [
    {
      tokenName: "MockStakeToken18",
      tokenSymbol: "MSTAKE18",
      tokenDecimals: hre.ethers.BigNumber.from(18),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
    {
      tokenName: "MockStakeToken06",
      tokenSymbol: "MSTAKE06",
      tokenDecimals: hre.ethers.BigNumber.from(6),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
  ];

  const contractAdminMintAmountsWei = {
    rewardToken: rewardTokenAdminMintWei,
    stakeToken: stakeTokenAdminMintWei,
    stakeRewardToken: stakeRewardTokenAdminMintWei,
  };

  let accounts;
  let governanceRoleAccounts;
  let contractAdminRoleAccounts;
  let enduserAccounts;

  let stakingPoolInstance;

  let stakingPoolStakeRewardTokenSameConfigs;
  // let snapshotId;

  before(async () => {
    // const snapshot = await timeMachine.takeSnapshot();
    // snapshotId = snapshot.result;

    accounts = await hre.ethers.getSigners();
    /*
    console.log(`accounts.length: ${accounts.length}`);
    for (let i = 0; i < accounts.length; i++) {
      console.log(`accounts[${i}]: ${await accounts[i].getAddress()}`);
    }
    console.log();
    */
    governanceRoleAccounts = accounts.slice(0, 2);
    /*
    console.log(`governanceRoleAccounts.length: ${governanceRoleAccounts.length}`);
    for (let i = 0; i < governanceRoleAccounts.length; i++) {
      console.log(`governanceRoleAccounts[${i}]: ${await governanceRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    contractAdminRoleAccounts = accounts.slice(2, 4);
    /*
    console.log(`contractAdminRoleAccounts.length: ${contractAdminRoleAccounts.length}`);
    for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
      console.log(`contractAdminRoleAccounts[${i}]: ${await contractAdminRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    enduserAccounts = accounts.slice(10);
    /*
    console.log(`enduserAccounts.length: ${enduserAccounts.length}`);
    for (let i = 0; i < enduserAccounts.length; i++) {
      console.log(`enduserAccounts[${i}]: ${await enduserAccounts[i].getAddress()}`);
    }
    console.log();
    */
  });

  after(async () => {
    // await timeMachine.revertToSnapshot(snapshotId);
  });

  beforeEach(async () => {
    [, , , stakingPoolInstance, stakingPoolStakeRewardTokenSameConfigs] =
      await stakePoolHelpers.initializeStakingPoolTestData(
        rewardToken18DecimalsInfo,
        stakeToken18DecimalsInfo,
        stakeRewardToken18DecimalsInfo,
        governanceRoleAccounts,
        contractAdminRoleAccounts,
        contractAdminMintAmountsWei,
      );
  });

  it("Should be initialized correctly", async () => {
    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.GOVERNANCE_ROLE,
      governanceRoleAccounts,
      true,
    );
    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.GOVERNANCE_ROLE,
      contractAdminRoleAccounts,
      false,
    );
    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.GOVERNANCE_ROLE,
      enduserAccounts,
      false,
    );

    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      contractAdminRoleAccounts,
      true,
    );
    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      governanceRoleAccounts.slice(1),
      false,
    );
    await testHelpers.verifyRole(
      stakingPoolInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      enduserAccounts,
      false,
    );

    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d",
    );

    await expect(
      stakingPoolInstance.getStakingPoolInfo(uninitializedPoolId),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("Should only allow default admin role to grant and revoke roles", async () => {
    await testHelpers.testGrantRevokeRoles(
      stakingPoolInstance,
      governanceRoleAccounts,
      contractAdminRoleAccounts,
      enduserAccounts,
      accounts,
    );
  });

  it("Should only allow contract admin role to create staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(1),
      false,
    );
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      enduserAccounts,
      false,
    );

    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs.slice(0, 1),
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
      contractAdminRoleAccounts,
      true,
    );
  });

  it("Should only allow contract admin role to close/open staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await stakePoolHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(1),
      false,
    );
    await stakePoolHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts,
      true,
    );
    await stakePoolHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      enduserAccounts,
      false,
    );
  });

  it("Should only allow contract admin role to suspend/resume staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await stakePoolHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(1),
      false,
    );
    await stakePoolHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts,
      true,
    );
    await stakePoolHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      enduserAccounts,
      false,
    );
  });

  it("Should only allow contract admin role to set early unstake cooldown period for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetEarlyUnstakeCooldownPeriod(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      10,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set zero early unstake cooldown period for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetEarlyUnstakeCooldownPeriod(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      0,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set early unstake penalty percentage for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetEarlyUnstakePenaltyPercent(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      hre.ethers.utils.parseEther("30"),
      hre.ethers.utils.parseEther("10"),
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set zero early unstake penalty percentage for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetEarlyUnstakePenaltyPercent(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      hre.ethers.constants.Zero,
      hre.ethers.constants.Zero,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set 100% early unstake penalty percentage for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetEarlyUnstakePenaltyPercent(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      hre.ethers.utils.parseEther("100"),
      hre.ethers.utils.parseEther("100"),
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set 100% and 0% early unstake max and min penalty percentage respectively for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetEarlyUnstakePenaltyPercent(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      hre.ethers.utils.parseEther("100"),
      hre.ethers.constants.Zero,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set stake duration extension for claim revshare of staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetRevshareStakeDurationExtension(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      60,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("Should only allow contract admin role to set stake duration extension for claim revshare of staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakePoolHelpers.testSetRevshareStakeDurationExtension(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs[0],
      contractAdminRoleAccounts[0],
      governanceRoleAccounts[1],
      0,
      stakingPoolStakeRewardTokenSameConfigs.slice(1),
    );
  });

  it("should not allow creation of staking pool with zero duration", async () => {
    const stakingPoolDto = {
      stakeDurationDays: 0,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMaxPercentWei,
      earlyUnstakePenaltyMinPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMinPercentWei,
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: stake duration");
  });

  it("should not allow creation of staking pool with zero stake token address", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress: hre.ethers.constants.AddressZero,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMaxPercentWei,
      earlyUnstakePenaltyMinPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMinPercentWei,
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: stake token");
  });

  it("should not allow creation of staking pool with more than 18 decimals for stake token", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals: 19,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMaxPercentWei,
      earlyUnstakePenaltyMinPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMinPercentWei,
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: stake decimals");
  });

  it("should not allow creation of staking pool with zero reward token address", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress: hre.ethers.constants.AddressZero,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMaxPercentWei,
      earlyUnstakePenaltyMinPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMinPercentWei,
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: reward token");
  });

  it("should not allow creation of staking pool with more than 18 decimals for reward token", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals: 19,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMaxPercentWei,
      earlyUnstakePenaltyMinPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMinPercentWei,
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: reward decimals");
  });

  it("should not allow creation of staking pool with same stake/reward token but different decimals", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals - 1,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMaxPercentWei,
      earlyUnstakePenaltyMinPercentWei:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakePenaltyMinPercentWei,
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: decimals different");
  });

  it("should not allow creation of staking pool with early unstake max penalty percentage more than 100%", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei: hre.ethers.utils.parseEther(
        "100.000000000000000001",
      ),
      earlyUnstakePenaltyMinPercentWei: hre.ethers.utils.parseEther("100"),
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: max penalty");
  });

  it("should not allow creation of staking pool with early unstake min penalty percentage more than 100%", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei: hre.ethers.utils.parseEther("100"),
      earlyUnstakePenaltyMinPercentWei: hre.ethers.utils.parseEther(
        "100.000000000000000001",
      ),
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: min penalty");
  });

  it("should not allow creation of staking pool with early unstake min penalty percentage more than max", async () => {
    const stakingPoolDto = {
      stakeDurationDays:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
      stakeTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
      stakeTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
      rewardTokenAddress:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
      rewardTokenDecimals:
        stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
      poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
      earlyUnstakeCooldownPeriodDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .earlyUnstakeCooldownPeriodDays,
      earlyUnstakePenaltyMaxPercentWei: hre.ethers.utils.parseEther("12"),
      earlyUnstakePenaltyMinPercentWei: hre.ethers.utils.parseEther(
        "12.000000000000000001",
      ),
      revshareStakeDurationExtensionDays:
        stakingPoolStakeRewardTokenSameConfigs[0]
          .revshareStakeDurationExtensionDays,
    };

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolDto,
        ),
    ).to.be.revertedWith("SPool2: min > max penalty");
  });

  it("should not allow closure of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .closeStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("should not allow opening of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .openStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("should not allow suspension of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .suspendStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("should not allow resumption of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .resumeStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("should not allow setting early unstake cooldown period of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .setEarlyUnstakeCooldownPeriod(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          hre.ethers.constants.One,
        ),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("should not allow setting early unstake penalty percentage of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .setEarlyUnstakePenaltyPercent(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          hre.ethers.constants.One,
          hre.ethers.constants.Zero,
        ),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("should not allow setting early unstake penalty max percentage to more than 100% for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .setEarlyUnstakePenaltyPercent(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          hre.ethers.utils.parseEther("100.000000000000000001"),
          hre.ethers.constants.Zero,
        ),
    ).to.be.revertedWith("SPool2: max penalty");
  });

  it("should not allow setting early unstake penalty min percentage to more than 100% for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .setEarlyUnstakePenaltyPercent(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          hre.ethers.constants.Zero,
          hre.ethers.utils.parseEther("100.000000000000000001"),
        ),
    ).to.be.revertedWith("SPool2: min penalty");
  });

  it("should not allow setting early unstake penalty min percentage to be more than max percentage for staking pool", async () => {
    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .setEarlyUnstakePenaltyPercent(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          hre.ethers.utils.parseEther("50"),
          hre.ethers.utils.parseEther("50.000000000000000001"),
        ),
    ).to.be.revertedWith("SPool2: min > max penalty");
  });

  it("should not allow setting stake duration extension for claim revshare of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .setRevshareStakeDurationExtension(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          hre.ethers.constants.One,
        ),
    ).to.be.revertedWith("SPool2: uninitialized");
  });
});
