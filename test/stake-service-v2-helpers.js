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
      totalUnstakePenaltyRemovedWei: hre.ethers.constants.Zero,
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

  const stakingPoolStatsBeforeAdd = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    poolId,
    stakingPoolRewardStats[poolId],
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

  const stakingPoolStatsAfterAdd = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    poolId,
    {
      isOpen: stakingPoolStatsBeforeAdd.isOpen,
      isActive: stakingPoolStatsBeforeAdd.isActive,
      poolSizeWei: stakingPoolRewardStats[poolId].poolSizeWei,
      rewardToBeDistributedWei:
        stakingPoolStatsBeforeAdd.rewardToBeDistributedWei,
      totalRevokedRewardWei: stakingPoolStatsBeforeAdd.totalRevokedRewardWei,
      totalRevokedStakeWei: stakingPoolStatsBeforeAdd.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        stakingPoolStatsBeforeAdd.totalRevokedStakeRemovedWei,
      totalRewardAddedWei: stakingPoolRewardStats[poolId].totalRewardAddedWei,
      totalRewardClaimedWei: stakingPoolStatsBeforeAdd.totalRewardClaimedWei,
      totalRewardRemovedWei: stakingPoolStatsBeforeAdd.totalRewardRemovedWei,
      totalStakedWei: stakingPoolStatsBeforeAdd.totalStakedWei,
      totalUnstakedAfterMatureWei:
        stakingPoolStatsBeforeAdd.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        stakingPoolStatsBeforeAdd.totalUnstakedBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        stakingPoolStatsBeforeAdd.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        stakingPoolStatsBeforeAdd.totalUnstakePenaltyRemovedWei,
    },
  );

  verifyActualWithTruncatedValueWei(
    10,
    rewardTokenDecimals,
    stakingPoolStatsAfterAdd.totalRewardAddedWei,
    expectedTotalRewardAddedWeiAfterAdd,
    hre.ethers.constants.Zero,
  );

  return expectBalanceOfAfterAdd;
}

function calculateCooldownExpiryTimestamp(
  cooldownPeriodDays,
  unstakeTimestamp,
) {
  return testHelpers.BN_SECONDS_IN_DAYS.mul(cooldownPeriodDays).add(
    unstakeTimestamp,
  );
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
  const isMature = isStakeMatured(
    stakeMaturityTimestamp,
    currentTimestamp,
    unstakeTimestamp,
  );

  return isMature
    ? hre.ethers.constants.Zero
    : hre.ethers.BigNumber.from(stakeAmountWei)
        .mul(earlyUnstakePenaltyPercentWei)
        .div(testHelpers.BN_PERCENT_100_WEI);
}

function computeCloseToDelta(lastDigitDelta, tokenDecimals) {
  return hre.ethers.BigNumber.from("10")
    .pow(testHelpers.TOKEN_MAX_DECIMALS - tokenDecimals - 1)
    .mul(hre.ethers.BigNumber.from(lastDigitDelta));
}

function computePoolRewardWei(stakingPoolRewardStats) {
  return hre.ethers.BigNumber.from(stakingPoolRewardStats.totalRewardAddedWei)
    .add(stakingPoolRewardStats.totalRevokedRewardWei)
    .sub(stakingPoolRewardStats.totalRewardRemovedWei);
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

function isStakeMatured(
  stakeMaturityTimestamp,
  currentTimestamp,
  unstakeTimestamp,
) {
  const timestamp =
    unstakeTimestamp && unstakeTimestamp > 0
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
    }, poolId=${stakeEvent.stakingPoolConfig.poolId}, stakeAmountWei=${
      stakeEvent.stakeAmountWei
    }, stakeSecondsAfterStartblockTimestamp=${
      stakeEvent.stakeSecondsAfterStartblockTimestamp
    }, signer=${await stakeEvent.signerAddress}, stakeExceedPoolReward=${stakeEvent.stakeExceedPoolReward}`,
  );

  await expect(
    stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    ),
  ).to.be.revertedWith("SSvcs2: uninitialized");

  await expect(
    stakingServiceContractInstance.getStakeInfo(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    ),
  ).to.be.revertedWith("SSvcs2: uninitialized");

  await verifyStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosBeforeStake,
  );

  await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    expectStakingPoolStatsBeforeStake,
  );

  await testHelpers.transferAndApproveWithVerify(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenInstance,
    bankSigner,
    stakeEvent.signer,
    stakingServiceContractInstance.address,
    expectStakeAmountWei,
  );

  await testHelpers.setTimeNextBlock(expectStakeTimestamp);

  const expectTotalStakedWeiAfterStake = stakeEvent.stakeExceedPoolReward
    ? expectStakingPoolStatsBeforeStake.totalStakedWei
    : expectStakingPoolStatsBeforeStake.totalStakedWei.add(
        expectStakeAmountWei,
      );
  const expectRewardToBeDistributedWeiAfterStake =
    stakeEvent.stakeExceedPoolReward
      ? expectStakingPoolStatsBeforeStake.rewardToBeDistributedWei
      : expectStakingPoolStatsBeforeStake.rewardToBeDistributedWei.add(
          additionalRewardToDistributeWei,
        );

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
  }

  const expectPoolRewardWeiAfterStake = computePoolRewardWei({
    totalRewardAddedWei: expectStakingPoolStatsBeforeStake.totalRewardAddedWei,
    totalRevokedRewardWei:
      expectStakingPoolStatsBeforeStake.totalRevokedRewardWei,
    totalRewardRemovedWei:
      expectStakingPoolStatsBeforeStake.totalRewardRemovedWei,
  });
  const expectPoolSizeWeiAfterStake = computePoolSizeWei(
    stakingPoolConfigs[stakeEvent.poolIndex].stakeDurationDays,
    stakingPoolConfigs[stakeEvent.poolIndex].poolAprWei,
    expectPoolRewardWeiAfterStake,
    stakingPoolConfigs[stakeEvent.poolIndex].stakeTokenDecimals,
  );

  const claimableRewardWeiAfterStake =
    stakingServiceContractInstance.getClaimableRewardWei(
      stakingPoolConfigs[stakeEvent.poolIndex].poolId,
      stakeEvent.signerAddress,
      stakeEvent.stakeId,
    );
  expect(claimableRewardWeiAfterStake).to.equal(hre.ethers.constants.Zero);

  await verifyStakeInfo(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    stakeEvent.signerAddress,
    stakeEvent.stakeId,
    startblockTimestamp,
    {
      estimatedRewardAtMaturityWei: expectRewardAtMaturityWei,
      revokeTimestamp: hre.ethers.constants.Zero,
      rewardClaimedWei: hre.ethers.constants.Zero,
      stakeAmountWei: expectStakeAmountWei,
      stakeMaturityTimestamp: expectStakeMaturityTimestamp,
      stakeTimestamp: expectStakeTimestamp,
      unstakeAmountWei: hre.ethers.constants.Zero,
      unstakeCooldownExpiryTimestamp: hre.ethers.constants.Zero,
      unstakePenaltyAmountWei: hre.ethers.constants.Zero,
      unstakeTimestamp: hre.ethers.constants.Zero,
      withdrawUnstakeTimestamp: hre.ethers.constants.Zero,
      isActive: true,
      isInitialized: true,
    },
  );

  const stakeInfoAfterStake = await verifyStakeInfos(
    stakingServiceContractInstance,
    startblockTimestamp,
    expectStakeInfosAfterStake,
  );

  await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
    {
      isOpen: expectStakingPoolStatsBeforeStake.isOpen,
      isActive: expectStakingPoolStatsBeforeStake.isActive,
      poolSizeWei: expectPoolSizeWeiAfterStake,
      rewardToBeDistributedWei: expectRewardToBeDistributedWeiAfterStake,
      totalRevokedRewardWei:
        expectStakingPoolStatsBeforeStake.totalRevokedRewardWei,
      totalRevokedStakeWei:
        expectStakingPoolStatsBeforeStake.totalRevokedStakeWei,
      totalRevokedStakeRemovedWei:
        expectStakingPoolStatsBeforeStake.totalRevokedStakeRemovedWei,
      totalRewardAddedWei:
        expectStakingPoolStatsBeforeStake.totalRewardAddedWei,
      totalRewardClaimedWei:
        expectStakingPoolStatsBeforeStake.totalRewardClaimedWei,
      totalRewardRemovedWei:
        expectStakingPoolStatsBeforeStake.totalRewardRemovedWei,
      totalStakedWei: expectTotalStakedWeiAfterStake,
      totalUnstakedAfterMatureWei:
        expectStakingPoolStatsBeforeStake.totalUnstakedAfterMatureWei,
      totalUnstakedBeforeMatureWei:
        expectStakingPoolStatsBeforeStake.totalUnstakedBeforeMatureWei,
      totalUnstakePenaltyAmountWei:
        expectStakingPoolStatsBeforeStake.totalUnstakePenaltyAmountWei,
      totalUnstakePenaltyRemovedWei:
        expectStakingPoolStatsBeforeStake.totalUnstakePenaltyRemovedWei,
    },
  );

  const stakingPoolStatsAfterStake = await verifyStakingPoolStats(
    stakingServiceContractInstance,
    stakingPoolConfigs[stakeEvent.poolIndex].poolId,
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
    ).to.be.revertedWith("SSvcs2: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .unstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: uninitialized");

    await expect(
      stakingServiceContractInstance
        .connect(stakeEvent.signer)
        .withdrawUnstake(
          stakingPoolConfigs[stakeEvent.poolIndex].poolId,
          stakeEvent.stakeId,
        ),
    ).to.be.revertedWith("SSvcs2: uninitialized");
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
    ).to.be.revertedWith("SSvcs2: exists");
  }

  console.log(
    `stakeWithVerify: expectTotalStakedWei=${expectTotalStakedWeiAfterStake}, expectRewardToBeDistributedWei=${expectRewardToBeDistributedWeiAfterStake}`,
  );

  return [
    expectTotalStakedWeiAfterStake,
    expectRewardToBeDistributedWeiAfterStake,
  ];
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

async function testStakeClaimRevokeUnstakeWithdraw(
  stakingServiceContractInstance,
  stakingPoolConfigs,
  bankSigner,
  stakeEvents,
  stakeInfos,
  stakingPoolStats,
) {
  const startblockTimestamp = await testHelpers.getCurrentBlockTimestamp();

  for (let i = 0; i < stakeEvents.length; i++) {
    switch (stakeEvents[i].eventType) {
      case "Claim":
        break;
      case "Revoke":
        break;
      case "Stake":
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
        break;
      case "Withdraw":
        break;
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

  const expectStakeTimestamp =
    startblockTimestamp + stakeEvent.stakeSecondsAfterStartblockTimestamp;

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
    const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
      poolId,
      signerAddress,
      stakeId,
    );

    expect(stakeInfo.estimatedRewardAtMaturityWei).to.equal(
      expectStakeInfo.estimatedRewardAtMaturityWei,
    );
    expect(stakeInfo.revokeTimestamp).to.equal(
      startblockTimestamp.add(
        expectStakeInfo.revokeSecondsAfterStartblockTimestamp,
      ),
    );
    expect(stakeInfo.rewardClaimedWei).to.equal(
      expectStakeInfo.rewardClaimedWei,
    );
    expect(stakeInfo.stakeAmountWei).to.equal(expectStakeInfo.stakeAmountWei);
    expect(stakeInfo.stakeMaturityTimestamp).to.equal(
      startblockTimestamp.add(
        expectStakeInfo.stakeMaturitySecondsAfterStartblockTimestamp,
      ),
    );
    expect(stakeInfo.stakeTimestamp).to.equal(
      startblockTimestamp.add(
        expectStakeInfo.stakeSecondsAfterStartblockTimestamp,
      ),
    );
    expect(stakeInfo.unstakeAmountWei).to.equal(
      expectStakeInfo.unstakeAmountWei,
    );
    expect(stakeInfo.unstakeCooldownExpiryTimestamp).to.equal(
      startblockTimestamp.add(
        expectStakeInfo.unstakeCooldownExpirySecondsAfterStartblockTimestamp,
      ),
    );
    expect(stakeInfo.unstakePenaltyAmountWei).to.equal(
      expectStakeInfo.unstakePenaltyAmountWei,
    );
    expect(stakeInfo.unstakeTimestamp).to.equal(
      startblockTimestamp(
        expectStakeInfo.unstakeSecondsAfterStartblockTimestamp,
      ),
    );
    expect(stakeInfo.withdrawUnstakeTimestamp).to.equal(
      startblockTimestamp.add(
        expectStakeInfo.withdrawUnstakeSecondsAfterStartblockTimestamp,
      ),
    );
    expect(stakeInfo.isActive).to.equal(expectStakeInfo.isActive);
    expect(stakeInfo.isInitialized).to.equal(expectStakeInfo.isInitialized);
  } else {
    await expect(
      stakingServiceContractInstance.getStakeInfo(
        poolId,
        signerAddress,
        stakeId,
      ),
    ).to.be.revertedWith("SSvcs2: uninitialized");
  }

  return stakeInfo;
}

async function verifyStakeInfos(
  stakingServiceContractInstance,
  startblockTimestamp,
  expectStakeInfos,
) {
  const stakeInfosIterator = expectStakeInfos.entries();
  for (const [key, value] of stakeInfosIterator) {
    const [poolId, signerAddress, stakeId] = key.split(",");

    await verifyStakeInfo(
      stakingServiceContractInstance,
      poolId,
      signerAddress,
      stakeId,
      startblockTimestamp,
      value,
    );
  }
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
  expect(stakingPoolStats.totalUnstakePenaltyAmountWei).to.equal(
    expectStakingPoolStats.totalUnstakePenaltyAmountWei,
  );
  expect(stakingPoolStats.totalUnstakePenaltyRemovedWei).to.equal(
    expectStakingPoolStats.totalUnstakePenaltyRemovedWei,
  );

  return stakingPoolStats;
}

module.exports = {
  addStakingPoolRewardWithVerify,
  calculateCooldownExpiryTimestamp,
  calculateStateMaturityTimestamp,
  calculateUnstakeAmountWei,
  calculateUnstakePenaltyWei,
  computeCloseToDelta,
  computeTruncatedAmountWei,
  estimateRewardAtMaturityWei,
  isStakeMatured,
  newStakingService,
  stakeWithVerify,
  testAddStakingPoolReward,
  testSetStakingPoolContract,
  testStakeClaimRevokeUnstakeWithdraw,
  verifyActualWithTruncatedValueWei,
  verifyRewardAtMaturity,
  verifyStakeInfo,
  verifyStakingPoolStats,
};
