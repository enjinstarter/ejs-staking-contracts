// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Enjinstarter
pragma solidity ^0.8.0;

import {IAccessControl} from  "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title StakingPoolV2 Interface
 * @author Tim Loh
 * @notice Interface for StakingPoolV2 which contains the staking pool configs used by StakingServiceV2
 */
interface IStakingPoolV2 is IAccessControl {
    struct StakingPoolDto {
        uint256 stakeDurationDays; // duration in days that user stakes will be locked in staking pool
        address stakeTokenAddress; // address of the ERC20 stake token for staking pool
        uint256 stakeTokenDecimals; // ERC20 stake token decimal places
        address rewardTokenAddress; // address of the ERC20 reward token for staking pool
        uint256 rewardTokenDecimals; // ERC20 reward token decimal places
        uint256 poolAprWei; // APR (Annual Percentage Rate) in wei for staking pool
        uint256 earlyUnstakeCooldownPeriodDays;  // early unstake cooldown period in days
        uint256 earlyUnstakePenaltyMaxPercentWei; // early unstake max penalty percentage in wei
        uint256 earlyUnstakePenaltyMinPercentWei; // early unstake min penalty percentage in wei
    }

    struct StakingPoolInfo {
        uint256 stakeDurationDays; // duration in days that user stakes will be locked in staking pool
        address stakeTokenAddress; // address of the ERC20 stake token for staking pool
        uint256 stakeTokenDecimals; // ERC20 stake token decimal places
        address rewardTokenAddress; // address of the ERC20 reward token for staking pool
        uint256 rewardTokenDecimals; // ERC20 reward token decimal places
        uint256 poolAprWei; // APR (Annual Percentage Rate) in wei for staking pool
        uint256 earlyUnstakeCooldownPeriodDays;  // early unstake cooldown period in days
        uint256 earlyUnstakePenaltyMaxPercentWei; // early unstake max penalty percentage in wei
        uint256 earlyUnstakePenaltyMinPercentWei; // early unstake min penalty percentage in wei
        bool isOpen; // true if staking pool allows staking
        bool isActive; // true if staking pool allows claim rewards and unstake
        bool isInitialized; // true if staking pool has been initialized
    }

    /**
     * @notice Emitted when early unstake cooldown period has been changed from `oldCooldownPeriodDays` to
     *         `newCooldownPeriodDays` for given staking pool
     * @param poolId The staking pool identifier
     * @param sender The address that changed the early unstake cooldown period
     * @param oldCooldownPeriodDays The old early unstake cooldown period in days
     * @param newCooldownPeriodDays The new early unstake cooldown period in days
     */
    event EarlyUnstakeCooldownPeriodChanged(
        bytes32 indexed poolId,
        address indexed sender,
        uint256 oldCooldownPeriodDays,
        uint256 newCooldownPeriodDays
    );

    /**
     * @notice Emitted when early unstake max and min penalty percentage has been changed from
     *         `oldPenaltyMaxPercentWei` and `oldPenaltyMinPercentWei` to `newPenaltyMaxPercentWei` and
     *         `newPenaltyMinPercentWei` respectively for given staking pool
     * @param poolId The staking pool identifier
     * @param sender The address that changed the early unstake penalty percentage
     * @param oldPenaltyMaxPercentWei The old early unstake max penalty percentage in wei
     * @param oldPenaltyMinPercentWei The old early unstake min penalty percentage in wei
     * @param newPenaltyMaxPercentWei The new early unstake max penalty percentage in wei
     * @param newPenaltyMinPercentWei The new early unstake min penalty percentage in wei
     */
    event EarlyUnstakePenaltyPercentChanged(
        bytes32 indexed poolId,
        address indexed sender,
        uint256 oldPenaltyMaxPercentWei,
        uint256 oldPenaltyMinPercentWei,
        uint256 newPenaltyMaxPercentWei,
        uint256 newPenaltyMinPercentWei
    );

    /**
     * @notice Emitted when a staking pool has been closed
     * @param poolId The staking pool identifier
     * @param sender The address that closed the staking pool
     */
    event StakingPoolClosed(bytes32 indexed poolId, address indexed sender);

    /**
     * @notice Emitted when a staking pool has been created
     * @param poolId The staking pool identifier
     * @param sender The address that created the staking pool
     * @param stakeDurationDays The duration in days that user stakes will be locked in staking pool
     * @param stakeTokenAddress The address of the ERC20 stake token for staking pool
     * @param stakeTokenDecimals The ERC20 stake token decimal places
     * @param rewardTokenAddress The address of the ERC20 reward token for staking pool
     * @param rewardTokenDecimals The ERC20 reward token decimal places
     * @param poolAprWei The APR (Annual Percentage Rate) in wei for staking pool
     * @param earlyUnstakeCooldownPeriodDays The early unstake cooldown period in days
     * @param earlyUnstakePenaltyMaxPercentWei The early unstake max penalty percentage in wei
     * @param earlyUnstakePenaltyMinPercentWei The early unstake min penalty percentage in wei
     */
    event StakingPoolCreated(
        bytes32 indexed poolId,
        address indexed sender,
        uint256 indexed stakeDurationDays,
        address stakeTokenAddress,
        uint256 stakeTokenDecimals,
        address rewardTokenAddress,
        uint256 rewardTokenDecimals,
        uint256 poolAprWei,
        uint256 earlyUnstakeCooldownPeriodDays,
        uint256 earlyUnstakePenaltyMaxPercentWei,
        uint256 earlyUnstakePenaltyMinPercentWei
    );

    /**
     * @notice Emitted when a staking pool has been opened
     * @param poolId The staking pool identifier
     * @param sender The address that opened the staking pool
     */
    event StakingPoolOpened(bytes32 indexed poolId, address indexed sender);

    /**
     * @notice Emitted when a staking pool has been resumed
     * @param poolId The staking pool identifier
     * @param sender The address that resumed the staking pool
     */
    event StakingPoolResumed(bytes32 indexed poolId, address indexed sender);

    /**
     * @notice Emitted when a staking pool has been suspended
     * @param poolId The staking pool identifier
     * @param sender The address that suspended the staking pool
     */
    event StakingPoolSuspended(bytes32 indexed poolId, address indexed sender);

    /**
     * @notice Closes the given staking pool to reject user stakes
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function closeStakingPool(bytes32 poolId) external;

    /**
     * @notice Creates a staking pool for the given pool identifier and config
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     * param stakingPoolInfo The staking pool info
     */
    function createStakingPool(bytes32 poolId, StakingPoolDto calldata stakingPoolDto) external;

    /**
     * @notice Opens the given staking pool to accept user stakes
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function openStakingPool(bytes32 poolId) external;

    /**
     * @notice Resumes the given staking pool to allow user reward claims and unstakes
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function resumeStakingPool(bytes32 poolId) external;

    /**
     * @notice Set the early unstake cooldown period in days
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     * @param newCooldownPeriodDays The cooldown period in days
     */
    function setEarlyUnstakeCooldownPeriod(bytes32 poolId, uint256 newCooldownPeriodDays) external;

    /**
     * @notice Set the early unstake penalty percentage in wei
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     * @param newPenaltyMaxPercentWei The max penalty percentage in wei
     * @param newPenaltyMinPercentWei The min penalty percentage in wei
     */
    function setEarlyUnstakePenaltyPercent(bytes32 poolId, uint256 newPenaltyMaxPercentWei, uint256 newPenaltyMinPercentWei) external;

    /**
     * @notice Suspends the given staking pool to prevent user reward claims and unstakes
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function suspendStakingPool(bytes32 poolId) external;

    /**
     * @notice Returns the given staking pool info
     * @param poolId The staking pool identifier
     * @return stakingPoolInfo The staking pool info
     */
    function getStakingPoolInfo(bytes32 poolId)
        external
        view
        returns (StakingPoolInfo memory stakingPoolInfo);
}
