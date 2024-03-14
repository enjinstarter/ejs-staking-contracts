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
});
