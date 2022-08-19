const { expect } = require("chai");
const hre = require("hardhat");
// const timeMachine = require("ganache-time-traveler");
const testHelpers = require("./test-helpers.js");
const stakeHelpers = require("./stake-helpers.js");

describe("StakingService", function () {
  const rewardTokenAdminMintWei = hre.ethers.utils.parseEther("10000000");
  const stakeTokenAdminMintWei = hre.ethers.utils.parseEther("1000000");
  const totalStakeRewardLessByWei = hre.ethers.utils.parseEther("1");
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
      stakeHelpers.newStakingService(hre.ethers.constants.AddressZero)
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
        addStakeSecondsAfterStartblockTimestamp: 97509,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5279.76920273"),
        stakeSecondsAfterStartblockTimestamp: 415,
        addStakeAmountWei: hre.ethers.utils.parseEther("79149.44093680"),
        addStakeSecondsAfterStartblockTimestamp: 97723,
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
        addStakeSecondsAfterStartblockTimestamp: 97844,
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
        addStakeSecondsAfterStartblockTimestamp: 98074,
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
        addStakeSecondsAfterStartblockTimestamp: 98264,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("7834.10340079"),
        stakeSecondsAfterStartblockTimestamp: 1523,
        addStakeAmountWei: hre.ethers.utils.parseEther("12550.11801626"),
        addStakeSecondsAfterStartblockTimestamp: 98400,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("5701.40825578"),
        stakeSecondsAfterStartblockTimestamp: 1756,
        addStakeAmountWei: hre.ethers.utils.parseEther("43494.73394597"),
        addStakeSecondsAfterStartblockTimestamp: 98623,
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
        addStakeSecondsAfterStartblockTimestamp: 98797,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("41.87133677"),
        stakeSecondsAfterStartblockTimestamp: 2242,
        addStakeAmountWei: hre.ethers.utils.parseEther("11394.6516797"),
        addStakeSecondsAfterStartblockTimestamp: 99007,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("58385.36961303"),
        stakeSecondsAfterStartblockTimestamp: 2433,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("68443.99537583"),
        stakeSecondsAfterStartblockTimestamp: 2667,
        addStakeAmountWei: hre.ethers.utils.parseEther("4027.4875509"),
        addStakeSecondsAfterStartblockTimestamp: 99187,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("25051.63238873"),
        stakeSecondsAfterStartblockTimestamp: 2827,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("60850.8963478"),
        stakeSecondsAfterStartblockTimestamp: 3015,
        addStakeAmountWei: hre.ethers.utils.parseEther("55115.78017244"),
        addStakeSecondsAfterStartblockTimestamp: 99347,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("37125.3947381"),
        stakeSecondsAfterStartblockTimestamp: 3217,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("50636.18046025"),
        stakeSecondsAfterStartblockTimestamp: 3448,
        addStakeAmountWei: hre.ethers.utils.parseEther("26841.85441847"),
        addStakeSecondsAfterStartblockTimestamp: 99555,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("21357.36828941"),
        stakeSecondsAfterStartblockTimestamp: 3662,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("34049.85968262"),
        stakeSecondsAfterStartblockTimestamp: 3792,
        addStakeAmountWei: hre.ethers.utils.parseEther("61638.84417690"),
        addStakeSecondsAfterStartblockTimestamp: 99671,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("47018.79021523"),
        stakeSecondsAfterStartblockTimestamp: 3957,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("22507.99010203"),
        stakeSecondsAfterStartblockTimestamp: 4134,
        addStakeAmountWei: hre.ethers.utils.parseEther("36136.28209419"),
        addStakeSecondsAfterStartblockTimestamp: 99908,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("41874.38617018"),
        stakeSecondsAfterStartblockTimestamp: 4295,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("53282.93858124"),
        stakeSecondsAfterStartblockTimestamp: 4422,
        addStakeAmountWei: hre.ethers.utils.parseEther("44645.9960905"),
        addStakeSecondsAfterStartblockTimestamp: 100101,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("15537.7058007"),
        stakeSecondsAfterStartblockTimestamp: 4615,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("44654.95684629"),
        stakeSecondsAfterStartblockTimestamp: 4855,
        addStakeAmountWei: hre.ethers.utils.parseEther("48393.158032"),
        addStakeSecondsAfterStartblockTimestamp: 100300,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("65234.94329969"),
        stakeSecondsAfterStartblockTimestamp: 5084,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("43533.5270135"),
        stakeSecondsAfterStartblockTimestamp: 5245,
        addStakeAmountWei: hre.ethers.utils.parseEther("45207.55807157"),
        addStakeSecondsAfterStartblockTimestamp: 100569,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("35114.46612849"),
        stakeSecondsAfterStartblockTimestamp: 5386,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("9255.82453339"),
        stakeSecondsAfterStartblockTimestamp: 5586,
        addStakeAmountWei: hre.ethers.utils.parseEther("65005.2227561"),
        addStakeSecondsAfterStartblockTimestamp: 100681,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("49750.89565042"),
        stakeSecondsAfterStartblockTimestamp: 5730,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("43090.13004908"),
        stakeSecondsAfterStartblockTimestamp: 5941,
        addStakeAmountWei: hre.ethers.utils.parseEther("34438.69021317"),
        addStakeSecondsAfterStartblockTimestamp: 100790,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("51175.77142632"),
        stakeSecondsAfterStartblockTimestamp: 6133,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("54713.56964903"),
        stakeSecondsAfterStartblockTimestamp: 6320,
        addStakeAmountWei: hre.ethers.utils.parseEther("74325.35704645"),
        addStakeSecondsAfterStartblockTimestamp: 100909,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("40492.32514618"),
        stakeSecondsAfterStartblockTimestamp: 6445,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("26947.29646902"),
        stakeSecondsAfterStartblockTimestamp: 6676,
        addStakeAmountWei: hre.ethers.utils.parseEther("6032.5894829"),
        addStakeSecondsAfterStartblockTimestamp: 101087,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("7200.17682263"),
        stakeSecondsAfterStartblockTimestamp: 6861,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("38838.97736064"),
        stakeSecondsAfterStartblockTimestamp: 7041,
        addStakeAmountWei: hre.ethers.utils.parseEther("55522.87140509"),
        addStakeSecondsAfterStartblockTimestamp: 101226,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("19904.42508079"),
        stakeSecondsAfterStartblockTimestamp: 7200,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("35727.46576127"),
        stakeSecondsAfterStartblockTimestamp: 7322,
        addStakeAmountWei: hre.ethers.utils.parseEther("48077.41339519"),
        addStakeSecondsAfterStartblockTimestamp: 101453,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("42957.30632550"),
        stakeSecondsAfterStartblockTimestamp: 7485,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("1226.28392521"),
        stakeSecondsAfterStartblockTimestamp: 7656,
        addStakeAmountWei: hre.ethers.utils.parseEther("73361.6535619"),
        addStakeSecondsAfterStartblockTimestamp: 101580,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("71926.8810301"),
        stakeSecondsAfterStartblockTimestamp: 7785,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("11807.96556326"),
        stakeSecondsAfterStartblockTimestamp: 7976,
        addStakeAmountWei: hre.ethers.utils.parseEther("10351.37770501"),
        addStakeSecondsAfterStartblockTimestamp: 101787,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("10904.37062223"),
        stakeSecondsAfterStartblockTimestamp: 8162,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("681.82826215"),
        stakeSecondsAfterStartblockTimestamp: 8301,
        addStakeAmountWei: hre.ethers.utils.parseEther("22502.40271541"),
        addStakeSecondsAfterStartblockTimestamp: 101939,
        shouldClaim: false,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("61514.93860262"),
        stakeSecondsAfterStartblockTimestamp: 8421,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("52030.49401595"),
        stakeSecondsAfterStartblockTimestamp: 8613,
        addStakeAmountWei: hre.ethers.utils.parseEther("7140.92294045"),
        addStakeSecondsAfterStartblockTimestamp: 102141,
        shouldClaim: false,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("51418.12980667"),
        stakeSecondsAfterStartblockTimestamp: 8801,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("57167.6291809"),
        stakeSecondsAfterStartblockTimestamp: 8942,
        addStakeAmountWei: hre.ethers.utils.parseEther("12693.63154096"),
        addStakeSecondsAfterStartblockTimestamp: 102284,
        shouldClaim: true,
        shouldRevokeBeforeClaim: false,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("6023.90769733"),
        stakeSecondsAfterStartblockTimestamp: 9173,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("25842.53697776"),
        stakeSecondsAfterStartblockTimestamp: 9483,
        addStakeAmountWei: hre.ethers.utils.parseEther("64681.61196522"),
        addStakeSecondsAfterStartblockTimestamp: 102418,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("44563.94223051"),
        stakeSecondsAfterStartblockTimestamp: 9692,
        addStakeAmountWei: hre.ethers.utils.parseEther("0"),
        addStakeSecondsAfterStartblockTimestamp: 0,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: false,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("60456.53730827"),
        stakeSecondsAfterStartblockTimestamp: 9894,
        addStakeAmountWei: hre.ethers.utils.parseEther("30814.99556430"),
        addStakeSecondsAfterStartblockTimestamp: 102572,
        shouldClaim: true,
        shouldRevokeBeforeClaim: true,
        shouldRevokeAfterClaim: true,
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

      expect(balanceOfContractAfterRemove).to.equal(hre.ethers.constants.Zero);
    }
  });

  it("Should be able to stake more using same stake and reward token with 18 decimals", async () => {
    const expectStakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs[0];
    const enduser = enduserAccounts[0];

    const stakeMoreInfo = [
      {
        stakeAmountWei: hre.ethers.utils.parseEther("33687.78329325"),
        stakeSecondsAfterStartblockTimestamp: 10,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("790282.8319459"),
        stakeSecondsAfterStartblockTimestamp: 90258,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("864942.27974346"),
        stakeSecondsAfterStartblockTimestamp: 185959,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("12767.27475306"),
        stakeSecondsAfterStartblockTimestamp: 277810,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("741305.67988497"),
        stakeSecondsAfterStartblockTimestamp: 370888,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("510154.90180235"),
        stakeSecondsAfterStartblockTimestamp: 457287,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("110020.33942366"),
        stakeSecondsAfterStartblockTimestamp: 905048,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("386669.49521599"),
        stakeSecondsAfterStartblockTimestamp: 1284697,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("525518.24746399"),
        stakeSecondsAfterStartblockTimestamp: 1477450,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("480118.12460864"),
        stakeSecondsAfterStartblockTimestamp: 1968191,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("572457.57581124"),
        stakeSecondsAfterStartblockTimestamp: 2169285,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 0,
      },
    ];

    const stakingPoolRewardStats = {};

    const expectStakeMoresWithRewards = await setupStakeMoresWithRewards(
      stakeMoreInfo,
      enduser,
      expectStakingPoolConfig,
      stakingServiceInstance,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      governanceRoleAccounts[0]
    );

    /*
    console.log(`\nexpectStakeMoresWithRewards:`);
    console.log(
      `stakingPoolId, actualStakeAmountWei, expectStakeAmountWei, actualTotalStakeAmountsWei, truncatedTotalStakeAmountsWei, estimatedRewardAtMaturityWei, expectRewardAtMaturityWei, lastDigitDeltaStakeAmountWei, lastDigitDeltaRewardAtMaturityWei, stakeSecondsAfterStartblockTimestamp`
    );
    for (let i = 0; i < expectStakeMoresWithRewards.length; i++) {
      console.log(
        `${
          expectStakeMoresWithRewards[i].stakingPoolConfig.poolId
        }, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].truncatedTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].estimatedRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaRewardAtMaturityWei
        )}, ${
          expectStakeMoresWithRewards[i].stakeSecondsAfterStartblockTimestamp
        }`
      );
    }
    */

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    await stakeMoreWithVerify(
      stakingServiceInstance,
      expectStakeMoresWithRewards,
      startblockTimestamp,
      hre.ethers.constants.Zero,
      hre.ethers.constants.Zero
    );

    const lastStakeMoreConfig =
      expectStakeMoresWithRewards[expectStakeMoresWithRewards.length - 1];

    await unstakeStakeMoreWithVerify(
      stakingServiceInstance,
      stakingPoolInstance,
      contractAdminRoleAccounts[0],
      lastStakeMoreConfig,
      startblockTimestamp,
      stakingPoolRewardStats[lastStakeMoreConfig.stakingPoolConfig.poolId]
        .totalRewardWei,
      lastStakeMoreConfig.truncatedTotalStakeAmountsWei,
      lastStakeMoreConfig.expectRewardAtMaturityWei
    );

    const balanceOfContractAfterRemove =
      await lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
        stakingServiceInstance.address
      );

    console.log(
      `tokenAddress=${lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.address}, balanceOfContractAfterRemove=${balanceOfContractAfterRemove}`
    );

    expect(balanceOfContractAfterRemove).to.equal(hre.ethers.constants.Zero);
  });

  it("Should be able to stake more using same stake and reward token with 6 decimals", async () => {
    const expectStakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs[5];
    const enduser = enduserAccounts[0];

    const stakeMoreInfo = [
      {
        stakeAmountWei: hre.ethers.utils.parseEther("33687.78329325"),
        stakeSecondsAfterStartblockTimestamp: 10,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 20,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("790282.8319459"),
        stakeSecondsAfterStartblockTimestamp: 90258,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 50,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("864942.27974346"),
        stakeSecondsAfterStartblockTimestamp: 185959,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 70,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("12767.27475306"),
        stakeSecondsAfterStartblockTimestamp: 277810,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 80,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("741305.67988497"),
        stakeSecondsAfterStartblockTimestamp: 370888,
        lastDigitDeltaStakeAmountWei: 30,
        lastDigitDeltaRewardAtMaturityWei: 120,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("510154.90180235"),
        stakeSecondsAfterStartblockTimestamp: 457287,
        lastDigitDeltaStakeAmountWei: 30,
        lastDigitDeltaRewardAtMaturityWei: 140,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("110020.33942366"),
        stakeSecondsAfterStartblockTimestamp: 905048,
        lastDigitDeltaStakeAmountWei: 40,
        lastDigitDeltaRewardAtMaturityWei: 170,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("386669.49521599"),
        stakeSecondsAfterStartblockTimestamp: 1284697,
        lastDigitDeltaStakeAmountWei: 50,
        lastDigitDeltaRewardAtMaturityWei: 200,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("525518.24746399"),
        stakeSecondsAfterStartblockTimestamp: 1477450,
        lastDigitDeltaStakeAmountWei: 60,
        lastDigitDeltaRewardAtMaturityWei: 230,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("480118.12460864"),
        stakeSecondsAfterStartblockTimestamp: 1968191,
        lastDigitDeltaStakeAmountWei: 70,
        lastDigitDeltaRewardAtMaturityWei: 260,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("572457.57581124"),
        stakeSecondsAfterStartblockTimestamp: 2169285,
        lastDigitDeltaStakeAmountWei: 70,
        lastDigitDeltaRewardAtMaturityWei: 270,
      },
    ];

    const stakingPoolRewardStats = {};

    const expectStakeMoresWithRewards = await setupStakeMoresWithRewards(
      stakeMoreInfo,
      enduser,
      expectStakingPoolConfig,
      stakingServiceInstance,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      governanceRoleAccounts[0]
    );

    /*
    console.log(`\nexpectStakeMoresWithRewards:`);
    console.log(
      `stakingPoolId, actualStakeAmountWei, expectStakeAmountWei, actualTotalStakeAmountsWei, truncatedTotalStakeAmountsWei, estimatedRewardAtMaturityWei, expectRewardAtMaturityWei, lastDigitDeltaStakeAmountWei, lastDigitDeltaRewardAtMaturityWei, stakeSecondsAfterStartblockTimestamp`
    );
    for (let i = 0; i < expectStakeMoresWithRewards.length; i++) {
      console.log(
        `${
          expectStakeMoresWithRewards[i].stakingPoolConfig.poolId
        }, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].truncatedTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].estimatedRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaRewardAtMaturityWei
        )}, ${
          expectStakeMoresWithRewards[i].stakeSecondsAfterStartblockTimestamp
        }`
      );
    }
    */

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    await stakeMoreWithVerify(
      stakingServiceInstance,
      expectStakeMoresWithRewards,
      startblockTimestamp,
      hre.ethers.constants.Zero,
      hre.ethers.constants.Zero
    );

    const lastStakeMoreConfig =
      expectStakeMoresWithRewards[expectStakeMoresWithRewards.length - 1];

    await unstakeStakeMoreWithVerify(
      stakingServiceInstance,
      stakingPoolInstance,
      contractAdminRoleAccounts[0],
      lastStakeMoreConfig,
      startblockTimestamp,
      stakingPoolRewardStats[lastStakeMoreConfig.stakingPoolConfig.poolId]
        .totalRewardWei,
      lastStakeMoreConfig.truncatedTotalStakeAmountsWei,
      lastStakeMoreConfig.expectRewardAtMaturityWei
    );

    const balanceOfContractAfterRemove =
      await lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
        stakingServiceInstance.address
      );

    console.log(
      `tokenAddress=${lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.address}, balanceOfContractAfterRemove=${balanceOfContractAfterRemove}`
    );

    expect(balanceOfContractAfterRemove).to.equal(hre.ethers.constants.Zero);
  });

  it("Should be able to stake more using stake token with 18 decimals and reward token with 6 decimals", async () => {
    const expectStakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs[10];
    const enduser = enduserAccounts[0];

    const stakeMoreInfo = [
      {
        stakeAmountWei: hre.ethers.utils.parseEther("33687.78329325"),
        stakeSecondsAfterStartblockTimestamp: 10,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 10,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("790282.8319459"),
        stakeSecondsAfterStartblockTimestamp: 90258,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 20,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("864942.27974346"),
        stakeSecondsAfterStartblockTimestamp: 185959,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 30,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("12767.27475306"),
        stakeSecondsAfterStartblockTimestamp: 277810,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 40,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("741305.67988497"),
        stakeSecondsAfterStartblockTimestamp: 370888,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 60,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("510154.90180235"),
        stakeSecondsAfterStartblockTimestamp: 457287,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 70,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("110020.33942366"),
        stakeSecondsAfterStartblockTimestamp: 905048,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 80,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("386669.49521599"),
        stakeSecondsAfterStartblockTimestamp: 1284697,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 90,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("525518.24746399"),
        stakeSecondsAfterStartblockTimestamp: 1477450,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 100,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("480118.12460864"),
        stakeSecondsAfterStartblockTimestamp: 1968191,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 110,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("572457.57581124"),
        stakeSecondsAfterStartblockTimestamp: 2169285,
        lastDigitDeltaStakeAmountWei: 0,
        lastDigitDeltaRewardAtMaturityWei: 120,
      },
    ];

    const stakingPoolRewardStats = {};

    const expectStakeMoresWithRewards = await setupStakeMoresWithRewards(
      stakeMoreInfo,
      enduser,
      expectStakingPoolConfig,
      stakingServiceInstance,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      governanceRoleAccounts[0]
    );

    /*
    console.log(`\nexpectStakeMoresWithRewards:`);
    console.log(
      `stakingPoolId, actualStakeAmountWei, expectStakeAmountWei, actualTotalStakeAmountsWei, truncatedTotalStakeAmountsWei, estimatedRewardAtMaturityWei, expectRewardAtMaturityWei, lastDigitDeltaStakeAmountWei, lastDigitDeltaRewardAtMaturityWei, stakeSecondsAfterStartblockTimestamp`
    );
    for (let i = 0; i < expectStakeMoresWithRewards.length; i++) {
      console.log(
        `${
          expectStakeMoresWithRewards[i].stakingPoolConfig.poolId
        }, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].truncatedTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].estimatedRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaRewardAtMaturityWei
        )}, ${
          expectStakeMoresWithRewards[i].stakeSecondsAfterStartblockTimestamp
        }`
      );
    }
    */

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    await stakeMoreWithVerify(
      stakingServiceInstance,
      expectStakeMoresWithRewards,
      startblockTimestamp,
      hre.ethers.constants.Zero,
      hre.ethers.constants.Zero
    );

    const lastStakeMoreConfig =
      expectStakeMoresWithRewards[expectStakeMoresWithRewards.length - 1];

    await unstakeStakeMoreWithVerify(
      stakingServiceInstance,
      stakingPoolInstance,
      contractAdminRoleAccounts[0],
      lastStakeMoreConfig,
      startblockTimestamp,
      stakingPoolRewardStats[lastStakeMoreConfig.stakingPoolConfig.poolId]
        .totalRewardWei,
      lastStakeMoreConfig.truncatedTotalStakeAmountsWei,
      lastStakeMoreConfig.expectRewardAtMaturityWei
    );

    const balanceOfContractAfterRemove =
      await lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
        stakingServiceInstance.address
      );

    console.log(
      `tokenAddress=${lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.address}, balanceOfContractAfterRemove=${balanceOfContractAfterRemove}`
    );

    expect(balanceOfContractAfterRemove).to.equal(hre.ethers.constants.Zero);
  });

  it("Should be able to stake more using stake token with 6 decimals and reward token with 18 decimals", async () => {
    const expectStakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs[16];
    const enduser = enduserAccounts[0];

    const stakeMoreInfo = [
      {
        stakeAmountWei: hre.ethers.utils.parseEther("33687.78329325"),
        stakeSecondsAfterStartblockTimestamp: 10,
        lastDigitDeltaStakeAmountWei: 10,
        lastDigitDeltaRewardAtMaturityWei: 10,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("790282.8319459"),
        stakeSecondsAfterStartblockTimestamp: 90258,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 10,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("864942.27974346"),
        stakeSecondsAfterStartblockTimestamp: 185959,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 20,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("12767.27475306"),
        stakeSecondsAfterStartblockTimestamp: 277810,
        lastDigitDeltaStakeAmountWei: 20,
        lastDigitDeltaRewardAtMaturityWei: 20,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("741305.67988497"),
        stakeSecondsAfterStartblockTimestamp: 370888,
        lastDigitDeltaStakeAmountWei: 30,
        lastDigitDeltaRewardAtMaturityWei: 30,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("510154.90180235"),
        stakeSecondsAfterStartblockTimestamp: 457287,
        lastDigitDeltaStakeAmountWei: 30,
        lastDigitDeltaRewardAtMaturityWei: 30,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("110020.33942366"),
        stakeSecondsAfterStartblockTimestamp: 905048,
        lastDigitDeltaStakeAmountWei: 40,
        lastDigitDeltaRewardAtMaturityWei: 30,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("386669.49521599"),
        stakeSecondsAfterStartblockTimestamp: 1284697,
        lastDigitDeltaStakeAmountWei: 50,
        lastDigitDeltaRewardAtMaturityWei: 40,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("525518.24746399"),
        stakeSecondsAfterStartblockTimestamp: 1477450,
        lastDigitDeltaStakeAmountWei: 60,
        lastDigitDeltaRewardAtMaturityWei: 50,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("480118.12460864"),
        stakeSecondsAfterStartblockTimestamp: 1968191,
        lastDigitDeltaStakeAmountWei: 70,
        lastDigitDeltaRewardAtMaturityWei: 50,
      },
      {
        stakeAmountWei: hre.ethers.utils.parseEther("572457.57581124"),
        stakeSecondsAfterStartblockTimestamp: 2169285,
        lastDigitDeltaStakeAmountWei: 70,
        lastDigitDeltaRewardAtMaturityWei: 50,
      },
    ];

    const stakingPoolRewardStats = {};

    const expectStakeMoresWithRewards = await setupStakeMoresWithRewards(
      stakeMoreInfo,
      enduser,
      expectStakingPoolConfig,
      stakingServiceInstance,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      governanceRoleAccounts[0]
    );

    /*
    console.log(`\nexpectStakeMoresWithRewards:`);
    console.log(
      `stakingPoolId, actualStakeAmountWei, expectStakeAmountWei, actualTotalStakeAmountsWei, truncatedTotalStakeAmountsWei, estimatedRewardAtMaturityWei, expectRewardAtMaturityWei, lastDigitDeltaStakeAmountWei, lastDigitDeltaRewardAtMaturityWei, stakeSecondsAfterStartblockTimestamp`
    );
    for (let i = 0; i < expectStakeMoresWithRewards.length; i++) {
      console.log(
        `${
          expectStakeMoresWithRewards[i].stakingPoolConfig.poolId
        }, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].actualTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].truncatedTotalStakeAmountsWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].estimatedRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].expectRewardAtMaturityWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaStakeAmountWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakeMoresWithRewards[i].lastDigitDeltaRewardAtMaturityWei
        )}, ${
          expectStakeMoresWithRewards[i].stakeSecondsAfterStartblockTimestamp
        }`
      );
    }
    */

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    await stakeMoreWithVerify(
      stakingServiceInstance,
      expectStakeMoresWithRewards,
      startblockTimestamp,
      hre.ethers.constants.Zero,
      hre.ethers.constants.Zero
    );

    const lastStakeMoreConfig =
      expectStakeMoresWithRewards[expectStakeMoresWithRewards.length - 1];

    await unstakeStakeMoreWithVerify(
      stakingServiceInstance,
      stakingPoolInstance,
      contractAdminRoleAccounts[0],
      lastStakeMoreConfig,
      startblockTimestamp,
      stakingPoolRewardStats[lastStakeMoreConfig.stakingPoolConfig.poolId]
        .totalRewardWei,
      lastStakeMoreConfig.truncatedTotalStakeAmountsWei,
      lastStakeMoreConfig.expectRewardAtMaturityWei
    );

    const balanceOfContractAfterRemove =
      await lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
        stakingServiceInstance.address
      );

    console.log(
      `tokenAddress=${lastStakeMoreConfig.stakingPoolConfig.stakeTokenInstance.address}, balanceOfContractAfterRemove=${balanceOfContractAfterRemove}`
    );

    expect(balanceOfContractAfterRemove).to.equal(hre.ethers.constants.Zero);
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

  it("should not allow stake of zero amount after truncation", async () => {
    const STAKING_POOL_CONFIGS_STAKE_TOKEN_6_DECIMALS_INDEX = 5;
    const stakeAmountWei = hre.ethers.utils.parseEther("0.000000999999999999");

    await expect(
      stakingServiceInstance.stake(
        stakingPoolStakeRewardTokenSameConfigs[
          STAKING_POOL_CONFIGS_STAKE_TOKEN_6_DECIMALS_INDEX
        ].poolId,
        stakeAmountWei
      )
    ).to.be.revertedWith("SSvcs: truncated stake amount");
  });

  it("should not allow stake with zero reward at maturity", async () => {
    const STAKING_POOL_CONFIGS_REWARD_TOKEN_6_DECIMALS_INDEX = 14;
    const stakeAmountWei = hre.ethers.utils.parseEther("0.000000000000000001");

    await expect(
      stakingServiceInstance.stake(
        stakingPoolStakeRewardTokenSameConfigs[
          STAKING_POOL_CONFIGS_REWARD_TOKEN_6_DECIMALS_INDEX
        ].poolId,
        stakeAmountWei
      )
    ).to.be.revertedWith("SSvcs: zero reward");
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

  it("should not allow invalid staking pool info", async () => {
    const testPoolInstance = await stakeHelpers.newMockStakingPool();
    const testServiceInstance = await stakeHelpers.newStakingService(
      testPoolInstance.address
    );

    const poolIdStakeDurationZero =
      await testPoolInstance.POOL_ID_STAKE_DURATION_ZERO();
    const poolIdStakeTokenAddressZero =
      await testPoolInstance.POOL_ID_STAKE_TOKEN_ADDRESS_ZERO();
    const poolIdStakeTokenDecimalsNineteen =
      await testPoolInstance.POOL_ID_STAKE_TOKEN_DECIMALS_NINETEEN();
    const poolIdRewardTokenAddressZero =
      await testPoolInstance.POOL_ID_REWARD_TOKEN_ADDRESS_ZERO();
    const poolIdRewardTokenDecimalsNineteen =
      await testPoolInstance.POOL_ID_REWARD_TOKEN_DECIMALS_NINETEEN();
    const poolIdPoolAprZero = await testPoolInstance.POOL_ID_POOL_APR_ZERO();

    await expect(
      testServiceInstance.getStakingPoolStats(poolIdStakeDurationZero)
    ).to.be.revertedWith("SSvcs: stake duration");

    await expect(
      testServiceInstance.getStakingPoolStats(poolIdStakeTokenAddressZero)
    ).to.be.revertedWith("SSvcs: stake token");

    await expect(
      testServiceInstance.getStakingPoolStats(poolIdStakeTokenDecimalsNineteen)
    ).to.be.revertedWith("SSvcs: stake decimals");

    await expect(
      testServiceInstance.getStakingPoolStats(poolIdRewardTokenAddressZero)
    ).to.be.revertedWith("SSvcs: reward token");

    await expect(
      testServiceInstance.getStakingPoolStats(poolIdRewardTokenDecimalsNineteen)
    ).to.be.revertedWith("SSvcs: reward decimals");

    await expect(
      testServiceInstance.getStakingPoolStats(poolIdPoolAprZero)
    ).to.be.revertedWith("SSvcs: pool APR");
  });

  it("should not allow invalid transfer of tokens from contract to account and vice versa", async () => {
    const enduserAccountAddress = await enduserAccounts[0].getAddress();
    const tokenInstance = stakeToken18DecimalsInstances[0];
    const tokenAddress = tokenInstance.address;
    const tokenDecimals = await tokenInstance.decimals();
    const transferAmountWei = hre.ethers.utils.parseEther(
      "0.000000000000000001"
    );

    const testPoolInstance = await stakeHelpers.newMockStakingPool();
    const testServiceInstance = await stakeHelpers.newMockStakingService(
      testPoolInstance.address
    );

    await expect(
      testServiceInstance.transferTokensToAccount(
        hre.ethers.constants.AddressZero,
        tokenDecimals,
        transferAmountWei,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: token address");

    await expect(
      testServiceInstance.transferTokensToAccount(
        tokenAddress,
        19,
        transferAmountWei,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: token decimals");

    await expect(
      testServiceInstance.transferTokensToAccount(
        tokenAddress,
        tokenDecimals,
        hre.ethers.constants.Zero,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: amount");

    await expect(
      testServiceInstance.transferTokensToAccount(
        tokenAddress,
        tokenDecimals,
        transferAmountWei,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");

    await expect(
      testServiceInstance.transferTokensToContract(
        hre.ethers.constants.AddressZero,
        tokenDecimals,
        transferAmountWei,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: token address");

    await expect(
      testServiceInstance.transferTokensToContract(
        tokenAddress,
        19,
        transferAmountWei,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: token decimals");

    await expect(
      testServiceInstance.transferTokensToContract(
        tokenAddress,
        tokenDecimals,
        hre.ethers.constants.Zero,
        enduserAccountAddress
      )
    ).to.be.revertedWith("SSvcs: amount");

    await expect(
      testServiceInstance.transferTokensToContract(
        tokenAddress,
        tokenDecimals,
        transferAmountWei,
        hre.ethers.constants.AddressZero
      )
    ).to.be.revertedWith("SSvcs: account");
  });

  it("should not allow invalid stake maturity timestamp", async () => {
    const stakeAmountWei = hre.ethers.utils.parseEther("0.000000000000000001");

    const testServiceInstance = await stakeHelpers.newMockStakingService(
      stakingPoolInstance.address
    );

    await expect(
      testServiceInstance.stake(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        stakeAmountWei
      )
    ).to.be.revertedWith("SSvcs: maturity timestamp");
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
    expect(balanceOfBeforeAdd).to.equal(
      testHelpers.scaleWeiToDecimals(
        expectBalanceOfBeforeAdd,
        rewardTokenDecimals
      )
    );

    const stakingPoolStatsBeforeAdd =
      await stakingServiceContractInstance.getStakingPoolStats(poolId);
    expect(stakingPoolStatsBeforeAdd.totalRewardWei).to.equal(
      expectTotalRewardWeiBeforeAdd
    );
    expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
      expectRewardToBeDistributedWei
    );

    const truncatedRewardAmountWei = computeTruncatedAmountWei(
      rewardAmountWei,
      rewardTokenDecimals
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
        truncatedRewardAmountWei
      );

    const expectedBalanceOfAfterAdd =
      stakingPoolRewardBalanceOf.add(rewardAmountWei);
    const expectBalanceOfAfterAdd = stakingPoolRewardBalanceOf.add(
      truncatedRewardAmountWei
    );

    const expectedTotalRewardWei =
      stakingPoolRewardStats[poolId].totalRewardWei.add(rewardAmountWei);
    stakingPoolRewardStats[poolId].totalRewardWei = stakingPoolRewardStats[
      poolId
    ].totalRewardWei.add(truncatedRewardAmountWei);

    const balanceOfAfterAdd = await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address
    );
    expect(balanceOfAfterAdd).to.equal(
      testHelpers.scaleWeiToDecimals(
        expectedBalanceOfAfterAdd,
        rewardTokenDecimals
      )
    );
    expect(balanceOfAfterAdd).to.equal(
      testHelpers.scaleWeiToDecimals(
        expectBalanceOfAfterAdd,
        rewardTokenDecimals
      )
    );

    const stakingPoolStatsAfterAdd =
      await stakingServiceContractInstance.getStakingPoolStats(poolId);

    verifyActualWithTruncatedValueWei(
      10,
      rewardTokenDecimals,
      stakingPoolStatsAfterAdd.totalRewardWei,
      expectedTotalRewardWei,
      hre.ethers.constants.Zero
    );

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
    isAddStake,
    shouldAdvanceBlockTimestamp
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

    /*
    console.log(
      `\nclaimRewardWithVerify: stakeExceedPoolReward=${stakeExceedPoolReward}, addStakeExceedPoolReward=${addStakeExceedPoolReward}, isAddStake=${isAddStake}, addStakeAmountWei=${stakeConfig.addStakeAmountWei}, exceedPoolReward=${stakeConfig.exceedPoolReward}`
    );
    */

    const {
      expectStakeAmountWei,
      expectStakeTimestamp,
      expectStakeMaturityTimestamp,
      expectRewardAtMaturityWei,
    } = verifyRewardAtMaturity(
      stakeConfig,
      startblockTimestamp,
      10,
      30,
      20,
      70,
      hre.ethers.constants.One,
      isAddStake &&
        stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
        !addStakeExceedPoolReward,
      false
    );

    const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
    if (
      shouldAdvanceBlockTimestamp &&
      currentBlockTimestamp < expectStakeMaturityTimestamp.toNumber()
    ) {
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
      } else {
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
      }

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

      if (
        stakeExceedPoolReward ||
        (afterRevoke && stakeConfig.shouldRevokeBeforeClaim)
      ) {
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
      } else if (isStakeSuspended) {
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

      await testHelpers.mineBlockAtTime(
        expectStakeMaturityTimestamp.toNumber()
      );
    }

    if (!stakeConfig.shouldClaim && !isStakeSuspended) {
      return [totalRewardWei, rewardToBeDistributedWei];
    }

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
    expect(claimableRewardWeiBeforeClaim).to.equal(expectRewardAtMaturityWei);

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
    stakingPoolConfigs,
    stakingPoolId,
    revokedStakesWei,
    expectAdminWalletAddress,
    expectStakingPoolStats
  ) {
    const adminSignerAddress = await adminSigner.getAddress();

    const expectTotalStakedWeiBeforeRemove = hre.ethers.constants.Zero;
    const expectTotalStakedWeiAfterRemove = hre.ethers.constants.Zero;

    for (const spid in expectStakingPoolStats) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === spid
      );

      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(spid);

      const expectTotalRevokedStakeWei =
        revokedStakesWei[spid] === undefined
          ? hre.ethers.constants.Zero
          : revokedStakesWei[spid];

      const stakeTokenDecimals =
        await stakingPoolConfig.stakeTokenInstance.decimals();

      const rewardTokenDecimals =
        await stakingPoolConfig.rewardTokenInstance.decimals();

      /*
      console.log(
        `\nremoveRevokedStakesWithVerify stakingPoolStatsBeforeRemove: spid=${spid}, poolUuid=${
          stakingPoolConfig.poolUuid
        }, stakeTokenAddress=${
          stakingPoolConfig.stakeTokenInstance.address
        }, stakeTokenDecimals=${stakeTokenDecimals}, rewardTokenAddress=${
          stakingPoolConfig.rewardTokenInstance.address
        }, rewardTokenDecimals=${rewardTokenDecimals}, totalRewardWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRewardWei
        )}, totalStakedWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalStakedWei
        )}, rewardToBeDistributedWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.rewardToBeDistributedWei
        )}, totalRevokedStakeWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRevokedStakeWei
        )}, poolSizeWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.poolSizeWei
        )}, expectTotalRevokedStakeWei=${hre.ethers.utils.formatEther(
          expectTotalRevokedStakeWei
        )}, revokedStakesWei=${
          spid in revokedStakesWei
            ? hre.ethers.utils.formatEther(revokedStakesWei[spid])
            : revokedStakesWei[spid]
        }, expectTotalStakedWei=${hre.ethers.utils.formatEther(
          expectStakingPoolStats[spid].totalStakedWei
        )}, expectTotalRewardWei=${hre.ethers.utils.formatEther(
          expectStakingPoolStats[spid].totalRewardWei
        )}, expectRewardToBeDistributedWei=${hre.ethers.utils.formatEther(
          expectStakingPoolStats[spid].rewardToBeDistributedWei
        )}`
      );
      */

      verifyActualWithTruncatedValueWei(
        0,
        Math.min(rewardTokenDecimals, stakeTokenDecimals),
        stakingPoolStatsBeforeRemove.totalRewardWei,
        expectStakingPoolStats[spid].totalRewardWei,
        hre.ethers.constants.Zero
      );

      expect(stakingPoolStatsBeforeRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[spid].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsBeforeRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[spid].totalStakedWei
      );

      verifyActualWithTruncatedValueWei(
        0,
        stakeTokenDecimals,
        stakingPoolStatsBeforeRemove.totalRevokedStakeWei,
        expectTotalRevokedStakeWei,
        hre.ethers.constants.Zero
      );
    }

    const adminWallet = await stakingServiceContractInstance.adminWallet();
    expect(adminWallet).to.equal(expectAdminWalletAddress);

    const specifiedStakingPoolConfig = stakingPoolConfigs.find(
      ({ poolId }) => poolId === stakingPoolId
    );

    const stakeTokenDecimals =
      await specifiedStakingPoolConfig.stakeTokenInstance.decimals();

    const expectRevokedStakeWei =
      revokedStakesWei[stakingPoolId] === undefined
        ? hre.ethers.constants.Zero
        : revokedStakesWei[stakingPoolId];

    const balanceOfContractBeforeRemove =
      await specifiedStakingPoolConfig.stakeTokenInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    const expectBalanceOfContractAfterRemove =
      balanceOfContractBeforeRemove.sub(
        testHelpers.scaleWeiToDecimals(
          expectRevokedStakeWei,
          stakeTokenDecimals
        )
      );

    const balanceOfAdminWalletBeforeRemove =
      await specifiedStakingPoolConfig.stakeTokenInstance.balanceOf(
        expectAdminWalletAddress
      );
    const expectBalanceOfAdminWalletAfterRemove =
      balanceOfAdminWalletBeforeRemove.add(
        testHelpers.scaleWeiToDecimals(
          expectRevokedStakeWei,
          stakeTokenDecimals
        )
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
        specifiedStakingPoolConfig.stakeTokenInstance.address,
        expectRevokedStakeWei
      );

    revokedStakesWei[stakingPoolId] = hre.ethers.constants.Zero;

    const balanceOfContractAfterRemove =
      await specifiedStakingPoolConfig.stakeTokenInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    expect(balanceOfContractAfterRemove).to.equal(
      expectBalanceOfContractAfterRemove
    );

    const balanceOfAdminWalletAfterRemove =
      await specifiedStakingPoolConfig.stakeTokenInstance.balanceOf(
        expectAdminWalletAddress
      );
    expect(balanceOfAdminWalletAfterRemove).to.equal(
      expectBalanceOfAdminWalletAfterRemove
    );

    expect(expectStakingPoolStats[stakingPoolId].totalStakedWei).to.equal(
      expectTotalStakedWeiAfterRemove
    );

    for (const spid in expectStakingPoolStats) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === spid
      );

      const expectTotalRevokedStakeWei =
        revokedStakesWei[spid] === undefined
          ? hre.ethers.constants.Zero
          : revokedStakesWei[spid];

      const stakeTokenDecimals =
        await stakingPoolConfig.stakeTokenInstance.decimals();

      const rewardTokenDecimals =
        await stakingPoolConfig.rewardTokenInstance.decimals();

      const stakingPoolStatsAfterRemove =
        await stakingServiceContractInstance.getStakingPoolStats(spid);

      verifyActualWithTruncatedValueWei(
        0,
        Math.min(rewardTokenDecimals, stakeTokenDecimals),
        stakingPoolStatsAfterRemove.totalRewardWei,
        expectStakingPoolStats[spid].totalRewardWei,
        hre.ethers.constants.Zero
      );

      expect(stakingPoolStatsAfterRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[spid].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsAfterRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[spid].totalStakedWei
      );

      verifyActualWithTruncatedValueWei(
        0,
        stakeTokenDecimals,
        stakingPoolStatsAfterRemove.totalRevokedStakeWei,
        expectTotalRevokedStakeWei,
        hre.ethers.constants.Zero
      );
    }
  }

  async function removeUnallocatedStakingPoolRewardWithVerify(
    stakingServiceContractInstance,
    adminSigner,
    stakingPoolConfigs,
    stakingPoolId,
    unallocatedRewardWei,
    expectAdminWalletAddress,
    expectStakingPoolStats
  ) {
    const adminSignerAddress = await adminSigner.getAddress();

    const expectTotalRewardWeiAfterRemove = hre.ethers.constants.Zero;

    // console.log(`\n`);

    for (const spid in expectStakingPoolStats) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === spid
      );

      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(spid);

      const stakeTokenDecimals =
        await stakingPoolConfig.stakeTokenInstance.decimals();

      const rewardTokenDecimals =
        await stakingPoolConfig.rewardTokenInstance.decimals();

      /*
      console.log(
        `removeUnallocatedStakingPoolRewardWithVerify: spid=${spid}, poolUuid=${stakingPoolConfig.poolUuid}, stakeTokenDecimals=${stakeTokenDecimals}, totalRewardWei=${stakingPoolStatsBeforeRemove.totalRewardWei}, expectTotalRewardWei=${expectStakingPoolStats[spid].totalRewardWei}, totalStakedWei=${stakingPoolStatsBeforeRemove.totalStakedWei}, expectTotalStakedWei=${expectStakingPoolStats[spid].totalStakedWei}, rewardToBeDistributedWei=${stakingPoolStatsBeforeRemove.rewardToBeDistributedWei}, expectRewardToBeDistributedWei=${expectStakingPoolStats[spid].rewardToBeDistributedWei}, totalRevokedStakeWei=${stakingPoolStatsBeforeRemove.totalRevokedStakeWei}`
      );
      */

      verifyActualWithTruncatedValueWei(
        0,
        Math.min(rewardTokenDecimals, stakeTokenDecimals),
        stakingPoolStatsBeforeRemove.totalRewardWei,
        expectStakingPoolStats[spid].totalRewardWei,
        hre.ethers.constants.Zero
      );

      expect(stakingPoolStatsBeforeRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[spid].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsBeforeRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[spid].totalStakedWei
      );
    }

    const adminWallet = await stakingServiceContractInstance.adminWallet();
    expect(adminWallet).to.equal(expectAdminWalletAddress);

    const specifiedStakingPoolConfig = stakingPoolConfigs.find(
      ({ poolId }) => poolId === stakingPoolId
    );

    const specifiedStakingPoolStakeTokenDecimals =
      await specifiedStakingPoolConfig.stakeTokenInstance.decimals();
    const specifiedStakingPoolRewardTokenDecimals =
      await specifiedStakingPoolConfig.rewardTokenInstance.decimals();

    const balanceOfContractBeforeRemove =
      await specifiedStakingPoolConfig.rewardTokenInstance.balanceOf(
        stakingServiceContractInstance.address
      );
    const expectBalanceOfContractAfterRemove =
      balanceOfContractBeforeRemove.sub(
        testHelpers.scaleWeiToDecimals(
          unallocatedRewardWei,
          specifiedStakingPoolRewardTokenDecimals
        )
      );

    const balanceOfAdminWalletBeforeRemove =
      await specifiedStakingPoolConfig.rewardTokenInstance.balanceOf(
        expectAdminWalletAddress
      );
    const expectBalanceOfAdminWalletAfterRemove =
      balanceOfAdminWalletBeforeRemove.add(
        testHelpers.scaleWeiToDecimals(
          unallocatedRewardWei,
          specifiedStakingPoolRewardTokenDecimals
        )
      );

    const expectUnallocatedRewardWei = expectStakingPoolStats[
      stakingPoolId
    ].totalRewardWei.sub(
      expectStakingPoolStats[stakingPoolId].rewardToBeDistributedWei
    );

    /*
    console.log(
      `\nremoveUnallocatedStakingPoolRewardWithVerify: poolId=${stakingPoolId}, poolUuid=${specifiedStakingPoolConfig.poolUuid}, stakeTokenDecimals=${specifiedStakingPoolStakeTokenDecimals}, rewardTokenDecimals=${specifiedStakingPoolRewardTokenDecimals}, unallocatedRewardWei=${unallocatedRewardWei}, expectUnallocatedRewardWei=${expectUnallocatedRewardWei}, totalRewardWei=${expectStakingPoolStats[stakingPoolId].totalRewardWei}, rewardToBeDistributedWei=${expectStakingPoolStats[stakingPoolId].rewardToBeDistributedWei}`
    );
    */

    verifyActualWithTruncatedValueWei(
      0,
      Math.min(
        specifiedStakingPoolRewardTokenDecimals,
        specifiedStakingPoolStakeTokenDecimals
      ),
      unallocatedRewardWei,
      expectUnallocatedRewardWei,
      hre.ethers.constants.Zero
    );

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
        specifiedStakingPoolConfig.rewardTokenInstance.address,
        expectUnallocatedRewardWei
      );

    const balanceOfContractAfterRemove =
      await specifiedStakingPoolConfig.rewardTokenInstance.balanceOf(
        stakingServiceContractInstance.address
      );

    verifyActualWithTruncatedValueWei(
      0,
      specifiedStakingPoolStakeTokenDecimals,
      balanceOfContractAfterRemove,
      expectBalanceOfContractAfterRemove,
      hre.ethers.constants.Zero
    );

    const balanceOfAdminWalletAfterRemove =
      await specifiedStakingPoolConfig.rewardTokenInstance.balanceOf(
        expectAdminWalletAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      specifiedStakingPoolStakeTokenDecimals,
      balanceOfAdminWalletAfterRemove,
      expectBalanceOfAdminWalletAfterRemove,
      hre.ethers.constants.Zero
    );

    expectStakingPoolStats[stakingPoolId].totalRewardWei =
      expectStakingPoolStats[stakingPoolId].totalRewardWei.sub(
        unallocatedRewardWei
      );

    verifyActualWithTruncatedValueWei(
      0,
      Math.min(
        specifiedStakingPoolRewardTokenDecimals,
        specifiedStakingPoolStakeTokenDecimals
      ),
      expectStakingPoolStats[stakingPoolId].totalRewardWei,
      expectTotalRewardWeiAfterRemove,
      hre.ethers.constants.Zero
    );

    for (const spid in expectStakingPoolStats) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === spid
      );

      const stakeTokenDecimals =
        await stakingPoolConfig.stakeTokenInstance.decimals();

      const rewardTokenDecimals =
        await stakingPoolConfig.rewardTokenInstance.decimals();

      const stakingPoolStatsAfterRemove =
        await stakingServiceContractInstance.getStakingPoolStats(spid);

      verifyActualWithTruncatedValueWei(
        0,
        Math.min(rewardTokenDecimals, stakeTokenDecimals),
        stakingPoolStatsAfterRemove.totalRewardWei,
        expectStakingPoolStats[spid].totalRewardWei,
        hre.ethers.constants.Zero
      );

      expect(stakingPoolStatsAfterRemove.rewardToBeDistributedWei).to.equal(
        expectStakingPoolStats[spid].rewardToBeDistributedWei
      );
      expect(stakingPoolStatsAfterRemove.totalStakedWei).to.equal(
        expectStakingPoolStats[spid].totalStakedWei
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

    const {
      expectStakeAmountWei,
      expectStakeTimestamp,
      expectStakeMaturityTimestamp,
      expectRewardAtMaturityWei,
      lastDigitDeltaStakeAmountWei,
      actualStakeAmountWei,
    } = verifyRewardAtMaturity(
      stakeConfig,
      startblockTimestamp,
      10,
      30,
      20,
      70,
      hre.ethers.constants.One,
      isAddStake &&
        stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
        !addStakeExceedPoolReward,
      false
    );

    const expectRewardAmountWei =
      hasClaimed && stakeConfig.shouldClaim
        ? hre.ethers.constants.Zero
        : expectRewardAtMaturityWei;
    const expectClaimableRewardWei =
      beforeMature || (hasClaimed && stakeConfig.shouldClaim)
        ? hre.ethers.constants.Zero
        : expectRewardAtMaturityWei;

    /*
    console.log(
      `\nrevokeStakeWithVerify 00: poolUuid=${stakeConfig.stakingPoolConfig.poolUuid}, poolId=${stakeConfig.stakingPoolConfig.poolId}, signerAddress=${signerAddress}, stakeAmountWei=${stakeConfig.stakeAmountWei}, addStakeAmountWei=${stakeConfig.addStakeAmountWei}, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${stakeConfig.shouldRevokeBeforeClaim}, shouldRevokeAfterClaim=${stakeConfig.shouldRevokeAfterClaim}, exceedPoolReward=${stakeConfig.exceedPoolReward}, stakeExceedPoolReward=${stakeExceedPoolReward}, addStakeExceedPoolReward=${addStakeExceedPoolReward}, hasRevoked=${hasRevoked}, expectRewardAmountWei=${expectRewardAmountWei}, expectClaimableRewardWei=${expectClaimableRewardWei}, beforeMature=${beforeMature}, hasClaimed=${hasClaimed}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, afterRevoke=${afterRevoke}, isAddStake=${isAddStake}`
    );
    */

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

    /*
    const curStakeInfo = await stakingServiceContractInstance.getStakeInfo(
      stakeConfig.stakingPoolConfig.poolId,
      signerAddress
    );

    console.log(
      `revokeStakeWithVerify 01: claimableRewardWeiBeforeRevoke=${claimableRewardWeiBeforeRevoke}, currentBlockTimestamp=${await testHelpers.getCurrentBlockTimestamp()}, curStakeInfo.stakeAmountWei=${
        curStakeInfo.stakeAmountWei
      }, curStakeInfo.stakeTimestamp=${
        curStakeInfo.stakeTimestamp
      }, curStakeInfo.stakeMaturityTimestamp=${
        curStakeInfo.stakeMaturityTimestamp
      }, curStakeInfo.estimatedRewardAtMaturityWei=${
        curStakeInfo.estimatedRewardAtMaturityWei
      }, curStakeInfo.rewardClaimedWei=${
        curStakeInfo.rewardClaimedWei
      }, stakeAmountWei=${stakeConfig.stakeAmountWei}, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, expectClaimableRewardWei=${expectClaimableRewardWei}, beforeMature=${beforeMature}, hasClaimed=${hasClaimed}, shouldClaim=${
        stakeConfig.shouldClaim
      }, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}`
    );
    */

    expect(claimableRewardWeiBeforeRevoke).to.equal(expectClaimableRewardWei);

    const stakeInfoBeforeRevoke =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      lastDigitDeltaStakeAmountWei,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoBeforeRevoke.stakeAmountWei,
      actualStakeAmountWei,
      hre.ethers.constants.Zero
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
      `\nrevokeStakeWithVerify StakeRevoked: poolUuid=${stakeConfig.stakingPoolConfig.poolUuid}, poolId=${stakeConfig.stakingPoolConfig.poolId}, signerAddress=${signerAddress}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAmountWei=${expectRewardAmountWei}, beforeMature=${beforeMature}, hasClaimed=${hasClaimed}, afterRevoke=${afterRevoke}, isAddStake=${isAddStake}`
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

      const truncatedStakeAmountWei = computeTruncatedAmountWei(
        stakes[i].stakeAmountWei,
        stakingPoolConfigs[stakingPoolConfigIndex].stakeTokenDecimals
      );
      const truncatedAddStakeAmountWei = computeTruncatedAmountWei(
        stakes[i].addStakeAmountWei,
        stakingPoolConfigs[stakingPoolConfigIndex].stakeTokenDecimals
      );

      let expectRewardAtMaturityWei;

      if (stakes[i].addStakeAmountWei.gt(hre.ethers.constants.Zero)) {
        const stateDurationAtAddStakeDays = Math.floor(
          (stakes[i].addStakeSecondsAfterStartblockTimestamp -
            stakes[i].stakeSecondsAfterStartblockTimestamp) /
            testHelpers.SECONDS_IN_DAY
        );

        const additionalRewardToDistributeWei = computeTruncatedAmountWei(
          estimateRewardAtMaturityWei(
            stakingPoolConfigs[stakingPoolConfigIndex].poolAprWei,
            stakingPoolConfigs[stakingPoolConfigIndex].stakeDurationDays,
            truncatedAddStakeAmountWei
          ),
          stakingPoolConfigs[stakingPoolConfigIndex].rewardTokenDecimals
        ).add(
          computeTruncatedAmountWei(
            estimateRewardAtMaturityWei(
              stakingPoolConfigs[stakingPoolConfigIndex].poolAprWei,
              stateDurationAtAddStakeDays,
              truncatedStakeAmountWei
            ),
            stakingPoolConfigs[stakingPoolConfigIndex].rewardTokenDecimals
          )
        );

        expectRewardAtMaturityWei = computeTruncatedAmountWei(
          estimateRewardAtMaturityWei(
            stakingPoolConfigs[stakingPoolConfigIndex].poolAprWei,
            stakingPoolConfigs[stakingPoolConfigIndex].stakeDurationDays,
            truncatedStakeAmountWei
          ),
          stakingPoolConfigs[stakingPoolConfigIndex].rewardTokenDecimals
        ).add(additionalRewardToDistributeWei);
      } else {
        expectRewardAtMaturityWei = computeTruncatedAmountWei(
          estimateRewardAtMaturityWei(
            stakingPoolConfigs[stakingPoolConfigIndex].poolAprWei,
            stakingPoolConfigs[stakingPoolConfigIndex].stakeDurationDays,
            truncatedStakeAmountWei
          ),
          stakingPoolConfigs[stakingPoolConfigIndex].rewardTokenDecimals
        );
      }

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
        totalStakeRewardsWei[poolId].amountWei.sub(totalStakeRewardLessByWei)
      );

      /*
      console.log(
        `${poolId}: balanceOfStakingPoolRewards[${totalStakeRewardsWei[poolId].rewardTokenInstance.address}]=${balanceOfStakingPoolRewards[totalStakeRewardsWei[poolId].rewardTokenInstance.address]}, totalStakeRewardsWei=${totalStakeRewardsWei[poolId]}`
      );
      */
    }

    /*
    console.log(
      `setupStakeConfig, poolUuid, poolId, stakeAmountWei, stakeSecondsAfterStartblockTimestamp, addStakeAmountWei, addStakeSecondsAfterStartblockTimestamp, signer, rewardClaimedWei, shouldClaim=, shouldRevokeBeforeClaim, shouldRevokeAfterClaim, exceedPoolReward`
    );

    for (let i = 0; i < stakeConfigs.length; i++) {
      console.log(
        `${i}, ${stakeConfigs[i].stakingPoolConfig.poolUuid}, ${
          stakeConfigs[i].stakingPoolConfig.poolId
        }, ${stakeConfigs[i].stakeAmountWei}, ${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, ${stakeConfigs[i].addStakeAmountWei}, ${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, ${await stakeConfigs[i].signer.getAddress()}, ${
          stakeConfigs[i].rewardClaimedWei
        }, ${stakeConfigs[i].shouldClaim}, ${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, ${stakeConfigs[i].shouldRevokeAfterClaim}, ${
          stakeConfigs[i].exceedPoolReward
        }`
      );
    }
    */

    return stakeConfigs;
  }

  async function setupStakeMoresWithRewards(
    stakeMoreInfo,
    enduser,
    stakingPoolConfig,
    stakingServiceContractInstance,
    balanceOfStakingPoolRewards,
    stakingPoolRewardStats,
    fromWalletSigner
  ) {
    const stakeMoresWithRewards = [];

    for (let i = 0; i < stakeMoreInfo.length; i++) {
      let actualTotalStakeAmountsWei;
      let additionalRewardToDistributeWei;
      let expectRewardAtMaturityWei;
      let truncatedTotalStakeAmountsWei;

      const actualStakeAmountWei = stakeMoreInfo[i].stakeAmountWei;
      const truncatedStakeAmountWei = computeTruncatedAmountWei(
        stakeMoreInfo[i].stakeAmountWei,
        stakingPoolConfig.stakeTokenDecimals
      );
      const expectStakeAmountWei = truncatedStakeAmountWei;

      actualTotalStakeAmountsWei = actualStakeAmountWei;
      truncatedTotalStakeAmountsWei = truncatedStakeAmountWei;
      additionalRewardToDistributeWei = hre.ethers.constants.Zero;
      expectRewardAtMaturityWei = computeTruncatedAmountWei(
        estimateRewardAtMaturityWei(
          stakingPoolConfig.poolAprWei,
          stakingPoolConfig.stakeDurationDays,
          truncatedStakeAmountWei
        ),
        stakingPoolConfig.rewardTokenDecimals
      );

      for (let j = 0; j < i; j++) {
        actualTotalStakeAmountsWei = actualTotalStakeAmountsWei.add(
          stakeMoreInfo[j].stakeAmountWei
        );
        const truncatedPastStakeAmountWei = computeTruncatedAmountWei(
          stakeMoreInfo[j].stakeAmountWei,
          stakingPoolConfig.stakeTokenDecimals
        );
        truncatedTotalStakeAmountsWei = truncatedTotalStakeAmountsWei.add(
          truncatedPastStakeAmountWei
        );

        const stateDurationAtAddStakeDays = Math.floor(
          (stakeMoreInfo[j + 1].stakeSecondsAfterStartblockTimestamp -
            stakeMoreInfo[j].stakeSecondsAfterStartblockTimestamp) /
            testHelpers.SECONDS_IN_DAY
        );

        expectRewardAtMaturityWei = expectRewardAtMaturityWei
          .add(
            computeTruncatedAmountWei(
              estimateRewardAtMaturityWei(
                stakingPoolConfig.poolAprWei,
                stakingPoolConfig.stakeDurationDays,
                truncatedPastStakeAmountWei
              ),
              stakingPoolConfig.rewardTokenDecimals
            )
          )
          .add(
            computeTruncatedAmountWei(
              estimateRewardAtMaturityWei(
                stakingPoolConfig.poolAprWei,
                stateDurationAtAddStakeDays,
                truncatedPastStakeAmountWei
              ),
              stakingPoolConfig.rewardTokenDecimals
            )
          );

        additionalRewardToDistributeWei = additionalRewardToDistributeWei.add(
          estimateRewardAtMaturityWei(
            stakingPoolConfig.poolAprWei,
            stateDurationAtAddStakeDays,
            truncatedPastStakeAmountWei
          )
        );
      }

      const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakingPoolConfig.poolAprWei,
        stakingPoolConfig.stakeDurationDays,
        actualTotalStakeAmountsWei
      ).add(additionalRewardToDistributeWei);

      stakeMoresWithRewards.push({
        stakingPoolConfig,
        signer: enduser,
        actualStakeAmountWei,
        expectStakeAmountWei,
        actualTotalStakeAmountsWei,
        truncatedTotalStakeAmountsWei,
        estimatedRewardAtMaturityWei,
        expectRewardAtMaturityWei,
        lastDigitDeltaStakeAmountWei:
          stakeMoreInfo[i].lastDigitDeltaStakeAmountWei,
        lastDigitDeltaRewardAtMaturityWei:
          stakeMoreInfo[i].lastDigitDeltaRewardAtMaturityWei,
        stakeSecondsAfterStartblockTimestamp:
          stakeMoreInfo[i].stakeSecondsAfterStartblockTimestamp,
      });
    }

    const lastStakeMoreWithReward =
      stakeMoresWithRewards[stakeMoresWithRewards.length - 1];

    balanceOfStakingPoolRewards[
      lastStakeMoreWithReward.stakingPoolConfig.rewardTokenInstance.address
    ] = await addStakingPoolRewardWithVerify(
      stakingServiceContractInstance,
      lastStakeMoreWithReward.stakingPoolConfig.rewardTokenInstance,
      fromWalletSigner,
      lastStakeMoreWithReward.stakingPoolConfig.poolId,
      balanceOfStakingPoolRewards[
        lastStakeMoreWithReward.stakingPoolConfig.rewardTokenInstance.address
      ],
      stakingPoolRewardStats,
      lastStakeMoreWithReward.expectRewardAtMaturityWei
    );

    return stakeMoresWithRewards;
  }

  async function verifyStakeInfoClaimableRewardForAddStake(
    stakingServiceContractInstance,
    stakeConfig,
    startblockTimestamp,
    isAddStake = false
  ) {
    const signerAddress = await stakeConfig.signer.getAddress();

    if (isAddStake) {
      const expectStakeAmountWei = computeTruncatedAmountWei(
        stakeConfig.stakeAmountWei,
        stakeConfig.stakingPoolConfig.stakeTokenDecimals
      );

      const expectStakeTimestampBeforeAddStake =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;
      const expectStakeMaturityTimestampBeforeAddStake =
        calculateStateMaturityTimestamp(
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          expectStakeTimestampBeforeAddStake
        );
      const expectClaimableRewardBeforeAddStakeWei = hre.ethers.constants.Zero;
      const expectEstimatedRewardAtMaturityBeforeAddStakeWei =
        computeTruncatedAmountWei(
          estimateRewardAtMaturityWei(
            stakeConfig.stakingPoolConfig.poolAprWei,
            stakeConfig.stakingPoolConfig.stakeDurationDays,
            expectStakeAmountWei
          ),
          stakeConfig.stakingPoolConfig.rewardTokenDecimals
        );
      const expectIsActiveBeforeAddStake = true;

      const claimableRewardWeiBeforeAddStake =
        await stakingServiceContractInstance.getClaimableRewardWei(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );

      /*
      const currentBlockTimestamp =
        await testHelpers.getCurrentBlockTimestamp();

      console.log(
        `verifyStakeInfoClaimableRewardForAddStake: isBeforeMaturity=${
          currentBlockTimestamp < expectStakeMaturityTimestampBeforeAddStake
        }, currentBlockTimestamp=${currentBlockTimestamp}, expectStakeMaturityTimestampBeforeAddStake=${expectStakeMaturityTimestampBeforeAddStake}, claimableRewardWeiBeforeAddStake=${claimableRewardWeiBeforeAddStake}, expectClaimableRewardBeforeAddStakeWei=${expectClaimableRewardBeforeAddStakeWei}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, expectStakeAmountWei=${expectStakeAmountWei}`
      );
      */

      expect(claimableRewardWeiBeforeAddStake).to.equal(
        expectClaimableRewardBeforeAddStakeWei
      );

      const stakeInfoBeforeAddStake =
        await stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        );

      /*
      console.log(
        `verifyStakeInfoClaimableRewardForAddStake: stakeTokenDecimals=${stakeConfig.stakingPoolConfig.stakeTokenDecimals}, stakeAmountWei=${stakeInfoBeforeAddStake.stakeAmountWei}, expectStakeAmountWei=${expectStakeAmountWei}`
      );
      */

      verifyActualWithTruncatedValueWei(
        10,
        stakeConfig.stakingPoolConfig.stakeTokenDecimals,
        stakeInfoBeforeAddStake.stakeAmountWei,
        stakeConfig.stakeAmountWei,
        hre.ethers.constants.Zero
      );

      expect(stakeInfoBeforeAddStake.stakeAmountWei).to.equal(
        expectStakeAmountWei
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

  async function verifyStakeMoreInfoClaimableRewardForAddStake(
    stakingServiceContractInstance,
    stakeMoreConfig,
    startblockTimestamp,
    isAddStake
  ) {
    const signerAddress = await stakeMoreConfig.signer.getAddress();

    if (isAddStake) {
      const expectStakeTimestampBeforeAddStake =
        startblockTimestamp +
        stakeMoreConfig.stakeSecondsAfterStartblockTimestamp;
      const expectStakeMaturityTimestampBeforeAddStake =
        calculateStateMaturityTimestamp(
          stakeMoreConfig.stakingPoolConfig.stakeDurationDays,
          expectStakeTimestampBeforeAddStake
        );
      const expectClaimableRewardBeforeAddStakeWei = hre.ethers.constants.Zero;
      const expectRewardClaimedWei = hre.ethers.constants.Zero;
      const expectIsActiveBeforeAddStake = true;

      const claimableRewardWeiBeforeAddStake =
        await stakingServiceContractInstance.getClaimableRewardWei(
          stakeMoreConfig.stakingPoolConfig.poolId,
          signerAddress
        );

      /*
      const currentBlockTimestamp =
        await testHelpers.getCurrentBlockTimestamp();

      console.log(
        `verifyStakeMoreInfoClaimableRewardForAddStake: isBeforeMaturity=${
          currentBlockTimestamp < expectStakeMaturityTimestampBeforeAddStake
        }, currentBlockTimestamp=${currentBlockTimestamp}, expectStakeMaturityTimestampBeforeAddStake=${expectStakeMaturityTimestampBeforeAddStake}, claimableRewardWeiBeforeAddStake=${claimableRewardWeiBeforeAddStake}, expectClaimableRewardBeforeAddStakeWei=${expectClaimableRewardBeforeAddStakeWei}, poolId=${
          stakeMoreConfig.stakingPoolConfig.poolId
        }, actualStakeAmountWei=${
          stakeMoreConfig.actualStakeAmountWei
        }, expectStakeAmountWei=${stakeMoreConfig.expectStakeAmountWei}`
      );
      */

      expect(claimableRewardWeiBeforeAddStake).to.equal(
        expectClaimableRewardBeforeAddStakeWei
      );

      const stakeInfoBeforeAddStake =
        await stakingServiceContractInstance.getStakeInfo(
          stakeMoreConfig.stakingPoolConfig.poolId,
          signerAddress
        );

      /*
      console.log(
        `verifyStakeMoreInfoClaimableRewardForAddStake verifyActualWithTruncatedValueWei: lastDigitDeltaStakeAmountWei=${stakeMoreConfig.lastDigitDeltaStakeAmountWei}, stakeTokenDecimals=${stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals}, stakeAmountWei=${stakeInfoBeforeAddStake.stakeAmountWei}, actualStakeAmountWei=${stakeMoreConfig.actualStakeAmountWei}, expectStakeAmountWei=${stakeMoreConfig.expectStakeAmountWei}, actualTotalStakeAmountsWei=${stakeMoreConfig.actualTotalStakeAmountsWei}, truncatedTotalStakeAmountsWei=${stakeMoreConfig.truncatedTotalStakeAmountsWei}`
      );
      */

      verifyActualWithTruncatedValueWei(
        stakeMoreConfig.lastDigitDeltaStakeAmountWei,
        stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
        stakeInfoBeforeAddStake.stakeAmountWei,
        stakeMoreConfig.actualTotalStakeAmountsWei,
        hre.ethers.constants.Zero
      );

      expect(stakeInfoBeforeAddStake.stakeAmountWei).to.equal(
        stakeMoreConfig.truncatedTotalStakeAmountsWei
      );
      expect(stakeInfoBeforeAddStake.stakeTimestamp).to.equal(
        expectStakeTimestampBeforeAddStake
      );
      expect(stakeInfoBeforeAddStake.stakeMaturityTimestamp).to.equal(
        expectStakeMaturityTimestampBeforeAddStake
      );
      expect(stakeInfoBeforeAddStake.estimatedRewardAtMaturityWei).to.equal(
        stakeMoreConfig.expectRewardAtMaturityWei
      );
      expect(stakeInfoBeforeAddStake.rewardClaimedWei).to.equal(
        expectRewardClaimedWei
      );
      expect(stakeInfoBeforeAddStake.isActive).to.equal(
        expectIsActiveBeforeAddStake
      );
    } else {
      await expect(
        stakingServiceContractInstance.getClaimableRewardWei(
          stakeMoreConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeMoreConfig.stakingPoolConfig.poolId,
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

    const {
      expectStakeAmountWei,
      expectStakeTimestamp,
      expectStakeMaturityTimestamp,
      expectRewardAtMaturityWei,
      additionalRewardToDistributeWei,
      actualStakeAmountWei,
    } = verifyRewardAtMaturity(
      stakeConfig,
      startblockTimestamp,
      10,
      30,
      20,
      70,
      hre.ethers.constants.One,
      isAddStake && stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero),
      true
    );

    /*
    const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    console.log(
      `\nstakeWithVerify verifyStakeInfoClaimableRewardForAddStake00: currentBlockTimestamp=${currentBlockTimestamp}, isAddStake=${isAddStake}, poolUuid=${
        stakeConfig.stakingPoolConfig.poolUuid
      }, poolId=${stakeConfig.stakingPoolConfig.poolId}, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
      `stakeWithVerify getStakingPoolStats00: isAddStake=${isAddStake}, poolUuid=${
        stakeConfig.stakingPoolConfig.poolUuid
      }, poolId=${stakeConfig.stakingPoolConfig.poolId}, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
      `stakeWithVerify transferAndApproveWithVerify00: isAddStake=${isAddStake}, poolUuid=${
        stakeConfig.stakingPoolConfig.poolUuid
      }, poolId=${stakeConfig.stakingPoolConfig.poolId}, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
    );
    */

    await testHelpers.transferAndApproveWithVerify(
      stakeConfig.stakingPoolConfig.stakeTokenInstance,
      governanceRoleAccounts[0],
      stakeConfig.signer,
      stakingServiceContractInstance.address,
      expectStakeAmountWei
    );

    /*
    console.log(
      `stakeWithVerify closeStakingPool00: isAddStake=${isAddStake}, poolUuid=${
        stakeConfig.stakingPoolConfig.poolUuid
      }, poolId=${stakeConfig.stakingPoolConfig.poolId}, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
      `stakeWithVerify verifyStakeInfoClaimableRewardForAddStake01: isAddStake=${isAddStake}, poolUuid=${
        stakeConfig.stakingPoolConfig.poolUuid
      }, poolId=${stakeConfig.stakingPoolConfig.poolId}, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
      `stakeWithVerify stake00: isAddStake=${isAddStake}, poolId=${
        stakeConfig.stakingPoolConfig.poolId
      }, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
    );
    */

    await expect(
      stakingServiceContractInstance
        .connect(stakeConfig.signer)
        .stake(stakeConfig.stakingPoolConfig.poolId, actualStakeAmountWei)
    ).to.be.revertedWith("SSvcs: closed");

    /*
    console.log(
      `stakeWithVerify openStakingPool00: isAddStake=${isAddStake}, poolId=${
        stakeConfig.stakingPoolConfig.poolId
      }, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
      `stakeWithVerify verifyStakeInfoClaimableRewardForAddStake02: isAddStake=${isAddStake}, poolId=${
        stakeConfig.stakingPoolConfig.poolId
      }, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
      `stakeWithVerify setTimeNextBlock: isAddStake=${isAddStake}, expectStakeTimestamp=${expectStakeTimestamp}, poolId=${
        stakeConfig.stakingPoolConfig.poolId
      }, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
    );
    */

    await testHelpers.setTimeNextBlock(expectStakeTimestamp);

    let expectTotalStakedWei;
    let expectRewardToBeDistributedWei;

    if (stakeExceedPoolReward || addStakeExceedPoolReward) {
      expectTotalStakedWei = totalStakedWei;
      expectRewardToBeDistributedWei = rewardToBeDistributedWei;

      /*
      const curStakingPoolStats =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeConfig.stakingPoolConfig.poolId
        );

      console.log(
        `stakeWithVerify stake01: isAddStake=${isAddStake}, totalRewardWei=${
          curStakingPoolStats.totalRewardWei
        }, totalStakedWei=${
          curStakingPoolStats.totalStakedWei
        }, rewardToBeDistributedWei=${
          curStakingPoolStats.rewardToBeDistributedWei
        }, totalRevokedStakeWei=${
          curStakingPoolStats.totalRevokedStakeWei
        }, poolSizeWei=${
          curStakingPoolStats.poolSizeWei
        }, expectTotalStakedWei=${expectTotalStakedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .stake(stakeConfig.stakingPoolConfig.poolId, actualStakeAmountWei)
      ).to.be.revertedWith("SSvcs: insufficient");
    } else {
      expectTotalStakedWei = totalStakedWei.add(expectStakeAmountWei);
      expectRewardToBeDistributedWei = rewardToBeDistributedWei.add(
        additionalRewardToDistributeWei
      );

      /*
      console.log(
        `stakeWithVerify stake02: isAddStake=${isAddStake}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${
          stakeConfig.exceedPoolReward
        }, expectStakeAmountWei=${expectStakeAmountWei}, expectStakeTimestamp=${expectStakeTimestamp}, expectStakeMaturityTimestamp=${expectStakeMaturityTimestamp}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .stake(stakeConfig.stakingPoolConfig.poolId, actualStakeAmountWei)
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
      `stakeWithVerify verifyStakesInfo00: isAddStake=${isAddStake}, poolUuid=${
        stakeConfig.stakingPoolConfig.poolUuid
      }, poolId=${stakeConfig.stakingPoolConfig.poolId}, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
        `stakeWithVerify claimReward00: isAddStake=${isAddStake}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: uninitialized");

      /*
      console.log(
        `stakeWithVerify unstake00: isAddStake=${isAddStake}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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
        `stakeWithVerify claimReward01: isAddStake=${isAddStake}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeConfig.signer)
          .claimReward(stakeConfig.stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      /*
      console.log(
        `stakeWithVerify unstake01: isAddStake=${isAddStake}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
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

  async function stakeMoreWithVerify(
    stakingServiceContractInstance,
    stakeMoreConfigs,
    startblockTimestamp,
    totalStakedWei,
    rewardToBeDistributedWei
  ) {
    let expectTotalStakedWei = totalStakedWei;
    let expectRewardToBeDistributedWei = rewardToBeDistributedWei;

    /*
    console.log(
      `\nstakeMoreWithVerify: startblockTimestamp=${startblockTimestamp}, totalStakedWei=${totalStakedWei}, rewardToBeDistributedWei=${rewardToBeDistributedWei}, expectTotalStakedWei=${expectTotalStakedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}`
    );
    */

    for (let i = 0; i < stakeMoreConfigs.length; i++) {
      const signerAddress = await stakeMoreConfigs[i].signer.getAddress();

      /*
      console.log(
        `\nstakeMoreWithVerify verifyStakeMoreRewardAtMaturity ${i}: poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}, actualStakeAmountWei=${stakeMoreConfigs[i].actualStakeAmountWei}, expectStakeAmountWei=${stakeMoreConfigs[i].expectStakeAmountWei}, estimateRewardAtMaturityWei=${stakeMoreConfigs[i].estimatedRewardAtMaturityWei}, expectRewardAtMaturityWei=${stakeMoreConfigs[i].expectRewardAtMaturityWei}, lastDigitDeltaStakeAmountWei=${stakeMoreConfigs[i].lastDigitDeltaStakeAmountWei}, lastDigitDeltaRewardAtMaturityWei=${stakeMoreConfigs[i].lastDigitDeltaRewardAtMaturityWei}, stakeSecondsAfterStartblockTimestamp=${stakeMoreConfigs[i].stakeSecondsAfterStartblockTimestamp}, startblockTimestamp=${startblockTimestamp}`
      );
      */

      const { expectStakeTimestamp, expectStakeMaturityTimestamp } =
        verifyStakeMoreRewardAtMaturity(
          stakeMoreConfigs[i],
          startblockTimestamp,
          hre.ethers.BigNumber.from(5)
        );

      /*
      console.log(
        `stakeMoreWithVerify verifyStakeMoreInfoClaimableRewardForAddStake ${i}: poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}, ${stakeMoreConfigs[i].actualStakeAmountWei}, ${stakeMoreConfigs[i].expectStakeAmountWei}, ${stakeMoreConfigs[i].estimatedRewardAtMaturityWei}, ${stakeMoreConfigs[i].expectRewardAtMaturityWei}, ${stakeMoreConfigs[i].lastDigitDeltaStakeAmountWei}, ${stakeMoreConfigs[i].lastDigitDeltaRewardAtMaturityWei}, ${stakeMoreConfigs[i].stakeSecondsAfterStartblockTimestamp}, startblockTimestamp=${startblockTimestamp}`
      );
      */

      await verifyStakeMoreInfoClaimableRewardForAddStake(
        stakingServiceContractInstance,
        i > 0 ? stakeMoreConfigs[i - 1] : stakeMoreConfigs[i],
        startblockTimestamp,
        i > 0
      );

      // console.log(`stakeMoreWithVerify getStakingPoolStats before ${i}`);

      const stakingPoolStatsBeforeAdd =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeMoreConfigs[i].stakingPoolConfig.poolId
        );

      /*
      console.log(
        `stakeMoreWithVerify getStakingPoolStats before ${i}: poolUuid=${stakeMoreConfigs[i].stakingPoolConfig.poolUuid}, poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}, totalStakedWei=${stakingPoolStatsBeforeAdd.totalStakedWei}, expectTotalStakedWei=${expectTotalStakedWei}, rewardToBeDistributedWei=${stakingPoolStatsBeforeAdd.rewardToBeDistributedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}, totalRewardWei=${stakingPoolStatsBeforeAdd.totalRewardWei}`
      );
      */

      expect(stakingPoolStatsBeforeAdd.totalStakedWei).to.equal(
        expectTotalStakedWei
      );
      expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
        expectRewardToBeDistributedWei
      );

      /*
      console.log(
        `stakeMoreWithVerify transferAndApproveWithVerify ${i}: stakeTokenAddress=${stakeMoreConfigs[i].stakingPoolConfig.stakeTokenInstance.address}, signerAddress=${signerAddress}, expectStakeAmountWei=${stakeMoreConfigs[i].expectStakeAmountWei}`
      );
      */

      await testHelpers.transferAndApproveWithVerify(
        stakeMoreConfigs[i].stakingPoolConfig.stakeTokenInstance,
        governanceRoleAccounts[0],
        stakeMoreConfigs[i].signer,
        stakingServiceContractInstance.address,
        stakeMoreConfigs[i].expectStakeAmountWei
      );

      /*
      console.log(
        `stakeMoreWithVerify setTimeNextBlock ${i}: expectStakeTimestamp=${expectStakeTimestamp}`
      );
      */

      await testHelpers.setTimeNextBlock(expectStakeTimestamp);

      expectTotalStakedWei = expectTotalStakedWei.add(
        stakeMoreConfigs[i].expectStakeAmountWei
      );
      expectRewardToBeDistributedWei = rewardToBeDistributedWei.add(
        stakeMoreConfigs[i].expectRewardAtMaturityWei
      );

      /*
      console.log(
        `stakeMoreWithVerify stake ${i}: signerAddress=${signerAddress}, poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}, actualStakeAmount=${stakeMoreConfigs[i].actualStakeAmountWei}, stakeTokenAddress=${stakeMoreConfigs[i].stakingPoolConfig.stakeTokenInstance.address}, expectStakeAmountWei=${stakeMoreConfigs[i].expectStakeAmountWei}, expectStakeTimestamp=${expectStakeTimestamp}, expectRewardAtMaturityWei=${stakeMoreConfigs[i].expectRewardAtMaturityWei}`
      );
      */

      await expect(
        stakingServiceContractInstance
          .connect(stakeMoreConfigs[i].signer)
          .stake(
            stakeMoreConfigs[i].stakingPoolConfig.poolId,
            stakeMoreConfigs[i].actualStakeAmountWei
          )
      )
        .to.emit(stakingServiceContractInstance, "Staked")
        .withArgs(
          stakeMoreConfigs[i].stakingPoolConfig.poolId,
          signerAddress,
          stakeMoreConfigs[i].stakingPoolConfig.stakeTokenInstance.address,
          stakeMoreConfigs[i].expectStakeAmountWei,
          expectStakeTimestamp,
          expectStakeMaturityTimestamp,
          stakeMoreConfigs[i].expectRewardAtMaturityWei
        );

      /*
      console.log(
        `stakeMoreWithVerify verifyStakeMoreInfo ${i}: rewardToBeDistributedWei=${rewardToBeDistributedWei}, startblockTimestamp=${startblockTimestamp}, poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}, ${stakeMoreConfigs[i].actualStakeAmountWei}, ${stakeMoreConfigs[i].expectStakeAmountWei}, ${stakeMoreConfigs[i].estimatedRewardAtMaturityWei}, ${stakeMoreConfigs[i].expectRewardAtMaturityWei}, ${stakeMoreConfigs[i].lastDigitDeltaStakeAmountWei}, ${stakeMoreConfigs[i].lastDigitDeltaRewardAtMaturityWei}, ${stakeMoreConfigs[i].stakeSecondsAfterStartblockTimestamp}, startblockTimestamp=${startblockTimestamp}`
      );
      */

      await verifyStakeMoreInfo(
        stakingServiceContractInstance,
        startblockTimestamp,
        stakeMoreConfigs[i]
      );

      /*
      console.log(
        `stakeMoreWithVerify getStakingPoolStats after ${i}: poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}`
      );
      */

      const stakingPoolStatsAfterAdd =
        await stakingServiceContractInstance.getStakingPoolStats(
          stakeMoreConfigs[i].stakingPoolConfig.poolId
        );

      /*
      console.log(
        `stakeMoreWithVerify getStakingPoolStats after ${i}: poolUuid=${stakeMoreConfigs[i].stakingPoolConfig.poolUuid}, poolId=${stakeMoreConfigs[i].stakingPoolConfig.poolId}, totalStakedWei=${stakingPoolStatsAfterAdd.totalStakedWei}, expectTotalStakedWei=${expectTotalStakedWei}, rewardToBeDistributedWei=${stakingPoolStatsAfterAdd.rewardToBeDistributedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}, totalRewardWei=${stakingPoolStatsAfterAdd.totalRewardWei}, expectTotalRewardWei=${stakingPoolStatsBeforeAdd.totalRewardWei}, isOpen=${stakingPoolStatsAfterAdd.isOpen}, expectIsOpen=${stakingPoolStatsBeforeAdd.isOpen}, isActive=${stakingPoolStatsAfterAdd.isActive}, expectIsActive=${stakingPoolStatsBeforeAdd.isActive}`
      );
      */

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

      await expect(
        stakingServiceContractInstance
          .connect(stakeMoreConfigs[i].signer)
          .claimReward(stakeMoreConfigs[i].stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");

      await expect(
        stakingServiceContractInstance
          .connect(stakeMoreConfigs[i].signer)
          .unstake(stakeMoreConfigs[i].stakingPoolConfig.poolId)
      ).to.be.revertedWith("SSvcs: not mature");
    }

    /*
    console.log(
      `stakeMoreWithVerify: expectTotalStakedWei=${expectTotalStakedWei}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWei}`
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
        expect(balanceOfBeforeAdd).to.equal(
          testHelpers.scaleWeiToDecimals(
            expectBalanceOfBeforeAdd,
            rewardTokenDecimals
          )
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
        expect(balanceOfAfterAdd).to.equal(
          testHelpers.scaleWeiToDecimals(
            expectBalanceOfBeforeAdd,
            rewardTokenDecimals
          )
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

    /*
    console.log(
      `\n\nstake, poolUuid, poolId, poolAprWei, stakeDurationDays, stakeTokenAddress, rewardTokenAddress, stakeAmountWei, stakeSecondsAfterStartblockTimestamp, addStakeAmountWei, addStakeSecondsAfterStartblockTimestamp, signer, rewardClaimedWei, shouldClaim, shouldRevokeBeforeClaim, shouldRevokeAfterClaim, exceedPoolReward`
    );
    */

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `${i}, ${stakeConfigs[i].stakingPoolConfig.poolUuid}, ${
          stakeConfigs[i].stakingPoolConfig.poolId
        }, ${hre.ethers.utils.formatEther(
          stakeConfigs[i].stakingPoolConfig.poolAprWei
        )}, ${stakeConfigs[i].stakingPoolConfig.stakeDurationDays}, ${
          stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
        }, ${
          stakeConfigs[i].stakingPoolConfig.rewardTokenInstance.address
        }, ${hre.ethers.utils.formatEther(stakeConfigs[i].stakeAmountWei)}, ${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, ${hre.ethers.utils.formatEther(
          stakeConfigs[i].addStakeAmountWei
        )}, ${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, ${await stakeConfigs[
          i
        ].signer.getAddress()}, ${hre.ethers.utils.formatEther(
          stakeConfigs[i].rewardClaimedWei
        )}, ${stakeConfigs[i].shouldClaim}, ${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, ${stakeConfigs[i].shouldRevokeAfterClaim}, ${
          stakeConfigs[i].exceedPoolReward
        }`
      );
      */

      const stakeExceedPoolReward =
        stakeConfigs[i].exceedPoolReward &&
        !stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero);
      const addStakeExceedPoolReward =
        stakeConfigs[i].exceedPoolReward &&
        isAddStake &&
        stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero);

      const {
        expectStakeAmountWei,
        expectRewardAtMaturityWei,
        additionalRewardToDistributeWei,
      } = verifyRewardAtMaturity(
        stakeConfigs[i],
        0, // unused
        10,
        30,
        20,
        70,
        hre.ethers.constants.One,
        isAddStake &&
          stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero),
        false
      );

      if (stakeExceedPoolReward) {
        const expectUnallocatedRewardWei = expectRewardAtMaturityWei;

        if (stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei) {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId].add(
              expectUnallocatedRewardWei
            );
        } else {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            expectUnallocatedRewardWei;
        }

        /*
        console.log(
          `testRemoveUnallocatedStakingPoolReward 01: stakeExceedPoolReward=${stakeExceedPoolReward}, expectUnallocatedRewardWei=${hre.ethers.utils.formatEther(
            expectUnallocatedRewardWei
          )}, expectRewardAtMaturityWei=${hre.ethers.utils.formatEther(
            expectRewardAtMaturityWei
          )}, additionalRewardToDistributeWei=${hre.ethers.utils.formatEther(
            additionalRewardToDistributeWei
          )}, poolUuid=${stakeConfigs[i].stakingPoolConfig.poolUuid}, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          }, rewardTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.rewardTokenInstance.address
          }, stakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].stakeAmountWei
          )}, addStakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].addStakeAmountWei
          )}, rewardClaimedWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].rewardClaimedWei
          )}, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${
            stakeConfigs[i].exceedPoolReward
          }, unallocatedRewardsWei=${hre.ethers.utils.formatEther(
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId]
          )}, revokedStakesWei=${
            stakeConfigs[i].stakingPoolConfig.poolId in revokedStakesWei
              ? hre.ethers.utils.formatEther(
                  revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId]
                )
              : revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId]
          }, totalRevokedStakesWei=${
            stakeConfigs[i].stakingPoolConfig.poolId in totalRevokedStakesWei
              ? hre.ethers.utils.formatEther(
                  totalRevokedStakesWei[
                    stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
                  ]
                )
              : totalRevokedStakesWei[
                  stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
                ]
          }`
        );
        */
      } else if (
        (stakeConfigs[i].shouldRevokeBeforeClaim ||
          stakeConfigs[i].shouldRevokeAfterClaim) &&
        !stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero)
      ) {
        const expectUnallocatedRewardWei = expectRewardAtMaturityWei;

        if (
          !stakeConfigs[i].shouldClaim ||
          stakeConfigs[i].shouldRevokeBeforeClaim ||
          !stakeConfigs[i].shouldRevokeAfterClaim
        ) {
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

        /*
        console.log(
          `testRemoveUnallocatedStakingPoolReward 02: expectUnallocatedRewardWei=${hre.ethers.utils.formatEther(
            expectUnallocatedRewardWei
          )}, expectRewardAtMaturityWei=${hre.ethers.utils.formatEther(
            expectRewardAtMaturityWei
          )}, additionalRewardToDistributeWei=${hre.ethers.utils.formatEther(
            additionalRewardToDistributeWei
          )}, poolUuid=${stakeConfigs[i].stakingPoolConfig.poolUuid}, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          }, rewardTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.rewardTokenInstance.address
          }, stakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].stakeAmountWei
          )}, addStakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].addStakeAmountWei
          )}, rewardClaimedWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].rewardClaimedWei
          )}, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${
            stakeConfigs[i].exceedPoolReward
          }, unallocatedRewardsWei=${
            stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei
              ? hre.ethers.utils.formatEther(
                  unallocatedRewardsWei[
                    stakeConfigs[i].stakingPoolConfig.poolId
                  ]
                )
              : unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId]
          }, revokedStakesWei=${hre.ethers.utils.formatEther(
            revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId]
          )}, totalRevokedStakesWei=${hre.ethers.utils.formatEther(
            totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
            ]
          )}`
        );
        */
      } else if (
        (stakeConfigs[i].shouldRevokeBeforeClaim ||
          stakeConfigs[i].shouldRevokeAfterClaim) &&
        stakeConfigs[i].addStakeAmountWei.gt(hre.ethers.constants.Zero)
      ) {
        const expectRevokedStakeWei = addStakeExceedPoolReward
          ? computeTruncatedAmountWei(
              stakeConfigs[i].stakeAmountWei,
              stakeConfigs[i].stakingPoolConfig.stakeTokenDecimals
            )
          : expectStakeAmountWei;

        const expectUnallocatedRewardWei =
          stakeConfigs[i].shouldClaim &&
          !stakeConfigs[i].shouldRevokeBeforeClaim &&
          stakeConfigs[i].shouldRevokeAfterClaim
            ? additionalRewardToDistributeWei
            : expectRewardAtMaturityWei;

        if (
          !stakeConfigs[i].shouldClaim ||
          stakeConfigs[i].shouldRevokeBeforeClaim ||
          !stakeConfigs[i].shouldRevokeAfterClaim ||
          addStakeExceedPoolReward
        ) {
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
              expectRevokedStakeWei
            );
        } else {
          revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            expectRevokedStakeWei;
        }

        if (
          stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address in
          totalRevokedStakesWei
        ) {
          totalRevokedStakesWei[
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          ] = totalRevokedStakesWei[
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          ].add(expectRevokedStakeWei);
        } else {
          totalRevokedStakesWei[
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          ] = expectRevokedStakeWei;
        }

        /*
        console.log(
          `testRemoveUnallocatedStakingPoolReward 03: expectUnallocatedRewardWei=${hre.ethers.utils.formatEther(
            expectUnallocatedRewardWei
          )}, expectRewardAtMaturityWei=${hre.ethers.utils.formatEther(
            expectRewardAtMaturityWei
          )}, additionalRewardToDistributeWei=${hre.ethers.utils.formatEther(
            additionalRewardToDistributeWei
          )}, poolUuid=${stakeConfigs[i].stakingPoolConfig.poolUuid}, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          }, rewardTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.rewardTokenInstance.address
          }, stakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].stakeAmountWei
          )}, addStakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].addStakeAmountWei
          )}, rewardClaimedWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].rewardClaimedWei
          )}, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${
            stakeConfigs[i].exceedPoolReward
          }, unallocatedRewardsWei=${
            stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei
              ? hre.ethers.utils.formatEther(
                  unallocatedRewardsWei[
                    stakeConfigs[i].stakingPoolConfig.poolId
                  ]
                )
              : unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId]
          }, revokedStakesWei=${hre.ethers.utils.formatEther(
            revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId]
          )}, totalRevokedStakesWei=${hre.ethers.utils.formatEther(
            totalRevokedStakesWei[
              stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
            ]
          )}`
        );
        */
      } else if (
        addStakeExceedPoolReward &&
        !stakeConfigs[i].shouldRevokeBeforeClaim &&
        !stakeConfigs[i].shouldRevokeAfterClaim
      ) {
        const expectUnallocatedRewardWei = additionalRewardToDistributeWei;

        if (stakeConfigs[i].stakingPoolConfig.poolId in unallocatedRewardsWei) {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId].add(
              expectUnallocatedRewardWei
            );
        } else {
          unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId] =
            expectUnallocatedRewardWei;
        }

        /*
        const expectRevokedStakeWei = computeTruncatedAmountWei(
          stakeConfigs[i].addStakeAmountWei,
          stakeConfigs[i].stakingPoolConfig.stakeTokenDecimals
        );

        console.log(
          `testRemoveUnallocatedStakingPoolReward 04: expectRevokedStakeWei=${hre.ethers.utils.formatEther(
            expectRevokedStakeWei
          )}, expectUnallocatedRewardWei=${hre.ethers.utils.formatEther(
            expectUnallocatedRewardWei
          )}, expectRewardAtMaturityWei=${hre.ethers.utils.formatEther(
            expectRewardAtMaturityWei
          )}, additionalRewardToDistributeWei=${hre.ethers.utils.formatEther(
            additionalRewardToDistributeWei
          )}, poolUuid=${stakeConfigs[i].stakingPoolConfig.poolUuid}, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
          }, rewardTokenAddress=${
            stakeConfigs[i].stakingPoolConfig.rewardTokenInstance.address
          }, stakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].stakeAmountWei
          )}, addStakeAmountWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].addStakeAmountWei
          )}, rewardClaimedWei=${hre.ethers.utils.formatEther(
            stakeConfigs[i].rewardClaimedWei
          )}, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${
            stakeConfigs[i].exceedPoolReward
          }, unallocatedRewardsWei=${hre.ethers.utils.formatEther(
            unallocatedRewardsWei[stakeConfigs[i].stakingPoolConfig.poolId]
          )}, revokedStakesWei=${
            stakeConfigs[i].stakingPoolConfig.poolId in revokedStakesWei
              ? hre.ethers.utils.formatEther(
                  revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId]
                )
              : revokedStakesWei[stakeConfigs[i].stakingPoolConfig.poolId]
          }, totalRevokedStakesWei=${
            stakeConfigs[i].stakingPoolConfig.poolId in totalRevokedStakesWei
              ? hre.ethers.utils.formatEther(
                  totalRevokedStakesWei[
                    stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
                  ]
                )
              : totalRevokedStakesWei[
                  stakeConfigs[i].stakingPoolConfig.stakeTokenInstance.address
                ]
          }`
        );
        */
      }
    }

    // console.log(`\n`);

    for (const stakingPoolId in unallocatedRewardsWei) {
      /*
      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(stakingPoolId);

      console.log(
        `testRemoveUnallocatedStakingPoolReward removeUnallocatedStakingPoolRewardWithVerify: poolId=${stakingPoolId} unallocatedRewardsWei=${hre.ethers.utils.formatEther(
          unallocatedRewardsWei[stakingPoolId]
        )}, expectRevokedStakesWei=${hre.ethers.utils.formatEther(
          revokedStakesWei[stakingPoolId]
        )}, expectTotalRewardWei=${hre.ethers.utils.formatEther(
          expectStakingPoolStats[stakingPoolId].totalRewardWei
        )}, expectRewardToBeDistributedWei=${hre.ethers.utils.formatEther(
          expectStakingPoolStats[stakingPoolId].rewardToBeDistributedWei
        )}, expectTotalStakedWei=${hre.ethers.utils.formatEther(
          expectStakingPoolStats[stakingPoolId].totalStakedWei
        )}, totalStakedWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalStakedWei
        )}, totalRewardWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRewardWei
        )}, rewardToBeDistributedWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.rewardToBeDistributedWei
        )}, totalRevokedStakeWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRevokedStakeWei
        )}`
      );
      */

      await removeUnallocatedStakingPoolRewardWithVerify(
        stakingServiceContractInstance,
        adminSigner,
        stakingPoolConfigs,
        stakingPoolId,
        unallocatedRewardsWei[stakingPoolId].sub(totalStakeRewardLessByWei),
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

      /*
      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(stakingPoolId);

      console.log(
        `testRemoveUnallocatedStakingPoolReward balanceOfStakingService: poolUuid=${
          stakingPoolConfig.poolUuid
        }, poolId=${stakingPoolId}, stakeTokenAddress=${
          stakingPoolConfig.stakeTokenInstance.address
        }, rewardTokenAddress=${
          stakingPoolConfig.rewardTokenInstance.address
        }, rewardTokenDecimals=${rewardTokenDecimals}, balanceOfContractAfterRemove=${balanceOfContractAfterRemove}, expectBalanceOfContractAfterRemove=${expectBalanceOfContractAfterRemove}, totalRevokedStakesWei=${hre.ethers.utils.formatEther(
          totalRevokedStakesWei[stakingPoolConfig.stakeTokenInstance.address]
        )}, revokedStakesWei=${
          stakingPoolId in revokedStakesWei
            ? hre.ethers.utils.formatEther(revokedStakesWei[stakingPoolId])
            : revokedStakesWei[stakingPoolId]
        }, totalRewardWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRewardWei
        )}, totalStakedWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalStakedWei
        )}, rewardToBeDistributedWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.rewardToBeDistributedWei
        )}, totalRevokedStakeWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRevokedStakeWei
        )}, poolSizeWei=${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.poolSizeWei
        )}`
      );
      */

      expect(balanceOfContractAfterRemove).to.equal(
        expectBalanceOfContractAfterRemove
      );
    }

    /*
    console.log(
      `\ntestRemoveUnallocatedStakingPoolReward: revokedStakesWei=${JSON.stringify(
        revokedStakesWei
      )}`
    );
    */

    for (const stakingPoolId in revokedStakesWei) {
      /*
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === stakingPoolId
      );

      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(stakingPoolId);

      console.log(
        `\ntestRemoveUnallocatedStakingPoolReward removeRevokedStakesWithVerify: poolUuid=${stakingPoolConfig.poolUuid}, stakingPoolId=${stakingPoolId}, unallocatedRewardsWei=${unallocatedRewardsWei[stakingPoolId]}, expectRevokedStakesWei=${revokedStakesWei[stakingPoolId]}, expectTotalRewardWei=${expectStakingPoolStats[stakingPoolId].totalRewardWei}, expectRewardToBeDistributedWei=${expectStakingPoolStats[stakingPoolId].rewardToBeDistributedWei}, expectTotalStakedWei=${expectStakingPoolStats[stakingPoolId].totalStakedWei}, totalStakedWei=${stakingPoolStatsBeforeRemove.totalStakedWei}, totalRewardWei=${stakingPoolStatsBeforeRemove.totalRewardWei}, rewardToBeDistributedWei=${stakingPoolStatsBeforeRemove.rewardToBeDistributedWei}, totalRevokedStakeWei=${stakingPoolStatsBeforeRemove.totalRevokedStakeWei}`
      );
      */

      await removeRevokedStakesWithVerify(
        stakingServiceContractInstance,
        adminSigner,
        stakingPoolConfigs,
        stakingPoolId,
        revokedStakesWei,
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
    stakingPoolRewardStats,
    stakeConfigs,
    adminSigner
  ) {
    const expectStakingPoolStats = {};

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nstake ${i}, poolId=${
          stakeConfigs[i].stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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

    /*
    console.log(`\nAFTER STAKE:`);
    await consoleLogExpectStakingPoolStats(
      stakingServiceContractInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      expectStakingPoolStats
    );
    */

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nsuspendStake ${i}, poolId=${
          stakeConfigs[i].stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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
      const currentBlockTimestamp =
        await testHelpers.getCurrentBlockTimestamp();

      console.log(
        `\n\nclaimReward00 ${i}, currentBlockTimestamp=${currentBlockTimestamp}, startblockTimestamp=${startblockTimestamp}, poolUuid=${
          stakeConfigs[i].stakingPoolConfig.poolUuid
        }, poolId=${stakeConfigs[i].stakingPoolConfig.poolId}, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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
        false,
        false
      );
    }

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      const currentBlockTimestamp =
        await testHelpers.getCurrentBlockTimestamp();

      console.log(
        `\n\nresumeStake ${i}, currentBlockTimestamp=${currentBlockTimestamp}, startblockTimestamp=${startblockTimestamp}, poolUuid=${
          stakeConfigs[i].stakingPoolConfig.poolUuid
        }, poolId=${stakeConfigs[i].stakingPoolConfig.poolId}, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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
        const currentBlockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        console.log(
          `\n\naddStake ${i}, currentBlockTimestamp=${currentBlockTimestamp}, startblockTimestamp=${startblockTimestamp}, poolUuid=${
            stakeConfigs[i].stakingPoolConfig.poolUuid
          }, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeAmountWei=${
            stakeConfigs[i].stakeAmountWei
          }, stakeSecondsAfterStartblockTimestamp=${
            stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
          }, addStakeAmountWei=${
            stakeConfigs[i].addStakeAmountWei
          }, addStakeSecondsAfterStartblockTimestamp=${
            stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
          }, signer=${await stakeConfigs[
            i
          ].signer.getAddress()}, rewardClaimedWei=${
            stakeConfigs[i].rewardClaimedWei
          }, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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

    /*
    console.log(`\nAFTER ADD STAKE:`);
    await consoleLogExpectStakingPoolStats(
      stakingServiceContractInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      expectStakingPoolStats
    );
    */

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldRevokeBeforeClaim) {
        /*
        console.log(
          `\n\nrevokeStake00 ${i}, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeAmountWei=${
            stakeConfigs[i].stakeAmountWei
          }, stakeSecondsAfterStartblockTimestamp=${
            stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
          }, addStakeAmountWei=${
            stakeConfigs[i].addStakeAmountWei
          }, addStakeSecondsAfterStartblockTimestamp=${
            stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
          }, signer=${await stakeConfigs[
            i
          ].signer.getAddress()}, rewardClaimedWei=${
            stakeConfigs[i].rewardClaimedWei
          }, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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

    /*
    console.log(`\nAFTER REVOKE BEFORE CLAIM:`);
    await consoleLogExpectStakingPoolStats(
      stakingServiceContractInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      expectStakingPoolStats
    );
    */

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nclaimReward01 ${i}, poolId=${
          stakeConfigs[i].stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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
        false,
        false,
        true,
        true,
        true
      );
    }

    /*
    console.log(`\nAFTER CLAIM:`);
    await consoleLogExpectStakingPoolStats(
      stakingServiceContractInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      expectStakingPoolStats
    );
    */

    for (let i = 0; i < stakeConfigs.length; i++) {
      const poolId = stakeConfigs[i].stakingPoolConfig.poolId;

      if (stakeConfigs[i].shouldRevokeAfterClaim) {
        /*
        console.log(
          `\n\nrevokeStake01 ${i}, poolUuid=${
            stakeConfigs[i].stakingPoolConfig.poolUuid
          }, poolId=${
            stakeConfigs[i].stakingPoolConfig.poolId
          }, stakeAmountWei=${
            stakeConfigs[i].stakeAmountWei
          }, stakeSecondsAfterStartblockTimestamp=${
            stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
          }, addStakeAmountWei=${
            stakeConfigs[i].addStakeAmountWei
          }, addStakeSecondsAfterStartblockTimestamp=${
            stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
          }, signer=${await stakeConfigs[
            i
          ].signer.getAddress()}, rewardClaimedWei=${
            stakeConfigs[i].rewardClaimedWei
          }, shouldClaim=${
            stakeConfigs[i].shouldClaim
          }, shouldRevokeBeforeClaim=${
            stakeConfigs[i].shouldRevokeBeforeClaim
          }, shouldRevokeAfterClaim=${
            stakeConfigs[i].shouldRevokeAfterClaim
          }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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

    /*
    console.log(`\nAFTER REVOKE AFTER CLAIM:`);
    await consoleLogExpectStakingPoolStats(
      stakingServiceContractInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      expectStakingPoolStats
    );
    */

    for (let i = 0; i < stakeConfigs.length; i++) {
      /*
      console.log(
        `\n\nunstake ${i}, poolUuid=${
          stakeConfigs[i].stakingPoolConfig.poolUuid
        }, poolId=${stakeConfigs[i].stakingPoolConfig.poolId}, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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
    console.log(`\nAFTER UNSTAKE:`);
    await consoleLogExpectStakingPoolStats(
      stakingServiceContractInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      expectStakingPoolStats
    );
    */

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

    // const expectRewardBeforeMaturityWei = hre.ethers.constants.Zero;
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

    const {
      expectStakeAmountWei,
      expectRewardAtMaturityWei: expectedRewardAtMaturityWei,
    } = verifyRewardAtMaturity(
      stakeConfig,
      startblockTimestamp,
      10,
      20,
      20,
      50,
      hre.ethers.constants.Zero,
      isAddStake &&
        stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
        !addStakeExceedPoolReward,
      false
    );

    const expectRewardAtMaturityWei = stakeConfig.shouldClaim
      ? hre.ethers.constants.Zero
      : expectedRewardAtMaturityWei;

    /*
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
    */

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

    verifyActualWithTruncatedValueWei(
      0,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      claimableRewardWeiBeforeUnstake,
      expectRewardAtMaturityWei,
      hre.ethers.constants.Zero
    );

    const stakeInfoBeforeUnstake =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoBeforeUnstake.stakeAmountWei,
      expectStakeAmountWei,
      hre.ethers.constants.Zero
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

    verifyActualWithTruncatedValueWei(
      0,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      claimableRewardWeiAfterStakeResumed,
      expectRewardAtMaturityWei,
      hre.ethers.constants.Zero
    );

    const stakeInfoAfterStakeResumed =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoAfterStakeResumed.stakeAmountWei,
      expectStakeAmountWei,
      hre.ethers.constants.Zero
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

    verifyActualWithTruncatedValueWei(
      0,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      claimableRewardWeiAfterPoolResumed,
      expectRewardAtMaturityWei,
      hre.ethers.constants.Zero
    );

    const stakeInfoAfterPoolResumed =
      await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoAfterPoolResumed.stakeAmountWei,
      expectStakeAmountWei,
      hre.ethers.constants.Zero
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

  async function unstakeStakeMoreWithVerify(
    stakingServiceContractInstance,
    stakingPoolContractInstance,
    adminSigner,
    stakeMoreConfig,
    startblockTimestamp,
    totalRewardWei,
    totalStakedWei,
    rewardToBeDistributedWei
  ) {
    const signerAddress = await stakeMoreConfig.signer.getAddress();
    const adminSignerAddress = await adminSigner.getAddress();

    const expectRewardAfterStakeSuspendedWei = hre.ethers.constants.Zero;
    const expectRewardAfterPoolSuspendedWei = hre.ethers.constants.Zero;

    const { expectStakeMaturityTimestamp } = verifyStakeMoreRewardAtMaturity(
      stakeMoreConfig,
      startblockTimestamp,
      hre.ethers.BigNumber.from(5)
    );

    /*
    console.log(
      `\nunstakeStakeMoreWithVerify: startblockTimestamp=${startblockTimestamp}, totalRewardWei=${totalRewardWei}, totalStakedWei=${totalStakedWei}, rewardToBeDistributedWei=${rewardToBeDistributedWei}, expectStakeMaturityTimestamp=${expectStakeMaturityTimestamp}`
    );
    */

    await testHelpers.mineBlockAtTime(expectStakeMaturityTimestamp.toNumber());

    const expectStakeAmountWei = stakeMoreConfig.truncatedTotalStakeAmountsWei;
    const expectRewardAtMaturityWei = stakeMoreConfig.expectRewardAtMaturityWei;
    const expectRewardClaimedWei = hre.ethers.constants.Zero;

    const balanceOfRewardTokenBeforeUnstake =
      await stakeMoreConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
        signerAddress
      );
    const balanceOfStakeTokenBeforeUnstake =
      await stakeMoreConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
        signerAddress
      );

    const claimableRewardWeiBeforeUnstake =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    /*
    console.log(
      `unstakeStakeMoreWithVerify: claimableRewardWeiBeforeUnstake=${claimableRewardWeiBeforeUnstake}, poolId=${stakeMoreConfig.stakingPoolConfig.poolId}, signerAddress=${signerAddress}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, balanceOfRewardTokenBeforeUnstake=${balanceOfRewardTokenBeforeUnstake}, balanceOfStakeTokenBeforeUnstake=${balanceOfStakeTokenBeforeUnstake}`
    );
    */

    verifyActualWithTruncatedValueWei(
      0,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      claimableRewardWeiBeforeUnstake,
      expectRewardAtMaturityWei,
      hre.ethers.constants.Zero
    );

    const stakeInfoBeforeUnstake =
      await stakingServiceContractInstance.getStakeInfo(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    /*
    console.log(
      `unstakeStakeMoreWithVerify: stakeInfoBeforeUnstakeStakeAmountWei=${stakeInfoBeforeUnstake.stakeAmountWei}, stakeInfoBeforeUnstakeRewardClaimedWei=${stakeInfoBeforeUnstake.rewardClaimedWei}, poolId=${stakeMoreConfig.stakingPoolConfig.poolId}, signerAddress=${signerAddress}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, balanceOfRewardTokenBeforeUnstake=${balanceOfRewardTokenBeforeUnstake}, balanceOfStakeTokenBeforeUnstake=${balanceOfStakeTokenBeforeUnstake}`
    );
    */

    verifyActualWithTruncatedValueWei(
      0,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoBeforeUnstake.stakeAmountWei,
      expectStakeAmountWei,
      hre.ethers.constants.Zero
    );

    expect(stakeInfoBeforeUnstake.rewardClaimedWei).to.equal(
      expectRewardClaimedWei
    );

    const stakingPoolStatsBeforeUnstake =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeMoreConfig.stakingPoolConfig.poolId
      );

    /*
    console.log(
      `unstakeStakeMoreWithVerify: stakingPoolStatsBeforeUnstakeTotalRewardWei=${stakingPoolStatsBeforeUnstake.totalRewardWei}, stakingPoolStatsBeforeUnstakeTotalStakedWei=${stakingPoolStatsBeforeUnstake.totalStakedWei}, stakingPoolStatsBeforeUnstakeRewardToBeDistributedWei=${stakingPoolStatsBeforeUnstake.rewardToBeDistributedWei}, poolId=${stakeMoreConfig.stakingPoolConfig.poolId}, signerAddress=${signerAddress}, expectStakeAmountWei=${expectStakeAmountWei}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, balanceOfRewardTokenBeforeUnstake=${balanceOfRewardTokenBeforeUnstake}, balanceOfStakeTokenBeforeUnstake=${balanceOfStakeTokenBeforeUnstake}, totalRewardWei=${totalRewardWei}, totalStakedWei=${totalStakedWei}, rewardToBeDistributedWei=${rewardToBeDistributedWei}`
    );
    */

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
        .suspendStake(stakeMoreConfig.stakingPoolConfig.poolId, signerAddress)
    )
      .to.emit(stakingServiceContractInstance, "StakeSuspended")
      .withArgs(
        stakeMoreConfig.stakingPoolConfig.poolId,
        adminSignerAddress,
        signerAddress
      );

    const claimableRewardWeiAfterStakeSuspended =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterStakeSuspended).to.equal(
      expectRewardAfterStakeSuspendedWei
    );

    const stakeInfoAfterStakeSuspended =
      await stakingServiceContractInstance.getStakeInfo(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoAfterStakeSuspended.rewardClaimedWei).to.equal(
      expectRewardClaimedWei
    );

    const stakingPoolStatsAfterStakeSuspended =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeMoreConfig.stakingPoolConfig.poolId
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
        .connect(stakeMoreConfig.signer)
        .unstake(stakeMoreConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: stake suspended");

    await expect(
      stakingServiceContractInstance
        .connect(adminSigner)
        .resumeStake(stakeMoreConfig.stakingPoolConfig.poolId, signerAddress)
    )
      .to.emit(stakingServiceContractInstance, "StakeResumed")
      .withArgs(
        stakeMoreConfig.stakingPoolConfig.poolId,
        adminSignerAddress,
        signerAddress
      );

    const claimableRewardWeiAfterStakeResumed =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      claimableRewardWeiAfterStakeResumed,
      expectRewardAtMaturityWei,
      hre.ethers.constants.Zero
    );

    const stakeInfoAfterStakeResumed =
      await stakingServiceContractInstance.getStakeInfo(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoAfterStakeResumed.stakeAmountWei,
      expectStakeAmountWei,
      hre.ethers.constants.Zero
    );

    expect(stakeInfoAfterStakeResumed.rewardClaimedWei).to.equal(
      expectRewardClaimedWei
    );

    const stakingPoolStatsAfterStakeResumed =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeMoreConfig.stakingPoolConfig.poolId
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
        .suspendStakingPool(stakeMoreConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolSuspended")
      .withArgs(stakeMoreConfig.stakingPoolConfig.poolId, adminSignerAddress);

    const claimableRewardWeiAfterPoolSuspended =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(claimableRewardWeiAfterPoolSuspended).to.equal(
      expectRewardAfterPoolSuspendedWei
    );

    const stakeInfoAfterPoolSuspended =
      await stakingServiceContractInstance.getStakeInfo(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );
    expect(stakeInfoAfterPoolSuspended.rewardClaimedWei).to.equal(
      expectRewardClaimedWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeMoreConfig.signer)
        .unstake(stakeMoreConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: pool suspended");

    await expect(
      stakingPoolContractInstance
        .connect(adminSigner)
        .resumeStakingPool(stakeMoreConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingPoolContractInstance, "StakingPoolResumed")
      .withArgs(stakeMoreConfig.stakingPoolConfig.poolId, adminSignerAddress);

    const claimableRewardWeiAfterPoolResumed =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      claimableRewardWeiAfterPoolResumed,
      expectRewardAtMaturityWei,
      hre.ethers.constants.Zero
    );

    const stakeInfoAfterPoolResumed =
      await stakingServiceContractInstance.getStakeInfo(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      );

    verifyActualWithTruncatedValueWei(
      0,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfoAfterPoolResumed.stakeAmountWei,
      expectStakeAmountWei,
      hre.ethers.constants.Zero
    );

    expect(stakeInfoAfterPoolResumed.rewardClaimedWei).to.equal(
      expectRewardClaimedWei
    );

    const expectUnstakeAmountWei = expectStakeAmountWei;
    const expectTotalRewardWei = totalRewardWei.sub(expectRewardAtMaturityWei);
    const expectTotalStakedWei = totalStakedWei.sub(expectUnstakeAmountWei);
    const expectRewardToBeDistributedWei = rewardToBeDistributedWei.sub(
      expectRewardAtMaturityWei
    );

    await expect(
      stakingServiceContractInstance
        .connect(stakeMoreConfig.signer)
        .unstake(stakeMoreConfig.stakingPoolConfig.poolId)
    )
      .to.emit(stakingServiceContractInstance, "Unstaked")
      .withArgs(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress,
        stakeMoreConfig.stakingPoolConfig.stakeTokenInstance.address,
        expectUnstakeAmountWei,
        stakeMoreConfig.stakingPoolConfig.rewardTokenInstance.address,
        expectRewardAtMaturityWei
      );

    const rewardTokenDecimals =
      await stakeMoreConfig.stakingPoolConfig.rewardTokenInstance.decimals();

    const stakeTokenDecimals =
      await stakeMoreConfig.stakingPoolConfig.stakeTokenInstance.decimals();

    if (
      stakeMoreConfig.stakingPoolConfig.stakeTokenInstance.address ===
      stakeMoreConfig.stakingPoolConfig.rewardTokenInstance.address
    ) {
      const expectBalanceOfStakeRewardTokenAfterUnstake =
        balanceOfRewardTokenBeforeUnstake.add(
          testHelpers.scaleWeiToDecimals(
            expectRewardAtMaturityWei.add(expectUnstakeAmountWei),
            rewardTokenDecimals
          )
        );

      const balanceOfStakeRewardTokenAfterUnstake =
        await stakeMoreConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
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
        await stakeMoreConfig.stakingPoolConfig.rewardTokenInstance.balanceOf(
          signerAddress
        );
      expect(balanceOfRewardTokenAfterUnstake).to.equal(
        expectBalanceOfRewardTokenAfterUnstake
      );

      const balanceOfStakeTokenAfterUnstake =
        await stakeMoreConfig.stakingPoolConfig.stakeTokenInstance.balanceOf(
          signerAddress
        );
      expect(balanceOfStakeTokenAfterUnstake).to.equal(
        expectBalanceOfStakeTokenAfterUnstake
      );
    }

    await expect(
      stakingServiceContractInstance.getClaimableRewardWei(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance.getStakeInfo(
        stakeMoreConfig.stakingPoolConfig.poolId,
        signerAddress
      )
    ).to.be.revertedWith("SSvcs: uninitialized");

    const stakingPoolStatsAfterUnstake =
      await stakingServiceContractInstance.getStakingPoolStats(
        stakeMoreConfig.stakingPoolConfig.poolId
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
        .connect(stakeMoreConfig.signer)
        .claimReward(stakeMoreConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeMoreConfig.signer)
        .unstake(stakeMoreConfig.stakingPoolConfig.poolId)
    ).to.be.revertedWith("SSvcs: uninitialized");

    return [
      expectTotalRewardWei,
      expectTotalStakedWei,
      expectRewardToBeDistributedWei,
    ];
  }

  function verifyRewardAtMaturity(
    stakeConfig,
    startblockTimestamp,
    stakeLastDigitDeltaStakeAmountWei,
    stakeLastDigitDeltaRewardAtMaturityWei,
    addStakeLastDigitDeltaStakeAmountWei,
    addStakeLastDigitDeltaRewardAtMaturityWei,
    actualRewardAtMaturityDeltaWei,
    includeAddStake,
    isAddStakeOnly
  ) {
    let expectStakeAmountWei;
    let expectStakeTimestamp;
    let expectRewardAtMaturityWei;
    let lastDigitDeltaStakeAmountWei;
    let lastDigitDeltaRewardAtMaturityWei;
    let additionalRewardToDistributeWei;
    let actualStakeAmountWei;
    let estimatedRewardAtMaturityWei;

    if (includeAddStake) {
      actualStakeAmountWei = isAddStakeOnly
        ? stakeConfig.addStakeAmountWei
        : stakeConfig.stakeAmountWei.add(stakeConfig.addStakeAmountWei);
      const truncatedStakeAmountWei = computeTruncatedAmountWei(
        stakeConfig.stakeAmountWei,
        stakeConfig.stakingPoolConfig.stakeTokenDecimals
      );
      const truncatedAddStakeAmountWei = computeTruncatedAmountWei(
        stakeConfig.addStakeAmountWei,
        stakeConfig.stakingPoolConfig.stakeTokenDecimals
      );
      expectStakeAmountWei = isAddStakeOnly
        ? truncatedAddStakeAmountWei
        : truncatedStakeAmountWei.add(truncatedAddStakeAmountWei);

      lastDigitDeltaStakeAmountWei = addStakeLastDigitDeltaStakeAmountWei;
      lastDigitDeltaRewardAtMaturityWei =
        addStakeLastDigitDeltaRewardAtMaturityWei;

      expectStakeTimestamp =
        startblockTimestamp +
        stakeConfig.addStakeSecondsAfterStartblockTimestamp;

      const stateDurationAtAddStakeDays = Math.floor(
        (stakeConfig.addStakeSecondsAfterStartblockTimestamp -
          stakeConfig.stakeSecondsAfterStartblockTimestamp) /
          testHelpers.SECONDS_IN_DAY
      );

      additionalRewardToDistributeWei = computeTruncatedAmountWei(
        estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          truncatedAddStakeAmountWei
        ),
        stakeConfig.stakingPoolConfig.rewardTokenDecimals
      ).add(
        computeTruncatedAmountWei(
          estimateRewardAtMaturityWei(
            stakeConfig.stakingPoolConfig.poolAprWei,
            stateDurationAtAddStakeDays,
            truncatedStakeAmountWei
          ),
          stakeConfig.stakingPoolConfig.rewardTokenDecimals
        )
      );

      expectRewardAtMaturityWei = computeTruncatedAmountWei(
        estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          truncatedStakeAmountWei
        ),
        stakeConfig.stakingPoolConfig.rewardTokenDecimals
      ).add(additionalRewardToDistributeWei);

      estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakeConfig.stakingPoolConfig.poolAprWei,
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        stakeConfig.stakeAmountWei.add(stakeConfig.addStakeAmountWei)
      ).add(
        estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stateDurationAtAddStakeDays,
          truncatedStakeAmountWei
        )
      );
    } else {
      actualStakeAmountWei = stakeConfig.stakeAmountWei;
      expectStakeAmountWei = computeTruncatedAmountWei(
        stakeConfig.stakeAmountWei,
        stakeConfig.stakingPoolConfig.stakeTokenDecimals
      );

      lastDigitDeltaStakeAmountWei = stakeLastDigitDeltaStakeAmountWei;
      lastDigitDeltaRewardAtMaturityWei =
        stakeLastDigitDeltaRewardAtMaturityWei;

      expectStakeTimestamp =
        startblockTimestamp + stakeConfig.stakeSecondsAfterStartblockTimestamp;

      additionalRewardToDistributeWei = computeTruncatedAmountWei(
        estimateRewardAtMaturityWei(
          stakeConfig.stakingPoolConfig.poolAprWei,
          stakeConfig.stakingPoolConfig.stakeDurationDays,
          expectStakeAmountWei
        ),
        stakeConfig.stakingPoolConfig.rewardTokenDecimals
      );
      expectRewardAtMaturityWei = additionalRewardToDistributeWei;

      estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
        stakeConfig.stakingPoolConfig.poolAprWei,
        stakeConfig.stakingPoolConfig.stakeDurationDays,
        actualStakeAmountWei
      );
    }

    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );

    verifyActualWithTruncatedValueWei(
      lastDigitDeltaRewardAtMaturityWei,
      Math.min(
        stakeConfig.stakingPoolConfig.stakeTokenDecimals,
        stakeConfig.stakingPoolConfig.rewardTokenDecimals
      ),
      expectRewardAtMaturityWei,
      estimatedRewardAtMaturityWei,
      actualRewardAtMaturityDeltaWei
    );

    return {
      expectStakeAmountWei,
      expectStakeTimestamp,
      expectStakeMaturityTimestamp,
      expectRewardAtMaturityWei,
      lastDigitDeltaStakeAmountWei,
      lastDigitDeltaRewardAtMaturityWei,
      additionalRewardToDistributeWei,
      actualStakeAmountWei,
    };
  }

  function verifyStakeMoreRewardAtMaturity(
    stakeMoreConfig,
    startblockTimestamp,
    actualRewardAtMaturityDeltaWei
  ) {
    const expectStakeTimestamp =
      startblockTimestamp +
      stakeMoreConfig.stakeSecondsAfterStartblockTimestamp;

    const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
      stakeMoreConfig.stakingPoolConfig.stakeDurationDays,
      expectStakeTimestamp
    );

    verifyActualWithTruncatedValueWei(
      stakeMoreConfig.lastDigitDeltaRewardAtMaturityWei,
      Math.min(
        stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
        stakeMoreConfig.stakingPoolConfig.rewardTokenDecimals
      ),
      stakeMoreConfig.expectRewardAtMaturityWei,
      stakeMoreConfig.estimatedRewardAtMaturityWei,
      actualRewardAtMaturityDeltaWei
    );

    return {
      expectStakeTimestamp,
      expectStakeMaturityTimestamp,
    };
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
        ? stakeConfig.shouldRevokeBeforeClaim ||
          stakeConfig.shouldRevokeAfterClaim
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
        `\n\nverifyStakeInfo (stakeExceedPoolReward or isRevoked): afterRevoke=${afterRevoke}, hasClaimed=${hasClaimed}, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, stakeExceedPoolReward=${stakeExceedPoolReward}, isRevoked=${isRevoked}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, stakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
      );
      */

      await expect(
        stakingServiceContractInstance.getStakeInfo(
          stakeConfig.stakingPoolConfig.poolId,
          signerAddress
        )
      ).to.be.revertedWith("SSvcs: uninitialized");
    } else {
      const {
        expectStakeAmountWei,
        expectStakeTimestamp,
        expectStakeMaturityTimestamp,
        expectRewardAtMaturityWei,
        lastDigitDeltaStakeAmountWei,
        actualStakeAmountWei,
      } = verifyRewardAtMaturity(
        stakeConfig,
        startblockTimestamp,
        10,
        30,
        20,
        70,
        hre.ethers.constants.One,
        isAddStake &&
          stakeConfig.addStakeAmountWei.gt(hre.ethers.constants.Zero) &&
          !addStakeExceedPoolReward,
        false
      );

      /*
      console.log(
        `\n\nverifyStakeInfo (before getStakeInfo): afterRevoke=${afterRevoke}, hasClaimed=${hasClaimed}, shouldRevokeAfterClaim=${stakeConfig.shouldRevokeAfterClaim}, shouldRevokeBeforeClaim=${stakeConfig.shouldRevokeBeforeClaim}, stakeExceedPoolReward=${stakeExceedPoolReward}, isRevoked=${isRevoked}, getStakeInfo(${stakeConfig.stakingPoolConfig.poolId}, ${signerAddress}), expectStakeAmountWei=${expectStakeAmountWei}, actualStakeAmountWei=${actualStakeAmountWei}, lastDigitDeltaStakeAmountWei=${lastDigitDeltaStakeAmountWei}, stakeTokenDecimals=${stakeConfig.stakingPoolConfig.stakeTokenDecimals}, stakeAmountWei=${stakeConfig.stakeAmountWei}, addStakeAmountWei=${stakeConfig.addStakeAmountWei}, expectRewardAtMaturityWei=${expectRewardAtMaturityWei}, rewardClaimedWei=${stakeConfig.rewardClaimedWei}`
      );
      */

      const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
        stakeConfig.stakingPoolConfig.poolId,
        signerAddress
      );

      /*
      console.log(
        `\n\nverifyStakeInfo: stakeInfo=${JSON.stringify(
          stakeInfo
        )}, poolUuid=${stakeConfig.stakingPoolConfig.poolUuid}, poolId=${
          stakeConfig.stakingPoolConfig.poolId
        }, configStakeAmountWei=${
          stakeConfig.stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfig.stakeSecondsAfterStartblockTimestamp
        }, configAddStakeAmountWei=${
          stakeConfig.addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfig.addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfig.signer.getAddress()}, configRewardClaimedWei=${
          stakeConfig.rewardClaimedWei
        }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
          stakeConfig.shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfig.shouldRevokeAfterClaim
        }, exceedPoolReward=${
          stakeConfig.exceedPoolReward
        }, infoStakeAmountWei=${stakeInfo.stakeAmountWei}, stakeTimestamp=${
          stakeInfo.stakeTimestamp
        }, stakeMaturityTimestamp=${
          stakeInfo.stakeMaturityTimestamp
        }, estimatedRewardAtMaturityWei=${
          stakeInfo.estimatedRewardAtMaturityWei
        }, infoRewardClaimedWei=${stakeInfo.rewardClaimedWei}, isActive=${
          stakeInfo.isActive
        }`
      );
      */

      verifyActualWithTruncatedValueWei(
        lastDigitDeltaStakeAmountWei,
        stakeConfig.stakingPoolConfig.stakeTokenDecimals,
        stakeInfo.stakeAmountWei,
        actualStakeAmountWei,
        hre.ethers.constants.Zero
      );

      expect(stakeInfo.stakeAmountWei).to.equal(expectStakeAmountWei);
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

    /*
    console.log(
      `\n\nverifyStakeInfo exit: poolId=${
        stakeConfig.stakingPoolConfig.poolId
      }, stakeAmountWei=${
        stakeConfig.stakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeConfig.stakeSecondsAfterStartblockTimestamp
      }, addStakeAmountWei=${
        stakeConfig.addStakeAmountWei
      }, addStakeSecondsAfterStartblockTimestamp=${
        stakeConfig.addStakeSecondsAfterStartblockTimestamp
      }, signer=${await stakeConfig.signer.getAddress()}, rewardClaimedWei=${
        stakeConfig.rewardClaimedWei
      }, shouldClaim=${stakeConfig.shouldClaim}, shouldRevokeBeforeClaim=${
        stakeConfig.shouldRevokeBeforeClaim
      }, shouldRevokeAfterClaim=${
        stakeConfig.shouldRevokeAfterClaim
      }, exceedPoolReward=${stakeConfig.exceedPoolReward}`
    );
    */
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
        `\nverifyStakesInfo ${i}: poolUuid=${
          stakeConfigs[i].stakingPoolConfig.poolUuid
        }, poolId=${stakeConfigs[i].stakingPoolConfig.poolId}, stakeAmountWei=${
          stakeConfigs[i].stakeAmountWei
        }, stakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].stakeSecondsAfterStartblockTimestamp
        }, addStakeAmountWei=${
          stakeConfigs[i].addStakeAmountWei
        }, addStakeSecondsAfterStartblockTimestamp=${
          stakeConfigs[i].addStakeSecondsAfterStartblockTimestamp
        }, signer=${await stakeConfigs[
          i
        ].signer.getAddress()}, rewardClaimedWei=${
          stakeConfigs[i].rewardClaimedWei
        }, shouldClaim=${
          stakeConfigs[i].shouldClaim
        }, shouldRevokeBeforeClaim=${
          stakeConfigs[i].shouldRevokeBeforeClaim
        }, shouldRevokeAfterClaim=${
          stakeConfigs[i].shouldRevokeAfterClaim
        }, exceedPoolReward=${stakeConfigs[i].exceedPoolReward}`
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

  async function verifyStakeMoreInfo(
    stakingServiceContractInstance,
    startblockTimestamp,
    stakeMoreConfig
  ) {
    const signerAddress = await stakeMoreConfig.signer.getAddress();
    const expectRewardClaimedWei = hre.ethers.constants.Zero;
    const expectIsActive = true;
    const { expectStakeTimestamp, expectStakeMaturityTimestamp } =
      verifyStakeMoreRewardAtMaturity(
        stakeMoreConfig,
        startblockTimestamp,
        hre.ethers.BigNumber.from(5)
      );

    /*
    console.log(
      `\nverifyStakeMoreInfo (before getStakeInfo): getStakeInfo(${stakeMoreConfig.stakingPoolConfig.poolId}, ${signerAddress}), expectStakeAmountWei=${stakeMoreConfig.expectStakeAmountWei}, actualStakeAmountWei=${stakeMoreConfig.actualStakeAmountWei}, lastDigitDeltaStakeAmountWei=${stakeMoreConfig.lastDigitDeltaStakeAmountWei}, stakeTokenDecimals=${stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals}, expectRewardAtMaturityWei=${stakeMoreConfig.expectRewardAtMaturityWei}, estimatedRewardAtMaturityWei=${stakeMoreConfig.estimatedRewardAtMaturityWei}`
    );
    */

    const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
      stakeMoreConfig.stakingPoolConfig.poolId,
      signerAddress
    );

    /*
    console.log(
      `\n\verifyStakeMoreInfo: stakeInfo=${JSON.stringify(
        stakeInfo
      )}, poolUuid=${stakeMoreConfig.stakingPoolConfig.poolUuid}, poolId=${
        stakeMoreConfig.stakingPoolConfig.poolId
      }, configActualStakeAmountWei=${
        stakeMoreConfig.actualStakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeMoreConfig.stakeSecondsAfterStartblockTimestamp
      }, configExpectStakeAmountWei=${
        stakeMoreConfig.expectStakeAmountWei
      }, signer=${await stakeMoreConfig.signer.getAddress()}, infoStakeAmountWei=${
        stakeInfo.stakeAmountWei
      }, stakeTimestamp=${stakeInfo.stakeTimestamp}, stakeMaturityTimestamp=${
        stakeInfo.stakeMaturityTimestamp
      }, estimatedRewardAtMaturityWei=${
        stakeInfo.estimatedRewardAtMaturityWei
      }, infoRewardClaimedWei=${stakeInfo.rewardClaimedWei}, isActive=${
        stakeInfo.isActive
      }`
    );
    */

    verifyActualWithTruncatedValueWei(
      stakeMoreConfig.lastDigitDeltaStakeAmountWei,
      stakeMoreConfig.stakingPoolConfig.stakeTokenDecimals,
      stakeInfo.stakeAmountWei,
      stakeMoreConfig.actualTotalStakeAmountsWei,
      hre.ethers.constants.Zero
    );

    expect(stakeInfo.stakeAmountWei).to.equal(
      stakeMoreConfig.truncatedTotalStakeAmountsWei
    );
    expect(stakeInfo.stakeTimestamp).to.equal(expectStakeTimestamp);
    expect(stakeInfo.stakeMaturityTimestamp).to.equal(
      expectStakeMaturityTimestamp
    );
    expect(stakeInfo.estimatedRewardAtMaturityWei).to.equal(
      stakeMoreConfig.expectRewardAtMaturityWei
    );
    expect(stakeInfo.rewardClaimedWei).to.equal(expectRewardClaimedWei);
    expect(stakeInfo.isActive).to.equal(expectIsActive);

    /*
    console.log(
      `\n\verifyStakeMoreInfo exit: poolId=${
        stakeMoreConfig.stakingPoolConfig.poolId
      }, actualStakeAmountWei=${
        stakeMoreConfig.actualStakeAmountWei
      }, stakeSecondsAfterStartblockTimestamp=${
        stakeMoreConfig.stakeSecondsAfterStartblockTimestamp
      }, expectStakeAmountWei=${
        stakeMoreConfig.expectStakeAmountWei
      }, signer=${await stakeMoreConfig.signer.getAddress()}`
    );
    */
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

  function computeCloseToDelta(lastDigitDelta, stakeTokenDecimals) {
    return hre.ethers.BigNumber.from("10")
      .pow(testHelpers.TOKEN_MAX_DECIMALS - stakeTokenDecimals - 1)
      .mul(hre.ethers.BigNumber.from(lastDigitDelta));
  }

  function computeTruncatedAmountWei(amountWei, tokenDecimals) {
    return tokenDecimals < testHelpers.TOKEN_MAX_DECIMALS
      ? testHelpers.scaleDecimalsToWei(
          testHelpers.scaleWeiToDecimals(amountWei, tokenDecimals),
          tokenDecimals
        )
      : amountWei;
  }

  function verifyActualWithTruncatedValueWei(
    lastDigitDecimalsDelta,
    stakeTokenDecimals,
    expectValueWei,
    actualValueWei,
    actualValueDeltaWei
  ) {
    if (stakeTokenDecimals < testHelpers.TOKEN_MAX_DECIMALS) {
      if (lastDigitDecimalsDelta === 0) {
        expect(expectValueWei).to.equal(actualValueWei);
      } else {
        const closeToDelta = computeCloseToDelta(
          lastDigitDecimalsDelta,
          stakeTokenDecimals
        );
        expect(expectValueWei).to.be.closeTo(actualValueWei, closeToDelta);
      }
    } else {
      if (actualValueDeltaWei.eq(hre.ethers.constants.Zero)) {
        expect(expectValueWei).to.equal(actualValueWei);
      } else {
        expect(expectValueWei).to.be.closeTo(
          actualValueWei,
          actualValueDeltaWei
        );
      }
    }
  }

  /*
  async function consoleLogExpectStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs,
    expectStakingPoolStats
  ) {
    console.log(
      `spid, poolUuid, stakeTokenDecimals, rewardTokenDecimals, totalRewardWei, expectTotalRewardWei, totalStakedWei, expectTotalStakedWei, rewardToBeDistributedWei, expectRewardToBeDistributedWei, totalRevokedStakeWei`
    );

    for (const spid in expectStakingPoolStats) {
      const stakingPoolConfig = stakingPoolConfigs.find(
        ({ poolId }) => poolId === spid
      );

      const stakingPoolStatsBeforeRemove =
        await stakingServiceContractInstance.getStakingPoolStats(spid);

      const stakeTokenDecimals =
        await stakingPoolConfig.stakeTokenInstance.decimals();

      const rewardTokenDecimals =
        await stakingPoolConfig.rewardTokenInstance.decimals();

      console.log(
        `${spid}, ${
          stakingPoolConfig.poolUuid
        }, ${stakeTokenDecimals}, ${rewardTokenDecimals}, ${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRewardWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakingPoolStats[spid].totalRewardWei
        )}, ${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalStakedWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakingPoolStats[spid].totalStakedWei
        )}, ${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.rewardToBeDistributedWei
        )}, ${hre.ethers.utils.formatEther(
          expectStakingPoolStats[spid].rewardToBeDistributedWei
        )}, ${hre.ethers.utils.formatEther(
          stakingPoolStatsBeforeRemove.totalRevokedStakeWei
        )}`
      );
    }
  }
  */
});
