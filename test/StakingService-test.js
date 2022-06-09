const { expect } = require("chai");
const hre = require("hardhat");
// const timeMachine = require("ganache-time-traveler");
const testHelpers = require("./test-helpers.js");
const stakeHelpers = require("./stake-helpers.js");

describe("StakingService", function () {
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
  let unusedRoleAccounts;

  let libUnitConverterInstance;

  let rewardToken18DecimalsInstances;
  let stakeRewardToken18DecimalsInstances;
  let stakeToken18DecimalsInstances;
  let stakingPoolInstance;
  let stakingServiceInstance;

  let stakingPoolStakeRewardTokenSameConfigs;
  let stakingPoolsRewardBalanceOf;
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
      rewardToken18DecimalsInstances,
      stakeToken18DecimalsInstances,
      stakeRewardToken18DecimalsInstances,
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      stakingPoolsRewardBalanceOf,
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

  it("Should be initialized correctly", async () => {
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
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("Should not allow initialization of zero staking pool address", async () => {
    await expect(
      stakeHelpers.newStakingService(
        libUnitConverterInstance.address,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: staking pool");
  });

  it("Should only allow default admin role to grant and revoke roles", async () => {
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
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[1].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[1].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[2].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[2].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[3].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[3].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[4].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[4].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[5].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[5].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[6].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[6].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[7].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[7].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[8].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[8].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[9].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[9].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[10].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[10].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[11].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[11].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[12].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[12].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[13].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[13].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[14].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[14].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[15].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[15].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[16].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[16].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[17].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[17].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[18].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[18].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[19].poolId,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[19].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
    ];

    const stakingPoolRewardStats = {};

    await testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      governanceRoleAccounts.slice(0, 1),
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      true
    );

    await testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      governanceRoleAccounts.slice(1),
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      false
    );

    await testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      contractAdminRoleAccounts,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      true
    );

    await testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      enduserAccounts,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      false
    );
  });

  it("Should be able to stake, claim reward and unstake", async () => {
    const expectStakes = [
      {
        stakeAmountWei: hre.ethers.utils.parseEther("562896.53017638"),
        stakeSecondsAfterStartblockTimestamp: 10,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("94880.38757420"),
        stakeSecondsAfterStartblockTimestamp: 143,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5764.57794068"),
        stakeSecondsAfterStartblockTimestamp: 279,
        addStakeAmountWei: hre.ethers.utils.parseEther("6216.90935019"),
        addStakeSecondsAfterStartblockTimestamp: 2433,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5279.76920273"),
        stakeSecondsAfterStartblockTimestamp: 415,
        addStakeAmountWei: hre.ethers.utils.parseEther("79149.44093680"),
        addStakeSecondsAfterStartblockTimestamp: 2667,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("3189.47044271"),
        stakeSecondsAfterStartblockTimestamp: 548,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("7846.8168352"),
        stakeSecondsAfterStartblockTimestamp: 679,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("4895.31994040"),
        stakeSecondsAfterStartblockTimestamp: 810,
        addStakeAmountWei: hre.ethers.utils.parseEther("22520.66832642"),
        addStakeSecondsAfterStartblockTimestamp: 2827,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("1056.52266119"),
        stakeSecondsAfterStartblockTimestamp: 946,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("1140.20926502"),
        stakeSecondsAfterStartblockTimestamp: 1077,
        addStakeAmountWei: hre.ethers.utils.parseEther("53039.67090266"),
        addStakeSecondsAfterStartblockTimestamp: 3015,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5977.5179946"),
        stakeSecondsAfterStartblockTimestamp: 1189,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("2248.32691972"),
        stakeSecondsAfterStartblockTimestamp: 1348,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5645.14307150"),
        stakeSecondsAfterStartblockTimestamp: 1486,
        addStakeAmountWei: hre.ethers.utils.parseEther("60301.34379948"),
        addStakeSecondsAfterStartblockTimestamp: 3217,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("7834.10340079"),
        stakeSecondsAfterStartblockTimestamp: 1523,
        addStakeAmountWei: hre.ethers.utils.parseEther("12550.11801626"),
        addStakeSecondsAfterStartblockTimestamp: 3448,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5701.40825578"),
        stakeSecondsAfterStartblockTimestamp: 1756,
        addStakeAmountWei: hre.ethers.utils.parseEther("43494.73394597"),
        addStakeSecondsAfterStartblockTimestamp: 3662,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("6253.78681137"),
        stakeSecondsAfterStartblockTimestamp: 1833,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("731.63201142"),
        stakeSecondsAfterStartblockTimestamp: 1969,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("907.23582828"),
        stakeSecondsAfterStartblockTimestamp: 2107,
        addStakeAmountWei: hre.ethers.utils.parseEther("33808.91088145"),
        addStakeSecondsAfterStartblockTimestamp: 3792,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("41.87133677"),
        stakeSecondsAfterStartblockTimestamp: 2242,
        addStakeAmountWei: hre.ethers.utils.parseEther("11394.6516797"),
        addStakeSecondsAfterStartblockTimestamp: 3957,
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
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      governanceRoleAccounts[0]
    );

    const stakingPoolStats = await testStakeClaimUnstake(
      stakingServiceInstance,
      stakingPoolInstance,
      stakingPoolRewardStats,
      stakeConfigs,
      contractAdminRoleAccounts[0]
    );

    await testRemoveUnallocatedStakingPoolReward(
      stakingServiceInstance,
      stakingPoolStats,
      stakeConfigs,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts[0],
      true
    );

    const allTokenInstances = rewardToken18DecimalsInstances.concat(
      stakeRewardToken18DecimalsInstances,
      stakeToken18DecimalsInstances
    );

    console.log(`allTokenInstances.length=${allTokenInstances.length}`);

    for (let i = 0; i < allTokenInstances.length; i++) {
      const balanceOfContractAfterRemove = await allTokenInstances[i].balanceOf(
        stakingServiceInstance.address
      );

      console.log(
        `${i}: tokenAddress=${allTokenInstances[i].address}, balanceOfContractAfterRemove=${balanceOfContractAfterRemove}`
      );

      expect(balanceOfContractAfterRemove).to.be.closeTo(
        hre.ethers.constants.Zero,
        2
      );
    }
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

  it("Should not allow add staking pool reward for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );
    const rewardAmountWei = hre.ethers.utils.parseEther("6917.15942393");

    await expect(
      stakingServiceInstance.addStakingPoolReward(
        uninitializedPoolId,
        rewardAmountWei
      )
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("Should not allow remove revoked stakes for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.removeRevokedStakes(uninitializedPoolId)
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("Should not allow remove revoked stakes when no revoked stakes", async () => {
    await expect(
      stakingServiceInstance.removeRevokedStakes(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId
      )
    ).to.be.revertedWith("SSvcs: no revoked");
  });

  it("Should not allow remove unallocated staking pool reward for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.removeUnallocatedStakingPoolReward(
        uninitializedPoolId
      )
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("Should not allow remove unallocated staking pool reward when no unallocated reward", async () => {
    await expect(
      stakingServiceInstance.removeUnallocatedStakingPoolReward(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId
      )
    ).to.be.revertedWith("SSvcs: no unallocated");
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
    const enduserAccountAddress = await enduserAccounts[0].getAddress();

    await expect(
      stakingServiceInstance.getClaimableRewardWei(
        uninitializedPoolId,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");
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
    const enduserAccountAddress = await enduserAccounts[0].getAddress();

    await expect(
      stakingServiceInstance.getStakeInfo(
        uninitializedPoolId,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");
  });

  it("should not allow get stake info for zero address", async () => {
    await expect(
      stakingServiceInstance.getStakeInfo(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");
  });

  it("should not allow get staking pool stats for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.getStakingPoolStats(uninitializedPoolId)
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("should not allow stake of zero amount", async () => {
    await expect(
      stakingServiceInstance.stake(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        hre.ethers.constants.Zero
      )
    ).to.be.revertedWith("SSvcs: stake amount");
  });

  it("should not allow stake for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );
    const stakeAmountWei = hre.ethers.utils.parseEther("6917.15942393");

    await expect(
      stakingServiceInstance.stake(uninitializedPoolId, stakeAmountWei)
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("should not allow claim reward for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.claimReward(uninitializedPoolId)
    ).to.be.revertedWith("SPool: uninitialized");
  });

  it("should not allow unstake for uninitialized staking pool", async () => {
    const uninitializedPoolId = hre.ethers.utils.id(
      "da61b654-4973-4879-9166-723c0017dd6d"
    );

    await expect(
      stakingServiceInstance.unstake(uninitializedPoolId)
    ).to.be.revertedWith("SPool: uninitialized");
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

    const rewardTokenDecimals = await rewardTokenContractInstance.decimals();

    const balanceOfBeforeAdd = await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address
    );
    expect(balanceOfBeforeAdd).to.be.closeTo(
      testHelpers.scaleWeiToDecimals(
        expectBalanceOfBeforeAdd,
        rewardTokenDecimals
      ),
      3
    );

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
    expect(balanceOfAfterAdd).to.be.closeTo(
      testHelpers.scaleWeiToDecimals(
        expectBalanceOfAfterAdd,
        rewardTokenDecimals
      ),
      3
    );

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
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei,
    isStakeSuspended,
    hasClaimed,
    afterRevoke,
    isAddStake
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    const expectRewardForSuspendedPoolWei = hre.ethers.constants.Zero;

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);
    const addStakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    let expectStakeAmountWei;
    let expectStakeTimestamp;
    let expectRewardAtMaturityWei;

    if (
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
      !addStakeExceedPoolReward
    ) {
      expectStakeAmountWei = stakeConfig.stakeAmountWei.add(
        stakeConfig.addStakeAmountWei
      );

      expectStakeTimestamp =
        startblockTimestamp +
        stakeConfig.addStakeSecondsAfterStartblockTimestamp;

      expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakeConfig.stakingPoolConfig.poolAprWei,
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        stakeConfig.stakeAmountWei
      ).add(
        estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          stakeConfig.addStakeAmountWei
        )
      );
    } else {
      expectStakeAmountWei = stakeConfig.stakeAmountWei;

      expectStakeTimestamp =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;

      expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakeConfig.stakingPoolConfig.poolAprWei,
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        stakeConfig.stakeAmountWei
      );
    }

    /*
    const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
      stakeConfig.stakingPoolConfig.poolAprWei,
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeAmountWei
    );
    */

    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );

    if (
      stakeExceedPoolReward ||
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
        expectStakeAmountWei
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

    const rewardTokenDecimals =
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.decimals();

    const balanceOfBeforeClaim =
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
        signerAddress
      );

    const claimableRewardWeiBeforeClaim =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiBeforeClaim).to.be.closeTo(
      expectRewardAtMaturityWei,
      1
    );

    const stakeInfoBeforeClaim =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoBeforeClaim.stakeAmountWei).to.equal(expectStakeAmountWei);
    expect(stakeInfoBeforeClaim.stakeTimestamp).to.equal(expectStakeTimestamp);
    expect(stakeInfoBeforeClaim.stakeMaturityTimestamp).to.equal(
      expectStakeMaturityTimestamp
    );
    expect(stakeInfoBeforeClaim.estimatedRewardAtMaturityWei).to.be.closeTo(
      expectRewardAtMaturityWei,
      1
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
      testHelpers.scaleWeiToDecimals(
        expectRewardAtMaturityWei,
        rewardTokenDecimals
      )
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
        stakeConfig.stakingPoolConfig.rewardTokenInstance.address,
        expectRewardAtMaturityWei
      );

    const balanceOfAfterClaim =
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
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
      afterRevoke,
      isAddStake
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

  async function removeRevokedStakesWithVerify(
    stakingServiceContractInstance,
    adminSigner,
    stakeTokenContractInstance,
    stakingPoolId,
    revokedStakesWei,
    expectAdminWalletAddress,
    expectStakingPoolStats
  ) {
    const adminSignerAddress = await adminSigner.getAddress();

    const expectTotalStakedWeiBeforeRemove = hre.ethers.constants.Zero;
    const expectTotalStakedWeiAfterRemove = hre.ethers.constants.Zero;

    for (const poolId in expectStakingPoolStats) {
      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(poolId);
      expect(stakingPoolStatsBeforeRemove.totalRewardWei).to.be.closeTo(
        expectStakingPoolStats[poolId].totalRewardWei,
        1
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

    const stakeTokenDecimals = await stakeTokenContractInstance.decimals();

    const balanceOfContractBeforeRemove =
      await stakeTokenContractInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    const expectBalanceOfContractAfterRemove =
      balanceOfContractBeforeRemove.sub(
        testHelpers.scaleWeiToDecimals(revokedStakesWei, stakeTokenDecimals)
      );

    const balanceOfAdminWalletBeforeRemove =
      await stakeTokenContractInstance.balanceOf(expectAdminWalletAddress);
    const expectBalanceOfAdminWalletAfterRemove =
      balanceOfAdminWalletBeforeRemove.add(
        testHelpers.scaleWeiToDecimals(revokedStakesWei, stakeTokenDecimals)
      );

    expect(expectStakingPoolStats[stakingPoolId].totalStakedWei).to.equal(
      expectTotalStakedWeiBeforeRemove
    );

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .removeRevokedStakes(stakingPoolId)
    )
      .to.emit(stakingServiceContractInstance, "RevokedStakesRemoved")
      .withArgs(
        stakingPoolId,
        adminSignerAddress,
        expectAdminWalletAddress,
        stakeTokenContractInstance.address,
        revokedStakesWei
      );

    const balanceOfContractAfterRemove =
      await stakeTokenContractInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    expect(balanceOfContractAfterRemove).to.equal(
      expectBalanceOfContractAfterRemove
    );

    const balanceOfAdminWalletAfterRemove =
      await stakeTokenContractInstance.balanceOf(expectAdminWalletAddress);
    expect(balanceOfAdminWalletAfterRemove).to.equal(
      expectBalanceOfAdminWalletAfterRemove
    );

    expect(expectStakingPoolStats[stakingPoolId].totalStakedWei).to.equal(
      expectTotalStakedWeiAfterRemove
    );

    for (const poolId in expectStakingPoolStats) {
      const stakingPoolStatsAfterRemove =
        await stakingServiceContractInstance.getStakingPoolStats(poolId);
      expect(stakingPoolStatsAfterRemove.totalRewardWei).to.be.closeTo(
        expectStakingPoolStats[poolId].totalRewardWei,
        1
      );
      expect(stakingPoolStatsAfterRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[poolId].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsAfterRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[poolId].totalStakedWei
      );
    }
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
      expect(stakingPoolStatsBeforeRemove.totalRewardWei).to.be.closeTo(
        expectStakingPoolStats[poolId].totalRewardWei,
        1
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

    const rewardTokenDecimals = await rewardTokenContractInstance.decimals();

    const balanceOfContractBeforeRemove =
      await rewardTokenContractInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    const expectBalanceOfContractAfterRemove =
      balanceOfContractBeforeRemove.sub(
        testHelpers.scaleWeiToDecimals(
          unallocatedRewardWei,
          rewardTokenDecimals
        )
      );

    const balanceOfAdminWalletBeforeRemove =
      await rewardTokenContractInstance.balanceOf(expectAdminWalletAddress);
    const expectBalanceOfAdminWalletAfterRemove =
      balanceOfAdminWalletBeforeRemove.add(
        testHelpers.scaleWeiToDecimals(
          unallocatedRewardWei,
          rewardTokenDecimals
        )
      );

    const expectUnallocatedRewardWei = expectStakingPoolStats[
      stakingPoolId
    ].totalRewardWei.sub(
      expectStakingPoolStats[stakingPoolId].rewardToBeDistributedWei
    );

    expect(unallocatedRewardWei).to.be.closeTo(expectUnallocatedRewardWei, 1);

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
        expectUnallocatedRewardWei
      );

    const balanceOfContractAfterRemove =
      await rewardTokenContractInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    expect(balanceOfContractAfterRemove).to.be.closeTo(
      expectBalanceOfContractAfterRemove,
      1
    );

    const balanceOfAdminWalletAfterRemove =
      await rewardTokenContractInstance.balanceOf(expectAdminWalletAddress);
    expect(balanceOfAdminWalletAfterRemove).to.be.closeTo(
      expectBalanceOfAdminWalletAfterRemove,
      1
    );

    expectStakingPoolStats[stakingPoolId].totalRewardWei =
      expectStakingPoolStats[stakingPoolId].totalRewardWei.sub(
        unallocatedRewardWei
      );
    expect(expectStakingPoolStats[stakingPoolId].totalRewardWei).to.be.closeTo(
      expectTotalRewardWeiAfterRemove,
      1
    );

    for (const poolId in expectStakingPoolStats) {
      const stakingPoolStatsAfterRemove =
        await stakingServiceContractInstance.getStakingPoolStats(poolId);
      expect(stakingPoolStatsAfterRemove.totalRewardWei).to.be.closeTo(
        expectStakingPoolStats[poolId].totalRewardWei,
        1
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
    afterRevoke,
    isAddStake
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
      afterRevoke,
      isAddStake
    );

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    if (stakeExceedPoolReward) {
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
        afterRevoke,
        isAddStake
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
        afterRevoke,
        isAddStake
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
        afterRevoke,
        isAddStake
      );
    }
  }

  async function revokeStakeWithVerify(
    stakingServiceContractInstance,
    adminSigner,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei,
    totalRevokedStakeWei,
    beforeMature,
    hasClaimed,
    afterRevoke,
    isAddStake
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();
    const hasRevoked = afterRevoke && stakeConfig.shouldRevokeBeforeClaim;

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);
    const addStakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    let expectStakeAmountWei;
    let expectStakeTimestamp;

    if (
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
      !addStakeExceedPoolReward
    ) {
      expectStakeAmountWei = stakeConfig.stakeAmountWei.add(
        stakeConfig.addStakeAmountWei
      );

      expectStakeTimestamp =
        startblockTimestamp +
        stakeConfig.addStakeSecondsAfterStartblockTimestamp;
    } else {
      expectStakeAmountWei = stakeConfig.stakeAmountWei;

      expectStakeTimestamp =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    }

    const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
      stakeConfig.stakingPoolConfig.poolAprWei,
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeAmountWei
    );

    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );

    const expectRewardAmountWei =
      hasClaimed && stakeConfig.shouldClaim
        ? hre.ethers.constants.Zero
        : expectRewardAtMaturityWei;
    const expectClaimableRewardWei =
      beforeMature || (hasClaimed && stakeConfig.shouldClaim)
        ? hre.ethers.constants.Zero
        : expectRewardAtMaturityWei;

    if (stakeExceedPoolReward || hasRevoked) {
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
      expect(stakingPoolStatsForSuspendedStake.totalRevokedStakeWei).to.equal(
        totalRevokedStakeWei
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

      await expect(
        stakingServiceContractInstance
          .connect(adminSigner)
          .revokeStake(stakeConfig.stakingPoolConfig.poolId, signerAddress)
      ).to.be.revertedWith("SSvcs: uninitialized");

      return [totalStakedWei, rewardToBeDistributedWei, totalRevokedStakeWei];
    }

    const balanceOfBeforeRevoke =
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
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
    expect(stakeInfoBeforeRevoke.stakeAmountWei).to.equal(expectStakeAmountWei);
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
    expect(stakingPoolStatsBeforeRevoke.totalRevokedStakeWei).to.equal(
      totalRevokedStakeWei
    );

    const expectBalanceOfAfterRevoke = balanceOfBeforeRevoke;
    const expectTotalRewardWei = totalRewardWei;
    const expectTotalStakedWei = totalStakedWei.sub(expectStakeAmountWei);
    const expectRewardToBeDistributedWei = rewardToBeDistributedWei.sub(
      expectRewardAtMaturityWei.sub(stakeConfig.rewardClaimedWei)
    );
    const expectTotalRevokedStakeWei =
      totalRevokedStakeWei.add(expectStakeAmountWei);

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
        stakeConfig.stakingPoolConfig.stakeTokenInstance.address,
        expectStakeAmountWei,
        stakeConfig.stakingPoolConfig.rewardTokenInstance.address,
        expectRewardAmountWei
      );

    /*
    console.log(
      `\nrevokeStakeWithVerify StakeRevoked: poolId=${stakeConfig.stakingPoolConfig.poolId}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAmountWei=${expectRewardAmountWei}, beforeMature=${beforeMature}, hasClaimed=${hasClaimed}, afterRevoke=${afterRevoke}, isAddStake=${isAddStake}`
    );
    */

    const balanceOfAfterRevoke =
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
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
      true,
      isAddStake
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
    expect(stakingPoolStatsAfterClaim.totalRevokedStakeWei).to.equal(
      expectTotalRevokedStakeWei
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

    return [
      expectTotalStakedWei,
      expectRewardToBeDistributedWei,
      expectTotalRevokedStakeWei,
    ];
  }

  async function setupStakeConfigs(
    stakingPoolConfigs,
    signers,
    stakes,
    stakingServiceContractInstance,
    balanceOfStakingPoolRewards,
    stakingPoolRewardStats,
    fromWalletSigner
  ) {
    const stakeConfigs = [];
    const secondsAfterOfLastStakeInPool = {};
    const totalStakeRewardsWei = {};

    for (let i = 0; i < stakes.length; i++) {
      const stakingPoolConfigIndex = i % stakingPoolConfigs.length;
      const signerIndex = i % signers.length;

      stakeConfigs.push({
        stakingPoolConfig: stakingPoolConfigs[stakingPoolConfigIndex],
        stakeAmountWei: stakes[i].stakeAmountWei,
        stakeSecondsAfterStartblockTimestamp:
          stakes[i].stakeSecondsAfterStartblockTimestamp,
        addStakeAmountWei: stakes[i].addStakeAmountWei,
        addStakeSecondsAfterStartblockTimestamp:
          stakes[i].addStakeSecondsAfterStartblockTimestamp,
        signer: signers[signerIndex],
        rewardClaimedWei: hre.ethers.constants.Zero,
        shouldClaim: stakes[i].shouldClaim,
        shouldRevokeBeforeClaim: stakes[i].shouldRevokeBeforeClaim,
        shouldRevokeAfterClaim: stakes[i].shouldRevokeAfterClaim,
        exceedPoolReward: false,
      });

      const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakingPoolConfigs[stakingPoolConfigIndex].poolAprWei,
        stakingPoolConfigs[stakingPoolConfigIndex].stakeDurationDays,
        stakes[i].stakeAmountWei.add(stakes[i].addStakeAmountWei)
      );

      if (
        stakingPoolConfigs[stakingPoolConfigIndex].poolId in
        totalStakeRewardsWei
      ) {
        totalStakeRewardsWei[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ].amountWei = totalStakeRewardsWei[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ].amountWei.add(expectRewardAtMaturityWei);
      } else {
        totalStakeRewardsWei[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ] = {
          amountWei: expectRewardAtMaturityWei,
          rewardTokenInstance:
            stakingPoolConfigs[stakingPoolConfigIndex].rewardTokenInstance,
        };
      }

      const stakeSecondsAfterStartblockTimestamp = stakes[
        i
      ].addStakeAmountWei.gt(hre.ethers.constants.Zero)
        ? stakes[i].addStakeSecondsAfterStartblockTimestamp
        : stakes[i].stakeSecondsAfterStartblockTimestamp;

      if (
        stakingPoolConfigs[stakingPoolConfigIndex].poolId in
        secondsAfterOfLastStakeInPool
      ) {
        if (
          secondsAfterOfLastStakeInPool[
            stakingPoolConfigs[stakingPoolConfigIndex].poolId
          ].stakeSecondsAfterStartblockTimestamp <
          stakeSecondsAfterStartblockTimestamp
        ) {
          secondsAfterOfLastStakeInPool[
            stakingPoolConfigs[stakingPoolConfigIndex].poolId
          ] = {
            stakeSecondsAfterStartblockTimestamp,
            stakeIndex: i,
          };
        }
      } else {
        secondsAfterOfLastStakeInPool[
          stakingPoolConfigs[stakingPoolConfigIndex].poolId
        ] = {
          stakeSecondsAfterStartblockTimestamp,
          stakeIndex: i,
        };
      }
    }

    for (const poolId in secondsAfterOfLastStakeInPool) {
      /*
      console.log(
        `${poolId}: stakeIndex=${secondsAfterOfLastStakeInPool[poolId].stakeIndex}, stakeSecondsAfterStartblockTimestamp=${secondsAfterOfLastStakeInPool[poolId].stakeSecondsAfterStartblockTimestamp}`
      );
      */

      stakeConfigs[
        secondsAfterOfLastStakeInPool[poolId].stakeIndex
      ].exceedPoolReward = true;
    }

    for (const poolId in totalStakeRewardsWei) {
      balanceOfStakingPoolRewards[
        totalStakeRewardsWei[poolId].rewardTokenInstance.address
      ] = await addStakingPoolRewardWithVerify(
        stakingServiceContractInstance,
        totalStakeRewardsWei[poolId].rewardTokenInstance,
        fromWalletSigner,
        poolId,
        balanceOfStakingPoolRewards[
          totalStakeRewardsWei[poolId].rewardTokenInstance.address
        ],
        stakingPoolRewardStats,
        totalStakeRewardsWei[poolId].amountWei.sub(hre.ethers.constants.Two)
      );

      /*
      console.log(
        `${poolId}: balanceOfStakingPoolRewards[${totalStakeRewardsWei[poolId].rewardTokenInstance.address}]=${balanceOfStakingPoolRewards[totalStakeRewardsWei[poolId].rewardTokenInstance.address]}, totalStakeRewardsWei=${totalStakeRewardsWei[poolId]}`
      );
      */
    }

    return stakeConfigs;
  }

  async function verifyStakeInfoClaimableRewardForAddStake(
    stakingServiceContractInstance,
    stakeConfig,
    startblockTimestamp,
    isAddStake
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();

    if (isAddStake) {
      const expectStakeTimestampBeforeAddStake =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
      const expectStakeMaturityTimestampBeforeAddStake =
        calculateStateMaturityTimestamp(
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          expectStakeTimestampBeforeAddStake
        );
      const expectClaimableRewardBeforeAddStakeWei = hre.ethers.constants.Zero;
      const expectEstimatedRewardAtMaturityBeforeAddStakeWei =
        estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          stakeConfig.stakeAmountWei
        );
      const expectIsActiveBeforeAddStake = true;

      const claimableRewardWeiBeforeAddStake =
        await stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );
      expect(claimableRewardWeiBeforeAddStake).to.equal(
        expectClaimableRewardBeforeAddStakeWei
      );

      const stakeInfoBeforeAddStake =
        await stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );

      expect(stakeInfoBeforeAddStake.stakeAmountWei).to.equal(
        stakeConfig.stakeAmountWei
      );
      expect(stakeInfoBeforeAddStake.stakeTimestamp).to.equal(
        expectStakeTimestampBeforeAddStake
      );
      expect(stakeInfoBeforeAddStake.stakeMaturityTimestamp).to.equal(
        expectStakeMaturityTimestampBeforeAddStake
      );
      expect(stakeInfoBeforeAddStake.estimatedRewardAtMaturityWei).to.equal(
        expectEstimatedRewardAtMaturityBeforeAddStakeWei
      );
      expect(stakeInfoBeforeAddStake.rewardClaimedWei).to.equal(
        stakeConfig.rewardClaimedWei
      );
      expect(stakeInfoBeforeAddStake.isActive).to.equal(
        expectIsActiveBeforeAddStake
      );
    } else {
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
    }
  }

  async function stakeWithVerify(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    adminSigner,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalStakedWei,
    rewardToBeDistributedWei,
    isAddStake
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);
    const addStakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    let expectStakeAmountWei;
    let expectStakeTimestamp;

    if (
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero)
    ) {
      expectStakeAmountWei = stakeConfig.addStakeAmountWei;

      expectStakeTimestamp =
        startblockTimestamp +
        stakeConfig.addStakeSecondsAfterStartblockTimestamp;
    } else {
      expectStakeAmountWei = stakeConfig.stakeAmountWei;

      expectStakeTimestamp =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    }

    const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
      stakeConfig.stakingPoolConfig.poolAprWei,
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeAmountWei
    );

    /*
    console.log(
      `stakeWithVerify verifyStakeInfoClaimableRewardForAddStake00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await verifyStakeInfoClaimableRewardForAddStake(
      stakingServiceContractInstance,
      stakeConfig,
      startblockTimestamp,
      isAddStake
    );

    /*
    console.log(
      `stakeWithVerify getStakingPoolStats00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    const stakingPoolStatsBeforeAdd =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeConfig.stakingPoolConfig.poolId
      );
    expect(stakingPoolStatsBeforeAdd.totalStakedWei).to.equal(totalStakedWei);
    expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
      rewardToBeDistributedWei
    );

    /*
    console.log(
      `stakeWithVerify transferAndApproveWithVerify00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await testHelpers.transferAndApproveWithVerify(
      stakeConfig.stakingPoolConfig.stakeTokenInstance,
      governanceRoleAccounts[0],
      stakeConfig.signer,
      stakingServiceContractInstance.address,
      expectStakeAmountWei
    );

    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );

    /*
    console.log(
      `stakeWithVerify closeStakingPool00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .closeStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolClosed")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    /*
    console.log(
      `stakeWithVerify verifyStakeInfoClaimableRewardForAddStake01: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await verifyStakeInfoClaimableRewardForAddStake(
      stakingServiceContractInstance,
      stakeConfig,
      startblockTimestamp,
      isAddStake
    );

    /*
    console.log(
      `stakeWithVerify stake00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .stake(stakeConfig.stakingPoolConfig.poolId, expectStakeAmountWei)
    ).to.be.revertedWith("SSvcs: closed");

    /*
    console.log(
      `stakeWithVerify openStakingPool00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .openStakingPool(stakeConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolOpened")
      .withArgs(stakeConfig.stakingPoolConfig.poolId, adminSignerAddress);

    /*
    console.log(
      `stakeWithVerify verifyStakeInfoClaimableRewardForAddStake02: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await verifyStakeInfoClaimableRewardForAddStake(
      stakingServiceContractInstance,
      stakeConfig,
      startblockTimestamp,
      isAddStake
    );

    /*
    console.log(
      `stakeWithVerify setTimeNextBlock: expectStakeTimestamp=${expectStakeTimestamp}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await testHelpers.setTimeNextBlock(expectStakeTimestamp);

    let expectTotalStakedWei;
    let expectRewardToBeDistributedWei;

    if (stakeExceedPoolReward || addStakeExceedPoolReward) {
      expectTotalStakedWei = totalStakedWei;
      expectRewardToBeDistributedWei = rewardToBeDistributedWei;

      /*
      console.log(
        `stakeWithVerify stake01: isAddStake=${isAddStake}, expectTotalStakedWei=${expectTotalStakedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .stake(stakeConfig.stakingPoolConfig.poolId, expectStakeAmountWei)
      ).to.be.revertedWith("SSvcs: insufficient");
    } else {
      expectTotalStakedWei = totalStakedWei.add(expectStakeAmountWei);
      expectRewardToBeDistributedWei = rewardToBeDistributedWei.add(
        expectRewardAtMaturityWei
      );

      /*
      console.log(
        `stakeWithVerify stake02: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .stake(stakeConfig.stakingPoolConfig.poolId, expectStakeAmountWei)
      )
        .to.emit(stakingServiceContractInstance, "Staked")
        .withArgs(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress,
          stakeConfig.stakingPoolConfig.stakeTokenInstance.address,
          expectStakeAmountWei,
          expectStakeTimestamp,
          expectStakeMaturityTimestamp,
          expectRewardAtMaturityWei
        );
    }

    /*
    console.log(
      `stakeWithVerify verifyStakesInfo00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
        stakeConfig
      )}`
    );
    */

    await verifyStakesInfo(
      stakingServiceContractInstance,
      startblockTimestamp,
      verifyStakeConfigs,
      true,
      isAddStake,
      false,
      isAddStake
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

    if (stakeExceedPoolReward) {
      /*
      console.log(
        `stakeWithVerify claimReward00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      /*
      console.log(
        `stakeWithVerify unstake00: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");
    } else {
      /*
      console.log(
        `stakeWithVerify claimReward01: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      /*
      console.log(
        `stakeWithVerify unstake01: isAddStake=${isAddStake}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .unstake(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");
    }

    /*
    console.log(
      `stakeWithVerify: expectTotalStakedWei=${expectTotalStakedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}`
    );
    */

    return [expectTotalStakedWei, expectRewardToBeDistributedWei];
  }

  async function suspendStakeWithVerify(
    stakingServiceContractInstance,
    startblockTimestamp,
    stakeConfig,
    adminSigner,
    verifyStakeConfigs,
    hasClaimed,
    afterRevoke,
    isAddStake
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
      afterRevoke,
      isAddStake
    );

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    if (stakeExceedPoolReward) {
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
        afterRevoke,
        isAddStake
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
        afterRevoke,
        isAddStake
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
        afterRevoke,
        isAddStake
      );
    }
  }

  async function testAddStakingPoolReward(
    stakingServiceContractInstance,
    stakingPoolRewardConfigs,
    signers,
    balanceOfStakingPoolRewards,
    stakingPoolRewardStats,
    expectAbleToAddReward
  ) {
    for (let i = 0; i < stakingPoolRewardConfigs.length; i++) {
      const signerIndex = i % signers.length;
      const signerAddress = await signers[signerIndex].getAddress();

      if (expectAbleToAddReward) {
        balanceOfStakingPoolRewards[
          stakingPoolRewardConfigs[i].rewardTokenInstance.address
        ] = await addStakingPoolRewardWithVerify(
          stakingServiceContractInstance,
          stakingPoolRewardConfigs[i].rewardTokenInstance,
          signers[signerIndex],
          stakingPoolRewardConfigs[i].poolId,
          balanceOfStakingPoolRewards[
            stakingPoolRewardConfigs[i].rewardTokenInstance.address
          ],
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

        const expectBalanceOfBeforeAdd =
          balanceOfStakingPoolRewards[
            stakingPoolRewardConfigs[i].rewardTokenInstance.address
          ];
        const expectTotalRewardWeiBeforeAdd =
          stakingPoolRewardStats[stakingPoolRewardConfigs[i].poolId]
            .totalRewardWei;
        const expectRewardToBeDistributedWeiBeforeAdd =
          stakingPoolRewardStats[stakingPoolRewardConfigs[i].poolId]
            .rewardToBeDistributedWei;

        const rewardTokenDecimals = await stakingPoolRewardConfigs[
          i
        ].rewardTokenInstance.decimals();

        const balanceOfBeforeAdd = await stakingPoolRewardConfigs[
          i
        ].rewardTokenInstance.balanceOf(stakingServiceContractInstance.address);
        expect(balanceOfBeforeAdd).to.be.closeTo(
          testHelpers.scaleWeiToDecimals(
            expectBalanceOfBeforeAdd,
            rewardTokenDecimals
          ),
          3
        );

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

        const balanceOfAfterAdd = await stakingPoolRewardConfigs[
          i
        ].rewardTokenInstance.balanceOf(stakingServiceContractInstance.address);
        expect(balanceOfAfterAdd).to.be.closeTo(
          testHelpers.scaleWeiToDecimals(
            expectBalanceOfBeforeAdd,
            rewardTokenDecimals
          ),
          3
        );

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
  }

  async function testRemoveUnallocatedStakingPoolReward(
    stakingServiceContractInstance,
    expectStakingPoolStats,
    stakeConfigs,
    stakingPoolConfigs,
    adminSigner,
    isAddStake
  ) {
    const unallocatedRewardsWei = {};
    const revokedStakesWei = {};
    const totalRevokedStakesWei = {};

    for (let i = 0; i < stakeConfigs.length; i++) {
      const stakeExceedPoolReward =
        stakeConfigs[i].exceedPoolReward &&
        !stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero);
      const addStakeExceedPoolReward =
        stakeConfigs[i].exceedPoolReward &&
        isAddStake &&
        stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero);

      let expectStakeAmountWei;
      let expectRewardAtMaturityWei;

      if (
        isAddStake &&
        stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
        !addStakeExceedPoolReward
      ) {
        expectStakeAmountWei = stakeConfigs[i].stakeAmountWei.add(
          stakeConfigs[i].addStakeAmountWei
        );

        expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
          stakeConfigs[i].stakingPoolConfig.poolAprWei,
          stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
          stakeConfigs[i].stakeAmountWei
        ).add(
          estimateRewardAtMaturityWei(
            stakeConfigs[i].stakingPoolConfig.poolAprWei,
            stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
            stakeConfigs[i].addStakeAmountWei
          )
        );
      } else {
        expectStakeAmountWei = stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeConfigs[i].stakeAmountWei;

        expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
          stakeConfigs[i].stakingPoolConfig.poolAprWei,
          stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
          expectStakeAmountWei
        );
      }

      if (
        (stakeConfigs[i].shouldRevokeBeforeClaim ||
          stakeConfigs[i].shouldRevokeAfterClaim) &&
        !stakeExceedPoolReward
      ) {
        if (
          stakeConfigs[i].shouldRevokeBeforeClaim ||
          (stakeConfigs[i].shouldRevokeAfterClaim &&
            !stakeConfigs[i].shouldClaim)
        ) {
          const expectUnallocatedRewardWei = expectRewardAtMaturityWei;

          if (
            stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei
          ) {
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
              unallocatedRewardsWei[
                stakeConfigs[i].stakingPoolConfig.poolId
              ].add(expectUnallocatedRewardWei);
          } else {
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
              expectUnallocatedRewardWei;
          }
        }

        if (stakeConfigs[i].stakingPoolConfig.poolId in revokedStakesWei) {
          revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId].add(
              expectStakeAmountWei
            );
        } else {
          revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            expectStakeAmountWei;
        }

        if (
          stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address in
          totalRevokedStakesWei
        ) {
          totalRevokedStakesWei[
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          ] =
            totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
            ].add(expectStakeAmountWei);
        } else {
          totalRevokedStakesWei[
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          ] = expectStakeAmountWei;
        }
      }

      if (stakeExceedPoolReward || addStakeExceedPoolReward) {
        const exceedPoolRewardWei = stakeExceedPoolReward
          ? estimateRewardAtMaturityWei(
              stakeConfigs[i].stakingPoolConfig.poolAprWei,
              stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
              stakeConfigs[i].stakeAmountWei
            ).add(
              estimateRewardAtMaturityWei(
                stakeConfigs[i].stakingPoolConfig.poolAprWei,
                stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
                stakeConfigs[i].addStakeAmountWei
              )
            )
          : estimateRewardAtMaturityWei(
              stakeConfigs[i].stakingPoolConfig.poolAprWei,
              stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
              stakeConfigs[i].addStakeAmountWei
            );

        /*
        console.log(
          `removeUnallocatedStakingPoolRewardWithVerify exceedPoolReward ${i}: poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeExceedPoolReward=${stakeExceedPoolReward}, addStakeExceedPoolReward=${addStakeExceedPoolReward}, stakeAmountWei=${
            stakeConfigs[i].stakeAmountWei
          }, addStakeAmountWei=${
            stakeConfigs[i].addStakeAmountWei
          }, stakeRewardAtMaturity=${estimateRewardAtMaturityWei(
            stakeConfigs[i].stakingPoolConfig.poolAprWei,
            stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
            stakeConfigs[i].stakeAmountWei
          )}, addStakeRewardAtMaturity=${estimateRewardAtMaturityWei(
            stakeConfigs[i].stakingPoolConfig.poolAprWei,
            stakeConfigs[i].stakingPoolConfig.stakeDurationDays,
            stakeConfigs[i].addStakeAmountWei
          )}, exceedPoolRewardWei=${exceedPoolRewardWei}`
        );
        */

        if (stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei) {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId].add(
              exceedPoolRewardWei
            );
        } else {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            exceedPoolRewardWei;
        }
      }
    }

    for (const stakingPoolId in unallocatedRewardsWei) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === stakingPoolId
      );

      /*
      console.log(
        `removeUnallocatedStakingPoolRewardWithVerify ${stakingPoolId}: unallocatedRewardsWei=${unallocatedRewardsWei[stakingPoolId]}, revokedStakesWei=${revokedStakesWei[stakingPoolId]}, totalRewardWei=${expectStakingPoolStats[stakingPoolId].totalRewardWei}, rewardToBeDistributedWei=${expectStakingPoolStats[stakingPoolId].rewardToBeDistributedWei}, totalStakedWei=${expectStakingPoolStats[stakingPoolId].totalStakedWei}`
      );
      */

      await removeUnallocatedStakingPoolRewardWithVerify(
        stakingServiceContractInstance,
        adminSigner,
        stakingPoolConfig.rewardTokenInstance,
        stakingPoolId,
        unallocatedRewardsWei[stakingPoolId].sub(hre.ethers.constants.Two),
        await governanceRoleAccounts[0].getAddress(),
        expectStakingPoolStats
      );
    }

    for (const stakingPoolId in unallocatedRewardsWei) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === stakingPoolId
      );

      const rewardTokenDecimals =
        await stakingPoolConfig.rewardTokenInstance.decimals();

      const expectBalanceOfContractAfterRemove =
        stakingPoolConfig.stakeTokenInstance.address ===
        stakingPoolConfig.rewardTokenInstance.address
          ? testHelpers.scaleWeiToDecimals(
              totalRevokedStakesWei[
                stakingPoolConfig.stakeTokenInstance.address
              ],
              rewardTokenDecimals
            )
          : hre.ethers.constants.Zero;

      const balanceOfContractAfterRemove =
        await stakingPoolConfig.rewardTokenInstance.balanceOf(
          stakingServiceInstance.address
        );

      expect(balanceOfContractAfterRemove).to.be.closeTo(
        expectBalanceOfContractAfterRemove,
        2
      );
    }

    for (const stakingPoolId in revokedStakesWei) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === stakingPoolId
      );

      /*
      console.log(
        `removeRevokedStakesWithVerify ${stakingPoolId}: unallocatedRewardsWei=${unallocatedRewardsWei[stakingPoolId]}, revokedStakesWei=${revokedStakesWei[stakingPoolId]}, totalRewardWei=${expectStakingPoolStats[poolId].totalRewardWei}, rewardToBeDistributedWei=${expectStakingPoolStats[poolId].rewardToBeDistributedWei}, totalStakedWei=${expectStakingPoolStats[poolId].totalStakedWei}`
      );
      */

      await removeRevokedStakesWithVerify(
        stakingServiceContractInstance,
        adminSigner,
        stakingPoolConfig.stakeTokenInstance,
        stakingPoolId,
        revokedStakesWei[stakingPoolId],
        await governanceRoleAccounts[0].getAddress(),
        expectStakingPoolStats
      );
    }

    const expectBalanceOfContractAfterRemove = hre.ethers.constants.Zero;

    for (const stakingPoolId in revokedStakesWei) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === stakingPoolId
      );

      const balanceOfContractAfterRemove =
        await stakingPoolConfig.stakeTokenInstance.balanceOf(
          stakingServiceInstance.address
        );

      expect(balanceOfContractAfterRemove).to.be.closeTo(
        expectBalanceOfContractAfterRemove,
        1
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
    stakingPoolRewardStats,
    stakeConfigs,
    adminSigner
  ) {
    const expectStakingPoolStats = {};

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nstake ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
      );
      */

      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (!(poolId in expectStakingPoolStats)) {
        expectStakingPoolStats[poolId] = {
          totalRewardWei: stakingPoolRewardStats[poolId].totalRewardWei,
          totalStakedWei: hre.ethers.constants.Zero,
          rewardToBeDistributedWei:
            stakingPoolRewardStats[poolId].rewardToBeDistributedWei,
          totalRevokedStakeWei: hre.ethers.constants.Zero,
        };
      }

      [
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
      ] = await stakeWithVerify(
        stakingServiceContractInstance,
        stakingPoolContractInstance,
        adminSigner,
        stakeConfigs[i],
        startblockTimestamp,
        stakeConfigs.slice(0, i + 1),
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nsuspendStake ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
      );
      */

      await suspendStakeWithVerify(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeConfigs[i],
        adminSigner,
        stakeConfigs.slice(0, i + 1),
        true,
        false,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nclaimReward00 ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
      );
      */

      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      [
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
      ] = await claimRewardWithVerify(
        stakingServiceContractInstance,
        stakingPoolContractInstance,
        adminSigner,
        stakeConfigs[i],
        startblockTimestamp,
        stakeConfigs.slice(0, i + 1),
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        true,
        false,
        false,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nresumeStake ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
      );
      */

      await resumeStakeWithVerify(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeConfigs[i],
        adminSigner,
        stakeConfigs.slice(0, i + 1),
        true,
        false,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero)) {
        /*
        console.log(
          `\n\naddStake ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
        );
        */

        [
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        ] = await stakeWithVerify(
          stakingServiceContractInstance,
          stakingPoolContractInstance,
          adminSigner,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          true
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldRevokeBeforeClaim) {
        /*
        console.log(
          `\n\nrevokeStake00 ${i}: stakeConfig=${JSON.stringify(
            stakeConfigs[i]
          )}`
        );
        */

        [
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          expectStakingPoolStats[poolId].totalRevokedStakeWei,
        ] = await revokeStakeWithVerify(
          stakingServiceContractInstance,
          adminSigner,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          expectStakingPoolStats[poolId].totalRevokedStakeWei,
          true,
          false,
          false,
          true
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nclaimReward01 ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
      );
      */

      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldClaim) {
        [
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        ] = await claimRewardWithVerify(
          stakingServiceContractInstance,
          stakingPoolContractInstance,
          adminSigner,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          false,
          false,
          true,
          true
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldRevokeAfterClaim) {
        /*
        console.log(
          `\n\nrevokeStake01 ${i}: stakeConfig=${JSON.stringify(
            stakeConfigs[i]
          )}`
        );
        */

        [
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          expectStakingPoolStats[poolId].totalRevokedStakeWei,
        ] = await revokeStakeWithVerify(
          stakingServiceContractInstance,
          adminSigner,
          stakeConfigs[i],
          startblockTimestamp,
          stakeConfigs.slice(0, i + 1),
          expectStakingPoolStats[poolId].totalRewardWei,
          expectStakingPoolStats[poolId].totalStakedWei,
          expectStakingPoolStats[poolId].rewardToBeDistributedWei,
          expectStakingPoolStats[poolId].totalRevokedStakeWei,
          false,
          true,
          true,
          true
        );
      }
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nunstake ${i}: stakeConfig=${JSON.stringify(stakeConfigs[i])}`
      );
      */

      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      [
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
      ] = await unstakeWithVerify(
        stakingServiceContractInstance,
        stakingPoolContractInstance,
        adminSigner,
        stakeConfigs[i],
        startblockTimestamp,
        stakeConfigs.slice(0, i + 1),
        expectStakingPoolStats[poolId].totalRewardWei,
        expectStakingPoolStats[poolId].totalStakedWei,
        expectStakingPoolStats[poolId].rewardToBeDistributedWei,
        true
      );
    }

    /*
    console.log(
      `\n\ntestStakeClaimUnstake: ${JSON.stringify(expectStakingPoolStats)}`
    );
    */

    return expectStakingPoolStats;
  }

  async function unstakeWithVerify(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    adminSigner,
    stakeConfig,
    startblockTimestamp,
    verifyStakeConfigs,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei,
    isAddStake
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    const expectRewardBeforeMaturityWei = hre.ethers.constants.Zero;
    const expectRewardAfterStakeSuspendedWei = hre.ethers.constants.Zero;
    const expectRewardAfterPoolSuspendedWei = hre.ethers.constants.Zero;

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);
    const addStakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    if (
      stakeExceedPoolReward ||
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

    let expectStakeAmountWei;
    let expectStakeTimestamp;

    if (
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
      !addStakeExceedPoolReward
    ) {
      expectStakeAmountWei = stakeConfig.stakeAmountWei.add(
        stakeConfig.addStakeAmountWei
      );

      expectStakeTimestamp =
        startblockTimestamp +
        stakeConfig.addStakeSecondsAfterStartblockTimestamp;
    } else {
      expectStakeAmountWei = stakeConfig.stakeAmountWei;

      expectStakeTimestamp =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
    }

    const expectRewardAtMaturityWei = stakeConfig.shouldClaim
      ? hre.ethers.constants.Zero
      : estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          expectStakeAmountWei
        );

    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
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
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
        signerAddress
      );
    const balanceOfStakeTokenBeforeUnstake =
      await stakeConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
        signerAddress
      );

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

    const expectUnstakeAmountWei = expectStakeAmountWei;
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
        stakeConfig.stakingPoolConfig.stakeTokenInstance.address,
        expectUnstakeAmountWei,
        stakeConfig.stakingPoolConfig.rewardTokenInstance.address,
        expectRewardAtMaturityWei
      );

    const rewardTokenDecimals =
      await stakeConfig.stakingPoolConfig.rewardTokenInstance.decimals();

    const stakeTokenDecimals =
      await stakeConfig.stakingPoolConfig.stakeTokenInstance.decimals();

    if (
      stakeConfig.stakingPoolConfig.stakeTokenInstance.address ===
      stakeConfig.stakingPoolConfig.rewardTokenInstance.address
    ) {
      const expectBalanceOfStakeRewardTokenAfterUnstake =
        balanceOfRewardTokenBeforeUnstake.add(
          testHelpers.scaleWeiToDecimals(
            expectRewardAtMaturityWei.add(expectUnstakeAmountWei),
            rewardTokenDecimals
          )
        );

      const balanceOfStakeRewardTokenAfterUnstake =
        await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
          signerAddress
        );
      expect(balanceOfStakeRewardTokenAfterUnstake).to.equal(
        expectBalanceOfStakeRewardTokenAfterUnstake
      );
    } else {
      const expectBalanceOfRewardTokenAfterUnstake =
        balanceOfRewardTokenBeforeUnstake.add(
          testHelpers.scaleWeiToDecimals(
            expectRewardAtMaturityWei,
            rewardTokenDecimals
          )
        );
      const expectBalanceOfStakeTokenAfterUnstake =
        balanceOfStakeTokenBeforeUnstake.add(
          testHelpers.scaleWeiToDecimals(
            expectUnstakeAmountWei,
            stakeTokenDecimals
          )
        );

      const balanceOfRewardTokenAfterUnstake =
        await stakeConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
          signerAddress
        );
      expect(balanceOfRewardTokenAfterUnstake).to.equal(
        expectBalanceOfRewardTokenAfterUnstake
      );

      const balanceOfStakeTokenAfterUnstake =
        await stakeConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
          signerAddress
        );
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
    afterRevoke,
    isAddStake
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();
    const isRevoked = afterRevoke
      ? hasClaimed
        ? stakeConfig.shouldRevokeAfterClaim
        : stakeConfig.shouldRevokeBeforeClaim
      : false;

    const stakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      !stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    const addStakeExceedPoolReward =
      stakeConfig.exceedPoolReward &&
      isAddStake &&
      stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero);

    if (stakeExceedPoolReward || isRevoked) {
      /*
      console.log(
        `\nverifyStakeInfo: stakeExceedPoolReward=${stakeExceedPoolReward}, isRevoked=${isRevoked}, stakeConfig=${JSON.stringify(
          stakeConfig
        )}`
      );
      */

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");
    } else {
      let expectStakeAmountWei;
      let expectStakeTimestamp;

      if (
        isAddStake &&
        stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
        !addStakeExceedPoolReward
      ) {
        expectStakeAmountWei = stakeConfig.stakeAmountWei.add(
          stakeConfig.addStakeAmountWei
        );

        expectStakeTimestamp =
          startblockTimestamp +
          stakeConfig.addStakeSecondsAfterStartblockTimestamp;
      } else {
        expectStakeAmountWei = stakeConfig.stakeAmountWei;

        expectStakeTimestamp =
          startblockTimestamp +
          stakeConfig.stakeSecondsAfterStartblockTimestamp;
      }

      const expectRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakeConfig.stakingPoolConfig.poolAprWei,
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        expectStakeAmountWei
      );

      const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        expectStakeTimestamp
      );

      const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

      /*
      console.log(
        `\nverifyStakeInfo: stakeInfo=${JSON.stringify(
          stakeInfo
        )}, stakeConfig=${JSON.stringify(stakeConfig)}`
      );
      */

      expect(stakeInfo.stakeAmountWei).to.equal(expectStakeAmountWei);
      expect(stakeInfo.stakeTimestamp).to.equal(expectStakeTimestamp);
      expect(stakeInfo.stakeMaturityTimestamp).to.equal(
        expectStakeMaturityTimestamp
      );
      expect(stakeInfo.estimatedRewardAtMaturityWei).to.be.closeTo(
        expectRewardAtMaturityWei,
        1
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
    afterRevoke,
    isAddStake
  ) {
    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\nverifyStakesInfo ${i}: stakeConfig=${JSON.stringify(
          stakeConfigs[i]
        )}`
      );
      */

      await verifyStakeInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeConfigs[i],
        expectIsActive,
        hasClaimed,
        afterRevoke,
        isAddStake
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
