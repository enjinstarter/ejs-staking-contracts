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

          /*
          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );
          */

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

          /*
          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );
          */

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

          /*
          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );
          */

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

          /*
          console.log(
            `${i}: poolIndex=${poolIndex}, signerIndex=${signerIndex}`,
          );
          */

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
        ).to.be.revertedWith("SSvcs2: 0 reward");
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

      it("Should not allow add staking pool reward for staking pool with 0% APR", async () => {
        const rewardAmountWei = hre.ethers.utils.parseEther("6917.15942393");

        await expect(
          stakingServiceInstance.addStakingPoolReward(
            stakingPoolStakeRewardTokenSameConfigs[0].poolId,
            rewardAmountWei,
          ),
        ).to.be.revertedWith("SSvcs2: 0 apr");
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
          stakingServiceInstance.getUnstakingInfo(
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
          stakingServiceInstance.getUnstakingInfo(
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
          stakingServiceInstance.getUnstakingInfo(
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
            .getUnstakingInfo(
              stakingPoolConfig.poolId,
              enduserAddress,
              stakeId,
            ),
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
            .getUnstakingInfo(
              stakingPoolConfig.poolId,
              enduserAddress,
              stakeId,
            ),
        ).to.be.revertedWith("SSvcs2: unstaked");
      });

      it("should not allow get unstake info for estimated unstake reward more than maturity reward", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const enduserAddress = await enduserAccount.getAddress();
        const poolIndex = 4;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9599.378692908225033340",
        );
        const stakeUuid = "142bc4db-2401-4a6b-a20c-d36860cfe4e9";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.GOVERNANCE_ROLE,
          governanceRoleAccounts.slice(1),
          governanceRoleAccounts[0],
          true,
        );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.CONTRACT_ADMIN_ROLE,
          contractAdminRoleAccounts,
          governanceRoleAccounts[0],
          true,
        );

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          testServiceInstance,
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
          testServiceInstance
            .connect(enduserAccount)
            .getUnstakingInfo(
              stakingPoolConfig.poolId,
              enduserAddress,
              stakeId,
            ),
        ).to.be.revertedWith("SSvcs2: reward > maturity reward");
      });
    });

    describe("Get Estimated Reward At Unstaking", function () {
      it("should return zero estimated reward at unstaking for revoked stake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 5;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "2986.819302728517067649",
        );
        const stakeUuid = "eaf39fb5-8546-450e-8faf-c92cbc262ced";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.GOVERNANCE_ROLE,
          governanceRoleAccounts.slice(1),
          governanceRoleAccounts[0],
          true,
        );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.CONTRACT_ADMIN_ROLE,
          contractAdminRoleAccounts,
          governanceRoleAccounts[0],
          true,
        );

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestRevokeStakeEnvironment(
          testServiceInstance,
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

        const unstakingTimestamp = await testHelpers.getCurrentBlockTimestamp();

        const estimatedRewardAtUnstakingWei = await testServiceInstance
          .connect(enduserAccount)
          .getEstimatedRewardAtUnstakingWei(
            stakingPoolConfig.poolId,
            stakeId,
            unstakingTimestamp,
          );

        expect(estimatedRewardAtUnstakingWei).to.equal(
          hre.ethers.constants.Zero,
        );
      });

      it("should return correct estimated reward at unstake for unstake after maturity", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 5;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "5066.575893807808439351",
        );
        const stakeUuid = "2c5fd824-e60b-495a-b8a1-5b3e95b81972";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.GOVERNANCE_ROLE,
          governanceRoleAccounts.slice(1),
          governanceRoleAccounts[0],
          true,
        );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.CONTRACT_ADMIN_ROLE,
          contractAdminRoleAccounts,
          governanceRoleAccounts[0],
          true,
        );

        const addRewardSecondsAfterStartblockTimestamp = 120;
        const stakeSecondsAfterStartblockTimestamp = 240;

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        const expectStakeTimestamp = hre.ethers.BigNumber.from(
          startblockTimestamp,
        ).add(stakeSecondsAfterStartblockTimestamp);

        const expectStakeMaturityTimestamp =
          stakeServiceHelpers.calculateStateMaturityTimestamp(
            stakingPoolConfig.stakeDurationDays,
            expectStakeTimestamp,
          );

        const expectEstimateRewardAtMaturityWei =
          stakeServiceHelpers.computeTruncatedAmountWei(
            stakeServiceHelpers.estimateRewardAtMaturityWei(
              stakingPoolConfig.poolAprWei,
              stakingPoolConfig.stakeDurationDays,
              stakeAmountWei,
            ),
            stakingPoolConfig.rewardTokenDecimals,
          );

        const expectUnstakeTimestamp = expectStakeMaturityTimestamp.add(300);
        const unstakeSecondsAfterStartblockTimestamp =
          expectUnstakeTimestamp.sub(startblockTimestamp);

        await stakeServiceHelpers.setupTestUnstakeEnvironment(
          testServiceInstance,
          stakingPoolStakeRewardTokenSameConfigs,
          startblockTimestamp,
          contractAdminAccount,
          enduserAccount,
          poolIndex,
          stakeAmountWei,
          stakeUuid,
          addRewardSecondsAfterStartblockTimestamp,
          stakeSecondsAfterStartblockTimestamp,
          unstakeSecondsAfterStartblockTimestamp,
          bankAccount,
          stakingPoolsRewardBalanceOf,
        );

        const afterUnstakeTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        const expectUnstakedRewardBeforeMatureWei =
          stakeServiceHelpers.calculateUnstakedRewardBeforeMatureWei(
            expectEstimateRewardAtMaturityWei,
            expectStakeTimestamp,
            expectStakeMaturityTimestamp,
            afterUnstakeTimestamp,
            expectUnstakeTimestamp,
          );

        const estimatedRewardAtUnstakingWei = await testServiceInstance
          .connect(enduserAccount)
          .getEstimatedRewardAtUnstakingWei(
            stakingPoolConfig.poolId,
            stakeId,
            expectUnstakeTimestamp,
          );

        expect(estimatedRewardAtUnstakingWei).to.equal(
          expectUnstakedRewardBeforeMatureWei,
        );
      });

      it("should not allow get estimated reward at unstake for effective timestamp after maturity", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 5;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "3224.787426083092191172",
        );
        const stakeUuid = "620a7628-70f8-4522-8250-09816e9f6441";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.GOVERNANCE_ROLE,
          governanceRoleAccounts.slice(1),
          governanceRoleAccounts[0],
          true,
        );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.CONTRACT_ADMIN_ROLE,
          contractAdminRoleAccounts,
          governanceRoleAccounts[0],
          true,
        );

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          testServiceInstance,
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
          testServiceInstance
            .connect(enduserAccount)
            .getEstimatedRewardAtUnstakingWei(
              stakingPoolConfig.poolId,
              stakeId,
              hre.ethers.BigNumber.from(startblockTimestamp).sub(
                hre.ethers.constants.One,
              ),
            ),
        ).to.be.revertedWith("SSvcs2: unstake before stake");
      });
    });

    describe("Get Unstaked Reward Before Mature", function () {
      it("should not allow get unstaked reward before mature if estimated reward at unstake is more than at maturity", async () => {
        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await expect(
          testServiceInstance.getUnstakedRewardBeforeMatureWei(
            hre.ethers.constants.One,
            hre.ethers.constants.Two,
          ),
        ).to.be.revertedWith("SSvcs2: claimable > mature");
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
        const stakingPoolConfig = stakingPoolStakeRewardTokenSameConfigs[2];
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

      it("should not allow invalid stake maturity timestamp", async () => {
        const stakeId = hre.ethers.utils.id(
          "e08b17b5-7df2-4cb0-9cc6-aebe34dfe59f",
        );
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "0.000000000000000001",
        );

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await expect(
          testServiceInstance.stake(
            stakingPoolStakeRewardTokenSameConfigs[2].poolId,
            stakeId,
            stakeAmountWei,
          ),
        ).to.be.revertedWith("SSvcs2: maturity timestamp");
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

      it("should not allow invalid unstake cooldown expiry timestamp", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 3;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "9710.926728739897698939",
        );
        const stakeUuid = "1cf28c21-9360-4dcd-a9d3-20c415d75ec9";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.GOVERNANCE_ROLE,
          governanceRoleAccounts.slice(1),
          governanceRoleAccounts[0],
          true,
        );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.CONTRACT_ADMIN_ROLE,
          contractAdminRoleAccounts,
          governanceRoleAccounts[0],
          true,
        );

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          testServiceInstance,
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
          testServiceInstance
            .connect(enduserAccount)
            .unstake(stakingPoolConfig.poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: cooldown timestamp");
      });

      it("should not allow zero unstake", async () => {
        const bankAccount = governanceRoleAccounts[0];
        const contractAdminAccount = contractAdminRoleAccounts[1];
        const enduserAccount = enduserAccounts[1];
        const poolIndex = 4;
        const stakeAmountWei = hre.ethers.utils.parseEther(
          "7044.421500482479764155",
        );
        const stakeUuid = "491fbb37-cd20-4edd-90e8-a4dc5c590c43";
        const stakeId = hre.ethers.utils.id(stakeUuid);

        const stakingPoolConfig =
          stakingPoolStakeRewardTokenSameConfigs[poolIndex];

        const testServiceInstance =
          await stakeServiceHelpers.newMockStakingService(
            stakingPoolInstance.address,
          );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.GOVERNANCE_ROLE,
          governanceRoleAccounts.slice(1),
          governanceRoleAccounts[0],
          true,
        );

        await testHelpers.grantRole(
          testServiceInstance,
          testHelpers.CONTRACT_ADMIN_ROLE,
          contractAdminRoleAccounts,
          governanceRoleAccounts[0],
          true,
        );

        const startblockTimestamp =
          await testHelpers.getCurrentBlockTimestamp();

        await stakeServiceHelpers.setupTestStakeEnvironment(
          testServiceInstance,
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
          testServiceInstance
            .connect(enduserAccount)
            .unstake(stakingPoolConfig.poolId, stakeId),
        ).to.be.revertedWith("SSvcs2: zero unstake");
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

      it("should not allow withdraw unstake during early unstake cooldown", async () => {
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
});
