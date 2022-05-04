const { expect } = require("chai");
const hre = require("hardhat");
// const timeMachine = require("ganache-time-traveler");
const testHelpers = require("./test-helpers.js");
const stakeHelpers = require("./stake-helpers.js");

describe("StakingService", function () {
  const rewardTokenAdminMintWei = hre.ethers.utils.parseEther("10000000");
  const stakeTokenAdminMintWei = hre.ethers.utils.parseEther("1000000");
  const stakeRewardTokenAdminMintWei = rewardTokenAdminMintWei;

  const rewardToken18DecimalsInfo = {
    tokenName: "MockRewardToken",
    tokenSymbol: "MREWARD",
    tokenDecimals: hre.ethers.BigNumber.from(18),
    tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
  };

  const stakeRewardToken18DecimalsInfo = {
    tokenName: "MockStakeRewardToken",
    tokenSymbol: "MSTAKEREWARD",
    tokenDecimals: hre.ethers.BigNumber.from(18),
    tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
  };

  const stakeToken18DecimalsInfo = {
    tokenName: "MockStakeToken",
    tokenSymbol: "MSTAKE",
    tokenDecimals: hre.ethers.BigNumber.from(18),
    tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
  };

  const contractAdminMintAmountsWei = {
    rewardToken: rewardTokenAdminMintWei,
    stakeToken: stakeTokenAdminMintWei,
    stakeRewardToken: stakeRewardTokenAdminMintWei,
  };

  let accounts;
  let governanceRoleAccounts;
  let contractAdminRoleAccounts;
  let enduserAccounts;
  let unusedRoleAccounts;

  let libUnitConverterInstance;

  let rewardToken18DecimalsInstance;
  let stakeRewardToken18DecimalsInstance;
  let stakeToken18DecimalsInstance;
  let stakingPoolInstance;
  let stakingServiceInstance;

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
    unusedRoleAccounts = accounts.slice(4, 10);
    /*
    console.log(`unusedRoleAccounts.length: ${unusedRoleAccounts.length}`);
    for (let i = 0; i < unusedRoleAccounts.length; i++) {
      console.log(`unusedRoleAccounts[${i}]: ${await unusedRoleAccounts[i].getAddress()}`);
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

    libUnitConverterInstance = await testHelpers.newLibrary("UnitConverter");
  });

  after(async () => {
    // await timeMachine.revertToSnapshot(snapshotId);
  });

  beforeEach(async () => {
    [
      rewardToken18DecimalsInstance,
      stakeToken18DecimalsInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
    ] = await stakeHelpers.initializeStakingPoolTestData(
      rewardToken18DecimalsInfo,
      stakeToken18DecimalsInfo,
      stakeRewardToken18DecimalsInfo,
      governanceRoleAccounts,
      contractAdminRoleAccounts,
      contractAdminMintAmountsWei
    );

    stakingServiceInstance = await stakeHelpers.newStakingService(
      libUnitConverterInstance.address,
      stakingPoolInstance.address
    );

    await testHelpers.grantRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      governanceRoleAccounts.slice(1),
      governanceRoleAccounts[0],
      true
    );

    await testHelpers.grantRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      contractAdminRoleAccounts,
      governanceRoleAccounts[0],
      true
    );

    await stakeHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true
    );
  });

  it("Should be initialized correctly", async function () {
    const expectAdminWallet = await governanceRoleAccounts[0].getAddress();

    const adminWallet = await stakingServiceInstance.adminWallet();
    expect(adminWallet).to.equal(expectAdminWallet);

    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      governanceRoleAccounts,
      true
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      contractAdminRoleAccounts,
      false
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      enduserAccounts,
      false
    );

    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      contractAdminRoleAccounts,
      true
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      governanceRoleAccounts.slice(0, 1),
      true
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      governanceRoleAccounts.slice(1),
      false
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      enduserAccounts,
      false
    );

    const poolId = hre.ethers.utils.id("da61b654-4973-4879-9166-723c0017dd6d");
    const enduserAccountAddress = await enduserAccounts[0].getAddress();

    await expect(
      stakingServiceInstance.getClaimableRewardWei(
        poolId,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceInstance.getStakeInfo(poolId, enduserAccountAddress)
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceInstance.getStakingPoolStats(poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");
  });

  it("Should not allow initialization of zero staking pool address", async () => {
    await expect(
      stakeHelpers.newStakingService(
        libUnitConverterInstance.address,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: staking pool");
  });

  it("Should only allow default admin role to grant and revoke roles", async function () {
    await testHelpers.testGrantRevokeRoles(
      stakingServiceInstance,
      governanceRoleAccounts,
      contractAdminRoleAccounts,
      enduserAccounts,
      accounts
    );
  });

  it("Should only allow governance role to pause and unpause contract", async () => {
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      governanceRoleAccounts,
      true
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      false
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      enduserAccounts,
      false
    );
  });

  it("Should only allow governance role to set admin wallet", async () => {
    const expectAdminWalletBeforeSet =
      await governanceRoleAccounts[0].getAddress();
    const expectAdminWalletAfterSet = await unusedRoleAccounts[0].getAddress();

    await testHelpers.testSetAdminWallet(
      stakingServiceInstance,
      governanceRoleAccounts,
      expectAdminWalletBeforeSet,
      expectAdminWalletAfterSet,
      true
    );
    await testHelpers.testSetAdminWallet(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      expectAdminWalletBeforeSet,
      expectAdminWalletAfterSet,
      false
    );
    await testHelpers.testSetAdminWallet(
      stakingServiceInstance,
      enduserAccounts,
      expectAdminWalletBeforeSet,
      expectAdminWalletAfterSet,
      false
    );
  });

  it("Should only allow governance role to set staking pool contract", async () => {
    const expectStakingPoolContractBeforeSet = stakingPoolInstance.address;
    const expectStakingPoolContractAfterSet =
      "0xabCDeF0123456789AbcdEf0123456789aBCDEF01";

    await testSetStakingPoolContract(
      stakingServiceInstance,
      governanceRoleAccounts,
      expectStakingPoolContractBeforeSet,
      expectStakingPoolContractAfterSet,
      true
    );
    await testSetStakingPoolContract(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      expectStakingPoolContractBeforeSet,
      expectStakingPoolContractAfterSet,
      false
    );
    await testSetStakingPoolContract(
      stakingServiceInstance,
      enduserAccounts,
      expectStakingPoolContractBeforeSet,
      expectStakingPoolContractAfterSet,
      false
    );
  });

  it("Should only allow contract admin role to add staking pool reward", async () => {
    const stakingPoolRewardConfigs = [
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[1].poolId,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[2].poolId,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[3].poolId,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[4].poolId,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
    ];

    const stakingPoolRewardStats = {};

    let stakingPoolRewardBalanceOf = await testAddStakingPoolReward(
      stakingServiceInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolRewardConfigs,
      governanceRoleAccounts.slice(0, 1),
      hre.ethers.constants.Zero,
      stakingPoolRewardStats,
      true
    );

    await testAddStakingPoolReward(
      stakingServiceInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolRewardConfigs,
      governanceRoleAccounts.slice(1),
      stakingPoolRewardBalanceOf,
      stakingPoolRewardStats,
      false
    );

    stakingPoolRewardBalanceOf = await testAddStakingPoolReward(
      stakingServiceInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolRewardConfigs,
      contractAdminRoleAccounts,
      stakingPoolRewardBalanceOf,
      stakingPoolRewardStats,
      true
    );

    await testAddStakingPoolReward(
      stakingServiceInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolRewardConfigs,
      enduserAccounts,
      stakingPoolRewardBalanceOf,
      stakingPoolRewardStats,
      false
    );
  });

  it("Should be able to stake, claim reward and unstake", async () => {
    const expectStakes = [
      {
        stakeAmountWei: hre.ethers.utils.parseEther("562896.53017638"),
        stakeSecondsAfterStartblockTimestamp: 10,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("94880.38757420"),
        stakeSecondsAfterStartblockTimestamp: 143,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5764.57794068"),
        stakeSecondsAfterStartblockTimestamp: 279,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5279.76920273"),
        stakeSecondsAfterStartblockTimestamp: 415,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("3189.47044271"),
        stakeSecondsAfterStartblockTimestamp: 548,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("7846.8168352"),
        stakeSecondsAfterStartblockTimestamp: 679,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("4895.31994040"),
        stakeSecondsAfterStartblockTimestamp: 810,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("1056.52266119"),
        stakeSecondsAfterStartblockTimestamp: 946,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("1140.20926502"),
        stakeSecondsAfterStartblockTimestamp: 1077,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5977.5179946"),
        stakeSecondsAfterStartblockTimestamp: 1189,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("2248.32691972"),
        stakeSecondsAfterStartblockTimestamp: 1348,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5645.14307150"),
        stakeSecondsAfterStartblockTimestamp: 1486,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("7834.10340079"),
        stakeSecondsAfterStartblockTimestamp: 1523,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5701.40825578"),
        stakeSecondsAfterStartblockTimestamp: 1756,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("6253.78681137"),
        stakeSecondsAfterStartblockTimestamp: 1833,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("731.63201142"),
        stakeSecondsAfterStartblockTimestamp: 1969,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("907.23582828"),
        stakeSecondsAfterStartblockTimestamp: 2107,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("41.87133677"),
        stakeSecondsAfterStartblockTimestamp: 2242,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
    ];

    const stakingPoolRewardStats = {};

    const stakeConfigs = await setupStakeConfigs(
      stakingPoolStakeRewardTokenSameConfigs,
      enduserAccounts,
      expectStakes,
      stakingServiceInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolRewardStats,
      governanceRoleAccounts[0]
    );

    const stakingPoolStats = await testStakeClaimUnstake(
      stakingServiceInstance,
      stakingPoolInstance,
      stakeRewardToken18DecimalsInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolRewardStats,
      stakeConfigs,
      contractAdminRoleAccounts[0]
    );

    await testRemoveUnallocatedStakingPoolReward(
      stakingServiceInstance,
      stakeRewardToken18DecimalsInstance,
      stakingPoolStats,
      stakeConfigs,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts[0]
    );

    const rewardToken18DecimalsBalanceOfContractAfterRemove =
      await rewardToken18DecimalsInstance.balanceOf(
        stakingServiceInstance.address
      );
    expect(rewardToken18DecimalsBalanceOfContractAfterRemove).to.equal(
      hre.ethers.constants.Zero
    );

    const stakeToken18DecimalsBalanceOfContractAfterRemove =
      await stakeToken18DecimalsInstance.balanceOf(
        stakingServiceInstance.address
      );
    expect(stakeToken18DecimalsBalanceOfContractAfterRemove).to.equal(
      hre.ethers.constants.Zero
    );

    /*
    const stakeRewardToken18DecimalsBalanceOfContractAfterRemove = await stakeRewardToken18DecimalsInstance.balanceOf(
      stakingServiceInstance.address
    );
    expect(stakeRewardToken18DecimalsBalanceOfContractAfterRemove).to.equal(hre.ethers.constants.Zero);
    */
  });

  it("Should not allow set admin wallet as zero address", async () => {
    await expect(
      stakingServiceInstance.setAdminWallet(hre.ethers.constants.AddressZero)
    ).to.be.revertedWith("AdminWallet: new wallet");
  });

  it("Should not allow set staking pool contract as zero address", async () => {
    await expect(
      stakingServiceInstance.setStakingPoolContract(
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: new staking pool");
  });

  it("Should not allow add zero staking pool reward", async () => {
    await expect(
      stakingServiceInstance.addStakingPoolReward(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        hre.ethers.constants.Zero
      )
    ).to.be.revertedWith("SSvcs: reward amount");
  });

  it("Should not allow resume stake for zero address", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.resumeStake(
        uninitializedPoolId,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");
  });

  it("Should not allow resume stake for uninitialized stake", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );
    const enduserAccountAddress = await enduserAccounts[0].getAddress();

    await expect(
      stakingServiceInstance.resumeStake(
        uninitializedPoolId,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");
  });

  it("Should not allow suspend stake for zero address", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.suspendStake(
        uninitializedPoolId,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");
  });

  it("Should not allow suspend stake for uninitialized stake", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );
    const enduserAccountAddress = await enduserAccounts[0].getAddress();

    await expect(
      stakingServiceInstance.suspendStake(
        uninitializedPoolId,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");
  });

  it("should not allow get claimable reward for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.getClaimableRewardWei(
        uninitializedPoolId,
        enduserAccounts[0]
      )
    ).to.be.reverted;
  });

  it("should not allow get claimable reward for zero address", async () => {
    await expect(
      stakingServiceInstance.getClaimableRewardWei(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");
  });

  it("should not allow get stake info for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.getStakeInfo(
        uninitializedPoolId,
        enduserAccounts[0]
      )
    ).to.be.reverted;
  });

  it("should not allow get stake info for zero address", async () => {
    await expect(
      stakingServiceInstance.getStakeInfo(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");
  });

  it("should not allow stake of zero amount", async () => {
    await expect(
      stakingServiceInstance.stake(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        hre.ethers.constants.Zero
      )
    ).to.be.revertedWith("SSvcs: stake amount");
  });

  async function addStakingPoolRewardWithVerify(
    stakingServiceContractInstance,
    rewardTokenContractInstance,
    fromWalletSigner,
    poolId,
    stakingPoolRewardBalanceOf,
    stakingPoolRewardStats,
    rewardAmountWei
  ) {
    if (!(poolId in stakingPoolRewardStats)) {
      stakingPoolRewardStats[poolId] = {
        totalRewardWei: hre.ethers.constants.Zero,
        rewardToBeDistributedWei: hre.ethers.constants.Zero,
      };
    }

    const expectBalanceOfBeforeAdd = stakingPoolRewardBalanceOf;
    const expectTotalRewardWeiBeforeAdd =
      stakingPoolRewardStats[poolId].totalRewardWei;
    const expectRewardToBeDistributedWei =
      stakingPoolRewardStats[poolId].rewardToBeDistributedWei;

    const balanceOfBeforeAdd = await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address
    );
    expect(balanceOfBeforeAdd).to.equal(expectBalanceOfBeforeAdd);

    const stakingPoolStatsBeforeAdd =
      await stakingServiceContractInstance.getStakingPoolStats(poolId);
    expect(stakingPoolStatsBeforeAdd.totalRewardWei).to.equal(
      expectTotalRewardWeiBeforeAdd
    );
    expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
      expectRewardToBeDistributedWei
    );

    await testHelpers.approveTransferWithVerify(
      rewardTokenContractInstance,
      fromWalletSigner,
      stakingServiceContractInstance.address,
      rewardAmountWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(fromWalletSigner)
        .addStakingPoolReward(poolId, rewardAmountWei)
    )
      .to.emit(stakingServiceContractInstance, "StakingPoolRewardAdded")
      .withArgs(
        poolId,
        await fromWalletSigner.getAddress(),
        rewardTokenContractInstance.address,
        rewardAmountWei
      );

    const expectBalanceOfAfterAdd =
      stakingPoolRewardBalanceOf.add(rewardAmountWei);
    stakingPoolRewardStats[poolId].totalRewardWei =
      stakingPoolRewardStats[poolId].totalRewardWei.add(rewardAmountWei);

    const balanceOfAfterAdd = await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address
    );
    expect(balanceOfAfterAdd).to.equal(expectBalanceOfAfterAdd);

    const stakingPoolStatsAfterAdd =
      await stakingServiceContractInstance.getStakingPoolStats(poolId);
    expect(stakingPoolStatsAfterAdd.totalRewardWei).to.equal(
      stakingPoolRewardStats[poolId].totalRewardWei
    );
    expect(stakingPoolStatsAfterAdd.totalStakedWei).to.equal(
      stakingPoolStatsBeforeAdd.totalStakedWei
    );
    expect(stakingPoolStatsAfterAdd.rewardToBeDistributedWei).to.equal(
      stakingPoolStatsBeforeAdd.rewardToBeDistributedWei
    );
    expect(stakingPoolStatsAfterAdd.isOpen).to.equal(
      stakingPoolStatsBeforeAdd.isOpen
    );
    expect(stakingPoolStatsAfterAdd.isActive).to.equal(
      stakingPoolStatsBeforeAdd.isActive
    );

    return expectBalanceOfAfterAdd;
  }

  async function claimRewardWithVerify(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    adminSigner,
    rewardTokenContractInstance,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei,
    isStakeSuspended,
    hasClaimed,
    afterRevoke
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    const expectStakeTimestamp =
      startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );
    const expectRewardForSuspendedPoolWei = hre.ethers.constants.Zero;
    const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
      stakeConfig.stakingPoolConfig.poolAprWei,
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      stakeConfig.stakeAmountWei
    );

    if (
      stakeConfig.exceedPoolReward ||
      (afterRevoke && stakeConfig.shouldRevokeBeforeClaim)
    ) {
      await expect(
        stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      const stakingPoolStatsForSuspendedStake =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeConfig.stakingPoolConfig.poolId
        );

      expect(stakingPoolStatsForSuspendedStake.totalRewardWei).to.equal(
        totalRewardWei
      );
      expect(stakingPoolStatsForSuspendedStake.totalStakedWei).to.equal(
        totalStakedWei
      );
      expect(
        stakingPoolStatsForSuspendedStake.rewardToBeDistributedWei
      ).to.equal(rewardToBeDistributedWei);

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      return [totalRewardWei, rewardToBeDistributedWei];
    }

    if (isStakeSuspended) {
      const expectRewardForSuspendedStakeWei = hre.ethers.constants.Zero;

      const claimableRewardWeiForSuspendedStake =
        await stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );
      expect(claimableRewardWeiForSuspendedStake).to.equal(
        expectRewardForSuspendedStakeWei
      );

      const stakeInfoForSuspendedStake =
        await stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );
      expect(stakeInfoForSuspendedStake.rewardClaimedWei).to.equal(
        stakeConfig.rewardClaimedWei
      );

      const stakingPoolStatsForSuspendedStake =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeConfig.stakingPoolConfig.poolId
        );

      expect(stakingPoolStatsForSuspendedStake.totalRewardWei).to.equal(
        totalRewardWei
      );
      expect(stakingPoolStatsForSuspendedStake.totalStakedWei).to.equal(
        totalStakedWei
      );
      expect(
        stakingPoolStatsForSuspendedStake.rewardToBeDistributedWei
      ).to.equal(rewardToBeDistributedWei);

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: stake suspended");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: stake suspended");

      return [totalRewardWei, rewardToBeDistributedWei];
    }

    const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
    if (currentBlockTimestamp < expectStakeMaturityTimestamp.toNumber()) {
      const expectRewardBeforeMaturityWei = hre.ethers.constants.Zero;

      const claimableRewardWeiBeforeMaturity =
        await stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );
      expect(claimableRewardWeiBeforeMaturity).to.equal(
        expectRewardBeforeMaturityWei
      );

      const stakeInfoBeforeMaturity =
        await stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );
      expect(stakeInfoBeforeMaturity.stakeAmountWei).to.equal(
        stakeConfig.stakeAmountWei
      );
      expect(stakeInfoBeforeMaturity.stakeTimestamp).to.equal(
        expectStakeTimestamp
      );
      expect(stakeInfoBeforeMaturity.stakeMaturityTimestamp).to.equal(
        expectStakeMaturityTimestamp
      );
      expect(stakeInfoBeforeMaturity.estimatedRewardAtMaturityWei).to.equal(
        expectRewardAtMaturityWei
      );
      expect(stakeInfoBeforeMaturity.rewardClaimedWei).to.equal(
        stakeConfig.rewardClaimedWei
      );

      const stakingPoolStatsBeforeMaturity =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeConfig.stakingPoolConfig.poolId
        );

      expect(stakingPoolStatsBeforeMaturity.totalRewardWei).to.equal(
        totalRewardWei
      );
      expect(stakingPoolStatsBeforeMaturity.totalStakedWei).to.equal(
        totalStakedWei
      );
      expect(stakingPoolStatsBeforeMaturity.rewardToBeDistributedWei).to.equal(
        rewardToBeDistributedWei
      );

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      await testHelpers.mineBlockAtTime(
        expectStakeMaturityTimestamp.toNumber()
      );
    }

    const balanceOfBeforeClaim = await rewardTokenContractInstance.balanceOf(
      signerAddress
    );

    const claimableRewardWeiBeforeClaim =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiBeforeClaim).to.equal(expectRewardAtMaturityWei);

    const stakeInfoBeforeClaim =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoBeforeClaim.stakeAmountWei).to.equal(
      stakeConfig.stakeAmountWei
    );
    expect(stakeInfoBeforeClaim.stakeTimestamp).to.equal(expectStakeTimestamp);
    expect(stakeInfoBeforeClaim.stakeMaturityTimestamp).to.equal(
      expectStakeMaturityTimestamp
    );
    expect(stakeInfoBeforeClaim.estimatedRewardAtMaturityWei).to.equal(
      expectRewardAtMaturityWei
    );
    expect(stakeInfoBeforeClaim.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    const stakingPoolStatsBeforeClaim =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );

    expect(stakingPoolStatsBeforeClaim.totalRewardWei).to.equal(totalRewardWei);
    expect(stakingPoolStatsBeforeClaim.totalStakedWei).to.equal(totalStakedWei);
    expect(stakingPoolStatsBeforeClaim.rewardToBeDistributedWei).to.equal(
      rewardToBeDistributedWei
    );

    const expectBalanceOfAfterClaim = balanceOfBeforeClaim.add(
      expectRewardAtMaturityWei
    );
    const expectClaimableRewardWeiAfterClaim = hre.ethers.constants.Zero;
    const expectTotalRewardWei = totalRewardWei.sub(expectRewardAtMaturityWei);
    const expectRewardToBeDistributedWei = rewardToBeDistributedWei.sub(
      expectRewardAtMaturityWei
    );

    stakeConfig.rewardClaimedWei = stakeConfig.rewardClaimedWei.add(
      expectRewardAtMaturityWei
    );

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .suspendStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolSuspended")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    const claimableRewardWeiForSuspendedPool =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiForSuspendedPool).to.equal(
      expectRewardForSuspendedPoolWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .claimReward(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: pool suspended");

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .resumeStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolResumed")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .claimReward(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingServiceContractInstance, "RewardClaimed")
      .withArgs(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress,
        stakeConfig.stakingPoolConfig.rewardTokenAddress,
        expectRewardAtMaturityWei
      );

    const balanceOfAfterClaim = await rewardTokenContractInstance.balanceOf(
      signerAddress
    );
    expect(balanceOfAfterClaim).to.equal(expectBalanceOfAfterClaim);

    const claimableRewardWeiAfterClaim =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterClaim).to.equal(
      expectClaimableRewardWeiAfterClaim
    );

    await verifyStakesInfo(
      stakingServiceContractInstance,
      startblockTimestamp,
      verifyStakeConfigs,
      true,
      hasClaimed,
      afterRevoke
    );

    const stakingPoolStatsAfterClaim =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsAfterClaim.totalRewardWei).to.equal(
      expectTotalRewardWei
    );
    expect(stakingPoolStatsAfterClaim.rewardToBeDistributedWei).to.equal(
      expectRewardToBeDistributedWei
    );
    expect(stakingPoolStatsAfterClaim.totalStakedWei).to.equal(
      stakingPoolStatsBeforeClaim.totalStakedWei
    );
    expect(stakingPoolStatsAfterClaim.isOpen).to.equal(
      stakingPoolStatsBeforeClaim.isOpen
    );
    expect(stakingPoolStatsAfterClaim.isActive).to.equal(
      stakingPoolStatsBeforeClaim.isActive
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .claimReward(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: zero reward");

    return [expectTotalRewardWei, expectRewardToBeDistributedWei];
  }

  async function removeUnallocatedStakingPoolRewardWithVerify(
    stakingServiceContractInstance,
    adminSigner,
    rewardTokenContractInstance,
    stakingPoolId,
    unallocatedRewardWei,
    expectAdminWalletAddress,
    expectStakingPoolStats
  ) {
    const adminSignerAddress = await adminSigner.getAddress();

    const expectTotalRewardWeiAfterRemove = hre.ethers.constants.Zero;

    for (const poolId in expectStakingPoolStats) {
      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(poolId);
      expect(stakingPoolStatsBeforeRemove.totalRewardWei).to.equal(
        expectStakingPoolStats[poolId].totalRewardWei
      );
      expect(stakingPoolStatsBeforeRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[poolId].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsBeforeRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[poolId].totalStakedWei
      );
    }

    const adminWallet = await stakingServiceContractInstance.adminWallet();
    expect(adminWallet).to.equal(expectAdminWalletAddress);

    const balanceOfContractBeforeRemove =
      await rewardTokenContractInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    const expectBalanceOfContractAfterRemove =
      balanceOfContractBeforeRemove.sub(unallocatedRewardWei);

    const balanceOfAdminWalletBeforeRemove =
      await rewardTokenContractInstance.balanceOf(expectAdminWalletAddress);
    const expectBalanceOfAdminWalletAfterRemove =
      balanceOfAdminWalletBeforeRemove.add(unallocatedRewardWei);

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .removeUnallocatedStakingPoolReward(stakingPoolId)
    )
      .to.emit(stakingServiceContractInstance, "StakingPoolRewardRemoved")
      .withArgs(
        stakingPoolId,
        adminSignerAddress,
        expectAdminWalletAddress,
        rewardTokenContractInstance.address,
        unallocatedRewardWei
      );

    const balanceOfContractAfterRemove =
      await rewardTokenContractInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    expect(balanceOfContractAfterRemove).to.equal(
      expectBalanceOfContractAfterRemove
    );

    const balanceOfAdminWalletAfterRemove =
      await rewardTokenContractInstance.balanceOf(expectAdminWalletAddress);
    expect(balanceOfAdminWalletAfterRemove).to.equal(
      expectBalanceOfAdminWalletAfterRemove
    );

    expectStakingPoolStats[stakingPoolId].totalRewardWei =
      expectStakingPoolStats[stakingPoolId].totalRewardWei.sub(
        unallocatedRewardWei
      );
    expect(expectStakingPoolStats[stakingPoolId].totalRewardWei).to.equal(
      expectTotalRewardWeiAfterRemove
    );

    for (const poolId in expectStakingPoolStats) {
      const stakingPoolStatsAfterRemove =
        await stakingServiceContractInstance.getStakingPoolStats(poolId);
      expect(stakingPoolStatsAfterRemove.totalRewardWei).to.equal(
        expectStakingPoolStats[poolId].totalRewardWei
      );
      expect(stakingPoolStatsAfterRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[poolId].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsAfterRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[poolId].totalStakedWei
      );
    }
  }

  async function resumeStakeWithVerify(
    stakingServiceContractInstance,
    startblockTimestamp,
    stakeConfig,
    adminSigner,
    verifyStakeConfigs,
    hasClaimed,
    afterRevoke
  ) {
    const expectIsActiveBeforeResume = false;
    const expectIsActiveAfterResume = true;

    const stakeSignerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    await verifyStakeInfo(
      stakingServiceContractInstance,
      startblockTimestamp,
      stakeConfig,
      expectIsActiveBeforeResume,
      hasClaimed,
      afterRevoke
    );

    if (stakeConfig.exceedPoolReward) {
      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .resumeStake(stakeConfig.stakingPoolConfig.poolId, stakeSignerAddress)
      ).to.be.revertedWith("SSvcs: uninitialized");

      await verifyStakesInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        verifyStakeConfigs,
        expectIsActiveAfterResume,
        hasClaimed,
        afterRevoke
      );
    } else {
      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .resumeStake(stakeConfig.stakingPoolConfig.poolId, stakeSignerAddress)
      )
        .to.emit(stakingServiceContractInstance, "StakeResumed")
        .withArgs(
          stakeConfig.stakingPoolConfig.poolId,
          adminSignerAddress,
          stakeSignerAddress
        );

      await verifyStakesInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        verifyStakeConfigs,
        expectIsActiveAfterResume,
        hasClaimed,
        afterRevoke
      );

      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .resumeStake(stakeConfig.stakingPoolConfig.poolId, stakeSignerAddress)
      ).to.be.revertedWith("SSvcs: stake active");

      await verifyStakesInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        verifyStakeConfigs,
        expectIsActiveAfterResume,
        hasClaimed,
        afterRevoke
      );
    }
  }

  async function revokeStakeWithVerify(
    stakingServiceContractInstance,
    adminSigner,
    rewardTokenContractInstance,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei,
    beforeMature,
    hasClaimed,
    afterRevoke
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();
    const hasRevoked = afterRevoke && stakeConfig.shouldRevokeBeforeClaim;

    const expectStakeTimestamp =
      startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );
    const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
      stakeConfig.stakingPoolConfig.poolAprWei,
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      stakeConfig.stakeAmountWei
    );
    const expectRewardAmountWei =
      hasClaimed && stakeConfig.shouldClaim
        ? hre.ethers.constants.Zero
        : expectRewardAtMaturityWei;
    const expectClaimableRewardWei =
      beforeMature || (hasClaimed && stakeConfig.shouldClaim)
        ? hre.ethers.constants.Zero
        : expectRewardAtMaturityWei;

    if (stakeConfig.exceedPoolReward || hasRevoked) {
      await expect(
        stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      const stakingPoolStatsForSuspendedStake =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeConfig.stakingPoolConfig.poolId
        );
      expect(stakingPoolStatsForSuspendedStake.totalRewardWei).to.equal(
        totalRewardWei
      );
      expect(stakingPoolStatsForSuspendedStake.totalStakedWei).to.equal(
        totalStakedWei
      );
      expect(
        stakingPoolStatsForSuspendedStake.rewardToBeDistributedWei
      ).to.equal(rewardToBeDistributedWei);

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .revokeStake(stakeConfig.stakingPoolConfig.poolId, signerAddress)
      ).to.be.revertedWith("SSvcs: uninitialized");

      return [totalStakedWei, rewardToBeDistributedWei];
    }

    const balanceOfBeforeRevoke = await rewardTokenContractInstance.balanceOf(
      signerAddress
    );

    const claimableRewardWeiBeforeRevoke =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiBeforeRevoke).to.equal(expectClaimableRewardWei);

    const stakeInfoBeforeRevoke =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoBeforeRevoke.stakeAmountWei).to.equal(
      stakeConfig.stakeAmountWei
    );
    expect(stakeInfoBeforeRevoke.stakeTimestamp).to.equal(expectStakeTimestamp);
    expect(stakeInfoBeforeRevoke.stakeMaturityTimestamp).to.equal(
      expectStakeMaturityTimestamp
    );
    expect(stakeInfoBeforeRevoke.estimatedRewardAtMaturityWei).to.equal(
      expectRewardAtMaturityWei
    );
    expect(stakeInfoBeforeRevoke.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    const stakingPoolStatsBeforeRevoke =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsBeforeRevoke.totalRewardWei).to.equal(
      totalRewardWei
    );
    expect(stakingPoolStatsBeforeRevoke.totalStakedWei).to.equal(
      totalStakedWei
    );
    expect(stakingPoolStatsBeforeRevoke.rewardToBeDistributedWei).to.equal(
      rewardToBeDistributedWei
    );

    const expectBalanceOfAfterRevoke = balanceOfBeforeRevoke;
    const expectTotalRewardWei = totalRewardWei;
    const expectTotalStakedWei = totalStakedWei.sub(stakeConfig.stakeAmountWei);
    const expectRewardToBeDistributedWei = rewardToBeDistributedWei.sub(
      expectRewardAtMaturityWei.sub(stakeConfig.rewardClaimedWei)
    );

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .revokeStake(stakeConfig.stakingPoolConfig.poolId, signerAddress)
    )
      .to.emit(stakingServiceContractInstance, "StakeRevoked")
      .withArgs(
        stakeConfig.stakingPoolConfig.poolId,
        adminSignerAddress,
        signerAddress,
        stakeConfig.stakingPoolConfig.stakeTokenAddress,
        stakeConfig.stakeAmountWei,
        stakeConfig.stakingPoolConfig.rewardTokenAddress,
        expectRewardAmountWei
      );

    const balanceOfAfterRevoke = await rewardTokenContractInstance.balanceOf(
      signerAddress
    );
    expect(balanceOfAfterRevoke).to.equal(expectBalanceOfAfterRevoke);

    await expect(
      stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .claimReward(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .unstake(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");

    await verifyStakesInfo(
      stakingServiceContractInstance,
      startblockTimestamp,
      verifyStakeConfigs,
      true,
      hasClaimed,
      true
    );

    const stakingPoolStatsAfterClaim =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsAfterClaim.totalRewardWei).to.equal(
      expectTotalRewardWei
    );
    expect(stakingPoolStatsAfterClaim.totalStakedWei).to.equal(
      expectTotalStakedWei
    );
    expect(stakingPoolStatsAfterClaim.rewardToBeDistributedWei).to.equal(
      expectRewardToBeDistributedWei
    );
    expect(stakingPoolStatsAfterClaim.isOpen).to.equal(
      stakingPoolStatsBeforeRevoke.isOpen
    );
    expect(stakingPoolStatsAfterClaim.isActive).to.equal(
      stakingPoolStatsBeforeRevoke.isActive
    );

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .revokeStake(stakeConfig.stakingPoolConfig.poolId, signerAddress)
    ).to.be.revertedWith("SSvcs: uninitialized");

    return [expectTotalStakedWei, expectRewardToBeDistributedWei];
  }

  async function setupStakeConfigs(
    stakingPoolConfigs,
    signers,
    stakes,
    stakingServiceContractInstance,
    rewardTokenContractInstance,
    stakingPoolRewardStats,
    fromWalletSigner
  ) {
    const stakeConfigs = [];
    const totalStakeRewardsWei = {};

    const exceedPoolRewardStakeIndex =
      stakes.length - stakingPoolConfigs.length;

    for (let i = 0; i < stakes.length; i++) {
      const stakingPoolConfigIndex = i % stakingPoolConfigs.length;
      const signerIndex = i % signers.length;

      stakeConfigs.push({
        stakingPoolConfig: stakingPoolConfigs[stakingPoolConfigIndex],
        stakeAmountWei: stakes[i].stakeAmountWei,
        stakeSecondsAfterStartblockTimestamp:
          stakes[i].stakeSecondsAfterStartblockTimestamp,
        signer: signers[signerIndex],
        rewardClaimedWei: hre.ethers.constants.Zero,
        shouldClaim: stakes[i].shouldClaim,
        shouldRevokeBeforeClaim: stakes[i].shouldRevokeBeforeClaim,
        shouldRevokeAfterClaim: stakes[i].shouldRevokeAfterClaim,
        exceedPoolReward: !(i < exceedPoolRewardStakeIndex),
      });

      const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakingPoolConfigs[stakingPoolConfigIndex].poolAprWei,
        stakingPoolConfigs[stakingPoolConfigIndex].stakeDurationDays,
        stakes[i].stakeAmountWei
      );

      if (
        stakingPoolConfigs[stakingPoolConfigIndex].poolId in
        totalStakeRewardsWei
      ) {
        totalStakeRewardsWei[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ] = totalStakeRewardsWei[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ].add(expectRewardAtMaturityWei);
      } else {
        totalStakeRewardsWei[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ] = expectRewardAtMaturityWei;
      }
    }

    let stakingPoolRewardBalanceOf = hre.ethers.constants.Zero;

    for (const poolId in totalStakeRewardsWei) {
      stakingPoolRewardBalanceOf = await addStakingPoolRewardWithVerify(
        stakingServiceContractInstance,
        rewardTokenContractInstance,
        fromWalletSigner,
        poolId,
        stakingPoolRewardBalanceOf,
        stakingPoolRewardStats,
        totalStakeRewardsWei[poolId].sub(hre.ethers.constants.One)
      );
    }

    return stakeConfigs;
  }

  async function stakeWithVerify(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    adminSigner,
    stakeTokenContractInstance,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalStakedWei,
    rewardToBeDistributedWei
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    await expect(
      stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    const stakingPoolStatsBeforeAdd =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsBeforeAdd.totalStakedWei).to.equal(totalStakedWei);
    expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
      rewardToBeDistributedWei
    );

    await testHelpers.transferAndApproveWithVerify(
      stakeTokenContractInstance,
      governanceRoleAccounts[0],
      stakeConfig.signer,
      stakingServiceContractInstance.address,
      stakeConfig.stakeAmountWei
    );

    const expectStakeTimestamp =
      startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );
    const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
      stakeConfig.stakingPoolConfig.poolAprWei,
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      stakeConfig.stakeAmountWei
    );

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .closeStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolClosed")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    await expect(
      stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .stake(stakeConfig.stakingPoolConfig.poolId, stakeConfig.stakeAmountWei)
    ).to.be.revertedWith("SSvcs: closed");

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .openStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolOpened")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    await expect(
      stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await testHelpers.setTimeNextBlock(expectStakeTimestamp);

    let expectTotalStakedWei;
    let expectRewardToBeDistributedWei;

    if (stakeConfig.exceedPoolReward) {
      expectTotalStakedWei = totalStakedWei;
      expectRewardToBeDistributedWei = rewardToBeDistributedWei;

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .stake(
            stakeConfig.stakingPoolConfig.poolId,
            stakeConfig.stakeAmountWei
          )
      ).to.be.revertedWith("SSvcs: insufficient");
    } else {
      expectTotalStakedWei = totalStakedWei.add(stakeConfig.stakeAmountWei);
      expectRewardToBeDistributedWei = rewardToBeDistributedWei.add(
        expectRewardAtMaturityWei
      );

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .stake(
            stakeConfig.stakingPoolConfig.poolId,
            stakeConfig.stakeAmountWei
          )
      )
        .to.emit(stakingServiceContractInstance, "Staked")
        .withArgs(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress,
          stakeConfig.stakingPoolConfig.stakeTokenAddress,
          stakeConfig.stakeAmountWei,
          expectStakeTimestamp,
          expectStakeMaturityTimestamp,
          expectRewardAtMaturityWei
        );
    }

    await verifyStakesInfo(
      stakingServiceContractInstance,
      startblockTimestamp,
      verifyStakeConfigs,
      true,
      false,
      false
    );

    const stakingPoolStatsAfterAdd =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsAfterAdd.totalStakedWei).to.equal(
      expectTotalStakedWei
    );
    expect(stakingPoolStatsAfterAdd.rewardToBeDistributedWei).to.equal(
      expectRewardToBeDistributedWei
    );
    expect(stakingPoolStatsAfterAdd.totalRewardWei).to.equal(
      stakingPoolStatsBeforeAdd.totalRewardWei
    );
    expect(stakingPoolStatsAfterAdd.isOpen).to.equal(
      stakingPoolStatsBeforeAdd.isOpen
    );
    expect(stakingPoolStatsAfterAdd.isActive).to.equal(
      stakingPoolStatsBeforeAdd.isActive
    );

    if (stakeConfig.exceedPoolReward) {
      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");
    } else {
      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");
    }

    return [expectTotalStakedWei, expectRewardToBeDistributedWei];
  }

  async function suspendStakeWithVerify(
    stakingServiceContractInstance,
    startblockTimestamp,
    stakeConfig,
    adminSigner,
    verifyStakeConfigs,
    hasClaimed,
    afterRevoke
  ) {
    const expectIsActiveBeforeSuspend = true;
    const expectIsActiveAfterSuspend = false;

    const stakeSignerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    await verifyStakeInfo(
      stakingServiceContractInstance,
      startblockTimestamp,
      stakeConfig,
      expectIsActiveBeforeSuspend,
      hasClaimed,
      afterRevoke
    );

    if (stakeConfig.exceedPoolReward) {
      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .suspendStake(
            stakeConfig.stakingPoolConfig.poolId,
            stakeSignerAddress
          )
      ).to.be.revertedWith("SSvcs: uninitialized");

      await verifyStakesInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        verifyStakeConfigs,
        expectIsActiveAfterSuspend,
        hasClaimed,
        afterRevoke
      );
    } else {
      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .suspendStake(
            stakeConfig.stakingPoolConfig.poolId,
            stakeSignerAddress
          )
      )
        .to.emit(stakingServiceContractInstance, "StakeSuspended")
        .withArgs(
          stakeConfig.stakingPoolConfig.poolId,
          adminSignerAddress,
          stakeSignerAddress
        );

      await verifyStakesInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        verifyStakeConfigs,
        expectIsActiveAfterSuspend,
        hasClaimed,
        afterRevoke
      );

      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .suspendStake(
            stakeConfig.stakingPoolConfig.poolId,
            stakeSignerAddress
          )
      ).to.be.revertedWith("SSvcs: stake suspended");

      await verifyStakesInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        verifyStakeConfigs,
        expectIsActiveAfterSuspend,
        hasClaimed,
        afterRevoke
      );
    }
  }

  async function testAddStakingPoolReward(
    stakingServiceContractInstance,
    rewardTokenContractInstance,
    stakingPoolRewardConfigs,
    signers,
    stakingPoolRewardBalanceOf,
    stakingPoolRewardStats,
    expectAbleToAddReward
  ) {
    for (let i = 0; i < stakingPoolRewardConfigs.length; i++) {
      const signerIndex = i % signers.length;
      const signerAddress = await signers[signerIndex].getAddress();

      if (expectAbleToAddReward) {
        stakingPoolRewardBalanceOf = await addStakingPoolRewardWithVerify(
          stakingServiceContractInstance,
          rewardTokenContractInstance,
          signers[signerIndex],
          stakingPoolRewardConfigs[i].poolId,
          stakingPoolRewardBalanceOf,
          stakingPoolRewardStats,
          stakingPoolRewardConfigs[i].rewardAmountWei
        );
      } else {
        if (!(stakingPoolRewardConfigs[i].poolId in stakingPoolRewardStats)) {
          stakingPoolRewardStats[stakingPoolRewardConfigs[i].poolId] = {
            totalRewardWei: hre.ethers.constants.Zero,
            rewardToBeDistributedWei: hre.ethers.constants.Zero,
          };
        }

        const expectBalanceOfBeforeAdd = stakingPoolRewardBalanceOf;
        const expectTotalRewardWeiBeforeAdd =
          stakingPoolRewardStats[stakingPoolRewardConfigs[i].poolId]
            .totalRewardWei;
        const expectRewardToBeDistributedWeiBeforeAdd =
          stakingPoolRewardStats[stakingPoolRewardConfigs[i].poolId]
            .rewardToBeDistributedWei;

        const balanceOfBeforeAdd = await rewardTokenContractInstance.balanceOf(
          stakingServiceContractInstance.address
        );
        expect(balanceOfBeforeAdd).to.equal(expectBalanceOfBeforeAdd);

        const stakingPoolStatsBeforeAdd =
          await stakingServiceContractInstance.getStakingPoolStats(
            stakingPoolRewardConfigs[i].poolId
          );
        expect(stakingPoolStatsBeforeAdd.totalRewardWei).to.equal(
          expectTotalRewardWeiBeforeAdd
        );
        expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
          expectRewardToBeDistributedWeiBeforeAdd
        );

        await expect(
          stakingServiceContractInstance
            .connect(signers[signerIndex])
            .addStakingPoolReward(
              stakingPoolRewardConfigs[i].poolId,
              stakingPoolRewardConfigs[i].rewardAmountWei
            )
        ).to.be.revertedWith(
          `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`
        );

        const balanceOfAfterAdd = await rewardTokenContractInstance.balanceOf(
          stakingServiceContractInstance.address
        );
        expect(balanceOfAfterAdd).to.equal(expectBalanceOfBeforeAdd);

        const stakingPoolStatsAfterAdd =
          await stakingServiceContractInstance.getStakingPoolStats(
            stakingPoolRewardConfigs[i].poolId
          );
        expect(stakingPoolStatsAfterAdd.totalRewardWei).to.equal(
          expectTotalRewardWeiBeforeAdd
        );
        expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
          expectRewardToBeDistributedWeiBeforeAdd
        );
      }
    }

    return stakingPoolRewardBalanceOf;
  }

  async function testRemoveUnallocatedStakingPoolReward(
    stakingServiceContractInstance,
    rewardTokenContractInstance,
    expectStakingPoolStats,
    stakeConfigs,
    stakingPoolConfigs,
    adminSigner
  ) {
    const unallocatedRewardsWei = {};
    const revokedStakesWei = {};
    const totalRevokedStakesWei = {};

    for (let i = 0; i < stakeConfigs.length; i++) {
      if (
        stakeConfigs[i].exceedPoolReward ||
        stakeConfigs[i].shouldRevokeBeforeClaim ||
        stakeConfigs[i].shouldRevokeAfterClaim
      ) {
        const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
          stakeConfigs[i].stakingPoolConfig.poolAprWei,
          stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
          stakeConfigs[i].stakeAmountWei
        );
        const expectUnallocatedRewardWei = expectRewardAtMaturityWei.sub(
          stakeConfigs[i].rewardClaimedWei
        );

        if (stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei) {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId].add(
              expectUnallocatedRewardWei
            );
        } else {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            expectUnallocatedRewardWei;
        }

        if (stakeConfigs[i].exceedPoolReward) {
          if (
            !(
              stakeConfigs[i].stakingPoolConfig.stakeTokenAddress in
              totalRevokedStakesWei
            )
          ) {
            totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenAddress
            ] = hre.ethers.constants.Zero;
          }
        } else {
          if (stakeConfigs[i].stakingPoolConfig.poolId in revokedStakesWei) {
            revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId] =
              revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId].add(
                stakeConfigs[i].stakeAmountWei
              );
          } else {
            revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId] =
              stakeConfigs[i].stakeAmountWei;
          }

          if (
            stakeConfigs[i].stakingPoolConfig.stakeTokenAddress in
            totalRevokedStakesWei
          ) {
            totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenAddress
            ] = totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenAddress
            ].add(stakeConfigs[i].stakeAmountWei);
          } else {
            totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenAddress
            ] = stakeConfigs[i].stakeAmountWei;
          }
        }
      }
    }

    for (const poolId in unallocatedRewardsWei) {
      await removeUnallocatedStakingPoolRewardWithVerify(
        stakingServiceContractInstance,
        adminSigner,
        rewardTokenContractInstance,
        poolId,
        unallocatedRewardsWei[poolId].sub(hre.ethers.constants.One),
        await governanceRoleAccounts[0].getAddress(),
        expectStakingPoolStats
      );
    }

    for (const stakingPoolId in unallocatedRewardsWei) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === stakingPoolId
      );

      const expectBalanceOfContractAfterRemove =
        stakingPoolConfig.stakeTokenAddress ===
        stakingPoolConfig.rewardTokenAddress
          ? totalRevokedStakesWei[stakingPoolConfig.stakeTokenAddress]
          : hre.ethers.constants.Zero;

      const balanceOfContractAfterRemove =
        await stakeRewardToken18DecimalsInstance.balanceOf(
          stakingServiceInstance.address
        );

      expect(balanceOfContractAfterRemove).to.equal(
        expectBalanceOfContractAfterRemove
      );
    }
  }

  async function testSetStakingPoolContract(
    contractInstance,
    signers,
    expectStakingPoolContractBeforeSet,
    expectStakingPoolContractAfterSet,
    expectAbleToSetStakingPoolContract
  ) {
    const stakingPoolContractBeforeSet =
      await contractInstance.stakingPoolContract();
    expect(stakingPoolContractBeforeSet).to.equal(
      expectStakingPoolContractBeforeSet
    );

    for (let i = 0; i < signers.length; i++) {
      const signerAddress = await signers[i].getAddress();

      if (expectAbleToSetStakingPoolContract) {
        await expect(
          contractInstance
            .connect(signers[i])
            .setStakingPoolContract(expectStakingPoolContractAfterSet)
        )
          .to.emit(contractInstance, "StakingPoolContractChanged")
          .withArgs(
            expectStakingPoolContractBeforeSet,
            expectStakingPoolContractAfterSet,
            signerAddress
          );

        const stakingPoolContractAfterSet =
          await contractInstance.stakingPoolContract();
        expect(stakingPoolContractAfterSet).to.equal(
          expectStakingPoolContractAfterSet
        );

        await expect(
          contractInstance
            .connect(signers[i])
            .setStakingPoolContract(expectStakingPoolContractBeforeSet)
        )
          .to.emit(contractInstance, "StakingPoolContractChanged")
          .withArgs(
            expectStakingPoolContractAfterSet,
            expectStakingPoolContractBeforeSet,
            signerAddress
          );

        const stakingPoolContractAfterRestore =
          await contractInstance.stakingPoolContract();
        expect(stakingPoolContractAfterRestore).to.equal(
          expectStakingPoolContractBeforeSet
        );
      } else {
        await expect(
          contractInstance
            .connect(signers[i])
            .setStakingPoolContract(expectStakingPoolContractAfterSet)
        ).to.be.revertedWith(
          `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
            testHelpers.GOVERNANCE_ROLE
          }`
        );

        const stakingPoolContractAfterSetFail =
          await contractInstance.stakingPoolContract();
        expect(stakingPoolContractAfterSetFail).to.equal(
          expectStakingPoolContractBeforeSet
        );
      }
    }
  }

  async function testStakeClaimUnstake(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    stakeTokenContractInstance,
    rewardTokenContractInstance,
    stakingPoolRewardStats,
    stakeConfigs,
    adminSigner
  ) {
    const expectStakingPoolStats = {};

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (!(poolId in expectStakingPoolStats)) {
        expectStakingPoolStats[poolId] = {
          totalRewardWei: stakingPoolRewardStats[poolId].totalRewardWei,
          totalStakedWei: hre.ethers.constants.Zero,
          rewardToBeDistributedWei:
            stakingPoolRewardStats[poolId].rewardToBeDistributedWei,
        };
      }

      [
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
      ] = await stakeWithVerify(
        stakingServiceContractInstance,
        stakingPoolContractInstance,
        adminSigner,
        stakeTokenContractInstance,
        stakeConfigs[i],
        startblockTimestamp,
        stakeConfigs.slice(0, i + 1),
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      await suspendStakeWithVerify(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeConfigs[i],
        adminSigner,
        stakeConfigs.slice(0, i + 1),
        true,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      [
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
      ] = await claimRewardWithVerify(
        stakingServiceContractInstance,
        stakingPoolContractInstance,
        adminSigner,
        rewardTokenContractInstance,
        stakeConfigs[i],
        startblockTimestamp,
        stakeConfigs.slice(0, i + 1),
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        true,
        false,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      await resumeStakeWithVerify(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeConfigs[i],
        adminSigner,
        stakeConfigs.slice(0, i + 1),
        true,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldRevokeBeforeClaim) {
        [
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        ] = await revokeStakeWithVerify(
          stakingServiceContractInstance,
          adminSigner,
          rewardTokenContractInstance,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          true,
          false,
          false
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldClaim) {
        [
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        ] = await claimRewardWithVerify(
          stakingServiceContractInstance,
          stakingPoolContractInstance,
          adminSigner,
          rewardTokenContractInstance,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          false,
          false,
          true
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldRevokeAfterClaim) {
        [
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        ] = await revokeStakeWithVerify(
          stakingServiceContractInstance,
          adminSigner,
          rewardTokenContractInstance,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          false,
          true,
          true
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      [
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
      ] = await unstakeWithVerify(
        stakingServiceContractInstance,
        stakingPoolContractInstance,
        adminSigner,
        rewardTokenContractInstance,
        stakeTokenContractInstance,
        stakeConfigs[i],
        startblockTimestamp,
        stakeConfigs.slice(0, i + 1),
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei
      );
    }

    return expectStakingPoolStats;
  }

  async function unstakeWithVerify(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    adminSigner,
    rewardTokenContractInstance,
    stakeTokenContractInstance,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    const expectRewardBeforeMaturityWei = hre.ethers.constants.Zero;
    const expectRewardAfterStakeSuspendedWei = hre.ethers.constants.Zero;
    const expectRewardAfterPoolSuspendedWei = hre.ethers.constants.Zero;

    if (
      stakeConfig.exceedPoolReward ||
      stakeConfig.shouldRevokeBeforeClaim ||
      stakeConfig.shouldRevokeAfterClaim
    ) {
      await expect(
        stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      await verifyUninitializedStakeInfo(
        stakingServiceContractInstance,
        verifyStakeConfigs
      );

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      const stakingPoolStatsBeforeUnstake =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeConfig.stakingPoolConfig.poolId
        );

      expect(stakingPoolStatsBeforeUnstake.totalRewardWei).to.equal(
        totalRewardWei
      );
      expect(stakingPoolStatsBeforeUnstake.totalStakedWei).to.equal(
        totalStakedWei
      );
      expect(stakingPoolStatsBeforeUnstake.rewardToBeDistributedWei).to.equal(
        rewardToBeDistributedWei
      );
      expect(stakingPoolStatsBeforeUnstake.isOpen).to.equal(
        stakingPoolStatsBeforeUnstake.isOpen
      );
      expect(stakingPoolStatsBeforeUnstake.isActive).to.equal(
        stakingPoolStatsBeforeUnstake.isActive
      );

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      return [totalRewardWei, totalStakedWei, rewardToBeDistributedWei];
    }

    const expectStakeTimestamp =
      startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );
    const expectRewardAtMaturityWei = stakeConfig.shouldClaim
      ? hre.ethers.constants.Zero
      : estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          stakeConfig.stakeAmountWei
        );

    const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
    if (currentBlockTimestamp < expectStakeMaturityTimestamp.toNumber()) {
      const claimableRewardWeiAfterPoolResumed =
        await stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );
      expect(claimableRewardWeiAfterPoolResumed).to.equal(
        expectRewardBeforeMaturityWei
      );

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      await testHelpers.mineBlockAtTime(
        expectStakeMaturityTimestamp.toNumber()
      );
    }

    const balanceOfRewardTokenBeforeUnstake =
      await rewardTokenContractInstance.balanceOf(signerAddress);
    const balanceOfStakeTokenBeforeUnstake =
      await stakeTokenContractInstance.balanceOf(signerAddress);

    const claimableRewardWeiBeforeUnstake =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiBeforeUnstake).to.equal(expectRewardAtMaturityWei);

    const stakeInfoBeforeUnstake =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoBeforeUnstake.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    const stakingPoolStatsBeforeUnstake =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );

    expect(stakingPoolStatsBeforeUnstake.totalRewardWei).to.equal(
      totalRewardWei
    );
    expect(stakingPoolStatsBeforeUnstake.totalStakedWei).to.equal(
      totalStakedWei
    );
    expect(stakingPoolStatsBeforeUnstake.rewardToBeDistributedWei).to.equal(
      rewardToBeDistributedWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .suspendStake(stakeConfig.stakingPoolConfig.poolId, signerAddress)
    )
      .to.emit(stakingServiceContractInstance, "StakeSuspended")
      .withArgs(
        stakeConfig.stakingPoolConfig.poolId,
        adminSignerAddress,
        signerAddress
      );

    const claimableRewardWeiAfterStakeSuspended =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterStakeSuspended).to.equal(
      expectRewardAfterStakeSuspendedWei
    );

    const stakeInfoAfterStakeSuspended =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoAfterStakeSuspended.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    const stakingPoolStatsAfterStakeSuspended =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsAfterStakeSuspended.totalRewardWei).to.equal(
      totalRewardWei
    );
    expect(stakingPoolStatsAfterStakeSuspended.totalStakedWei).to.equal(
      totalStakedWei
    );
    expect(
      stakingPoolStatsAfterStakeSuspended.rewardToBeDistributedWei
    ).to.equal(rewardToBeDistributedWei);

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .unstake(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: stake suspended");

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .resumeStake(stakeConfig.stakingPoolConfig.poolId, signerAddress)
    )
      .to.emit(stakingServiceContractInstance, "StakeResumed")
      .withArgs(
        stakeConfig.stakingPoolConfig.poolId,
        adminSignerAddress,
        signerAddress
      );

    const claimableRewardWeiAfterStakeResumed =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterStakeResumed).to.equal(
      expectRewardAtMaturityWei
    );

    const stakeInfoAfterStakeResumed =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoAfterStakeResumed.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    const stakingPoolStatsAfterStakeResumed =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsAfterStakeResumed.totalRewardWei).to.equal(
      totalRewardWei
    );
    expect(stakingPoolStatsAfterStakeResumed.totalStakedWei).to.equal(
      totalStakedWei
    );
    expect(stakingPoolStatsAfterStakeResumed.rewardToBeDistributedWei).to.equal(
      rewardToBeDistributedWei
    );

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .suspendStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolSuspended")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    const claimableRewardWeiAfterPoolSuspended =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterPoolSuspended).to.equal(
      expectRewardAfterPoolSuspendedWei
    );

    const stakeInfoAfterPoolSuspended =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoAfterPoolSuspended.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .unstake(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: pool suspended");

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .resumeStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolResumed")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    const claimableRewardWeiAfterPoolResumed =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterPoolResumed).to.equal(
      expectRewardAtMaturityWei
    );

    const stakeInfoAfterPoolResumed =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoAfterPoolResumed.rewardClaimedWei).to.equal(
      stakeConfig.rewardClaimedWei
    );

    const expectUnstakeAmountWei = stakeConfig.stakeAmountWei;
    // const expectClaimableRewardWeiAfterUnstake = hre.ethers.constants.Zero;
    const expectTotalRewardWei = totalRewardWei.sub(expectRewardAtMaturityWei);
    const expectTotalStakedWei = totalStakedWei.sub(expectUnstakeAmountWei);
    const expectRewardToBeDistributedWei = rewardToBeDistributedWei.sub(
      expectRewardAtMaturityWei
    );

    stakeConfig.rewardClaimedWei = stakeConfig.rewardClaimedWei.add(
      expectRewardAtMaturityWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .unstake(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingServiceContractInstance, "Unstaked")
      .withArgs(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress,
        stakeConfig.stakingPoolConfig.stakeTokenAddress,
        expectUnstakeAmountWei,
        stakeConfig.stakingPoolConfig.rewardTokenAddress,
        expectRewardAtMaturityWei
      );

    if (
      stakeConfig.stakingPoolConfig.stakeTokenAddress ===
      stakeConfig.stakingPoolConfig.rewardTokenAddress
    ) {
      const expectBalanceOfStakeRewardTokenAfterUnstake =
        balanceOfRewardTokenBeforeUnstake.add(
          expectRewardAtMaturityWei.add(expectUnstakeAmountWei)
        );

      const balanceOfStakeRewardTokenAfterUnstake =
        await rewardTokenContractInstance.balanceOf(signerAddress);
      expect(balanceOfStakeRewardTokenAfterUnstake).to.equal(
        expectBalanceOfStakeRewardTokenAfterUnstake
      );
    } else {
      const expectBalanceOfRewardTokenAfterUnstake =
        balanceOfRewardTokenBeforeUnstake.add(expectRewardAtMaturityWei);
      const expectBalanceOfStakeTokenAfterUnstake =
        balanceOfStakeTokenBeforeUnstake.add(expectUnstakeAmountWei);

      const balanceOfRewardTokenAfterUnstake =
        await rewardTokenContractInstance.balanceOf(signerAddress);
      expect(balanceOfRewardTokenAfterUnstake).to.equal(
        expectBalanceOfRewardTokenAfterUnstake
      );

      const balanceOfStakeTokenAfterUnstake =
        await stakeTokenContractInstance.balanceOf(signerAddress);
      expect(balanceOfStakeTokenAfterUnstake).to.equal(
        expectBalanceOfStakeTokenAfterUnstake
      );
    }

    await expect(
      stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await verifyUninitializedStakeInfo(
      stakingServiceContractInstance,
      verifyStakeConfigs
    );

    const stakingPoolStatsAfterUnstake =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsAfterUnstake.totalRewardWei).to.equal(
      expectTotalRewardWei
    );
    expect(stakingPoolStatsAfterUnstake.totalStakedWei).to.equal(
      expectTotalStakedWei
    );
    expect(stakingPoolStatsAfterUnstake.rewardToBeDistributedWei).to.equal(
      expectRewardToBeDistributedWei
    );
    expect(stakingPoolStatsAfterUnstake.isOpen).to.equal(
      stakingPoolStatsBeforeUnstake.isOpen
    );
    expect(stakingPoolStatsAfterUnstake.isActive).to.equal(
      stakingPoolStatsBeforeUnstake.isActive
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .claimReward(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .unstake(stakeConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");

    return [
      expectTotalRewardWei,
      expectTotalStakedWei,
      expectRewardToBeDistributedWei,
    ];
  }

  async function verifyStakeInfo(
    stakingServiceContractInstance,
    startblockTimestamp,
    stakeConfig,
    expectIsActive,
    hasClaimed,
    afterRevoke
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const isRevoked = afterRevoke
      ? hasClaimed
        ? stakeConfig.shouldRevokeAfterClaim
        : stakeConfig.shouldRevokeBeforeClaim
      : false;

    if (stakeConfig.exceedPoolReward || isRevoked) {
      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");
    } else {
      const expectStakeTimestamp =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
      const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        expectStakeTimestamp
      );
      const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakeConfig.stakingPoolConfig.poolAprWei,
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        stakeConfig.stakeAmountWei
      );

      const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

      expect(stakeInfo.stakeAmountWei).to.equal(stakeConfig.stakeAmountWei);
      expect(stakeInfo.stakeTimestamp).to.equal(expectStakeTimestamp);
      expect(stakeInfo.stakeMaturityTimestamp).to.equal(
        expectStakeMaturityTimestamp
      );
      expect(stakeInfo.estimatedRewardAtMaturityWei).to.equal(
        expectRewardAtMaturityWei
      );
      expect(stakeInfo.rewardClaimedWei).to.equal(stakeConfig.rewardClaimedWei);
      expect(stakeInfo.isActive).to.equal(expectIsActive);
    }
  }

  async function verifyStakesInfo(
    stakingServiceContractInstance,
    startblockTimestamp,
    stakeConfigs,
    expectIsActive,
    hasClaimed,
    afterRevoke
  ) {
    for (let i = 0; i < stakeConfigs.length; i++) {
      await verifyStakeInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeConfigs[i],
        expectIsActive,
        hasClaimed,
        afterRevoke
      );
    }
  }

  async function verifyUninitializedStakeInfo(
    stakingServiceContractInstance,
    stakeConfigs
  ) {
    for (let i = 0; i < stakeConfigs.length; i++) {
      const signerAddress = await stakeConfigs[i].signer.getAddress();

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfigs[i].stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");
    }
  }

  function calculateStateMaturityTimestamp(stakeDurationDays, stakeTimestamp) {
    return testHelpers.BN_SECONDS_IN_DAYS.mul(stakeDurationDays).add(
      stakeTimestamp
    );
  }

  function estimateRewardAtMaturityWei(
    poolAprWei,
    stakeDurationDays,
    stakeAmountWei
  ) {
    return stakeAmountWei
      .mul(poolAprWei)
      .mul(stakeDurationDays)
      .div(testHelpers.BN_DAYS_IN_YEAR.mul(testHelpers.BN_PERCENT_100_WEI));
  }
});
