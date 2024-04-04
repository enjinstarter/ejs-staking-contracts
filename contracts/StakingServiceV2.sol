// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Enjinstarter
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

    bytes32 public constant CONTRACT_USAGE_ROLE = keccak256("CONTRACT_USAGE_ROLE");

    uint256 public constant DAYS_IN_YEAR = 365;
    uint256 public constant PERCENT_100_WEI = 100 ether;
    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant TOKEN_MAX_DECIMALS = 18;

    address public stakingPoolContract;

    mapping(bytes => StakeInfo) private _stakes;
    mapping(bytes32 => StakingPoolStats) private _stakingPoolStats;
    mapping(address => StakingUserStats) private _stakingUserStats;

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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");
        require(_stakes[stakekey].revokeTimestamp == 0, "SSvcs2: revoked");
        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");
        require(_isStakeMaturedByStakekey(stakekey), "SSvcs2: not mature");

        uint256 rewardAmountWei = _getClaimableRewardWeiByStakekey(stakekey);
        require(rewardAmountWei > 0, "SSvcs2: zero reward");

        _stakes[stakekey].rewardClaimedWei += rewardAmountWei;
        _stakingUserStats[msg.sender].totalRewardClaimedWei += rewardAmountWei;
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

        uint256 estimatedRewardAtMaturityWei = _estimateRewardAtMaturityWei(
            stakingPoolInfo.stakeDurationDays,
            stakingPoolInfo.poolAprWei,
            truncatedStakeAmountWei
        ).truncateWeiToDecimals(stakingPoolInfo.rewardTokenDecimals);
        require(estimatedRewardAtMaturityWei > 0, "SSvcs2: zero reward");
        require(
            estimatedRewardAtMaturityWei <=
                _calculatePoolRemainingRewardWei(poolId),
            "SSvcs2: insufficient"
        );

        bytes memory stakekey = _getStakeKey(poolId, msg.sender, stakeId);
        require(!_stakes[stakekey].isInitialized, "SSvcs2: exists");

        _stakes[stakekey] = StakeInfo({
            estimatedRewardAtMaturityWei: estimatedRewardAtMaturityWei,
            revokeTimestamp: 0,
            rewardClaimedWei: 0,
            stakeAmountWei: truncatedStakeAmountWei,
            stakeMaturityTimestamp: stakeMaturityTimestamp,
            stakeTimestamp: block.timestamp,
            unstakeAmountWei: 0,
            unstakeCooldownExpiryTimestamp: 0,
            unstakePenaltyAmountWei: 0,
            unstakeTimestamp: 0,
            withdrawUnstakeTimestamp: 0,
            isActive: true,
            isInitialized: true
        });

        _stakingUserStats[msg.sender].totalStakedWei += truncatedStakeAmountWei;

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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");
        require(_stakes[stakekey].revokeTimestamp == 0, "SSvcs2: revoked");
        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");
        require(_stakes[stakekey].unstakeTimestamp == 0, "SSvcs2: unstaked");

        uint256 stakeAmountWei = _stakes[stakekey].stakeAmountWei;
        require(stakeAmountWei > 0, "SSvcs2: zero stake");

        (
            uint256 unstakeAmountWei,
            uint256 unstakePenaltyAmountWei,
            uint256 unstakeCooldownPeriodDays,
            bool isStakeMature
        ) = _getUnstakeAmountWeiByStakekey(stakingPoolInfo, stakekey);
        require(unstakeAmountWei > 0 || unstakePenaltyAmountWei > 0, "SSvcs2: zero unstake");

        uint256 unstakeCooldownExpiryTimestamp = _calculateUnstakeCooldownExpiryTimestamp(
            unstakeCooldownPeriodDays,
            block.timestamp
        );

        // console.log("unstakeCooldownExpiryTimestamp=%o, blockTimestamp=%o", unstakeCooldownExpiryTimestamp, block.timestamp);  // solhint-disable-line no-console

        require(
            unstakeCooldownExpiryTimestamp >= block.timestamp,
            "SSvcs2: cooldown timestamp"
        );

        _stakes[stakekey].unstakeAmountWei = unstakeAmountWei;
        _stakes[stakekey].unstakeCooldownExpiryTimestamp = unstakeCooldownExpiryTimestamp;
        _stakes[stakekey].unstakePenaltyAmountWei = unstakePenaltyAmountWei;
        _stakes[stakekey].unstakeTimestamp = block.timestamp;

        if (isStakeMature) {
            _stakingUserStats[msg.sender].totalUnstakedAfterMatureWei += unstakeAmountWei;

            _stakingPoolStats[poolId].totalUnstakedAfterMatureWei += unstakeAmountWei;
        } else {
            _stakingUserStats[msg.sender].totalUnstakedBeforeMatureWei += unstakeAmountWei;
            _stakingUserStats[msg.sender].totalUnstakePenaltyAmountWei += unstakePenaltyAmountWei;

            _stakingPoolStats[poolId].totalUnstakedBeforeMatureWei += unstakeAmountWei;
            _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei += unstakePenaltyAmountWei;
        }

        emit Unstaked(
            poolId,
            msg.sender,
            stakeId,
            stakingPoolInfo.stakeTokenAddress,
            stakeAmountWei,
            unstakeAmountWei,
            unstakePenaltyAmountWei,
            unstakeCooldownPeriodDays,
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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");
        require(_stakes[stakekey].revokeTimestamp == 0, "SSvcs2: revoked");
        require(_stakes[stakekey].isActive, "SSvcs2: stake suspended");
        require(_stakes[stakekey].unstakeTimestamp > 0, "SSvcs2: not unstake");
        require(_stakes[stakekey].withdrawUnstakeTimestamp == 0, "SSvcs2: withdrawn");
        require(_stakes[stakekey].unstakeAmountWei > 0, "SSvcs2: nothing");
        require(_stakes[stakekey].unstakeCooldownExpiryTimestamp == 0
            || block.timestamp >= _stakes[stakekey].unstakeCooldownExpiryTimestamp, "SSvcs2: cooldown");

        _stakes[stakekey].withdrawUnstakeTimestamp = block.timestamp;
        _stakingUserStats[msg.sender].totalWithdrawnUnstakeWei += _stakes[stakekey].unstakeAmountWei;
        _stakingPoolStats[poolId].totalWithdrawnUnstakeWei += _stakes[stakekey].unstakeAmountWei;

        IERC20(stakingPoolInfo.stakeTokenAddress).transferTokensFromContractToAccount(
            stakingPoolInfo.stakeTokenDecimals,
            _stakes[stakekey].unstakeAmountWei,
            msg.sender
        );
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function revshareExtendStakeDuration(
        bytes32 poolId,
        address account,
        bytes32 stakeId
    ) external virtual override onlyRole(CONTRACT_USAGE_ROLE) returns (bool isExtended) {
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");
        require(_stakes[stakekey].revokeTimestamp == 0, "SSvcs2: revoked");
        require(_stakes[stakekey].unstakeTimestamp == 0, "SSvcs2: unstaked");

        _stakes[stakekey].stakeMaturityTimestamp +=
            stakingPoolInfo.revshareStakeDurationExtensionDays * SECONDS_IN_DAY;
        isExtended = true;
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
        require(
            _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei == _stakingPoolStats[poolId].totalUnstakePenaltyRemovedWei,
            "SSvcs2: unequal"
        );

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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");

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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");
        require(_stakes[stakekey].revokeTimestamp == 0, "Ssvcs2: revoked");

        uint256 withdrawnAmountWei = _stakes[stakekey].withdrawUnstakeTimestamp > 0 ? _stakes[stakekey].unstakeAmountWei : 0;
        uint256 revokedStakeAmountWei = _stakes[stakekey].stakeAmountWei - withdrawnAmountWei;
        uint256 revokedRewardAmountWei = _stakes[stakekey]
            .estimatedRewardAtMaturityWei - _stakes[stakekey].rewardClaimedWei;

        _stakes[stakekey].revokeTimestamp = block.timestamp;

        _stakingUserStats[account].totalRevokedStakeWei += revokedStakeAmountWei;
        _stakingUserStats[account].totalRevokedRewardWei += revokedRewardAmountWei;

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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");

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
        IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo = _getStakingPoolInfo(poolId);

        bytes memory stakekey = _getStakeKey(poolId, account, stakeId);
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");

        if (!stakingPoolInfo.isActive) {
            return 0;
        }

        return _getClaimableRewardWeiByStakekey(stakekey);
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
        require(_stakes[stakekey].isInitialized, "SSvcs2: uninitialized");

        stakeInfo = StakeInfo({
            estimatedRewardAtMaturityWei: _stakes[stakekey].estimatedRewardAtMaturityWei,
            revokeTimestamp: _stakes[stakekey].revokeTimestamp,
            rewardClaimedWei:  _stakes[stakekey].rewardClaimedWei,
            stakeAmountWei: _stakes[stakekey].stakeAmountWei,
            stakeMaturityTimestamp: _stakes[stakekey].stakeMaturityTimestamp,
            stakeTimestamp: _stakes[stakekey].stakeTimestamp,
            unstakeAmountWei: _stakes[stakekey].unstakeAmountWei,
            unstakeCooldownExpiryTimestamp: _stakes[stakekey].unstakeCooldownExpiryTimestamp,
            unstakePenaltyAmountWei: _stakes[stakekey].unstakePenaltyAmountWei,
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
            totalUnstakePenaltyAmountWei: _stakingPoolStats[poolId].totalUnstakePenaltyAmountWei,
            totalUnstakePenaltyRemovedWei: _stakingPoolStats[poolId].totalUnstakePenaltyRemovedWei,
            totalWithdrawnUnstakeWei: _stakingPoolStats[poolId].totalWithdrawnUnstakeWei
        });
    }

    /**
     * @inheritdoc IStakingServiceV2
     */
    function getStakingUserStats(address account)
        external
        view
        virtual
        override
        returns (StakingUserStats memory stakingUserStats)
    {
        require(account != address(0), "SSvcs2: account");

        stakingUserStats = _stakingUserStats[account];
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
            _stakingPoolStats[poolId].totalRevokedRewardWei -
            _stakingPoolStats[poolId].totalRewardRemovedWei;
    }

    /**
     * @dev Returns the calculated timestamp when the stake matures given the stake duration and timestamp
     * @param stakeDurationDays The duration in days that user stakes will be locked in staking pool
     * @param stakeTimestamp The timestamp as seconds since unix epoch when the stake was placed
     * @return calculatedStakeMaturityTimestamp The timestamp as seconds since unix epoch when the stake matures
     */
    function _calculateStakeMaturityTimestamp(
        uint256 stakeDurationDays,
        uint256 stakeTimestamp
    ) internal view virtual returns (uint256 calculatedStakeMaturityTimestamp) {
        calculatedStakeMaturityTimestamp =
            stakeTimestamp + stakeDurationDays * SECONDS_IN_DAY;
    }

    /**
     * @dev Returns the calculated timestamp when the unstake cooldown expires given the cooldown period and unstake timestamp
     * @param cooldownPeriodDays The duration in days that user has to wait before can withdraw stake
     * @param unstakeTimestamp The timestamp as seconds since unix epoch when the stake was unstaked
     * @return calculatedCooldownExpiryTimestamp The timestamp as seconds since unix epoch when the unstake cooldown expires
     */
    function _calculateUnstakeCooldownExpiryTimestamp(
        uint256 cooldownPeriodDays,
        uint256 unstakeTimestamp
    ) internal view virtual returns (uint256 calculatedCooldownExpiryTimestamp) {
        calculatedCooldownExpiryTimestamp =
            unstakeTimestamp +
            (cooldownPeriodDays > 0 ? cooldownPeriodDays * SECONDS_IN_DAY : 0);
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
    ) internal view virtual returns (uint256 estimatedRewardAtMaturityWei) {
        estimatedRewardAtMaturityWei = poolAprWei > 0
            ? (poolAprWei * stakeDurationDays * stakeAmountWei) / (DAYS_IN_YEAR * PERCENT_100_WEI)
            : 0;
    }

    /**
     * @dev Returns the claimable reward in Wei for the given stake key, returns zero if stake has been suspended
     * @param stakekey The stake identifier
     * @return claimableRewardWei The claimable reward in Wei
     */
    function _getClaimableRewardWeiByStakekey(bytes memory stakekey)
        internal
        view
        virtual
        returns (uint256 claimableRewardWei)
    {
        if (_stakes[stakekey].revokeTimestamp > 0) {
            return 0;
        }

        if (!_stakes[stakekey].isActive) {
            return 0;
        }

        if (!_isStakeMaturedByStakekey(stakekey)) {
            return 0;
        }

        claimableRewardWei =
            _stakes[stakekey].estimatedRewardAtMaturityWei -
            _stakes[stakekey].rewardClaimedWei;
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
    ) internal view virtual returns (uint256 poolSizeWei) {
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
        require(stakingPoolInfo.isInitialized, "SSvcs2: uninitialized");
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
        require(stakingPoolInfo.earlyUnstakePenaltyPercentWei <= PERCENT_100_WEI, "SSvcs2: penalty");
    }

    /**
     * @dev Returns the unstake amount, penalty, cooldown period and whether stake has matured for the given stake key
     * @dev assumes pool is not suspended, stake is not revoked, stake is not suspended and stake has not been unstaked
     * @param stakingPoolInfo The staking pool info
     * @param stakekey The stake identifier
     * @return unstakeAmountWei The unstake amount in Wei
     * @return unstakePenaltyAmountWei The unstake penalty amount in Wei
     * @return unstakeCooldownPeriodDays The unstake cooldown period in days
     */
    function _getUnstakeAmountWeiByStakekey(IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo, bytes memory stakekey)
        internal
        view
        virtual
        returns (uint256 unstakeAmountWei, uint256 unstakePenaltyAmountWei, uint256 unstakeCooldownPeriodDays, bool isStakeMature)
    {
        isStakeMature = _isStakeMaturedByStakekey(stakekey);
        unstakePenaltyAmountWei = isStakeMature
            ? 0
            : (stakingPoolInfo.earlyUnstakePenaltyPercentWei > 0
                ? _stakes[stakekey].stakeAmountWei * stakingPoolInfo.earlyUnstakePenaltyPercentWei / PERCENT_100_WEI
                : 0);
        unstakeAmountWei =  _stakes[stakekey].stakeAmountWei - unstakePenaltyAmountWei;
        unstakeCooldownPeriodDays = stakingPoolInfo.earlyUnstakeCooldownPeriodDays;
    }

    /**
     * @dev Returns whether stake has matured for given stake key
     * @param stakekey The stake identifier
     * @return True if stake has matured
     */
    function _isStakeMaturedByStakekey(bytes memory stakekey)
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