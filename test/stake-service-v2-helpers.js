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
      totalWithdrawnUnstakeWei: hre.ethers.constants.Zero,
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

    const poolRewardWei = computePoolRewardWei(
      stakingPoolRewardStats[poolId].totalRewardAddedWei,
      stakingPoolRewardStats[poolId].totalRevokedRewardWei,
      stakingPoolRewardStats[poolId].totalRewardRemovedWei,
    );
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
      totalWithdrawnUnstakeWei:
        stakingPoolStatsBeforeAdd.totalWithdrawnUnstakeWei,
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

function computeCloseToDelta(lastDigitDelta, tokenDecimals) {
  return hre.ethers.BigNumber.from("10")
    .pow(testHelpers.TOKEN_MAX_DECIMALS - tokenDecimals - 1)
    .mul(hre.ethers.BigNumber.from(lastDigitDelta));
}

function computePoolRewardWei(
  totalRewardAddedWei,
  totalRevokedRewardWei,
  totalRewardRemovedWei,
) {
  return hre.ethers.BigNumber.from(totalRewardAddedWei)
    .add(totalRevokedRewardWei)
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
    }, poolId=${stakingPoolConfigs[stakeEvent.poolIndex].poolId}, stakeAmountWei=${
      stakeEvent.stakeAmountWei
    }, eventSecondsAfterStartblockTimestamp=${
      stakeEvent.eventSecondsAfterStartblockTimestamp
    }, signer=${await stakeEvent.signerAddress}, stakeId=${
      stakeEvent.stakeId
    }, stakeExceedPoolReward=${stakeEvent.stakeExceedPoolReward}`,
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
    stakingPoolStatsBeforeStake.totalRewardRemovedWei,
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

  // for (let i = 0; i < stakeEvents.length; i++) {
  for (let i = 0; i < 13; i++) {
    switch (stakeEvents[i].eventType) {
      case "Claim":
        break;
      case "Revoke":
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
    }, signer=${await stakeEvent.signerAddress}`,
  );

  const expectStakeInfoBeforeUnstake = expectStakeInfosBeforeUnstake.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const expectClaimableRewardWeiBeforeUnstake = calculateClaimableRewardWei(
    expectStakeInfoBeforeUnstake.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeUnstake.rewardClaimedWei,
    expectStakeInfoBeforeUnstake.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
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

  const expectUnstakeCooldownExpiryTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(
    calculateCooldownExpiryTimestamp(
      stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakeCooldownPeriodDays,
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
      expectStakeInfoBeforeUnstake.stakeAmountWei,
      expectUnstakeAmountWei,
      expectUnstakePenaltyAmountWei,
      stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakeCooldownPeriodDays,
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

  const expectStakeInfoAfterUnstake = expectStakeInfosAfterUnstake.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
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
      poolSizeWei: stakingPoolStatsBeforeUnstake.poolSizeWei,
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
  ).to.be.revertedWith("SSvcs2: exists");

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
    const stakeInfo = await stakingServiceContractInstance.getStakeInfo(
      poolId,
      signerAddress,
      stakeId,
    );

    expect(stakeInfo.estimatedRewardAtMaturityWei).to.equal(
      expectStakeInfo.estimatedRewardAtMaturityWei,
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
  ).to.be.revertedWith("SSvcs2: uninitialized");

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
    }, signer=${await stakeEvent.signerAddress}`,
  );

  const expectStakeInfoBeforeWithdraw = expectStakeInfosBeforeWithdraw.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
  );

  const expectClaimableRewardWeiBeforeWithdraw = calculateClaimableRewardWei(
    expectStakeInfoBeforeWithdraw.estimatedRewardAtMaturityWei,
    expectStakeInfoBeforeWithdraw.rewardClaimedWei,
    expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
    stakeEvent.eventSecondsAfterStartblockTimestamp,
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

  const expectUnstakeCooldownExpiryTimestamp = hre.ethers.BigNumber.from(
    startblockTimestamp,
  ).add(
    calculateCooldownExpiryTimestamp(
      stakingPoolConfigs[stakeEvent.poolIndex].earlyUnstakeCooldownPeriodDays,
      expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
    ),
  );

  const contractBalanceOfBeforeWithdraw = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakingServiceContractInstance.address);
  const signerBalanceOfBeforeWithdraw = await stakingPoolConfigs[
    stakeEvent.poolIndex
  ].stakeTokenInstance.balanceOf(stakeEvent.signerAddress);

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

  const expectStakeInfoAfterWithdraw = expectStakeInfosAfterWithdraw.get(
    `${stakingPoolConfigs[stakeEvent.poolIndex].poolId},${stakeEvent.signerAddress},${stakeEvent.stakeId}`,
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
      revokeSecondsAfterStartblockTimestamp: hre.ethers.constants.Zero,
      rewardClaimedWei: expectStakeInfoBeforeWithdraw.rewardClaimedWei,
      stakeAmountWei: expectStakeInfoBeforeWithdraw.stakeAmountWei,
      stakeMaturitySecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeWithdraw.stakeMaturitySecondsAfterStartblockTimestamp,
      stakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeWithdraw.stakeSecondsAfterStartblockTimestamp,
      unstakeAmountWei: expectUnstakeAmountWei,
      unstakeCooldownExpirySecondsAfterStartblockTimestamp:
        expectUnstakeCooldownExpiryTimestamp.sub(startblockTimestamp),
      unstakePenaltyAmountWei: expectUnstakePenaltyAmountWei,
      unstakeSecondsAfterStartblockTimestamp:
        expectStakeInfoBeforeWithdraw.unstakeSecondsAfterStartblockTimestamp,
      withdrawUnstakeSecondsAfterStartblockTimestamp:
        stakeEvent.eventSecondsAfterStartblockTimestamp,
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
  ).to.be.revertedWith("SSvcs2: exists");

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
  ).to.be.revertedWith("SSvcs2: withdrawn");

  console.log(
    `withdrawWithVerify: expectTotalWithdrawnUnstakeWei=${expectTotalWithdrawnUnstakeWei}`,
  );
}

module.exports = {
  addStakingPoolRewardWithVerify,
  calculateClaimableRewardWei,
  calculateCooldownExpiryTimestamp,
  calculateStateMaturityTimestamp,
  calculateUnstakeAmountWei,
  calculateUnstakePenaltyWei,
  computeCloseToDelta,
  computePoolRewardWei,
  computePoolSizeWei,
  computeTruncatedAmountWei,
  estimateRewardAtMaturityWei,
  isStakeMatured,
  newStakingService,
  stakeWithVerify,
  testAddStakingPoolReward,
  testSetStakingPoolContract,
  testStakeClaimRevokeUnstakeWithdraw,
  unstakeWithVerify,
  verifyActualWithTruncatedValueWei,
  verifyMultipleStakeInfos,
  verifyMultipleStakingPoolStats,
  verifyRewardAtMaturity,
  verifyStakeInfo,
  verifyStakingPoolStats,
};
