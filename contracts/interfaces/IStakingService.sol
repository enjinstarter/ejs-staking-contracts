// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/access/IAccessControl.sol";
import "./IAdminWallet.sol";

/**
 * @title IStakingService
 * @author Tim Loh
 */
interface IStakingService is IAccessControl, IAdminWallet {
    /**
     * @dev Emitted when revoked stakes have been removed from pool
     */
    event RevokedStakesRemoved(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed adminWallet,
        address stakeToken,
        uint256 stakeAmountWei
    );

    /**
     * @dev Emitted when reward has been claimed
     */
    event RewardClaimed(
        bytes32 indexed poolId,
        address indexed account,
        address indexed rewardToken,
        uint256 rewardWei
    );

    /**
     * @dev Emitted when stake has been placed
     */
    event Staked(
        bytes32 indexed poolId,
        address indexed account,
        address indexed stakeToken,
        uint256 stakeAmountWei,
        uint256 stakeTimestamp,
        uint256 stakeMaturityTimestamp,
        uint256 rewardAtMaturityWei
    );

    /**
     * @dev Emitted when stake has been resumed
     */
    event StakeResumed(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed account
    );

    /**
     * @dev Emitted when stake with reward has been revoked
     */
    event StakeRevoked(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed account,
        address stakeToken,
        uint256 stakeAmountWei,
        address rewardToken,
        uint256 rewardWei
    );

    /**
     * @dev Emitted when stake has been suspended
     */
    event StakeSuspended(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed account
    );

    /**
     * @dev Emitted when staking pool has been changed
     */
    event StakingPoolContractChanged(
        address indexed oldStakingPool,
        address indexed newStakingPool,
        address indexed sender
    );

    /**
     * @dev Emitted when reward has been added to pool
     */
    event StakingPoolRewardAdded(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed rewardToken,
        uint256 rewardAmountWei
    );

    /**
     * @dev Emitted when reward has been removed from pool
     */
    event StakingPoolRewardRemoved(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed adminWallet,
        address rewardToken,
        uint256 rewardAmountWei
    );

    /**
     * @dev Emitted when stake with reward has been withdrawn
     */
    event Unstaked(
        bytes32 indexed poolId,
        address indexed account,
        address indexed stakeToken,
        uint256 unstakeAmountWei,
        address rewardToken,
        uint256 rewardWei
    );

    function stakingPoolContract() external view returns (address);

    function getClaimableRewardWei(bytes32 poolId, address account)
        external
        view
        returns (uint256);

    function getStakeInfo(bytes32 poolId, address account)
        external
        view
        returns (
            uint256 stakeAmountWei,
            uint256 stakeTimestamp,
            uint256 stakeMaturityTimestamp,
            uint256 estimatedRewardAtMaturityWei,
            uint256 rewardClaimedWei,
            bool isActive
        );

    function getStakingPoolStats(bytes32 poolId)
        external
        view
        returns (
            uint256 totalRewardWei,
            uint256 totalStakedWei,
            uint256 rewardToBeDistributedWei,
            uint256 totalRevokedStakeWei,
            uint256 poolSizeWei,
            bool isOpen,
            bool isActive
        );

    function claimReward(bytes32 poolId) external;

    function stake(bytes32 poolId, uint256 stakeAmountWei) external;

    function unstake(bytes32 poolId) external;

    function addStakingPoolReward(bytes32 poolId, uint256 rewardAmountWei)
        external;

    function removeRevokedStakes(bytes32 poolId) external;

    function removeUnallocatedStakingPoolReward(bytes32 poolId) external;

    function resumeStake(bytes32 poolId, address account) external;

    function revokeStake(bytes32 poolId, address account) external;

    function suspendStake(bytes32 poolId, address account) external;

    function pauseContract() external;

    function setAdminWallet(address newWallet) external;

    function setStakingPoolContract(address newStakingPool) external;

    function unpauseContract() external;
}
