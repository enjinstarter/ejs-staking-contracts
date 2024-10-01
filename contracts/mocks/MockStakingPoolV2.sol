// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Enjinstarter
pragma solidity ^0.8.0;

import {StakingPoolV2} from "../StakingPoolV2.sol";

/**
 * @title MockStakingPoolV2
 * @author Tim Loh
 */
contract MockStakingPoolV2 is StakingPoolV2 {
    bytes32 public constant POOL_ID_STAKE_DURATION_ZERO =
        keccak256("POOL_ID_STAKE_DURATION_ZERO");
    bytes32 public constant POOL_ID_STAKE_TOKEN_ADDRESS_ZERO =
        keccak256("POOL_ID_STAKE_TOKEN_ADDRESS_ZERO");
    bytes32 public constant POOL_ID_STAKE_TOKEN_DECIMALS_NINETEEN =
        keccak256("POOL_ID_STAKE_TOKEN_DECIMALS_NINETEEN");
    bytes32 public constant POOL_ID_REWARD_TOKEN_ADDRESS_ZERO =
        keccak256("POOL_ID_REWARD_TOKEN_ADDRESS_ZERO");
    bytes32 public constant POOL_ID_REWARD_TOKEN_DECIMALS_NINETEEN =
        keccak256("POOL_ID_REWARD_TOKEN_DECIMALS_NINETEEN");
    bytes32 public constant POOL_ID_POOL_APR_ZERO =
        keccak256("POOL_ID_POOL_APR_ZERO");
    bytes32 public constant POOL_ID_IS_OPEN_TRUE =
        keccak256("POOL_ID_IS_OPEN_TRUE");
    bytes32 public constant POOL_ID_IS_ACTIVE_TRUE =
        keccak256("POOL_ID_IS_ACTIVE_TRUE");
    bytes32 public constant POOL_ID_IS_INITIALIZED_FALSE =
        keccak256("POOL_ID_IS_INITIALIZED_FALSE");
    bytes32 public constant POOL_ID_EARLY_UNSTAKE_COOLDOWN_PERIOD_DAYS_ZERO =
        keccak256("POOL_ID_EARLY_UNSTAKE_COOLDOWN_PERIOD_DAYS_ZERO");
    bytes32 public constant POOL_ID_EARLY_UNSTAKE_MAX_PENALTY_PERCENT_WEI_EXCEED_100 =
        keccak256("POOL_ID_EARLY_UNSTAKE_MAX_PENALTY_PERCENT_WEI_EXCEED_100");
    bytes32 public constant POOL_ID_EARLY_UNSTAKE_MIN_PENALTY_PERCENT_WEI_EXCEED_100 =
        keccak256("POOL_ID_EARLY_UNSTAKE_MIN_PENALTY_PERCENT_WEI_EXCEED_100");
    bytes32 public constant POOL_ID_EARLY_UNSTAKE_MIN_EXCEED_MAX_PENALTY_PERCENT_WEI =
        keccak256("POOL_ID_EARLY_UNSTAKE_MIN_EXCEED_MAX_PENALTY_PERCENT_WEI");

    // https://github.com/crytic/slither/wiki/Detector-Documentation#too-many-digits
    // slither-disable-next-line too-many-digits
    address public constant STAKE_TOKEN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;
    // slither-disable-next-line too-many-digits
    address public constant REWARD_TOKEN_ADDRESS =
        0x00000000000000000000000000000000DeaDBeef;

    // https://github.com/crytic/slither/wiki/Detector-Documentation#cyclomatic-complexity
    // slither-disable-next-line cyclomatic-complexity
    function getStakingPoolInfo(bytes32 poolId)
        external
        view
        virtual
        override
        returns (StakingPoolInfo memory stakingPoolInfo)
    {
        stakingPoolInfo.stakeDurationDays = poolId == POOL_ID_STAKE_DURATION_ZERO ? 0 : 1;
        stakingPoolInfo.stakeTokenAddress = poolId == POOL_ID_STAKE_TOKEN_ADDRESS_ZERO
            ? address(0)
            : STAKE_TOKEN_ADDRESS;
        stakingPoolInfo.stakeTokenDecimals = poolId == POOL_ID_STAKE_TOKEN_DECIMALS_NINETEEN
            ? 19
            : 18;
        stakingPoolInfo.rewardTokenAddress = poolId == POOL_ID_REWARD_TOKEN_ADDRESS_ZERO
            ? address(0)
            : REWARD_TOKEN_ADDRESS;
        stakingPoolInfo.rewardTokenDecimals = poolId == POOL_ID_REWARD_TOKEN_DECIMALS_NINETEEN
            ? 19
            : 18;
        stakingPoolInfo.poolAprWei = poolId == POOL_ID_POOL_APR_ZERO ? 0 : 1;
        stakingPoolInfo.earlyUnstakeCooldownPeriodDays = poolId == POOL_ID_EARLY_UNSTAKE_COOLDOWN_PERIOD_DAYS_ZERO ? 0 : 1;
        stakingPoolInfo.earlyUnstakePenaltyMaxPercentWei = poolId == POOL_ID_EARLY_UNSTAKE_MAX_PENALTY_PERCENT_WEI_EXCEED_100
            ? 101 ether
            : (poolId == POOL_ID_EARLY_UNSTAKE_MIN_EXCEED_MAX_PENALTY_PERCENT_WEI ? 10 ether : 1);
        stakingPoolInfo.earlyUnstakePenaltyMinPercentWei = poolId == POOL_ID_EARLY_UNSTAKE_MIN_PENALTY_PERCENT_WEI_EXCEED_100
            ? 101 ether
            : (poolId == POOL_ID_EARLY_UNSTAKE_MIN_EXCEED_MAX_PENALTY_PERCENT_WEI ? 20 ether : 1);
        stakingPoolInfo.isOpen = poolId == POOL_ID_IS_OPEN_TRUE ? true : false;
        stakingPoolInfo.isActive = poolId == POOL_ID_IS_ACTIVE_TRUE ? true : false;
        stakingPoolInfo.isInitialized = poolId == POOL_ID_IS_INITIALIZED_FALSE ? false : true;
    }
}
