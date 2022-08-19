// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Enjinstarter
pragma solidity ^0.8.0;

/**
 * @title MockStakingPool
 * @author Tim Loh
 */
contract MockStakingPool {
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

    // https://github.com/crytic/slither/wiki/Detector-Documentation#too-many-digits
    // slither-disable-next-line too-many-digits
    address public constant STAKE_TOKEN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;
    // slither-disable-next-line too-many-digits
    address public constant REWARD_TOKEN_ADDRESS =
        0x00000000000000000000000000000000DeaDBeef;

    function getStakingPoolInfo(bytes32 poolId)
        external
        view
        virtual
        returns (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            bool isOpen,
            bool isActive
        )
    {
        stakeDurationDays = poolId == POOL_ID_STAKE_DURATION_ZERO ? 0 : 1;
        stakeTokenAddress = poolId == POOL_ID_STAKE_TOKEN_ADDRESS_ZERO
            ? address(0)
            : STAKE_TOKEN_ADDRESS;
        stakeTokenDecimals = poolId == POOL_ID_STAKE_TOKEN_DECIMALS_NINETEEN
            ? 19
            : 18;
        rewardTokenAddress = poolId == POOL_ID_REWARD_TOKEN_ADDRESS_ZERO
            ? address(0)
            : REWARD_TOKEN_ADDRESS;
        rewardTokenDecimals = poolId == POOL_ID_REWARD_TOKEN_DECIMALS_NINETEEN
            ? 19
            : 18;
        poolAprWei = poolId == POOL_ID_POOL_APR_ZERO ? 0 : 1;
        isOpen = poolId == POOL_ID_IS_OPEN_TRUE ? true : false;
        isActive = poolId == POOL_ID_IS_ACTIVE_TRUE ? true : false;
    }
}
