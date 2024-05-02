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

  it("Should be able to stake, claim reward, revoke, unstake and withdraw", async () => {
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
        stakeExceedPoolReward: true,
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
    ];

    const stakeInfos = [];

    const stakeInfos000 = new Map();
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId},${stakeEvents[17].signerAddress},${stakeEvents[17].stakeId}`,
      {
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
      },
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`,
      {
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
      },
    );
    stakeInfos.push(stakeInfos000);

    const stakeInfos001 = structuredClone(stakeInfos000);
    const stakeInfoAfterEvent000 = stakeInfos001.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
    );
    console.log(
      `\nstakeInfoAfterEvent000 before: ${JSON.stringify(stakeInfoAfterEvent000)}`,
    );
    stakeInfoAfterEvent000.estimatedRewardAtMaturityWei = stakeEvents[0]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent000.stakeAmountWei = stakeEvents[0].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[0].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent000.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[0].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
                .stakeDurationDays,
              stakeEvents[0].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent000.stakeSecondsAfterStartblockTimestamp = stakeEvents[0]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[0].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent000.isActive = true;
    stakeInfoAfterEvent000.isInitialized = stakeEvents[0].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent001 before: ${JSON.stringify(stakeInfoAfterEvent001)}`,
    );
    stakeInfoAfterEvent001.estimatedRewardAtMaturityWei = stakeEvents[1]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent001.stakeAmountWei = stakeEvents[1].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[1].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent001.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[1].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
                .stakeDurationDays,
              stakeEvents[1].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent001.stakeSecondsAfterStartblockTimestamp = stakeEvents[1]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[1].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent001.isActive = true;
    stakeInfoAfterEvent001.isInitialized = stakeEvents[1].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent002 before: ${JSON.stringify(stakeInfoAfterEvent002)}`,
    );
    stakeInfoAfterEvent002.estimatedRewardAtMaturityWei = stakeEvents[2]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent002.stakeAmountWei = stakeEvents[2].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[2].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent002.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[2].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
                .stakeDurationDays,
              stakeEvents[2].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent002.stakeSecondsAfterStartblockTimestamp = stakeEvents[2]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[2].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent002.isActive = true;
    stakeInfoAfterEvent002.isInitialized = stakeEvents[2].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent003 before: ${JSON.stringify(stakeInfoAfterEvent003)}`,
    );
    stakeInfoAfterEvent003.estimatedRewardAtMaturityWei = stakeEvents[3]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent003.stakeAmountWei = stakeEvents[3].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[3].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent003.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[3].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
                .stakeDurationDays,
              stakeEvents[3].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent003.stakeSecondsAfterStartblockTimestamp = stakeEvents[3]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[3].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent003.isActive = true;
    stakeInfoAfterEvent003.isInitialized = stakeEvents[3].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent004 before: ${JSON.stringify(stakeInfoAfterEvent004)}`,
    );
    stakeInfoAfterEvent004.estimatedRewardAtMaturityWei = stakeEvents[4]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent004.stakeAmountWei = stakeEvents[4].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[4].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent004.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[4].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
                .stakeDurationDays,
              stakeEvents[4].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent004.stakeSecondsAfterStartblockTimestamp = stakeEvents[4]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[4].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent004.isActive = true;
    stakeInfoAfterEvent004.isInitialized = stakeEvents[4].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent005 before: ${JSON.stringify(stakeInfoAfterEvent005)}`,
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
      `\nstakeInfoAfterEvent006 before: ${JSON.stringify(stakeInfoAfterEvent006)}`,
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
      `\nstakeInfoAfterEvent007 before: ${JSON.stringify(stakeInfoAfterEvent007)}`,
    );
    stakeInfoAfterEvent007.estimatedRewardAtMaturityWei = stakeEvents[7]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent007.stakeAmountWei = stakeEvents[7].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[7].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent007.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[7].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
                .stakeDurationDays,
              stakeEvents[7].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent007.stakeSecondsAfterStartblockTimestamp = stakeEvents[7]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[7].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent007.isActive = true;
    stakeInfoAfterEvent007.isInitialized = stakeEvents[7].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent008 before: ${JSON.stringify(stakeInfoAfterEvent008)}`,
    );
    stakeInfoAfterEvent008.estimatedRewardAtMaturityWei = stakeEvents[8]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent008.stakeAmountWei = stakeEvents[8].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[8].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent008.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[8].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
                .stakeDurationDays,
              stakeEvents[8].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent008.stakeSecondsAfterStartblockTimestamp = stakeEvents[8]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[8].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent008.isActive = true;
    stakeInfoAfterEvent008.isInitialized = stakeEvents[8].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent009 before: ${JSON.stringify(stakeInfoAfterEvent009)}`,
    );
    stakeInfoAfterEvent009.estimatedRewardAtMaturityWei = stakeEvents[9]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent009.stakeAmountWei = stakeEvents[9].stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[9].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent009.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[9].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
                .stakeDurationDays,
              stakeEvents[9].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent009.stakeSecondsAfterStartblockTimestamp = stakeEvents[9]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeEvents[9].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent009.isActive = true;
    stakeInfoAfterEvent009.isInitialized = stakeEvents[9].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent010 before: ${JSON.stringify(stakeInfoAfterEvent010)}`,
    );
    stakeInfoAfterEvent010.estimatedRewardAtMaturityWei = stakeEvents[10]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent010.stakeAmountWei = stakeEvents[10]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[10].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent010.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[10].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
                .stakeDurationDays,
              stakeEvents[10].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent010.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[10].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeEvents[10].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent010.isActive = true;
    stakeInfoAfterEvent010.isInitialized = stakeEvents[10].stakeExceedPoolReward
      ? false
      : true;
    stakeInfos011.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
      stakeInfoAfterEvent010,
    );
    stakeInfos.push(stakeInfos011);
    console.log(
      `stakeInfoAfterEvent010 after (${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}, ${stakeEvents[10].signerAddress}, ${stakeEvents[10].stakeId}): ${JSON.stringify(stakeInfos[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
    );

    const stakeInfos012 = structuredClone(stakeInfos011);
    const stakeInfoAfterEvent011 = stakeInfos012.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
    );
    console.log(
      `\nstakeInfoAfterEvent011 before: ${JSON.stringify(stakeInfoAfterEvent011)}`,
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
      `\nstakeInfoAfterEvent012 before: ${JSON.stringify(stakeInfoAfterEvent012)}`,
    );
    stakeInfoAfterEvent012.estimatedRewardAtMaturityWei = stakeEvents[12]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent012.stakeAmountWei = stakeEvents[12]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[12].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent012.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[12].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
                .stakeDurationDays,
              stakeEvents[12].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent012.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[12].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeEvents[12].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent012.isActive = true;
    stakeInfoAfterEvent012.isInitialized = stakeEvents[12].stakeExceedPoolReward
      ? false
      : true;
    stakeInfos013.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      stakeInfoAfterEvent012,
    );
    stakeInfos.push(stakeInfos013);
    console.log(
      `stakeInfoAfterEvent012 after (${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}, ${stakeEvents[12].signerAddress}, ${stakeEvents[12].stakeId}): ${JSON.stringify(stakeInfos[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );

    const stakeInfos014 = structuredClone(stakeInfos013);
    const stakeInfoAfterEvent013 = stakeInfos014.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
    );
    console.log(
      `\nstakeInfoAfterEvent013 before: ${JSON.stringify(stakeInfoAfterEvent013)}`,
    );
    stakeInfoAfterEvent013.revokedRewardAmountWei = stakeServiceHelpers
      .calculateRevokedRewardAmountWei(
        stakeInfoAfterEvent013.estimatedRewardAtMaturityWei,
        stakeInfoAfterEvent013.rewardClaimedWei,
      )
      .toString();
    stakeInfoAfterEvent013.revokedStakeAmountWei = stakeServiceHelpers
      .calculateRevokedStakeAmountWei(
        stakeEvents[7].stakeAmountWei,
        hre.ethers.constants.Zero,
      )
      .toString();
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
      `\nstakeInfoAfterEvent014 before: ${JSON.stringify(stakeInfoAfterEvent014)}`,
    );
    stakeInfoAfterEvent014.estimatedRewardAtMaturityWei = stakeEvents[14]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent014.stakeAmountWei = stakeEvents[14]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[14].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent014.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[14].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
                .stakeDurationDays,
              stakeEvents[14].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent014.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[14].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeEvents[14].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent014.isActive = true;
    stakeInfoAfterEvent014.isInitialized = stakeEvents[14].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent015 before: ${JSON.stringify(stakeInfoAfterEvent015)}`,
    );
    stakeInfoAfterEvent015.withdrawUnstakeSecondsAfterStartblockTimestamp =
      stakeEvents[15].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfos016.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      stakeInfoAfterEvent015,
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
      `\nstakeInfoAfterEvent016 before: ${JSON.stringify(stakeInfoAfterEvent016)}`,
    );
    stakeInfoAfterEvent016.revokedRewardAmountWei = stakeServiceHelpers
      .calculateRevokedRewardAmountWei(
        stakeInfoAfterEvent016.estimatedRewardAtMaturityWei,
        stakeInfoAfterEvent016.rewardClaimedWei,
      )
      .toString();
    stakeInfoAfterEvent016.revokedStakeAmountWei = stakeServiceHelpers
      .calculateRevokedStakeAmountWei(
        stakeEvents[4].stakeAmountWei,
        hre.ethers.constants.Zero,
      )
      .toString();
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
      `\nstakeInfoAfterEvent017 before: ${JSON.stringify(stakeInfoAfterEvent017)}`,
    );
    stakeInfoAfterEvent017.estimatedRewardAtMaturityWei = stakeEvents[17]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
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
    stakeInfoAfterEvent017.stakeAmountWei = stakeEvents[17]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[17].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent017.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[17].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
                .stakeDurationDays,
              stakeEvents[17].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent017.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[17].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeEvents[17].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent017.isActive = true;
    stakeInfoAfterEvent017.isInitialized = stakeEvents[17].stakeExceedPoolReward
      ? false
      : true;
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
      `\nstakeInfoAfterEvent018 before: ${JSON.stringify(stakeInfoAfterEvent018)}`,
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
      `\nstakeInfoAfterEvent019 before: ${JSON.stringify(stakeInfoAfterEvent019)}`,
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
      `\nstakeInfoAfterEvent020 before: ${JSON.stringify(stakeInfoAfterEvent020)}`,
    );
    stakeInfoAfterEvent020.revokedRewardAmountWei = stakeServiceHelpers
      .calculateRevokedRewardAmountWei(
        stakeInfoAfterEvent020.estimatedRewardAtMaturityWei,
        stakeInfoAfterEvent020.rewardClaimedWei,
      )
      .toString();
    stakeInfoAfterEvent020.revokedStakeAmountWei = stakeServiceHelpers
      .calculateRevokedStakeAmountWei(
        stakeEvents[14].stakeAmountWei,
        stakeInfoAfterEvent020.unstakeAmountWei,
      )
      .toString();
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

    const stakeInfos022 = structuredClone(stakeInfos021);
    const stakeInfoAfterEvent021 = stakeInfos022.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`,
    );
    console.log(
      `\nstakeInfoAfterEvent021 before: ${JSON.stringify(stakeInfoAfterEvent021)}`,
    );
    stakeInfoAfterEvent021.estimatedRewardAtMaturityWei = stakeEvents[21]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeServiceHelpers.estimateRewardAtMaturityWei(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex]
                .poolAprWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex]
                .stakeDurationDays,
              stakeEvents[21].stakeAmountWei,
            ),
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex]
              .rewardTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent021.stakeAmountWei = stakeEvents[21]
      .stakeExceedPoolReward
      ? hre.ethers.constants.Zero.toString()
      : stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeEvents[21].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex]
              .stakeTokenDecimals,
          )
          .toString();
    stakeInfoAfterEvent021.stakeMaturitySecondsAfterStartblockTimestamp =
      stakeEvents[21].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeServiceHelpers
            .calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex]
                .stakeDurationDays,
              stakeEvents[21].eventSecondsAfterStartblockTimestamp,
            )
            .toString();
    stakeInfoAfterEvent021.stakeSecondsAfterStartblockTimestamp =
      stakeEvents[21].stakeExceedPoolReward
        ? hre.ethers.constants.Zero.toString()
        : stakeEvents[21].eventSecondsAfterStartblockTimestamp.toString();
    stakeInfoAfterEvent021.isActive = true;
    stakeInfoAfterEvent021.isInitialized = stakeEvents[21].stakeExceedPoolReward
      ? false
      : true;
    stakeInfos022.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`,
      stakeInfoAfterEvent021,
    );
    stakeInfos.push(stakeInfos022);
    console.log(
      `stakeInfoAfterEvent021 after: ${JSON.stringify(stakeInfos[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId},${stakeEvents[21].signerAddress},${stakeEvents[21].stakeId}`))}`,
    );

    const stakingPoolStats = [];

    const stakingPoolStats000 = new Map();
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`,
      {
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
        totalUnstakedRewardBeforeMatureWei:
          hre.ethers.constants.Zero.toString(),
        totalUnstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        totalUnstakePenaltyRemovedWei: hre.ethers.constants.Zero.toString(),
        totalWithdrawnUnstakeWei: hre.ethers.constants.Zero.toString(),
      },
    );
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`,
      {
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
        totalUnstakedRewardBeforeMatureWei:
          hre.ethers.constants.Zero.toString(),
        totalUnstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        totalUnstakePenaltyRemovedWei: hre.ethers.constants.Zero.toString(),
        totalWithdrawnUnstakeWei: hre.ethers.constants.Zero.toString(),
      },
    );
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`,
      {
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
        totalUnstakedRewardBeforeMatureWei:
          hre.ethers.constants.Zero.toString(),
        totalUnstakePenaltyAmountWei: hre.ethers.constants.Zero.toString(),
        totalUnstakePenaltyRemovedWei: hre.ethers.constants.Zero.toString(),
        totalWithdrawnUnstakeWei: hre.ethers.constants.Zero.toString(),
      },
    );
    stakingPoolStats.push(stakingPoolStats000);

    const stakingPoolStats001 = structuredClone(stakingPoolStats000);
    const stakingPoolStatsAfterEvent000 = stakingPoolStats001.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent000 before: ${JSON.stringify(stakingPoolStatsAfterEvent000)}`,
    );
    stakingPoolStatsAfterEvent000.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent000.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[0].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[0].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[0].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[0].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent000.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent000.totalStakedWei,
    )
      .add(
        stakeEvents[0].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[0].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats001.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent000,
    );
    stakingPoolStats.push(stakingPoolStats001);
    console.log(
      `stakingPoolStatsAfterEvent000 after: ${JSON.stringify(stakingPoolStats[1].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats002 = structuredClone(stakingPoolStats001);
    const stakingPoolStatsAfterEvent001 = stakingPoolStats002.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent001 before: ${JSON.stringify(stakingPoolStatsAfterEvent001)}`,
    );
    stakingPoolStatsAfterEvent001.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent001.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[1].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[1].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[1].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[1].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent001.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent001.totalStakedWei,
    )
      .add(
        stakeEvents[1].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[1].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats002.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent001,
    );
    stakingPoolStats.push(stakingPoolStats002);
    console.log(
      `stakingPoolStatsAfterEvent001 after: ${JSON.stringify(stakingPoolStats[2].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats003 = structuredClone(stakingPoolStats002);
    const stakingPoolStatsAfterEvent002 = stakingPoolStats003.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent002 before: ${JSON.stringify(stakingPoolStatsAfterEvent002)}`,
    );
    stakingPoolStatsAfterEvent002.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent002.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[2].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[2].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[2].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[2].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent002.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent002.totalStakedWei,
    )
      .add(
        stakeEvents[2].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[2].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats003.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent002,
    );
    stakingPoolStats.push(stakingPoolStats003);
    console.log(
      `stakingPoolStatsAfterEvent002 after: ${JSON.stringify(stakingPoolStats[3].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats004 = structuredClone(stakingPoolStats003);
    const stakingPoolStatsAfterEvent003 = stakingPoolStats004.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent003 before: ${JSON.stringify(stakingPoolStatsAfterEvent003)}`,
    );
    stakingPoolStatsAfterEvent003.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent003.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[3].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[3].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[3].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[3].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent003.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent003.totalStakedWei,
    )
      .add(
        stakeEvents[3].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[3].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats004.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent003,
    );
    stakingPoolStats.push(stakingPoolStats004);
    console.log(
      `stakingPoolStatsAfterEvent003 after: ${JSON.stringify(stakingPoolStats[4].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats005 = structuredClone(stakingPoolStats004);
    const stakingPoolStatsAfterEvent004 = stakingPoolStats005.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent004 before: ${JSON.stringify(stakingPoolStatsAfterEvent004)}`,
    );
    stakingPoolStatsAfterEvent004.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent004.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[4].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[4].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[4].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[4].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent004.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent004.totalStakedWei,
    )
      .add(
        stakeEvents[4].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[4].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats005.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent004,
    );
    stakingPoolStats.push(stakingPoolStats005);
    console.log(
      `stakingPoolStatsAfterEvent004 after: ${JSON.stringify(stakingPoolStats[5].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats006 = structuredClone(stakingPoolStats005);
    const stakingPoolStatsAfterEvent005 = stakingPoolStats006.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent005 before: ${JSON.stringify(stakingPoolStatsAfterEvent005)}`,
    );
    const stakeMaturitySecondsAfterStartblockTimestamp005 =
      stakeServiceHelpers.calculateStateMaturityTimestamp(
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
          .stakeDurationDays,
        stakeEvents[2].eventSecondsAfterStartblockTimestamp,
      );
    stakingPoolStatsAfterEvent005.totalUnstakedBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent005.totalUnstakedBeforeMatureWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakeAmountWei(
            stakeEvents[2].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp005,
            stakeEvents[5].eventSecondsAfterStartblockTimestamp,
            stakeEvents[5].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent005.totalUnstakedRewardBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent005.totalUnstakedRewardBeforeMatureWei,
      )
        .add(
          stakeEvents[2].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[2].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[2].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[2].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent005.totalUnstakePenaltyAmountWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent005.totalUnstakePenaltyAmountWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakePenaltyWei(
            stakeEvents[2].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp005,
            stakeEvents[5].eventSecondsAfterStartblockTimestamp,
            stakeEvents[5].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStats006.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent005,
    );
    stakingPoolStats.push(stakingPoolStats006);
    console.log(
      `stakingPoolStatsAfterEvent005 after: ${JSON.stringify(stakingPoolStats[6].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats007 = structuredClone(stakingPoolStats006);
    const stakingPoolStatsAfterEvent006 = stakingPoolStats007.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent006 before: ${JSON.stringify(stakingPoolStatsAfterEvent006)}`,
    );
    stakingPoolStatsAfterEvent006.totalWithdrawnUnstakeWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent006.totalWithdrawnUnstakeWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakeAmountWei(
            stakeEvents[2].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeServiceHelpers.calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex]
                .stakeDurationDays,
              stakeEvents[2].eventSecondsAfterStartblockTimestamp,
            ),
            stakeEvents[6].eventSecondsAfterStartblockTimestamp,
            stakeEvents[5].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStats007.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent006,
    );
    stakingPoolStats.push(stakingPoolStats007);
    console.log(
      `stakingPoolStatsAfterEvent006 after: ${JSON.stringify(stakingPoolStats[7].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats008 = structuredClone(stakingPoolStats007);
    const stakingPoolStatsAfterEvent007 = stakingPoolStats008.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent007 before: ${JSON.stringify(stakingPoolStatsAfterEvent007)}`,
    );
    stakingPoolStatsAfterEvent007.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent007.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[7].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[7].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[7].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[7].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent007.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent007.totalStakedWei,
    )
      .add(
        stakeEvents[7].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[7].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats008.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent007,
    );
    stakingPoolStats.push(stakingPoolStats008);
    console.log(
      `stakingPoolStatsAfterEvent007 after: ${JSON.stringify(stakingPoolStats[8].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats009 = structuredClone(stakingPoolStats008);
    const stakingPoolStatsAfterEvent008 = stakingPoolStats009.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent008 before: ${JSON.stringify(stakingPoolStatsAfterEvent008)}`,
    );
    stakingPoolStatsAfterEvent008.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent008.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[8].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[8].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[8].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[8].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent008.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent008.totalStakedWei,
    )
      .add(
        stakeEvents[8].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[8].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats009.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent008,
    );
    stakingPoolStats.push(stakingPoolStats009);
    console.log(
      `stakingPoolStatsAfterEvent008 after: ${JSON.stringify(stakingPoolStats[9].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats010 = structuredClone(stakingPoolStats009);
    const stakingPoolStatsAfterEvent009 = stakingPoolStats010.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent009 before: ${JSON.stringify(stakingPoolStatsAfterEvent009)}`,
    );
    stakingPoolStatsAfterEvent009.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent009.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[9].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[9].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[9].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[9].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent009.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent009.totalStakedWei,
    )
      .add(
        stakeEvents[9].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[9].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats010.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent009,
    );
    stakingPoolStats.push(stakingPoolStats010);
    console.log(
      `stakingPoolStatsAfterEvent009 after: ${JSON.stringify(stakingPoolStats[10].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats011 = structuredClone(stakingPoolStats010);
    const stakingPoolStatsAfterEvent010 = stakingPoolStats011.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent010 before: ${JSON.stringify(stakingPoolStatsAfterEvent010)}`,
    );
    stakingPoolStatsAfterEvent010.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent010.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[10].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[10].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[10].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[10].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[10].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent010.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent010.totalStakedWei,
    )
      .add(
        stakeEvents[10].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[10].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats011.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent010,
    );
    stakingPoolStats.push(stakingPoolStats011);
    console.log(
      `stakingPoolStatsAfterEvent010 after: ${JSON.stringify(stakingPoolStats[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats012 = structuredClone(stakingPoolStats011);
    const stakingPoolStatsAfterEvent011 = stakingPoolStats012.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent011 before: ${JSON.stringify(stakingPoolStatsAfterEvent011)}`,
    );
    const stakeMaturitySecondsAfterStartblockTimestamp011 =
      stakeServiceHelpers.calculateStateMaturityTimestamp(
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
          .stakeDurationDays,
        stakeEvents[1].eventSecondsAfterStartblockTimestamp,
      );
    stakingPoolStatsAfterEvent011.totalUnstakedBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent011.totalUnstakedBeforeMatureWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakeAmountWei(
            stakeEvents[1].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp011,
            stakeEvents[11].eventSecondsAfterStartblockTimestamp,
            stakeEvents[11].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent011.totalUnstakedRewardBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent011.totalUnstakedRewardBeforeMatureWei,
      )
        .add(
          stakeEvents[1].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[1].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[1].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[1].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
                  .rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent011.totalUnstakePenaltyAmountWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent011.totalUnstakePenaltyAmountWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakePenaltyWei(
            stakeEvents[1].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp011,
            stakeEvents[11].eventSecondsAfterStartblockTimestamp,
            stakeEvents[11].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStats012.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent011,
    );
    stakingPoolStats.push(stakingPoolStats012);
    console.log(
      `stakingPoolStatsAfterEvent011 after: ${JSON.stringify(stakingPoolStats[12].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats013 = structuredClone(stakingPoolStats012);
    const stakingPoolStatsAfterEvent012 = stakingPoolStats013.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent012 before: ${JSON.stringify(stakingPoolStatsAfterEvent012)}`,
    );
    stakingPoolStatsAfterEvent012.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent012.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[12].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[12].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[12].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[12].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[12].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent012.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent012.totalStakedWei,
    )
      .add(
        stakeEvents[12].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[12].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats013.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent012,
    );
    stakingPoolStats.push(stakingPoolStats013);
    console.log(
      `stakingPoolStatsAfterEvent012 after: ${JSON.stringify(stakingPoolStats[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats014 = structuredClone(stakingPoolStats013);
    const stakingPoolStatsAfterEvent013 = stakingPoolStats014.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent013 before: ${JSON.stringify(stakingPoolStatsAfterEvent013)}`,
    );
    stakingPoolStatsAfterEvent013.totalRevokedRewardWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent013.totalRevokedRewardWei,
      )
        .add(
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeServiceHelpers.estimateRewardAtMaturityWei(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
                .poolAprWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
                .stakeDurationDays,
              stakeEvents[7].stakeAmountWei,
            ),
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
              .rewardTokenDecimals,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent013.totalRevokedStakeWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent013.totalRevokedStakeWei,
      )
        .add(
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeEvents[7].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex]
              .stakeTokenDecimals,
          ),
        )
        .toString();
    stakingPoolStats014.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent013,
    );
    stakingPoolStats.push(stakingPoolStats014);
    console.log(
      `stakingPoolStatsAfterEvent013 after: ${JSON.stringify(stakingPoolStats[14].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats015 = structuredClone(stakingPoolStats014);
    const stakingPoolStatsAfterEvent014 = stakingPoolStats015.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent014 before: ${JSON.stringify(stakingPoolStatsAfterEvent014)}`,
    );
    stakingPoolStatsAfterEvent014.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent014.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[14].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[14].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[14].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[14].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[14].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent014.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent014.totalStakedWei,
    )
      .add(
        stakeEvents[14].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[14].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats015.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent014,
    );
    stakingPoolStats.push(stakingPoolStats015);
    console.log(
      `stakingPoolStatsAfterEvent014 after: ${JSON.stringify(stakingPoolStats[15].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats016 = structuredClone(stakingPoolStats015);
    const stakingPoolStatsAfterEvent015 = stakingPoolStats016.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent015 before: ${JSON.stringify(stakingPoolStatsAfterEvent015)}`,
    );
    stakingPoolStatsAfterEvent015.totalWithdrawnUnstakeWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent015.totalWithdrawnUnstakeWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakeAmountWei(
            stakeEvents[1].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeServiceHelpers.calculateStateMaturityTimestamp(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex]
                .stakeDurationDays,
              stakeEvents[1].eventSecondsAfterStartblockTimestamp,
            ),
            stakeEvents[15].eventSecondsAfterStartblockTimestamp,
            stakeEvents[11].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStats016.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent015,
    );
    stakingPoolStats.push(stakingPoolStats016);
    console.log(
      `stakingPoolStatsAfterEvent015 after: ${JSON.stringify(stakingPoolStats[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats017 = structuredClone(stakingPoolStats016);
    const stakingPoolStatsAfterEvent016 = stakingPoolStats017.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent016 before: ${JSON.stringify(stakingPoolStatsAfterEvent016)}`,
    );
    stakingPoolStatsAfterEvent016.totalRevokedRewardWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent016.totalRevokedRewardWei,
      )
        .add(
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeServiceHelpers.estimateRewardAtMaturityWei(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
                .poolAprWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
                .stakeDurationDays,
              stakeEvents[4].stakeAmountWei,
            ),
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
              .rewardTokenDecimals,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent016.totalRevokedStakeWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent016.totalRevokedStakeWei,
      )
        .add(
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeEvents[4].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex]
              .stakeTokenDecimals,
          ),
        )
        .toString();
    stakingPoolStats017.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent016,
    );
    stakingPoolStats.push(stakingPoolStats017);
    console.log(
      `stakingPoolStatsAfterEvent016 after: ${JSON.stringify(stakingPoolStats[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats018 = structuredClone(stakingPoolStats017);
    const stakingPoolStatsAfterEvent017 = stakingPoolStats018.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent017 before: ${JSON.stringify(stakingPoolStatsAfterEvent017)}`,
    );
    stakingPoolStatsAfterEvent017.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent017.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[17].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[17].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[17].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[17].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[17].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent017.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent017.totalStakedWei,
    )
      .add(
        stakeEvents[17].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[17].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats018.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent017,
    );
    stakingPoolStats.push(stakingPoolStats018);
    console.log(
      `stakingPoolStatsAfterEvent017 after: ${JSON.stringify(stakingPoolStats[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[17].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats019 = structuredClone(stakingPoolStats018);
    const stakingPoolStatsAfterEvent018 = stakingPoolStats019.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent018 before: ${JSON.stringify(stakingPoolStatsAfterEvent018)}`,
    );
    const stakeMaturitySecondsAfterStartblockTimestamp018 =
      stakeServiceHelpers.calculateStateMaturityTimestamp(
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
          .stakeDurationDays,
        stakeEvents[12].eventSecondsAfterStartblockTimestamp,
      );
    stakingPoolStatsAfterEvent018.totalUnstakedBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent018.totalUnstakedBeforeMatureWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakeAmountWei(
            stakeEvents[12].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp018,
            stakeEvents[18].eventSecondsAfterStartblockTimestamp,
            stakeEvents[18].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent018.totalUnstakedRewardBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent018.totalUnstakedRewardBeforeMatureWei,
      )
        .add(
          stakeEvents[12].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[12].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[12].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[12].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[12].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent018.totalUnstakePenaltyAmountWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent018.totalUnstakePenaltyAmountWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakePenaltyWei(
            stakeEvents[12].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp018,
            stakeEvents[18].eventSecondsAfterStartblockTimestamp,
            stakeEvents[18].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStats019.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent018,
    );
    stakingPoolStats.push(stakingPoolStats019);
    console.log(
      `stakingPoolStatsAfterEvent018 after: ${JSON.stringify(stakingPoolStats[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats020 = structuredClone(stakingPoolStats019);
    const stakingPoolStatsAfterEvent019 = stakingPoolStats020.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent019 before: ${JSON.stringify(stakingPoolStatsAfterEvent019)}`,
    );
    const stakeMaturitySecondsAfterStartblockTimestamp019 =
      stakeServiceHelpers.calculateStateMaturityTimestamp(
        stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
          .stakeDurationDays,
        stakeEvents[14].eventSecondsAfterStartblockTimestamp,
      );
    stakingPoolStatsAfterEvent019.totalUnstakedBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent019.totalUnstakedBeforeMatureWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakeAmountWei(
            stakeEvents[14].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp019,
            stakeEvents[19].eventSecondsAfterStartblockTimestamp,
            stakeEvents[19].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent019.totalUnstakedRewardBeforeMatureWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent019.totalUnstakedRewardBeforeMatureWei,
      )
        .add(
          stakeEvents[14].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[14].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[14].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[14].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[14].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent019.totalUnstakePenaltyAmountWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent019.totalUnstakePenaltyAmountWei,
      )
        .add(
          stakeServiceHelpers.calculateUnstakePenaltyWei(
            stakeEvents[14].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
              .earlyUnstakePenaltyPercentWei,
            stakeMaturitySecondsAfterStartblockTimestamp019,
            stakeEvents[19].eventSecondsAfterStartblockTimestamp,
            stakeEvents[19].eventSecondsAfterStartblockTimestamp,
          ),
        )
        .toString();
    stakingPoolStats020.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent019,
    );
    stakingPoolStats.push(stakingPoolStats020);
    console.log(
      `stakingPoolStatsAfterEvent019 after: ${JSON.stringify(stakingPoolStats[20].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats021 = structuredClone(stakingPoolStats020);
    const stakingPoolStatsAfterEvent020 = stakingPoolStats021.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent020 before: ${JSON.stringify(stakingPoolStatsAfterEvent020)}`,
    );
    stakingPoolStatsAfterEvent020.totalRevokedRewardWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent020.totalRevokedRewardWei,
      )
        .add(
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeServiceHelpers.estimateRewardAtMaturityWei(
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
                .poolAprWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
                .stakeDurationDays,
              stakeEvents[14].stakeAmountWei,
            ),
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
              .rewardTokenDecimals,
          ),
        )
        .toString();
    stakingPoolStatsAfterEvent020.totalRevokedStakeWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent020.totalRevokedStakeWei,
      )
        .add(
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeEvents[14].stakeAmountWei,
            stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex]
              .stakeTokenDecimals,
          ),
        )
        .toString();
    stakingPoolStats021.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent020,
    );
    stakingPoolStats.push(stakingPoolStats021);
    console.log(
      `stakingPoolStatsAfterEvent020 after: ${JSON.stringify(stakingPoolStats[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const stakingPoolStats022 = structuredClone(stakingPoolStats021);
    const stakingPoolStatsAfterEvent021 = stakingPoolStats022.get(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId}`,
    );
    console.log(
      `\nstakingPoolStatsAfterEvent021 before: ${JSON.stringify(stakingPoolStatsAfterEvent021)}`,
    );
    stakingPoolStatsAfterEvent021.rewardToBeDistributedWei =
      hre.ethers.BigNumber.from(
        stakingPoolStatsAfterEvent021.rewardToBeDistributedWei,
      )
        .add(
          stakeEvents[21].stakeExceedPoolReward
            ? hre.ethers.constants.Zero
            : stakeServiceHelpers.computeTruncatedAmountWei(
                stakeServiceHelpers.estimateRewardAtMaturityWei(
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[21].poolIndex
                  ].poolAprWei,
                  stakingPoolStakeRewardTokenSameConfigs[
                    stakeEvents[21].poolIndex
                  ].stakeDurationDays,
                  stakeEvents[21].stakeAmountWei,
                ),
                stakingPoolStakeRewardTokenSameConfigs[
                  stakeEvents[21].poolIndex
                ].rewardTokenDecimals,
              ),
        )
        .toString();
    stakingPoolStatsAfterEvent021.totalStakedWei = hre.ethers.BigNumber.from(
      stakingPoolStatsAfterEvent021.totalStakedWei,
    )
      .add(
        stakeEvents[21].stakeExceedPoolReward
          ? hre.ethers.constants.Zero
          : stakeServiceHelpers.computeTruncatedAmountWei(
              stakeEvents[21].stakeAmountWei,
              stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex]
                .stakeTokenDecimals,
            ),
      )
      .toString();
    stakingPoolStats022.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId}`,
      stakingPoolStatsAfterEvent021,
    );
    stakingPoolStats.push(stakingPoolStats022);
    console.log(
      `stakingPoolStatsAfterEvent021 after: ${JSON.stringify(stakingPoolStats[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[21].poolIndex].poolId}`))}`,
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
