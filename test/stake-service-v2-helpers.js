const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");

async function addStakingPoolRewardWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  startblockTimestamp,
  stakeEvent,
  expectStakeInfosBeforeAdd,
  expectStakeInfosAfterAdd,
  expectStakingPoolStatsBeforeAdd,
  expectStakingPoolStatsAfterAdd,
) {
  const poolId = stakingPoolConfigs[stakeEvent.poolIndex].poolId;
  const stakeTokenDecimals =
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals;
  const rewardTokenContractInstance =
    stakingPoolConfigs[stakeEvent.poolIndex].rewardTokenInstance;
  const rewardTokenDecimals =
    stakingPoolConfigs[stakeEvent.poolIndex].rewardTokenDecimals;
  const stakeDurationDays =
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays;
  const poolAprWei = stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei;
  const signerAccount = stakeEvent.signer;
  const signerAddress = stakeEvent.signerAddress;
  const rewardAmountWei = stakeEvent.rewardAmountWei;

  const contractWeiBalanceOfRewardBeforeAdd = testHelpers.scaleDecimalsToWei(
    await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address,
    ),
    rewardTokenDecimals,
  );
  const signerWeiBalanceOfRewardBeforeAdd = testHelpers.scaleDecimalsToWei(
    await rewardTokenContractInstance.balanceOf(signerAddress),
    rewardTokenDecimals,
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeAdd,
  );

  const stakingPoolStatsBeforeAdd = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    poolId,
    expectStakingPoolStatsBeforeAdd.get(poolId),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeAdd,
  );

  const truncatedRewardAmountWei = computeTruncatedAmountWei(
    rewardAmountWei,
    rewardTokenDecimals,
  );

  if (
    stakeEvent.hasPermissionToAddReward &&
    rewardAmountWei.gt(hre.ethers.constants.Zero)
  ) {
    await testHelpers.approveTransferWithVerify(
      rewardTokenContractInstance,
      signerAccount,
      stakingServiceContractInstance.address,
      rewardAmountWei,
    );
  }

  const expectAddRewardTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);
  await testHelpers.setTimeNextBlock(expectAddRewardTimestamp.toNumber());

  if (stakeEvent.hasPermissionToAddReward) {
    if (rewardAmountWei.gt(hre.ethers.constants.Zero)) {
      await expect(
        stakingServiceContractInstance
          .connect(signerAccount)
          .addStakingPoolReward(poolId, rewardAmountWei),
      )
        .to.emit(stakingServiceContractInstance, "StakingPoolRewardAdded")
        .withArgs(
          poolId,
          signerAddress,
          rewardTokenContractInstance.address,
          truncatedRewardAmountWei,
        );
    } else {
      await expect(
        stakingServiceContractInstance
          .connect(signerAccount)
          .addStakingPoolReward(poolId, rewardAmountWei),
      ).to.be.revertedWith("SSvcs2: reward amount");
    }
  } else {
    await expect(
      stakingServiceContractInstance
        .connect(signerAccount)
        .addStakingPoolReward(poolId, rewardAmountWei),
    ).to.be.revertedWith(
      `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
        testHelpers.CONTRACT_ADMIN_ROLE
      }`,
    );
  }

  const expectedContractWeiBalanceOfRewardAfterAdd =
    stakeEvent.hasPermissionToAddReward
      ? contractWeiBalanceOfRewardBeforeAdd.add(rewardAmountWei)
      : contractWeiBalanceOfRewardBeforeAdd;
  const expectContractWeiBalanceOfRewardAfterAdd =
    stakeEvent.hasPermissionToAddReward
      ? contractWeiBalanceOfRewardBeforeAdd.add(truncatedRewardAmountWei)
      : contractWeiBalanceOfRewardBeforeAdd;

  const expectedSignerWeiBalanceOfRewardAfterAdd =
    stakeEvent.hasPermissionToAddReward
      ? signerWeiBalanceOfRewardBeforeAdd.sub(rewardAmountWei)
      : signerWeiBalanceOfRewardBeforeAdd;
  const expectSignerWeiBalanceOfRewardAfterAdd =
    stakeEvent.hasPermissionToAddReward
      ? signerWeiBalanceOfRewardBeforeAdd.sub(truncatedRewardAmountWei)
      : signerWeiBalanceOfRewardBeforeAdd;

  const expectedTotalRewardAddedWeiAfterAdd =
    stakeEvent.hasPermissionToAddReward
      ? stakingPoolStatsBeforeAdd.totalRewardAddedWei.add(rewardAmountWei)
      : stakingPoolStatsBeforeAdd.totalRewardAddedWei;
  const expectTotalRewardAddedWeiAfterAdd = stakeEvent.hasPermissionToAddReward
    ? stakingPoolStatsBeforeAdd.totalRewardAddedWei.add(
        truncatedRewardAmountWei,
      )
    : stakingPoolStatsBeforeAdd.totalRewardAddedWei;

  const expectPoolRewardWeiAfterAdd = computePoolRewardWei(
    expectTotalRewardAddedWeiAfterAdd,
    stakingPoolStatsBeforeAdd.totalRevokedRewardWei,
    stakingPoolStatsBeforeAdd.totalUnstakedRewardBeforeMatureWei,
    stakingPoolStatsBeforeAdd.totalRewardRemovedWei,
  );

  const expectPoolRemainingRewardWeiAfterAdd = computePoolRemainingRewardWei(
    expectPoolRewardWeiAfterAdd,
    stakingPoolStatsBeforeAdd.rewardToBeDistributedWei,
  );

  const expectPoolSizeWeiAfterAdd = computePoolSizeWei(
    stakeDurationDays,
    poolAprWei,
    expectPoolRewardWeiAfterAdd,
    stakeTokenDecimals,
  );

  const contractDecimalsBalanceOfRewardAfterAdd =
    await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address,
    );
  expect(contractDecimalsBalanceOfRewardAfterAdd).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectContractWeiBalanceOfRewardAfterAdd,
      rewardTokenDecimals,
    ),
  );

  verifyActualWithTruncatedValueWei(
    10,
    rewardTokenDecimals,
    expectContractWeiBalanceOfRewardAfterAdd,
    expectedContractWeiBalanceOfRewardAfterAdd,
    hre.ethers.constants.Zero,
  );

  const signerDecimalsBalanceOfRewardAfterAdd =
    await rewardTokenContractInstance.balanceOf(signerAddress);
  expect(signerDecimalsBalanceOfRewardAfterAdd).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectSignerWeiBalanceOfRewardAfterAdd,
      rewardTokenDecimals,
    ),
  );

  verifyActualWithTruncatedValueWei(
    10,
    rewardTokenDecimals,
    expectSignerWeiBalanceOfRewardAfterAdd,
    expectedSignerWeiBalanceOfRewardAfterAdd,
    hre.ethers.constants.Zero,
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterAdd,
  );

  const stakingPoolStatsAfterAdd = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    poolId,
    {
      isOpen: stakingPoolStatsBeforeAdd.isOpen,
      isActive: stakingPoolStatsBeforeAdd.isActive,
      poolRemainingRewardWei: expectPoolRemainingRewardWeiAfterAdd,
      poolRewardAmountWei: expectPoolRewardWeiAfterAdd,
      poolSizeWei: expectPoolSizeWeiAfterAdd,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeAdd.rewardToBeDistributedWei,
      totalRevokedRewardWei: stakingPoolStatsBeforeAdd.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeAdd.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeAdd.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: expectTotalRewardAddedWeiAfterAdd,
      totalRewardClaimedWei: stakingPoolStatsBeforeAdd.totalRewardClaimedWei,
      totalRewardRemovedWei: stakingPoolStatsBeforeAdd.totalRewardRemovedWei,
      totalStakedWei: stakingPoolStatsBeforeAdd.totalStakedWei,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeAdd.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeAdd.totalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        stakingPoolStatsBeforeAdd.totalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeAdd.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeAdd.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeAdd.totalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterAdd,
  );

  verifyActualWithTruncatedValueWei(
    10,
    rewardTokenDecimals,
    stakingPoolStatsAfterAdd.totalRewardAddedWei,
    expectedTotalRewardAddedWeiAfterAdd,
    hre.ethers.constants.Zero,
  );

  return expectContractWeiBalanceOfRewardAfterAdd;
}

function calculateClaimableRewardWei(
  estimatedRewardAtMaturityWei,
  rewardClaimedWei,
  stakeMaturityTimestamp,
  currentTimestamp,
  unstakeTimestamp,
) {
  const isMatured = isStakeMatured(
    stakeMaturityTimestamp,
    currentTimestamp,
    unstakeTimestamp,
  );

  return isMatured
    ? hre.ethers.BigNumber.from(estimatedRewardAtMaturityWei).sub(
        rewardClaimedWei,
      )
    : hre.ethers.constants.Zero;
}

function calculateCooldownExpiryTimestamp(
  cooldownPeriodDays,
  unstakeTimestamp,
) {
  return testHelpers.BN_SECONDS_IN_DAYS.mul(cooldownPeriodDays).add(
    unstakeTimestamp,
  );
}

function calculateRevokedRewardAmountWei(
  estimatedRewardAtMaturityWei,
  rewardClaimedWei,
  stakeMaturityTimestamp,
  currentTimestamp,
  unstakeTimestamp,
) {
  return calculateClaimableRewardWei(
    estimatedRewardAtMaturityWei,
    rewardClaimedWei,
    stakeMaturityTimestamp,
    currentTimestamp,
    unstakeTimestamp,
  );
}

function calculateRevokedStakeAmountWei(
  stakeAmountWei,
  unstakeAmountWei,
  isUnstakeWithdrawn,
  isStakeUnstaked,
) {
  return isUnstakeWithdrawn
    ? hre.ethers.constants.Zero
    : isStakeUnstaked
      ? hre.ethers.BigNumber.from(unstakeAmountWei)
      : hre.ethers.BigNumber.from(stakeAmountWei);
}

function calculateStateMaturityTimestamp(stakeDurationDays, stakeTimestamp) {
  return testHelpers.BN_SECONDS_IN_DAYS.mul(stakeDurationDays).add(
    stakeTimestamp,
  );
}

function calculateUnstakeAmountWei(
  stakeAmountWei,
  earlyUnstakePenaltyPercentWei,
  stakeMaturityTimestamp,
  currentTimestamp,
  unstakeTimestamp,
) {
  const unstakePenaltyWei = calculateUnstakePenaltyWei(
    stakeAmountWei,
    earlyUnstakePenaltyPercentWei,
    stakeMaturityTimestamp,
    currentTimestamp,
    unstakeTimestamp,
  );

  return hre.ethers.BigNumber.from(stakeAmountWei).sub(unstakePenaltyWei);
}

function calculateUnstakePenaltyWei(
  stakeAmountWei,
  earlyUnstakePenaltyPercentWei,
  stakeMaturityTimestamp,
  currentTimestamp,
  unstakeTimestamp,
) {
  const isMatured = isStakeMatured(
    stakeMaturityTimestamp,
    currentTimestamp,
    unstakeTimestamp,
  );

  return isMatured
    ? hre.ethers.constants.Zero
    : hre.ethers.BigNumber.from(stakeAmountWei)
        .mul(earlyUnstakePenaltyPercentWei)
        .div(testHelpers.BN_PERCENT_100_WEI);
}

async function claimWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  startblockTimestamp,
  stakeEvent,
  expectStakeInfosBeforeClaim,
  expectStakeInfosAfterClaim,
  expectStakingPoolStatsBeforeClaim,
  expectStakingPoolStatsAfterClaim,
) {
  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  console.log(
    `\nclaimWithVerify: currentBlockTimestamp=${currentBlockTimestamp}, poolUuid=${
      stakingPoolConfigs[stakeEvent.poolIndex].poolUuid
    }, poolId=${stakingPoolConfigs[stakeEvent.poolIndex].poolId}, eventSecondsAfterStartblockTimestamp=${
      stakeEvent.eventSecondsAfterStartblockTimestamp
    }, signer=${stakeEvent.signerAddress}`,
  );

  const expectStakeInfoBeforeClaim = expectStakeInfosBeforeClaim.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const expectClaimableRewardWeiBeforeClaim = calculateClaimableRewardWei(
    expectStakeInfoBeforeClaim.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeClaim.rewardClaimedWei,
    expectStakeInfoBeforeClaim.stakeMaturitySecondsAfterStartblockTimestamp,
    hre.ethers.BigNumber.from(currentBlockTimestamp).sub(startblockTimestamp),
    expectStakeInfoBeforeClaim.unstakeTimestamp,
  );

  const getClaimableRewardWeiBeforeClaim =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(getClaimableRewardWeiBeforeClaim).to.equal(
    expectClaimableRewardWeiBeforeClaim,
  );

  const stakeInfoBeforeClaim = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    expectStakeInfoBeforeClaim,
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeClaim,
  );

  const stakingPoolStatsBeforeClaim = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    expectStakingPoolStatsBeforeClaim.get(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    ),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeClaim,
  );

  const expectClaimTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);
  await testHelpers.setTimeNextBlock(expectClaimTimestamp.toNumber());

  const expectClaimableRewardWeiAtClaim = calculateClaimableRewardWei(
    expectStakeInfoBeforeClaim.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeClaim.rewardClaimedWei,
    expectStakeInfoBeforeClaim.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    expectStakeInfoBeforeClaim.unstakeTimestamp,
  );

  const contractBalanceOfBeforeClaim = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);
  const signerBalanceOfBeforeClaim = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);

  if (expectClaimableRewardWeiAtClaim.gt(hre.ethers.constants.Zero)) {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .claimReward(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    )
      .to.emit(stakingServiceContractInstance, "RewardClaimed")
      .withArgs(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.signerAddress,
        stakeEvent.stakeId,
        stakingPoolConfigs[stakeEvent.poolIndex].rewardTokenInstance.address,
        expectClaimableRewardWeiAtClaim,
      );
  }

  const signerBalanceOfAfterClaim = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);
  const contractBalanceOfAfterClaim = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);

  expect(contractBalanceOfAfterClaim).to.equal(
    contractBalanceOfBeforeClaim.sub(expectClaimableRewardWeiAtClaim),
  );
  expect(signerBalanceOfAfterClaim).to.equal(
    signerBalanceOfBeforeClaim.add(expectClaimableRewardWeiAtClaim),
  );

  const expectClaimableRewardWeiAfterClaim = hre.ethers.constants.Zero;

  const claimableRewardWeiAfterClaim =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(claimableRewardWeiAfterClaim).to.equal(
    expectClaimableRewardWeiAfterClaim,
  );

  const stakeInfoAfterClaim = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    {
      estimatedRewardAtMaturityWei:
        expectStakeInfoBeforeClaim.estimatedRewardAtMaturityWei,
      revokedRewardAmountWei: hre.ethers.constants.Zero,
      revokedStakeAmountWei: hre.ethers.constants.Zero,
      revokeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      rewardClaimedWei: expectClaimableRewardWeiAtClaim,
      stakeAmountWei: expectStakeInfoBeforeClaim.stakeAmountWei,
      stakeMaturitySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeClaim.stakeMaturitySecondsAfterStartblockTimestamp,
      stakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeClaim.stakeSecondsAfterStartblockTimestamp,
      unstakeAmountWei: expectStakeInfoBeforeClaim.unstakeAmountWei,
      unstakeCooldownExpirySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeClaim.unstakeCooldownExpirySecondsAfterStartblockTimestamp,
      unstakePenaltyAmountWei:
        expectStakeInfoBeforeClaim.unstakePenaltyAmountWei,
      unstakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeClaim.unstakeSecondsAfterStartblockTimestamp,
      withdrawUnstakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeClaim.withdrawUnstakeSecondsAfterStartblockTimestamp,
      isActive: true,
      isInitialized: true,
    },
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterClaim,
  );

  const expectPoolRewardWeiAfterClaim = computePoolRewardWei(
    stakingPoolStatsBeforeClaim.totalRewardAddedWei,
    stakingPoolStatsBeforeClaim.totalRevokedRewardWei,
    stakingPoolStatsBeforeClaim.totalUnstakedRewardBeforeMatureWei,
    stakingPoolStatsBeforeClaim.totalRewardRemovedWei,
  );
  const expectPoolRemainingRewardWeiAfterClaim = computePoolRemainingRewardWei(
    expectPoolRewardWeiAfterClaim,
    stakingPoolStatsBeforeClaim.rewardToBeDistributedWei,
  );
  const expectPoolSizeWeiAfterClaim = computePoolSizeWei(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWeiAfterClaim,
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals,
  );

  const expectTotalRewardClaimedWei =
    stakingPoolStatsBeforeClaim.totalRewardClaimedWei.add(
      expectClaimableRewardWeiAtClaim,
    );

  const stakingPoolStatsAfterClaim = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    {
      isOpen: stakingPoolStatsBeforeClaim.isOpen,
      isActive: stakingPoolStatsBeforeClaim.isActive,
      poolRemainingRewardWei: expectPoolRemainingRewardWeiAfterClaim,
      poolRewardAmountWei: expectPoolRewardWeiAfterClaim,
      poolSizeWei: expectPoolSizeWeiAfterClaim,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeClaim.rewardToBeDistributedWei,
      totalRevokedRewardWei: stakingPoolStatsBeforeClaim.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeClaim.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeClaim.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolStatsBeforeClaim.totalRewardAddedWei,
      totalRewardClaimedWei: expectTotalRewardClaimedWei,
      totalRewardRemovedWei: stakingPoolStatsBeforeClaim.totalRewardRemovedWei,
      totalStakedWei: stakingPoolStatsBeforeClaim.totalStakedWei,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeClaim.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeClaim.totalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        stakingPoolStatsBeforeClaim.totalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeClaim.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeClaim.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeClaim.totalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterClaim,
  );

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .stake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
        hre.ethers.utils.parseEther("1.0"),
      ),
  ).to.be.revertedWith("SSvcs2: stake exists");

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .claimReward(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  ).to.be.revertedWith("SSvcs2: zero reward");

  console.log(
    `claimWithVerify: expectClaimableRewardWeiAtClaim=${expectClaimableRewardWeiAtClaim}, expectTotalRewardClaimedWei=${expectTotalRewardClaimedWei}`,
  );
}

function computeCloseToDelta(lastDigitDelta, tokenDecimals) {
  return hre.ethers.BigNumber.from("10")
    .pow(testHelpers.TOKEN_MAX_DECIMALS - tokenDecimals - 1)
    .mul(hre.ethers.BigNumber.from(lastDigitDelta));
}

function computePoolRemainingRewardWei(
  poolRewardWei,
  rewardToBeDistributedWei,
) {
  return hre.ethers.BigNumber.from(poolRewardWei).sub(rewardToBeDistributedWei);
}

function computePoolRewardWei(
  totalRewardAddedWei,
  totalRevokedRewardWei,
  totalUnstakedRewardBeforeMatureWei,
  totalRewardRemovedWei,
) {
  return hre.ethers.BigNumber.from(totalRewardAddedWei)
    .add(totalRevokedRewardWei)
    .add(totalUnstakedRewardBeforeMatureWei)
    .sub(totalRewardRemovedWei);
}

function computePoolSizeWei(durationDays, poolAprWei, poolRewardWei, decimals) {
  return computeTruncatedAmountWei(
    hre.ethers.BigNumber.from(poolAprWei).gt(hre.ethers.constants.Zero)
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

function estimateRewardAtMaturityWei(
  poolAprWei,
  stakeDurationDays,
  stakeAmountWei,
) {
  return hre.ethers.BigNumber.from(stakeAmountWei)
    .mul(poolAprWei)
    .mul(stakeDurationDays)
    .div(testHelpers.BN_DAYS_IN_YEAR.mul(testHelpers.BN_PERCENT_100_WEI));
}

function getNextExpectStakeInfoStakingPoolStats(
  triggerStakeEvent,
  updateStakeEvent,
  unstakeStakeEvent,
  stakingPoolConfigs,
  previousExpectStakeInfos,
  previousExpectStakingPoolStats,
) {
  const nextExpectStakeInfos = structuredClone(previousExpectStakeInfos);
  const expectStakeInfoAfterTriggerStakeEvent = updateStakeEvent.stakeId
    ? nextExpectStakeInfos.get(
        `${stakingPoolConfigs[updateStakeEvent.poolIndex].poolId},${updateStakeEvent.signerAddress},${updateStakeEvent.stakeId}`,
      )
    : null;
  console.log(
    `\nstakeInfoAfterTriggerStakeEvent before: ${JSON.stringify(expectStakeInfoAfterTriggerStakeEvent)}`,
  );

  const nextExpectStakingPoolStats = structuredClone(
    previousExpectStakingPoolStats,
  );
  const expectStakingPoolStatsAfterTriggerStakeEvent =
    nextExpectStakingPoolStats.get(
      `${stakingPoolConfigs[updateStakeEvent.poolIndex].poolId}`,
    );
  console.log(
    `\nstakingPoolStatsAfterTriggerStakeEvent before: ${JSON.stringify(expectStakingPoolStatsAfterTriggerStakeEvent)}`,
  );

  switch (triggerStakeEvent.eventType) {
    case "AddReward":
      console.log(`\nAddReward: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakingPoolStatsAfterAddReward(
        triggerStakeEvent,
        stakingPoolConfigs,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;
    case "Claim":
      console.log(`\nClaim: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakeInfoAfterClaim(
        triggerStakeEvent,
        updateStakeEvent,
        unstakeStakeEvent,
        stakingPoolConfigs,
        expectStakeInfoAfterTriggerStakeEvent,
      );
      updateExpectStakingPoolStatsAfterClaim(
        triggerStakeEvent,
        updateStakeEvent,
        unstakeStakeEvent,
        stakingPoolConfigs,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;
    case "RemoveReward":
      console.log(`\nRemoveReward: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakingPoolStatsAfterRemoveReward(
        triggerStakeEvent,
        stakingPoolConfigs,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;

    case "Revoke":
      console.log(`\nRevoke: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakeInfoAfterRevoke(
        triggerStakeEvent,
        updateStakeEvent,
        expectStakeInfoAfterTriggerStakeEvent,
      );
      updateExpectStakingPoolStatsAfterRevoke(
        triggerStakeEvent,
        updateStakeEvent,
        unstakeStakeEvent,
        stakingPoolConfigs,
        expectStakeInfoAfterTriggerStakeEvent,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;
    case "Stake":
      console.log(`\nStake: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakeInfoAfterStake(
        triggerStakeEvent,
        stakingPoolConfigs,
        expectStakeInfoAfterTriggerStakeEvent,
      );
      updateExpectStakingPoolStatsAfterStake(
        triggerStakeEvent,
        stakingPoolConfigs,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;
    case "Unstake":
      console.log(`\nUnstake: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakeInfoAfterUnstake(
        triggerStakeEvent,
        updateStakeEvent,
        stakingPoolConfigs,
        expectStakeInfoAfterTriggerStakeEvent,
      );
      updateExpectStakingPoolStatsAfterUnstake(
        triggerStakeEvent,
        updateStakeEvent,
        stakingPoolConfigs,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;
    case "Withdraw":
      console.log(`\nWithdraw: ${JSON.stringify(triggerStakeEvent)}`);
      updateExpectStakeInfoAfterWithdraw(
        triggerStakeEvent,
        updateStakeEvent,
        unstakeStakeEvent,
        stakingPoolConfigs,
        expectStakeInfoAfterTriggerStakeEvent,
      );
      updateExpectStakingPoolStatsAfterWithdraw(
        triggerStakeEvent,
        updateStakeEvent,
        unstakeStakeEvent,
        stakingPoolConfigs,
        expectStakingPoolStatsAfterTriggerStakeEvent,
      );
      break;
    default:
      console.log(
        `\nUnknown Trigger Event Type ${triggerStakeEvent.eventType}: ${JSON.stringify(triggerStakeEvent)}`,
      );
      break;
  }

  if (updateStakeEvent.stakeId) {
    nextExpectStakeInfos.set(
      `${stakingPoolConfigs[updateStakeEvent.poolIndex].poolId},${updateStakeEvent.signerAddress},${updateStakeEvent.stakeId}`,
      expectStakeInfoAfterTriggerStakeEvent,
    );
  }

  console.log(
    `\nstakingPoolStatsAfterTriggerStakeEvent after: ${JSON.stringify(expectStakingPoolStatsAfterTriggerStakeEvent)}`,
  );

  nextExpectStakingPoolStats.set(
    `${stakingPoolConfigs[updateStakeEvent.poolIndex].poolId}`,
    expectStakingPoolStatsAfterTriggerStakeEvent,
  );

  return {
    nextExpectStakeInfos,
    nextExpectStakingPoolStats,
  };
}

function isStakeMatured(
  stakeMaturityTimestamp,
  currentTimestamp,
  unstakeTimestamp,
) {
  const timestamp =
    unstakeTimestamp &&
    hre.ethers.BigNumber.from(unstakeTimestamp).gt(hre.ethers.constants.Zero)
      ? hre.ethers.BigNumber.from(unstakeTimestamp)
      : hre.ethers.BigNumber.from(currentTimestamp);

  return (
    stakeMaturityTimestamp &&
    hre.ethers.BigNumber.from(stakeMaturityTimestamp).gt(
      hre.ethers.constants.Zero,
    ) &&
    timestamp.gte(stakeMaturityTimestamp)
  );
}

async function newStakingService(stakingPoolAddress) {
  const StakingServiceFactory =
    await hre.ethers.getContractFactory("StakingServiceV2");
  const stakingServiceContractInstance =
    await StakingServiceFactory.deploy(stakingPoolAddress);
  await stakingServiceContractInstance.deployed();

  return stakingServiceContractInstance;
}

async function removeUnallocatedStakingPoolRewardWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  startblockTimestamp,
  stakeEvent,
  expectStakeInfosBeforeRemove,
  expectStakeInfosAfterRemove,
  expectStakingPoolStatsBeforeRemove,
  expectStakingPoolStatsAfterRemove,
) {
  const poolId = stakingPoolConfigs[stakeEvent.poolIndex].poolId;
  const stakeTokenDecimals =
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals;
  const rewardTokenContractInstance =
    stakingPoolConfigs[stakeEvent.poolIndex].rewardTokenInstance;
  const rewardTokenDecimals =
    stakingPoolConfigs[stakeEvent.poolIndex].rewardTokenDecimals;
  const stakeDurationDays =
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays;
  const poolAprWei = stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei;
  const signerAccount = stakeEvent.signer;
  const signerAddress = stakeEvent.signerAddress;

  const contractWeiBalanceOfRewardBeforeRemove = testHelpers.scaleDecimalsToWei(
    await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address,
    ),
    rewardTokenDecimals,
  );

  const signerWeiBalanceOfRewardBeforeRemove = testHelpers.scaleDecimalsToWei(
    await rewardTokenContractInstance.balanceOf(signerAddress),
    rewardTokenDecimals,
  );

  console.log(
    `\nremoveUnallocatedStakingPoolRewardWithVerify: signerWeiBalanceOfRewardBeforeRemove=${signerWeiBalanceOfRewardBeforeRemove}`,
  );

  const adminWalletWeiBalanceOfRewardBeforeRemove =
    testHelpers.scaleDecimalsToWei(
      await rewardTokenContractInstance.balanceOf(
        stakeEvent.adminWalletAddress,
      ),
      rewardTokenDecimals,
    );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeRemove,
  );

  const stakingPoolStatsBeforeRemove = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    poolId,
    expectStakingPoolStatsBeforeRemove.get(poolId),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeRemove,
  );

  const expectedPoolRewardWeiBeforeRemove = computePoolRewardWei(
    stakingPoolStatsBeforeRemove.totalRewardAddedWei,
    stakingPoolStatsBeforeRemove.totalRevokedRewardWei,
    stakingPoolStatsBeforeRemove.totalUnstakedRewardBeforeMatureWei,
    stakingPoolStatsBeforeRemove.totalRewardRemovedWei,
  );
  const expectedPoolRemainingRewardWeiBeforeRemove =
    computePoolRemainingRewardWei(
      expectedPoolRewardWeiBeforeRemove,
      stakingPoolStatsBeforeRemove.rewardToBeDistributedWei,
    );

  const expectRemoveRewardTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);
  await testHelpers.setTimeNextBlock(expectRemoveRewardTimestamp.toNumber());

  if (stakeEvent.hasPermissionToRemoveReward) {
    if (
      expectedPoolRemainingRewardWeiBeforeRemove.gt(hre.ethers.constants.Zero)
    ) {
      await expect(
        stakingServiceContractInstance
          .connect(signerAccount)
          .removeUnallocatedStakingPoolReward(poolId),
      )
        .to.emit(stakingServiceContractInstance, "StakingPoolRewardRemoved")
        .withArgs(
          poolId,
          signerAddress,
          stakeEvent.adminWalletAddress,
          rewardTokenContractInstance.address,
          expectedPoolRemainingRewardWeiBeforeRemove,
        );
    } else {
      await expect(
        stakingServiceContractInstance
          .connect(signerAccount)
          .removeUnallocatedStakingPoolReward(poolId),
      ).to.be.revertedWith("SSvcs2: no unallocated");
    }
  } else {
    await expect(
      stakingServiceContractInstance
        .connect(signerAccount)
        .removeUnallocatedStakingPoolReward(poolId),
    ).to.be.revertedWith(
      `AccessControl: account ${signerAddress.toLowerCase()} is missing role ${
        testHelpers.CONTRACT_ADMIN_ROLE
      }`,
    );
  }

  const expectContractWeiBalanceOfRewardAfterRemove =
    stakeEvent.hasPermissionToRemoveReward
      ? contractWeiBalanceOfRewardBeforeRemove.sub(
          expectedPoolRemainingRewardWeiBeforeRemove,
        )
      : contractWeiBalanceOfRewardBeforeRemove;

  const expectSignerWeiBalanceOfRewardAfterRemove =
    stakeEvent.hasPermissionToRemoveReward &&
    signerAddress === stakeEvent.adminWalletAddress
      ? signerWeiBalanceOfRewardBeforeRemove.add(
          expectedPoolRemainingRewardWeiBeforeRemove,
        )
      : signerWeiBalanceOfRewardBeforeRemove;

  console.log(
    `removeUnallocatedStakingPoolRewardWithVerify: expectSignerWeiBalanceOfRewardAfterRemove=${expectSignerWeiBalanceOfRewardAfterRemove}`,
  );

  const expectAdminWalletWeiBalanceOfRewardAfterRemove =
    stakeEvent.hasPermissionToRemoveReward
      ? adminWalletWeiBalanceOfRewardBeforeRemove.add(
          expectedPoolRemainingRewardWeiBeforeRemove,
        )
      : adminWalletWeiBalanceOfRewardBeforeRemove;

  const expectTotalRewardRemovedWeiAfterRemove =
    stakeEvent.hasPermissionToRemoveReward
      ? stakingPoolStatsBeforeRemove.totalRewardRemovedWei.add(
          expectedPoolRemainingRewardWeiBeforeRemove,
        )
      : stakingPoolStatsBeforeRemove.totalRewardRemovedWei;

  const expectedPoolRewardWeiAfterRemove = computePoolRewardWei(
    stakingPoolStatsBeforeRemove.totalRewardAddedWei,
    stakingPoolStatsBeforeRemove.totalRevokedRewardWei,
    stakingPoolStatsBeforeRemove.totalUnstakedRewardBeforeMatureWei,
    expectTotalRewardRemovedWeiAfterRemove,
  );

  const expectedPoolRemainingRewardWeiAfterRemove =
    computePoolRemainingRewardWei(
      expectedPoolRewardWeiAfterRemove,
      stakingPoolStatsBeforeRemove.rewardToBeDistributedWei,
    );

  const expectedPoolSizeWeiAfterRemove = computePoolSizeWei(
    stakeDurationDays,
    poolAprWei,
    expectedPoolRewardWeiAfterRemove,
    stakeTokenDecimals,
  );

  const contractDecimalsBalanceOfRewardAfterRemove =
    await rewardTokenContractInstance.balanceOf(
      stakingServiceContractInstance.address,
    );
  expect(contractDecimalsBalanceOfRewardAfterRemove).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectContractWeiBalanceOfRewardAfterRemove,
      rewardTokenDecimals,
    ),
  );

  const signerDecimalsBalanceOfRewardAfterRemove =
    await rewardTokenContractInstance.balanceOf(signerAddress);

  console.log(
    `removeUnallocatedStakingPoolRewardWithVerify: signerDecimalsBalanceOfRewardAfterRemove=${signerDecimalsBalanceOfRewardAfterRemove}, expectSignerWeiBalanceOfRewardAfterRemove=${expectSignerWeiBalanceOfRewardAfterRemove}, rewardTokenDecimals=${rewardTokenDecimals}`,
  );

  expect(signerDecimalsBalanceOfRewardAfterRemove).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectSignerWeiBalanceOfRewardAfterRemove,
      rewardTokenDecimals,
    ),
  );

  const adminWalletDecimalsBalanceOfRewardAfterRemove =
    await rewardTokenContractInstance.balanceOf(stakeEvent.adminWalletAddress);
  expect(adminWalletDecimalsBalanceOfRewardAfterRemove).to.equal(
    testHelpers.scaleWeiToDecimals(
      expectAdminWalletWeiBalanceOfRewardAfterRemove,
      rewardTokenDecimals,
    ),
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterRemove,
  );

  const stakingPoolStatsAfterRemove = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    poolId,
    {
      isOpen: stakingPoolStatsBeforeRemove.isOpen,
      isActive: stakingPoolStatsBeforeRemove.isActive,
      poolRemainingRewardWei: expectedPoolRemainingRewardWeiAfterRemove,
      poolRewardAmountWei: expectedPoolRewardWeiAfterRemove,
      poolSizeWei: expectedPoolSizeWeiAfterRemove,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeRemove.rewardToBeDistributedWei,
      totalRevokedRewardWei: stakingPoolStatsBeforeRemove.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeRemove.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeRemove.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolStatsBeforeRemove.totalRewardAddedWei,
      totalRewardClaimedWei: stakingPoolStatsBeforeRemove.totalRewardClaimedWei,
      totalRewardRemovedWei: expectTotalRewardRemovedWeiAfterRemove,
      totalStakedWei: stakingPoolStatsBeforeRemove.totalStakedWei,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeRemove.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeRemove.totalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        stakingPoolStatsBeforeRemove.totalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeRemove.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeRemove.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeRemove.totalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterRemove,
  );

  return expectContractWeiBalanceOfRewardAfterRemove;
}

async function revokeWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  startblockTimestamp,
  revoker,
  stakeEvent,
  expectStakeInfosBeforeRevoke,
  expectStakeInfosAfterRevoke,
  expectStakingPoolStatsBeforeRevoke,
  expectStakingPoolStatsAfterRevoke,
) {
  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
  const revokerAddress = await revoker.getAddress();

  console.log(
    `\nrevokeWithVerify: currentBlockTimestamp=${currentBlockTimestamp}, poolUuid=${
      stakingPoolConfigs[stakeEvent.poolIndex].poolUuid
    }, poolId=${stakingPoolConfigs[stakeEvent.poolIndex].poolId}, eventSecondsAfterStartblockTimestamp=${
      stakeEvent.eventSecondsAfterStartblockTimestamp
    }, signer=${stakeEvent.signerAddress}, revoker=${revokerAddress}`,
  );

  const expectStakeInfoBeforeRevoke = expectStakeInfosBeforeRevoke.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const expectClaimableRewardWeiBeforeRevoke = calculateClaimableRewardWei(
    expectStakeInfoBeforeRevoke.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeRevoke.rewardClaimedWei,
    expectStakeInfoBeforeRevoke.stakeMaturitySecondsAfterStartblockTimestamp,
    hre.ethers.BigNumber.from(currentBlockTimestamp).sub(startblockTimestamp),
    expectStakeInfoBeforeRevoke.unstakeTimestamp,
  );

  const getClaimableRewardWeiBeforeRevoke =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(getClaimableRewardWeiBeforeRevoke).to.equal(
    expectClaimableRewardWeiBeforeRevoke,
  );

  const stakeInfoBeforeRevoke = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    expectStakeInfoBeforeRevoke,
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeRevoke,
  );

  const stakingPoolStatsBeforeRevoke = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    expectStakingPoolStatsBeforeRevoke.get(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    ),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeRevoke,
  );

  const expectRevokeTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);
  await testHelpers.setTimeNextBlock(expectRevokeTimestamp.toNumber());

  const expectRevokedStakeAmountWei = calculateRevokedStakeAmountWei(
    expectStakeInfoBeforeRevoke.stakeAmountWei,
    expectStakeInfoBeforeRevoke.unstakeAmountWei,
    hre.ethers.BigNumber.from(
      expectStakeInfoBeforeRevoke.withdrawUnstakeSecondsAfterStartblockTimestamp,
    ).gt(hre.ethers.constants.Zero),
    hre.ethers.BigNumber.from(expectStakeInfoBeforeRevoke.unstakeAmountWei).gt(
      hre.ethers.constants.Zero,
    ) ||
      hre.ethers.BigNumber.from(
        expectStakeInfoBeforeRevoke.unstakePenaltyAmountWei,
      ).gt(hre.ethers.constants.Zero),
  );

  const expectRevokedRewardAmountWei = calculateRevokedRewardAmountWei(
    expectStakeInfoBeforeRevoke.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeRevoke.rewardClaimedWei,
    expectStakeInfoBeforeRevoke.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    expectStakeInfoBeforeRevoke.unstakeSecondsAfterStartblockTimestamp,
  );

  const contractBalanceOfBeforeRevoke = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);
  const signerBalanceOfBeforeRevoke = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);

  await expect(
    stakingServiceContractInstance
      .connect(revoker)
      .revokeStake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.signerAddress,
        stakeEvent.stakeId,
      ),
  )
    .to.emit(stakingServiceContractInstance, "StakeRevoked")
    .withArgs(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
      stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenInstance.address,
      expectRevokedStakeAmountWei,
      stakingPoolConfigs[stakeEvent.poolIndex].rewardTokenInstance.address,
      expectRevokedRewardAmountWei,
      revokerAddress,
    );

  const signerBalanceOfAfterRevoke = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);
  const contractBalanceOfAfterRevoke = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);

  expect(contractBalanceOfAfterRevoke).to.equal(contractBalanceOfBeforeRevoke);
  expect(signerBalanceOfAfterRevoke).to.equal(signerBalanceOfBeforeRevoke);

  const expectClaimableRewardWeiAfterRevoke = hre.ethers.constants.Zero;
  const expectPoolRewardWeiAfterRevoke = computePoolRewardWei(
    stakingPoolStatsBeforeRevoke.totalRewardAddedWei,
    stakingPoolStatsBeforeRevoke.totalRevokedRewardWei.add(
      expectRevokedRewardAmountWei,
    ),
    stakingPoolStatsBeforeRevoke.totalUnstakedRewardBeforeMatureWei,
    stakingPoolStatsBeforeRevoke.totalRewardRemovedWei,
  );
  const expectPoolRemainingRewardWeiAfterRevoke = computePoolRemainingRewardWei(
    expectPoolRewardWeiAfterRevoke,
    stakingPoolStatsBeforeRevoke.rewardToBeDistributedWei,
  );
  const expectPoolSizeWeiAfterRevoke = computePoolSizeWei(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWeiAfterRevoke,
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals,
  );

  const claimableRewardWeiAfterRevoke =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(claimableRewardWeiAfterRevoke).to.equal(
    expectClaimableRewardWeiAfterRevoke,
  );

  const expectStakeInfoAfterRevoke = expectStakeInfosAfterRevoke.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const stakeInfoAfterRevoke = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    {
      estimatedRewardAtMaturityWei:
        expectStakeInfoBeforeRevoke.estimatedRewardAtMaturityWei,
      revokedRewardAmountWei: expectRevokedRewardAmountWei,
      revokedStakeAmountWei: expectRevokedStakeAmountWei,
      revokeSecondsAfterStartblockTimestamp:
        expectRevokeTimestamp.sub(startblockTimestamp),
      rewardClaimedWei: expectStakeInfoBeforeRevoke.rewardClaimedWei,
      stakeAmountWei: expectStakeInfoBeforeRevoke.stakeAmountWei,
      stakeMaturitySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeRevoke.stakeMaturitySecondsAfterStartblockTimestamp,
      stakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeRevoke.stakeSecondsAfterStartblockTimestamp,
      unstakeAmountWei: expectStakeInfoBeforeRevoke.unstakeAmountWei,
      unstakeCooldownExpirySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeRevoke.unstakeCooldownExpirySecondsAfterStartblockTimestamp,
      unstakePenaltyAmountWei:
        expectStakeInfoBeforeRevoke.unstakePenaltyAmountWei,
      unstakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeRevoke.unstakeSecondsAfterStartblockTimestamp,
      withdrawUnstakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeRevoke.withdrawUnstakeSecondsAfterStartblockTimestamp,
      isActive: true,
      isInitialized: true,
    },
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterRevoke,
  );

  const stakingPoolStatsAfterRevoke = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    {
      isOpen: stakingPoolStatsBeforeRevoke.isOpen,
      isActive: stakingPoolStatsBeforeRevoke.isActive,
      poolRemainingRewardWei: expectPoolRemainingRewardWeiAfterRevoke,
      poolRewardAmountWei: expectPoolRewardWeiAfterRevoke,
      poolSizeWei: expectPoolSizeWeiAfterRevoke,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeRevoke.rewardToBeDistributedWei,
      totalRevokedRewardWei:
        stakingPoolStatsBeforeRevoke.totalRevokedRewardWei.add(
          expectRevokedRewardAmountWei,
        ),
      totalRevokedStakeWei:
        stakingPoolStatsBeforeRevoke.totalRevokedStakeWei.add(
          expectRevokedStakeAmountWei,
        ),
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeRevoke.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolStatsBeforeRevoke.totalRewardAddedWei,
      totalRewardClaimedWei: stakingPoolStatsBeforeRevoke.totalRewardClaimedWei,
      totalRewardRemovedWei: stakingPoolStatsBeforeRevoke.totalRewardRemovedWei,
      totalStakedWei: stakingPoolStatsBeforeRevoke.totalStakedWei,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeRevoke.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeRevoke.totalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        stakingPoolStatsBeforeRevoke.totalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeRevoke.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeRevoke.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeRevoke.totalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterRevoke,
  );

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .stake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
        hre.ethers.utils.parseEther("1.0"),
      ),
  ).to.be.revertedWith("SSvcs2: stake exists");

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .unstake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  ).to.be.revertedWith("SSvcs2: revoked");

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .claimReward(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  ).to.be.revertedWith("SSvcs2: revoked");

  console.log(
    `revokeWithVerify: expectRevokedStakeAmountWei=${expectRevokedStakeAmountWei}, expectRevokedRewardAmountWei=${expectRevokedRewardAmountWei}`,
  );
}

async function setupRevokeStakeEnvironment(
  stakingServiceInstance,
  stakingPoolConfig,
  stakeId,
  stakeAmountWei,
  rewardClaimedWei,
  expectStakeSecondsAfterCurrentBlockTimestamp,
  expectUnstakeSecondsAfterCurrentBlockTimestamp,
  expectRevokeStakeSecondsAfterCurrentBlockTimestamp,
  contractAdminAccount,
  enduserAccount,
  fromWalletAccount,
) {
  const poolId = stakingPoolConfig.poolId;
  const contractAdminAddress = await contractAdminAccount.getAddress();
  const enduserAddress = await enduserAccount.getAddress();

  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
  const expectStakeTimestamp =
    currentBlockTimestamp + expectStakeSecondsAfterCurrentBlockTimestamp;
  const expectUnstakeTimestamp =
    expectUnstakeSecondsAfterCurrentBlockTimestamp > 0
      ? currentBlockTimestamp + expectUnstakeSecondsAfterCurrentBlockTimestamp
      : hre.ethers.constants.Zero;
  const expectRevokeTimestamp =
    currentBlockTimestamp + expectRevokeStakeSecondsAfterCurrentBlockTimestamp;

  const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
    stakingPoolConfig.stakeDurationDays,
    expectStakeTimestamp,
  );

  const expectRewardAtMaturityWei = computeTruncatedAmountWei(
    estimateRewardAtMaturityWei(
      stakingPoolConfig.poolAprWei,
      stakingPoolConfig.stakeDurationDays,
      stakeAmountWei,
    ),
    stakingPoolConfig.rewardTokenDecimals,
  );

  const expectRevokedRewardAmountWei = calculateRevokedRewardAmountWei(
    expectRewardAtMaturityWei,
    rewardClaimedWei,
    expectStakeMaturityTimestamp,
    expectRevokeTimestamp,
    expectUnstakeTimestamp,
  );

  await setupStakeEnvironment(
    stakingServiceInstance,
    stakingPoolConfig,
    stakeId,
    stakeAmountWei,
    expectStakeTimestamp,
    enduserAccount,
    fromWalletAccount,
  );

  await testHelpers.setTimeNextBlock(expectRevokeTimestamp);

  await expect(
    stakingServiceInstance
      .connect(contractAdminAccount)
      .revokeStake(poolId, enduserAddress, stakeId),
  )
    .to.emit(stakingServiceInstance, "StakeRevoked")
    .withArgs(
      poolId,
      enduserAddress,
      stakeId,
      stakingPoolConfig.stakeTokenInstance.address,
      stakeAmountWei,
      stakingPoolConfig.rewardTokenInstance.address,
      expectRevokedRewardAmountWei,
      contractAdminAddress,
    );
}

async function setupStakeEnvironment(
  stakingServiceInstance,
  stakingPoolConfig,
  stakeId,
  stakeAmountWei,
  expectStakeTimestamp,
  enduserAccount,
  fromWalletAccount,
) {
  const poolId = stakingPoolConfig.poolId;
  const enduserAddress = await enduserAccount.getAddress();
  const fromWalletAddress = await fromWalletAccount.getAddress();
  const rewardTokenInstance = stakingPoolConfig.rewardTokenInstance;
  const stakeTokenInstance = stakingPoolConfig.stakeTokenInstance;

  const expectRewardAtMaturityWei = computeTruncatedAmountWei(
    estimateRewardAtMaturityWei(
      stakingPoolConfig.poolAprWei,
      stakingPoolConfig.stakeDurationDays,
      stakeAmountWei,
    ),
    stakingPoolConfig.rewardTokenDecimals,
  );

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

  const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
    stakingPoolConfig.stakeDurationDays,
    expectStakeTimestamp,
  );

  await testHelpers.setTimeNextBlock(expectStakeTimestamp);

  await expect(
    stakingServiceInstance
      .connect(enduserAccount)
      .stake(poolId, stakeId, stakeAmountWei),
  )
    .to.emit(stakingServiceInstance, "Staked")
    .withArgs(
      poolId,
      enduserAddress,
      stakeId,
      stakeTokenInstance.address,
      stakeAmountWei,
      expectStakeTimestamp,
      expectStakeMaturityTimestamp,
      expectRewardAtMaturityWei,
    );
}

async function setupSuspendStakeEnvironment(
  stakingServiceInstance,
  stakingPoolConfig,
  stakeId,
  stakeAmountWei,
  expectStakeSecondsAfterCurrentBlockTimestamp,
  contractAdminAccount,
  enduserAccount,
  fromWalletAccount,
) {
  const poolId = stakingPoolConfig.poolId;
  const contractAdminAddress = await contractAdminAccount.getAddress();
  const enduserAddress = await enduserAccount.getAddress();

  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
  const expectStakeTimestamp =
    currentBlockTimestamp + expectStakeSecondsAfterCurrentBlockTimestamp;

  await setupStakeEnvironment(
    stakingServiceInstance,
    stakingPoolConfig,
    stakeId,
    stakeAmountWei,
    expectStakeTimestamp,
    enduserAccount,
    fromWalletAccount,
  );

  await expect(
    stakingServiceInstance
      .connect(contractAdminAccount)
      .suspendStake(poolId, enduserAddress, stakeId),
  )
    .to.emit(stakingServiceInstance, "StakeSuspended")
    .withArgs(poolId, enduserAddress, stakeId, contractAdminAddress);
}

async function setupUnstakeEnvironment(
  stakingServiceInstance,
  stakingPoolConfig,
  stakeId,
  stakeAmountWei,
  expectStakeSecondsAfterCurrentBlockTimestamp,
  expectUnstakeSecondsAfterCurrentBlockTimestamp,
  enduserAccount,
  fromWalletAccount,
) {
  const poolId = stakingPoolConfig.poolId;
  const enduserAddress = await enduserAccount.getAddress();
  const stakeTokenInstance = stakingPoolConfig.stakeTokenInstance;

  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();
  const expectStakeTimestamp =
    currentBlockTimestamp + expectStakeSecondsAfterCurrentBlockTimestamp;
  const expectUnstakeTimestamp =
    currentBlockTimestamp + expectUnstakeSecondsAfterCurrentBlockTimestamp;

  const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
    stakingPoolConfig.stakeDurationDays,
    expectStakeTimestamp,
  );

  const isStakeMaturedAtUnstake = isStakeMatured(
    expectStakeMaturityTimestamp,
    expectUnstakeTimestamp,
    expectUnstakeTimestamp,
  );

  const expectUnstakePenaltyAmountWei = calculateUnstakePenaltyWei(
    stakeAmountWei,
    stakingPoolConfig.earlyUnstakePenaltyPercentWei,
    expectStakeMaturityTimestamp,
    expectUnstakeTimestamp,
    expectUnstakeTimestamp,
  );

  const expectUnstakeAmountWei = calculateUnstakeAmountWei(
    stakeAmountWei,
    stakingPoolConfig.earlyUnstakePenaltyPercentWei,
    expectStakeMaturityTimestamp,
    expectUnstakeTimestamp,
    expectUnstakeTimestamp,
  );

  const expectUnstakeCooldownExpiryTimestamp = isStakeMaturedAtUnstake
    ? expectUnstakeTimestamp
    : calculateCooldownExpiryTimestamp(
        stakingPoolConfig.earlyUnstakeCooldownPeriodDays,
        expectUnstakeTimestamp,
      );

  await setupStakeEnvironment(
    stakingServiceInstance,
    stakingPoolConfig,
    stakeId,
    stakeAmountWei,
    expectStakeTimestamp,
    enduserAccount,
    fromWalletAccount,
  );

  await testHelpers.setTimeNextBlock(expectUnstakeTimestamp);

  await expect(
    stakingServiceInstance.connect(enduserAccount).unstake(poolId, stakeId),
  )
    .to.emit(stakingServiceInstance, "Unstaked")
    .withArgs(
      poolId,
      enduserAddress,
      stakeId,
      stakeTokenInstance.address,
      stakingPoolConfig.earlyUnstakePenaltyPercentWei,
      stakeAmountWei,
      expectUnstakeAmountWei,
      expectUnstakePenaltyAmountWei,
      stakingPoolConfig.earlyUnstakeCooldownPeriodDays,
      expectUnstakeCooldownExpiryTimestamp,
    );
}

async function stakeWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  bankSigner,
  startblockTimestamp,
  stakeEvent,
  expectStakeInfosBeforeStake,
  expectStakeInfosAfterStake,
  expectStakingPoolStatsBeforeStake,
  expectStakingPoolStatsAfterStake,
) {
  const {
    expectStakeAmountWei,
    expectStakeTimestamp,
    expectStakeMaturityTimestamp,
    expectRewardAtMaturityWei,
    additionalRewardToDistributeWei,
    actualStakeAmountWei,
  } = verifyRewardAtMaturity(
    stakingPoolConfigs[stakeEvent.poolIndex],
    stakeEvent,
    startblockTimestamp,
    30,
    hre.ethers.constants.One,
  );

  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  console.log(
    `\nstakeWithVerify: currentBlockTimestamp=${currentBlockTimestamp}, poolUuid=${
      stakingPoolConfigs[stakeEvent.poolIndex].poolUuid
    }, poolId=${stakingPoolConfigs[stakeEvent.poolIndex].poolId}, stakeAmountWei=${
      stakeEvent.stakeAmountWei
    }, eventSecondsAfterStartblockTimestamp=${
      stakeEvent.eventSecondsAfterStartblockTimestamp
    }, signer=${stakeEvent.signerAddress}, stakeId=${
      stakeEvent.stakeId
    }, stakeExceedPoolReward=${stakeEvent.stakeExceedPoolReward}`,
  );

  await expect(
    stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    ),
  ).to.be.revertedWith("SSvcs2: uninitialized stake");

  await expect(
    stakingServiceContractInstance.getStakeInfo(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    ),
  ).to.be.revertedWith("SSvcs2: uninitialized stake");

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeStake,
  );

  const stakingPoolStatsBeforeStake = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    expectStakingPoolStatsBeforeStake.get(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    ),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeStake,
  );

  await testHelpers.transferAndApproveWithVerify(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenInstance,
    bankSigner,
    stakeEvent.signer,
    stakingServiceContractInstance.address,
    expectStakeAmountWei,
  );

  await testHelpers.setTimeNextBlock(expectStakeTimestamp.toNumber());

  const expectTotalStakedWeiAfterStake = stakeEvent.stakeExceedPoolReward
    ? hre.ethers.BigNumber.from(stakingPoolStatsBeforeStake.totalStakedWei)
    : hre.ethers.BigNumber.from(stakingPoolStatsBeforeStake.totalStakedWei).add(
        expectStakeAmountWei,
      );
  const expectRewardToBeDistributedWeiAfterStake =
    stakeEvent.stakeExceedPoolReward
      ? hre.ethers.BigNumber.from(
          stakingPoolStatsBeforeStake.rewardToBeDistributedWei,
        )
      : hre.ethers.BigNumber.from(
          stakingPoolStatsBeforeStake.rewardToBeDistributedWei,
        ).add(additionalRewardToDistributeWei);

  const contractBalanceOfBeforeStake = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);
  const signerBalanceOfBeforeStake = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);

  if (stakeEvent.stakeExceedPoolReward) {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .stake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
          actualStakeAmountWei,
        ),
    ).to.be.revertedWith("SSvcs2: insufficient");

    const signerBalanceOfAfterStake = await stakingPoolConfigs[
      stakeEvent.poolIndex
    ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);
    const contractBalanceOfAfterStake = await stakingPoolConfigs[
      stakeEvent.poolIndex
    ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);

    expect(contractBalanceOfAfterStake).to.equal(contractBalanceOfBeforeStake);
    expect(signerBalanceOfAfterStake).to.equal(signerBalanceOfBeforeStake);
  } else {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .stake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
          actualStakeAmountWei,
        ),
    )
      .to.emit(stakingServiceContractInstance, "Staked")
      .withArgs(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.signerAddress,
        stakeEvent.stakeId,
        stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenInstance.address,
        expectStakeAmountWei,
        expectStakeTimestamp,
        expectStakeMaturityTimestamp,
        expectRewardAtMaturityWei,
      );

    const signerBalanceOfAfterStake = await stakingPoolConfigs[
      stakeEvent.poolIndex
    ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);
    const contractBalanceOfAfterStake = await stakingPoolConfigs[
      stakeEvent.poolIndex
    ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);

    expect(contractBalanceOfAfterStake).to.equal(
      contractBalanceOfBeforeStake.add(expectStakeAmountWei),
    );
    expect(signerBalanceOfAfterStake).to.equal(
      signerBalanceOfBeforeStake.sub(expectStakeAmountWei),
    );
  }

  const expectPoolRewardWeiAfterStake = computePoolRewardWei(
    stakingPoolStatsBeforeStake.totalRewardAddedWei,
    stakingPoolStatsBeforeStake.totalRevokedRewardWei,
    stakingPoolStatsBeforeStake.totalUnstakedRewardBeforeMatureWei,
    stakingPoolStatsBeforeStake.totalRewardRemovedWei,
  );
  const expectPoolRemainingRewardWeiAfterStake = computePoolRemainingRewardWei(
    expectPoolRewardWeiAfterStake,
    expectRewardToBeDistributedWeiAfterStake,
  );
  const expectPoolSizeWeiAfterStake = computePoolSizeWei(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWeiAfterStake,
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals,
  );

  if (!stakeEvent.stakeExceedPoolReward) {
    const claimableRewardWeiAfterStake =
      await stakingServiceContractInstance.getClaimableRewardWei(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.signerAddress,
        stakeEvent.stakeId,
      );
    expect(claimableRewardWeiAfterStake).to.equal(hre.ethers.constants.Zero);
  }

  const stakeInfoAfterStake = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    {
      estimatedRewardAtMaturityWei: expectRewardAtMaturityWei,
      revokedRewardAmountWei: hre.ethers.constants.Zero,
      revokedStakeAmountWei: hre.ethers.constants.Zero,
      revokeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      rewardClaimedWei: hre.ethers.constants.Zero,
      stakeAmountWei: expectStakeAmountWei,
      stakeMaturitySecondsAfterStartblockTimestamp:
        expectStakeMaturityTimestamp.sub(startblockTimestamp),
      stakeSecondsAfterStartblockTimestamp:
        expectStakeTimestamp.sub(startblockTimestamp),
      unstakeAmountWei: hre.ethers.constants.Zero,
      unstakeCooldownExpirySecondsAfterStartblockTimestamp:
        hre.ethers.constants.Zero,
      unstakePenaltyAmountWei: hre.ethers.constants.Zero,
      unstakeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      withdrawUnstakeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      isActive: true,
      isInitialized: !stakeEvent.stakeExceedPoolReward,
    },
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterStake,
  );

  const stakingPoolStatsAfterStake = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    {
      isOpen: stakingPoolStatsBeforeStake.isOpen,
      isActive: stakingPoolStatsBeforeStake.isActive,
      poolRemainingRewardWei: expectPoolRemainingRewardWeiAfterStake,
      poolRewardAmountWei: expectPoolRewardWeiAfterStake,
      poolSizeWei: expectPoolSizeWeiAfterStake,
      rewardToBeDistributedWei: expectRewardToBeDistributedWeiAfterStake,
      totalRevokedRewardWei: stakingPoolStatsBeforeStake.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeStake.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeStake.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolStatsBeforeStake.totalRewardAddedWei,
      totalRewardClaimedWei: stakingPoolStatsBeforeStake.totalRewardClaimedWei,
      totalRewardRemovedWei: stakingPoolStatsBeforeStake.totalRewardRemovedWei,
      totalStakedWei: expectTotalStakedWeiAfterStake,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeStake.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeStake.totalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        stakingPoolStatsBeforeStake.totalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeStake.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeStake.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeStake.totalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterStake,
  );

  if (stakeEvent.stakeExceedPoolReward) {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .claimReward(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: uninitialized stake");

    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .unstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: uninitialized stake");

    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .withdrawUnstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: uninitialized stake");
  } else {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .claimReward(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: not mature");

    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .stake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
          actualStakeAmountWei,
        ),
    ).to.be.revertedWith("SSvcs2: stake exists");

    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .withdrawUnstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: not unstake");
  }

  console.log(
    `stakeWithVerify: expectTotalStakedWeiAfterStake=${expectTotalStakedWeiAfterStake}, expectRewardToBeDistributedWeiAfterStake=${expectRewardToBeDistributedWeiAfterStake}`,
  );
}

async function testAddStakingPoolReward(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  stakeEvents,
  previousExpectStakeInfos,
  previousExpectStakingPoolStats,
  balanceOfStakingPoolRewards,
) {
  const stakeInfos = [];
  stakeInfos.push(previousExpectStakeInfos);

  const stakingPoolStats = [];
  stakingPoolStats.push(previousExpectStakingPoolStats);

  let prevExpectStakeInfos = previousExpectStakeInfos;
  let prevExpectStakingPoolStats = previousExpectStakingPoolStats;

  for (let i = 0; i < stakeEvents.length; i++) {
    const { nextExpectStakeInfos, nextExpectStakingPoolStats } =
      getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[i],
        stakeEvents[i],
        null,
        stakingPoolConfigs,
        prevExpectStakeInfos,
        prevExpectStakingPoolStats,
      );

    stakeInfos.push(nextExpectStakeInfos);
    stakingPoolStats.push(nextExpectStakingPoolStats);

    prevExpectStakeInfos = nextExpectStakeInfos;
    prevExpectStakingPoolStats = nextExpectStakingPoolStats;
  }

  const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  for (let i = 0; i < stakeEvents.length; i++) {
    const poolIndex = i % stakingPoolConfigs.length;

    balanceOfStakingPoolRewards[
      stakingPoolConfigs[poolIndex].rewardTokenInstance.address
    ] = await addStakingPoolRewardWithVerify(
      stakingServiceContractInstance,
      stakingPoolConfigs,
      startblockTimestamp,
      stakeEvents[i],
      stakeInfos[i],
      stakeInfos[i + 1],
      stakingPoolStats[i],
      stakingPoolStats[i + 1],
    );
  }

  return {
    nextExpectStakeInfos: stakeInfos[stakeInfos.length - 1],
    nextExpectStakingPoolStats: stakingPoolStats[stakingPoolStats.length - 1],
  };
}

async function testRemoveStakingPoolReward(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  stakeEvents,
  previousExpectStakeInfos,
  previousExpectStakingPoolStats,
  balanceOfStakingPoolRewards,
) {
  const stakeInfos = [];
  stakeInfos.push(previousExpectStakeInfos);

  const stakingPoolStats = [];
  stakingPoolStats.push(previousExpectStakingPoolStats);

  let prevExpectStakeInfos = previousExpectStakeInfos;
  let prevExpectStakingPoolStats = previousExpectStakingPoolStats;

  for (let i = 0; i < stakeEvents.length; i++) {
    const { nextExpectStakeInfos, nextExpectStakingPoolStats } =
      getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[i],
        stakeEvents[i],
        null,
        stakingPoolConfigs,
        prevExpectStakeInfos,
        prevExpectStakingPoolStats,
      );

    stakeInfos.push(nextExpectStakeInfos);
    stakingPoolStats.push(nextExpectStakingPoolStats);

    prevExpectStakeInfos = nextExpectStakeInfos;
    prevExpectStakingPoolStats = nextExpectStakingPoolStats;
  }

  const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  for (let i = 0; i < stakeEvents.length; i++) {
    const poolIndex = i % stakingPoolConfigs.length;

    console.log(`${i} testRemoveStakingPoolReward: poolIndex=${poolIndex}`);

    balanceOfStakingPoolRewards[
      stakingPoolConfigs[poolIndex].rewardTokenInstance.address
    ] = await removeUnallocatedStakingPoolRewardWithVerify(
      stakingServiceContractInstance,
      stakingPoolConfigs,
      startblockTimestamp,
      stakeEvents[i],
      stakeInfos[i],
      stakeInfos[i + 1],
      stakingPoolStats[i],
      stakingPoolStats[i + 1],
    );
  }

  return {
    nextExpectStakeInfos: stakeInfos[stakeInfos.length - 1],
    nextExpectStakingPoolStats: stakingPoolStats[stakingPoolStats.length - 1],
  };
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

async function testStakeClaimRevokeUnstakeWithdraw(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  bankSigner,
  revoker,
  stakeEvents,
  stakeInfos,
  stakingPoolStats,
) {
  const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  for (let i = 0; i < stakeEvents.length; i++) {
    switch (stakeEvents[i].eventType) {
      case "AddReward":
        console.log(`\n${i}: AddReward`);
        await addStakingPoolRewardWithVerify(
          stakingServiceContractInstance,
          stakingPoolConfigs,
          startblockTimestamp,
          stakeEvents[i],
          stakeInfos[i],
          stakeInfos[i + 1],
          stakingPoolStats[i],
          stakingPoolStats[i + 1],
        );
        break;
      case "Claim":
        console.log(`\n${i}: Claim`);
        await claimWithVerify(
          stakingServiceContractInstance,
          stakingPoolConfigs,
          startblockTimestamp,
          stakeEvents[i],
          stakeInfos[i],
          stakeInfos[i + 1],
          stakingPoolStats[i],
          stakingPoolStats[i + 1],
        );
        break;
      case "Revoke":
        console.log(`\n${i}: Revoke`);
        await revokeWithVerify(
          stakingServiceContractInstance,
          stakingPoolConfigs,
          startblockTimestamp,
          revoker,
          stakeEvents[i],
          stakeInfos[i],
          stakeInfos[i + 1],
          stakingPoolStats[i],
          stakingPoolStats[i + 1],
        );
        break;
      case "Stake":
        console.log(`\n${i}: Stake`);
        await stakeWithVerify(
          stakingServiceContractInstance,
          stakingPoolConfigs,
          bankSigner,
          startblockTimestamp,
          stakeEvents[i],
          stakeInfos[i],
          stakeInfos[i + 1],
          stakingPoolStats[i],
          stakingPoolStats[i + 1],
        );
        break;
      case "Unstake":
        console.log(`\n${i}: Unstake`);
        await unstakeWithVerify(
          stakingServiceContractInstance,
          stakingPoolConfigs,
          startblockTimestamp,
          stakeEvents[i],
          stakeInfos[i],
          stakeInfos[i + 1],
          stakingPoolStats[i],
          stakingPoolStats[i + 1],
        );
        break;
      case "Withdraw":
        console.log(`\n${i}: Withdraw`);
        await withdrawWithVerify(
          stakingServiceContractInstance,
          stakingPoolConfigs,
          startblockTimestamp,
          stakeEvents[i],
          stakeInfos[i],
          stakeInfos[i + 1],
          stakingPoolStats[i],
          stakingPoolStats[i + 1],
        );
        break;
      default:
        console.log(`\n${i}: Unknown event type ${stakeEvents[i].eventType}`);
        break;
    }
  }
}

async function unstakeWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  startblockTimestamp,
  stakeEvent,
  expectStakeInfosBeforeUnstake,
  expectStakeInfosAfterUnstake,
  expectStakingPoolStatsBeforeUnstake,
  expectStakingPoolStatsAfterUnstake,
) {
  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  console.log(
    `\nunstakeWithVerify: currentBlockTimestamp=${currentBlockTimestamp}, poolUuid=${
      stakingPoolConfigs[stakeEvent.poolIndex].poolUuid
    }, poolId=${stakingPoolConfigs[stakeEvent.poolIndex].poolId}, eventSecondsAfterStartblockTimestamp=${
      stakeEvent.eventSecondsAfterStartblockTimestamp
    }, signer=${stakeEvent.signerAddress}`,
  );

  const expectStakeInfoBeforeUnstake = expectStakeInfosBeforeUnstake.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const expectClaimableRewardWeiBeforeUnstake = calculateClaimableRewardWei(
    expectStakeInfoBeforeUnstake.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeUnstake.rewardClaimedWei,
    expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
    hre.ethers.BigNumber.from(currentBlockTimestamp).sub(startblockTimestamp),
    null,
  );

  const getClaimableRewardWeiBeforeUnstake =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(getClaimableRewardWeiBeforeUnstake).to.equal(
    expectClaimableRewardWeiBeforeUnstake,
  );

  const stakeInfoBeforeUnstake = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    expectStakeInfoBeforeUnstake,
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeUnstake,
  );

  const stakingPoolStatsBeforeUnstake = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    expectStakingPoolStatsBeforeUnstake.get(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    ),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeUnstake,
  );

  const expectUnstakeTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);
  await testHelpers.setTimeNextBlock(expectUnstakeTimestamp.toNumber());

  const isStakeMaturedAtUnstake = isStakeMatured(
    expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  const expectUnstakePenaltyAmountWei = calculateUnstakePenaltyWei(
    expectStakeInfoBeforeUnstake.stakeAmountWei,
    stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakePenaltyPercentWei,
    expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  const expectUnstakeAmountWei = calculateUnstakeAmountWei(
    expectStakeInfoBeforeUnstake.stakeAmountWei,
    stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakePenaltyPercentWei,
    expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  const expectUnstakeCooldownExpiryTimestamp = isStakeMaturedAtUnstake
    ? expectUnstakeTimestamp
    : hre.ethers.BigNumber.from(startblockTimestamp).add(
        calculateCooldownExpiryTimestamp(
          stakingPoolConfigs[stakeEvent.poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          stakeEvent.eventSecondsAfterStartblockTimestamp,
        ),
      );

  const contractBalanceOfBeforeUnstake = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);
  const signerBalanceOfBeforeUnstake = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .unstake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  )
    .to.emit(stakingServiceContractInstance, "Unstaked")
    .withArgs(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
      stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenInstance.address,
      stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakePenaltyPercentWei,
      expectStakeInfoBeforeUnstake.stakeAmountWei,
      expectUnstakeAmountWei,
      expectUnstakePenaltyAmountWei,
      isStakeMaturedAtUnstake
        ? hre.ethers.constants.Zero
        : stakingPoolConfigs[stakeEvent.poolIndex]
            .earlyUnstakeCooldownPeriodDays,
      expectUnstakeCooldownExpiryTimestamp,
    );

  const signerBalanceOfAfterUnstake = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);
  const contractBalanceOfAfterUnstake = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);

  expect(contractBalanceOfAfterUnstake).to.equal(
    contractBalanceOfBeforeUnstake,
  );
  expect(signerBalanceOfAfterUnstake).to.equal(signerBalanceOfBeforeUnstake);

  const expectClaimableRewardWeiAfterUnstake = calculateClaimableRewardWei(
    expectStakeInfoBeforeUnstake.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeUnstake.rewardClaimedWei,
    expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  const claimableRewardWeiAfterUnstake =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(claimableRewardWeiAfterUnstake).to.equal(
    expectClaimableRewardWeiAfterUnstake,
  );

  const stakeInfoAfterUnstake = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    {
      estimatedRewardAtMaturityWei:
        expectStakeInfoBeforeUnstake.estimatedRewardAtMaturityWei,
      revokedRewardAmountWei: hre.ethers.constants.Zero,
      revokedStakeAmountWei: hre.ethers.constants.Zero,
      revokeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      rewardClaimedWei: expectStakeInfoBeforeUnstake.rewardClaimedWei,
      stakeAmountWei: expectStakeInfoBeforeUnstake.stakeAmountWei,
      stakeMaturitySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
      stakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeUnstake.stakeSecondsAfterStartblockTimestamp,
      unstakeAmountWei: expectUnstakeAmountWei,
      unstakeCooldownExpirySecondsAfterStartblockTimestamp:
        expectUnstakeCooldownExpiryTimestamp.sub(startblockTimestamp),
      unstakePenaltyAmountWei: expectUnstakePenaltyAmountWei,
      unstakeSecondsAfterStartblockTimestamp:
        expectUnstakeTimestamp.sub(startblockTimestamp),
      withdrawUnstakeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      isActive: true,
      isInitialized: true,
    },
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterUnstake,
  );

  const expectPoolRewardWeiAfterUnstake = computePoolRewardWei(
    stakingPoolStatsBeforeUnstake.totalRewardAddedWei,
    stakingPoolStatsBeforeUnstake.totalRevokedRewardWei,
    stakingPoolStatsBeforeUnstake.totalUnstakedRewardBeforeMatureWei.add(
      isStakeMaturedAtUnstake
        ? hre.ethers.constants.Zero
        : expectStakeInfoBeforeUnstake.estimatedRewardAtMaturityWei,
    ),
    stakingPoolStatsBeforeUnstake.totalRewardRemovedWei,
  );
  const expectPoolRemainingRewardWeiAfterUnstake =
    computePoolRemainingRewardWei(
      expectPoolRewardWeiAfterUnstake,
      stakingPoolStatsBeforeUnstake.rewardToBeDistributedWei,
    );
  const expectPoolSizeWeiAfterUnstake = computePoolSizeWei(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWeiAfterUnstake,
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals,
  );

  const expectTotalUnstakedAfterMatureWei =
    stakingPoolStatsBeforeUnstake.totalUnstakedAfterMatureWei.add(
      isStakeMaturedAtUnstake
        ? expectUnstakeAmountWei
        : hre.ethers.constants.Zero,
    );
  const expectTotalUnstakedBeforeMatureWei =
    stakingPoolStatsBeforeUnstake.totalUnstakedBeforeMatureWei.add(
      isStakeMaturedAtUnstake
        ? hre.ethers.constants.Zero
        : expectUnstakeAmountWei,
    );
  const expectTotalUnstakedRewardBeforeMatureWei =
    stakingPoolStatsBeforeUnstake.totalUnstakedRewardBeforeMatureWei.add(
      isStakeMaturedAtUnstake
        ? hre.ethers.constants.Zero
        : expectStakeInfoBeforeUnstake.estimatedRewardAtMaturityWei,
    );
  const expectTotalUnstakePenaltyAmountWei =
    stakingPoolStatsBeforeUnstake.totalUnstakePenaltyAmountWei.add(
      expectUnstakePenaltyAmountWei,
    );

  const stakingPoolStatsAfterUnstake = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    {
      isOpen: stakingPoolStatsBeforeUnstake.isOpen,
      isActive: stakingPoolStatsBeforeUnstake.isActive,
      poolRemainingRewardWei: expectPoolRemainingRewardWeiAfterUnstake,
      poolRewardAmountWei: expectPoolRewardWeiAfterUnstake,
      poolSizeWei: expectPoolSizeWeiAfterUnstake,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeUnstake.rewardToBeDistributedWei,
      totalRevokedRewardWei:
        stakingPoolStatsBeforeUnstake.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeUnstake.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeUnstake.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolStatsBeforeUnstake.totalRewardAddedWei,
      totalRewardClaimedWei:
        stakingPoolStatsBeforeUnstake.totalRewardClaimedWei,
      totalRewardRemovedWei:
        stakingPoolStatsBeforeUnstake.totalRewardRemovedWei,
      totalStakedWei: stakingPoolStatsBeforeUnstake.totalStakedWei,
      totalUnstakedAfterMatureWei: expectTotalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei: expectTotalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        expectTotalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei: expectTotalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeUnstake.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeUnstake.totalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterUnstake,
  );

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .stake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
        hre.ethers.utils.parseEther("1.0"),
      ),
  ).to.be.revertedWith("SSvcs2: stake exists");

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .unstake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  ).to.be.revertedWith("SSvcs2: unstaked");

  console.log(
    `unstakeWithVerify: expectTotalUnstakedAfterMatureWei=${expectTotalUnstakedAfterMatureWei}, expectTotalUnstakedBeforeMatureWei=${expectTotalUnstakedBeforeMatureWei}, expectTotalUnstakePenaltyAmountWei=${expectTotalUnstakePenaltyAmountWei}`,
  );
}

function updateExpectStakeInfoAfterClaim(
  triggerStakeEvent,
  updateStakeEvent,
  unstakeStakeEvent,
  stakingPoolConfigs,
  expectStakeInfoAfterTriggerStakeEvent,
) {
  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
    stakingPoolConfigs[updateStakeEvent.poolIndex].poolAprWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
    truncatedStakeAmountWei,
  ).toString();

  expectStakeInfoAfterTriggerStakeEvent.rewardClaimedWei =
    calculateClaimableRewardWei(
      estimatedRewardAtMaturityWei,
      hre.ethers.constants.Zero,
      stakeMaturitySecondsAfterStartblockTimestamp,
      triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
      unstakeStakeEvent == null
        ? triggerStakeEvent.eventSecondsAfterStartblockTimestamp
        : unstakeStakeEvent.eventSecondsAfterStartblockTimestamp,
    ).toString();
}

function updateExpectStakeInfoAfterRevoke(
  triggerStakeEvent,
  updateStakeEvent,
  expectStakeInfoAfterTriggerStakeEvent,
) {
  expectStakeInfoAfterTriggerStakeEvent.revokedRewardAmountWei =
    calculateRevokedRewardAmountWei(
      expectStakeInfoAfterTriggerStakeEvent.estimatedRewardAtMaturityWei,
      expectStakeInfoAfterTriggerStakeEvent.rewardClaimedWei,
      expectStakeInfoAfterTriggerStakeEvent.stakeMaturitySecondsAfterStartblockTimestamp,
      triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
      expectStakeInfoAfterTriggerStakeEvent.unstakeSecondsAfterStartblockTimestamp,
    ).toString();
  expectStakeInfoAfterTriggerStakeEvent.revokedStakeAmountWei =
    calculateRevokedStakeAmountWei(
      updateStakeEvent.stakeAmountWei,
      expectStakeInfoAfterTriggerStakeEvent.unstakeAmountWei,
      hre.ethers.BigNumber.from(
        expectStakeInfoAfterTriggerStakeEvent.withdrawUnstakeSecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero),
      hre.ethers.BigNumber.from(
        expectStakeInfoAfterTriggerStakeEvent.unstakeSecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero),
    ).toString();
  expectStakeInfoAfterTriggerStakeEvent.revokeSecondsAfterStartblockTimestamp =
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp.toString();
}

function updateExpectStakeInfoAfterStake(
  triggerStakeEvent,
  stakingPoolConfigs,
  expectStakeInfoAfterTriggerStakeEvent,
) {
  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    triggerStakeEvent.stakeAmountWei,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeTokenDecimals,
  );

  expectStakeInfoAfterTriggerStakeEvent.estimatedRewardAtMaturityWei = (
    triggerStakeEvent.stakeExceedPoolReward
      ? hre.ethers.constants.Zero
      : estimateRewardAtMaturityWei(
          stakingPoolConfigs[triggerStakeEvent.poolIndex].poolAprWei,
          stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeDurationDays,
          truncatedStakeAmountWei,
        )
  ).toString();
  expectStakeInfoAfterTriggerStakeEvent.stakeAmountWei = (
    triggerStakeEvent.stakeExceedPoolReward
      ? hre.ethers.constants.Zero
      : truncatedStakeAmountWei
  ).toString();
  expectStakeInfoAfterTriggerStakeEvent.stakeMaturitySecondsAfterStartblockTimestamp =
    (
      triggerStakeEvent.stakeExceedPoolReward
        ? hre.ethers.constants.Zero
        : calculateStateMaturityTimestamp(
            stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeDurationDays,
            triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
          )
    ).toString();
  expectStakeInfoAfterTriggerStakeEvent.stakeSecondsAfterStartblockTimestamp = (
    triggerStakeEvent.stakeExceedPoolReward
      ? hre.ethers.constants.Zero
      : triggerStakeEvent.eventSecondsAfterStartblockTimestamp
  ).toString();
  expectStakeInfoAfterTriggerStakeEvent.isActive =
    triggerStakeEvent.stakeExceedPoolReward ? false : true;
  expectStakeInfoAfterTriggerStakeEvent.isInitialized =
    triggerStakeEvent.stakeExceedPoolReward ? false : true;
}

function updateExpectStakeInfoAfterUnstake(
  triggerStakeEvent,
  updateStakeEvent,
  stakingPoolConfigs,
  expectStakeInfoAfterTriggerStakeEvent,
) {
  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const isMatured = isStakeMatured(
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  expectStakeInfoAfterTriggerStakeEvent.unstakeAmountWei =
    calculateUnstakeAmountWei(
      truncatedStakeAmountWei,
      stakingPoolConfigs[updateStakeEvent.poolIndex]
        .earlyUnstakePenaltyPercentWei,
      stakeMaturitySecondsAfterStartblockTimestamp,
      triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
      triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    ).toString();
  expectStakeInfoAfterTriggerStakeEvent.unstakeCooldownExpirySecondsAfterStartblockTimestamp =
    isMatured
      ? triggerStakeEvent.eventSecondsAfterStartblockTimestamp
      : calculateCooldownExpiryTimestamp(
          stakingPoolConfigs[updateStakeEvent.poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
        ).toString();
  expectStakeInfoAfterTriggerStakeEvent.unstakePenaltyAmountWei =
    calculateUnstakePenaltyWei(
      truncatedStakeAmountWei,
      stakingPoolConfigs[updateStakeEvent.poolIndex]
        .earlyUnstakePenaltyPercentWei,
      stakeMaturitySecondsAfterStartblockTimestamp,
      triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
      triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    ).toString();
  expectStakeInfoAfterTriggerStakeEvent.unstakeSecondsAfterStartblockTimestamp =
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp.toString();
}

function updateExpectStakeInfoAfterWithdraw(
  triggerStakeEvent,
  updateStakeEvent,
  unstakeStakeEvent,
  stakingPoolConfigs,
  expectStakeInfoAfterTriggerStakeEvent,
) {
  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const unstakeAmountWei = calculateUnstakeAmountWei(
    truncatedStakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex]
      .earlyUnstakePenaltyPercentWei,
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    unstakeStakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  expectStakeInfoAfterTriggerStakeEvent.withdrawUnstakeSecondsAfterStartblockTimestamp =
    unstakeAmountWei.gt(hre.ethers.constants.Zero)
      ? triggerStakeEvent.eventSecondsAfterStartblockTimestamp.toString()
      : hre.ethers.constants.Zero.toString();
}

function updateExpectStakingPoolStatsAfterAddReward(
  triggerStakeEvent,
  stakingPoolConfigs,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  if (!triggerStakeEvent.hasPermissionToAddReward) {
    return;
  }

  const truncatedRewardAmountWei = computeTruncatedAmountWei(
    triggerStakeEvent.rewardAmountWei,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].rewardTokenDecimals,
  );

  const expectTotalRewardAddedWei = hre.ethers.BigNumber.from(
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardAddedWei,
  ).add(truncatedRewardAmountWei);

  const expectPoolRewardWei = computePoolRewardWei(
    expectTotalRewardAddedWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedRewardWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedRewardBeforeMatureWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardRemovedWei,
  );

  const expectPoolRemainingRewardWei = computePoolRemainingRewardWei(
    expectPoolRewardWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.rewardToBeDistributedWei,
  );

  const expectPoolSizeWei = computePoolSizeWei(
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWei,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeTokenDecimals,
  );

  expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardAddedWei =
    expectTotalRewardAddedWei.toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.poolRemainingRewardWei =
    expectPoolRemainingRewardWei.toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.poolRewardAmountWei =
    expectPoolRewardWei.toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.poolSizeWei =
    expectPoolSizeWei.toString();
}

function updateExpectStakingPoolStatsAfterClaim(
  triggerStakeEvent,
  updateStakeEvent,
  unstakeStakeEvent,
  stakingPoolConfigs,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  if (updateStakeEvent.stakeExceedPoolReward) {
    return;
  }

  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
    stakingPoolConfigs[updateStakeEvent.poolIndex].poolAprWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
    truncatedStakeAmountWei,
  );
  const claimableRewardWei = calculateClaimableRewardWei(
    estimatedRewardAtMaturityWei,
    hre.ethers.constants.Zero,
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    unstakeStakeEvent == null
      ? triggerStakeEvent.eventSecondsAfterStartblockTimestamp
      : unstakeStakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardClaimedWei =
    hre.ethers.BigNumber.from(
      expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardClaimedWei,
    )
      .add(claimableRewardWei)
      .toString();
}

function updateExpectStakingPoolStatsAfterRemoveReward(
  triggerStakeEvent,
  stakingPoolConfigs,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  if (!triggerStakeEvent.hasPermissionToRemoveReward) {
    return;
  }

  const expectedPoolRewardWeiBeforeRemove = computePoolRewardWei(
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardAddedWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedRewardWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedRewardBeforeMatureWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardRemovedWei,
  );

  const expectedPoolRemainingRewardWeiBeforeRemove =
    computePoolRemainingRewardWei(
      expectedPoolRewardWeiBeforeRemove,
      expectStakingPoolStatsAfterTriggerStakeEvent.rewardToBeDistributedWei,
    );

  const expectTotalRewardRemovedWeiAfterRemove = hre.ethers.BigNumber.from(
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardRemovedWei,
  ).add(expectedPoolRemainingRewardWeiBeforeRemove);

  const expectPoolRewardWeiAfterRemove = computePoolRewardWei(
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardAddedWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedRewardWei,
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedRewardBeforeMatureWei,
    expectTotalRewardRemovedWeiAfterRemove,
  );

  const expectPoolRemainingRewardWei = computePoolRemainingRewardWei(
    expectPoolRewardWeiAfterRemove,
    expectStakingPoolStatsAfterTriggerStakeEvent.rewardToBeDistributedWei,
  );

  const expectPoolSizeWeiAfterRemove = computePoolSizeWei(
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWeiAfterRemove,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeTokenDecimals,
  );

  expectStakingPoolStatsAfterTriggerStakeEvent.poolRemainingRewardWei =
    expectPoolRemainingRewardWei.toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.poolRewardAmountWei =
    expectPoolRewardWeiAfterRemove.toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.poolSizeWei =
    expectPoolSizeWeiAfterRemove.toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.totalRewardRemovedWei =
    expectTotalRewardRemovedWeiAfterRemove.toString();
}

function updateExpectStakingPoolStatsAfterRevoke(
  triggerStakeEvent,
  updateStakeEvent,
  unstakeStakeEvent,
  stakingPoolConfigs,
  expectStakeInfoAfterTriggerStakeEvent,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  if (updateStakeEvent.stakeExceedPoolReward) {
    return;
  }

  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
    stakingPoolConfigs[updateStakeEvent.poolIndex].poolAprWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
    truncatedStakeAmountWei,
  );
  const revokedRewardAmountWei = calculateRevokedRewardAmountWei(
    estimatedRewardAtMaturityWei,
    expectStakeInfoAfterTriggerStakeEvent.rewardClaimedWei,
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    unstakeStakeEvent == null
      ? hre.ethers.constants.Zero
      : unstakeStakeEvent.eventSecondsAfterStartblockTimestamp,
  );
  const revokedStakeAmountWei = calculateRevokedStakeAmountWei(
    truncatedStakeAmountWei,
    expectStakeInfoAfterTriggerStakeEvent.unstakeAmountWei,
    hre.ethers.BigNumber.from(
      expectStakeInfoAfterTriggerStakeEvent.withdrawUnstakeSecondsAfterStartblockTimestamp,
    ).gt(hre.ethers.constants.Zero),
    hre.ethers.BigNumber.from(
      expectStakeInfoAfterTriggerStakeEvent.unstakeAmountWei,
    ).gt(hre.ethers.constants.Zero) ||
      hre.ethers.BigNumber.from(
        expectStakeInfoAfterTriggerStakeEvent.unstakePenaltyAmountWei,
      ).gt(hre.ethers.constants.Zero),
  );

  expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedRewardWei =
    hre.ethers.BigNumber.from(
      expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedRewardWei,
    )
      .add(revokedRewardAmountWei)
      .toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedStakeWei =
    hre.ethers.BigNumber.from(
      expectStakingPoolStatsAfterTriggerStakeEvent.totalRevokedStakeWei,
    )
      .add(revokedStakeAmountWei)
      .toString();
}

function updateExpectStakingPoolStatsAfterStake(
  triggerStakeEvent,
  stakingPoolConfigs,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  if (triggerStakeEvent.stakeExceedPoolReward) {
    return;
  }

  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    triggerStakeEvent.stakeAmountWei,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
    stakingPoolConfigs[triggerStakeEvent.poolIndex].poolAprWei,
    stakingPoolConfigs[triggerStakeEvent.poolIndex].stakeDurationDays,
    truncatedStakeAmountWei,
  );

  expectStakingPoolStatsAfterTriggerStakeEvent.rewardToBeDistributedWei =
    hre.ethers.BigNumber.from(
      expectStakingPoolStatsAfterTriggerStakeEvent.rewardToBeDistributedWei,
    )
      .add(estimatedRewardAtMaturityWei)
      .toString();
  expectStakingPoolStatsAfterTriggerStakeEvent.totalStakedWei =
    hre.ethers.BigNumber.from(
      expectStakingPoolStatsAfterTriggerStakeEvent.totalStakedWei,
    )
      .add(truncatedStakeAmountWei)
      .toString();
}

function updateExpectStakingPoolStatsAfterUnstake(
  triggerStakeEvent,
  updateStakeEvent,
  stakingPoolConfigs,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  if (updateStakeEvent.stakeExceedPoolReward) {
    return;
  }

  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
    stakingPoolConfigs[updateStakeEvent.poolIndex].poolAprWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
    truncatedStakeAmountWei,
  );
  const isMatured = isStakeMatured(
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
  );
  const unstakeAmountWei = calculateUnstakeAmountWei(
    truncatedStakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex]
      .earlyUnstakePenaltyPercentWei,
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
  );
  const unstakePenaltyWei = calculateUnstakePenaltyWei(
    truncatedStakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex]
      .earlyUnstakePenaltyPercentWei,
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  if (isMatured) {
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedAfterMatureWei =
      hre.ethers.BigNumber.from(
        expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedAfterMatureWei,
      )
        .add(unstakeAmountWei)
        .toString();
  } else {
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedBeforeMatureWei =
      hre.ethers.BigNumber.from(
        expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedBeforeMatureWei,
      )
        .add(unstakeAmountWei)
        .toString();
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedRewardBeforeMatureWei =
      hre.ethers.BigNumber.from(
        expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakedRewardBeforeMatureWei,
      )
        .add(estimatedRewardAtMaturityWei)
        .toString();
    expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakePenaltyAmountWei =
      hre.ethers.BigNumber.from(
        expectStakingPoolStatsAfterTriggerStakeEvent.totalUnstakePenaltyAmountWei,
      )
        .add(unstakePenaltyWei)
        .toString();
  }
}

function updateExpectStakingPoolStatsAfterWithdraw(
  triggerStakeEvent,
  updateStakeEvent,
  unstakeStakeEvent,
  stakingPoolConfigs,
  expectStakingPoolStatsAfterTriggerStakeEvent,
) {
  const truncatedStakeAmountWei = computeTruncatedAmountWei(
    updateStakeEvent.stakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex].stakeTokenDecimals,
  );
  const stakeMaturitySecondsAfterStartblockTimestamp =
    calculateStateMaturityTimestamp(
      stakingPoolConfigs[updateStakeEvent.poolIndex].stakeDurationDays,
      updateStakeEvent.eventSecondsAfterStartblockTimestamp,
    );
  const unstakeAmountWei = calculateUnstakeAmountWei(
    truncatedStakeAmountWei,
    stakingPoolConfigs[updateStakeEvent.poolIndex]
      .earlyUnstakePenaltyPercentWei,
    stakeMaturitySecondsAfterStartblockTimestamp,
    triggerStakeEvent.eventSecondsAfterStartblockTimestamp,
    unstakeStakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  expectStakingPoolStatsAfterTriggerStakeEvent.totalWithdrawnUnstakeWei =
    hre.ethers.BigNumber.from(
      expectStakingPoolStatsAfterTriggerStakeEvent.totalWithdrawnUnstakeWei,
    )
      .add(unstakeAmountWei)
      .toString();
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

async function verifyMultipleStakeInfos(
  stakingServiceContractInstance,
  startblockTimestamp,
  expectMultipleStakeInfos,
) {
  const stakeInfosIterator = expectMultipleStakeInfos.entries();
  for (const [key, expectStakeInfo] of stakeInfosIterator) {
    const [poolId, signerAddress, stakeId] = key.split(",");

    /*
    console.log(
      `\nverifyMultipleStakeInfos: poolId=${poolId}, signerAddress=${signerAddress}, stakeId=${stakeId}, expectStakeInfo=${JSON.stringify(expectStakeInfo)}`,
    );
    */

    await verifyStakeInfo(
      stakingServiceContractInstance,
      poolId,
      signerAddress,
      stakeId,
      startblockTimestamp,
      expectStakeInfo,
    );
  }
}

async function verifyMultipleStakingPoolStats(
  stakingServiceContractInstance,
  expectMultipleStakingPoolStats,
) {
  const stakePoolStatsIterator = expectMultipleStakingPoolStats.entries();
  for (const [poolId, expectStakingPoolStats] of stakePoolStatsIterator) {
    verifyStakingPoolStats(
      stakingServiceContractInstance,
      poolId,
      expectStakingPoolStats,
    );
  }
}

function verifyRewardAtMaturity(
  stakingPoolConfig,
  stakeEvent,
  startblockTimestamp,
  stakeLastDigitDeltaRewardAtMaturityWei,
  actualRewardAtMaturityDeltaWei,
) {
  const actualStakeAmountWei = stakeEvent.stakeAmountWei;
  const expectStakeAmountWei = computeTruncatedAmountWei(
    stakeEvent.stakeAmountWei,
    stakingPoolConfig.stakeTokenDecimals,
  );

  const expectStakeTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);

  const additionalRewardToDistributeWei = computeTruncatedAmountWei(
    estimateRewardAtMaturityWei(
      stakingPoolConfig.poolAprWei,
      stakingPoolConfig.stakeDurationDays,
      expectStakeAmountWei,
    ),
    stakingPoolConfig.rewardTokenDecimals,
  );
  const expectRewardAtMaturityWei = additionalRewardToDistributeWei;

  const estimatedRewardAtMaturityWei = estimateRewardAtMaturityWei(
    stakingPoolConfig.poolAprWei,
    stakingPoolConfig.stakeDurationDays,
    actualStakeAmountWei,
  );

  const expectStakeMaturityTimestamp = calculateStateMaturityTimestamp(
    stakingPoolConfig.stakeDurationDays,
    expectStakeTimestamp,
  );

  verifyActualWithTruncatedValueWei(
    stakeLastDigitDeltaRewardAtMaturityWei,
    Math.min(
      stakingPoolConfig.stakeTokenDecimals,
      stakingPoolConfig.rewardTokenDecimals,
    ),
    expectRewardAtMaturityWei,
    estimatedRewardAtMaturityWei,
    actualRewardAtMaturityDeltaWei,
  );

  return {
    expectStakeAmountWei,
    expectStakeTimestamp,
    expectStakeMaturityTimestamp,
    expectRewardAtMaturityWei,
    additionalRewardToDistributeWei,
    actualStakeAmountWei,
  };
}

async function verifyStakeInfo(
  stakingServiceContractInstance,
  poolId,
  signerAddress,
  stakeId,
  startblockTimestamp,
  expectStakeInfo,
) {
  if (expectStakeInfo.isInitialized) {
    /*
    console.log(
      `verifyStakeInfo: poolId=${poolId}, signerAddress=${signerAddress}, stakeId=${stakeId}, expectStakeInfo=${JSON.stringify(expectStakeInfo)}`,
    );
    */

    const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
      poolId,
      signerAddress,
      stakeId,
    );

    expect(stakeInfo.estimatedRewardAtMaturityWei).to.equal(
      expectStakeInfo.estimatedRewardAtMaturityWei,
    );
    expect(stakeInfo.revokedRewardAmountWei).to.equal(
      expectStakeInfo.revokedRewardAmountWei,
    );
    expect(stakeInfo.revokedStakeAmountWei).to.equal(
      expectStakeInfo.revokedStakeAmountWei,
    );
    expect(stakeInfo.revokeTimestamp).to.equal(
      hre.ethers.BigNumber.from(
        expectStakeInfo.revokeSecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero)
        ? hre.ethers.BigNumber.from(startblockTimestamp).add(
            expectStakeInfo.revokeSecondsAfterStartblockTimestamp,
          )
        : hre.ethers.constants.Zero,
    );
    expect(stakeInfo.rewardClaimedWei).to.equal(
      expectStakeInfo.rewardClaimedWei,
    );
    expect(stakeInfo.stakeAmountWei).to.equal(expectStakeInfo.stakeAmountWei);
    expect(stakeInfo.stakeMaturityTimestamp).to.equal(
      hre.ethers.BigNumber.from(
        expectStakeInfo.stakeMaturitySecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero)
        ? hre.ethers.BigNumber.from(startblockTimestamp).add(
            expectStakeInfo.stakeMaturitySecondsAfterStartblockTimestamp,
          )
        : hre.ethers.constants.Zero,
    );
    expect(stakeInfo.stakeTimestamp).to.equal(
      hre.ethers.BigNumber.from(
        expectStakeInfo.stakeSecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero)
        ? hre.ethers.BigNumber.from(startblockTimestamp).add(
            expectStakeInfo.stakeSecondsAfterStartblockTimestamp,
          )
        : hre.ethers.constants.Zero,
    );
    expect(stakeInfo.unstakeAmountWei).to.equal(
      expectStakeInfo.unstakeAmountWei,
    );
    expect(stakeInfo.unstakeCooldownExpiryTimestamp).to.equal(
      hre.ethers.BigNumber.from(
        expectStakeInfo.unstakeCooldownExpirySecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero)
        ? hre.ethers.BigNumber.from(startblockTimestamp).add(
            expectStakeInfo.unstakeCooldownExpirySecondsAfterStartblockTimestamp,
          )
        : hre.ethers.constants.Zero,
    );
    expect(stakeInfo.unstakePenaltyAmountWei).to.equal(
      expectStakeInfo.unstakePenaltyAmountWei,
    );
    expect(stakeInfo.unstakeTimestamp).to.equal(
      hre.ethers.BigNumber.from(
        expectStakeInfo.unstakeSecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero)
        ? hre.ethers.BigNumber.from(startblockTimestamp).add(
            expectStakeInfo.unstakeSecondsAfterStartblockTimestamp,
          )
        : hre.ethers.constants.Zero,
    );
    expect(stakeInfo.withdrawUnstakeTimestamp).to.equal(
      hre.ethers.BigNumber.from(
        expectStakeInfo.withdrawUnstakeSecondsAfterStartblockTimestamp,
      ).gt(hre.ethers.constants.Zero)
        ? hre.ethers.BigNumber.from(startblockTimestamp).add(
            expectStakeInfo.withdrawUnstakeSecondsAfterStartblockTimestamp,
          )
        : hre.ethers.constants.Zero,
    );
    expect(stakeInfo.isActive).to.equal(expectStakeInfo.isActive);
    expect(stakeInfo.isInitialized).to.equal(expectStakeInfo.isInitialized);

    return stakeInfo;
  }

  await expect(
    stakingServiceContractInstance.getStakeInfo(poolId, signerAddress, stakeId),
  ).to.be.revertedWith("SSvcs2: uninitialized stake");

  return null;
}

async function verifyStakingPoolStats(
  stakingServiceContractInstance,
  poolId,
  expectStakingPoolStats,
) {
  const stakingPoolStats =
    await stakingServiceContractInstance.getStakingPoolStats(poolId);

  expect(stakingPoolStats.isOpen).to.equal(expectStakingPoolStats.isOpen);
  expect(stakingPoolStats.isActive).to.equal(expectStakingPoolStats.isActive);
  expect(stakingPoolStats.poolRemainingRewardWei).to.equal(
    expectStakingPoolStats.poolRemainingRewardWei,
  );
  expect(stakingPoolStats.poolRewardAmountWei).to.equal(
    expectStakingPoolStats.poolRewardAmountWei,
  );
  expect(stakingPoolStats.poolSizeWei).to.equal(
    expectStakingPoolStats.poolSizeWei,
  );
  expect(stakingPoolStats.rewardToBeDistributedWei).to.equal(
    expectStakingPoolStats.rewardToBeDistributedWei,
  );
  expect(stakingPoolStats.totalRevokedRewardWei).to.equal(
    expectStakingPoolStats.totalRevokedRewardWei,
  );
  expect(stakingPoolStats.totalRevokedStakeWei).to.equal(
    expectStakingPoolStats.totalRevokedStakeWei,
  );
  expect(stakingPoolStats.totalRevokedStakeRemovedWei).to.equal(
    expectStakingPoolStats.totalRevokedStakeRemovedWei,
  );
  expect(stakingPoolStats.totalRewardAddedWei).to.equal(
    expectStakingPoolStats.totalRewardAddedWei,
  );
  expect(stakingPoolStats.totalRewardClaimedWei).to.equal(
    expectStakingPoolStats.totalRewardClaimedWei,
  );
  expect(stakingPoolStats.totalRewardRemovedWei).to.equal(
    expectStakingPoolStats.totalRewardRemovedWei,
  );
  expect(stakingPoolStats.totalStakedWei).to.equal(
    expectStakingPoolStats.totalStakedWei,
  );
  expect(stakingPoolStats.totalUnstakedAfterMatureWei).to.equal(
    expectStakingPoolStats.totalUnstakedAfterMatureWei,
  );
  expect(stakingPoolStats.totalUnstakedBeforeMatureWei).to.equal(
    expectStakingPoolStats.totalUnstakedBeforeMatureWei,
  );
  expect(stakingPoolStats.totalUnstakedRewardBeforeMatureWei).to.equal(
    expectStakingPoolStats.totalUnstakedRewardBeforeMatureWei,
  );
  expect(stakingPoolStats.totalUnstakePenaltyAmountWei).to.equal(
    expectStakingPoolStats.totalUnstakePenaltyAmountWei,
  );
  expect(stakingPoolStats.totalUnstakePenaltyRemovedWei).to.equal(
    expectStakingPoolStats.totalUnstakePenaltyRemovedWei,
  );
  expect(stakingPoolStats.totalWithdrawnUnstakeWei).to.equal(
    expectStakingPoolStats.totalWithdrawnUnstakeWei,
  );

  return stakingPoolStats;
}

async function withdrawWithVerify(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  startblockTimestamp,
  stakeEvent,
  expectStakeInfosBeforeWithdraw,
  expectStakeInfosAfterWithdraw,
  expectStakingPoolStatsBeforeWithdraw,
  expectStakingPoolStatsAfterWithdraw,
) {
  const currentBlockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  console.log(
    `\nwithdrawWithVerify: currentBlockTimestamp=${currentBlockTimestamp}, poolUuid=${
      stakingPoolConfigs[stakeEvent.poolIndex].poolUuid
    }, poolId=${stakingPoolConfigs[stakeEvent.poolIndex].poolId}, eventSecondsAfterStartblockTimestamp=${
      stakeEvent.eventSecondsAfterStartblockTimestamp
    }, signer=${stakeEvent.signerAddress}`,
  );

  const expectStakeInfoBeforeWithdraw = expectStakeInfosBeforeWithdraw.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const expectClaimableRewardWeiBeforeWithdraw = calculateClaimableRewardWei(
    expectStakeInfoBeforeWithdraw.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeWithdraw.rewardClaimedWei,
    expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
    hre.ethers.BigNumber.from(currentBlockTimestamp).sub(startblockTimestamp),
    expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
  );

  const getClaimableRewardWeiBeforeWithdraw =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(getClaimableRewardWeiBeforeWithdraw).to.equal(
    expectClaimableRewardWeiBeforeWithdraw,
  );

  const stakeInfoBeforeWithdraw = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    expectStakeInfoBeforeWithdraw,
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeWithdraw,
  );

  const stakingPoolStatsBeforeWithdraw = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    expectStakingPoolStatsBeforeWithdraw.get(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    ),
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsBeforeWithdraw,
  );

  const expectWithdrawTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(stakeEvent.eventSecondsAfterStartblockTimestamp);
  await testHelpers.setTimeNextBlock(expectWithdrawTimestamp.toNumber());

  const expectUnstakePenaltyAmountWei = calculateUnstakePenaltyWei(
    expectStakeInfoBeforeWithdraw.stakeAmountWei,
    stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakePenaltyPercentWei,
    expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
  );

  const expectUnstakeAmountWei = calculateUnstakeAmountWei(
    expectStakeInfoBeforeWithdraw.stakeAmountWei,
    stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakePenaltyPercentWei,
    expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
  );

  const isStakeMaturedAtUnstake = isStakeMatured(
    expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
  );

  const expectUnstakeCooldownExpiryTimestamp = isStakeMaturedAtUnstake
    ? hre.ethers.BigNumber.from(startblockTimestamp).add(
        expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
      )
    : hre.ethers.BigNumber.from(startblockTimestamp).add(
        calculateCooldownExpiryTimestamp(
          stakingPoolConfigs[stakeEvent.poolIndex]
            .earlyUnstakeCooldownPeriodDays,
          expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
        ),
      );

  const contractBalanceOfBeforeWithdraw = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);
  const signerBalanceOfBeforeWithdraw = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);

  if (expectUnstakeAmountWei.gt(hre.ethers.constants.Zero)) {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .withdrawUnstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    )
      .to.emit(stakingServiceContractInstance, "UnstakeWithdrawn")
      .withArgs(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.signerAddress,
        stakeEvent.stakeId,
        stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenInstance.address,
        expectUnstakeAmountWei,
        expectWithdrawTimestamp,
      );
  } else {
    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .withdrawUnstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: nothing");
  }

  const expectContractBalanceOfAfterWithdraw =
    contractBalanceOfBeforeWithdraw.sub(expectUnstakeAmountWei);
  const expectSignerBalanceOfAfterWithdraw = signerBalanceOfBeforeWithdraw.add(
    expectUnstakeAmountWei,
  );

  const signerBalanceOfAfterWithdraw = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);
  const contractBalanceOfAfterWithdraw = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);

  expect(contractBalanceOfAfterWithdraw).to.equal(
    expectContractBalanceOfAfterWithdraw,
  );
  expect(signerBalanceOfAfterWithdraw).to.equal(
    expectSignerBalanceOfAfterWithdraw,
  );

  const expectClaimableRewardWeiAfterWithdraw = calculateClaimableRewardWei(
    expectStakeInfoBeforeWithdraw.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeWithdraw.rewardClaimedWei,
    expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
  );

  const claimableRewardWeiAfterWithdraw =
    await stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(claimableRewardWeiAfterWithdraw).to.equal(
    expectClaimableRewardWeiAfterWithdraw,
  );

  const stakeInfoAfterWithdraw = await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    {
      estimatedRewardAtMaturityWei:
        expectStakeInfoBeforeWithdraw.estimatedRewardAtMaturityWei,
      revokedRewardAmountWei: hre.ethers.constants.Zero,
      revokedStakeAmountWei: hre.ethers.constants.Zero,
      revokeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      rewardClaimedWei: expectStakeInfoBeforeWithdraw.rewardClaimedWei,
      stakeAmountWei: expectStakeInfoBeforeWithdraw.stakeAmountWei,
      stakeMaturitySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
      stakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeWithdraw.stakeSecondsAfterStartblockTimestamp,
      unstakeAmountWei: expectUnstakeAmountWei,
      unstakeCooldownExpirySecondsAfterStartblockTimestamp:
        hre.ethers.BigNumber.from(expectUnstakeCooldownExpiryTimestamp).sub(
          startblockTimestamp,
        ),
      unstakePenaltyAmountWei: expectUnstakePenaltyAmountWei,
      unstakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
      withdrawUnstakeSecondsAfterStartblockTimestamp: expectUnstakeAmountWei.gt(
        hre.ethers.constants.Zero,
      )
        ? stakeEvent.eventSecondsAfterStartblockTimestamp
        : hre.ethers.constants.Zero,
      isActive: true,
      isInitialized: true,
    },
  );

  await verifyMultipleStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterWithdraw,
  );

  const expectTotalWithdrawnUnstakeWei =
    stakingPoolStatsBeforeWithdraw.totalWithdrawnUnstakeWei.add(
      expectUnstakeAmountWei,
    );

  const stakingPoolStatsAfterWithdraw = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    {
      isOpen: stakingPoolStatsBeforeWithdraw.isOpen,
      isActive: stakingPoolStatsBeforeWithdraw.isActive,
      poolRemainingRewardWei:
        stakingPoolStatsBeforeWithdraw.poolRemainingRewardWei,
      poolRewardAmountWei: stakingPoolStatsBeforeWithdraw.poolRewardAmountWei,
      poolSizeWei: stakingPoolStatsBeforeWithdraw.poolSizeWei,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeWithdraw.rewardToBeDistributedWei,
      totalRevokedRewardWei:
        stakingPoolStatsBeforeWithdraw.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeWithdraw.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeWithdraw.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolStatsBeforeWithdraw.totalRewardAddedWei,
      totalRewardClaimedWei:
        stakingPoolStatsBeforeWithdraw.totalRewardClaimedWei,
      totalRewardRemovedWei:
        stakingPoolStatsBeforeWithdraw.totalRewardRemovedWei,
      totalStakedWei: stakingPoolStatsBeforeWithdraw.totalStakedWei,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeWithdraw.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeWithdraw.totalUnstakedBeforeMatureWei,
      totalUnstakedRewardBeforeMatureWei:
        stakingPoolStatsBeforeWithdraw.totalUnstakedRewardBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeWithdraw.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeWithdraw.totalUnstakePenaltyRemovedWei,
      totalWithdrawnUnstakeWei: expectTotalWithdrawnUnstakeWei,
    },
  );

  await verifyMultipleStakingPoolStats(
    stakingServiceContractInstance,
    expectStakingPoolStatsAfterWithdraw,
  );

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .stake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
        hre.ethers.utils.parseEther("1.0"),
      ),
  ).to.be.revertedWith("SSvcs2: stake exists");

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .unstake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  ).to.be.revertedWith("SSvcs2: unstaked");

  await expect(
    stakingServiceContractInstance
      .connect(stakeEvent.signer)
      .withdrawUnstake(
        stakingPoolConfigs[stakeEvent.poolIndex].poolId,
        stakeEvent.stakeId,
      ),
  ).to.be.revertedWith(
    expectUnstakeAmountWei.gt(hre.ethers.constants.Zero)
      ? "SSvcs2: withdrawn"
      : "SSvcs2: nothing",
  );

  console.log(
    `withdrawWithVerify: expectTotalWithdrawnUnstakeWei=${expectTotalWithdrawnUnstakeWei}`,
  );
}

module.exports = {
  addStakingPoolRewardWithVerify,
  calculateClaimableRewardWei,
  calculateCooldownExpiryTimestamp,
  calculateRevokedRewardAmountWei,
  calculateRevokedStakeAmountWei,
  calculateStateMaturityTimestamp,
  calculateUnstakeAmountWei,
  calculateUnstakePenaltyWei,
  claimWithVerify,
  computeCloseToDelta,
  computePoolRemainingRewardWei,
  computePoolRewardWei,
  computePoolSizeWei,
  computeTruncatedAmountWei,
  estimateRewardAtMaturityWei,
  getNextExpectStakeInfoStakingPoolStats,
  isStakeMatured,
  newStakingService,
  removeUnallocatedStakingPoolRewardWithVerify,
  revokeWithVerify,
  setupRevokeStakeEnvironment,
  setupStakeEnvironment,
  setupSuspendStakeEnvironment,
  setupUnstakeEnvironment,
  stakeWithVerify,
  testAddStakingPoolReward,
  testRemoveStakingPoolReward,
  testSetStakingPoolContract,
  testStakeClaimRevokeUnstakeWithdraw,
  unstakeWithVerify,
  updateExpectStakeInfoAfterClaim,
  updateExpectStakeInfoAfterRevoke,
  updateExpectStakeInfoAfterStake,
  updateExpectStakeInfoAfterUnstake,
  updateExpectStakeInfoAfterWithdraw,
  updateExpectStakingPoolStatsAfterClaim,
  updateExpectStakingPoolStatsAfterRevoke,
  updateExpectStakingPoolStatsAfterStake,
  updateExpectStakingPoolStatsAfterUnstake,
  updateExpectStakingPoolStatsAfterWithdraw,
  verifyActualWithTruncatedValueWei,
  verifyMultipleStakeInfos,
  verifyMultipleStakingPoolStats,
  verifyRewardAtMaturity,
  verifyStakeInfo,
  verifyStakingPoolStats,
  withdrawWithVerify,
};
