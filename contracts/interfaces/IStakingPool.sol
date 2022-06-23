// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/access/IAccessControl.sol";

/**
 * @title IStakingPool
 * @author Tim Loh
 */
interface IStakingPool is IAccessControl {
    /**
     * @dev Emitted when staking pool has been closed
     */
    event StakingPoolClosed(bytes32 indexed poolId, address indexed sender);

    /**
     * @dev Emitted when staking pool has been created
     */
    event StakingPoolCreated(
        bytes32 indexed poolId,
        address indexed sender,
        uint256 indexed stakeDurationDays,
        address stakeTokenAddress,
        uint256 stakeTokenDecimals,
        address rewardTokenAddress,
        uint256 rewardTokenDecimals,
        uint256 poolAprWei
    );

    /**
     * @dev Emitted when staking pool has been opened
     */
    event StakingPoolOpened(bytes32 indexed poolId, address indexed sender);

    /**
     * @dev Emitted when staking pool has been resumed
     */
    event StakingPoolResumed(bytes32 indexed poolId, address indexed sender);

    /**
     * @dev Emitted when staking pool has been suspended
     */
    event StakingPoolSuspended(bytes32 indexed poolId, address indexed sender);

    function getStakingPoolInfo(bytes32 poolId)
        external
        view
        returns (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            bool isOpen,
            bool isActive
        );

    function closeStakingPool(bytes32 poolId) external;

    function createStakingPool(
        bytes32 poolId,
        uint256 stakeDurationDays,
        address stakeTokenAddress,
        uint256 stakeTokenDecimals,
        address rewardTokenAddress,
        uint256 rewardTokenDecimals,
        uint256 poolAprWei
    ) external;

    function openStakingPool(bytes32 poolId) external;

    function resumeStakingPool(bytes32 poolId) external;

    function suspendStakingPool(bytes32 poolId) external;
}
