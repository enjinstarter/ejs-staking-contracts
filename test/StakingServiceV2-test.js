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
    ).to.be.revertedWith("SSvcs2: uninitialized");

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

  it("Should only allow contract admin role to pause and unpause contract", async () => {
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      governanceRoleAccounts.slice(0, 1),
      testHelpers.CONTRACT_ADMIN_ROLE,
      true,
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      governanceRoleAccounts.slice(1),
      testHelpers.CONTRACT_ADMIN_ROLE,
      false,
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      contractAdminRoleAccounts,
      testHelpers.CONTRACT_ADMIN_ROLE,
      true,
    );
    await testHelpers.testPauseUnpauseContract(
      stakingServiceInstance,
      enduserAccounts,
      testHelpers.CONTRACT_ADMIN_ROLE,
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
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1553),
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
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
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
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2843),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("1389.203351175896125017"),
        stakeExceedPoolReward: false,
        stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
        stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2966),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
        stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3126),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
        stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3500),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("225.2785556503"),
        stakeExceedPoolReward: false,
        stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
        stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3678),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("2675.72918873882"),
        stakeExceedPoolReward: false,
        stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
        stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3755),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
        stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(88833),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
        stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(89154),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(89340),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
        stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(90290),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
        stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(90404),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("7115.7665900114"),
        stakeExceedPoolReward: false,
        stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
        stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(90590),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
        stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(90695),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("1811.9845913533"),
        stakeExceedPoolReward: false,
        stakeUuid: "91e47baa-30f2-4aa1-8687-b726166a78ca",
        stakeId: hre.ethers.utils.id("91e47baa-30f2-4aa1-8687-b726166a78ca"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(90845),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
        stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(175554),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(184010),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("539.38315573149"),
        stakeExceedPoolReward: false,
        stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
        stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(225165),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
        stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(243927),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("866.3800184366"),
        stakeExceedPoolReward: false,
        stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
        stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(308146),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
        stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(322173),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
        stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(331202),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(362937),
        eventType: "Revoke",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
        stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(366322),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("5110.51272510989"),
        stakeExceedPoolReward: false,
        stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
        stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(376213),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("3789.41891704938"),
        stakeExceedPoolReward: false,
        stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
        stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(383262),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
        stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(392179),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "91e47baa-30f2-4aa1-8687-b726166a78ca",
        stakeId: hre.ethers.utils.id("91e47baa-30f2-4aa1-8687-b726166a78ca"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(401597),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
        stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
      },
    ];

    const initialStakeInfo = {
      estimatedRewardAtMaturityWei: hre.ethers.constants.Zero.toString(),
      revokedRewardAmountWei: hre.ethers.constants.Zero.toString(),
      revokedStakeAmountWei: hre.ethers.constants.Zero.toString(),
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
    };

    const stakeInfos = [];

    const stakeInfos000 = new Map();
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId},${stakeEvents[24].signerAddress},${stakeEvents[24].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId},${stakeEvents[31].signerAddress},${stakeEvents[31].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId},${stakeEvents[36].signerAddress},${stakeEvents[36].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`,
      structuredClone(initialStakeInfo),
    );
    stakeInfos.push(stakeInfos000);

    const initialStakingPoolStat = {
      isOpen: true,
      isActive: true,
      poolRemainingRewardWei: hre.ethers.constants.Zero.toString(),
      poolRewardAmountWei: hre.ethers.constants.Zero.toString(),
      poolSizeWei: hre.ethers.constants.Zero.toString(),
      rewardToBeDistributedWei: hre.ethers.constants.Zero.toString(),
      totalRevokedRewardWei: hre.ethers.constants.Zero.toString(),
      totalRevokedStakeWei: hre.ethers.constants.Zero.toString(),
      totalRevokedStakeRemovedWei: hre.ethers.constants.Zero.toString(),
      totalRewardAddedWei: hre.ethers.constants.Zero.toString(),
      totalRewardClaimedWei: hre.ethers.constants.Zero.toString(),
      totalRewardRemovedWei: hre.ethers.constants.Zero.toString(),
      totalStakedWei: hre.ethers.constants.Zero.toString(),
      totalUnstakedAfterMatureWei: hre.ethers.constants.Zero.toString(),
      totalUnstakedBeforeMatureWei: hre.ethers.constants.Zero.toString(),
      totalUnstakedRewardBeforeMatureWei: hre.ethers.constants.Zero.toString(),
      totalUnstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
      totalUnstakePenaltyRemovedWei: hre.ethers.constants.Zero.toString(),
      totalWithdrawnUnstakeWei: hre.ethers.constants.Zero.toString(),
    };

    const stakingPoolStats = [];

    const stakingPoolStats000 = new Map();
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`,
      structuredClone(initialStakingPoolStat),
    );
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`,
      structuredClone(initialStakingPoolStat),
    );
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`,
      structuredClone(initialStakingPoolStat),
    );
    stakingPoolStats.push(stakingPoolStats000);

    const {
      nextExpectStakeInfos: stakeInfos001,
      nextExpectStakingPoolStats: stakingPoolStats001,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[0],
      stakeEvents[0],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos000,
      stakingPoolStats000,
    );
    stakeInfos.push(stakeInfos001);
    console.log(
      `\nstakeInfoAfterEvent000 after: ${JSON.stringify(stakeInfos[1].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats001);
    console.log(
      `stakingPoolStatsAfterEvent000 after: ${JSON.stringify(stakingPoolStats[1].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos002,
      nextExpectStakingPoolStats: stakingPoolStats002,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[1],
      stakeEvents[1],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos001,
      stakingPoolStats001,
    );
    stakeInfos.push(stakeInfos002);
    console.log(
      `\nstakeInfoAfterEvent001 after: ${JSON.stringify(stakeInfos[2].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats002);
    console.log(
      `stakingPoolStatsAfterEvent001 after: ${JSON.stringify(stakingPoolStats[2].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos003,
      nextExpectStakingPoolStats: stakingPoolStats003,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[2],
      stakeEvents[2],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos002,
      stakingPoolStats002,
    );
    stakeInfos.push(stakeInfos003);
    console.log(
      `\nstakeInfoAfterEvent002 after: ${JSON.stringify(stakeInfos[3].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats003);
    console.log(
      `stakingPoolStatsAfterEvent002 after: ${JSON.stringify(stakingPoolStats[3].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos004,
      nextExpectStakingPoolStats: stakingPoolStats004,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[3],
      stakeEvents[3],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos003,
      stakingPoolStats003,
    );
    stakeInfos.push(stakeInfos004);
    console.log(
      `\nstakeInfoAfterEvent003 after: ${JSON.stringify(stakeInfos[4].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats004);
    console.log(
      `stakingPoolStatsAfterEvent003 after: ${JSON.stringify(stakingPoolStats[4].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos005,
      nextExpectStakingPoolStats: stakingPoolStats005,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[4],
      stakeEvents[4],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos004,
      stakingPoolStats004,
    );
    stakeInfos.push(stakeInfos005);
    console.log(
      `\nstakeInfoAfterEvent004 after: ${JSON.stringify(stakeInfos[5].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats005);
    console.log(
      `stakingPoolStatsAfterEvent004 after: ${JSON.stringify(stakingPoolStats[5].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos006,
      nextExpectStakingPoolStats: stakingPoolStats006,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[5],
      stakeEvents[2],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos005,
      stakingPoolStats005,
    );
    stakeInfos.push(stakeInfos006);
    console.log(
      `\nstakeInfoAfterEvent005 after: ${JSON.stringify(stakeInfos[6].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats006);
    console.log(
      `stakingPoolStatsAfterEvent005 after: ${JSON.stringify(stakingPoolStats[6].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos007,
      nextExpectStakingPoolStats: stakingPoolStats007,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[6],
      stakeEvents[2],
      stakeEvents[5],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos006,
      stakingPoolStats006,
    );
    stakeInfos.push(stakeInfos007);
    console.log(
      `\nstakeInfoAfterEvent006 after: ${JSON.stringify(stakeInfos[7].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats007);
    console.log(
      `stakingPoolStatsAfterEvent006 after: ${JSON.stringify(stakingPoolStats[7].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos008,
      nextExpectStakingPoolStats: stakingPoolStats008,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[7],
      stakeEvents[7],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos007,
      stakingPoolStats007,
    );
    stakeInfos.push(stakeInfos008);
    console.log(
      `\nstakeInfoAfterEvent007 after: ${JSON.stringify(stakeInfos[8].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats008);
    console.log(
      `stakingPoolStatsAfterEvent007 after: ${JSON.stringify(stakingPoolStats[8].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos009,
      nextExpectStakingPoolStats: stakingPoolStats009,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[8],
      stakeEvents[8],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos008,
      stakingPoolStats008,
    );
    stakeInfos.push(stakeInfos009);
    console.log(
      `\nstakeInfoAfterEvent008 after: ${JSON.stringify(stakeInfos[9].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats009);
    console.log(
      `stakingPoolStatsAfterEvent008 after: ${JSON.stringify(stakingPoolStats[9].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos010,
      nextExpectStakingPoolStats: stakingPoolStats010,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[9],
      stakeEvents[9],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos009,
      stakingPoolStats009,
    );
    stakeInfos.push(stakeInfos010);
    console.log(
      `\nstakeInfoAfterEvent009 after: ${JSON.stringify(stakeInfos[10].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats010);
    console.log(
      `stakingPoolStatsAfterEvent009 after: ${JSON.stringify(stakingPoolStats[10].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos011,
      nextExpectStakingPoolStats: stakingPoolStats011,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[10],
      stakeEvents[10],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos010,
      stakingPoolStats010,
    );
    stakeInfos.push(stakeInfos011);
    console.log(
      `\nstakeInfoAfterEvent010 after: ${JSON.stringify(stakeInfos[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats011);
    console.log(
      `stakingPoolStatsAfterEvent010 after: ${JSON.stringify(stakingPoolStats[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos012,
      nextExpectStakingPoolStats: stakingPoolStats012,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[11],
      stakeEvents[1],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos011,
      stakingPoolStats011,
    );
    stakeInfos.push(stakeInfos012);
    console.log(
      `\nstakeInfoAfterEvent011 after: ${JSON.stringify(stakeInfos[12].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats012);
    console.log(
      `stakingPoolStatsAfterEvent011 after: ${JSON.stringify(stakingPoolStats[12].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos013,
      nextExpectStakingPoolStats: stakingPoolStats013,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[12],
      stakeEvents[12],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos012,
      stakingPoolStats012,
    );
    stakeInfos.push(stakeInfos013);
    console.log(
      `\nstakeInfoAfterEvent012 after: ${JSON.stringify(stakeInfos[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats013);
    console.log(
      `stakingPoolStatsAfterEvent012 after: ${JSON.stringify(stakingPoolStats[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos014,
      nextExpectStakingPoolStats: stakingPoolStats014,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[13],
      stakeEvents[7],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos013,
      stakingPoolStats013,
    );
    stakeInfos.push(stakeInfos014);
    console.log(
      `\nstakeInfoAfterEvent013 after: ${JSON.stringify(stakeInfos[14].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats014);
    console.log(
      `stakingPoolStatsAfterEvent013 after: ${JSON.stringify(stakingPoolStats[14].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos015,
      nextExpectStakingPoolStats: stakingPoolStats015,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[14],
      stakeEvents[14],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos014,
      stakingPoolStats014,
    );
    stakeInfos.push(stakeInfos015);
    console.log(
      `\nstakeInfoAfterEvent014 after: ${JSON.stringify(stakeInfos[15].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats015);
    console.log(
      `stakingPoolStatsAfterEvent014 after: ${JSON.stringify(stakingPoolStats[15].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos016,
      nextExpectStakingPoolStats: stakingPoolStats016,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[15],
      stakeEvents[1],
      stakeEvents[11],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos015,
      stakingPoolStats015,
    );
    stakeInfos.push(stakeInfos016);
    console.log(
      `\nstakeInfoAfterEvent015 after: ${JSON.stringify(stakeInfos[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats016);
    console.log(
      `stakingPoolStatsAfterEvent015 after: ${JSON.stringify(stakingPoolStats[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos017,
      nextExpectStakingPoolStats: stakingPoolStats017,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[16],
      stakeEvents[4],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos016,
      stakingPoolStats016,
    );
    stakeInfos.push(stakeInfos017);
    console.log(
      `\nstakeInfoAfterEvent016 after: ${JSON.stringify(stakeInfos[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats017);
    console.log(
      `stakingPoolStatsAfterEvent016 after: ${JSON.stringify(stakingPoolStats[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos018,
      nextExpectStakingPoolStats: stakingPoolStats018,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[17],
      stakeEvents[17],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos017,
      stakingPoolStats017,
    );
    stakeInfos.push(stakeInfos018);
    console.log(
      `\nstakeInfoAfterEvent017 after: ${JSON.stringify(stakeInfos[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats018);
    console.log(
      `stakingPoolStatsAfterEvent017 after: ${JSON.stringify(stakingPoolStats[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos019,
      nextExpectStakingPoolStats: stakingPoolStats019,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[18],
      stakeEvents[12],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos018,
      stakingPoolStats018,
    );
    stakeInfos.push(stakeInfos019);
    console.log(
      `\nstakeInfoAfterEvent018 after: ${JSON.stringify(stakeInfos[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats019);
    console.log(
      `stakingPoolStatsAfterEvent018 after: ${JSON.stringify(stakingPoolStats[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos020,
      nextExpectStakingPoolStats: stakingPoolStats020,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[19],
      stakeEvents[14],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos019,
      stakingPoolStats019,
    );
    stakeInfos.push(stakeInfos020);
    console.log(
      `\nstakeInfoAfterEvent019 after: ${JSON.stringify(stakeInfos[20].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats020);
    console.log(
      `stakingPoolStatsAfterEvent019 after: ${JSON.stringify(stakingPoolStats[20].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos021,
      nextExpectStakingPoolStats: stakingPoolStats021,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[20],
      stakeEvents[14],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos020,
      stakingPoolStats020,
    );
    stakeInfos.push(stakeInfos021);
    console.log(
      `\nstakeInfoAfterEvent020 after: ${JSON.stringify(stakeInfos[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats021);
    console.log(
      `stakingPoolStatsAfterEvent020 after: ${JSON.stringify(stakingPoolStats[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos022,
      nextExpectStakingPoolStats: stakingPoolStats022,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[21],
      stakeEvents[21],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos021,
      stakingPoolStats021,
    );
    stakeInfos.push(stakeInfos022);
    console.log(
      `\nstakeInfoAfterEvent021 after: ${JSON.stringify(stakeInfos[22].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats022);
    console.log(
      `stakingPoolStatsAfterEvent021 after: ${JSON.stringify(stakingPoolStats[22].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos023,
      nextExpectStakingPoolStats: stakingPoolStats023,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[22],
      stakeEvents[3],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos022,
      stakingPoolStats022,
    );
    stakeInfos.push(stakeInfos023);
    console.log(
      `\nstakeInfoAfterEvent022 after: ${JSON.stringify(stakeInfos[23].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats023);
    console.log(
      `stakingPoolStatsAfterEvent022 after: ${JSON.stringify(stakingPoolStats[23].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos024,
      nextExpectStakingPoolStats: stakingPoolStats024,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[23],
      stakeEvents[21],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos023,
      stakingPoolStats023,
    );
    stakeInfos.push(stakeInfos024);
    console.log(
      `\nstakeInfoAfterEvent023 after: ${JSON.stringify(stakeInfos[24].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats024);
    console.log(
      `stakingPoolStatsAfterEvent023 after: ${JSON.stringify(stakingPoolStats[24].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos025,
      nextExpectStakingPoolStats: stakingPoolStats025,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[24],
      stakeEvents[24],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos024,
      stakingPoolStats024,
    );
    stakeInfos.push(stakeInfos025);
    console.log(
      `\nstakeInfoAfterEvent024 after: ${JSON.stringify(stakeInfos[25].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId},${stakeEvents[24].signerAddress},${stakeEvents[24].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats025);
    console.log(
      `stakingPoolStatsAfterEvent024 after: ${JSON.stringify(stakingPoolStats[25].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos026,
      nextExpectStakingPoolStats: stakingPoolStats026,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[25],
      stakeEvents[25],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos025,
      stakingPoolStats025,
    );
    stakeInfos.push(stakeInfos026);
    console.log(
      `\nstakeInfoAfterEvent025 after: ${JSON.stringify(stakeInfos[26].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats026);
    console.log(
      `stakingPoolStatsAfterEvent025 after: ${JSON.stringify(stakingPoolStats[26].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos027,
      nextExpectStakingPoolStats: stakingPoolStats027,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[26],
      stakeEvents[0],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos026,
      stakingPoolStats026,
    );
    stakeInfos.push(stakeInfos027);
    console.log(
      `\nstakeInfoAfterEvent026 after: ${JSON.stringify(stakeInfos[27].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats027);
    console.log(
      `stakingPoolStatsAfterEvent026 after: ${JSON.stringify(stakingPoolStats[27].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos028,
      nextExpectStakingPoolStats: stakingPoolStats028,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[27],
      stakeEvents[12],
      stakeEvents[18],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos027,
      stakingPoolStats027,
    );
    stakeInfos.push(stakeInfos028);
    console.log(
      `\nstakeInfoAfterEvent027 after: ${JSON.stringify(stakeInfos[28].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats028);
    console.log(
      `stakingPoolStatsAfterEvent027 after: ${JSON.stringify(stakingPoolStats[28].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos029,
      nextExpectStakingPoolStats: stakingPoolStats029,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[28],
      stakeEvents[9],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos028,
      stakingPoolStats028,
    );
    stakeInfos.push(stakeInfos029);
    console.log(
      `\nstakeInfoAfterEvent028 after: ${JSON.stringify(stakeInfos[29].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats029);
    console.log(
      `stakingPoolStatsAfterEvent028 after: ${JSON.stringify(stakingPoolStats[29].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos030,
      nextExpectStakingPoolStats: stakingPoolStats030,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[29],
      stakeEvents[21],
      stakeEvents[23],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos029,
      stakingPoolStats029,
    );
    stakeInfos.push(stakeInfos030);
    console.log(
      `\nstakeInfoAfterEvent029 after: ${JSON.stringify(stakeInfos[30].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats030);
    console.log(
      `stakingPoolStatsAfterEvent029 after: ${JSON.stringify(stakingPoolStats[30].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos031,
      nextExpectStakingPoolStats: stakingPoolStats031,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[30],
      stakeEvents[12],
      stakeEvents[18],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos030,
      stakingPoolStats030,
    );
    stakeInfos.push(stakeInfos031);
    console.log(
      `\nstakeInfoAfterEvent030 after: ${JSON.stringify(stakeInfos[31].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats031);
    console.log(
      `stakingPoolStatsAfterEvent030 after: ${JSON.stringify(stakingPoolStats[31].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos032,
      nextExpectStakingPoolStats: stakingPoolStats032,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[31],
      stakeEvents[31],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos031,
      stakingPoolStats031,
    );
    stakeInfos.push(stakeInfos032);
    console.log(
      `\nstakeInfoAfterEvent031 after: ${JSON.stringify(stakeInfos[32].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId},${stakeEvents[31].signerAddress},${stakeEvents[31].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats032);
    console.log(
      `stakingPoolStatsAfterEvent031 after: ${JSON.stringify(stakingPoolStats[32].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos033,
      nextExpectStakingPoolStats: stakingPoolStats033,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[32],
      stakeEvents[24],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos032,
      stakingPoolStats032,
    );
    stakeInfos.push(stakeInfos033);
    console.log(
      `\nstakeInfoAfterEvent032 after: ${JSON.stringify(stakeInfos[33].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId},${stakeEvents[24].signerAddress},${stakeEvents[24].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats033);
    console.log(
      `stakingPoolStatsAfterEvent032 after: ${JSON.stringify(stakingPoolStats[33].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos034,
      nextExpectStakingPoolStats: stakingPoolStats034,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[33],
      stakeEvents[33],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos033,
      stakingPoolStats033,
    );
    stakeInfos.push(stakeInfos034);
    console.log(
      `\nstakeInfoAfterEvent033 after: ${JSON.stringify(stakeInfos[34].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats034);
    console.log(
      `stakingPoolStatsAfterEvent033 after: ${JSON.stringify(stakingPoolStats[34].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos035,
      nextExpectStakingPoolStats: stakingPoolStats035,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[34],
      stakeEvents[31],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos034,
      stakingPoolStats034,
    );
    stakeInfos.push(stakeInfos035);
    console.log(
      `\nstakeInfoAfterEvent034 after: ${JSON.stringify(stakeInfos[35].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId},${stakeEvents[31].signerAddress},${stakeEvents[31].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats035);
    console.log(
      `stakingPoolStatsAfterEvent034 after: ${JSON.stringify(stakingPoolStats[35].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos036,
      nextExpectStakingPoolStats: stakingPoolStats036,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[35],
      stakeEvents[9],
      stakeEvents[28],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos035,
      stakingPoolStats035,
    );
    stakeInfos.push(stakeInfos036);
    console.log(
      `\nstakeInfoAfterEvent035 after: ${JSON.stringify(stakeInfos[36].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats036);
    console.log(
      `stakingPoolStatsAfterEvent035 after: ${JSON.stringify(stakingPoolStats[36].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos037,
      nextExpectStakingPoolStats: stakingPoolStats037,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[36],
      stakeEvents[36],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos036,
      stakingPoolStats036,
    );
    stakeInfos.push(stakeInfos037);
    console.log(
      `\nstakeInfoAfterEvent036 after: ${JSON.stringify(stakeInfos[37].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId},${stakeEvents[36].signerAddress},${stakeEvents[36].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats037);
    console.log(
      `stakingPoolStatsAfterEvent036 after: ${JSON.stringify(stakingPoolStats[37].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos038,
      nextExpectStakingPoolStats: stakingPoolStats038,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[37],
      stakeEvents[25],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos037,
      stakingPoolStats037,
    );
    stakeInfos.push(stakeInfos038);
    console.log(
      `\nstakeInfoAfterEvent037 after: ${JSON.stringify(stakeInfos[38].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats038);
    console.log(
      `stakingPoolStatsAfterEvent037 after: ${JSON.stringify(stakingPoolStats[38].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos039,
      nextExpectStakingPoolStats: stakingPoolStats039,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[38],
      stakeEvents[38],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos038,
      stakingPoolStats038,
    );
    stakeInfos.push(stakeInfos039);
    console.log(
      `\nstakeInfoAfterEvent038 after: ${JSON.stringify(stakeInfos[39].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats039);
    console.log(
      `stakingPoolStatsAfterEvent038 after: ${JSON.stringify(stakingPoolStats[39].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos040,
      nextExpectStakingPoolStats: stakingPoolStats040,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[39],
      stakeEvents[31],
      stakeEvents[34],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos039,
      stakingPoolStats039,
    );
    stakeInfos.push(stakeInfos040);
    console.log(
      `\nstakeInfoAfterEvent039 after: ${JSON.stringify(stakeInfos[40].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId},${stakeEvents[31].signerAddress},${stakeEvents[31].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats040);
    console.log(
      `stakingPoolStatsAfterEvent039 after: ${JSON.stringify(stakingPoolStats[40].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos041,
      nextExpectStakingPoolStats: stakingPoolStats041,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[40],
      stakeEvents[25],
      stakeEvents[37],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos040,
      stakingPoolStats040,
    );
    stakeInfos.push(stakeInfos041);
    console.log(
      `\nstakeInfoAfterEvent040 after: ${JSON.stringify(stakeInfos[41].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats041);
    console.log(
      `stakingPoolStatsAfterEvent040 after: ${JSON.stringify(stakingPoolStats[41].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos042,
      nextExpectStakingPoolStats: stakingPoolStats042,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[41],
      stakeEvents[9],
      stakeEvents[28],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos041,
      stakingPoolStats041,
    );
    stakeInfos.push(stakeInfos042);
    console.log(
      `\nstakeInfoAfterEvent041 after: ${JSON.stringify(stakeInfos[42].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats042);
    console.log(
      `stakingPoolStatsAfterEvent041 after: ${JSON.stringify(stakingPoolStats[42].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos043,
      nextExpectStakingPoolStats: stakingPoolStats043,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[42],
      stakeEvents[31],
      stakeEvents[34],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos042,
      stakingPoolStats042,
    );
    stakeInfos.push(stakeInfos043);
    console.log(
      `\nstakeInfoAfterEvent042 after: ${JSON.stringify(stakeInfos[43].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId},${stakeEvents[31].signerAddress},${stakeEvents[31].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats043);
    console.log(
      `stakingPoolStatsAfterEvent042 after: ${JSON.stringify(stakingPoolStats[43].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos044,
      nextExpectStakingPoolStats: stakingPoolStats044,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[43],
      stakeEvents[43],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos043,
      stakingPoolStats043,
    );
    stakeInfos.push(stakeInfos044);
    console.log(
      `\nstakeInfoAfterEvent043 after: ${JSON.stringify(stakeInfos[44].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats044);
    console.log(
      `stakingPoolStatsAfterEvent043 after: ${JSON.stringify(stakingPoolStats[44].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos045,
      nextExpectStakingPoolStats: stakingPoolStats045,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[44],
      stakeEvents[44],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos044,
      stakingPoolStats044,
    );
    stakeInfos.push(stakeInfos045);
    console.log(
      `\nstakeInfoAfterEvent044 after: ${JSON.stringify(stakeInfos[45].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats045);
    console.log(
      `stakingPoolStatsAfterEvent044 after: ${JSON.stringify(stakingPoolStats[45].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos046,
      nextExpectStakingPoolStats: stakingPoolStats046,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[45],
      stakeEvents[38],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos045,
      stakingPoolStats045,
    );
    stakeInfos.push(stakeInfos046);
    console.log(
      `\nstakeInfoAfterEvent045 after: ${JSON.stringify(stakeInfos[46].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats046);
    console.log(
      `stakingPoolStatsAfterEvent045 after: ${JSON.stringify(stakingPoolStats[46].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos047,
      nextExpectStakingPoolStats: stakingPoolStats047,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[46],
      stakeEvents[33],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos046,
      stakingPoolStats046,
    );
    stakeInfos.push(stakeInfos047);
    console.log(
      `\nstakeInfoAfterEvent046 after: ${JSON.stringify(stakeInfos[47].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats047);
    console.log(
      `stakingPoolStatsAfterEvent046 after: ${JSON.stringify(stakingPoolStats[47].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos048,
      nextExpectStakingPoolStats: stakingPoolStats048,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[47],
      stakeEvents[38],
      stakeEvents[45],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos047,
      stakingPoolStats047,
    );
    stakeInfos.push(stakeInfos048);
    console.log(
      `\nstakeInfoAfterEvent047 after: ${JSON.stringify(stakeInfos[48].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats048);
    console.log(
      `stakingPoolStatsAfterEvent047 after: ${JSON.stringify(stakingPoolStats[48].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
    );

    const totalStakeAmountsWei = new Map();
    for (let i = 0; i < stakeEvents.length; i++) {
      if (stakeEvents[i].eventType !== "Stake") {
        continue;
      }

      const stakePoolId =
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[i].poolIndex].poolId;
      const totalStakeAmountWei = hre.ethers.BigNumber.from(
        totalStakeAmountsWei.has(stakePoolId)
          ? totalStakeAmountsWei.get(stakePoolId)
          : hre.ethers.constants.Zero,
      ).add(stakeEvents[i].stakeAmountWei);

      totalStakeAmountsWei.set(stakePoolId, totalStakeAmountWei.toString());
    }

    const stakePoolStatsIterator =
      stakingPoolStats[stakingPoolStats.length - 1].entries();
    for (const [poolId, expectStakingPoolStats] of stakePoolStatsIterator) {
      const stakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs.find(
        (stakingPoolConfig) => stakingPoolConfig.poolId === poolId,
      );
      const totalStakeAmountWei = hre.ethers.BigNumber.from(
        totalStakeAmountsWei.get(poolId),
      );
      const totalRewardToBeDistributedWei =
        stakeServiceHelpers.computeTruncatedAmountWei(
          stakeServiceHelpers.estimateRewardAtMaturityWei(
            stakingPoolConfig.poolAprWei,
            stakingPoolConfig.stakeDurationDays,
            totalStakeAmountWei,
          ),
          stakingPoolConfig.rewardTokenDecimals,
        );

      stakingPoolsRewardBalanceOf[
        stakingPoolConfig.rewardTokenInstance.address
      ] = await stakeServiceHelpers.addStakingPoolRewardWithVerify(
        stakingServiceInstance,
        stakingPoolConfig.stakeTokenInstance,
        stakingPoolConfig.rewardTokenInstance,
        contractAdminRoleAccounts[0],
        poolId,
        stakingPoolConfig.stakeDurationDays,
        stakingPoolConfig.poolAprWei,
        stakingPoolsRewardBalanceOf[
          stakingPoolConfig.rewardTokenInstance.address
        ],
        {},
        totalRewardToBeDistributedWei.sub(totalStakeRewardLessByWei),
        true,
      );

      for (let j = 0; j < stakingPoolStats.length; j++) {
        const poolIdStakingStats = stakingPoolStats[j].get(`${poolId}`);
        poolIdStakingStats.totalRewardAddedWei = totalRewardToBeDistributedWei
          .sub(totalStakeRewardLessByWei)
          .toString();

        poolIdStakingStats.poolRewardAmountWei = stakeServiceHelpers
          .computePoolRewardWei(
            poolIdStakingStats.totalRewardAddedWei,
            poolIdStakingStats.totalRevokedRewardWei,
            poolIdStakingStats.totalUnstakedRewardBeforeMatureWei,
            poolIdStakingStats.totalRewardRemovedWei,
          )
          .toString();

        poolIdStakingStats.poolRemainingRewardWei = stakeServiceHelpers
          .computePoolRemainingRewardWei(
            poolIdStakingStats.poolRewardAmountWei,
            poolIdStakingStats.rewardToBeDistributedWei,
          )
          .toString();

        poolIdStakingStats.poolSizeWei = stakeServiceHelpers
          .computePoolSizeWei(
            stakingPoolConfig.stakeDurationDays,
            stakingPoolConfig.poolAprWei,
            poolIdStakingStats.poolRewardAmountWei,
            stakingPoolConfig.stakeTokenDecimals,
          )
          .toString();

        stakingPoolStats[j].set(`${poolId}`, poolIdStakingStats);
      }
    }

    await stakeServiceHelpers.testStakeClaimRevokeUnstakeWithdraw(
      stakingServiceInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      governanceRoleAccounts[0],
      contractAdminRoleAccounts[1],
      stakeEvents,
      stakeInfos,
      stakingPoolStats,
    );
  });
});
