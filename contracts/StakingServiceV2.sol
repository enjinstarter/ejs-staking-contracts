// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Enjinstarter
pragma solidity ^0.8.0;

import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {IERC20, TransferErc20} from "./libraries/TransferErc20.sol";
import {UnitConverter} from "./libraries/UnitConverter.sol";
import {AdminPrivileges} from "./AdminPrivileges.sol";
import {AdminWallet} from "./AdminWallet.sol";
import {IStakingPoolV2} from "./interfaces/IStakingPoolV2.sol";
import {IStakingServiceV2} from "./interfaces/IStakingServiceV2.sol";
// import {console} from "hardhat/console.sol"; // solhint-disable-line no-console

/**
 * @title StakingServiceV2
 * @author Tim Loh
 * @notice Provides staking v2 functionalities
 */
contract StakingServiceV2 is
    Pausable,
    AdminPrivileges,
    AdminWallet,
    IStakingServiceV2
{
    using TransferErc20 for IERC20;
    using UnitConverter for uint256;

    uint256 public constant DAYS_IN_YEAR = 365;
    uint256 public constant PERCENT_100_WEI = 100 ether;
    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant TOKEN_MAX_DECIMALS = 18;

    address public stakingPoolContract;

    mapping(bytes => StakeInfo) private _stakes;
    mapping(bytes32 => StakingPoolStats) private _stakingPoolStats;

    constructor(address stakingPoolContract_) {
        require(stakingPoolContract_ != address(0), "SSvcs2: staking pool");

        stakingPoolContract = stakingPoolContract_;
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function claimReward(bytes32 poolId, bytes32 stakeId)
        external
        virtual
        override
        whenNotPaused
    {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);
        require(stakingPoolInfo.isActive, "SSvcs2: pool suspended");

        bytes memory stakekey = _getStakeKey(poolId, msg.sender, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");
        require(!_isStakeRevokedFor(stakekey), "SSvcs2: revoked");
        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");
        require(_isStakeUnstakedFor(stakekey) || _isStakeMaturedFor(stakekey), "SSvcs2: ineligible");

        uint256 rewardAmountWei = _getClaimableRewardWeiFor(stakekey);
        require(rewardAmountWei > 0, "SSvcs2: zero reward");

        _stakes[stakekey].rewardClaimedWei += rewardAmountWei;
        _stakingPoolStats[poolId].totalRewardClaimedWei += rewardAmountWei;

        emit RewardClaimed(
            poolId,
            msg.sender,
            stakeId,
            stakingPoolInfo.rewardTokenAddress,
            rewardAmountWei
        );

        IERC20(stakingPoolInfo.rewardTokenAddress).transferTokensFromContractToAccount(
            stakingPoolInfo.rewardTokenDecimals,
            rewardAmountWei,
            msg.sender
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function stake(bytes32 poolId, bytes32 stakeId, uint256 stakeAmountWei)
        external
        virtual
        override
        whenNotPaused
    {
        require(stakeAmountWei > 0, "SSvcs2: stake amount");

        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);
        require(stakingPoolInfo.isOpen, "SSvcs2: pool closed");

        uint256 stakeMaturityTimestamp = _calculateStakeMaturityTimestamp(
            stakingPoolInfo.stakeDurationDays,
            block.timestamp
        );
        require(
            stakeMaturityTimestamp > block.timestamp,
            "SSvcs2: maturity timestamp"
        );

        uint256 truncatedStakeAmountWei = stakeAmountWei.truncateWeiToDecimals(stakingPoolInfo.stakeTokenDecimals);
        require(truncatedStakeAmountWei > 0, "SSvcs2: truncated stake amount");

        bytes memory stakekey = _getStakeKey(poolId, msg.sender, stakeId);
        require(!_stakes[stakekey].isInitialized, "SSvcs2: stake exists");

        uint256 estimatedRewardAtMaturityWei = _estimateRewardAtMaturityWei(
            stakingPoolInfo.stakeDurationDays,
            stakingPoolInfo.poolAprWei,
            truncatedStakeAmountWei
        ).truncateWeiToDecimals(stakingPoolInfo.rewardTokenDecimals);

        // console.log("estimatedRewardAtMaturityWei=%o, calculatePoolRemainingRewardWei=%o", estimatedRewardAtMaturityWei, _calculatePoolRemainingRewardWei(poolId)); // solhint-disable-line no-console

        require(stakingPoolInfo.poolAprWei == 0 || estimatedRewardAtMaturityWei > 0, "SSvcs2: zero reward");

        require(
            estimatedRewardAtMaturityWei <=
                _calculatePoolRemainingRewardWei(poolId),
            "SSvcs2: insufficient"
        );

        _stakes[stakekey] = StakeInfo({
            estimatedRewardAtMaturityWei: estimatedRewardAtMaturityWei,
            estimatedRewardAtUnstakeWei: 0,
            revokedRewardAmountWei: 0,
            revokedStakeAmountWei: 0,
            revokeTimestamp: 0,
            rewardClaimedWei: 0,
            stakeAmountWei: truncatedStakeAmountWei,
            stakeMaturityTimestamp: stakeMaturityTimestamp,
            stakeTimestamp: block.timestamp,
            unstakeAmountWei: 0,
            unstakeCooldownExpiryTimestamp: 0,
            unstakePenaltyAmountWei: 0,
            unstakePenaltyPercentWei: 0,
            unstakeTimestamp: 0,
            withdrawUnstakeTimestamp: 0,
            isActive: true,
            isInitialized: true
        });

        _stakingPoolStats[poolId].totalStakedWei += truncatedStakeAmountWei;
        _stakingPoolStats[poolId]
            .rewardToBeDistributedWei += estimatedRewardAtMaturityWei;

        emit Staked(
            poolId,
            msg.sender,
            stakeId,
            stakingPoolInfo.stakeTokenAddress,
            truncatedStakeAmountWei,
            block.timestamp,
            stakeMaturityTimestamp,
            _stakes[stakekey].estimatedRewardAtMaturityWei
        );

        IERC20(stakingPoolInfo.stakeTokenAddress).transferTokensFromSenderToContract(stakingPoolInfo.stakeTokenDecimals, truncatedStakeAmountWei);
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function unstake(bytes32 poolId, bytes32 stakeId) external virtual override whenNotPaused {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);
        require(stakingPoolInfo.isActive, "SSvcs2: pool suspended");

        bytes memory stakekey = _getStakeKey(poolId, msg.sender, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");
        require(!_isStakeRevokedFor(stakekey), "SSvcs2: revoked");
        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");
        require(!_isStakeUnstakedFor(stakekey), "SSvcs2: unstaked");
        require(_stakes[stakekey].estimatedRewardAtUnstakeWei < 1, "SSvcs2: non-zero unstake reward");

        uint256 stakeAmountWei = _stakes[stakekey].stakeAmountWei;
        require(stakeAmountWei > 0, "SSvcs2: zero stake");

        UnstakingInfo memory unstakingInfo = _getUnstakingInfoByStakekey(stakingPoolInfo, stakekey);
        require(unstakingInfo.unstakeAmountWei > 0 || unstakingInfo.unstakePenaltyAmountWei > 0, "SSvcs2: zero unstake");

        uint256 unstakeCooldownExpiryTimestamp = _calculateUnstakeCooldownExpiryTimestamp(
            unstakingInfo.unstakeCooldownPeriodDays,
            block.timestamp
        );

        // console.log("unstakeCooldownExpiryTimestamp=%o, blockTimestamp=%o", unstakeCooldownExpiryTimestamp, block.timestamp); // solhint-disable-line no-console

        require(
            unstakeCooldownExpiryTimestamp >= block.timestamp,
            "SSvcs2: cooldown timestamp"
        );

        _stakes[stakekey].estimatedRewardAtUnstakeWei = unstakingInfo.estimatedRewardAtUnstakingWei;
        _stakes[stakekey].unstakeAmountWei = unstakingInfo.unstakeAmountWei;
        _stakes[stakekey].unstakeCooldownExpiryTimestamp = unstakeCooldownExpiryTimestamp;
        _stakes[stakekey].unstakePenaltyAmountWei = unstakingInfo.unstakePenaltyAmountWei;
        _stakes[stakekey].unstakePenaltyPercentWei = unstakingInfo.unstakePenaltyPercentWei;
        _stakes[stakekey].unstakeTimestamp = block.timestamp;

        if (unstakingInfo.isStakeMature) {
            // console.log("unstake mature: unstakeAmountWei=%o", unstakingInfo.unstakeAmountWei); // solhint-disable-line no-console

            _stakingPoolStats[poolId].totalUnstakedAfterMatureWei += unstakingInfo.unstakeAmountWei;
        } else {
            // console.log("unstake immature: estimatedRewardAtMaturityWei=%o, estimatedRewardAtUnstakingWei=%o", _stakes[stakekey].estimatedRewardAtMaturityWei, unstakingInfo.estimatedRewardAtUnstakingWei); // solhint-disable-line no-console
            // console.log("unstake immature: _getUnstakedRewardBeforeMatureWei=%o", _getUnstakedRewardBeforeMatureWei(_stakes[stakekey].estimatedRewardAtMaturityWei, unstakingInfo.estimatedRewardAtUnstakingWei)); // solhint-disable-line no-console

            _stakingPoolStats[poolId].totalUnstakedBeforeMatureWei += unstakingInfo.unstakeAmountWei;
            _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei += unstakingInfo.unstakePenaltyAmountWei;
            _stakingPoolStats[poolId].totalUnstakedRewardBeforeMatureWei += _getUnstakedRewardBeforeMatureWei(
                _stakes[stakekey].estimatedRewardAtMaturityWei,
                unstakingInfo.estimatedRewardAtUnstakingWei
            );
        }

        emit Unstaked(
            poolId,
            msg.sender,
            stakeId,
            stakingPoolInfo.stakeTokenAddress,
            stakingPoolInfo.earlyUnstakePenaltyMaxPercentWei,
            stakingPoolInfo.earlyUnstakePenaltyMinPercentWei,
            stakeAmountWei,
            unstakingInfo.estimatedRewardAtUnstakingWei,
            unstakingInfo.unstakeAmountWei,
            unstakingInfo.unstakePenaltyAmountWei,
            unstakingInfo.unstakePenaltyPercentWei,
            unstakingInfo.unstakeCooldownPeriodDays,
            unstakeCooldownExpiryTimestamp
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function withdrawUnstake(bytes32 poolId, bytes32 stakeId) external virtual override whenNotPaused {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);
        require(stakingPoolInfo.isActive, "SSvcs2: pool suspended");

        bytes memory stakekey = _getStakeKey(poolId, msg.sender, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");
        require(!_isStakeRevokedFor(stakekey), "SSvcs2: revoked");
        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");
        require(_isStakeUnstakedFor(stakekey), "SSvcs2: not unstake");
        require(!_isUnstakeWithdrawnFor(stakekey), "SSvcs2: withdrawn");
        require(block.timestamp >= _stakes[stakekey].unstakeCooldownExpiryTimestamp, "SSvcs2: cooldown");
        require(_stakes[stakekey].unstakeAmountWei > 0, "SSvcs2: nothing");

        _stakes[stakekey].withdrawUnstakeTimestamp = block.timestamp;
        _stakingPoolStats[poolId].totalWithdrawnUnstakeWei += _stakes[stakekey].unstakeAmountWei;

        emit UnstakeWithdrawn(
            poolId,
            msg.sender,
            stakeId,
            stakingPoolInfo.stakeTokenAddress,
            _stakes[stakekey].unstakeAmountWei,
            block.timestamp
        );

        IERC20(stakingPoolInfo.stakeTokenAddress).transferTokensFromContractToAccount(
            stakingPoolInfo.stakeTokenDecimals,
            _stakes[stakekey].unstakeAmountWei,
            msg.sender
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function addStakingPoolReward(bytes32 poolId, uint256 rewardAmountWei)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(rewardAmountWei > 0, "SSvcs2: reward amount");

        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        uint256 truncatedRewardAmountWei = stakingPoolInfo.rewardTokenDecimals <
            TOKEN_MAX_DECIMALS
            ? rewardAmountWei
                .scaleWeiToDecimals(stakingPoolInfo.rewardTokenDecimals)
                .scaleDecimalsToWei(stakingPoolInfo.rewardTokenDecimals)
            : rewardAmountWei;

        _stakingPoolStats[poolId].totalRewardAddedWei += truncatedRewardAmountWei;

        emit StakingPoolRewardAdded(
            poolId,
            msg.sender,
            stakingPoolInfo.rewardTokenAddress,
            truncatedRewardAmountWei
        );

        IERC20(stakingPoolInfo.rewardTokenAddress).transferTokensFromSenderToContract(stakingPoolInfo.rewardTokenDecimals, truncatedRewardAmountWei);
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function pauseContract()
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        _pause();
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function removeRevokedStakes(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        require(
            _stakingPoolStats[poolId].totalRevokedStakeWei > _stakingPoolStats[poolId].totalRevokedStakeRemovedWei,
            "SSvcs2: no revoked"
        );

        uint256 totalRemovableRevokedStakeWei =
            _stakingPoolStats[poolId].totalRevokedStakeWei - _stakingPoolStats[poolId].totalRevokedStakeRemovedWei;
        _stakingPoolStats[poolId].totalRevokedStakeRemovedWei += totalRemovableRevokedStakeWei;
        require(
            _stakingPoolStats[poolId].totalRevokedStakeWei == _stakingPoolStats[poolId].totalRevokedStakeRemovedWei,
            "SSvcs2: unequal"
        );

        emit RevokedStakesRemoved(
            poolId,
            msg.sender,
            adminWallet(),
            stakingPoolInfo.stakeTokenAddress,
            totalRemovableRevokedStakeWei
        );

        IERC20(stakingPoolInfo.stakeTokenAddress).transferTokensFromContractToAccount(
            stakingPoolInfo.stakeTokenDecimals,
            totalRemovableRevokedStakeWei,
            adminWallet()
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function removeUnallocatedStakingPoolReward(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        uint256 unallocatedRewardWei = _calculatePoolRemainingRewardWei(poolId);
        require(unallocatedRewardWei > 0, "SSvcs2: no unallocated");

        _stakingPoolStats[poolId].totalRewardRemovedWei += unallocatedRewardWei;

        emit StakingPoolRewardRemoved(
            poolId,
            msg.sender,
            adminWallet(),
            stakingPoolInfo.rewardTokenAddress,
            unallocatedRewardWei
        );

        IERC20(stakingPoolInfo.rewardTokenAddress).transferTokensFromContractToAccount(
            stakingPoolInfo.rewardTokenDecimals,
            unallocatedRewardWei,
            adminWallet()
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function removeUnstakePenalty(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        require(
            _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei > _stakingPoolStats[poolId].totalUnstakePenaltyRemovedWei,
            "SSvcs2: no penalty"
        );

        uint256 totalRemovableUnstakePenaltyWei =
            _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei - _stakingPoolStats[poolId].totalUnstakePenaltyRemovedWei;
        _stakingPoolStats[poolId].totalUnstakePenaltyRemovedWei += totalRemovableUnstakePenaltyWei;

        emit UnstakePenaltyRemoved(
            poolId,
            msg.sender,
            adminWallet(),
            stakingPoolInfo.stakeTokenAddress,
            totalRemovableUnstakePenaltyWei
        );

        IERC20(stakingPoolInfo.stakeTokenAddress).transferTokensFromContractToAccount(
            stakingPoolInfo.stakeTokenDecimals,
            totalRemovableUnstakePenaltyWei,
            adminWallet()
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function resumeStake(bytes32 poolId, address account, bytes32 stakeId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");

        require(!_stakes[stakekey].isActive, "SSvcs2: stake active");

        _stakes[stakekey].isActive = true;

        emit StakeResumed(poolId, account, stakeId, msg.sender);
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function revokeStake(bytes32 poolId, address account, bytes32 stakeId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");
        require(!_isStakeRevokedFor(stakekey), "SSvcs2: revoked");

        (uint256 revokedStakeAmountWei, uint256 revokedRewardAmountWei) = _calculateRevokedAmountFor(stakekey);

        // console.log("revokeStake: revokedStakeAmountWei=%o, revokedRewardAmountWei=%o", revokedStakeAmountWei, revokedRewardAmountWei); // solhint-disable-line no-console

        _stakes[stakekey].revokeTimestamp = block.timestamp;
        _stakes[stakekey].revokedStakeAmountWei = revokedStakeAmountWei;
        _stakes[stakekey].revokedRewardAmountWei = revokedRewardAmountWei;

        _stakingPoolStats[poolId].totalRevokedStakeWei += revokedStakeAmountWei;
        _stakingPoolStats[poolId].totalRevokedRewardWei += revokedRewardAmountWei;

        emit StakeRevoked(
            poolId,
            account,
            stakeId,
            stakingPoolInfo.stakeTokenAddress,
            revokedStakeAmountWei,
            stakingPoolInfo.rewardTokenAddress,
            revokedRewardAmountWei,
            msg.sender
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function suspendStake(bytes32 poolId, address account, bytes32 stakeId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");

        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");

        _stakes[stakekey].isActive = false;

        emit StakeSuspended(poolId, account, stakeId, msg.sender);
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function unpauseContract()
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        _unpause();
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function setAdminWallet(address newWallet)
        external
        virtual
        override
        onlyRole(GOVERNANCE_ROLE)
    {
        _setAdminWallet(newWallet);
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function setStakingPoolContract(address newStakingPool)
        external
        virtual
        override
        onlyRole(GOVERNANCE_ROLE)
    {
        require(newStakingPool != address(0), "SSvcs2: new staking pool");

        address oldStakingPool = stakingPoolContract;
        stakingPoolContract = newStakingPool;

        emit StakingPoolContractChanged(
            oldStakingPool,
            newStakingPool,
            msg.sender
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function getClaimableRewardWei(bytes32 poolId, address account, bytes32 stakeId)
        external
        view
        virtual
        override
        returns (uint256)
    {
        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");

        return _getClaimableRewardWeiFor(stakekey);
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function getStakeInfo(bytes32 poolId, address account, bytes32 stakeId)
        external
        view
        virtual
        override
        returns (StakeInfo memory stakeInfo)
    {
        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");

        stakeInfo = StakeInfo({
            estimatedRewardAtMaturityWei: _stakes[stakekey].estimatedRewardAtMaturityWei,
            estimatedRewardAtUnstakeWei: _stakes[stakekey].estimatedRewardAtUnstakeWei,
            revokedRewardAmountWei: _stakes[stakekey].revokedRewardAmountWei,
            revokedStakeAmountWei: _stakes[stakekey].revokedStakeAmountWei,
            revokeTimestamp: _stakes[stakekey].revokeTimestamp,
            rewardClaimedWei:  _stakes[stakekey].rewardClaimedWei,
            stakeAmountWei: _stakes[stakekey].stakeAmountWei,
            stakeMaturityTimestamp: _stakes[stakekey].stakeMaturityTimestamp,
            stakeTimestamp: _stakes[stakekey].stakeTimestamp,
            unstakeAmountWei: _stakes[stakekey].unstakeAmountWei,
            unstakeCooldownExpiryTimestamp: _stakes[stakekey].unstakeCooldownExpiryTimestamp,
            unstakePenaltyAmountWei: _stakes[stakekey].unstakePenaltyAmountWei,
            unstakePenaltyPercentWei: _stakes[stakekey].unstakePenaltyPercentWei,
            unstakeTimestamp: _stakes[stakekey].unstakeTimestamp,
            withdrawUnstakeTimestamp: _stakes[stakekey].withdrawUnstakeTimestamp,
            isActive: _stakes[stakekey].isActive,
            isInitialized: _stakes[stakekey].isInitialized
        });
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function getStakingPoolStats(bytes32 poolId)
        external
        view
        virtual
        override
        returns (StakingPoolStatsDto memory stakingPoolStatsDto)
    {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        stakingPoolStatsDto = StakingPoolStatsDto({
            isActive: stakingPoolInfo.isActive,
            isOpen: stakingPoolInfo.isOpen,
            poolRemainingRewardWei: _calculatePoolRemainingRewardWei(poolId),
            poolRewardAmountWei: _calculatePoolRewardAmountWei(poolId),
            poolSizeWei: _getPoolSizeWei(
                stakingPoolInfo.stakeDurationDays,
                stakingPoolInfo.poolAprWei,
                _calculatePoolRewardAmountWei(poolId),
                stakingPoolInfo.stakeTokenDecimals
            ),
            rewardToBeDistributedWei: _stakingPoolStats[poolId].rewardToBeDistributedWei,
            totalRevokedRewardWei: _stakingPoolStats[poolId].totalRevokedRewardWei,
            totalRevokedStakeWei: _stakingPoolStats[poolId].totalRevokedStakeWei,
            totalRevokedStakeRemovedWei: _stakingPoolStats[poolId].totalRevokedStakeRemovedWei,
            totalRewardAddedWei: _stakingPoolStats[poolId].totalRewardAddedWei,
            totalRewardClaimedWei: _stakingPoolStats[poolId].totalRewardClaimedWei,
            totalRewardRemovedWei: _stakingPoolStats[poolId].totalRewardRemovedWei,
            totalStakedWei: _stakingPoolStats[poolId].totalStakedWei,
            totalUnstakedAfterMatureWei: _stakingPoolStats[poolId].totalUnstakedAfterMatureWei,
            totalUnstakedBeforeMatureWei: _stakingPoolStats[poolId].totalUnstakedBeforeMatureWei,
            totalUnstakedRewardBeforeMatureWei: _stakingPoolStats[poolId].totalUnstakedRewardBeforeMatureWei,
            totalUnstakePenaltyAmountWei: _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei,
            totalUnstakePenaltyRemovedWei: _stakingPoolStats[poolId].totalUnstakePenaltyRemovedWei,
            totalWithdrawnUnstakeWei: _stakingPoolStats[poolId].totalWithdrawnUnstakeWei
        });
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function getUnstakingInfo(bytes32 poolId, address account, bytes32 stakeId)
        external
        view
        virtual
        override
        returns (UnstakingInfo memory unstakingInfo)
    {
        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized stake");
        require(!_isStakeRevokedFor(stakekey), "SSvcs2: revoked stake");
        require(!_isStakeUnstakedFor(stakekey), "SSvcs2: unstaked");

        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        unstakingInfo = _getUnstakingInfoByStakekey(stakingPoolInfo, stakekey);
    }

    /**
     * @dev Returns the remaining reward for the given staking pool in Wei
     * @param poolId The staking pool identifier
     * @return calculatedRemainingRewardWei The calculaated remaining reward in Wei
     */
    function _calculatePoolRemainingRewardWei(bytes32 poolId)
        internal
        view
        virtual
        returns (uint256 calculatedRemainingRewardWei)
    {
        /*
        console.log("_calculatePoolRemainingRewardWei: totalRewardAddedWei=%o, totalRevokedRewardWei=%o", _stakingPoolStats[poolId].totalRewardAddedWei, _stakingPoolStats[poolId].totalRevokedRewardWei); // solhint-disable-line no-console
        console.log("_calculatePoolRemainingRewardWei: totalUnstakedRewardBeforeMatureWei=%o, totalRewardRemovedWei=%o", _stakingPoolStats[poolId].totalUnstakedRewardBeforeMatureWei, _stakingPoolStats[poolId].totalRewardRemovedWei); // solhint-disable-line no-console
        console.log("_calculatePoolRemainingRewardWei: _calculatePoolRewardAmountWei=%o, rewardToBeDistributedWei=%o", _calculatePoolRewardAmountWei(poolId), _stakingPoolStats[poolId].rewardToBeDistributedWei); // solhint-disable-line no-console
        console.log("_calculatePoolRemainingRewardWei: calculatedRemainingRewardWei=%o", calculatedRemainingRewardWei); // solhint-disable-line no-console
        */

        calculatedRemainingRewardWei = _calculatePoolRewardAmountWei(poolId) -
            _stakingPoolStats[poolId].rewardToBeDistributedWei;
    }

    /**
     * @dev Returns the amount of reward for the given staking pool in Wei
     * @param poolId The staking pool identifier
     * @return calculatedRewardAmountWei The calculaated amount of reward in Wei
     */
    function _calculatePoolRewardAmountWei(bytes32 poolId)
        internal
        view
        virtual
        returns (uint256 calculatedRewardAmountWei)
    {
        calculatedRewardAmountWei =
            _stakingPoolStats[poolId].totalRewardAddedWei +
            _stakingPoolStats[poolId].totalRevokedRewardWei +
            _stakingPoolStats[poolId].totalUnstakedRewardBeforeMatureWei -
            _stakingPoolStats[poolId].totalRewardRemovedWei;
    }

    /**
     * @dev Returns the amount of stake and reward revoked for the given stake identifier in Wei
     * @param stakekey The stake identifier
     * @return revokedStakeAmountWei The amount of stake revoked in Wei
     * @return revokedRewardAmountWei The amount of reward revoked in Wei
     */
    function _calculateRevokedAmountFor(bytes memory stakekey)
        internal
        view
        virtual
        returns (uint256 revokedStakeAmountWei, uint256 revokedRewardAmountWei)
    {
        /*
        console.log("_calculateRevokedAmountFor: _isUnstakeWithdrawnFor=%o, _isStakeUnstakedFor=%o", _isUnstakeWithdrawnFor(stakekey), _isStakeUnstakedFor(stakekey)); // solhint-disable-line no-console
        console.log("_calculateRevokedAmountFor: unstakeAmountWei=%o, stakeAmountWei=%o", _stakes[stakekey].unstakeAmountWei, _stakes[stakekey].stakeAmountWei); // solhint-disable-line no-console
        console.log("_calculateRevokedAmountFor: estimatedRewardAtMaturityWei=%o, rewardClaimedWei=%o", _stakes[stakekey].estimatedRewardAtMaturityWei, _stakes[stakekey].rewardClaimedWei); // solhint-disable-line no-console
        */

        revokedStakeAmountWei =
            _isUnstakeWithdrawnFor(stakekey)
                ? 0
                : (
                    _isStakeUnstakedFor(stakekey)
                        ? _stakes[stakekey].unstakeAmountWei
                        : _stakes[stakekey].stakeAmountWei
                );
        revokedRewardAmountWei = (_stakes[stakekey].rewardClaimedWei > 0)
            ? _stakes[stakekey].estimatedRewardAtMaturityWei - _stakes[stakekey].rewardClaimedWei
            : (
                (_stakes[stakekey].estimatedRewardAtUnstakeWei > 0)
                    ? _stakes[stakekey].estimatedRewardAtUnstakeWei
                    : _stakes[stakekey].estimatedRewardAtMaturityWei
            );
    }

    /**
     * @dev Returns the calculated timestamp when the stake matures given the stake duration and timestamp
     * @param stakeDurationDays The duration in days that user stakes will be locked in staking pool
     * @param stakeTimestamp The timestamp as seconds since unix epoch when the stake was placed
     * @return calculatedStakeMaturityTimestamp The timestamp as seconds since unix epoch when the stake matures
     */
    // slither-disable-next-line dead-code
    function _calculateStakeMaturityTimestamp(
        uint256 stakeDurationDays,
        uint256 stakeTimestamp
    ) internal pure virtual returns (uint256 calculatedStakeMaturityTimestamp) {
        calculatedStakeMaturityTimestamp =
            stakeTimestamp + stakeDurationDays * SECONDS_IN_DAY;
    }

    /**
     * @dev Returns the calculated timestamp when the unstake cooldown expires given the cooldown period and unstake timestamp
     * @param cooldownPeriodDays The duration in days that user has to wait before can withdraw stake
     * @param unstakeTimestamp The timestamp as seconds since unix epoch when the stake was unstaked
     * @return calculatedCooldownExpiryTimestamp The timestamp as seconds since unix epoch when the unstake cooldown expires
     */
    // slither-disable-next-line dead-code
    function _calculateUnstakeCooldownExpiryTimestamp(
        uint256 cooldownPeriodDays,
        uint256 unstakeTimestamp
    ) internal pure virtual returns (uint256 calculatedCooldownExpiryTimestamp) {
        calculatedCooldownExpiryTimestamp =
            unstakeTimestamp + cooldownPeriodDays * SECONDS_IN_DAY;
    }

    /**
     * @dev Returns the estimated reward in Wei at maturity for the given stake duration, pool APR and stake amount
     * @param stakeDurationDays The duration in days that user stakes will be locked in staking pool
     * @param poolAprWei The APR (Annual Percentage Rate) in Wei for staking pool
     * @param stakeAmountWei The amount of tokens staked in Wei
     * @return estimatedRewardAtMaturityWei The estimated reward in Wei at maturity
     */
    function _estimateRewardAtMaturityWei(
        uint256 stakeDurationDays,
        uint256 poolAprWei,
        uint256 stakeAmountWei
    ) internal pure virtual returns (uint256 estimatedRewardAtMaturityWei) {
        estimatedRewardAtMaturityWei = poolAprWei > 0
            ? (poolAprWei * stakeDurationDays * stakeAmountWei) / (DAYS_IN_YEAR * PERCENT_100_WEI)
            : 0;
    }

    /**
     * @dev Returns the claimable reward in Wei for the given stake key, returns zero if stake has been suspended
     * @param stakekey The stake key
     * @return claimableRewardWei The claimable reward in Wei
     */
    function _getClaimableRewardWeiFor(bytes memory stakekey)
        internal
        view
        virtual
        returns (uint256 claimableRewardWei)
    {
        if (_isStakeRevokedFor(stakekey)) {
            return 0;
        }

        bool isStakeUnstaked = _isStakeUnstakedFor(stakekey);
        bool isStakeMatured = _isStakeMaturedFor(stakekey);

        uint256 estimatedRewardWei = isStakeUnstaked
            ? _stakes[stakekey].estimatedRewardAtUnstakeWei
            : (isStakeMatured ? _stakes[stakekey].estimatedRewardAtMaturityWei : 0);

        claimableRewardWei = (estimatedRewardWei > _stakes[stakekey].rewardClaimedWei)
            ? (estimatedRewardWei - _stakes[stakekey].rewardClaimedWei)
            : 0;
    }

    /**
     * @dev Returns the estimated reward at unstake in Wei for the given stake key, returns zero if stake has been revoked
     * @dev Assumes initialized stake
     * @param stakekey The stake key
     * @param unstakingTimestamp The unstaking timestamp
     * @return estimatedRewardAtUnstakingWei The estimated reward at unstaking in Wei
     */
    function _getEstimatedRewardAtUnstakingWei(bytes memory stakekey, uint256 unstakingTimestamp)
        internal
        view
        virtual
        returns (uint256 estimatedRewardAtUnstakingWei)
    {
        require(unstakingTimestamp >= _stakes[stakekey].stakeTimestamp, "SSvcs2: unstake before stake");

        if (_isStakeRevokedFor(stakekey)) {
            return 0;
        }

        estimatedRewardAtUnstakingWei = (unstakingTimestamp >= _stakes[stakekey].stakeMaturityTimestamp)
            ? _stakes[stakekey].estimatedRewardAtMaturityWei
            : _stakes[stakekey].estimatedRewardAtMaturityWei
                * (unstakingTimestamp - _stakes[stakekey].stakeTimestamp)
                / (_stakes[stakekey].stakeMaturityTimestamp - _stakes[stakekey].stakeTimestamp);
    }

    /**
     * @dev Returns the unstake penalty percentage in wei for current block timestamp
     * @param stakeTimestamp The timestamp when stake
     * @param stakeMaturityTimestamp The timestamp when stake matures
     * @param unstakePenaltyMaxPercentWei The unstake max penalty percentage in wei
     * @param unstakePenaltyMinPercentWei The unstake min penalty percentage in wei
     * @param isStakeMature True if stake has matured
     * @return unstakePenaltyPercentWei The current unstake penalty percentage in Wei
     */
    function _getCurrentUnstakePenaltyPercentWei(
        uint256 stakeTimestamp,
        uint256 stakeMaturityTimestamp,
        uint256 unstakePenaltyMaxPercentWei,
        uint256 unstakePenaltyMinPercentWei,
        bool isStakeMature
    ) internal view virtual returns (uint256 unstakePenaltyPercentWei) {
        unstakePenaltyPercentWei = isStakeMature
            ? 0
            : (unstakePenaltyMaxPercentWei * (stakeMaturityTimestamp - stakeTimestamp)
                - (unstakePenaltyMaxPercentWei - unstakePenaltyMinPercentWei) * (block.timestamp - stakeTimestamp))
                / (stakeMaturityTimestamp - stakeTimestamp);
    }

    /**
     * @dev Returns the staking pool size in Wei for the given parameters
     * @param stakeDurationDays The duration in days that user stakes will be locked in staking pool
     * @param poolAprWei The APR (Annual Percentage Rate) in Wei for staking pool
     * @param poolRewardWei The amount of staking pool reward in Wei
     * @param stakeTokenDecimals The ERC20 stake token decimal places
     * @return poolSizeWei The staking pool size in Wei
     */
    function _getPoolSizeWei(
        uint256 stakeDurationDays,
        uint256 poolAprWei,
        uint256 poolRewardWei,
        uint256 stakeTokenDecimals
    ) internal pure virtual returns (uint256 poolSizeWei) {
        poolSizeWei = poolAprWei > 0
            ? ((DAYS_IN_YEAR * PERCENT_100_WEI * poolRewardWei) / (stakeDurationDays * poolAprWei))
                .truncateWeiToDecimals(stakeTokenDecimals)
            : type(uint256).max.truncateWeiToDecimals(stakeTokenDecimals);
    }

    /**
     * @dev Returns the staking pool info for the given staking pool
     * @param poolId The staking pool identifier
     * @return stakingPoolInfo The staking pool info
     */
    function _getStakingPoolInfo(bytes32 poolId)
        internal
        view
        virtual
        returns (IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo)
    {
        stakingPoolInfo = IStakingPoolV2(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakingPoolInfo.isInitialized, "SSvcs2: uninitialized pool");
        require(stakingPoolInfo.stakeDurationDays > 0, "SSvcs2: stake duration");
        require(stakingPoolInfo.stakeTokenAddress != address(0), "SSvcs2: stake token");
        require(
            stakingPoolInfo.stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs2: stake decimals"
        );
        require(stakingPoolInfo.rewardTokenAddress != address(0), "SSvcs2: reward token");
        require(
            stakingPoolInfo.rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs2: reward decimals"
        );
        require(stakingPoolInfo.earlyUnstakePenaltyMaxPercentWei <= PERCENT_100_WEI, "SSvcs2: max penalty");
        require(stakingPoolInfo.earlyUnstakePenaltyMinPercentWei <= PERCENT_100_WEI, "SSvcs2: min penalty");
        require(stakingPoolInfo.earlyUnstakePenaltyMinPercentWei <= stakingPoolInfo.earlyUnstakePenaltyMaxPercentWei, "SSvcs2: min > max penalty");
    }

    /**
     * @dev Returns the unstake amount, penalty, cooldown period and whether stake has matured for the given stake key
     * @dev assumes pool is not suspended, stake is not revoked and stake has not been unstaked
     * @param stakingPoolInfo The staking pool info
     * @param stakekey The stake identifier
     * @return unstakingInfo The unstaking info for given staking pool and account
     */
    function _getUnstakingInfoByStakekey(IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo, bytes memory stakekey)
        internal
        view
        virtual
        returns (UnstakingInfo memory unstakingInfo)
    {
        bool isStakeMature = _isStakeMaturedFor(stakekey);
        uint256 unstakePenaltyPercentWei = _getCurrentUnstakePenaltyPercentWei(
            _stakes[stakekey].stakeTimestamp,
            _stakes[stakekey].stakeMaturityTimestamp,
            stakingPoolInfo.earlyUnstakePenaltyMaxPercentWei,
            stakingPoolInfo.earlyUnstakePenaltyMinPercentWei,
            isStakeMature
        );
        uint256 unstakePenaltyAmountWei = isStakeMature
            ? 0
            : _stakes[stakekey].stakeAmountWei * unstakePenaltyPercentWei / PERCENT_100_WEI;
        uint256 unstakeAmountWei =  _stakes[stakekey].stakeAmountWei - unstakePenaltyAmountWei;
        uint256 unstakeCooldownPeriodDays = isStakeMature ? 0 : stakingPoolInfo.earlyUnstakeCooldownPeriodDays;
        uint256 estimatedRewardAtUnstakingWei = _getEstimatedRewardAtUnstakingWei(stakekey, block.timestamp);
        require(
            estimatedRewardAtUnstakingWei <= _stakes[stakekey].estimatedRewardAtMaturityWei,
            "SSvcs2: reward > maturity reward"
        );

        unstakingInfo = UnstakingInfo({
            estimatedRewardAtUnstakingWei: estimatedRewardAtUnstakingWei,
            unstakeAmountWei: unstakeAmountWei,
            unstakePenaltyAmountWei: unstakePenaltyAmountWei,
            unstakePenaltyPercentWei: unstakePenaltyPercentWei,
            unstakeCooldownPeriodDays: unstakeCooldownPeriodDays,
            isStakeMature: isStakeMature
        });
    }

    function _getUnstakedRewardBeforeMatureWei(uint256 estimatedRewardAtMaturityWei, uint256 estimatedRewardAtUnstakeWei)
        internal
        pure
        virtual
        returns (uint256 unstakedRewardBeforeMatureWei)
    {
        require(estimatedRewardAtUnstakeWei <= estimatedRewardAtMaturityWei, "SSvcs2: claimable > mature");

        unstakedRewardBeforeMatureWei = estimatedRewardAtMaturityWei - estimatedRewardAtUnstakeWei;
    }

    /**
     * @dev Returns whether stake has matured for given stake key
     * @param stakekey The stake identifier
     * @return True if stake has matured
     */
    function _isStakeMaturedFor(bytes memory stakekey)
        internal
        view
        virtual
        returns (bool)
    {
        uint256 timestamp = _stakes[stakekey].unstakeTimestamp > 0 ? _stakes[stakekey].unstakeTimestamp : block.timestamp;

        return
            _stakes[stakekey].stakeMaturityTimestamp > 0 && timestamp >= _stakes[stakekey].stakeMaturityTimestamp;
    }

    /**
     * @dev Returns whether stake has been revoked for given stake key
     * @param stakekey The stake identifier
     * @return True if stake has been revoked
     */
    function _isStakeRevokedFor(bytes memory stakekey)
        internal
        view
        virtual
        returns (bool)
    {
        return _stakes[stakekey].revokeTimestamp > 0;
    }

    /**
     * @dev Returns whether stake has been unstaked for given stake key
     * @param stakekey The stake identifier
     * @return True if stake has been unstaked
     */
    function _isStakeUnstakedFor(bytes memory stakekey)
        internal
        view
        virtual
        returns (bool)
    {
        return _stakes[stakekey].unstakeTimestamp > 0;
    }

    /**
     * @dev Returns whether unstake has been withdrawn for given stake key
     * @param stakekey The stake identifier
     * @return True if unstake has been withdrawn
     */
    function _isUnstakeWithdrawnFor(bytes memory stakekey)
        internal
        view
        virtual
        returns (bool)
    {
        return _stakes[stakekey].withdrawUnstakeTimestamp > 0;
    }

    /**
     * @dev Returns the stake identifier for the given staking pool identifier and account
     * @param poolId The staking pool identifier
     * @param account The address of the user wallet that placed the stake
     * @return stakekey The stake identifier which is the ABI-encoded value of account and poolId
     */
    function _getStakeKey(bytes32 poolId, address account, bytes32 stakeId)
        internal
        pure
        virtual
        returns (bytes memory stakekey)
    {
        require(account != address(0), "SSvcs2: account");

        stakekey = abi.encode(account, poolId, stakeId);
    }
}
