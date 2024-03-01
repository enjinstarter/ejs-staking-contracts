const { expect } = require("chai");
const hre = require("hardhat");
// const timeMachine = require("ganache-time-traveler");
const testHelpers = require("./test-helpers.js");
const stakeHelpers = require("./stake-helpers.js");

describe("StakingPool", function () {
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
      await stakeHelpers.initializeStakingPoolTestData(
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
    ).to.be.revertedWith("SPool: uninitialized");
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
    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs.slice(0, 1),
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs.slice(1, 2),
      governanceRoleAccounts.slice(1),
      false,
    );
    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs.slice(2, 4),
      contractAdminRoleAccounts,
      true,
    );
    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs.slice(4),
      enduserAccounts,
      false,
    );
  });

  it("Should only allow contract admin role to close/open staking pool", async () => {
    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakeHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await stakeHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(1),
      false,
    );
    await stakeHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts,
      true,
    );
    await stakeHelpers.testCloseOpenStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      enduserAccounts,
      false,
    );
  });

  it("Should only allow contract admin role to suspend/resume staking pool", async () => {
    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );

    await stakeHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await stakeHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts.slice(1),
      false,
    );
    await stakeHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts,
      true,
    );
    await stakeHelpers.testSuspendResumeStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      enduserAccounts,
      false,
    );
  });

  it("should not allow creation of staking pool with zero duration", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          0,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        ),
    ).to.be.revertedWith("SPool: stake duration");
  });

  it("should not allow creation of staking pool with zero stake token address", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
          hre.ethers.constants.AddressZero,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        ),
    ).to.be.revertedWith("SPool: stake token");
  });

  it("should not allow creation of staking pool with more than 18 decimals for stake token", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          19,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        ),
    ).to.be.revertedWith("SPool: stake decimals");
  });

  it("should not allow creation of staking pool with zero reward token address", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
          hre.ethers.constants.AddressZero,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        ),
    ).to.be.revertedWith("SPool: reward token");
  });

  it("should not allow creation of staking pool with more than 18 decimals for reward token", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
          19,
          stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        ),
    ).to.be.revertedWith("SPool: reward decimals");
  });

  it("should not allow creation of staking pool with zero APR", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenDecimals,
          hre.ethers.constants.Zero,
        ),
    ).to.be.revertedWith("SPool: pool APR");
  });

  it("should not allow creation of staking pool with same stake/reward token but different decimals", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .createStakingPool(
          stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance.address,
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenDecimals - 1,
          stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        ),
    ).to.be.revertedWith("SPool: decimals different");
  });

  it("should not allow closure of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .closeStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("should not allow opening of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .openStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("should not allow suspension of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .suspendStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("should not allow resumption of uninitialized staking pool", async () => {
    await expect(
      stakingPoolInstance
        .connect(contractAdminRoleAccounts[0])
        .resumeStakingPool(stakingPoolStakeRewardTokenSameConfigs[0].poolId),
    ).to.be.revertedWith("SPool: uninitialized");
  });
});
