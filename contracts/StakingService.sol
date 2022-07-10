// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/UnitConverter.sol";
import "./AdminPrivileges.sol";
import "./AdminWallet.sol";
import "./interfaces/IStakingPool.sol";
import "./interfaces/IStakingService.sol";

/**
 * @title StakingService
 * @author Tim Loh
 */
contract StakingService is
    Pausable,
    AdminPrivileges,
    AdminWallet,
    IStakingService
{
    using SafeERC20 for IERC20;
    using UnitConverter for uint256;

    struct StakeInfo {
        uint256 stakeAmountWei;
        uint256 lastStakeAmountWei;
        uint256 stakeTimestamp;
        uint256 stakeMaturityTimestamp; // timestamp when stake matures
        uint256 estimatedRewardAtMaturityWei; // estimated reward at maturity in wei
        uint256 rewardClaimedWei; // reward claimed in wei
        bool isActive; // true if allow claim rewards and unstake
        bool isInitialized; // true if stake info has been initialized
    }

    struct StakingPoolStats {
        uint256 totalRewardWei; // total pool reward in wei
        uint256 totalStakedWei; // total staked inside pool in wei
        uint256 rewardToBeDistributedWei; // allocated pool reward to be distributed in wei
        uint256 totalRevokedStakeWei; // total revoked stake in wei
    }

    uint256 public constant DAYS_IN_YEAR = 365;
    uint256 public constant PERCENT_100_WEI = 100 ether;
    uint256 public constant SECONDS_IN_DAY = 86400;
    uint256 public constant TOKEN_MAX_DECIMALS = 18;

    address public stakingPoolContract;

    mapping(bytes => StakeInfo) private _stakes;
    mapping(bytes32 => StakingPoolStats) private _stakingPoolStats;

    constructor(address stakingPoolContract_) {
        require(stakingPoolContract_ != address(0), "SSvcs: staking pool");

        stakingPoolContract = stakingPoolContract_;
    }

    /**
     * @dev See {IStakingService-getClaimableRewardWei}.
     */
    function getClaimableRewardWei(bytes32 poolId, address account)
        external
        view
        virtual
        override
        returns (uint256)
    {
        bytes memory stakekey = _getStakeKey(poolId, account);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");

        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,
            bool isPoolActive
        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");

        if (!isPoolActive) {
            return 0;
        }

        return _getClaimableRewardWeiByStakekey(stakekey);
    }

    /**
     * @dev See {IStakingService-getStakeInfo}.
     */
    function getStakeInfo(bytes32 poolId, address account)
        external
        view
        virtual
        override
        returns (
            uint256 stakeAmountWei,
            uint256 stakeTimestamp,
            uint256 stakeMaturityTimestamp,
            uint256 estimatedRewardAtMaturityWei,
            uint256 rewardClaimedWei,
            bool isActive
        )
    {
        bytes memory stakekey = _getStakeKey(poolId, account);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");

        stakeAmountWei = _stakes[stakekey].stakeAmountWei;
        stakeTimestamp = _stakes[stakekey].stakeTimestamp;
        stakeMaturityTimestamp = _stakes[stakekey].stakeMaturityTimestamp;
        estimatedRewardAtMaturityWei = _stakes[stakekey]
            .estimatedRewardAtMaturityWei;
        rewardClaimedWei = _stakes[stakekey].rewardClaimedWei;
        isActive = _stakes[stakekey].isActive;
    }

    /**
     * @dev See {IStakingService-getStakingPoolStats}.
     */
    function getStakingPoolStats(bytes32 poolId)
        external
        view
        virtual
        override
        returns (
            uint256 totalRewardWei,
            uint256 totalStakedWei,
            uint256 rewardToBeDistributedWei,
            uint256 totalRevokedStakeWei,
            uint256 poolSizeWei,
            bool isOpen,
            bool isActive
        )
    {
        uint256 stakeDurationDays;
        uint256 stakeTokenDecimals;
        uint256 poolAprWei;

        (
            stakeDurationDays,
            ,
            stakeTokenDecimals,
            ,
            ,
            poolAprWei,
            isOpen,
            isActive
        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");

        poolSizeWei = _getPoolSizeWei(
            stakeDurationDays,
            poolAprWei,
            _stakingPoolStats[poolId].totalRewardWei,
            stakeTokenDecimals
        );

        totalRewardWei = _stakingPoolStats[poolId].totalRewardWei;
        totalStakedWei = _stakingPoolStats[poolId].totalStakedWei;
        rewardToBeDistributedWei = _stakingPoolStats[poolId]
            .rewardToBeDistributedWei;
        totalRevokedStakeWei = _stakingPoolStats[poolId].totalRevokedStakeWei;
    }

    /**
     * @dev See {IStakingService-claimReward}.
     */
    function claimReward(bytes32 poolId)
        external
        virtual
        override
        whenNotPaused
    {
        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,
            bool isPoolActive
        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");
        require(isPoolActive, "SSvcs: pool suspended");

        bytes memory stakekey = _getStakeKey(poolId, msg.sender);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");
        require(_stakes[stakekey].isActive, "SSvcs: stake suspended");
        require(_isStakeMaturedByStakekey(stakekey), "SSvcs: not mature");

        uint256 rewardAmountWei = _getClaimableRewardWeiByStakekey(stakekey);
        require(rewardAmountWei > 0, "SSvcs: zero reward");

        _stakingPoolStats[poolId].totalRewardWei -= rewardAmountWei;
        _stakingPoolStats[poolId].rewardToBeDistributedWei -= rewardAmountWei;
        _stakes[stakekey].rewardClaimedWei += rewardAmountWei;

        emit RewardClaimed(
            poolId,
            msg.sender,
            rewardTokenAddress,
            rewardAmountWei
        );

        _transferTokensToAccount(
            rewardTokenAddress,
            rewardTokenDecimals,
            rewardAmountWei,
            msg.sender
        );
    }

    /**
     * @dev See {IStakingService-stake}.
     */
    function stake(bytes32 poolId, uint256 stakeAmountWei)
        external
        virtual
        override
        whenNotPaused
    {
        require(stakeAmountWei > 0, "SSvcs: stake amount");

        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            bool isPoolOpen,

        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");
        require(isPoolOpen, "SSvcs: closed");

        uint256 stakeMaturityTimestamp = _calculateStakeMaturityTimestamp(
            stakeDurationDays,
            block.timestamp
        );
        require(
            stakeMaturityTimestamp > block.timestamp,
            "SSvcs: maturity timestamp"
        );

        uint256 truncatedStakeAmountWei = _truncatedAmountWei(
            stakeAmountWei,
            stakeTokenDecimals
        );

        uint256 estimatedRewardAtMaturityWei = _truncatedAmountWei(
            _estimateRewardAtMaturityWei(
                stakeDurationDays,
                poolAprWei,
                truncatedStakeAmountWei
            ),
            rewardTokenDecimals
        );
        require(
            estimatedRewardAtMaturityWei <=
                _calculatePoolRemainingRewardWei(poolId),
            "SSvcs: insufficient"
        );

        bytes memory stakekey = _getStakeKey(poolId, msg.sender);
        if (_stakes[stakekey].isInitialized) {
            uint256 stakeDurationAtAddStakeDays = (block.timestamp -
                _stakes[stakekey].stakeTimestamp) / SECONDS_IN_DAY;
            uint256 earnedRewardAtAddStakeWei = _truncatedAmountWei(
                _estimateRewardAtMaturityWei(
                    stakeDurationAtAddStakeDays,
                    poolAprWei,
                    _stakes[stakekey].lastStakeAmountWei
                ),
                rewardTokenDecimals
            );
            estimatedRewardAtMaturityWei += earnedRewardAtAddStakeWei;
            require(
                estimatedRewardAtMaturityWei <=
                    _calculatePoolRemainingRewardWei(poolId),
                "SSvcs: insufficient"
            );

            _stakes[stakekey].stakeAmountWei += truncatedStakeAmountWei;
            _stakes[stakekey].lastStakeAmountWei = truncatedStakeAmountWei;
            _stakes[stakekey].stakeTimestamp = block.timestamp;
            _stakes[stakekey].stakeMaturityTimestamp = stakeMaturityTimestamp;
            _stakes[stakekey]
                .estimatedRewardAtMaturityWei += estimatedRewardAtMaturityWei;
        } else {
            _stakes[stakekey] = StakeInfo({
                stakeAmountWei: truncatedStakeAmountWei,
                lastStakeAmountWei: truncatedStakeAmountWei,
                stakeTimestamp: block.timestamp,
                stakeMaturityTimestamp: stakeMaturityTimestamp,
                estimatedRewardAtMaturityWei: estimatedRewardAtMaturityWei,
                rewardClaimedWei: 0,
                isActive: true,
                isInitialized: true
            });
        }

        _stakingPoolStats[poolId].totalStakedWei += truncatedStakeAmountWei;
        _stakingPoolStats[poolId]
            .rewardToBeDistributedWei += estimatedRewardAtMaturityWei;

        emit Staked(
            poolId,
            msg.sender,
            stakeTokenAddress,
            truncatedStakeAmountWei,
            block.timestamp,
            stakeMaturityTimestamp,
            _stakes[stakekey].estimatedRewardAtMaturityWei
        );

        _transferTokensToContract(
            stakeTokenAddress,
            stakeTokenDecimals,
            truncatedStakeAmountWei,
            msg.sender
        );
    }

    /**
     * @dev See {IStakingService-unstake}.
     */
    function unstake(bytes32 poolId) external virtual override whenNotPaused {
        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,
            bool isPoolActive
        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");
        require(isPoolActive, "SSvcs: pool suspended");

        bytes memory stakekey = _getStakeKey(poolId, msg.sender);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");
        require(_stakes[stakekey].isActive, "SSvcs: stake suspended");
        require(_isStakeMaturedByStakekey(stakekey), "SSvcs: not mature");

        uint256 stakeAmountWei = _stakes[stakekey].stakeAmountWei;
        require(stakeAmountWei > 0, "SSvcs: zero stake");

        uint256 rewardAmountWei = _getClaimableRewardWeiByStakekey(stakekey);

        _stakingPoolStats[poolId].totalStakedWei -= stakeAmountWei;
        _stakingPoolStats[poolId].totalRewardWei -= rewardAmountWei;
        _stakingPoolStats[poolId].rewardToBeDistributedWei -= rewardAmountWei;

        _stakes[stakekey] = StakeInfo({
            stakeAmountWei: 0,
            lastStakeAmountWei: 0,
            stakeTimestamp: 0,
            stakeMaturityTimestamp: 0,
            estimatedRewardAtMaturityWei: 0,
            rewardClaimedWei: 0,
            isActive: false,
            isInitialized: false
        });

        emit Unstaked(
            poolId,
            msg.sender,
            stakeTokenAddress,
            stakeAmountWei,
            rewardTokenAddress,
            rewardAmountWei
        );

        if (
            stakeTokenAddress == rewardTokenAddress &&
            stakeTokenDecimals == rewardTokenDecimals
        ) {
            _transferTokensToAccount(
                stakeTokenAddress,
                stakeTokenDecimals,
                stakeAmountWei + rewardAmountWei,
                msg.sender
            );
        } else {
            _transferTokensToAccount(
                stakeTokenAddress,
                stakeTokenDecimals,
                stakeAmountWei,
                msg.sender
            );

            if (rewardAmountWei > 0) {
                _transferTokensToAccount(
                    rewardTokenAddress,
                    rewardTokenDecimals,
                    rewardAmountWei,
                    msg.sender
                );
            }
        }
    }

    /**
     * @dev See {IStakingService-addStakingPoolReward}.
     */
    function addStakingPoolReward(bytes32 poolId, uint256 rewardAmountWei)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(rewardAmountWei > 0, "SSvcs: reward amount");

        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,

        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");

        uint256 truncatedRewardAmountWei = rewardTokenDecimals <
            TOKEN_MAX_DECIMALS
            ? rewardAmountWei
                .scaleWeiToDecimals(rewardTokenDecimals)
                .scaleDecimalsToWei(rewardTokenDecimals)
            : rewardAmountWei;

        _stakingPoolStats[poolId].totalRewardWei += truncatedRewardAmountWei;

        emit StakingPoolRewardAdded(
            poolId,
            msg.sender,
            rewardTokenAddress,
            truncatedRewardAmountWei
        );

        _transferTokensToContract(
            rewardTokenAddress,
            rewardTokenDecimals,
            truncatedRewardAmountWei,
            msg.sender
        );
    }

    /**
     * @dev See {IStakingService-removeRevokedStakes}.
     */
    function removeRevokedStakes(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,

        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");

        require(
            _stakingPoolStats[poolId].totalRevokedStakeWei > 0,
            "SSvcs: no revoked"
        );

        uint256 totalRevokedStakeWei = _stakingPoolStats[poolId]
            .totalRevokedStakeWei;
        _stakingPoolStats[poolId].totalRevokedStakeWei = 0;

        emit RevokedStakesRemoved(
            poolId,
            msg.sender,
            adminWallet(),
            stakeTokenAddress,
            totalRevokedStakeWei
        );

        _transferTokensToAccount(
            stakeTokenAddress,
            stakeTokenDecimals,
            totalRevokedStakeWei,
            adminWallet()
        );
    }

    /**
     * @dev See {IStakingService-removeUnallocatedStakingPoolReward}.
     */
    function removeUnallocatedStakingPoolReward(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,

        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");

        uint256 unallocatedRewardWei = _calculatePoolRemainingRewardWei(poolId);
        require(unallocatedRewardWei > 0, "SSvcs: no unallocated");

        _stakingPoolStats[poolId].totalRewardWei -= unallocatedRewardWei;

        emit StakingPoolRewardRemoved(
            poolId,
            msg.sender,
            adminWallet(),
            rewardTokenAddress,
            unallocatedRewardWei
        );

        _transferTokensToAccount(
            rewardTokenAddress,
            rewardTokenDecimals,
            unallocatedRewardWei,
            adminWallet()
        );
    }

    /**
     * @dev See {IStakingService-resumeStake}.
     */
    function resumeStake(bytes32 poolId, address account)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        bytes memory stakekey = _getStakeKey(poolId, account);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");

        require(!_stakes[stakekey].isActive, "SSvcs: stake active");

        _stakes[stakekey].isActive = true;

        emit StakeResumed(poolId, msg.sender, account);
    }

    /**
     * @dev See {IStakingService-revokeStake}.
     */
    function revokeStake(bytes32 poolId, address account)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        bytes memory stakekey = _getStakeKey(poolId, account);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");

        uint256 stakeAmountWei = _stakes[stakekey].stakeAmountWei;
        uint256 rewardAmountWei = _stakes[stakekey]
            .estimatedRewardAtMaturityWei - _stakes[stakekey].rewardClaimedWei;

        _stakingPoolStats[poolId].totalStakedWei -= stakeAmountWei;
        _stakingPoolStats[poolId].totalRevokedStakeWei += stakeAmountWei;
        _stakingPoolStats[poolId].rewardToBeDistributedWei -= rewardAmountWei;

        _stakes[stakekey] = StakeInfo({
            stakeAmountWei: 0,
            lastStakeAmountWei: 0,
            stakeTimestamp: 0,
            stakeMaturityTimestamp: 0,
            estimatedRewardAtMaturityWei: 0,
            rewardClaimedWei: 0,
            isActive: false,
            isInitialized: false
        });

        (
            uint256 stakeDurationDays,
            address stakeTokenAddress,
            uint256 stakeTokenDecimals,
            address rewardTokenAddress,
            uint256 rewardTokenDecimals,
            uint256 poolAprWei,
            ,

        ) = IStakingPool(stakingPoolContract).getStakingPoolInfo(poolId);
        require(stakeDurationDays > 0, "SSvcs: stake duration");
        require(stakeTokenAddress != address(0), "SSvcs: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SSvcs: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SSvcs: reward decimals"
        );
        require(poolAprWei > 0, "SSvcs: pool APR");

        emit StakeRevoked(
            poolId,
            msg.sender,
            account,
            stakeTokenAddress,
            stakeAmountWei,
            rewardTokenAddress,
            rewardAmountWei
        );
    }

    /**
     * @dev See {IStakingService-suspendStake}.
     */
    function suspendStake(bytes32 poolId, address account)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        bytes memory stakekey = _getStakeKey(poolId, account);
        require(_stakes[stakekey].isInitialized, "SSvcs: uninitialized");

        require(_stakes[stakekey].isActive, "SSvcs: stake suspended");

        _stakes[stakekey].isActive = false;

        emit StakeSuspended(poolId, msg.sender, account);
    }

    /**
     * @dev See {IStakingService-pauseContract}.
     */
    function pauseContract()
        external
        virtual
        override
        onlyRole(GOVERNANCE_ROLE)
    {
        _pause();
    }

    /**
     * @dev See {IStakingService-setAdminWallet}.
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
     * @dev See {IStakingService-setStakingPoolContract}.
     */
    function setStakingPoolContract(address newStakingPool)
        external
        virtual
        override
        onlyRole(GOVERNANCE_ROLE)
    {
        require(newStakingPool != address(0), "SSvcs: new staking pool");

        address oldStakingPool = stakingPoolContract;
        stakingPoolContract = newStakingPool;

        emit StakingPoolContractChanged(
            oldStakingPool,
            newStakingPool,
            msg.sender
        );
    }

    /**
     * @dev See {IStakingService-unpauseContract}.
     */
    function unpauseContract()
        external
        virtual
        override
        onlyRole(GOVERNANCE_ROLE)
    {
        _unpause();
    }

    function _getStakeKey(bytes32 poolId, address account)
        internal
        pure
        virtual
        returns (bytes memory stakekey)
    {
        require(account != address(0), "SSvcs: account");

        stakekey = abi.encode(account, poolId);
    }

    function _truncatedAmountWei(uint256 amountWei, uint256 tokenDecimals)
        internal
        pure
        virtual
        returns (uint256 truncatedAmountWei)
    {
        truncatedAmountWei = tokenDecimals < TOKEN_MAX_DECIMALS
            ? amountWei.scaleWeiToDecimals(tokenDecimals).scaleDecimalsToWei(
                tokenDecimals
            )
            : amountWei;
    }

    /**
     * @dev calculate remaining reward for pool in wei.
     */
    function _calculatePoolRemainingRewardWei(bytes32 poolId)
        internal
        view
        virtual
        returns (uint256 calculatedRemainingRewardWei)
    {
        calculatedRemainingRewardWei =
            _stakingPoolStats[poolId].totalRewardWei -
            _stakingPoolStats[poolId].rewardToBeDistributedWei;
    }

    function _calculateStakeMaturityTimestamp(
        uint256 stakeDurationDays,
        uint256 stakeTimestamp
    ) internal view virtual returns (uint256 calculatedStakeMaturityTimestamp) {
        calculatedStakeMaturityTimestamp =
            stakeTimestamp +
            stakeDurationDays *
            SECONDS_IN_DAY;
    }

    /**
     * @dev estimate reward at maturity in wei.
     */
    function _estimateRewardAtMaturityWei(
        uint256 stakeDurationDays,
        uint256 poolAprWei,
        uint256 stakeAmountWei
    ) internal view virtual returns (uint256 estimatedRewardAtMaturityWei) {
        estimatedRewardAtMaturityWei =
            (poolAprWei * stakeDurationDays * stakeAmountWei) /
            (DAYS_IN_YEAR * PERCENT_100_WEI);
    }

    /**
     * @dev get claimable reward in wei by stake key.
     */
    function _getClaimableRewardWeiByStakekey(bytes memory stakekey)
        internal
        view
        virtual
        returns (uint256 claimableRewardWei)
    {
        if (!_stakes[stakekey].isActive) {
            return 0;
        }

        if (_isStakeMaturedByStakekey(stakekey)) {
            claimableRewardWei =
                _stakes[stakekey].estimatedRewardAtMaturityWei -
                _stakes[stakekey].rewardClaimedWei;
        } else {
            claimableRewardWei = 0;
        }
    }

    /**
     * @dev get pool size in wei.
     */
    function _getPoolSizeWei(
        uint256 stakeDurationDays,
        uint256 poolAprWei,
        uint256 totalRewardWei,
        uint256 stakeTokenDecimals
    ) internal view virtual returns (uint256 poolSizeWei) {
        poolSizeWei = _truncatedAmountWei(
            (DAYS_IN_YEAR * PERCENT_100_WEI * totalRewardWei) /
                (stakeDurationDays * poolAprWei),
            stakeTokenDecimals
        );
    }

    /**
     * @dev is stake matured by stake key.
     */
    function _isStakeMaturedByStakekey(bytes memory stakekey)
        internal
        view
        virtual
        returns (bool)
    {
        return
            _stakes[stakekey].stakeMaturityTimestamp > 0 &&
            block.timestamp >= _stakes[stakekey].stakeMaturityTimestamp;
    }

    /**
     * @dev transfer tokens from this contract to specified account
     */
    function _transferTokensToAccount(
        address tokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address account
    ) internal virtual {
        require(tokenAddress != address(0), "SSvcs: token address");
        require(tokenDecimals <= TOKEN_MAX_DECIMALS, "SSvcs: token decimals");
        require(amountWei > 0, "SSvcs: amount");
        require(account != address(0), "SSvcs: account");

        uint256 amountDecimals = amountWei.scaleWeiToDecimals(tokenDecimals);

        IERC20(tokenAddress).safeTransfer(account, amountDecimals);
    }

    /**
     * @dev transfer tokens from account to this contract.
     */
    function _transferTokensToContract(
        address tokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address account
    ) internal virtual {
        require(tokenAddress != address(0), "SSvcs: token address");
        require(tokenDecimals <= TOKEN_MAX_DECIMALS, "SSvcs: token decimals");
        require(amountWei > 0, "SSvcs: amount");
        require(account != address(0), "SSvcs: account");

        uint256 amountDecimals = amountWei.scaleWeiToDecimals(tokenDecimals);

        IERC20(tokenAddress).safeTransferFrom(
            account,
            address(this),
            amountDecimals
        );
    }
}
