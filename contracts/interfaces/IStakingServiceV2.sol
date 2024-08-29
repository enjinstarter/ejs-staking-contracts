// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Enjinstarter
pragma solidity ^0.8.0;

import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {IAdminWallet} from "./IAdminWallet.sol";

/**
 * @title StakingServiceV2 Interface
 * @author Tim Loh
 * @notice Interface for StakingServiceV2 which provides staking v2 functionalities
 */
interface IStakingServiceV2 is IAccessControl, IAdminWallet {
    struct StakeInfo {
        uint256 estimatedRewardAtMaturityWei; // estimated reward at maturity in Wei
        uint256 estimatedRewardAtUnstakeWei; // estimated reward at unstake in Wei
        uint256 revokedRewardAmountWei; // revoked reward amount in Wei
        uint256 revokedStakeAmountWei; // revoked stake amount in Wei
        uint256 revokeTimestamp; // timestamp when stake is revoked
        uint256 rewardClaimedWei; // reward claimed in Wei
        uint256 stakeAmountWei; // stake amount in Wei
        uint256 stakeMaturityTimestamp; // timestamp when stake matures
        uint256 stakeTimestamp; // timestamp when stake
        uint256 unstakeAmountWei; // unstaked amount in Wei
        uint256 unstakeCooldownExpiryTimestamp; // timestamp when unstake cooldown expires
        uint256 unstakePenaltyAmountWei; // early unstake penalty amount in Wei
        uint256 unstakePenaltyPercentWei; // early unstake penalty percentage in Wei
        uint256 unstakeTimestamp; // timestamp when unstake
        uint256 withdrawUnstakeTimestamp; // timestamp when unstake is withdrawn
        bool isActive; // true if allow claim rewards and unstake
        bool isInitialized; // true if stake info has been initialized
    }

    struct StakingPoolStats {
        uint256 rewardToBeDistributedWei; // allocated pool reward to be distributed in Wei
        uint256 totalRevokedRewardWei; // total revoked reward from pool in Wei
        uint256 totalRevokedStakeWei; // total revoked stake from pool in Wei
        uint256 totalRevokedStakeRemovedWei; // total revoked stake removed from pool in Wei
        uint256 totalRewardAddedWei; // total pool reward added in Wei
        uint256 totalRewardClaimedWei; // total reward claimed from pool in Wei
        uint256 totalRewardRemovedWei; // total pool reward removed in Wei
        uint256 totalStakedWei; // total staked inside pool in Wei
        uint256 totalUnstakedAfterMatureWei; // total unstaked after maturity from pool in Wei
        uint256 totalUnstakedBeforeMatureWei; // total unstaked before maturity from pool in Wei
        uint256 totalUnstakedRewardBeforeMatureWei; // total unstaked reward before mature in Wei
        uint256 totalUnstakePenaltyAmountWei; // total unstake penalty amount collected for pool in Wei
        uint256 totalUnstakePenaltyRemovedWei; // total unstake penalty removed from pool in wei
        uint256 totalWithdrawnUnstakeWei; // total unstake withdrawned from pool in wei
    }

    struct StakingPoolStatsDto {
        bool isOpen; // true if staking pool allows staking
        bool isActive; // true if staking pool allows claim rewards and unstake
        uint256 poolRemainingRewardWei; // remaining pool reward in wei
        uint256 poolRewardAmountWei; // pool reward amount in Wei
        uint256 poolSizeWei; // pool size in Wei
        uint256 rewardToBeDistributedWei; // allocated pool reward to be distributed in Wei
        uint256 totalRevokedRewardWei; // total revoked reward from pool in Wei
        uint256 totalRevokedStakeWei; // total revoked stake from pool in Wei
        uint256 totalRevokedStakeRemovedWei; // total revoked stake removed from pool in Wei
        uint256 totalRewardAddedWei; // total pool reward added in Wei
        uint256 totalRewardClaimedWei; // total reward claimed from pool in Wei
        uint256 totalRewardRemovedWei; // total pool reward removed in Wei
        uint256 totalStakedWei; // total staked inside pool in Wei
        uint256 totalUnstakedAfterMatureWei; // total unstaked after maturity from pool in Wei
        uint256 totalUnstakedBeforeMatureWei; // total unstaked before maturity from pool in Wei
        uint256 totalUnstakedRewardBeforeMatureWei; // total unstaked reward before mature in Wei
        uint256 totalUnstakePenaltyAmountWei; // total unstake penalty amount collected for pool in Wei
        uint256 totalUnstakePenaltyRemovedWei; // total unstake penalty removed from pool in wei
        uint256 totalWithdrawnUnstakeWei; // total unstake withdrawned from pool in wei
    }

    struct UnstakeInfo {
        uint256 estimatedRewardAtUnstakeWei; // estimated reward at unstake in Wei
        uint256 unstakeAmountWei; // unstaked amount in Wei
        uint256 unstakePenaltyAmountWei; // early unstake penalty amount in Wei
        uint256 unstakePenaltyPercentWei; // early unstake penalty percentage in Wei
        uint256 unstakeCooldownPeriodDays;  // early unstake cooldown period in days
        bool isStakeMature; // true if stake is mature
    }

    /**
     * @notice Emitted when revoked stakes have been removed from pool
     * @param poolId The staking pool identifier
     * @param sender The address that withdrew the revoked stakes to admin wallet
     * @param adminWallet The address of the admin wallet receiving the funds
     * @param stakeToken The address of the transferred ERC20 token
     * @param stakeAmountWei The amount of tokens transferred in Wei
     */
    event RevokedStakesRemoved(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed adminWallet,
        address stakeToken,
        uint256 stakeAmountWei
    );

    /**
     * @notice Emitted when stake duration has been changed due to revshare claim
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that placed the stake
     * @param stakeId The stake identifier
     * @param revshareStakeDurationExtensionDays The stake duration extension in days for claim revshare
     * @param oldStakeMaturityTimestamp The timestamp when stake matures before the stake duration was changed
     * @param newStakeMaturityTimestamp The timestamp when stake matures after the stake duration was changed
     * @param sender The address that changed the stake duration
     */
    event RevshareStakeDurationExtended(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        uint256 revshareStakeDurationExtensionDays,
        uint256 oldStakeMaturityTimestamp,
        uint256 newStakeMaturityTimestamp,
        address sender
    );

    /**
     * @notice Emitted when reward has been claimed by user
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet receiving funds
     * @param stakeId The stake identifier
     * @param rewardToken The address of the transferred ERC20 token
     * @param rewardWei The amount of tokens transferred in Wei
     */
    event RewardClaimed(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address rewardToken,
        uint256 rewardWei
    );

    /**
     * @notice Emitted when stake has been placed by user
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that placed the stake
     * @param stakeId the stake identifier
     * @param stakeToken The address of the ERC20 stake token
     * @param stakeAmountWei The amount of tokens staked in Wei
     * @param stakeTimestamp The timestamp as seconds since unix epoch when the stake was placed
     * @param stakeMaturityTimestamp The timestamp as seconds since unix epoch when the stake matures
     * @param rewardAtMaturityWei The expected reward in Wei at maturity
     */
    event Staked(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address stakeToken,
        uint256 stakeAmountWei,
        uint256 stakeTimestamp,
        uint256 stakeMaturityTimestamp,
        uint256 rewardAtMaturityWei
    );

    /**
     * @notice Emitted when user stake has been resumed
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet whose stake has been resumed
     * @param stakeId The stake idenitfier
     * @param sender The address that resumed the stake
     */
    event StakeResumed(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address sender
    );

    /**
     * @notice Emitted when user stake with reward has been revoked
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet whose stake has been revoked
     * @param stakeId The stake identifier
     * @param stakeToken The address of the ERC20 stake token
     * @param revokedStakeAmountWei The revoked amount of stake in Wei
     * @param rewardToken The address of the ERC20 reward token
     * @param revokedRewardAmountWei The revoked amount of reward in Wei
     * @param sender The address that revoked the user stake
     */
    event StakeRevoked(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address stakeToken,
        uint256 revokedStakeAmountWei,
        address rewardToken,
        uint256 revokedRewardAmountWei,
        address sender
    );

    /**
     * @notice Emitted when user stake has been suspended
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet whose stake has been suspended
     * @param stakeId The stake identifier
     * @param sender The address that suspended the user stake
     */
    event StakeSuspended(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address sender
    );

    /**
     * @notice Emitted when staking pool contract has been changed
     * @param oldStakingPool The address of the staking pool contract before the staking pool was changed
     * @param newStakingPool The address pf the staking pool contract after the staking pool was changed
     * @param sender The address that changed the staking pool contract
     */
    event StakingPoolContractChanged(
        address indexed oldStakingPool,
        address indexed newStakingPool,
        address indexed sender
    );

    /**
     * @notice Emitted when reward has been added to staking pool
     * @param poolId The staking pool identifier
     * @param sender The address that added the reward
     * @param rewardToken The address of the ERC20 reward token
     * @param rewardAmountWei The amount of reward tokens added in Wei
     */
    event StakingPoolRewardAdded(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed rewardToken,
        uint256 rewardAmountWei
    );

    /**
     * @notice Emitted when unallocated reward has been removed from staking pool
     * @param poolId The staking pool identifier
     * @param sender The address that removed the unallocated reward
     * @param adminWallet The address of the admin wallet receiving the funds
     * @param rewardToken The address of the ERC20 reward token
     * @param rewardAmountWei The amount of reward tokens removed in Wei
     */
    event StakingPoolRewardRemoved(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed adminWallet,
        address rewardToken,
        uint256 rewardAmountWei
    );

    /**
     * @notice Emitted when stake with reward has been unstaked by user
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that unstaked
     * @param stakeId The stake identifier
     * @param stakeToken The address of the ERC20 stake token
     * @param earlyUnstakePenaltyMaxPercentWei The early unstake max penalty percentage in wei
     * @param earlyUnstakePenaltyMinPercentWei The early unstake min penalty percentage in wei
     * @param stakeAmountWei The amount of tokens staked in Wei
     * @param estimatedRewardAtUnstakeWei The estimated reward at unstake in wei
     * @param unstakeAmountWei The amount of stake tokens unstaked in Wei
     * @param unstakePenaltyAmountWei The unstake penalty amount in wei
     * @param unstakePenaltyPercentWei The unstake penalty percentage in wei
     * @param unstakeCooldownPeriodDays The unstake cooldown period in days
     * @param unstakeCooldownExpiryTimestamp The timestamp as seconds since unix epoch when the unstake cooldown expires
     */
    event Unstaked(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address stakeToken,
        uint256 earlyUnstakePenaltyMaxPercentWei,
        uint256 earlyUnstakePenaltyMinPercentWei,
        uint256 stakeAmountWei,
        uint256 estimatedRewardAtUnstakeWei,
        uint256 unstakeAmountWei,
        uint256 unstakePenaltyAmountWei,
        uint256 unstakePenaltyPercentWei,
        uint256 unstakeCooldownPeriodDays,
        uint256 unstakeCooldownExpiryTimestamp
    );

    /**
     * @notice Emitted when unstake penalty have been removed from pool
     * @param poolId The staking pool identifier
     * @param sender The address that withdrew the unstake penalty to admin wallet
     * @param adminWallet The address of the admin wallet receiving the funds
     * @param stakeToken The address of the transferred ERC20 token
     * @param unstakePenaltyRemovedWei The amount of tokens transferred in Wei
     */
    event UnstakePenaltyRemoved(
        bytes32 indexed poolId,
        address indexed sender,
        address indexed adminWallet,
        address stakeToken,
        uint256 unstakePenaltyRemovedWei
    );

    /**
     * @notice Emitted when unstake has been withdrawn by user
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that received the funds
     * @param stakeId The stake identifier
     * @param stakeToken The address of the ERC20 stake token
     * @param withdrawnAmountWei The amount of tokens withdrawn in Wei
     * @param withdrawTimestamp The timestamp as seconds since unix epoch when the unstake was withdrawn
     */
    event UnstakeWithdrawn(
        bytes32 indexed poolId,
        address indexed account,
        bytes32 indexed stakeId,
        address stakeToken,
        uint256 withdrawnAmountWei,
        uint256 withdrawTimestamp
    );

    /**
     * @notice Claim reward from given staking pool for message sender
     * @param poolId The staking pool identifier
     * @param stakeId The stake identifier
     */
    function claimReward(bytes32 poolId, bytes32 stakeId) external;

    /**
     * @notice Stake given amount in given staking pool for message sender
     * @dev Requires the user to have approved the transfer of stake amount to this contract.
     *      User can increase an existing stake that has not matured yet but stake maturity date will
     *      be reset while rewards earned up to the point where stake is increased will be accumulated.
     * @param poolId The staking pool identifier
     * @param stakeId The stake identifier
     * @param stakeAmountWei The amount of tokens to stake in Wei
     */
    function stake(bytes32 poolId, bytes32 stakeId, uint256 stakeAmountWei) external;

    /**
     * @notice Unstake from given staking pool for message sender
     * @param poolId The staking pool identifier
     * @param stakeId The stake identifier
     */
    function unstake(bytes32 poolId, bytes32 stakeId) external;

    /**
     * @notice Withdraw unstake from given staking pool for message sender
     * @param poolId The staking pool identifier
     * @param stakeId The stake identifier
     */
    function withdrawUnstake(bytes32 poolId, bytes32 stakeId) external;

    /**
     * @notice Extend stake duration in days for claim revshare
     * @dev Must be called by contract usage role.
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     * @return isExtended true if stake duration has been extended
     */
    function revshareExtendStakeDuration(
        bytes32 poolId,
        address account,
        bytes32 stakeId
    ) external returns (bool isExtended);

    /**
     * @notice Add reward to given staking pool
     * @dev Must be called by contract admin role.
     *      Requires the admin user to have approved the transfer of reward amount to this contract.
     * @param poolId The staking pool identifier
     * @param rewardAmountWei The amount of reward tokens to add in Wei
     */
    function addStakingPoolReward(bytes32 poolId, uint256 rewardAmountWei)
        external;

    /**
     * @notice Pause user functions (stake, claimReward, unstake)
     * @dev Must be called by contract admin role
     */
    function pauseContract() external;

    /**
     * @notice Withdraw revoked stakes from given staking pool to admin wallet
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function removeRevokedStakes(bytes32 poolId) external;

    /**
     * @notice Withdraw unallocated reward from given staking pool to admin wallet
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function removeUnallocatedStakingPoolReward(bytes32 poolId) external;

    /**
     * @notice Withdraw unstake penalty from given staking pool to admin wallet
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     */
    function removeUnstakePenalty(bytes32 poolId) external;

    /**
     * @notice Resume stake for given staking pool and account
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     */
    function resumeStake(bytes32 poolId, address account, bytes32 stakeId) external;

    /**
     * @notice Revoke stake for given staking pool and account
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     */
    function revokeStake(bytes32 poolId, address account, bytes32 stakeId) external;

    /**
     * @notice Suspend stake for given staking pool and account
     * @dev Must be called by contract admin role
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     */
    function suspendStake(bytes32 poolId, address account, bytes32 stakeId) external;

    /**
     * @notice Unpause user functions (stake, claimReward, unstake)
     * @dev Must be called by contract admin role
     */
    function unpauseContract() external;

    /**
     * @notice Change admin wallet to a new wallet address
     * @dev Must be called by governance role
     * @param newWallet The new admin wallet
     */
    function setAdminWallet(address newWallet) external;

    /**
     * @notice Change staking pool contract to a new contract address
     * @dev Must be called by governance role
     * @param newStakingPool The new staking pool contract address
     */
    function setStakingPoolContract(address newStakingPool) external;

    /**
     * @notice Returns the claimable reward in Wei for given staking pool and account
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     * @return Claimable reward in Wei
     */
    function getClaimableRewardWei(bytes32 poolId, address account, bytes32 stakeId)
        external
        view
        returns (uint256);

    /**
     * @notice Returns the stake info for given staking pool and account
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     * @return stakeInfo The stake info for given staking pool and account
     */
    function getStakeInfo(bytes32 poolId, address account, bytes32 stakeId)
        external
        view
        returns (StakeInfo memory stakeInfo);

    /**
     * @notice Returns the staking pool statistics for given staking pool
     * @param poolId The staking pool identifier
     * @return stakingPoolStatsDto The staking pool statistics for given staking pool
     */
    function getStakingPoolStats(bytes32 poolId)
        external
        view
        returns (StakingPoolStatsDto memory stakingPoolStatsDto);

    /**
     * @notice Returns the unstaking info for given staking pool and account
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that staked
     * @param stakeId The stake identifier
     * @return unstakeInfo The unstaking info for given staking pool and account
     */
    function getUnstakingInfo(bytes32 poolId, address account, bytes32 stakeId)
        external
        view
        returns (UnstakeInfo memory unstakeInfo);

    /**
     * @notice Returns the staking pool contract address
     * @return Staking pool contract address
     */
    function stakingPoolContract() external view returns (address);

    /**
     * @notice Get contract usage role definition
     * @return Returns contract usage role definition
     */
    // https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions
    // slither-disable-next-line naming-convention
    function CONTRACT_USAGE_ROLE() external view returns (bytes32); // solhint-disable-line func-name-mixedcase
}
