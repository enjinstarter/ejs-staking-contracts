const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");
const stakePoolHelpers = require("./stake-pool-v2-helpers.js");
const stakeServiceHelpers = require("./stake-service-v2-helpers.js");

describe("StakingServiceV2", function () {
  const rewardTokenAdminMintWei = hre.ethers.utils.parseEther("10000000");
  const stakeRewardTokenAdminMintWei = rewardTokenAdminMintWei;
  const stakeTokenAdminMintWei = hre.ethers.utils.parseEther("1000000");
  const totalStakeRewardLessByWei = hre.ethers.utils.parseEther("1");

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
    stakeRewardToken: stakeRewardTokenAdminMintWei,
    stakeToken: stakeTokenAdminMintWei,
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

  before(async () => {
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

  beforeEach(async () => {
    [
      rewardToken18DecimalsInstances,
      stakeToken18DecimalsInstances,
      stakeRewardToken18DecimalsInstances,
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      stakingPoolsRewardBalanceOf,
    ] = await stakePoolHelpers.initializeStakingPoolTestData(
      rewardToken18DecimalsInfo,
      stakeToken18DecimalsInfo,
      stakeRewardToken18DecimalsInfo,
      governanceRoleAccounts,
      contractAdminRoleAccounts,
      contractAdminMintAmountsWei,
    );

    stakingServiceInstance = await stakeServiceHelpers.newStakingService(
      stakingPoolInstance.address,
    );

    await testHelpers.grantRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      governanceRoleAccounts.slice(1),
      governanceRoleAccounts[0],
      true,
    );

    await testHelpers.grantRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      contractAdminRoleAccounts,
      governanceRoleAccounts[0],
      true,
    );

    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
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
      true,
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      contractAdminRoleAccounts,
      false,
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      enduserAccounts,
      false,
    );

    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      contractAdminRoleAccounts,
      true,
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      governanceRoleAccounts.slice(0, 1),
      true,
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      governanceRoleAccounts.slice(1),
      false,
    );
    await testHelpers.verifyRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      enduserAccounts,
      false,
    );

    const poolId = hre.ethers.utils.id("da61b654-4973-4879-9166-723c0017dd6d");
    const enduserAccountAddress = await enduserAccounts[0].getAddress();
    const stakeId = hre.ethers.utils.id("bac9778d-5d13-4749-8823-52ef4feb4848");

    await expect(
      stakingServiceInstance.getClaimableRewardWei(
        poolId,
        enduserAccountAddress,
        stakeId,
      ),
    ).to.be.revertedWith("SPool2: uninitialized");

    await expect(
      stakingServiceInstance.getStakeInfo(
        poolId,
        enduserAccountAddress,
        stakeId,
      ),
    ).to.be.revertedWith("SSvcs2: uninitialized");

    await expect(
      stakingServiceInstance.getStakingPoolStats(poolId),
    ).to.be.revertedWith("SPool2: uninitialized");
  });

  it("Should not allow initialization of zero staking pool address", async () => {
    await expect(
      stakeServiceHelpers.newStakingService(hre.ethers.constants.AddressZero),
    ).to.be.revertedWith("SSvcs2: staking pool");
  });

  it("Should only allow default admin role to grant and revoke roles", async () => {
    await testHelpers.testGrantRevokeRoles(
      stakingServiceInstance,
      governanceRoleAccounts,
      contractAdminRoleAccounts,
      enduserAccounts,
      accounts,
    );
  });

  it("Should only allow governance role to pause and unpause contract", async () => {
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      governanceRoleAccounts,
      true,
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      false,
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      enduserAccounts,
      false,
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
      true,
    );
    await testHelpers.testSetAdminWallet(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      expectAdminWalletBeforeSet,
      expectAdminWalletAfterSet,
      false,
    );
    await testHelpers.testSetAdminWallet(
      stakingServiceInstance,
      enduserAccounts,
      expectAdminWalletBeforeSet,
      expectAdminWalletAfterSet,
      false,
    );
  });

  it("Should only allow governance role to set staking pool contract", async () => {
    const expectStakingPoolContractBeforeSet = stakingPoolInstance.address;
    const expectStakingPoolContractAfterSet =
      "0xabCDeF0123456789AbcdEf0123456789aBCDEF01";

    await stakeServiceHelpers.testSetStakingPoolContract(
      stakingServiceInstance,
      governanceRoleAccounts,
      expectStakingPoolContractBeforeSet,
      expectStakingPoolContractAfterSet,
      true,
    );
    await stakeServiceHelpers.testSetStakingPoolContract(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      expectStakingPoolContractBeforeSet,
      expectStakingPoolContractAfterSet,
      false,
    );
    await stakeServiceHelpers.testSetStakingPoolContract(
      stakingServiceInstance,
      enduserAccounts,
      expectStakingPoolContractBeforeSet,
      expectStakingPoolContractAfterSet,
      false,
    );
  });

  it("Should only allow contract admin role to add staking pool reward", async () => {
    const stakingPoolRewardConfigs = [
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[1].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[1].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[1].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[1].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[1].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[2].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[2].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[2].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[2].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[2].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[3].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[3].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[3].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[3].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[3].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[4].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[4].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[4].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[4].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[4].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[5].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[5].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[5].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[5].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[5].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[6].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[6].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[6].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[6].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[6].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[7].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[7].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[7].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[7].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[7].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[8].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[8].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[8].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[8].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[8].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[9].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[9].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[9].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[9].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[9].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[10].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[10].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[10].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[10].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[10].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[11].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[11].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[11].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[11].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[11].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[12].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[12].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[12].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[12].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[12].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[13].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[13].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[13].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[13].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[13].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[14].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[14].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[14].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[14].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[14].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[15].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[15].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[15].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[15].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[15].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("686512.13355000"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[16].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[16].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[16].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[16].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[16].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("290641.93140083"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[17].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[17].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[17].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[17].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[17].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("75546.05411320"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[18].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[18].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[18].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[18].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[18].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("547738.63499448"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[19].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[19].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[19].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[19].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[19].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("93436.56482742"),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[0].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[0].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[0].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[0].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther(
          "24909.569654259360719854",
        ),
      },
      {
        poolId: stakingPoolStakeRewardTokenSameConfigs[5].poolId,
        stakeTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[5].stakeTokenInstance,
        stakeDurationDays:
          stakingPoolStakeRewardTokenSameConfigs[5].stakeDurationDays,
        poolAprWei: stakingPoolStakeRewardTokenSameConfigs[5].poolAprWei,
        rewardTokenInstance:
          stakingPoolStakeRewardTokenSameConfigs[5].rewardTokenInstance,
        rewardAmountWei: hre.ethers.utils.parseEther("6955.183347317756524738"),
      },
    ];

    const stakingPoolRewardStats = {};

    await stakeServiceHelpers.testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      governanceRoleAccounts.slice(0, 1),
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      true,
    );

    await stakeServiceHelpers.testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      governanceRoleAccounts.slice(1),
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      false,
    );

    await stakeServiceHelpers.testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      contractAdminRoleAccounts,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      true,
    );

    await stakeServiceHelpers.testAddStakingPoolReward(
      stakingServiceInstance,
      stakingPoolRewardConfigs,
      enduserAccounts,
      stakingPoolsRewardBalanceOf,
      stakingPoolRewardStats,
      false,
    );
  });

  it.only("Should be able to stake, claim reward, revoke, unstake and withdraw", async () => {
    const stakeEvents = [
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(10),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("56289.771597347214289913"),
        stakeExceedPoolReward: false,
        stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
        stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(143),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("65543.437176927627080171"),
        stakeExceedPoolReward: false,
        stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
        stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(279),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("43414.852562734645967971"),
        stakeExceedPoolReward: false,
        stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
        stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(415),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("99607.043352635206319059"),
        stakeExceedPoolReward: false,
        stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
        stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(548),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("58894.582172763617423307"),
        stakeExceedPoolReward: false,
        stakeUuid: "f3159f39-bb26-47fc-8b0f-44d6959b20e1",
        stakeId: hre.ethers.utils.id("f3159f39-bb26-47fc-8b0f-44d6959b20e1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(679),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
        stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(810),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
        stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(946),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("93956.444016158729639480"),
        stakeExceedPoolReward: false,
        stakeUuid: "383009f7-ee4e-4576-8032-8b055bb41147",
        stakeId: hre.ethers.utils.id("383009f7-ee4e-4576-8032-8b055bb41147"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1077),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("28691.921604226736341486"),
        stakeExceedPoolReward: false,
        stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
        stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1189),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("38694.164531031409115445"),
        stakeExceedPoolReward: false,
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1348),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("63157.920515015815280309"),
        stakeExceedPoolReward: false,
        stakeUuid: "4defd107-efe9-414a-8354-0f37d113b24a",
        stakeId: hre.ethers.utils.id("4defd107-efe9-414a-8354-0f37d113b24a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1486),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
        stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1523),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("21261.660445841801241206"),
        stakeExceedPoolReward: false,
        stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
        stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1756),
        eventType: "Revoke",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "383009f7-ee4e-4576-8032-8b055bb41147",
        stakeId: hre.ethers.utils.id("383009f7-ee4e-4576-8032-8b055bb41147"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1833),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("53216.859980957368515064"),
        stakeExceedPoolReward: false,
        stakeUuid: "76643db8-1d4f-4983-bcd2-d262b24b0336",
        stakeId: hre.ethers.utils.id("76643db8-1d4f-4983-bcd2-d262b24b0336"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1969),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
        stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2107),
        eventType: "Revoke",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "f3159f39-bb26-47fc-8b0f-44d6959b20e1",
        stakeId: hre.ethers.utils.id("f3159f39-bb26-47fc-8b0f-44d6959b20e1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2242),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("31925.519305154605484789"),
        stakeExceedPoolReward: false,
        stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
        stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2433),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
        stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2667),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "76643db8-1d4f-4983-bcd2-d262b24b0336",
        stakeId: hre.ethers.utils.id("76643db8-1d4f-4983-bcd2-d262b24b0336"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2827),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "76643db8-1d4f-4983-bcd2-d262b24b0336",
        stakeId: hre.ethers.utils.id("76643db8-1d4f-4983-bcd2-d262b24b0336"),
      },
    ];

    const stakeInfos = [];

    const stakeInfos000 = new Map();
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`,
      {
        estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
        revokeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        rewardClaimedWei: hre.ethers.constants.Zero.toString(),
        stakeAmountWei: hre.ethers.constants.Zero.toString(),
        stakeMaturitySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        stakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakeAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeCooldownExpirySecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        unstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        unstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        withdrawUnstakeSecondsAfterStartblockTimestamp:
          hre.ethers.constants.Zero.toString(),
        isActive: false,
        isInitialized: false,
      },
    );
    stakeInfos.push(stakeInfos000);

    const stakeInfos001 = structuredClone(stakeInfos000);
    const stakeInfoAfterEvent000 = stakeInfos001.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent000 before: ${JSON.stringify(stakeInfoAfterEvent000)}`,
    );
    stakeInfoAfterEvent000.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
            .stakeDurationDays,
          stakeEvents[0].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent000.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[0].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent000.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
            .stakeDurationDays,
          stakeEvents[0].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent000.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[0].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent000.isActive = true;
    stakeInfoAfterEvent000.isInitialized = true;
    stakeInfos001.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
      stakeInfoAfterEvent000,
    );
    stakeInfos.push(stakeInfos001);
    console.log(
      `stakeInfoAfterEvent000 after: ${JSON.stringify(stakeInfos[1].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`))}`,
    );

    const stakeInfos002 = structuredClone(stakeInfos001);
    const stakeInfoAfterEvent001 = stakeInfos002.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent001 before: ${JSON.stringify(stakeInfoAfterEvent001)}`,
    );
    stakeInfoAfterEvent001.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
            .stakeDurationDays,
          stakeEvents[1].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent001.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[1].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent001.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
            .stakeDurationDays,
          stakeEvents[1].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent001.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[1].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent001.isActive = true;
    stakeInfoAfterEvent001.isInitialized = true;
    stakeInfos002.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      stakeInfoAfterEvent001,
    );
    stakeInfos.push(stakeInfos002);
    console.log(
      `stakeInfoAfterEvent001 after: ${JSON.stringify(stakeInfos[2].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );

    const stakeInfos003 = structuredClone(stakeInfos002);
    const stakeInfoAfterEvent002 = stakeInfos003.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent002 before: ${JSON.stringify(stakeInfoAfterEvent002)}`,
    );
    stakeInfoAfterEvent002.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
            .stakeDurationDays,
          stakeEvents[2].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent002.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[2].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent002.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
            .stakeDurationDays,
          stakeEvents[2].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent002.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[2].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent002.isActive = true;
    stakeInfoAfterEvent002.isInitialized = true;
    stakeInfos003.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      stakeInfoAfterEvent002,
    );
    stakeInfos.push(stakeInfos003);
    console.log(
      `stakeInfoAfterEvent002 after: ${JSON.stringify(stakeInfos[3].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
    );

    const stakeInfos004 = structuredClone(stakeInfos003);
    const stakeInfoAfterEvent003 = stakeInfos004.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent003 before: ${JSON.stringify(stakeInfoAfterEvent003)}`,
    );
    stakeInfoAfterEvent003.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
            .stakeDurationDays,
          stakeEvents[3].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent003.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[3].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent003.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
            .stakeDurationDays,
          stakeEvents[3].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent003.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[3].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent003.isActive = true;
    stakeInfoAfterEvent003.isInitialized = true;
    stakeInfos004.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
      stakeInfoAfterEvent003,
    );
    stakeInfos.push(stakeInfos004);
    console.log(
      `stakeInfoAfterEvent003 after: ${JSON.stringify(stakeInfos[4].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
    );

    const stakeInfos005 = structuredClone(stakeInfos004);
    const stakeInfoAfterEvent004 = stakeInfos005.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent004 before: ${JSON.stringify(stakeInfoAfterEvent004)}`,
    );
    stakeInfoAfterEvent004.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
            .stakeDurationDays,
          stakeEvents[4].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent004.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[4].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent004.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
            .stakeDurationDays,
          stakeEvents[4].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent004.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[4].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent004.isActive = true;
    stakeInfoAfterEvent004.isInitialized = true;
    stakeInfos005.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
      stakeInfoAfterEvent004,
    );
    stakeInfos.push(stakeInfos005);
    console.log(
      `stakeInfoAfterEvent004 after: ${JSON.stringify(stakeInfos[5].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
    );

    const stakeInfos006 = structuredClone(stakeInfos005);
    const stakeInfoAfterEvent005 = stakeInfos006.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent005 before: ${JSON.stringify(stakeInfoAfterEvent005)}`,
    );
    stakeInfoAfterEvent005.unstakeAmountWei = stakeServiceHelpers
      .calculateUnstakeAmountWei(
        stakeInfoAfterEvent005.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent005.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[5].eventSecondsAfterStartblockTimestamp,
        stakeEvents[5].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent005.unstakeCooldownExpirySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateCooldownExpiryTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          stakeEvents[5].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent005.unstakePenaltyAmountWei = stakeServiceHelpers
      .calculateUnstakePenaltyWei(
        stakeInfoAfterEvent005.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent005.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[5].eventSecondsAfterStartblockTimestamp,
        stakeEvents[5].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent005.unstakeSecondsAfterStartblockTimestamp =
      stakeEvents[5].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos006.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      stakeInfoAfterEvent005,
    );
    stakeInfos.push(stakeInfos006);
    console.log(
      `stakeInfoAfterEvent005 after: ${JSON.stringify(stakeInfos[6].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
    );

    const stakeInfos007 = structuredClone(stakeInfos006);
    const stakeInfoAfterEvent006 = stakeInfos007.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent006 before: ${JSON.stringify(stakeInfoAfterEvent006)}`,
    );
    stakeInfoAfterEvent006.withdrawUnstakeSecondsAfterStartblockTimestamp =
      stakeEvents[6].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos007.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      stakeInfoAfterEvent006,
    );
    stakeInfos.push(stakeInfos007);
    console.log(
      `stakeInfoAfterEvent006 after: ${JSON.stringify(stakeInfos[7].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
    );

    const stakeInfos008 = structuredClone(stakeInfos007);
    const stakeInfoAfterEvent007 = stakeInfos008.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent007 before: ${JSON.stringify(stakeInfoAfterEvent007)}`,
    );
    stakeInfoAfterEvent007.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
            .stakeDurationDays,
          stakeEvents[7].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent007.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[7].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent007.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
            .stakeDurationDays,
          stakeEvents[7].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent007.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[7].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent007.isActive = true;
    stakeInfoAfterEvent007.isInitialized = true;
    stakeInfos008.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
      stakeInfoAfterEvent007,
    );
    stakeInfos.push(stakeInfos008);
    console.log(
      `stakeInfoAfterEvent007 after: ${JSON.stringify(stakeInfos[8].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`))}`,
    );

    const stakeInfos009 = structuredClone(stakeInfos008);
    const stakeInfoAfterEvent008 = stakeInfos009.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent008 before: ${JSON.stringify(stakeInfoAfterEvent008)}`,
    );
    stakeInfoAfterEvent008.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
            .stakeDurationDays,
          stakeEvents[8].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent008.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[8].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent008.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
            .stakeDurationDays,
          stakeEvents[8].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent008.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[8].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent008.isActive = true;
    stakeInfoAfterEvent008.isInitialized = true;
    stakeInfos009.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`,
      stakeInfoAfterEvent008,
    );
    stakeInfos.push(stakeInfos009);
    console.log(
      `stakeInfoAfterEvent008 after: ${JSON.stringify(stakeInfos[9].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`))}`,
    );

    const stakeInfos010 = structuredClone(stakeInfos009);
    const stakeInfoAfterEvent009 = stakeInfos010.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent009 before: ${JSON.stringify(stakeInfoAfterEvent009)}`,
    );
    stakeInfoAfterEvent009.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
            .stakeDurationDays,
          stakeEvents[9].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent009.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[9].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent009.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
            .stakeDurationDays,
          stakeEvents[9].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent009.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[9].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent009.isActive = true;
    stakeInfoAfterEvent009.isInitialized = true;
    stakeInfos010.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
      stakeInfoAfterEvent009,
    );
    stakeInfos.push(stakeInfos010);
    console.log(
      `stakeInfoAfterEvent009 after: ${JSON.stringify(stakeInfos[10].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
    );

    const stakeInfos011 = structuredClone(stakeInfos010);
    const stakeInfoAfterEvent010 = stakeInfos011.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent010 before: ${JSON.stringify(stakeInfoAfterEvent010)}`,
    );
    stakeInfoAfterEvent010.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
            .stakeDurationDays,
          stakeEvents[10].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent010.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[10].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent010.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
            .stakeDurationDays,
          stakeEvents[10].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent010.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[10].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent010.isActive = true;
    stakeInfoAfterEvent010.isInitialized = true;
    stakeInfos011.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
      stakeInfoAfterEvent010,
    );
    stakeInfos.push(stakeInfos011);
    console.log(
      `stakeInfoAfterEvent010 after: ${JSON.stringify(stakeInfos[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
    );

    const stakeInfos012 = structuredClone(stakeInfos011);
    const stakeInfoAfterEvent011 = stakeInfos012.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent011 before: ${JSON.stringify(stakeInfoAfterEvent011)}`,
    );
    stakeInfoAfterEvent011.unstakeAmountWei = stakeServiceHelpers
      .calculateUnstakeAmountWei(
        stakeInfoAfterEvent011.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent011.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[11].eventSecondsAfterStartblockTimestamp,
        stakeEvents[11].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent011.unstakeCooldownExpirySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateCooldownExpiryTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          stakeEvents[11].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent011.unstakePenaltyAmountWei = stakeServiceHelpers
      .calculateUnstakePenaltyWei(
        stakeInfoAfterEvent011.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent011.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[11].eventSecondsAfterStartblockTimestamp,
        stakeEvents[11].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent011.unstakeSecondsAfterStartblockTimestamp =
      stakeEvents[11].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos012.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      stakeInfoAfterEvent011,
    );
    stakeInfos.push(stakeInfos012);
    console.log(
      `stakeInfoAfterEvent011 after: ${JSON.stringify(stakeInfos[12].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );

    const stakeInfos013 = structuredClone(stakeInfos012);
    const stakeInfoAfterEvent012 = stakeInfos013.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent012 before: ${JSON.stringify(stakeInfoAfterEvent012)}`,
    );
    stakeInfoAfterEvent012.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
            .stakeDurationDays,
          stakeEvents[12].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent012.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[12].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent012.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
            .stakeDurationDays,
          stakeEvents[12].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent012.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[12].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent012.isActive = true;
    stakeInfoAfterEvent012.isInitialized = true;
    stakeInfos013.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      stakeInfoAfterEvent010,
    );
    stakeInfos.push(stakeInfos013);
    console.log(
      `stakeInfoAfterEvent012 after: ${JSON.stringify(stakeInfos[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );

    const stakeInfos014 = structuredClone(stakeInfos013);
    const stakeInfoAfterEvent013 = stakeInfos014.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent013 before: ${JSON.stringify(stakeInfoAfterEvent013)}`,
    );
    stakeInfoAfterEvent013.revokeSecondsAfterStartblockTimestamp =
      stakeEvents[13].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos014.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
      stakeInfoAfterEvent013,
    );
    stakeInfos.push(stakeInfos014);
    console.log(
      `stakeInfoAfterEvent013 after: ${JSON.stringify(stakeInfos[14].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`))}`,
    );

    const stakeInfos015 = structuredClone(stakeInfos014);
    const stakeInfoAfterEvent014 = stakeInfos015.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent014 before: ${JSON.stringify(stakeInfoAfterEvent014)}`,
    );
    stakeInfoAfterEvent014.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
            .stakeDurationDays,
          stakeEvents[14].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent014.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[14].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent014.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
            .stakeDurationDays,
          stakeEvents[14].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent014.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[14].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent014.isActive = true;
    stakeInfoAfterEvent014.isInitialized = true;
    stakeInfos015.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      stakeInfoAfterEvent014,
    );
    stakeInfos.push(stakeInfos015);
    console.log(
      `stakeInfoAfterEvent014 after: ${JSON.stringify(stakeInfos[15].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );

    const stakeInfos016 = structuredClone(stakeInfos015);
    const stakeInfoAfterEvent015 = stakeInfos016.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent015 before: ${JSON.stringify(stakeInfoAfterEvent015)}`,
    );
    stakeInfoAfterEvent015.withdrawUnstakeSecondsAfterStartblockTimestamp =
      stakeEvents[15].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos016.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      stakeInfoAfterEvent006,
    );
    stakeInfos.push(stakeInfos016);
    console.log(
      `stakeInfoAfterEvent015 after: ${JSON.stringify(stakeInfos[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );

    const stakeInfos017 = structuredClone(stakeInfos016);
    const stakeInfoAfterEvent016 = stakeInfos017.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent016 before: ${JSON.stringify(stakeInfoAfterEvent016)}`,
    );
    stakeInfoAfterEvent016.revokeSecondsAfterStartblockTimestamp =
      stakeEvents[16].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos017.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
      stakeInfoAfterEvent016,
    );
    stakeInfos.push(stakeInfos017);
    console.log(
      `stakeInfoAfterEvent016 after: ${JSON.stringify(stakeInfos[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
    );

    const stakeInfos018 = structuredClone(stakeInfos017);
    const stakeInfoAfterEvent017 = stakeInfos018.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent017 before: ${JSON.stringify(stakeInfoAfterEvent017)}`,
    );
    stakeInfoAfterEvent017.estimatedRewardAtMaturityWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeServiceHelpers.estimateRewardAtMaturityWei(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
            .poolAprWei,
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
            .stakeDurationDays,
          stakeEvents[17].stakeAmountWei,
        ),
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
          .rewardTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent017.stakeAmountWei = stakeServiceHelpers
      .computeTruncatedAmountWei(
        stakeEvents[17].stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
          .stakeTokenDecimals,
      )
      .toString();
    stakeInfoAfterEvent017.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateStateMaturityTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
            .stakeDurationDays,
          stakeEvents[17].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent017.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[17].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent017.isActive = true;
    stakeInfoAfterEvent017.isInitialized = true;
    stakeInfos018.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`,
      stakeInfoAfterEvent017,
    );
    stakeInfos.push(stakeInfos018);
    console.log(
      `stakeInfoAfterEvent017 after: ${JSON.stringify(stakeInfos[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`))}`,
    );

    const stakeInfos019 = structuredClone(stakeInfos018);
    const stakeInfoAfterEvent018 = stakeInfos019.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent018 before: ${JSON.stringify(stakeInfoAfterEvent018)}`,
    );
    stakeInfoAfterEvent018.unstakeAmountWei = stakeServiceHelpers
      .calculateUnstakeAmountWei(
        stakeInfoAfterEvent018.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent018.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[18].eventSecondsAfterStartblockTimestamp,
        stakeEvents[18].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent018.unstakeCooldownExpirySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateCooldownExpiryTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          stakeEvents[18].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent018.unstakePenaltyAmountWei = stakeServiceHelpers
      .calculateUnstakePenaltyWei(
        stakeInfoAfterEvent018.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent018.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[18].eventSecondsAfterStartblockTimestamp,
        stakeEvents[18].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent018.unstakeSecondsAfterStartblockTimestamp =
      stakeEvents[18].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos019.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      stakeInfoAfterEvent018,
    );
    stakeInfos.push(stakeInfos019);
    console.log(
      `stakeInfoAfterEvent018 after: ${JSON.stringify(stakeInfos[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );

    const stakeInfos020 = structuredClone(stakeInfos019);
    const stakeInfoAfterEvent019 = stakeInfos020.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent019 before: ${JSON.stringify(stakeInfoAfterEvent019)}`,
    );
    stakeInfoAfterEvent019.unstakeAmountWei = stakeServiceHelpers
      .calculateUnstakeAmountWei(
        stakeInfoAfterEvent019.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent019.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[19].eventSecondsAfterStartblockTimestamp,
        stakeEvents[19].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent019.unstakeCooldownExpirySecondsAfterStartblockTimestamp =
      stakeServiceHelpers
        .calculateCooldownExpiryTimestamp(
          stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          stakeEvents[19].eventSecondsAfterStartblockTimestamp,
        )
        .toString();
    stakeInfoAfterEvent019.unstakePenaltyAmountWei = stakeServiceHelpers
      .calculateUnstakePenaltyWei(
        stakeInfoAfterEvent019.stakeAmountWei,
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
          .earlyUnstakePenaltyPercentWei,
        stakeInfoAfterEvent019.stakeMaturitySecondsAfterStartblockTimestamp,
        stakeEvents[19].eventSecondsAfterStartblockTimestamp,
        stakeEvents[19].eventSecondsAfterStartblockTimestamp,
      )
      .toString();
    stakeInfoAfterEvent019.unstakeSecondsAfterStartblockTimestamp =
      stakeEvents[19].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos020.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      stakeInfoAfterEvent019,
    );
    stakeInfos.push(stakeInfos020);
    console.log(
      `stakeInfoAfterEvent019 after: ${JSON.stringify(stakeInfos[20].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );

    const stakeInfos021 = structuredClone(stakeInfos020);
    const stakeInfoAfterEvent020 = stakeInfos021.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
    );
    console.log(
      `stakeInfoAfterEvent020 before: ${JSON.stringify(stakeInfoAfterEvent020)}`,
    );
    stakeInfoAfterEvent020.revokeSecondsAfterStartblockTimestamp =
      stakeEvents[20].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos021.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      stakeInfoAfterEvent020,
    );
    stakeInfos.push(stakeInfos021);
    console.log(
      `stakeInfoAfterEvent020 after: ${JSON.stringify(stakeInfos[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );

    await stakeServiceHelpers.testStakeClaimRevokeUnstakeWithdraw(
      stakingServiceInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts[0],
      stakeEvents,
      stakeInfos,
      stakingPoolStats,
    );
  });
});
