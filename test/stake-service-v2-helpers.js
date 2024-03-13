const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");

async function addStakingPoolRewardWithVerify(
  stakingServiceContractInstance,
  stakeTokenContractInstance,
  rewardTokenContractInstance,
  fromWalletSigner,
  poolId,
  stakeDurationDays,
  poolAprWei,
  stakingPoolRewardBalanceOf,
  stakingPoolRewardStats,
  rewardAmountWei,
  expectAbleToAddReward,
) {
  const stakeTokenDecimals = await stakeTokenContractInstance.decimals();
  const rewardTokenDecimals = await rewardTokenContractInstance.decimals();
  const signerAddress = await fromWalletSigner.getAddress();

  if (!(poolId in stakingPoolRewardStats)) {
    stakingPoolRewardStats[poolId] = {
      isOpen: true,
      isActive: true,
      poolSizeWei: poolAprWei.gt(hre.ethers.constants.Zero)
        ? hre.ethers.constants.Zero
        : computeTruncatedAmountWei(
            hre.ethers.constants.MaxUint256,
            stakeTokenDecimals,
          ),
      rewardToBeDistributedWei: hre.ethers.constants.Zero,
      totalRevokedRewardWei: hre.ethers.constants.Zero,
      totalRevokedStakeWei: hre.ethers.constants.Zero,
      totalRevokedStakeRemovedWei: hre.ethers.constants.Zero,
      totalRewardAddedWei: hre.ethers.constants.Zero,
      totalRewardClaimedWei: hre.ethers.constants.Zero,
      totalRewardRemovedWei: hre.ethers.constants.Zero,
      totalStakedWei: hre.ethers.constants.Zero,
      totalUnstakedAfterMatureWei: hre.ethers.constants.Zero,
      totalUnstakedBeforeMatureWei: hre.ethers.constants.Zero,
      totalUnstakePenaltyAmountWei: hre.ethers.constants.Zero,
    };
  }

  const expectBalanceOfBeforeAdd = stakingPoolRewardBalanceOf;

  const balanceOfBeforeAdd = await rewardTokenContractInstance.balanceOf(
    stakingServiceContractInstance.address,
  );

  expect(balanceOfBeforeAdd).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectBalanceOfBeforeAdd,
      rewardTokenDecimals,
    ),
  );

  const stakingPoolStatsBeforeAdd =
    await stakingServiceContractInstance.getStakingPoolStats(poolId);

  expect(stakingPoolStatsBeforeAdd.isOpen).to.equal(
    stakingPoolRewardStats[poolId].isOpen,
  );
  expect(stakingPoolStatsBeforeAdd.isActive).to.equal(
    stakingPoolRewardStats[poolId].isActive,
  );
  expect(stakingPoolStatsBeforeAdd.poolSizeWei).to.equal(
    stakingPoolRewardStats[poolId].poolSizeWei,
  );
  expect(stakingPoolStatsBeforeAdd.rewardToBeDistributedWei).to.equal(
    stakingPoolRewardStats[poolId].rewardToBeDistributedWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalRevokedRewardWei).to.equal(
    stakingPoolRewardStats[poolId].totalRevokedRewardWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalRevokedStakeWei).to.equal(
    stakingPoolRewardStats[poolId].totalRevokedStakeWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalRevokedStakeRemovedWei).to.equal(
    stakingPoolRewardStats[poolId].totalRevokedStakeRemovedWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalRewardAddedWei).to.equal(
    stakingPoolRewardStats[poolId].totalRewardAddedWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalRewardClaimedWei).to.equal(
    stakingPoolRewardStats[poolId].totalRewardClaimedWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalRewardRemovedWei).to.equal(
    stakingPoolRewardStats[poolId].totalRewardRemovedWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalStakedWei).to.equal(
    stakingPoolRewardStats[poolId].totalStakedWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalUnstakedAfterMatureWei).to.equal(
    stakingPoolRewardStats[poolId].totalUnstakedAfterMatureWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalUnstakedBeforeMatureWei).to.equal(
    stakingPoolRewardStats[poolId].totalUnstakedBeforeMatureWei,
  );
  expect(stakingPoolStatsBeforeAdd.totalUnstakePenaltyAmountWei).to.equal(
    stakingPoolRewardStats[poolId].totalUnstakePenaltyAmountWei,
  );

  const truncatedRewardAmountWei = computeTruncatedAmountWei(
    rewardAmountWei,
    rewardTokenDecimals,
  );

  if (expectAbleToAddReward) {
    await testHelpers.approveTransferWithVerify(
      rewardTokenContractInstance,
      fromWalletSigner,
      stakingServiceContractInstance.address,
      rewardAmountWei,
    );

    await expect(
      stakingServiceContractInstance
        .connect(fromWalletSigner)
        .addStakingPoolReward(poolId, rewardAmountWei),
    )
      .to.emit(stakingServiceContractInstance, "StakingPoolRewardAdded")
      .withArgs(
        poolId,
        await fromWalletSigner.getAddress(),
        rewardTokenContractInstance.address,
        truncatedRewardAmountWei,
      );
  } else {
    await expect(
      stakingServiceContractInstance
        .connect(fromWalletSigner)
        .addStakingPoolReward(poolId, rewardAmountWei),
    ).to.be.revertedWith(
      `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
        testHelpers.CONTRACT_ADMIN_ROLE
      }`,
    );
  }

  const expectedBalanceOfAfterAdd = expectAbleToAddReward
    ? stakingPoolRewardBalanceOf.add(rewardAmountWei)
    : stakingPoolRewardBalanceOf;
  const expectBalanceOfAfterAdd = expectAbleToAddReward
    ? stakingPoolRewardBalanceOf.add(truncatedRewardAmountWei)
    : stakingPoolRewardBalanceOf;

  const expectedTotalRewardAddedWeiAfterAdd = expectAbleToAddReward
    ? stakingPoolRewardStats[poolId].totalRewardAddedWei.add(rewardAmountWei)
    : stakingPoolRewardStats[poolId].totalRewardAddedWei;

  if (expectAbleToAddReward) {
    stakingPoolRewardStats[poolId].totalRewardAddedWei = stakingPoolRewardStats[
      poolId
    ].totalRewardAddedWei.add(truncatedRewardAmountWei);

    const poolRewardWei = computePoolRewardWei(stakingPoolRewardStats[poolId]);
    stakingPoolRewardStats[poolId].poolSizeWei = computePoolSizeWei(
      stakeDurationDays,
      poolAprWei,
      poolRewardWei,
      stakeTokenDecimals,
    );
  }

  const balanceOfAfterAdd = await rewardTokenContractInstance.balanceOf(
    stakingServiceContractInstance.address,
  );
  expect(balanceOfAfterAdd).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectedBalanceOfAfterAdd,
      rewardTokenDecimals,
    ),
  );
  expect(balanceOfAfterAdd).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectBalanceOfAfterAdd,
      rewardTokenDecimals,
    ),
  );

  const stakingPoolStatsAfterAdd =
    await stakingServiceContractInstance.getStakingPoolStats(poolId);

  verifyActualWithTruncatedValueWei(
    10,
    rewardTokenDecimals,
    stakingPoolStatsAfterAdd.totalRewardAddedWei,
    expectedTotalRewardAddedWeiAfterAdd,
    hre.ethers.constants.Zero,
  );

  expect(stakingPoolStatsAfterAdd.isOpen).to.equal(
    stakingPoolStatsBeforeAdd.isOpen,
  );
  expect(stakingPoolStatsAfterAdd.isActive).to.equal(
    stakingPoolStatsBeforeAdd.isActive,
  );
  expect(stakingPoolStatsAfterAdd.poolSizeWei).to.equal(
    stakingPoolRewardStats[poolId].poolSizeWei,
  );
  expect(stakingPoolStatsAfterAdd.rewardToBeDistributedWei).to.equal(
    stakingPoolStatsBeforeAdd.rewardToBeDistributedWei,
  );
  expect(stakingPoolStatsAfterAdd.totalRevokedRewardWei).to.equal(
    stakingPoolStatsBeforeAdd.totalRevokedRewardWei,
  );
  expect(stakingPoolStatsAfterAdd.totalRevokedStakeWei).to.equal(
    stakingPoolStatsBeforeAdd.totalRevokedStakeWei,
  );
  expect(stakingPoolStatsAfterAdd.totalRevokedStakeRemovedWei).to.equal(
    stakingPoolStatsBeforeAdd.totalRevokedStakeRemovedWei,
  );
  expect(stakingPoolStatsAfterAdd.totalRewardAddedWei).to.equal(
    stakingPoolRewardStats[poolId].totalRewardAddedWei,
  );
  expect(stakingPoolStatsAfterAdd.totalRewardClaimedWei).to.equal(
    stakingPoolStatsBeforeAdd.totalRewardClaimedWei,
  );
  expect(stakingPoolStatsAfterAdd.totalRewardRemovedWei).to.equal(
    stakingPoolStatsBeforeAdd.totalRewardRemovedWei,
  );
  expect(stakingPoolStatsAfterAdd.totalStakedWei).to.equal(
    stakingPoolStatsBeforeAdd.totalStakedWei,
  );
  expect(stakingPoolStatsAfterAdd.totalUnstakedAfterMatureWei).to.equal(
    stakingPoolStatsBeforeAdd.totalUnstakedAfterMatureWei,
  );
  expect(stakingPoolStatsAfterAdd.totalUnstakedBeforeMatureWei).to.equal(
    stakingPoolStatsBeforeAdd.totalUnstakedBeforeMatureWei,
  );
  expect(stakingPoolStatsAfterAdd.totalUnstakePenaltyAmountWei).to.equal(
    stakingPoolStatsBeforeAdd.totalUnstakePenaltyAmountWei,
  );

  return expectBalanceOfAfterAdd;
}

function computeCloseToDelta(lastDigitDelta, tokenDecimals) {
  return hre.ethers.BigNumber.from("10")
    .pow(testHelpers.TOKEN_MAX_DECIMALS - tokenDecimals - 1)
    .mul(hre.ethers.BigNumber.from(lastDigitDelta));
}

function computePoolRewardWei(stakingPoolRewardStats) {
  return stakingPoolRewardStats.totalRewardAddedWei
    .add(stakingPoolRewardStats.totalRevokedRewardWei)
    .sub(stakingPoolRewardStats.totalRewardRemovedWei);
}

function computePoolSizeWei(durationDays, poolAprWei, poolRewardWei, decimals) {
  return computeTruncatedAmountWei(
    poolAprWei.gt(hre.ethers.constants.Zero)
      ? hre.ethers.BigNumber.from("365")
          .mul(testHelpers.BN_PERCENT_100_WEI)
          .mul(poolRewardWei)
          .div(hre.ethers.BigNumber.from(durationDays).mul(poolAprWei))
      : hre.ethers.constants.MaxUint256,
    decimals,
  );
}

function computeTruncatedAmountWei(amountWei, tokenDecimals) {
  return tokenDecimals < testHelpers.TOKEN_MAX_DECIMALS
    ? testHelpers.scaleDecimalsToWei(
        testHelpers.scaleWeiToDecimals(amountWei, tokenDecimals),
        tokenDecimals,
      )
    : amountWei;
}

async function newStakingService(stakingPoolAddress) {
  const StakingServiceFactory =
    await hre.ethers.getContractFactory("StakingServiceV2");
  const stakingServiceContractInstance =
    await StakingServiceFactory.deploy(stakingPoolAddress);
  await stakingServiceContractInstance.deployed();

  return stakingServiceContractInstance;
}

async function testAddStakingPoolReward(
  stakingServiceContractInstance,
  stakingPoolRewardConfigs,
  signers,
  balanceOfStakingPoolRewards,
  stakingPoolRewardStats,
  expectAbleToAddReward,
) {
  for (let i = 0; i < stakingPoolRewardConfigs.length; i++) {
    const signerIndex = i % signers.length;

    balanceOfStakingPoolRewards[
      stakingPoolRewardConfigs[i].rewardTokenInstance.address
    ] = await addStakingPoolRewardWithVerify(
      stakingServiceContractInstance,
      stakingPoolRewardConfigs[i].stakeTokenInstance,
      stakingPoolRewardConfigs[i].rewardTokenInstance,
      signers[signerIndex],
      stakingPoolRewardConfigs[i].poolId,
      stakingPoolRewardConfigs[i].stakeDurationDays,
      stakingPoolRewardConfigs[i].poolAprWei,
      balanceOfStakingPoolRewards[
        stakingPoolRewardConfigs[i].rewardTokenInstance.address
      ],
      stakingPoolRewardStats,
      stakingPoolRewardConfigs[i].rewardAmountWei,
      expectAbleToAddReward,
    );
  }
}

async function testSetStakingPoolContract(
  contractInstance,
  signers,
  expectStakingPoolContractBeforeSet,
  expectStakingPoolContractAfterSet,
  expectAbleToSetStakingPoolContract,
) {
  const stakingPoolContractBeforeSet =
    await contractInstance.stakingPoolContract();
  expect(stakingPoolContractBeforeSet).to.equal(
    expectStakingPoolContractBeforeSet,
  );

  for (let i = 0; i < signers.length; i++) {
    const signerAddress = await signers[i].getAddress();

    if (expectAbleToSetStakingPoolContract) {
      await expect(
        contractInstance
          .connect(signers[i])
          .setStakingPoolContract(expectStakingPoolContractAfterSet),
      )
        .to.emit(contractInstance, "StakingPoolContractChanged")
        .withArgs(
          expectStakingPoolContractBeforeSet,
          expectStakingPoolContractAfterSet,
          signerAddress,
        );

      const stakingPoolContractAfterSet =
        await contractInstance.stakingPoolContract();
      expect(stakingPoolContractAfterSet).to.equal(
        expectStakingPoolContractAfterSet,
      );

      await expect(
        contractInstance
          .connect(signers[i])
          .setStakingPoolContract(expectStakingPoolContractBeforeSet),
      )
        .to.emit(contractInstance, "StakingPoolContractChanged")
        .withArgs(
          expectStakingPoolContractAfterSet,
          expectStakingPoolContractBeforeSet,
          signerAddress,
        );

      const stakingPoolContractAfterRestore =
        await contractInstance.stakingPoolContract();
      expect(stakingPoolContractAfterRestore).to.equal(
        expectStakingPoolContractBeforeSet,
      );
    } else {
      await expect(
        contractInstance
          .connect(signers[i])
          .setStakingPoolContract(expectStakingPoolContractAfterSet),
      ).to.be.revertedWith(
        `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
          testHelpers.GOVERNANCE_ROLE
        }`,
      );

      const stakingPoolContractAfterSetFail =
        await contractInstance.stakingPoolContract();
      expect(stakingPoolContractAfterSetFail).to.equal(
        expectStakingPoolContractBeforeSet,
      );
    }
  }
}

function verifyActualWithTruncatedValueWei(
  lastDigitDecimalsDelta,
  tokenDecimals,
  expectValueWei,
  actualValueWei,
  actualValueDeltaWei,
) {
  if (tokenDecimals < testHelpers.TOKEN_MAX_DECIMALS) {
    if (lastDigitDecimalsDelta === 0) {
      expect(expectValueWei).to.equal(actualValueWei);
    } else {
      const closeToDelta = computeCloseToDelta(
        lastDigitDecimalsDelta,
        tokenDecimals,
      );
      expect(expectValueWei).to.be.closeTo(actualValueWei, closeToDelta);
    }
  } else {
    if (actualValueDeltaWei.eq(hre.ethers.constants.Zero)) {
      expect(expectValueWei).to.equal(actualValueWei);
    } else {
      expect(expectValueWei).to.be.closeTo(actualValueWei, actualValueDeltaWei);
    }
  }
}

module.exports = {
  addStakingPoolRewardWithVerify,
  computeCloseToDelta,
  computeTruncatedAmountWei,
  newStakingService,
  testAddStakingPoolReward,
  testSetStakingPoolContract,
  verifyActualWithTruncatedValueWei,
};
