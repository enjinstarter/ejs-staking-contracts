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
  let contractUsageRoleAccounts;
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
    contractUsageRoleAccounts = accounts.slice(10, 15);
    /*
    console.log(`contractUsageRoleAccounts.length: ${contractUsageRoleAccounts.length}`);
    for (let i = 0; i < contractUsageRoleAccounts.length; i++) {
      console.log(`contractUsageRoleAccounts[${i}]: ${await contractUsageRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    enduserAccounts = accounts.slice(15);
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

    await testHelpers.grantRole(
      stakingServiceInstance,
      stakeServiceHelpers.CONTRACT_USAGE_ROLE,
      contractUsageRoleAccounts,
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

  describe("Initialization", function () {
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

      const uninitializedPoolId = hre.ethers.utils.id(
        "da61b654-4973-4879-9166-723c0017dd6d",
      );
      const enduserAccountAddress = await enduserAccounts[0].getAddress();
      const uninitializedStakeId = hre.ethers.utils.id(
        "bac9778d-5d13-4749-8823-52ef4feb4848",
      );

      await expect(
        stakingServiceInstance.getClaimableRewardWei(
          uninitializedPoolId,
          enduserAccountAddress,
          uninitializedStakeId,
        ),
      ).to.be.revertedWith("SSvcs2: uninitialized stake");

      await expect(
        stakingServiceInstance.getStakeInfo(
          uninitializedPoolId,
          enduserAccountAddress,
          uninitializedStakeId,
        ),
      ).to.be.revertedWith("SSvcs2: uninitialized stake");

      await expect(
        stakingServiceInstance.getStakingPoolStats(uninitializedPoolId),
      ).to.be.revertedWith("SPool2: uninitialized");
    });

    it("Should not allow initialization of zero staking pool address", async () => {
      await expect(
        stakeServiceHelpers.newStakingService(hre.ethers.constants.AddressZero),
      ).to.be.revertedWith("SSvcs2: staking pool");
    });
  });

  describe("Default Admin: Access Control", function () {
    it("Should only allow default admin role to grant and revoke roles", async () => {
      await testHelpers.testGrantRevokeRoles(
        stakingServiceInstance,
        governanceRoleAccounts,
        contractAdminRoleAccounts,
        enduserAccounts,
        accounts,
      );
    });
  });

  describe("Governance", function () {
    describe("Admin Wallet", function () {
      it("Should only allow governance role to set admin wallet", async () => {
        const expectAdminWalletBeforeSet =
          await governanceRoleAccounts[0].getAddress();
        const expectAdminWalletAfterSet =
          await unusedRoleAccounts[0].getAddress();

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

      it("Should not allow set admin wallet as zero address", async () => {
        await expect(
          stakingServiceInstance.setAdminWallet(
            hre.ethers.constants.AddressZero,
          ),
        ).to.be.revertedWith("AdminWallet: new wallet");
      });
    });

    describe("Staking Pool Contract", function () {
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

      it("Should not allow set staking pool contract as zero address", async () => {
        await expect(
          stakingServiceInstance.setStakingPoolContract(
            hre.ethers.constants.AddressZero,
          ),
        ).to.be.revertedWith("SSvcs2: new staking pool");
      });
    });
  });

  describe("Contract Admin", function () {
    describe("Pause/Unpause Contract", function () {
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
    });

    describe("Add/Remove Staking Pool Reward", function () {
      it("Should only allow contract admin role to add/remove staking pool reward", async () => {
        const adminWalletAddress = await governanceRoleAccounts[0].getAddress();

        const poolRewardAddWeiAmounts = [
          hre.ethers.utils.parseEther("686512.13355000"),
          hre.ethers.utils.parseEther("290641.93140083"),
          hre.ethers.utils.parseEther("75546.05411320"),
          hre.ethers.utils.parseEther("547738.63499448"),
          hre.ethers.utils.parseEther("93436.56482742"),
          hre.ethers.utils.parseEther("686512.13355000"),
          hre.ethers.utils.parseEther("290641.93140083"),
          hre.ethers.utils.parseEther("75546.05411320"),
          hre.ethers.utils.parseEther("547738.63499448"),
          hre.ethers.utils.parseEther("93436.56482742"),
          hre.ethers.utils.parseEther("686512.13355000"),
          hre.ethers.utils.parseEther("290641.93140083"),
          hre.ethers.utils.parseEther("75546.05411320"),
          hre.ethers.utils.parseEther("547738.63499448"),
          hre.ethers.utils.parseEther("93436.56482742"),
          hre.ethers.utils.parseEther("686512.13355000"),
          hre.ethers.utils.parseEther("290641.93140083"),
          hre.ethers.utils.parseEther("75546.05411320"),
          hre.ethers.utils.parseEther("547738.63499448"),
          hre.ethers.utils.parseEther("93436.56482742"),
          hre.ethers.utils.parseEther("24909.569654259360719854"),
          hre.ethers.utils.parseEther("6955.183347317756524738"),
          hre.ethers.utils.parseEther("7166.396966476698402746"),
          hre.ethers.utils.parseEther("799.785562545238355199"),
          hre.ethers.utils.parseEther("7502.566774318223444121"),
          hre.ethers.utils.parseEther("8963.544568013471406059"),
        ];

        const stakeInfos000 = new Map();
        const stakingPoolStats000 = new Map();

        for (
          let i = 0;
          i < stakingPoolStakeRewardTokenSameConfigs.length;
          i++
        ) {
          const stakingPoolStat = structuredClone(
            stakeServiceHelpers.initialStakingPoolStat,
          );
          if (
            stakingPoolStakeRewardTokenSameConfigs[i].poolAprWei.eq(
              hre.ethers.constants.Zero,
            )
          ) {
            stakingPoolStat.poolSizeWei = stakeServiceHelpers
              .computePoolSizeWei(
                stakingPoolStakeRewardTokenSameConfigs[i].stakeDurationDays,
                stakingPoolStakeRewardTokenSameConfigs[i].poolAprWei,
                hre.ethers.constants.Zero,
                stakingPoolStakeRewardTokenSameConfigs[i].stakeTokenDecimals,
              )
              .toString();
          }
          stakingPoolStats000.set(
            `${stakingPoolStakeRewardTokenSameConfigs[i].poolId}`,
            stakingPoolStat,
          );
        }

        const deployerSigners = governanceRoleAccounts.slice(0, 1);
        const stakeEvents000 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % deployerSigners.length;

          stakeEvents000.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "AddReward",
            poolIndex: poolIndex,
            signer: deployerSigners[signerIndex],
            signerAddress: await deployerSigners[signerIndex].getAddress(),
            rewardAmountWei: poolRewardAddWeiAmounts[i],
            hasPermission: true,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos001,
          nextExpectStakingPoolStats: stakingPoolStats001,
        } = await stakeServiceHelpers.testAddStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents000,
          stakeInfos000,
          stakingPoolStats000,
          stakingPoolsRewardBalanceOf,
        );

        const governanceRoleSigners = governanceRoleAccounts.slice(1);
        const stakeEvents001 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % governanceRoleSigners.length;

          stakeEvents001.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "AddReward",
            poolIndex: poolIndex,
            signer: governanceRoleSigners[signerIndex],
            signerAddress:
              await governanceRoleSigners[signerIndex].getAddress(),
            rewardAmountWei: poolRewardAddWeiAmounts[i],
            hasPermission: false,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos002,
          nextExpectStakingPoolStats: stakingPoolStats002,
        } = await stakeServiceHelpers.testAddStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents001,
          stakeInfos001,
          stakingPoolStats001,
          stakingPoolsRewardBalanceOf,
        );

        const contractAdminRoleSigners = contractAdminRoleAccounts;
        const stakeEvents002 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % contractAdminRoleSigners.length;

          stakeEvents002.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "AddReward",
            poolIndex: poolIndex,
            signer: contractAdminRoleSigners[signerIndex],
            signerAddress:
              await contractAdminRoleSigners[signerIndex].getAddress(),
            rewardAmountWei: poolRewardAddWeiAmounts[i],
            hasPermission: true,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos003,
          nextExpectStakingPoolStats: stakingPoolStats003,
        } = await stakeServiceHelpers.testAddStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents002,
          stakeInfos002,
          stakingPoolStats002,
          stakingPoolsRewardBalanceOf,
        );

        const enduserSigners = enduserAccounts;
        const stakeEvents003 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % enduserSigners.length;

          stakeEvents003.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "AddReward",
            poolIndex: poolIndex,
            signer: enduserSigners[signerIndex],
            signerAddress: await enduserSigners[signerIndex].getAddress(),
            rewardAmountWei: poolRewardAddWeiAmounts[i],
            hasPermission: false,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos004,
          nextExpectStakingPoolStats: stakingPoolStats004,
        } = await stakeServiceHelpers.testAddStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents003,
          stakeInfos003,
          stakingPoolStats003,
          stakingPoolsRewardBalanceOf,
        );

        const stakeEvents004 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % deployerSigners.length;

          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );

          stakeEvents004.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "RemoveReward",
            poolIndex: poolIndex,
            signer: deployerSigners[signerIndex],
            signerAddress: await deployerSigners[signerIndex].getAddress(),
            adminWalletAddress: adminWalletAddress,
            hasPermission: true,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos005,
          nextExpectStakingPoolStats: stakingPoolStats005,
        } = await stakeServiceHelpers.testRemoveStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents004,
          stakeInfos004,
          stakingPoolStats004,
          stakingPoolsRewardBalanceOf,
        );

        const stakeEvents005 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % governanceRoleSigners.length;

          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );

          stakeEvents005.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "RemoveReward",
            poolIndex: poolIndex,
            signer: governanceRoleSigners[signerIndex],
            signerAddress:
              await governanceRoleSigners[signerIndex].getAddress(),
            adminWalletAddress: adminWalletAddress,
            hasPermission: false,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos006,
          nextExpectStakingPoolStats: stakingPoolStats006,
        } = await stakeServiceHelpers.testRemoveStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents005,
          stakeInfos005,
          stakingPoolStats005,
          stakingPoolsRewardBalanceOf,
        );

        const stakeEvents006 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % contractAdminRoleSigners.length;

          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );

          stakeEvents006.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "RemoveReward",
            poolIndex: poolIndex,
            signer: contractAdminRoleSigners[signerIndex],
            signerAddress:
              await contractAdminRoleSigners[signerIndex].getAddress(),
            adminWalletAddress: adminWalletAddress,
            hasPermission: true,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos007,
          nextExpectStakingPoolStats: stakingPoolStats007,
        } = await stakeServiceHelpers.testRemoveStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents006,
          stakeInfos006,
          stakingPoolStats006,
          stakingPoolsRewardBalanceOf,
        );

        const stakeEvents007 = [];

        for (let i = 0; i < poolRewardAddWeiAmounts.length; i++) {
          const poolIndex = i % stakingPoolStakeRewardTokenSameConfigs.length;
          const signerIndex = i % enduserSigners.length;

          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );

          stakeEvents007.push({
            eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
              120 * (i + 1),
            ),
            eventType: "RemoveReward",
            poolIndex: poolIndex,
            signer: enduserSigners[signerIndex],
            signerAddress: await enduserSigners[signerIndex].getAddress(),
            adminWalletAddress: adminWalletAddress,
            hasPermission: false,
          });
        }

        const {
          nextExpectStakeInfos: stakeInfos008,
          nextExpectStakingPoolStats: stakingPoolStats008,
        } = await stakeServiceHelpers.testRemoveStakingPoolReward(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          await testHelpers.getCurrentBlockTimestamp(),
          stakeEvents007,
          stakeInfos007,
          stakingPoolStats007,
          stakingPoolsRewardBalanceOf,
        );
      });

      it("Should not allow add zero staking pool reward", async () => {
        await expect(
          stakingServiceInstance.addStakingPoolReward(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.Zero,
          ),
        ).to.be.revertedWith("SSvcs2: reward amount");
      });

      it("Should not allow add staking pool reward for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const rewardAmountWei = hre.ethers.utils.parseEther("6917.15942393");

        await expect(
          stakingServiceInstance.addStakingPoolReward(
            uninitializedPoolId,
            rewardAmountWei,
          ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("Should not allow remove unallocated staking pool reward for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );

        await expect(
          stakingServiceInstance.removeUnallocatedStakingPoolReward(
            uninitializedPoolId,
          ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("Should not allow remove unallocated staking pool reward when no unallocated reward", async () => {
        await expect(
          stakingServiceInstance.removeUnallocatedStakingPoolReward(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          ),
        ).to.be.revertedWith("SSvcs2: no unallocated");
      });

      it("should not allow remove unallocated staking pool reward when reward has been fully allocated", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "2508.249202273280999468",
        );
        const stakeUuid = "e1a6cc11-7528-49cb-ad4d-be8fde5cafd1";
        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .removeUnallocatedStakingPoolReward(stakingPoolConfig.poolId),
        ).to.be.revertedWith("SSvcs2: no unallocated");
      });
    });

    describe("Revoke Stake", function () {
      it("Should not allow revoke stake for unauthorized users", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "3597c16d-42b2-4546-9a81-dff4a06ef534",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "801bd9f6-c323-4c64-8145-b02a9201aeed",
        );

        const governanceAccount = governanceRoleAccounts[1];
        const governanceAddress = await governanceAccount.getAddress();
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(governanceAccount)
            .revokeStake(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${governanceAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .revokeStake(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${enduserAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );
      });

      it("Should not allow revoke stake for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "3597c16d-42b2-4546-9a81-dff4a06ef534",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "801bd9f6-c323-4c64-8145-b02a9201aeed",
        );

        await expect(
          stakingServiceInstance.revokeStake(
            uninitializedPoolId,
            await enduserAccounts[0].getAddress(),
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("Should not allow revoke stake for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "0a1d0e72-d072-4229-8338-85b41bf5ef25",
        );

        await expect(
          stakingServiceInstance.revokeStake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            await enduserAccounts[0].getAddress(),
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("Should not allow revoke stake for zero address", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "a62c96c0-4de6-4d8a-8c63-b0af0bf70d2e",
        );

        await expect(
          stakingServiceInstance.revokeStake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.AddressZero,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: account");
      });

      it("should not allow revoke stake for revoked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestRevokeStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .revokeStake(stakingPoolConfig.poolId, enduserAddress, stakeId),
        ).to.be.revertedWith("SSvcs2: revoked");
      });
    });

    describe("Remove Revoked Stake", function () {
      it("Should not allow remove revoked stakes for unauthorized users", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );

        const governanceAccount = governanceRoleAccounts[1];
        const governanceAddress = await governanceAccount.getAddress();
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(governanceAccount)
            .removeRevokedStakes(uninitializedPoolId),
        ).to.be.revertedWith(
          `AccessControl: account ${governanceAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .removeRevokedStakes(uninitializedPoolId),
        ).to.be.revertedWith(
          `AccessControl: account ${enduserAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );
      });

      it("Should not allow remove revoked stakes for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );

        await expect(
          stakingServiceInstance.removeRevokedStakes(uninitializedPoolId),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("Should not allow remove revoked stakes when no revoked stakes", async () => {
        await expect(
          stakingServiceInstance.removeRevokedStakes(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          ),
        ).to.be.revertedWith("SSvcs2: no revoked");
      });

      it("should not allow remove revoked stakes for zero stakes revoked", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .removeRevokedStakes(stakingPoolConfig.poolId),
        ).to.be.revertedWith("SSvcs2: no revoked");
      });

      it("should not allow remove revoked stakes immediately after remove revoked stakes", async () => {
        const adminWalletAccount = governanceRoleAccounts[0];
        const adminWalletAddress = await adminWalletAccount.getAddress();
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestRevokeStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .removeRevokedStakes(stakingPoolConfig.poolId),
        )
          .to.emit(stakingServiceInstance, "RevokedStakesRemoved")
          .withArgs(
            stakingPoolConfig.poolId,
            contractAdminAddress,
            adminWalletAddress,
            stakingPoolConfig.stakeTokenInstance.address,
            stakeAmountWei,
          );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .removeRevokedStakes(stakingPoolConfig.poolId),
        ).to.be.revertedWith("SSvcs2: no revoked");
      });
    });

    describe("Remove Unstake Penalty", function () {
      it("Should not allow remove unstake penalty for unauthorized users", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );

        const governanceAccount = governanceRoleAccounts[1];
        const governanceAddress = await governanceAccount.getAddress();
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(governanceAccount)
            .removeUnstakePenalty(uninitializedPoolId),
        ).to.be.revertedWith(
          `AccessControl: account ${governanceAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .removeUnstakePenalty(uninitializedPoolId),
        ).to.be.revertedWith(
          `AccessControl: account ${enduserAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );
      });

      it("Should not allow remove unstake penalty for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );

        await expect(
          stakingServiceInstance.removeUnstakePenalty(uninitializedPoolId),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("Should not allow remove unstake penalty when no stake", async () => {
        await expect(
          stakingServiceInstance.removeUnstakePenalty(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
          ),
        ).to.be.revertedWith("SSvcs2: no penalty");
      });

      it("should not allow remove unstake penalty for zero unstake penalty", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .removeUnstakePenalty(stakingPoolConfig.poolId),
        ).to.be.revertedWith("SSvcs2: no penalty");
      });

      it("should not allow remove unstake penalty immediately after remove unstake penalty", async () => {
        const adminWalletAccount = governanceRoleAccounts[0];
        const adminWalletAddress = await adminWalletAccount.getAddress();
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        const {
          nextExpectStakeInfos: stakeInfosBeforeRemove,
          nextExpectStakingPoolStats: stakingPoolStatsBeforeRemove,
        } = await stakeServiceHelpers.setupTestUnstakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        const removePenaltyEvent = {
          eventSecondsAfterStartblockTimestamp: 480,
          eventType: "RemovePenalty",
          poolIndex: poolIndex,
          signer: contractAdminAccount,
          signerAddress: await contractAdminAccount.getAddress(),
          adminWalletAccount: adminWalletAccount,
          adminWalletAddress: adminWalletAddress,
          hasPermission: true,
        };

        const {
          nextExpectStakeInfos: expectStakeInfosAfterRemove,
          nextExpectStakingPoolStats: expectStakingPoolStatsAfterRemove,
        } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
          removePenaltyEvent,
          removePenaltyEvent,
          null,
          stakingPoolStakeRewardTokenSameConfigs,
          stakeInfosBeforeRemove,
          stakingPoolStatsBeforeRemove,
        );

        await stakeServiceHelpers.removeUnstakePenaltyWithVerify(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          removePenaltyEvent,
          stakeInfosBeforeRemove,
          expectStakeInfosAfterRemove,
          stakingPoolStatsBeforeRemove,
          expectStakingPoolStatsAfterRemove,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .removeUnstakePenalty(stakingPoolConfig.poolId),
        ).to.be.revertedWith("SSvcs2: no penalty");
      });
    });

    describe("Suspend Stake", function () {
      it("Should not allow suspend stake for unauthorized users", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "60618239-f879-46a1-9a1e-b048976053ab",
        );

        const governanceAccount = governanceRoleAccounts[1];
        const governanceAddress = await governanceAccount.getAddress();
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(governanceAccount)
            .suspendStake(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${governanceAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .suspendStake(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${enduserAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );
      });

      it("Should not allow suspend stake for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "60618239-f879-46a1-9a1e-b048976053ab",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.suspendStake(
            uninitializedPoolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("Should not allow suspend stake for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "60618239-f879-46a1-9a1e-b048976053ab",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.suspendStake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("Should not allow suspend stake for zero address", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "91ed8ed6-f8de-4918-a9cc-ef951e877ab3",
        );

        await expect(
          stakingServiceInstance.suspendStake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.AddressZero,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: account");
      });

      it("should not allow suspend stake for suspended stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestSuspendStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .suspendStake(stakingPoolConfig.poolId, enduserAddress, stakeId),
        ).to.be.revertedWith("SSvcs2: stake suspended");
      });
    });

    describe("Resume Stake", function () {
      it("should allow contract admin role to resume stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "7213.096654415329718019",
        );
        const stakeUuid = "f6d8279c-c933-41d2-96b7-cd13aad5ea13";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestSuspendStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .resumeStake(stakingPoolConfig.poolId, enduserAddress, stakeId),
        )
          .to.emit(stakingServiceInstance, "StakeResumed")
          .withArgs(
            stakingPoolConfig.poolId,
            enduserAddress,
            stakeId,
            contractAdminAddress,
          );
      });

      it("Should not allow resume stake for unauthorized users", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "25d34c60-cb45-4ae6-a520-b0a07dacb6dc",
        );

        const governanceAccount = governanceRoleAccounts[1];
        const governanceAddress = await governanceAccount.getAddress();
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(governanceAccount)
            .resumeStake(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${governanceAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .resumeStake(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${enduserAddress.toLowerCase()} is missing role ${
            testHelpers.CONTRACT_ADMIN_ROLE
          }`,
        );
      });

      it("Should not allow resume stake for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "25d34c60-cb45-4ae6-a520-b0a07dacb6dc",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.resumeStake(
            uninitializedPoolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("Should not allow resume stake for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "25d34c60-cb45-4ae6-a520-b0a07dacb6dc",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.resumeStake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("Should not allow resume stake for zero address", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "380272d9-b1fa-4ce4-b567-a4671fa30f65",
        );

        await expect(
          stakingServiceInstance.resumeStake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.AddressZero,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: account");
      });

      it("should not allow resume stake for active stake (i.e. stake has not been suspended)", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "5184.856596247802866978",
        );
        const stakeUuid = "71c382c6-3427-4f8e-a2aa-9132dbfb7054";

        const stakeId = hre.ethers.utils.id(stakeUuid);
        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .resumeStake(stakingPoolConfig.poolId, enduserAddress, stakeId),
        ).to.be.revertedWith("SSvcs2: stake active");
      });
    });
  });

  describe("Contract Usage", function () {
    describe("Revenue Share Extend Stake Duration", function () {
      it("Should not allow revshare extend stake duration for unauthorized users", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "7638d780-eae6-4476-822e-565bceb7d0a1",
        );

        const governanceAccount = governanceRoleAccounts[1];
        const governanceAddress = await governanceAccount.getAddress();
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(governanceAccount)
            .revshareExtendStakeDuration(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${governanceAddress.toLowerCase()} is missing role ${
            stakeServiceHelpers.CONTRACT_USAGE_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .revshareExtendStakeDuration(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${contractAdminAddress.toLowerCase()} is missing role ${
            stakeServiceHelpers.CONTRACT_USAGE_ROLE
          }`,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .revshareExtendStakeDuration(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith(
          `AccessControl: account ${enduserAddress.toLowerCase()} is missing role ${
            stakeServiceHelpers.CONTRACT_USAGE_ROLE
          }`,
        );
      });

      it("Should not allow revshare extend stake duration for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "881c6059-5f5a-4eac-a608-8c7422cbb416",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "2007c66c-0cd8-4a4d-ad40-34aba95942a3",
        );
        const contractUsageAccount = contractUsageRoleAccounts[1];
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(contractUsageAccount)
            .revshareExtendStakeDuration(
              uninitializedPoolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("Should not allow revshare extend stake duration for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "de97352b-4b04-4caf-bb4e-f0a1d3246eb2",
        );
        const poolIndex = 2;
        const contractUsageAccount = contractUsageRoleAccounts[1];
        const enduserAccount = enduserAccounts[0];
        const enduserAddress = await enduserAccount.getAddress();

        await expect(
          stakingServiceInstance
            .connect(contractUsageAccount)
            .revshareExtendStakeDuration(
              stakingPoolStakeRewardTokenSameConfigs[poolIndex].poolId,
              enduserAddress,
              uninitializedStakeId,
            ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow revshare extend stake duration for revoked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractUsageAccount = contractUsageRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestRevokeStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractUsageAccount)
            .revshareExtendStakeDuration(
              stakingPoolConfig.poolId,
              enduserAddress,
              stakeId,
            ),
        ).to.be.revertedWith("SSvcs2: revoked stake");
      });

      it("should not allow revshare extend stake duration for unstaked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractUsageAccount = contractUsageRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestUnstakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractUsageAccount)
            .revshareExtendStakeDuration(
              stakingPoolConfig.poolId,
              enduserAddress,
              stakeId,
            ),
        ).to.be.revertedWith("SSvcs2: unstaked");
      });
    });
  });

  describe("Public", function () {
    describe("Get Claimable Reward", function () {
      it("should not allow get claimable reward for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "b32c48d5-b014-4076-bf2a-500278bc955b",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.getClaimableRewardWei(
            uninitializedPoolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow get claimable reward for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "b32c48d5-b014-4076-bf2a-500278bc955b",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.getClaimableRewardWei(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow get claimable reward for zero address", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "dd2f9801-23f8-48e3-866e-44340434278f",
        );

        await expect(
          stakingServiceInstance.getClaimableRewardWei(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.AddressZero,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: account");
      });
    });

    describe("Get Stake Info", function () {
      it("should not allow get stake info for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "b7c7ba28-8367-4499-a04c-8242dfd2295d",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.getStakeInfo(
            uninitializedPoolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow get stake info for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "b7c7ba28-8367-4499-a04c-8242dfd2295d",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.getStakeInfo(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow get stake info for zero address", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "5c54d4ca-6a15-48ba-b15c-9143b5781648",
        );

        await expect(
          stakingServiceInstance.getStakeInfo(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.AddressZero,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: account");
      });
    });

    describe("Get Staking Pool Stats", function () {
      it("should not allow get staking pool stats for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );

        await expect(
          stakingServiceInstance.getStakingPoolStats(uninitializedPoolId),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("should not allow invalid staking pool info", async () => {
        const testPoolInstance = await stakePoolHelpers.newMockStakingPool();
        const testServiceInstance = await stakeServiceHelpers.newStakingService(
          testPoolInstance.address,
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
        const poolIdIsInitializedFalse =
          await testPoolInstance.POOL_ID_IS_INITIALIZED_FALSE();
        const poolIdEarlyUnstakeMaxPenaltyPercentWeiExceed100 =
          await testPoolInstance.POOL_ID_EARLY_UNSTAKE_MAX_PENALTY_PERCENT_WEI_EXCEED_100();
        const poolIdEarlyUnstakeMinPenaltyPercentWeiExceed100 =
          await testPoolInstance.POOL_ID_EARLY_UNSTAKE_MIN_PENALTY_PERCENT_WEI_EXCEED_100();
        const poolIdEarlyUnstakeMinExceedMaxPenaltyPercentWei =
          await testPoolInstance.POOL_ID_EARLY_UNSTAKE_MIN_EXCEED_MAX_PENALTY_PERCENT_WEI();

        await expect(
          testServiceInstance.getStakingPoolStats(poolIdStakeDurationZero),
        ).to.be.revertedWith("SSvcs2: stake duration");

        await expect(
          testServiceInstance.getStakingPoolStats(poolIdStakeTokenAddressZero),
        ).to.be.revertedWith("SSvcs2: stake token");

        await expect(
          testServiceInstance.getStakingPoolStats(
            poolIdStakeTokenDecimalsNineteen,
          ),
        ).to.be.revertedWith("SSvcs2: stake decimals");

        await expect(
          testServiceInstance.getStakingPoolStats(poolIdRewardTokenAddressZero),
        ).to.be.revertedWith("SSvcs2: reward token");

        await expect(
          testServiceInstance.getStakingPoolStats(
            poolIdRewardTokenDecimalsNineteen,
          ),
        ).to.be.revertedWith("SSvcs2: reward decimals");

        await expect(
          testServiceInstance.getStakingPoolStats(poolIdIsInitializedFalse),
        ).to.be.revertedWith("SSvcs2: uninitialized pool");

        await expect(
          testServiceInstance.getStakingPoolStats(
            poolIdEarlyUnstakeMaxPenaltyPercentWeiExceed100,
          ),
        ).to.be.revertedWith("SSvcs2: max penalty");

        await expect(
          testServiceInstance.getStakingPoolStats(
            poolIdEarlyUnstakeMinPenaltyPercentWeiExceed100,
          ),
        ).to.be.revertedWith("SSvcs2: min penalty");

        await expect(
          testServiceInstance.getStakingPoolStats(
            poolIdEarlyUnstakeMinExceedMaxPenaltyPercentWei,
          ),
        ).to.be.revertedWith("SSvcs2: min > max penalty");
      });
    });

    describe("Get Unstake Info", function () {
      it("should not allow get unstake info for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "b7c7ba28-8367-4499-a04c-8242dfd2295d",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.getUnstakeInfo(
            uninitializedPoolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow get unstake info for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "b7c7ba28-8367-4499-a04c-8242dfd2295d",
        );
        const enduserAccountAddress = await enduserAccounts[0].getAddress();

        await expect(
          stakingServiceInstance.getUnstakeInfo(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            enduserAccountAddress,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow get unstake info for zero address", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "5c54d4ca-6a15-48ba-b15c-9143b5781648",
        );

        await expect(
          stakingServiceInstance.getUnstakeInfo(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            hre.ethers.constants.AddressZero,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: account");
      });

      it("should not allow get unstake info for revoked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestRevokeStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .getUnstakeInfo(stakingPoolConfig.poolId, enduserAddress, stakeId),
        ).to.be.revertedWith("SSvcs2: revoked stake");
      });

      it("should not allow get unstake info for unstaked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestUnstakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .getUnstakeInfo(stakingPoolConfig.poolId, enduserAddress, stakeId),
        ).to.be.revertedWith("SSvcs2: unstaked");
      });
    });

    describe("Stake", function () {
      it("should not allow stake when paused", async () => {
        const stakeId = hre.ethers.utils.id(
          "2b7a54ee-60e2-4eb4-ae93-58da3d783424",
        );
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "0.000000999999999999",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingServiceInstance.connect(contractAdminAccount).pauseContract(),
        )
          .to.emit(stakingServiceInstance, "Paused")
          .withArgs(contractAdminAddress);

        await expect(
          stakingServiceInstance.stake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            stakeId,
            stakeAmountWei,
          ),
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should not allow stake of zero amount", async () => {
        const stakeId = hre.ethers.utils.id(
          "63db1896-cf75-42b0-a3f4-739d18698bc7",
        );

        await expect(
          stakingServiceInstance.stake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            stakeId,
            hre.ethers.constants.Zero,
          ),
        ).to.be.revertedWith("SSvcs2: stake amount");
      });

      it("should not allow stake of zero amount after truncation", async () => {
        const STAKING_POOL_CONFIGS_STAKE_TOKEN_6_DECIMALS_INDEX = 6;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "0.000000999999999999",
        );
        const stakeId = hre.ethers.utils.id(
          "cb8c69be-0a32-46a4-9750-3ede278e1294",
        );

        await expect(
          stakingServiceInstance.stake(
            stakingPoolStakeRewardTokenSameConfigs[
              STAKING_POOL_CONFIGS_STAKE_TOKEN_6_DECIMALS_INDEX
            ].poolId,
            stakeId,
            stakeAmountWei,
          ),
        ).to.be.revertedWith("SSvcs2: truncated stake amount");
      });

      it("should not allow stake with zero reward at maturity unless staking pool APR is zero", async () => {
        const STAKING_POOL_CONFIGS_REWARD_TOKEN_6_DECIMALS_INDEX = 14;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "0.000000000000000001",
        );
        const stakeId = hre.ethers.utils.id(
          "cd854171-167c-4523-bdd0-a1ac0e85c3c9",
        );

        await expect(
          stakingServiceInstance.stake(
            stakingPoolStakeRewardTokenSameConfigs[
              STAKING_POOL_CONFIGS_REWARD_TOKEN_6_DECIMALS_INDEX
            ].poolId,
            stakeId,
            stakeAmountWei,
          ),
        ).to.be.revertedWith("SSvcs2: zero reward");
      });

      it("should not allow stake for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const stakeId = hre.ethers.utils.id(
          "c40bf84c-66eb-40cc-9337-d94bd657ee61",
        );
        const stakeAmountWei = hre.ethers.utils.parseEther("6917.15942393");

        await expect(
          stakingServiceInstance.stake(
            uninitializedPoolId,
            stakeId,
            stakeAmountWei,
          ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("should not allow stake for closed pool", async () => {
        const poolId = stakingPoolStakeRewardTokenSameConfigs[0].poolId;
        const stakeId = hre.ethers.utils.id(
          "05cbf8a5-556e-43c6-b0c4-f3b83dd7b29e",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "4808.724966120105184185",
        );

        await expect(
          stakingPoolInstance
            .connect(contractAdminAccount)
            .closeStakingPool(poolId),
        )
          .to.emit(stakingPoolInstance, "StakingPoolClosed")
          .withArgs(poolId, contractAdminAddress);

        await expect(
          stakingServiceInstance.stake(poolId, stakeId, stakeAmountWei),
        ).to.be.revertedWith("SSvcs2: pool closed");
      });

      it("should not allow stake if insufficient reward", async () => {
        const stakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs[0];
        const poolId = stakingPoolConfig.poolId;
        const stakeId = hre.ethers.utils.id(
          "8dad50f1-9d6c-41db-bbce-0d7276511173",
        );
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "6385.838568119519524842",
        );
        const enduserAccount = enduserAccounts[1];
        const fromWalletAccount = contractAdminRoleAccounts[0];
        const fromWalletAddress = await fromWalletAccount.getAddress();
        const rewardTokenInstance = stakingPoolConfig.rewardTokenInstance;
        const stakeTokenInstance = stakingPoolConfig.stakeTokenInstance;

        const expectRewardAtMaturityWei = stakeServiceHelpers
          .computeTruncatedAmountWei(
            stakeServiceHelpers.estimateRewardAtMaturityWei(
              stakingPoolConfig.poolAprWei,
              stakingPoolConfig.stakeDurationDays,
              stakeAmountWei,
            ),
            stakingPoolConfig.rewardTokenDecimals,
          )
          .sub(hre.ethers.constants.One);

        await testHelpers.approveTransferWithVerify(
          rewardTokenInstance,
          fromWalletAccount,
          stakingServiceInstance.address,
          expectRewardAtMaturityWei,
        );

        await expect(
          stakingServiceInstance
            .connect(fromWalletAccount)
            .addStakingPoolReward(poolId, expectRewardAtMaturityWei),
        )
          .to.emit(stakingServiceInstance, "StakingPoolRewardAdded")
          .withArgs(
            poolId,
            fromWalletAddress,
            rewardTokenInstance.address,
            expectRewardAtMaturityWei,
          );

        await testHelpers.transferAndApproveWithVerify(
          stakeTokenInstance,
          fromWalletAccount,
          enduserAccount,
          stakingServiceInstance.address,
          stakeAmountWei,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .stake(poolId, stakeId, stakeAmountWei),
        ).to.be.revertedWith("SSvcs2: insufficient");
      });
    });

    describe("Claim Reward", function () {
      it("should not allow claim reward when paused", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "e6fd90ea-7545-4a35-b86d-64fd3bff8e7d",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingServiceInstance.connect(contractAdminAccount).pauseContract(),
        )
          .to.emit(stakingServiceInstance, "Paused")
          .withArgs(contractAdminAddress);

        await expect(
          stakingServiceInstance.claimReward(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should not allow claim reward for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "e5f2454d-031c-4954-a11a-03933c7b7a3c",
        );

        await expect(
          stakingServiceInstance.claimReward(
            uninitializedPoolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("should not allow claim reward for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "e5f2454d-031c-4954-a11a-03933c7b7a3c",
        );

        await expect(
          stakingServiceInstance.claimReward(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow claim reward for suspended pool", async () => {
        const poolId = stakingPoolStakeRewardTokenSameConfigs[0].poolId;
        const uninitializedStakeId = hre.ethers.utils.id(
          "e5f2454d-031c-4954-a11a-03933c7b7a3c",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingPoolInstance
            .connect(contractAdminAccount)
            .suspendStakingPool(poolId),
        )
          .to.emit(stakingPoolInstance, "StakingPoolSuspended")
          .withArgs(poolId, contractAdminAddress);

        await expect(
          stakingServiceInstance.claimReward(poolId, uninitializedStakeId),
        ).to.be.revertedWith("SSvcs2: pool suspended");
      });

      it("should not allow claim reward for suspended stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestSuspendStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .claimReward(stakingPoolConfig.poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: stake suspended");
      });
    });

    describe("Unstake", function () {
      it("should not allow unstake when paused", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "e6fd90ea-7545-4a35-b86d-64fd3bff8e7d",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingServiceInstance.connect(contractAdminAccount).pauseContract(),
        )
          .to.emit(stakingServiceInstance, "Paused")
          .withArgs(contractAdminAddress);

        await expect(
          stakingServiceInstance.unstake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should not allow unstake for uninitialized staking pool", async () => {
        const uninitializedPoolId = hre.ethers.utils.id(
          "da61b654-4973-4879-9166-723c0017dd6d",
        );
        const uninitializedStakeId = hre.ethers.utils.id(
          "548e3d12-a611-43e1-978a-b3eef871af2c",
        );

        await expect(
          stakingServiceInstance.unstake(
            uninitializedPoolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SPool2: uninitialized");
      });

      it("should not allow unstake for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "548e3d12-a611-43e1-978a-b3eef871af2c",
        );

        await expect(
          stakingServiceInstance.unstake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow unstake for suspended pool", async () => {
        const poolId = stakingPoolStakeRewardTokenSameConfigs[0].poolId;
        const uninitializedStakeId = hre.ethers.utils.id(
          "9cf0a3dd-6f14-421c-94ef-cc0180e646e1",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingPoolInstance
            .connect(contractAdminAccount)
            .suspendStakingPool(poolId),
        )
          .to.emit(stakingPoolInstance, "StakingPoolSuspended")
          .withArgs(poolId, contractAdminAddress);

        await expect(
          stakingServiceInstance.unstake(poolId, uninitializedStakeId),
        ).to.be.revertedWith("SSvcs2: pool suspended");
      });

      it("should not allow unstake for suspended stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestSuspendStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .unstake(stakingPoolConfig.poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: stake suspended");
      });
    });

    describe("Withdraw Unstake", function () {
      it("should not allow withdraw unstake when paused", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "e6fd90ea-7545-4a35-b86d-64fd3bff8e7d",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingServiceInstance.connect(contractAdminAccount).pauseContract(),
        )
          .to.emit(stakingServiceInstance, "Paused")
          .withArgs(contractAdminAddress);

        await expect(
          stakingServiceInstance.withdrawUnstake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("Pausable: paused");
      });

      it("should not allow withdraw unstake for uninitialized stake", async () => {
        const uninitializedStakeId = hre.ethers.utils.id(
          "322e2a38-2ee8-469c-959d-cdf2c6232050",
        );

        await expect(
          stakingServiceInstance.withdrawUnstake(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            uninitializedStakeId,
          ),
        ).to.be.revertedWith("SSvcs2: uninitialized stake");
      });

      it("should not allow withdraw unstake for suspended pool", async () => {
        const poolId = stakingPoolStakeRewardTokenSameConfigs[0].poolId;
        const uninitializedStakeId = hre.ethers.utils.id(
          "9cf0a3dd-6f14-421c-94ef-cc0180e646e1",
        );
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();

        await expect(
          stakingPoolInstance
            .connect(contractAdminAccount)
            .suspendStakingPool(poolId),
        )
          .to.emit(stakingPoolInstance, "StakingPoolSuspended")
          .withArgs(poolId, contractAdminAddress);

        await expect(
          stakingServiceInstance.withdrawUnstake(poolId, uninitializedStakeId),
        ).to.be.revertedWith("SSvcs2: pool suspended");
      });

      it("should not allow withdraw unstake for suspended stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const contractAdminAddress = await contractAdminAccount.getAddress();
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];
        const poolId = stakingPoolConfig.poolId;

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestUnstakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(contractAdminAccount)
            .suspendStake(poolId, enduserAddress, stakeId),
        )
          .to.emit(stakingServiceInstance, "StakeSuspended")
          .withArgs(poolId, enduserAddress, stakeId, contractAdminAddress);

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .withdrawUnstake(poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: stake suspended");
      });

      it("should not allow withdraw unstake for revoked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestRevokeStakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .withdrawUnstake(stakingPoolConfig.poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: revoked");
      });

      it("should not allow withdraw unstake for during early unstake cooldown", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 2;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "ac0652f8-b3b6-4d67-9216-d6f5b77423af";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestUnstakeEnvironment(
          stakingServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          120,
          240,
          360,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        await expect(
          stakingServiceInstance
            .connect(enduserAccount)
            .withdrawUnstake(stakingPoolConfig.poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: cooldown");
      });
    });
  });

  /*
  it("should not allow invalid transfer of tokens from contract to account and vice versa", async () => {
    const enduserAccountAddress = await enduserAccounts[0].getAddress();
    const tokenInstance = stakeToken18DecimalsInstances[0];
    const tokenAddress = tokenInstance.address;
    const tokenDecimals = await tokenInstance.decimals();
    const transferAmountWei = hre.ethers.utils.parseEther(
      "0.000000000000000001",
    );

    const testPoolInstance = await stakeHelpers.newMockStakingPool();
    const testServiceInstance = await stakeHelpers.newMockStakingService(
      testPoolInstance.address,
    );

    await expect(
      testServiceInstance.transferTokensToAccount(
        hre.ethers.constants.AddressZero,
        tokenDecimals,
        transferAmountWei,
        enduserAccountAddress,
      ),
    ).to.be.revertedWith("SSvcs: token address");

    await expect(
      testServiceInstance.transferTokensToAccount(
        tokenAddress,
        19,
        transferAmountWei,
        enduserAccountAddress,
      ),
    ).to.be.revertedWith("SSvcs: token decimals");

    await expect(
      testServiceInstance.transferTokensToAccount(
        tokenAddress,
        tokenDecimals,
        hre.ethers.constants.Zero,
        enduserAccountAddress,
      ),
    ).to.be.revertedWith("SSvcs: amount");

    await expect(
      testServiceInstance.transferTokensToAccount(
        tokenAddress,
        tokenDecimals,
        transferAmountWei,
        hre.ethers.constants.AddressZero,
      ),
    ).to.be.revertedWith("SSvcs: account");

    await expect(
      testServiceInstance.transferTokensToContract(
        hre.ethers.constants.AddressZero,
        tokenDecimals,
        transferAmountWei,
        enduserAccountAddress,
      ),
    ).to.be.revertedWith("SSvcs: token address");

    await expect(
      testServiceInstance.transferTokensToContract(
        tokenAddress,
        19,
        transferAmountWei,
        enduserAccountAddress,
      ),
    ).to.be.revertedWith("SSvcs: token decimals");

    await expect(
      testServiceInstance.transferTokensToContract(
        tokenAddress,
        tokenDecimals,
        hre.ethers.constants.Zero,
        enduserAccountAddress,
      ),
    ).to.be.revertedWith("SSvcs: amount");

    await expect(
      testServiceInstance.transferTokensToContract(
        tokenAddress,
        tokenDecimals,
        transferAmountWei,
        hre.ethers.constants.AddressZero,
      ),
    ).to.be.revertedWith("SSvcs: account");
  });

  it("should not allow invalid stake maturity timestamp", async () => {
    const stakeAmountWei = hre.ethers.utils.parseEther("0.000000000000000001");

    const testServiceInstance = await stakeHelpers.newMockStakingService(
      stakingPoolInstance.address,
    );

    await expect(
      testServiceInstance.stake(
        stakingPoolStakeRewardTokenSameConfigs[0].poolId,
        stakeAmountWei,
      ),
    ).to.be.revertedWith("SSvcs: maturity timestamp");
  });
  */

  it("Should be able to stake, claim reward, revoke, unstake and withdraw", async () => {
    const stakeEvents = [
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(10),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("56289.771597347214289913"),
        stakeExceedPoolReward: false,
        stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
        stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(143),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("65543.437176927627080171"),
        stakeExceedPoolReward: false,
        stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
        stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(548),
        eventType: "Stake",
        poolIndex: 2,
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
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1189),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("38694.164531031409115445"),
        stakeExceedPoolReward: false,
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
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
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
        stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
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
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2107),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "f3159f39-bb26-47fc-8b0f-44d6959b20e1",
        stakeId: hre.ethers.utils.id("f3159f39-bb26-47fc-8b0f-44d6959b20e1"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2843),
        eventType: "Stake",
        poolIndex: 0,
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
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
        stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
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
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
        stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(87886),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
        stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
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
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(89340),
        eventType: "Revoke",
        poolIndex: 0,
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
        bankSigner: governanceRoleAccounts[0],
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
        bankSigner: governanceRoleAccounts[0],
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
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(261954),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(263010),
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
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(264165),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
        stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(273927),
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
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(436965),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
        stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(438202),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
        stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(439937),
        eventType: "Revoke",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
        stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(441322),
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
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(442213),
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
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(443262),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
        stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(444179),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "91e47baa-30f2-4aa1-8687-b726166a78ca",
        stakeId: hre.ethers.utils.id("91e47baa-30f2-4aa1-8687-b726166a78ca"),
      },
      {
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(445597),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
        stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(446917),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("2249.19019644633"),
        stakeExceedPoolReward: false,
        stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
        stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(15554242),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
        stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(15564625),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("3906.28534120275"),
        stakeExceedPoolReward: false,
        stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
        stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31537077),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
        stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31541724),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("7432.00457249105"),
        stakeExceedPoolReward: false,
        stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
        stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31566820),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("6034.66820432398"),
        stakeExceedPoolReward: false,
        stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
        stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31572954),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("3385.3172954628"),
        stakeExceedPoolReward: false,
        stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
        stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31589263),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("6557.27214892638"),
        stakeExceedPoolReward: false,
        stakeUuid: "74354a47-9a30-4a35-b8c0-5fd9c2a08e74",
        stakeId: hre.ethers.utils.id("74354a47-9a30-4a35-b8c0-5fd9c2a08e74"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31595195),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("2505.89519536014"),
        stakeExceedPoolReward: false,
        stakeUuid: "2c3b7992-a766-4cf9-9272-2a6c57024cc7",
        stakeId: hre.ethers.utils.id("2c3b7992-a766-4cf9-9272-2a6c57024cc7"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31685312),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("770.20036585288"),
        stakeExceedPoolReward: false,
        stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
        stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31697298),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
        stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31729841),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
        stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31977322),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
        stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31978835),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
        stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31979933),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("7926.24399682459"),
        stakeExceedPoolReward: false,
        stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
        stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31980968),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("5033.7876626605"),
        stakeExceedPoolReward: false,
        stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
        stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(47100625),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
        stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(47110835),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
        stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(47127406),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("6599.78039131017"),
        stakeExceedPoolReward: false,
        stakeUuid: "1fb7d744-83e8-4285-8c5e-b91728f9b600",
        stakeId: hre.ethers.utils.id("1fb7d744-83e8-4285-8c5e-b91728f9b600"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(47131459),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("4429.22933899988"),
        stakeExceedPoolReward: false,
        stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
        stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63102820),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
        stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63163330),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
        stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63175630),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
        stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63183213),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
        stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63184342),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("84.70426195331"),
        stakeExceedPoolReward: false,
        stakeUuid: "1ac89b36-4501-4f92-9005-5f66f7cfd5f2",
        stakeId: hre.ethers.utils.id("1ac89b36-4501-4f92-9005-5f66f7cfd5f2"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63185562),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("2055.62603138765"),
        stakeExceedPoolReward: false,
        stakeUuid: "a54fb4bf-52f5-4a40-8725-e01240179728",
        stakeId: hre.ethers.utils.id("a54fb4bf-52f5-4a40-8725-e01240179728"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63186260),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("9833.84578513"),
        stakeExceedPoolReward: false,
        stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
        stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63187851),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("1854.12966454286"),
        stakeExceedPoolReward: false,
        stakeUuid: "4ce0220f-cd6b-4f77-9fc5-ae21929619b4",
        stakeId: hre.ethers.utils.id("4ce0220f-cd6b-4f77-9fc5-ae21929619b4"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63188541),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("9405.14059556136"),
        stakeExceedPoolReward: false,
        stakeUuid: "4f1b92ab-faa8-4c97-9fad-dd22f768df0a",
        stakeId: hre.ethers.utils.id("4f1b92ab-faa8-4c97-9fad-dd22f768df0a"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63189018),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("353.23876522253"),
        stakeExceedPoolReward: false,
        stakeUuid: "12746d63-2a5e-4cf3-84c5-ca04a317cf1e",
        stakeId: hre.ethers.utils.id("12746d63-2a5e-4cf3-84c5-ca04a317cf1e"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63221312),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
        stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63223690),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
        stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63226050),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "2c3b7992-a766-4cf9-9272-2a6c57024cc7",
        stakeId: hre.ethers.utils.id("2c3b7992-a766-4cf9-9272-2a6c57024cc7"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63515933),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
        stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63559011),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
        stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63561156),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
        stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63562237),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
        stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63563753),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
        stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63568710),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
        stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63569189),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
        stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63571029),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
        stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63572087),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
        stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63573020),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
        stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63574302),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
        stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63575374),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
        stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63576727),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
        stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63577270),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
        stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(63578590),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
        stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(78663406),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "1fb7d744-83e8-4285-8c5e-b91728f9b600",
        stakeId: hre.ethers.utils.id("1fb7d744-83e8-4285-8c5e-b91728f9b600"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(78664579),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
        stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(78665126),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("9354.46258664962"),
        stakeExceedPoolReward: false,
        stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
        stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(78666126),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
        stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(78667112),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("620.01082112667"),
        stakeExceedPoolReward: false,
        stakeUuid: "ba8ebfdf-991d-4409-a532-2fcaeff8616a",
        stakeId: hre.ethers.utils.id("ba8ebfdf-991d-4409-a532-2fcaeff8616a1"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(78668164),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("5807.86316457633"),
        stakeExceedPoolReward: false,
        stakeUuid: "8b76695b-cdac-4fed-994c-7efc81bb24df",
        stakeId: hre.ethers.utils.id("8b76695b-cdac-4fed-994c-7efc81bb24df"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94720342),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "1ac89b36-4501-4f92-9005-5f66f7cfd5f2",
        stakeId: hre.ethers.utils.id("1ac89b36-4501-4f92-9005-5f66f7cfd5f2"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94721332),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
        stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94722259),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
        stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94723329),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "4f1b92ab-faa8-4c97-9fad-dd22f768df0a",
        stakeId: hre.ethers.utils.id("4f1b92ab-faa8-4c97-9fad-dd22f768df0a"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94724722),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "4ce0220f-cd6b-4f77-9fc5-ae21929619b4",
        stakeId: hre.ethers.utils.id("4ce0220f-cd6b-4f77-9fc5-ae21929619b4"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94726472),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
        stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94728128),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "1fb7d744-83e8-4285-8c5e-b91728f9b600",
        stakeId: hre.ethers.utils.id("1fb7d744-83e8-4285-8c5e-b91728f9b600"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94729836),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "ba8ebfdf-991d-4409-a532-2fcaeff8616a",
        stakeId: hre.ethers.utils.id("ba8ebfdf-991d-4409-a532-2fcaeff8616a1"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94730498),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "1ac89b36-4501-4f92-9005-5f66f7cfd5f2",
        stakeId: hre.ethers.utils.id("1ac89b36-4501-4f92-9005-5f66f7cfd5f2"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94732248),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "a54fb4bf-52f5-4a40-8725-e01240179728",
        stakeId: hre.ethers.utils.id("a54fb4bf-52f5-4a40-8725-e01240179728"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94733652),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "4ce0220f-cd6b-4f77-9fc5-ae21929619b4",
        stakeId: hre.ethers.utils.id("4ce0220f-cd6b-4f77-9fc5-ae21929619b4"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94734812),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "ba8ebfdf-991d-4409-a532-2fcaeff8616a",
        stakeId: hre.ethers.utils.id("ba8ebfdf-991d-4409-a532-2fcaeff8616a1"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94735717),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("1668.49635717648"),
        stakeExceedPoolReward: false,
        stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
        stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94737150),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("4112.46150381816"),
        stakeExceedPoolReward: false,
        stakeUuid: "7d01b41c-cc37-4eda-a80b-1a812ac68479",
        stakeId: hre.ethers.utils.id("7d01b41c-cc37-4eda-a80b-1a812ac68479"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94738208),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("8208.33359740074"),
        stakeExceedPoolReward: false,
        stakeUuid: "33a2d68d-4bec-4d52-8620-33cb2ef24beb",
        stakeId: hre.ethers.utils.id("33a2d68d-4bec-4d52-8620-33cb2ef24beb"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94739779),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("2204.23258414384"),
        stakeExceedPoolReward: false,
        stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
        stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94740257),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("2339.36488186848"),
        stakeExceedPoolReward: false,
        stakeUuid: "8654524f-8da3-4962-96f7-bb6b70817059",
        stakeId: hre.ethers.utils.id("8654524f-8da3-4962-96f7-bb6b70817059"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94741988),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("118.11491988429"),
        stakeExceedPoolReward: false,
        stakeUuid: "b24973af-cc7d-4a42-ad62-6f4dd45048e8",
        stakeId: hre.ethers.utils.id("b24973af-cc7d-4a42-ad62-6f4dd45048e8"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94744110),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
        stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94745417),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
        stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94746541),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("1396.05002350443"),
        stakeExceedPoolReward: false,
        stakeUuid: "b20f3ad7-7f88-4461-ac9d-86504e244a53",
        stakeId: hre.ethers.utils.id("b20f3ad7-7f88-4461-ac9d-86504e244a53"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94747338),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("3733.88087403792"),
        stakeExceedPoolReward: false,
        stakeUuid: "6fbfe4ea-0203-475f-a385-4c09f1fa7dbe",
        stakeId: hre.ethers.utils.id("6fbfe4ea-0203-475f-a385-4c09f1fa7dbe"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94748117),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("9824.75387523475"),
        stakeExceedPoolReward: false,
        stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
        stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94748808),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("6965.37608107324"),
        stakeExceedPoolReward: false,
        stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
        stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94749824),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
        stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94750075),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
        stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94752445),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("7652.9854424456"),
        stakeExceedPoolReward: false,
        stakeUuid: "03aef19f-bfe6-4432-9324-e4c146e4f4dc",
        stakeId: hre.ethers.utils.id("03aef19f-bfe6-4432-9324-e4c146e4f4dc"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94753608),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("5746.66911736668"),
        stakeExceedPoolReward: false,
        stakeUuid: "cd13b8f2-36c1-47f9-94af-85e97a946907",
        stakeId: hre.ethers.utils.id("cd13b8f2-36c1-47f9-94af-85e97a946907"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94754692),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("8768.80746923888"),
        stakeExceedPoolReward: false,
        stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
        stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94756395),
        eventType: "Stake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("3233.74042763951"),
        stakeExceedPoolReward: false,
        stakeUuid: "c7d2e899-c633-4b7a-9d47-7e88f9b09c0d",
        stakeId: hre.ethers.utils.id("c7d2e899-c633-4b7a-9d47-7e88f9b09c0d"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(94757894),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("940.08130789442"),
        stakeExceedPoolReward: false,
        stakeUuid: "a0a6d235-7496-4985-a775-446f6c1cda04",
        stakeId: hre.ethers.utils.id("a0a6d235-7496-4985-a775-446f6c1cda04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(110201126),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
        stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(110209400),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "2c3b7992-a766-4cf9-9272-2a6c57024cc7",
        stakeId: hre.ethers.utils.id("2c3b7992-a766-4cf9-9272-2a6c57024cc7"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126275779),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
        stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126283078),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
        stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126284008),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
        stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126285525),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
        stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126286587),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
        stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126287153),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
        stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126288715),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
        stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126289650),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
        stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126290996),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
        stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126291778),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
        stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126292551),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
        stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126293612),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "6fbfe4ea-0203-475f-a385-4c09f1fa7dbe",
        stakeId: hre.ethers.utils.id("6fbfe4ea-0203-475f-a385-4c09f1fa7dbe"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126294602),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
        stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126296287),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
        stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126297214),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "b24973af-cc7d-4a42-ad62-6f4dd45048e8",
        stakeId: hre.ethers.utils.id("b24973af-cc7d-4a42-ad62-6f4dd45048e8"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126298324),
        eventType: "Revoke",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "6fbfe4ea-0203-475f-a385-4c09f1fa7dbe",
        stakeId: hre.ethers.utils.id("6fbfe4ea-0203-475f-a385-4c09f1fa7dbe"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126299832),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "33a2d68d-4bec-4d52-8620-33cb2ef24beb",
        stakeId: hre.ethers.utils.id("33a2d68d-4bec-4d52-8620-33cb2ef24beb"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126301700),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
        stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126303021),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "03aef19f-bfe6-4432-9324-e4c146e4f4dc",
        stakeId: hre.ethers.utils.id("03aef19f-bfe6-4432-9324-e4c146e4f4dc"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126304798),
        eventType: "Unstake",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
        stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126306485),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "33a2d68d-4bec-4d52-8620-33cb2ef24beb",
        stakeId: hre.ethers.utils.id("33a2d68d-4bec-4d52-8620-33cb2ef24beb"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126307983),
        eventType: "Claim",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
        stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126309838),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "b24973af-cc7d-4a42-ad62-6f4dd45048e8",
        stakeId: hre.ethers.utils.id("b24973af-cc7d-4a42-ad62-6f4dd45048e8"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126311418),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
        stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126312777),
        eventType: "Withdraw",
        poolIndex: 1,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "03aef19f-bfe6-4432-9324-e4c146e4f4dc",
        stakeId: hre.ethers.utils.id("03aef19f-bfe6-4432-9324-e4c146e4f4dc"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126314188),
        eventType: "Claim",
        poolIndex: 1,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
        stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126315770),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
        stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126316577),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
        stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126317749),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "a0a6d235-7496-4985-a775-446f6c1cda04",
        stakeId: hre.ethers.utils.id("a0a6d235-7496-4985-a775-446f6c1cda04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126319637),
        eventType: "Revoke",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
        stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126321492),
        eventType: "Withdraw",
        poolIndex: 2,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "a0a6d235-7496-4985-a775-446f6c1cda04",
        stakeId: hre.ethers.utils.id("a0a6d235-7496-4985-a775-446f6c1cda04"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126322367),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
        stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126323674),
        eventType: "Stake",
        poolIndex: 1,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("1423.67439769709"),
        stakeExceedPoolReward: false,
        stakeUuid: "b79fe3cd-bc65-47ac-9733-38faddc6adb8",
        stakeId: hre.ethers.utils.id("b79fe3cd-bc65-47ac-9733-38faddc6adb8"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126324397),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
        stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
      },
      {
        bankSigner: governanceRoleAccounts[0],
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126325310),
        eventType: "Stake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeAmountWei: hre.ethers.utils.parseEther("4763.25310401376"),
        stakeExceedPoolReward: false,
        stakeUuid: "5b4c5559-8dea-4627-866c-6f8f05d07256",
        stakeId: hre.ethers.utils.id("5b4c5559-8dea-4627-866c-6f8f05d07256"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(126327180),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "74354a47-9a30-4a35-b8c0-5fd9c2a08e74",
        stakeId: hre.ethers.utils.id("74354a47-9a30-4a35-b8c0-5fd9c2a08e74"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(149499860),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
        stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(149500992),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
        stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(149501845),
        eventType: "Unstake",
        poolIndex: 2,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "5b4c5559-8dea-4627-866c-6f8f05d07256",
        stakeId: hre.ethers.utils.id("5b4c5559-8dea-4627-866c-6f8f05d07256"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(149502618),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "12746d63-2a5e-4cf3-84c5-ca04a317cf1e",
        stakeId: hre.ethers.utils.id("12746d63-2a5e-4cf3-84c5-ca04a317cf1e"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164981764),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "8b76695b-cdac-4fed-994c-7efc81bb24df",
        stakeId: hre.ethers.utils.id("8b76695b-cdac-4fed-994c-7efc81bb24df"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164983311),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "74354a47-9a30-4a35-b8c0-5fd9c2a08e74",
        stakeId: hre.ethers.utils.id("74354a47-9a30-4a35-b8c0-5fd9c2a08e74"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164984556),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
        stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164986180),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
        stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164987696),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
        stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164988628),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
        stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164989550),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
        stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(164991224),
        eventType: "Revoke",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
        stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(181050750),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "7d01b41c-cc37-4eda-a80b-1a812ac68479",
        stakeId: hre.ethers.utils.id("7d01b41c-cc37-4eda-a80b-1a812ac68479"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599210541),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[0],
        signerAddress: await enduserAccounts[0].getAddress(),
        stakeUuid: "b20f3ad7-7f88-4461-ac9d-86504e244a53",
        stakeId: hre.ethers.utils.id("b20f3ad7-7f88-4461-ac9d-86504e244a53"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599211257),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "8654524f-8da3-4962-96f7-bb6b70817059",
        stakeId: hre.ethers.utils.id("8654524f-8da3-4962-96f7-bb6b70817059"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599212714),
        eventType: "Revoke",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "8654524f-8da3-4962-96f7-bb6b70817059",
        stakeId: hre.ethers.utils.id("8654524f-8da3-4962-96f7-bb6b70817059"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599217608),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "cd13b8f2-36c1-47f9-94af-85e97a946907",
        stakeId: hre.ethers.utils.id("cd13b8f2-36c1-47f9-94af-85e97a946907"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599220395),
        eventType: "Unstake",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "c7d2e899-c633-4b7a-9d47-7e88f9b09c0d",
        stakeId: hre.ethers.utils.id("c7d2e899-c633-4b7a-9d47-7e88f9b09c0d"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599221667),
        eventType: "Claim",
        poolIndex: 0,
        signer: enduserAccounts[1],
        signerAddress: await enduserAccounts[1].getAddress(),
        stakeUuid: "cd13b8f2-36c1-47f9-94af-85e97a946907",
        stakeId: hre.ethers.utils.id("cd13b8f2-36c1-47f9-94af-85e97a946907"),
      },
      {
        eventSecondsAfterStartblockTimestamp:
          hre.ethers.BigNumber.from(31599222548),
        eventType: "Withdraw",
        poolIndex: 0,
        signer: enduserAccounts[2],
        signerAddress: await enduserAccounts[2].getAddress(),
        stakeUuid: "c7d2e899-c633-4b7a-9d47-7e88f9b09c0d",
        stakeId: hre.ethers.utils.id("c7d2e899-c633-4b7a-9d47-7e88f9b09c0d"),
      },
    ];

    const stakeInfos = [];

    const stakeInfos000 = new Map();
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[7].poolIndex].poolId},${stakeEvents[7].signerAddress},${stakeEvents[7].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId},${stakeEvents[20].signerAddress},${stakeEvents[20].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[23].poolIndex].poolId},${stakeEvents[23].signerAddress},${stakeEvents[23].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId},${stakeEvents[24].signerAddress},${stakeEvents[24].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[31].poolIndex].poolId},${stakeEvents[31].signerAddress},${stakeEvents[31].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId},${stakeEvents[36].signerAddress},${stakeEvents[36].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId},${stakeEvents[48].signerAddress},${stakeEvents[48].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId},${stakeEvents[53].signerAddress},${stakeEvents[53].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId},${stakeEvents[62].signerAddress},${stakeEvents[62].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId},${stakeEvents[63].signerAddress},${stakeEvents[63].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[66].poolIndex].poolId},${stakeEvents[66].signerAddress},${stakeEvents[66].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId},${stakeEvents[67].signerAddress},${stakeEvents[67].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId},${stakeEvents[72].signerAddress},${stakeEvents[72].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[73].poolIndex].poolId},${stakeEvents[73].signerAddress},${stakeEvents[73].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId},${stakeEvents[98].signerAddress},${stakeEvents[98].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[101].poolIndex].poolId},${stakeEvents[101].signerAddress},${stakeEvents[101].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId},${stakeEvents[114].signerAddress},${stakeEvents[114].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[115].poolIndex].poolId},${stakeEvents[115].signerAddress},${stakeEvents[115].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[122].poolIndex].poolId},${stakeEvents[122].signerAddress},${stakeEvents[122].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId},${stakeEvents[123].signerAddress},${stakeEvents[123].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId},${stakeEvents[128].signerAddress},${stakeEvents[128].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId},${stakeEvents[129].signerAddress},${stakeEvents[129].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[167].poolIndex].poolId},${stakeEvents[167].signerAddress},${stakeEvents[167].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[169].poolIndex].poolId},${stakeEvents[169].signerAddress},${stakeEvents[169].stakeId}`,
      structuredClone(stakeServiceHelpers.initialStakeInfo),
    );
    stakeInfos.push(stakeInfos000);

    const stakingPoolStats = [];

    const stakingPoolStats000 = new Map();
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`,
      structuredClone(stakeServiceHelpers.initialStakingPoolStat),
    );
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`,
      structuredClone(stakeServiceHelpers.initialStakingPoolStat),
    );
    stakingPoolStats000.set(
      `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`,
      structuredClone(stakeServiceHelpers.initialStakingPoolStat),
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
      stakeEvents[4],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos015,
      stakingPoolStats015,
    );
    stakeInfos.push(stakeInfos016);
    console.log(
      `\nstakeInfoAfterEvent015 after: ${JSON.stringify(stakeInfos[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats016);
    console.log(
      `stakingPoolStatsAfterEvent015 after: ${JSON.stringify(stakingPoolStats[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos017,
      nextExpectStakingPoolStats: stakingPoolStats017,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[16],
      stakeEvents[16],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos016,
      stakingPoolStats016,
    );
    stakeInfos.push(stakeInfos017);
    console.log(
      `\nstakeInfoAfterEvent016 after: ${JSON.stringify(stakeInfos[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats017);
    console.log(
      `stakingPoolStatsAfterEvent016 after: ${JSON.stringify(stakingPoolStats[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos018,
      nextExpectStakingPoolStats: stakingPoolStats018,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[17],
      stakeEvents[12],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos017,
      stakingPoolStats017,
    );
    stakeInfos.push(stakeInfos018);
    console.log(
      `\nstakeInfoAfterEvent017 after: ${JSON.stringify(stakeInfos[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats018);
    console.log(
      `stakingPoolStatsAfterEvent017 after: ${JSON.stringify(stakingPoolStats[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos019,
      nextExpectStakingPoolStats: stakingPoolStats019,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[18],
      stakeEvents[14],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos018,
      stakingPoolStats018,
    );
    stakeInfos.push(stakeInfos019);
    console.log(
      `\nstakeInfoAfterEvent018 after: ${JSON.stringify(stakeInfos[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats019);
    console.log(
      `stakingPoolStatsAfterEvent018 after: ${JSON.stringify(stakingPoolStats[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos020,
      nextExpectStakingPoolStats: stakingPoolStats020,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[19],
      stakeEvents[14],
      stakeEvents[18],
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
      stakeEvents[20],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos020,
      stakingPoolStats020,
    );
    stakeInfos.push(stakeInfos021);
    console.log(
      `\nstakeInfoAfterEvent020 after: ${JSON.stringify(stakeInfos[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId},${stakeEvents[20].signerAddress},${stakeEvents[20].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats021);
    console.log(
      `stakingPoolStatsAfterEvent020 after: ${JSON.stringify(stakingPoolStats[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos022,
      nextExpectStakingPoolStats: stakingPoolStats022,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[21],
      stakeEvents[3],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos021,
      stakingPoolStats021,
    );
    stakeInfos.push(stakeInfos022);
    console.log(
      `\nstakeInfoAfterEvent021 after: ${JSON.stringify(stakeInfos[22].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats022);
    console.log(
      `stakingPoolStatsAfterEvent021 after: ${JSON.stringify(stakingPoolStats[22].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos023,
      nextExpectStakingPoolStats: stakingPoolStats023,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[22],
      stakeEvents[20],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos022,
      stakingPoolStats022,
    );
    stakeInfos.push(stakeInfos023);
    console.log(
      `\nstakeInfoAfterEvent022 after: ${JSON.stringify(stakeInfos[23].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId},${stakeEvents[20].signerAddress},${stakeEvents[20].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats023);
    console.log(
      `stakingPoolStatsAfterEvent022 after: ${JSON.stringify(stakingPoolStats[23].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos024,
      nextExpectStakingPoolStats: stakingPoolStats024,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[23],
      stakeEvents[23],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos023,
      stakingPoolStats023,
    );
    stakeInfos.push(stakeInfos024);
    console.log(
      `\nstakeInfoAfterEvent023 after: ${JSON.stringify(stakeInfos[24].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[23].poolIndex].poolId},${stakeEvents[23].signerAddress},${stakeEvents[23].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats024);
    console.log(
      `stakingPoolStatsAfterEvent023 after: ${JSON.stringify(stakingPoolStats[24].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[23].poolIndex].poolId}`))}`,
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
      stakeEvents[0],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos025,
      stakingPoolStats025,
    );
    stakeInfos.push(stakeInfos026);
    console.log(
      `\nstakeInfoAfterEvent025 after: ${JSON.stringify(stakeInfos[26].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId},${stakeEvents[0].signerAddress},${stakeEvents[0].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats026);
    console.log(
      `stakingPoolStatsAfterEvent025 after: ${JSON.stringify(stakingPoolStats[26].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos027,
      nextExpectStakingPoolStats: stakingPoolStats027,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[26],
      stakeEvents[1],
      stakeEvents[11],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos026,
      stakingPoolStats026,
    );
    stakeInfos.push(stakeInfos027);
    console.log(
      `\nstakeInfoAfterEvent026 after: ${JSON.stringify(stakeInfos[27].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId},${stakeEvents[1].signerAddress},${stakeEvents[1].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats027);
    console.log(
      `stakingPoolStatsAfterEvent026 after: ${JSON.stringify(stakingPoolStats[27].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos028,
      nextExpectStakingPoolStats: stakingPoolStats028,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[27],
      stakeEvents[12],
      stakeEvents[17],
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
      stakeEvents[20],
      stakeEvents[22],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos029,
      stakingPoolStats029,
    );
    stakeInfos.push(stakeInfos030);
    console.log(
      `\nstakeInfoAfterEvent029 after: ${JSON.stringify(stakeInfos[30].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId},${stakeEvents[20].signerAddress},${stakeEvents[20].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats030);
    console.log(
      `stakingPoolStatsAfterEvent029 after: ${JSON.stringify(stakingPoolStats[30].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[20].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos031,
      nextExpectStakingPoolStats: stakingPoolStats031,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[30],
      stakeEvents[12],
      stakeEvents[17],
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
      stakeEvents[23],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos032,
      stakingPoolStats032,
    );
    stakeInfos.push(stakeInfos033);
    console.log(
      `\nstakeInfoAfterEvent032 after: ${JSON.stringify(stakeInfos[33].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[23].poolIndex].poolId},${stakeEvents[23].signerAddress},${stakeEvents[23].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats033);
    console.log(
      `stakingPoolStatsAfterEvent032 after: ${JSON.stringify(stakingPoolStats[33].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[23].poolIndex].poolId}`))}`,
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
      stakeEvents[24],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos037,
      stakingPoolStats037,
    );
    stakeInfos.push(stakeInfos038);
    console.log(
      `\nstakeInfoAfterEvent037 after: ${JSON.stringify(stakeInfos[38].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId},${stakeEvents[24].signerAddress},${stakeEvents[24].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats038);
    console.log(
      `stakingPoolStatsAfterEvent037 after: ${JSON.stringify(stakingPoolStats[38].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId}`))}`,
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
      stakeEvents[24],
      stakeEvents[37],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos040,
      stakingPoolStats040,
    );
    stakeInfos.push(stakeInfos041);
    console.log(
      `\nstakeInfoAfterEvent040 after: ${JSON.stringify(stakeInfos[41].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId},${stakeEvents[24].signerAddress},${stakeEvents[24].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats041);
    console.log(
      `stakingPoolStatsAfterEvent040 after: ${JSON.stringify(stakingPoolStats[41].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[24].poolIndex].poolId}`))}`,
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

    const {
      nextExpectStakeInfos: stakeInfos049,
      nextExpectStakingPoolStats: stakingPoolStats049,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[48],
      stakeEvents[48],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos048,
      stakingPoolStats048,
    );
    stakeInfos.push(stakeInfos049);
    console.log(
      `\nstakeInfoAfterEvent048 after: ${JSON.stringify(stakeInfos[49].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId},${stakeEvents[48].signerAddress},${stakeEvents[48].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats049);
    console.log(
      `stakingPoolStatsAfterEvent048 after: ${JSON.stringify(stakingPoolStats[49].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos050,
      nextExpectStakingPoolStats: stakingPoolStats050,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[49],
      stakeEvents[16],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos049,
      stakingPoolStats049,
    );
    stakeInfos.push(stakeInfos050);
    console.log(
      `\nstakeInfoAfterEvent049 after: ${JSON.stringify(stakeInfos[50].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats050);
    console.log(
      `stakingPoolStatsAfterEvent049 after: ${JSON.stringify(stakingPoolStats[50].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos051,
      nextExpectStakingPoolStats: stakingPoolStats051,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[50],
      stakeEvents[50],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos050,
      stakingPoolStats050,
    );
    stakeInfos.push(stakeInfos051);
    console.log(
      `\nstakeInfoAfterEvent050 after: ${JSON.stringify(stakeInfos[51].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats051);
    console.log(
      `stakingPoolStatsAfterEvent050 after: ${JSON.stringify(stakingPoolStats[51].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos052,
      nextExpectStakingPoolStats: stakingPoolStats052,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[51],
      stakeEvents[8],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos051,
      stakingPoolStats051,
    );
    stakeInfos.push(stakeInfos052);
    console.log(
      `\nstakeInfoAfterEvent051 after: ${JSON.stringify(stakeInfos[52].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats052);
    console.log(
      `stakingPoolStatsAfterEvent051 after: ${JSON.stringify(stakingPoolStats[52].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos053,
      nextExpectStakingPoolStats: stakingPoolStats053,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[52],
      stakeEvents[52],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos052,
      stakingPoolStats052,
    );
    stakeInfos.push(stakeInfos053);
    console.log(
      `\nstakeInfoAfterEvent052 after: ${JSON.stringify(stakeInfos[53].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats053);
    console.log(
      `stakingPoolStatsAfterEvent052 after: ${JSON.stringify(stakingPoolStats[53].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos054,
      nextExpectStakingPoolStats: stakingPoolStats054,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[53],
      stakeEvents[53],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos053,
      stakingPoolStats053,
    );
    stakeInfos.push(stakeInfos054);
    console.log(
      `\nstakeInfoAfterEvent053 after: ${JSON.stringify(stakeInfos[54].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId},${stakeEvents[53].signerAddress},${stakeEvents[53].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats054);
    console.log(
      `stakingPoolStatsAfterEvent053 after: ${JSON.stringify(stakingPoolStats[54].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos055,
      nextExpectStakingPoolStats: stakingPoolStats055,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[54],
      stakeEvents[54],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos054,
      stakingPoolStats054,
    );
    stakeInfos.push(stakeInfos055);
    console.log(
      `\nstakeInfoAfterEvent054 after: ${JSON.stringify(stakeInfos[55].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats055);
    console.log(
      `stakingPoolStatsAfterEvent054 after: ${JSON.stringify(stakingPoolStats[55].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos056,
      nextExpectStakingPoolStats: stakingPoolStats056,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[55],
      stakeEvents[55],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos055,
      stakingPoolStats055,
    );
    stakeInfos.push(stakeInfos056);
    console.log(
      `\nstakeInfoAfterEvent055 after: ${JSON.stringify(stakeInfos[56].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats056);
    console.log(
      `stakingPoolStatsAfterEvent055 after: ${JSON.stringify(stakingPoolStats[56].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos057,
      nextExpectStakingPoolStats: stakingPoolStats057,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[56],
      stakeEvents[56],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos056,
      stakingPoolStats056,
    );
    stakeInfos.push(stakeInfos057);
    console.log(
      `\nstakeInfoAfterEvent056 after: ${JSON.stringify(stakeInfos[57].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats057);
    console.log(
      `stakingPoolStatsAfterEvent056 after: ${JSON.stringify(stakingPoolStats[57].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos058,
      nextExpectStakingPoolStats: stakingPoolStats058,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[57],
      stakeEvents[57],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos057,
      stakingPoolStats057,
    );
    stakeInfos.push(stakeInfos058);
    console.log(
      `\nstakeInfoAfterEvent057 after: ${JSON.stringify(stakeInfos[58].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats058);
    console.log(
      `stakingPoolStatsAfterEvent057 after: ${JSON.stringify(stakingPoolStats[58].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos059,
      nextExpectStakingPoolStats: stakingPoolStats059,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[58],
      stakeEvents[44],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos058,
      stakingPoolStats058,
    );
    stakeInfos.push(stakeInfos059);
    console.log(
      `\nstakeInfoAfterEvent058 after: ${JSON.stringify(stakeInfos[59].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats059);
    console.log(
      `stakingPoolStatsAfterEvent058 after: ${JSON.stringify(stakingPoolStats[59].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos060,
      nextExpectStakingPoolStats: stakingPoolStats060,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[59],
      stakeEvents[48],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos059,
      stakingPoolStats059,
    );
    stakeInfos.push(stakeInfos060);
    console.log(
      `\nstakeInfoAfterEvent059 after: ${JSON.stringify(stakeInfos[60].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId},${stakeEvents[48].signerAddress},${stakeEvents[48].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats060);
    console.log(
      `stakingPoolStatsAfterEvent059 after: ${JSON.stringify(stakingPoolStats[60].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos061,
      nextExpectStakingPoolStats: stakingPoolStats061,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[60],
      stakeEvents[43],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos060,
      stakingPoolStats060,
    );
    stakeInfos.push(stakeInfos061);
    console.log(
      `\nstakeInfoAfterEvent060 after: ${JSON.stringify(stakeInfos[61].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats061);
    console.log(
      `stakingPoolStatsAfterEvent060 after: ${JSON.stringify(stakingPoolStats[61].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos062,
      nextExpectStakingPoolStats: stakingPoolStats062,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[61],
      stakeEvents[16],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos061,
      stakingPoolStats061,
    );
    stakeInfos.push(stakeInfos062);
    console.log(
      `\nstakeInfoAfterEvent061 after: ${JSON.stringify(stakeInfos[62].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats062);
    console.log(
      `stakingPoolStatsAfterEvent061 after: ${JSON.stringify(stakingPoolStats[62].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos063,
      nextExpectStakingPoolStats: stakingPoolStats063,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[62],
      stakeEvents[62],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos062,
      stakingPoolStats062,
    );
    stakeInfos.push(stakeInfos063);
    console.log(
      `\nstakeInfoAfterEvent062 after: ${JSON.stringify(stakeInfos[63].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId},${stakeEvents[62].signerAddress},${stakeEvents[62].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats063);
    console.log(
      `stakingPoolStatsAfterEvent062 after: ${JSON.stringify(stakingPoolStats[63].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos064,
      nextExpectStakingPoolStats: stakingPoolStats064,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[63],
      stakeEvents[63],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos063,
      stakingPoolStats063,
    );
    stakeInfos.push(stakeInfos064);
    console.log(
      `\nstakeInfoAfterEvent063 after: ${JSON.stringify(stakeInfos[64].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId},${stakeEvents[63].signerAddress},${stakeEvents[63].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats064);
    console.log(
      `stakingPoolStatsAfterEvent063 after: ${JSON.stringify(stakingPoolStats[64].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos065,
      nextExpectStakingPoolStats: stakingPoolStats065,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[64],
      stakeEvents[50],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos064,
      stakingPoolStats064,
    );
    stakeInfos.push(stakeInfos065);
    console.log(
      `\nstakeInfoAfterEvent064 after: ${JSON.stringify(stakeInfos[65].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats065);
    console.log(
      `stakingPoolStatsAfterEvent064 after: ${JSON.stringify(stakingPoolStats[65].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos066,
      nextExpectStakingPoolStats: stakingPoolStats066,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[65],
      stakeEvents[8],
      stakeEvents[51],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos065,
      stakingPoolStats065,
    );
    stakeInfos.push(stakeInfos066);
    console.log(
      `\nstakeInfoAfterEvent065 after: ${JSON.stringify(stakeInfos[66].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats066);
    console.log(
      `stakingPoolStatsAfterEvent065 after: ${JSON.stringify(stakingPoolStats[66].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos067,
      nextExpectStakingPoolStats: stakingPoolStats067,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[66],
      stakeEvents[66],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos066,
      stakingPoolStats066,
    );
    stakeInfos.push(stakeInfos067);
    console.log(
      `\nstakeInfoAfterEvent066 after: ${JSON.stringify(stakeInfos[67].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[66].poolIndex].poolId},${stakeEvents[66].signerAddress},${stakeEvents[66].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats067);
    console.log(
      `stakingPoolStatsAfterEvent066 after: ${JSON.stringify(stakingPoolStats[67].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[66].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos068,
      nextExpectStakingPoolStats: stakingPoolStats068,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[67],
      stakeEvents[67],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos067,
      stakingPoolStats067,
    );
    stakeInfos.push(stakeInfos068);
    console.log(
      `\nstakeInfoAfterEvent067 after: ${JSON.stringify(stakeInfos[68].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId},${stakeEvents[67].signerAddress},${stakeEvents[67].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats068);
    console.log(
      `stakingPoolStatsAfterEvent067 after: ${JSON.stringify(stakingPoolStats[68].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos069,
      nextExpectStakingPoolStats: stakingPoolStats069,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[68],
      stakeEvents[53],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos068,
      stakingPoolStats068,
    );
    stakeInfos.push(stakeInfos069);
    console.log(
      `\nstakeInfoAfterEvent068 after: ${JSON.stringify(stakeInfos[69].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId},${stakeEvents[53].signerAddress},${stakeEvents[53].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats069);
    console.log(
      `stakingPoolStatsAfterEvent068 after: ${JSON.stringify(stakingPoolStats[69].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos070,
      nextExpectStakingPoolStats: stakingPoolStats070,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[69],
      stakeEvents[54],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos069,
      stakingPoolStats069,
    );
    stakeInfos.push(stakeInfos070);
    console.log(
      `\nstakeInfoAfterEvent069 after: ${JSON.stringify(stakeInfos[70].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats070);
    console.log(
      `stakingPoolStatsAfterEvent069 after: ${JSON.stringify(stakingPoolStats[70].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos071,
      nextExpectStakingPoolStats: stakingPoolStats071,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[70],
      stakeEvents[43],
      stakeEvents[60],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos070,
      stakingPoolStats070,
    );
    stakeInfos.push(stakeInfos071);
    console.log(
      `\nstakeInfoAfterEvent070 after: ${JSON.stringify(stakeInfos[71].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats071);
    console.log(
      `stakingPoolStatsAfterEvent070 after: ${JSON.stringify(stakingPoolStats[71].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos072,
      nextExpectStakingPoolStats: stakingPoolStats072,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[71],
      stakeEvents[44],
      stakeEvents[58],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos071,
      stakingPoolStats071,
    );
    stakeInfos.push(stakeInfos072);
    console.log(
      `\nstakeInfoAfterEvent071 after: ${JSON.stringify(stakeInfos[72].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats072);
    console.log(
      `stakingPoolStatsAfterEvent071 after: ${JSON.stringify(stakingPoolStats[72].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos073,
      nextExpectStakingPoolStats: stakingPoolStats073,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[72],
      stakeEvents[72],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos072,
      stakingPoolStats072,
    );
    stakeInfos.push(stakeInfos073);
    console.log(
      `\nstakeInfoAfterEvent072 after: ${JSON.stringify(stakeInfos[73].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId},${stakeEvents[72].signerAddress},${stakeEvents[72].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats073);
    console.log(
      `stakingPoolStatsAfterEvent072 after: ${JSON.stringify(stakingPoolStats[73].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos074,
      nextExpectStakingPoolStats: stakingPoolStats074,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[73],
      stakeEvents[73],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos073,
      stakingPoolStats073,
    );
    stakeInfos.push(stakeInfos074);
    console.log(
      `\nstakeInfoAfterEvent073 after: ${JSON.stringify(stakeInfos[74].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[73].poolIndex].poolId},${stakeEvents[73].signerAddress},${stakeEvents[73].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats074);
    console.log(
      `stakingPoolStatsAfterEvent073 after: ${JSON.stringify(stakingPoolStats[74].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[73].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos075,
      nextExpectStakingPoolStats: stakingPoolStats075,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[74],
      stakeEvents[74],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos074,
      stakingPoolStats074,
    );
    stakeInfos.push(stakeInfos075);
    console.log(
      `\nstakeInfoAfterEvent074 after: ${JSON.stringify(stakeInfos[75].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats075);
    console.log(
      `stakingPoolStatsAfterEvent074 after: ${JSON.stringify(stakingPoolStats[75].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos076,
      nextExpectStakingPoolStats: stakingPoolStats076,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[75],
      stakeEvents[75],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos075,
      stakingPoolStats075,
    );
    stakeInfos.push(stakeInfos076);
    console.log(
      `\nstakeInfoAfterEvent075 after: ${JSON.stringify(stakeInfos[76].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats076);
    console.log(
      `stakingPoolStatsAfterEvent075 after: ${JSON.stringify(stakingPoolStats[76].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos077,
      nextExpectStakingPoolStats: stakingPoolStats077,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[76],
      stakeEvents[76],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos076,
      stakingPoolStats076,
    );
    stakeInfos.push(stakeInfos077);
    console.log(
      `\nstakeInfoAfterEvent076 after: ${JSON.stringify(stakeInfos[77].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats077);
    console.log(
      `stakingPoolStatsAfterEvent076 after: ${JSON.stringify(stakingPoolStats[77].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos078,
      nextExpectStakingPoolStats: stakingPoolStats078,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[77],
      stakeEvents[77],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos077,
      stakingPoolStats077,
    );
    stakeInfos.push(stakeInfos078);
    console.log(
      `\nstakeInfoAfterEvent077 after: ${JSON.stringify(stakeInfos[78].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats078);
    console.log(
      `stakingPoolStatsAfterEvent077 after: ${JSON.stringify(stakingPoolStats[78].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos079,
      nextExpectStakingPoolStats: stakingPoolStats079,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[78],
      stakeEvents[57],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos078,
      stakingPoolStats078,
    );
    stakeInfos.push(stakeInfos079);
    console.log(
      `\nstakeInfoAfterEvent078 after: ${JSON.stringify(stakeInfos[79].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats079);
    console.log(
      `stakingPoolStatsAfterEvent078 after: ${JSON.stringify(stakingPoolStats[79].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos080,
      nextExpectStakingPoolStats: stakingPoolStats080,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[79],
      stakeEvents[63],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos079,
      stakingPoolStats079,
    );
    stakeInfos.push(stakeInfos080);
    console.log(
      `\nstakeInfoAfterEvent079 after: ${JSON.stringify(stakeInfos[80].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId},${stakeEvents[63].signerAddress},${stakeEvents[63].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats080);
    console.log(
      `stakingPoolStatsAfterEvent079 after: ${JSON.stringify(stakingPoolStats[80].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos081,
      nextExpectStakingPoolStats: stakingPoolStats081,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[80],
      stakeEvents[56],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos080,
      stakingPoolStats080,
    );
    stakeInfos.push(stakeInfos081);
    console.log(
      `\nstakeInfoAfterEvent080 after: ${JSON.stringify(stakeInfos[81].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats081);
    console.log(
      `stakingPoolStatsAfterEvent080 after: ${JSON.stringify(stakingPoolStats[81].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos082,
      nextExpectStakingPoolStats: stakingPoolStats082,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[81],
      stakeEvents[62],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos081,
      stakingPoolStats081,
    );
    stakeInfos.push(stakeInfos082);
    console.log(
      `\nstakeInfoAfterEvent081 after: ${JSON.stringify(stakeInfos[82].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId},${stakeEvents[62].signerAddress},${stakeEvents[62].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats082);
    console.log(
      `stakingPoolStatsAfterEvent081 after: ${JSON.stringify(stakingPoolStats[82].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos083,
      nextExpectStakingPoolStats: stakingPoolStats083,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[82],
      stakeEvents[43],
      stakeEvents[70],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos082,
      stakingPoolStats082,
    );
    stakeInfos.push(stakeInfos083);
    console.log(
      `\nstakeInfoAfterEvent082 after: ${JSON.stringify(stakeInfos[83].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats083);
    console.log(
      `stakingPoolStatsAfterEvent082 after: ${JSON.stringify(stakingPoolStats[83].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos084,
      nextExpectStakingPoolStats: stakingPoolStats084,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[83],
      stakeEvents[50],
      stakeEvents[64],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos083,
      stakingPoolStats083,
    );
    stakeInfos.push(stakeInfos084);
    console.log(
      `\nstakeInfoAfterEvent083 after: ${JSON.stringify(stakeInfos[84].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats084);
    console.log(
      `stakingPoolStatsAfterEvent083 after: ${JSON.stringify(stakingPoolStats[84].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos085,
      nextExpectStakingPoolStats: stakingPoolStats085,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[84],
      stakeEvents[44],
      stakeEvents[58],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos084,
      stakingPoolStats084,
    );
    stakeInfos.push(stakeInfos085);
    console.log(
      `\nstakeInfoAfterEvent084 after: ${JSON.stringify(stakeInfos[85].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats085);
    console.log(
      `stakingPoolStatsAfterEvent084 after: ${JSON.stringify(stakingPoolStats[85].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos086,
      nextExpectStakingPoolStats: stakingPoolStats086,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[85],
      stakeEvents[48],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos085,
      stakingPoolStats085,
    );
    stakeInfos.push(stakeInfos086);
    console.log(
      `\nstakeInfoAfterEvent085 after: ${JSON.stringify(stakeInfos[86].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId},${stakeEvents[48].signerAddress},${stakeEvents[48].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats086);
    console.log(
      `stakingPoolStatsAfterEvent085 after: ${JSON.stringify(stakingPoolStats[86].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos087,
      nextExpectStakingPoolStats: stakingPoolStats087,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[86],
      stakeEvents[8],
      stakeEvents[51],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos086,
      stakingPoolStats086,
    );
    stakeInfos.push(stakeInfos087);
    console.log(
      `\nstakeInfoAfterEvent086 after: ${JSON.stringify(stakeInfos[87].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats087);
    console.log(
      `stakingPoolStatsAfterEvent086 after: ${JSON.stringify(stakingPoolStats[87].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos088,
      nextExpectStakingPoolStats: stakingPoolStats088,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[87],
      stakeEvents[57],
      stakeEvents[78],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos087,
      stakingPoolStats087,
    );
    stakeInfos.push(stakeInfos088);
    console.log(
      `\nstakeInfoAfterEvent087 after: ${JSON.stringify(stakeInfos[88].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats088);
    console.log(
      `stakingPoolStatsAfterEvent087 after: ${JSON.stringify(stakingPoolStats[88].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos089,
      nextExpectStakingPoolStats: stakingPoolStats089,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[88],
      stakeEvents[48],
      stakeEvents[85],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos088,
      stakingPoolStats088,
    );
    stakeInfos.push(stakeInfos089);
    console.log(
      `\nstakeInfoAfterEvent088 after: ${JSON.stringify(stakeInfos[89].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId},${stakeEvents[48].signerAddress},${stakeEvents[48].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats089);
    console.log(
      `stakingPoolStatsAfterEvent088 after: ${JSON.stringify(stakingPoolStats[89].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos090,
      nextExpectStakingPoolStats: stakingPoolStats090,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[89],
      stakeEvents[43],
      stakeEvents[70],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos089,
      stakingPoolStats089,
    );
    stakeInfos.push(stakeInfos090);
    console.log(
      `\nstakeInfoAfterEvent089 after: ${JSON.stringify(stakeInfos[90].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId},${stakeEvents[43].signerAddress},${stakeEvents[43].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats090);
    console.log(
      `stakingPoolStatsAfterEvent089 after: ${JSON.stringify(stakingPoolStats[90].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[43].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos091,
      nextExpectStakingPoolStats: stakingPoolStats091,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[90],
      stakeEvents[53],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos090,
      stakingPoolStats090,
    );
    stakeInfos.push(stakeInfos091);
    console.log(
      `\nstakeInfoAfterEvent090 after: ${JSON.stringify(stakeInfos[91].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId},${stakeEvents[53].signerAddress},${stakeEvents[53].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats091);
    console.log(
      `stakingPoolStatsAfterEvent090 after: ${JSON.stringify(stakingPoolStats[91].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos092,
      nextExpectStakingPoolStats: stakingPoolStats092,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[91],
      stakeEvents[44],
      stakeEvents[58],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos091,
      stakingPoolStats091,
    );
    stakeInfos.push(stakeInfos092);
    console.log(
      `\nstakeInfoAfterEvent091 after: ${JSON.stringify(stakeInfos[92].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId},${stakeEvents[44].signerAddress},${stakeEvents[44].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats092);
    console.log(
      `stakingPoolStatsAfterEvent091 after: ${JSON.stringify(stakingPoolStats[92].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[44].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos093,
      nextExpectStakingPoolStats: stakingPoolStats093,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[92],
      stakeEvents[67],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos092,
      stakingPoolStats092,
    );
    stakeInfos.push(stakeInfos093);
    console.log(
      `\nstakeInfoAfterEvent092 after: ${JSON.stringify(stakeInfos[93].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId},${stakeEvents[67].signerAddress},${stakeEvents[67].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats093);
    console.log(
      `stakingPoolStatsAfterEvent092 after: ${JSON.stringify(stakingPoolStats[93].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos094,
      nextExpectStakingPoolStats: stakingPoolStats094,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[93],
      stakeEvents[62],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos093,
      stakingPoolStats093,
    );
    stakeInfos.push(stakeInfos094);
    console.log(
      `\nstakeInfoAfterEvent093 after: ${JSON.stringify(stakeInfos[94].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId},${stakeEvents[62].signerAddress},${stakeEvents[62].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats094);
    console.log(
      `stakingPoolStatsAfterEvent093 after: ${JSON.stringify(stakingPoolStats[94].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos095,
      nextExpectStakingPoolStats: stakingPoolStats095,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[94],
      stakeEvents[54],
      stakeEvents[69],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos094,
      stakingPoolStats094,
    );
    stakeInfos.push(stakeInfos095);
    console.log(
      `\nstakeInfoAfterEvent094 after: ${JSON.stringify(stakeInfos[95].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats095);
    console.log(
      `stakingPoolStatsAfterEvent094 after: ${JSON.stringify(stakingPoolStats[95].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos096,
      nextExpectStakingPoolStats: stakingPoolStats096,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[95],
      stakeEvents[53],
      stakeEvents[90],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos095,
      stakingPoolStats095,
    );
    stakeInfos.push(stakeInfos096);
    console.log(
      `\nstakeInfoAfterEvent095 after: ${JSON.stringify(stakeInfos[96].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId},${stakeEvents[53].signerAddress},${stakeEvents[53].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats096);
    console.log(
      `stakingPoolStatsAfterEvent095 after: ${JSON.stringify(stakingPoolStats[96].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[53].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos097,
      nextExpectStakingPoolStats: stakingPoolStats097,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[96],
      stakeEvents[66],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos096,
      stakingPoolStats096,
    );
    stakeInfos.push(stakeInfos097);
    console.log(
      `\nstakeInfoAfterEvent096 after: ${JSON.stringify(stakeInfos[97].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[66].poolIndex].poolId},${stakeEvents[66].signerAddress},${stakeEvents[66].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats097);
    console.log(
      `stakingPoolStatsAfterEvent096 after: ${JSON.stringify(stakingPoolStats[97].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[66].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos098,
      nextExpectStakingPoolStats: stakingPoolStats098,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[97],
      stakeEvents[48],
      stakeEvents[85],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos097,
      stakingPoolStats097,
    );
    stakeInfos.push(stakeInfos098);
    console.log(
      `\nstakeInfoAfterEvent097 after: ${JSON.stringify(stakeInfos[98].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId},${stakeEvents[48].signerAddress},${stakeEvents[48].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats098);
    console.log(
      `stakingPoolStatsAfterEvent097 after: ${JSON.stringify(stakingPoolStats[98].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[48].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos099,
      nextExpectStakingPoolStats: stakingPoolStats099,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[98],
      stakeEvents[98],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos098,
      stakingPoolStats098,
    );
    stakeInfos.push(stakeInfos099);
    console.log(
      `\nstakeInfoAfterEvent098 after: ${JSON.stringify(stakeInfos[99].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId},${stakeEvents[98].signerAddress},${stakeEvents[98].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats099);
    console.log(
      `stakingPoolStatsAfterEvent098 after: ${JSON.stringify(stakingPoolStats[99].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos100,
      nextExpectStakingPoolStats: stakingPoolStats100,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[99],
      stakeEvents[16],
      stakeEvents[61],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos099,
      stakingPoolStats099,
    );
    stakeInfos.push(stakeInfos100);
    console.log(
      `\nstakeInfoAfterEvent099 after: ${JSON.stringify(stakeInfos[100].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats100);
    console.log(
      `stakingPoolStatsAfterEvent099 after: ${JSON.stringify(stakingPoolStats[100].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos101,
      nextExpectStakingPoolStats: stakingPoolStats101,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[100],
      stakeEvents[100],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos100,
      stakingPoolStats100,
    );
    stakeInfos.push(stakeInfos101);
    console.log(
      `\nstakeInfoAfterEvent100 after: ${JSON.stringify(stakeInfos[101].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats101);
    console.log(
      `stakingPoolStatsAfterEvent100 after: ${JSON.stringify(stakingPoolStats[101].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos102,
      nextExpectStakingPoolStats: stakingPoolStats102,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[101],
      stakeEvents[101],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos101,
      stakingPoolStats101,
    );
    stakeInfos.push(stakeInfos102);
    console.log(
      `\nstakeInfoAfterEvent101 after: ${JSON.stringify(stakeInfos[102].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[101].poolIndex].poolId},${stakeEvents[101].signerAddress},${stakeEvents[101].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats102);
    console.log(
      `stakingPoolStatsAfterEvent101 after: ${JSON.stringify(stakingPoolStats[102].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[101].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos103,
      nextExpectStakingPoolStats: stakingPoolStats103,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[102],
      stakeEvents[72],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos102,
      stakingPoolStats102,
    );
    stakeInfos.push(stakeInfos103);
    console.log(
      `\nstakeInfoAfterEvent102 after: ${JSON.stringify(stakeInfos[103].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId},${stakeEvents[72].signerAddress},${stakeEvents[72].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats103);
    console.log(
      `stakingPoolStatsAfterEvent102 after: ${JSON.stringify(stakingPoolStats[103].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos104,
      nextExpectStakingPoolStats: stakingPoolStats104,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[103],
      stakeEvents[63],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos103,
      stakingPoolStats103,
    );
    stakeInfos.push(stakeInfos104);
    console.log(
      `\nstakeInfoAfterEvent103 after: ${JSON.stringify(stakeInfos[104].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId},${stakeEvents[63].signerAddress},${stakeEvents[63].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats104);
    console.log(
      `stakingPoolStatsAfterEvent103 after: ${JSON.stringify(stakingPoolStats[104].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos105,
      nextExpectStakingPoolStats: stakingPoolStats105,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[104],
      stakeEvents[62],
      stakeEvents[93],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos104,
      stakingPoolStats104,
    );
    stakeInfos.push(stakeInfos105);
    console.log(
      `\nstakeInfoAfterEvent104 after: ${JSON.stringify(stakeInfos[105].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId},${stakeEvents[62].signerAddress},${stakeEvents[62].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats105);
    console.log(
      `stakingPoolStatsAfterEvent104 after: ${JSON.stringify(stakingPoolStats[105].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[62].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos106,
      nextExpectStakingPoolStats: stakingPoolStats106,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[105],
      stakeEvents[76],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos105,
      stakingPoolStats105,
    );
    stakeInfos.push(stakeInfos106);
    console.log(
      `\nstakeInfoAfterEvent105 after: ${JSON.stringify(stakeInfos[106].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats106);
    console.log(
      `stakingPoolStatsAfterEvent105 after: ${JSON.stringify(stakingPoolStats[106].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos107,
      nextExpectStakingPoolStats: stakingPoolStats107,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[106],
      stakeEvents[75],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos106,
      stakingPoolStats106,
    );
    stakeInfos.push(stakeInfos107);
    console.log(
      `\nstakeInfoAfterEvent106 after: ${JSON.stringify(stakeInfos[107].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats107);
    console.log(
      `stakingPoolStatsAfterEvent106 after: ${JSON.stringify(stakingPoolStats[107].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos108,
      nextExpectStakingPoolStats: stakingPoolStats108,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[107],
      stakeEvents[63],
      stakeEvents[103],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos107,
      stakingPoolStats107,
    );
    stakeInfos.push(stakeInfos108);
    console.log(
      `\nstakeInfoAfterEvent107 after: ${JSON.stringify(stakeInfos[108].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId},${stakeEvents[63].signerAddress},${stakeEvents[63].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats108);
    console.log(
      `stakingPoolStatsAfterEvent107 after: ${JSON.stringify(stakingPoolStats[108].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos109,
      nextExpectStakingPoolStats: stakingPoolStats109,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[108],
      stakeEvents[66],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos108,
      stakingPoolStats108,
    );
    stakeInfos.push(stakeInfos109);
    console.log(
      `\nstakeInfoAfterEvent108 after: ${JSON.stringify(stakeInfos[109].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[66].poolIndex].poolId},${stakeEvents[66].signerAddress},${stakeEvents[66].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats109);
    console.log(
      `stakingPoolStatsAfterEvent108 after: ${JSON.stringify(stakingPoolStats[109].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[63].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos110,
      nextExpectStakingPoolStats: stakingPoolStats110,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[109],
      stakeEvents[100],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos109,
      stakingPoolStats109,
    );
    stakeInfos.push(stakeInfos110);
    console.log(
      `\nstakeInfoAfterEvent109 after: ${JSON.stringify(stakeInfos[110].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats110);
    console.log(
      `stakingPoolStatsAfterEvent109 after: ${JSON.stringify(stakingPoolStats[110].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos111,
      nextExpectStakingPoolStats: stakingPoolStats111,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[110],
      stakeEvents[72],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos110,
      stakingPoolStats110,
    );
    stakeInfos.push(stakeInfos111);
    console.log(
      `\nstakeInfoAfterEvent110 after: ${JSON.stringify(stakeInfos[111].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId},${stakeEvents[72].signerAddress},${stakeEvents[72].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats111);
    console.log(
      `stakingPoolStatsAfterEvent110 after: ${JSON.stringify(stakingPoolStats[111].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[72].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos112,
      nextExpectStakingPoolStats: stakingPoolStats112,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[111],
      stakeEvents[73],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos111,
      stakingPoolStats111,
    );
    stakeInfos.push(stakeInfos112);
    console.log(
      `\nstakeInfoAfterEvent111 after: ${JSON.stringify(stakeInfos[112].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[73].poolIndex].poolId},${stakeEvents[73].signerAddress},${stakeEvents[73].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats112);
    console.log(
      `stakingPoolStatsAfterEvent111 after: ${JSON.stringify(stakingPoolStats[112].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[73].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos113,
      nextExpectStakingPoolStats: stakingPoolStats113,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[112],
      stakeEvents[75],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos112,
      stakingPoolStats112,
    );
    stakeInfos.push(stakeInfos113);
    console.log(
      `\nstakeInfoAfterEvent112 after: ${JSON.stringify(stakeInfos[113].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats113);
    console.log(
      `stakingPoolStatsAfterEvent112 after: ${JSON.stringify(stakingPoolStats[113].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos114,
      nextExpectStakingPoolStats: stakingPoolStats114,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[113],
      stakeEvents[100],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos113,
      stakingPoolStats113,
    );
    stakeInfos.push(stakeInfos114);
    console.log(
      `\nstakeInfoAfterEvent113 after: ${JSON.stringify(stakeInfos[114].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats114);
    console.log(
      `stakingPoolStatsAfterEvent113 after: ${JSON.stringify(stakingPoolStats[114].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos115,
      nextExpectStakingPoolStats: stakingPoolStats115,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[114],
      stakeEvents[114],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos114,
      stakingPoolStats114,
    );
    stakeInfos.push(stakeInfos115);
    console.log(
      `\nstakeInfoAfterEvent114 after: ${JSON.stringify(stakeInfos[115].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId},${stakeEvents[114].signerAddress},${stakeEvents[114].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats115);
    console.log(
      `stakingPoolStatsAfterEvent114 after: ${JSON.stringify(stakingPoolStats[115].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos116,
      nextExpectStakingPoolStats: stakingPoolStats116,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[115],
      stakeEvents[115],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos115,
      stakingPoolStats115,
    );
    stakeInfos.push(stakeInfos116);
    console.log(
      `\nstakeInfoAfterEvent115 after: ${JSON.stringify(stakeInfos[116].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[115].poolIndex].poolId},${stakeEvents[115].signerAddress},${stakeEvents[115].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats116);
    console.log(
      `stakingPoolStatsAfterEvent115 after: ${JSON.stringify(stakingPoolStats[116].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[115].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos117,
      nextExpectStakingPoolStats: stakingPoolStats117,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[116],
      stakeEvents[116],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos116,
      stakingPoolStats116,
    );
    stakeInfos.push(stakeInfos117);
    console.log(
      `\nstakeInfoAfterEvent116 after: ${JSON.stringify(stakeInfos[117].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats117);
    console.log(
      `stakingPoolStatsAfterEvent116 after: ${JSON.stringify(stakingPoolStats[117].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos118,
      nextExpectStakingPoolStats: stakingPoolStats118,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[117],
      stakeEvents[117],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos117,
      stakingPoolStats117,
    );
    stakeInfos.push(stakeInfos118);
    console.log(
      `\nstakeInfoAfterEvent117 after: ${JSON.stringify(stakeInfos[118].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats118);
    console.log(
      `stakingPoolStatsAfterEvent117 after: ${JSON.stringify(stakingPoolStats[118].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos119,
      nextExpectStakingPoolStats: stakingPoolStats119,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[118],
      stakeEvents[118],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos118,
      stakingPoolStats118,
    );
    stakeInfos.push(stakeInfos119);
    console.log(
      `\nstakeInfoAfterEvent118 after: ${JSON.stringify(stakeInfos[119].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats119);
    console.log(
      `stakingPoolStatsAfterEvent118 after: ${JSON.stringify(stakingPoolStats[119].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos120,
      nextExpectStakingPoolStats: stakingPoolStats120,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[119],
      stakeEvents[119],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos119,
      stakingPoolStats119,
    );
    stakeInfos.push(stakeInfos120);
    console.log(
      `\nstakeInfoAfterEvent119 after: ${JSON.stringify(stakeInfos[120].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats120);
    console.log(
      `stakingPoolStatsAfterEvent119 after: ${JSON.stringify(stakingPoolStats[120].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos121,
      nextExpectStakingPoolStats: stakingPoolStats121,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[120],
      stakeEvents[54],
      stakeEvents[69],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos120,
      stakingPoolStats120,
    );
    stakeInfos.push(stakeInfos121);
    console.log(
      `\nstakeInfoAfterEvent120 after: ${JSON.stringify(stakeInfos[121].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats121);
    console.log(
      `stakingPoolStatsAfterEvent120 after: ${JSON.stringify(stakingPoolStats[121].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos122,
      nextExpectStakingPoolStats: stakingPoolStats122,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[121],
      stakeEvents[8],
      stakeEvents[51],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos121,
      stakingPoolStats121,
    );
    stakeInfos.push(stakeInfos122);
    console.log(
      `\nstakeInfoAfterEvent121 after: ${JSON.stringify(stakeInfos[122].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId},${stakeEvents[8].signerAddress},${stakeEvents[8].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats122);
    console.log(
      `stakingPoolStatsAfterEvent121 after: ${JSON.stringify(stakingPoolStats[122].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[8].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos123,
      nextExpectStakingPoolStats: stakingPoolStats123,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[122],
      stakeEvents[122],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos122,
      stakingPoolStats122,
    );
    stakeInfos.push(stakeInfos123);
    console.log(
      `\nstakeInfoAfterEvent122 after: ${JSON.stringify(stakeInfos[123].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[122].poolIndex].poolId},${stakeEvents[122].signerAddress},${stakeEvents[122].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats123);
    console.log(
      `stakingPoolStatsAfterEvent122 after: ${JSON.stringify(stakingPoolStats[123].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[122].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos124,
      nextExpectStakingPoolStats: stakingPoolStats124,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[123],
      stakeEvents[123],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos123,
      stakingPoolStats123,
    );
    stakeInfos.push(stakeInfos124);
    console.log(
      `\nstakeInfoAfterEvent123 after: ${JSON.stringify(stakeInfos[124].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId},${stakeEvents[123].signerAddress},${stakeEvents[123].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats124);
    console.log(
      `stakingPoolStatsAfterEvent123 after: ${JSON.stringify(stakingPoolStats[124].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos125,
      nextExpectStakingPoolStats: stakingPoolStats125,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[124],
      stakeEvents[124],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos124,
      stakingPoolStats124,
    );
    stakeInfos.push(stakeInfos125);
    console.log(
      `\nstakeInfoAfterEvent124 after: ${JSON.stringify(stakeInfos[125].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats125);
    console.log(
      `stakingPoolStatsAfterEvent124 after: ${JSON.stringify(stakingPoolStats[125].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos126,
      nextExpectStakingPoolStats: stakingPoolStats126,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[125],
      stakeEvents[125],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos125,
      stakingPoolStats125,
    );
    stakeInfos.push(stakeInfos126);
    console.log(
      `\nstakeInfoAfterEvent125 after: ${JSON.stringify(stakeInfos[126].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats126);
    console.log(
      `stakingPoolStatsAfterEvent125 after: ${JSON.stringify(stakingPoolStats[126].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos127,
      nextExpectStakingPoolStats: stakingPoolStats127,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[126],
      stakeEvents[57],
      stakeEvents[78],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos126,
      stakingPoolStats126,
    );
    stakeInfos.push(stakeInfos127);
    console.log(
      `\nstakeInfoAfterEvent126 after: ${JSON.stringify(stakeInfos[127].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats127);
    console.log(
      `stakingPoolStatsAfterEvent126 after: ${JSON.stringify(stakingPoolStats[127].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos128,
      nextExpectStakingPoolStats: stakingPoolStats128,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[127],
      stakeEvents[67],
      stakeEvents[92],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos127,
      stakingPoolStats127,
    );
    stakeInfos.push(stakeInfos128);
    console.log(
      `\nstakeInfoAfterEvent127 after: ${JSON.stringify(stakeInfos[128].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId},${stakeEvents[67].signerAddress},${stakeEvents[67].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats128);
    console.log(
      `stakingPoolStatsAfterEvent127 after: ${JSON.stringify(stakingPoolStats[128].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos129,
      nextExpectStakingPoolStats: stakingPoolStats129,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[128],
      stakeEvents[128],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos128,
      stakingPoolStats128,
    );
    stakeInfos.push(stakeInfos129);
    console.log(
      `\nstakeInfoAfterEvent128 after: ${JSON.stringify(stakeInfos[129].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId},${stakeEvents[128].signerAddress},${stakeEvents[128].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats129);
    console.log(
      `stakingPoolStatsAfterEvent128 after: ${JSON.stringify(stakingPoolStats[129].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos130,
      nextExpectStakingPoolStats: stakingPoolStats130,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[129],
      stakeEvents[129],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos129,
      stakingPoolStats129,
    );
    stakeInfos.push(stakeInfos130);
    console.log(
      `\nstakeInfoAfterEvent129 after: ${JSON.stringify(stakeInfos[130].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId},${stakeEvents[129].signerAddress},${stakeEvents[129].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats130);
    console.log(
      `stakingPoolStatsAfterEvent129 after: ${JSON.stringify(stakingPoolStats[130].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos131,
      nextExpectStakingPoolStats: stakingPoolStats131,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[130],
      stakeEvents[130],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos130,
      stakingPoolStats130,
    );
    stakeInfos.push(stakeInfos131);
    console.log(
      `\nstakeInfoAfterEvent130 after: ${JSON.stringify(stakeInfos[131].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats131);
    console.log(
      `stakingPoolStatsAfterEvent130 after: ${JSON.stringify(stakingPoolStats[131].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos132,
      nextExpectStakingPoolStats: stakingPoolStats132,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[131],
      stakeEvents[131],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos131,
      stakingPoolStats131,
    );
    stakeInfos.push(stakeInfos132);
    console.log(
      `\nstakeInfoAfterEvent131 after: ${JSON.stringify(stakeInfos[132].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats132);
    console.log(
      `stakingPoolStatsAfterEvent131 after: ${JSON.stringify(stakingPoolStats[132].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos133,
      nextExpectStakingPoolStats: stakingPoolStats133,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[132],
      stakeEvents[132],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos132,
      stakingPoolStats132,
    );
    stakeInfos.push(stakeInfos133);
    console.log(
      `\nstakeInfoAfterEvent132 after: ${JSON.stringify(stakeInfos[133].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats133);
    console.log(
      `stakingPoolStatsAfterEvent132 after: ${JSON.stringify(stakingPoolStats[133].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos134,
      nextExpectStakingPoolStats: stakingPoolStats134,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[133],
      stakeEvents[98],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos133,
      stakingPoolStats133,
    );
    stakeInfos.push(stakeInfos134);
    console.log(
      `\nstakeInfoAfterEvent133 after: ${JSON.stringify(stakeInfos[134].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId},${stakeEvents[98].signerAddress},${stakeEvents[98].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats134);
    console.log(
      `stakingPoolStatsAfterEvent133 after: ${JSON.stringify(stakingPoolStats[134].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos135,
      nextExpectStakingPoolStats: stakingPoolStats135,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[134],
      stakeEvents[56],
      stakeEvents[80],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos134,
      stakingPoolStats134,
    );
    stakeInfos.push(stakeInfos135);
    console.log(
      `\nstakeInfoAfterEvent134 after: ${JSON.stringify(stakeInfos[135].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats135);
    console.log(
      `stakingPoolStatsAfterEvent134 after: ${JSON.stringify(stakingPoolStats[135].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos136,
      nextExpectStakingPoolStats: stakingPoolStats136,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[135],
      stakeEvents[117],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos135,
      stakingPoolStats135,
    );
    stakeInfos.push(stakeInfos136);
    console.log(
      `\nstakeInfoAfterEvent135 after: ${JSON.stringify(stakeInfos[136].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats136);
    console.log(
      `stakingPoolStatsAfterEvent135 after: ${JSON.stringify(stakingPoolStats[136].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos137,
      nextExpectStakingPoolStats: stakingPoolStats137,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[136],
      stakeEvents[124],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos136,
      stakingPoolStats136,
    );
    stakeInfos.push(stakeInfos137);
    console.log(
      `\nstakeInfoAfterEvent136 after: ${JSON.stringify(stakeInfos[137].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats137);
    console.log(
      `stakingPoolStatsAfterEvent136 after: ${JSON.stringify(stakingPoolStats[137].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos138,
      nextExpectStakingPoolStats: stakingPoolStats138,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[137],
      stakeEvents[67],
      stakeEvents[92],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos137,
      stakingPoolStats137,
    );
    stakeInfos.push(stakeInfos138);
    console.log(
      `\nstakeInfoAfterEvent137 after: ${JSON.stringify(stakeInfos[138].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId},${stakeEvents[67].signerAddress},${stakeEvents[67].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats138);
    console.log(
      `stakingPoolStatsAfterEvent137 after: ${JSON.stringify(stakingPoolStats[138].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[67].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos139,
      nextExpectStakingPoolStats: stakingPoolStats139,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[138],
      stakeEvents[98],
      stakeEvents[133],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos138,
      stakingPoolStats138,
    );
    stakeInfos.push(stakeInfos139);
    console.log(
      `\nstakeInfoAfterEvent138 after: ${JSON.stringify(stakeInfos[139].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId},${stakeEvents[98].signerAddress},${stakeEvents[98].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats139);
    console.log(
      `stakingPoolStatsAfterEvent138 after: ${JSON.stringify(stakingPoolStats[139].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos140,
      nextExpectStakingPoolStats: stakingPoolStats140,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[139],
      stakeEvents[50],
      stakeEvents[64],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos139,
      stakingPoolStats139,
    );
    stakeInfos.push(stakeInfos140);
    console.log(
      `\nstakeInfoAfterEvent139 after: ${JSON.stringify(stakeInfos[140].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats140);
    console.log(
      `stakingPoolStatsAfterEvent139 after: ${JSON.stringify(stakingPoolStats[140].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos141,
      nextExpectStakingPoolStats: stakingPoolStats141,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[140],
      stakeEvents[124],
      stakeEvents[136],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos140,
      stakingPoolStats140,
    );
    stakeInfos.push(stakeInfos141);
    console.log(
      `\nstakeInfoAfterEvent140 after: ${JSON.stringify(stakeInfos[141].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats141);
    console.log(
      `stakingPoolStatsAfterEvent140 after: ${JSON.stringify(stakingPoolStats[141].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos142,
      nextExpectStakingPoolStats: stakingPoolStats142,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[141],
      stakeEvents[98],
      stakeEvents[133],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos141,
      stakingPoolStats141,
    );
    stakeInfos.push(stakeInfos142);
    console.log(
      `\nstakeInfoAfterEvent141 after: ${JSON.stringify(stakeInfos[142].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId},${stakeEvents[98].signerAddress},${stakeEvents[98].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats142);
    console.log(
      `stakingPoolStatsAfterEvent141 after: ${JSON.stringify(stakingPoolStats[142].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos143,
      nextExpectStakingPoolStats: stakingPoolStats143,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[142],
      stakeEvents[117],
      stakeEvents[135],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos142,
      stakingPoolStats142,
    );
    stakeInfos.push(stakeInfos143);
    console.log(
      `\nstakeInfoAfterEvent142 after: ${JSON.stringify(stakeInfos[143].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats143);
    console.log(
      `stakingPoolStatsAfterEvent142 after: ${JSON.stringify(stakingPoolStats[143].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos144,
      nextExpectStakingPoolStats: stakingPoolStats144,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[143],
      stakeEvents[114],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos143,
      stakingPoolStats143,
    );
    stakeInfos.push(stakeInfos144);
    console.log(
      `\nstakeInfoAfterEvent143 after: ${JSON.stringify(stakeInfos[144].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId},${stakeEvents[114].signerAddress},${stakeEvents[114].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats144);
    console.log(
      `stakingPoolStatsAfterEvent143 after: ${JSON.stringify(stakingPoolStats[144].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos145,
      nextExpectStakingPoolStats: stakingPoolStats145,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[144],
      stakeEvents[124],
      stakeEvents[136],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos144,
      stakingPoolStats144,
    );
    stakeInfos.push(stakeInfos145);
    console.log(
      `\nstakeInfoAfterEvent144 after: ${JSON.stringify(stakeInfos[145].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats145);
    console.log(
      `stakingPoolStatsAfterEvent144 after: ${JSON.stringify(stakingPoolStats[145].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos146,
      nextExpectStakingPoolStats: stakingPoolStats146,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[145],
      stakeEvents[98],
      stakeEvents[133],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos145,
      stakingPoolStats145,
    );
    stakeInfos.push(stakeInfos146);
    console.log(
      `\nstakeInfoAfterEvent145 after: ${JSON.stringify(stakeInfos[146].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId},${stakeEvents[98].signerAddress},${stakeEvents[98].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats146);
    console.log(
      `stakingPoolStatsAfterEvent145 after: ${JSON.stringify(stakingPoolStats[146].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[98].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos147,
      nextExpectStakingPoolStats: stakingPoolStats147,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[146],
      stakeEvents[123],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos146,
      stakingPoolStats146,
    );
    stakeInfos.push(stakeInfos147);
    console.log(
      `\nstakeInfoAfterEvent146 after: ${JSON.stringify(stakeInfos[147].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId},${stakeEvents[123].signerAddress},${stakeEvents[123].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats147);
    console.log(
      `stakingPoolStatsAfterEvent146 after: ${JSON.stringify(stakingPoolStats[147].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos148,
      nextExpectStakingPoolStats: stakingPoolStats148,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[147],
      stakeEvents[117],
      stakeEvents[135],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos147,
      stakingPoolStats147,
    );
    stakeInfos.push(stakeInfos148);
    console.log(
      `\nstakeInfoAfterEvent147 after: ${JSON.stringify(stakeInfos[148].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats148);
    console.log(
      `stakingPoolStatsAfterEvent147 after: ${JSON.stringify(stakingPoolStats[148].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos149,
      nextExpectStakingPoolStats: stakingPoolStats149,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[148],
      stakeEvents[114],
      stakeEvents[143],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos148,
      stakingPoolStats148,
    );
    stakeInfos.push(stakeInfos149);
    console.log(
      `\nstakeInfoAfterEvent148 after: ${JSON.stringify(stakeInfos[149].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId},${stakeEvents[114].signerAddress},${stakeEvents[114].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats149);
    console.log(
      `stakingPoolStatsAfterEvent148 after: ${JSON.stringify(stakingPoolStats[149].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos150,
      nextExpectStakingPoolStats: stakingPoolStats150,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[149],
      stakeEvents[119],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos149,
      stakingPoolStats149,
    );
    stakeInfos.push(stakeInfos150);
    console.log(
      `\nstakeInfoAfterEvent149 after: ${JSON.stringify(stakeInfos[150].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats150);
    console.log(
      `stakingPoolStatsAfterEvent149 after: ${JSON.stringify(stakingPoolStats[150].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos151,
      nextExpectStakingPoolStats: stakingPoolStats151,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[150],
      stakeEvents[123],
      stakeEvents[146],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos150,
      stakingPoolStats150,
    );
    stakeInfos.push(stakeInfos151);
    console.log(
      `\nstakeInfoAfterEvent150 after: ${JSON.stringify(stakeInfos[151].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId},${stakeEvents[123].signerAddress},${stakeEvents[123].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats151);
    console.log(
      `stakingPoolStatsAfterEvent150 after: ${JSON.stringify(stakingPoolStats[151].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[123].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos152,
      nextExpectStakingPoolStats: stakingPoolStats152,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[151],
      stakeEvents[116],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos151,
      stakingPoolStats151,
    );
    stakeInfos.push(stakeInfos152);
    console.log(
      `\nstakeInfoAfterEvent151 after: ${JSON.stringify(stakeInfos[152].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats152);
    console.log(
      `stakingPoolStatsAfterEvent151 after: ${JSON.stringify(stakingPoolStats[152].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos153,
      nextExpectStakingPoolStats: stakingPoolStats153,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[152],
      stakeEvents[124],
      stakeEvents[136],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos152,
      stakingPoolStats152,
    );
    stakeInfos.push(stakeInfos153);
    console.log(
      `\nstakeInfoAfterEvent152 after: ${JSON.stringify(stakeInfos[153].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats153);
    console.log(
      `stakingPoolStatsAfterEvent152 after: ${JSON.stringify(stakingPoolStats[153].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos154,
      nextExpectStakingPoolStats: stakingPoolStats154,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[153],
      stakeEvents[128],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos153,
      stakingPoolStats153,
    );
    stakeInfos.push(stakeInfos154);
    console.log(
      `\nstakeInfoAfterEvent153 after: ${JSON.stringify(stakeInfos[154].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId},${stakeEvents[128].signerAddress},${stakeEvents[128].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats154);
    console.log(
      `stakingPoolStatsAfterEvent153 after: ${JSON.stringify(stakingPoolStats[154].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos155,
      nextExpectStakingPoolStats: stakingPoolStats155,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[154],
      stakeEvents[130],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos154,
      stakingPoolStats154,
    );
    stakeInfos.push(stakeInfos155);
    console.log(
      `\nstakeInfoAfterEvent154 after: ${JSON.stringify(stakeInfos[155].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats155);
    console.log(
      `stakingPoolStatsAfterEvent154 after: ${JSON.stringify(stakingPoolStats[155].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos156,
      nextExpectStakingPoolStats: stakingPoolStats156,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[155],
      stakeEvents[116],
      stakeEvents[151],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos155,
      stakingPoolStats155,
    );
    stakeInfos.push(stakeInfos156);
    console.log(
      `\nstakeInfoAfterEvent155 after: ${JSON.stringify(stakeInfos[156].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats156);
    console.log(
      `stakingPoolStatsAfterEvent155 after: ${JSON.stringify(stakingPoolStats[156].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos157,
      nextExpectStakingPoolStats: stakingPoolStats157,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[156],
      stakeEvents[114],
      stakeEvents[143],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos156,
      stakingPoolStats156,
    );
    stakeInfos.push(stakeInfos157);
    console.log(
      `\nstakeInfoAfterEvent156 after: ${JSON.stringify(stakeInfos[157].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId},${stakeEvents[114].signerAddress},${stakeEvents[114].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats157);
    console.log(
      `stakingPoolStatsAfterEvent156 after: ${JSON.stringify(stakingPoolStats[157].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos158,
      nextExpectStakingPoolStats: stakingPoolStats158,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[157],
      stakeEvents[119],
      stakeEvents[149],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos157,
      stakingPoolStats157,
    );
    stakeInfos.push(stakeInfos158);
    console.log(
      `\nstakeInfoAfterEvent157 after: ${JSON.stringify(stakeInfos[158].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats158);
    console.log(
      `stakingPoolStatsAfterEvent157 after: ${JSON.stringify(stakingPoolStats[158].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[114].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos159,
      nextExpectStakingPoolStats: stakingPoolStats159,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[158],
      stakeEvents[130],
      stakeEvents[154],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos158,
      stakingPoolStats158,
    );
    stakeInfos.push(stakeInfos159);
    console.log(
      `\nstakeInfoAfterEvent158 after: ${JSON.stringify(stakeInfos[159].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats159);
    console.log(
      `stakingPoolStatsAfterEvent158 after: ${JSON.stringify(stakingPoolStats[159].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos160,
      nextExpectStakingPoolStats: stakingPoolStats160,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[159],
      stakeEvents[128],
      stakeEvents[153],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos159,
      stakingPoolStats159,
    );
    stakeInfos.push(stakeInfos160);
    console.log(
      `\nstakeInfoAfterEvent159 after: ${JSON.stringify(stakeInfos[160].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId},${stakeEvents[128].signerAddress},${stakeEvents[128].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats160);
    console.log(
      `stakingPoolStatsAfterEvent159 after: ${JSON.stringify(stakingPoolStats[160].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[128].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos161,
      nextExpectStakingPoolStats: stakingPoolStats161,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[160],
      stakeEvents[130],
      stakeEvents[154],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos160,
      stakingPoolStats160,
    );
    stakeInfos.push(stakeInfos161);
    console.log(
      `\nstakeInfoAfterEvent160 after: ${JSON.stringify(stakeInfos[161].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats161);
    console.log(
      `stakingPoolStatsAfterEvent160 after: ${JSON.stringify(stakingPoolStats[161].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos162,
      nextExpectStakingPoolStats: stakingPoolStats162,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[161],
      stakeEvents[125],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos161,
      stakingPoolStats161,
    );
    stakeInfos.push(stakeInfos162);
    console.log(
      `\nstakeInfoAfterEvent161 after: ${JSON.stringify(stakeInfos[162].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats162);
    console.log(
      `stakingPoolStatsAfterEvent161 after: ${JSON.stringify(stakingPoolStats[162].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos163,
      nextExpectStakingPoolStats: stakingPoolStats163,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[162],
      stakeEvents[125],
      stakeEvents[161],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos162,
      stakingPoolStats162,
    );
    stakeInfos.push(stakeInfos163);
    console.log(
      `\nstakeInfoAfterEvent162 after: ${JSON.stringify(stakeInfos[163].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats163);
    console.log(
      `stakingPoolStatsAfterEvent162 after: ${JSON.stringify(stakingPoolStats[163].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos164,
      nextExpectStakingPoolStats: stakingPoolStats164,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[163],
      stakeEvents[132],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos163,
      stakingPoolStats163,
    );
    stakeInfos.push(stakeInfos164);
    console.log(
      `\nstakeInfoAfterEvent163 after: ${JSON.stringify(stakeInfos[164].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats164);
    console.log(
      `stakingPoolStatsAfterEvent163 after: ${JSON.stringify(stakingPoolStats[164].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos165,
      nextExpectStakingPoolStats: stakingPoolStats165,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[164],
      stakeEvents[125],
      stakeEvents[161],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos164,
      stakingPoolStats164,
    );
    stakeInfos.push(stakeInfos165);
    console.log(
      `\nstakeInfoAfterEvent164 after: ${JSON.stringify(stakeInfos[165].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats165);
    console.log(
      `stakingPoolStatsAfterEvent164 after: ${JSON.stringify(stakingPoolStats[165].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos166,
      nextExpectStakingPoolStats: stakingPoolStats166,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[165],
      stakeEvents[132],
      stakeEvents[163],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos165,
      stakingPoolStats165,
    );
    stakeInfos.push(stakeInfos166);
    console.log(
      `\nstakeInfoAfterEvent165 after: ${JSON.stringify(stakeInfos[166].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats166);
    console.log(
      `stakingPoolStatsAfterEvent165 after: ${JSON.stringify(stakingPoolStats[166].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos167,
      nextExpectStakingPoolStats: stakingPoolStats167,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[166],
      stakeEvents[36],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos166,
      stakingPoolStats166,
    );
    stakeInfos.push(stakeInfos167);
    console.log(
      `\nstakeInfoAfterEvent166 after: ${JSON.stringify(stakeInfos[167].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId},${stakeEvents[36].signerAddress},${stakeEvents[36].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats167);
    console.log(
      `stakingPoolStatsAfterEvent166 after: ${JSON.stringify(stakingPoolStats[167].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos168,
      nextExpectStakingPoolStats: stakingPoolStats168,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[167],
      stakeEvents[167],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos167,
      stakingPoolStats167,
    );
    stakeInfos.push(stakeInfos168);
    console.log(
      `\nstakeInfoAfterEvent167 after: ${JSON.stringify(stakeInfos[168].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[167].poolIndex].poolId},${stakeEvents[167].signerAddress},${stakeEvents[167].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats168);
    console.log(
      `stakingPoolStatsAfterEvent167 after: ${JSON.stringify(stakingPoolStats[168].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[167].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos169,
      nextExpectStakingPoolStats: stakingPoolStats169,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[168],
      stakeEvents[52],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos168,
      stakingPoolStats168,
    );
    stakeInfos.push(stakeInfos169);
    console.log(
      `\nstakeInfoAfterEvent168 after: ${JSON.stringify(stakeInfos[169].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats169);
    console.log(
      `stakingPoolStatsAfterEvent168 after: ${JSON.stringify(stakingPoolStats[169].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos170,
      nextExpectStakingPoolStats: stakingPoolStats170,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[169],
      stakeEvents[169],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos169,
      stakingPoolStats169,
    );
    stakeInfos.push(stakeInfos170);
    console.log(
      `\nstakeInfoAfterEvent169 after: ${JSON.stringify(stakeInfos[170].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[169].poolIndex].poolId},${stakeEvents[169].signerAddress},${stakeEvents[169].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats170);
    console.log(
      `stakingPoolStatsAfterEvent169 after: ${JSON.stringify(stakingPoolStats[170].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[169].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos171,
      nextExpectStakingPoolStats: stakingPoolStats171,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[170],
      stakeEvents[55],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos170,
      stakingPoolStats170,
    );
    stakeInfos.push(stakeInfos171);
    console.log(
      `\nstakeInfoAfterEvent170 after: ${JSON.stringify(stakeInfos[171].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats171);
    console.log(
      `stakingPoolStatsAfterEvent170 after: ${JSON.stringify(stakingPoolStats[171].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos172,
      nextExpectStakingPoolStats: stakingPoolStats172,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[171],
      stakeEvents[74],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos171,
      stakingPoolStats171,
    );
    stakeInfos.push(stakeInfos172);
    console.log(
      `\nstakeInfoAfterEvent171 after: ${JSON.stringify(stakeInfos[172].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats172);
    console.log(
      `stakingPoolStatsAfterEvent171 after: ${JSON.stringify(stakingPoolStats[172].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos173,
      nextExpectStakingPoolStats: stakingPoolStats173,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[172],
      stakeEvents[36],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos172,
      stakingPoolStats172,
    );
    stakeInfos.push(stakeInfos173);
    console.log(
      `\nstakeInfoAfterEvent172 after: ${JSON.stringify(stakeInfos[173].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId},${stakeEvents[36].signerAddress},${stakeEvents[36].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats173);
    console.log(
      `stakingPoolStatsAfterEvent172 after: ${JSON.stringify(stakingPoolStats[173].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos174,
      nextExpectStakingPoolStats: stakingPoolStats174,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[173],
      stakeEvents[169],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos173,
      stakingPoolStats173,
    );
    stakeInfos.push(stakeInfos174);
    console.log(
      `\nstakeInfoAfterEvent173 after: ${JSON.stringify(stakeInfos[174].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[169].poolIndex].poolId},${stakeEvents[169].signerAddress},${stakeEvents[169].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats174);
    console.log(
      `stakingPoolStatsAfterEvent173 after: ${JSON.stringify(stakingPoolStats[174].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[169].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos175,
      nextExpectStakingPoolStats: stakingPoolStats175,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[174],
      stakeEvents[77],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos174,
      stakingPoolStats174,
    );
    stakeInfos.push(stakeInfos175);
    console.log(
      `\nstakeInfoAfterEvent174 after: ${JSON.stringify(stakeInfos[175].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats175);
    console.log(
      `stakingPoolStatsAfterEvent174 after: ${JSON.stringify(stakingPoolStats[175].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos176,
      nextExpectStakingPoolStats: stakingPoolStats176,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[175],
      stakeEvents[101],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos175,
      stakingPoolStats175,
    );
    stakeInfos.push(stakeInfos176);
    console.log(
      `\nstakeInfoAfterEvent175 after: ${JSON.stringify(stakeInfos[176].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[101].poolIndex].poolId},${stakeEvents[101].signerAddress},${stakeEvents[101].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats176);
    console.log(
      `stakingPoolStatsAfterEvent175 after: ${JSON.stringify(stakingPoolStats[176].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[101].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos177,
      nextExpectStakingPoolStats: stakingPoolStats177,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[176],
      stakeEvents[55],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos176,
      stakingPoolStats176,
    );
    stakeInfos.push(stakeInfos177);
    console.log(
      `\nstakeInfoAfterEvent176 after: ${JSON.stringify(stakeInfos[177].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats177);
    console.log(
      `stakingPoolStatsAfterEvent176 after: ${JSON.stringify(stakingPoolStats[177].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos178,
      nextExpectStakingPoolStats: stakingPoolStats178,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[177],
      stakeEvents[36],
      stakeEvents[172],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos177,
      stakingPoolStats177,
    );
    stakeInfos.push(stakeInfos178);
    console.log(
      `\nstakeInfoAfterEvent177 after: ${JSON.stringify(stakeInfos[178].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId},${stakeEvents[36].signerAddress},${stakeEvents[36].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats178);
    console.log(
      `stakingPoolStatsAfterEvent177 after: ${JSON.stringify(stakingPoolStats[178].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[36].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos179,
      nextExpectStakingPoolStats: stakingPoolStats179,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[178],
      stakeEvents[52],
      stakeEvents[168],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos178,
      stakingPoolStats178,
    );
    stakeInfos.push(stakeInfos179);
    console.log(
      `\nstakeInfoAfterEvent178 after: ${JSON.stringify(stakeInfos[179].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats179);
    console.log(
      `stakingPoolStatsAfterEvent178 after: ${JSON.stringify(stakingPoolStats[179].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos180,
      nextExpectStakingPoolStats: stakingPoolStats180,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[179],
      stakeEvents[74],
      stakeEvents[171],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos179,
      stakingPoolStats179,
    );
    stakeInfos.push(stakeInfos180);
    console.log(
      `\nstakeInfoAfterEvent179 after: ${JSON.stringify(stakeInfos[180].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats180);
    console.log(
      `stakingPoolStatsAfterEvent179 after: ${JSON.stringify(stakingPoolStats[180].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos181,
      nextExpectStakingPoolStats: stakingPoolStats181,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[180],
      stakeEvents[52],
      stakeEvents[168],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos180,
      stakingPoolStats180,
    );
    stakeInfos.push(stakeInfos181);
    console.log(
      `\nstakeInfoAfterEvent180 after: ${JSON.stringify(stakeInfos[181].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats181);
    console.log(
      `stakingPoolStatsAfterEvent180 after: ${JSON.stringify(stakingPoolStats[181].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos182,
      nextExpectStakingPoolStats: stakingPoolStats182,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[181],
      stakeEvents[74],
      stakeEvents[171],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos181,
      stakingPoolStats181,
    );
    stakeInfos.push(stakeInfos182);
    console.log(
      `\nstakeInfoAfterEvent181 after: ${JSON.stringify(stakeInfos[182].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats182);
    console.log(
      `stakingPoolStatsAfterEvent181 after: ${JSON.stringify(stakingPoolStats[182].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos183,
      nextExpectStakingPoolStats: stakingPoolStats183,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[182],
      stakeEvents[52],
      stakeEvents[168],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos182,
      stakingPoolStats182,
    );
    stakeInfos.push(stakeInfos183);
    console.log(
      `\nstakeInfoAfterEvent182 after: ${JSON.stringify(stakeInfos[183].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats183);
    console.log(
      `stakingPoolStatsAfterEvent182 after: ${JSON.stringify(stakingPoolStats[183].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos184,
      nextExpectStakingPoolStats: stakingPoolStats184,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[183],
      stakeEvents[115],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos183,
      stakingPoolStats183,
    );
    stakeInfos.push(stakeInfos184);
    console.log(
      `\nstakeInfoAfterEvent183 after: ${JSON.stringify(stakeInfos[184].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[115].poolIndex].poolId},${stakeEvents[115].signerAddress},${stakeEvents[115].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats184);
    console.log(
      `stakingPoolStatsAfterEvent183 after: ${JSON.stringify(stakingPoolStats[184].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[115].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos185,
      nextExpectStakingPoolStats: stakingPoolStats185,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[184],
      stakeEvents[122],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos184,
      stakingPoolStats184,
    );
    stakeInfos.push(stakeInfos185);
    console.log(
      `\nstakeInfoAfterEvent184 after: ${JSON.stringify(stakeInfos[185].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[122].poolIndex].poolId},${stakeEvents[122].signerAddress},${stakeEvents[122].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats185);
    console.log(
      `stakingPoolStatsAfterEvent184 after: ${JSON.stringify(stakingPoolStats[185].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[122].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos186,
      nextExpectStakingPoolStats: stakingPoolStats186,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[185],
      stakeEvents[118],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos185,
      stakingPoolStats185,
    );
    stakeInfos.push(stakeInfos186);
    console.log(
      `\nstakeInfoAfterEvent185 after: ${JSON.stringify(stakeInfos[186].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats186);
    console.log(
      `stakingPoolStatsAfterEvent185 after: ${JSON.stringify(stakingPoolStats[186].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos187,
      nextExpectStakingPoolStats: stakingPoolStats187,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[186],
      stakeEvents[118],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos186,
      stakingPoolStats186,
    );
    stakeInfos.push(stakeInfos187);
    console.log(
      `\nstakeInfoAfterEvent186 after: ${JSON.stringify(stakeInfos[187].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats187);
    console.log(
      `stakingPoolStatsAfterEvent186 after: ${JSON.stringify(stakingPoolStats[187].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos188,
      nextExpectStakingPoolStats: stakingPoolStats188,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[187],
      stakeEvents[129],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos187,
      stakingPoolStats187,
    );
    stakeInfos.push(stakeInfos188);
    console.log(
      `\nstakeInfoAfterEvent187 after: ${JSON.stringify(stakeInfos[188].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId},${stakeEvents[129].signerAddress},${stakeEvents[129].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats188);
    console.log(
      `stakingPoolStatsAfterEvent187 after: ${JSON.stringify(stakingPoolStats[188].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos189,
      nextExpectStakingPoolStats: stakingPoolStats189,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[188],
      stakeEvents[131],
      null,
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos188,
      stakingPoolStats188,
    );
    stakeInfos.push(stakeInfos189);
    console.log(
      `\nstakeInfoAfterEvent188 after: ${JSON.stringify(stakeInfos[189].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats189);
    console.log(
      `stakingPoolStatsAfterEvent188 after: ${JSON.stringify(stakingPoolStats[189].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos190,
      nextExpectStakingPoolStats: stakingPoolStats190,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[189],
      stakeEvents[129],
      stakeEvents[187],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos189,
      stakingPoolStats189,
    );
    stakeInfos.push(stakeInfos190);
    console.log(
      `\nstakeInfoAfterEvent189 after: ${JSON.stringify(stakeInfos[190].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId},${stakeEvents[129].signerAddress},${stakeEvents[129].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats190);
    console.log(
      `stakingPoolStatsAfterEvent189 after: ${JSON.stringify(stakingPoolStats[190].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[129].poolIndex].poolId}`))}`,
    );

    const {
      nextExpectStakeInfos: stakeInfos191,
      nextExpectStakingPoolStats: stakingPoolStats191,
    } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
      stakeEvents[190],
      stakeEvents[131],
      stakeEvents[188],
      stakingPoolStakeRewardTokenSameConfigs,
      stakeInfos190,
      stakingPoolStats190,
    );
    stakeInfos.push(stakeInfos191);
    console.log(
      `\nstakeInfoAfterEvent190 after: ${JSON.stringify(stakeInfos[191].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`))}`,
    );
    stakingPoolStats.push(stakingPoolStats191);
    console.log(
      `stakingPoolStatsAfterEvent190 after: ${JSON.stringify(stakingPoolStats[191].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId}`))}`,
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

    const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

    const stakePoolStatsIterator =
      stakingPoolStats[stakingPoolStats.length - 1].entries();
    let i = 0;
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

      const stakeInfos000 = new Map();
      const stakingPoolStats000 = new Map();

      const stakingPoolStat = structuredClone(
        stakeServiceHelpers.initialStakingPoolStat,
      );
      if (stakingPoolConfig.poolAprWei.eq(hre.ethers.constants.Zero)) {
        stakingPoolStat.poolSizeWei = stakeServiceHelpers
          .computePoolSizeWei(
            stakingPoolConfig.stakeDurationDays,
            stakingPoolConfig.poolAprWei,
            hre.ethers.constants.Zero,
            stakingPoolConfig.stakeTokenDecimals,
          )
          .toString();
      }
      stakingPoolStats000.set(`${stakingPoolConfig.poolId}`, stakingPoolStat);

      const contractAdminRoleSigner = contractAdminRoleAccounts[0];
      const stakeEvents000 = [];
      stakeEvents000.push({
        eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(
          120 * ++i,
        ),
        eventType: "AddReward",
        poolIndex: 0,
        signer: contractAdminRoleSigner,
        signerAddress: await contractAdminRoleSigner.getAddress(),
        rewardAmountWei: totalRewardToBeDistributedWei.gt(
          hre.ethers.constants.Zero,
        )
          ? totalRewardToBeDistributedWei.sub(totalStakeRewardLessByWei)
          : totalRewardToBeDistributedWei,
        hasPermission: true,
      });

      const {
        nextExpectStakeInfos: stakeInfos001,
        nextExpectStakingPoolStats: stakingPoolStats001,
      } = await stakeServiceHelpers.testAddStakingPoolReward(
        stakingServiceInstance,
        [stakingPoolConfig],
        startblockTimestamp,
        stakeEvents000,
        stakeInfos000,
        stakingPoolStats000,
        stakingPoolsRewardBalanceOf,
      );

      for (let j = 0; j < stakingPoolStats.length; j++) {
        const poolIdStakingStats = stakingPoolStats[j].get(`${poolId}`);
        poolIdStakingStats.totalRewardAddedWei =
          totalRewardToBeDistributedWei.gt(hre.ethers.constants.Zero)
            ? totalRewardToBeDistributedWei
                .sub(totalStakeRewardLessByWei)
                .toString()
            : totalRewardToBeDistributedWei.toString();

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
      contractAdminRoleAccounts[1],
      stakeEvents,
      stakeInfos,
      stakingPoolStats,
    );
  });
});
