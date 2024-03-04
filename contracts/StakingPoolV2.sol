// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Enjinstarter
pragma solidity ^0.8.0;

import {AdminPrivileges} from "./AdminPrivileges.sol";
import {IStakingPoolV2} from "./interfaces/IStakingPoolV2.sol";

/**
 * @title StakingPoolV2
 * @author Tim Loh
 * @notice Contains the staking pool configs used by StakingServiceV2
 */
contract StakingPoolV2 is AdminPrivileges, IStakingPoolV2 {
    uint256 public constant PERCENT_100_WEI = 100 ether;
    uint256 public constant TOKEN_MAX_DECIMALS = 18;

    mapping(bytes32 => StakingPoolInfo) private _stakingPools;

    /**
     * @inheritdoc IStakingPoolV2
     */
    function closeStakingPool(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");
        require(_stakingPools[poolId].isOpen, "SPool2: closed");

        _stakingPools[poolId].isOpen = false;

        emit StakingPoolClosed(poolId, msg.sender);
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function createStakingPool(bytes32 poolId, StakingPoolDto calldata stakingPoolDto)
        external virtual override onlyRole(CONTRACT_ADMIN_ROLE) {
        require(stakingPoolDto.stakeDurationDays > 0, "SPool2: stake duration");
        require(stakingPoolDto.stakeTokenAddress != address(0), "SPool2: stake token");
        require(
            stakingPoolDto.stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SPool2: stake decimals"
        );
        require(stakingPoolDto.rewardTokenAddress != address(0), "SPool2: reward token");
        require(
            stakingPoolDto.rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SPool2: reward decimals"
        );
        require(
            stakingPoolDto.stakeTokenAddress != stakingPoolDto.rewardTokenAddress ||
                stakingPoolDto.stakeTokenDecimals == stakingPoolDto.rewardTokenDecimals,
            "SPool2: decimals different"
        );
        require(stakingPoolDto.earlyUnstakePenaltyPercentWei <= PERCENT_100_WEI, "SPool2: penalty");

        require(!_stakingPools[poolId].isInitialized, "SPool2: exists");

        _stakingPools[poolId] = StakingPoolInfo({
            stakeDurationDays: stakingPoolDto.stakeDurationDays,
            stakeTokenAddress: stakingPoolDto.stakeTokenAddress,
            stakeTokenDecimals: stakingPoolDto.stakeTokenDecimals,
            rewardTokenAddress: stakingPoolDto.rewardTokenAddress,
            rewardTokenDecimals: stakingPoolDto.rewardTokenDecimals,
            poolAprWei: stakingPoolDto.poolAprWei,
            earlyUnstakeCooldownPeriodDays: stakingPoolDto.earlyUnstakeCooldownPeriodDays,
            earlyUnstakePenaltyPercentWei: stakingPoolDto.earlyUnstakePenaltyPercentWei,
            revshareStakeDurationExtensionDays: stakingPoolDto.revshareStakeDurationExtensionDays,
            isOpen: true,
            isActive: true,
            isInitialized: true
        });

        emit StakingPoolCreated(
            poolId,
            msg.sender,
            stakingPoolDto.stakeDurationDays,
            stakingPoolDto.stakeTokenAddress,
            stakingPoolDto.stakeTokenDecimals,
            stakingPoolDto.rewardTokenAddress,
            stakingPoolDto.rewardTokenDecimals,
            stakingPoolDto.poolAprWei,
            stakingPoolDto.earlyUnstakeCooldownPeriodDays,
            stakingPoolDto.earlyUnstakePenaltyPercentWei,
            stakingPoolDto.revshareStakeDurationExtensionDays
        );
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function openStakingPool(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");
        require(!_stakingPools[poolId].isOpen, "SPool2: opened");

        _stakingPools[poolId].isOpen = true;

        emit StakingPoolOpened(poolId, msg.sender);
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function resumeStakingPool(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");
        require(!_stakingPools[poolId].isActive, "SPool2: active");

        _stakingPools[poolId].isActive = true;

        emit StakingPoolResumed(poolId, msg.sender);
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function setEarlyUnstakeCooldownPeriod(bytes32 poolId, uint256 newCooldownPeriodDays)
        external virtual override onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");

        uint256 oldCooldownPeriodDays = _stakingPools[poolId].earlyUnstakeCooldownPeriodDays;
        _stakingPools[poolId].earlyUnstakeCooldownPeriodDays = newCooldownPeriodDays;

        emit EarlyUnstakeCooldownPeriodChanged(poolId, msg.sender, oldCooldownPeriodDays, newCooldownPeriodDays);
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function setEarlyUnstakePenaltyPercent(bytes32 poolId, uint256 newPenaltyPercentWei)
        external virtual override onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");
        require(newPenaltyPercentWei <= PERCENT_100_WEI, "SPool2: penalty");

        uint256 oldPenaltyPercentWei = _stakingPools[poolId].earlyUnstakePenaltyPercentWei;
        _stakingPools[poolId].earlyUnstakePenaltyPercentWei = newPenaltyPercentWei;

        emit EarlyUnstakePenaltyPercentChanged(poolId, msg.sender, oldPenaltyPercentWei, newPenaltyPercentWei);
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function setRevshareStakeDurationExtension(bytes32 poolId, uint256 newStakeDurationExtensionDays)
        external virtual override onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");

        uint256 oldStakeDurationExtensionDays = _stakingPools[poolId].revshareStakeDurationExtensionDays;
        _stakingPools[poolId].revshareStakeDurationExtensionDays = newStakeDurationExtensionDays;

        emit RevshareStakeDurationExtensionChanged(
            poolId,
            msg.sender,
            oldStakeDurationExtensionDays,
            newStakeDurationExtensionDays
        );
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function suspendStakingPool(bytes32 poolId)
        external
        virtual
        override
        onlyRole(CONTRACT_ADMIN_ROLE)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");
        require(_stakingPools[poolId].isActive, "SPool2: suspended");

        _stakingPools[poolId].isActive = false;

        emit StakingPoolSuspended(poolId, msg.sender);
    }

    /**
     * @inheritdoc IStakingPoolV2
     */
    function getStakingPoolInfo(bytes32 poolId)
        external
        view
        virtual
        override
        returns (StakingPoolInfo memory stakingPoolInfo)
    {
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");

        stakingPoolInfo.stakeDurationDays = _stakingPools[poolId].stakeDurationDays;
        stakingPoolInfo.stakeTokenAddress = _stakingPools[poolId].stakeTokenAddress;
        stakingPoolInfo.stakeTokenDecimals = _stakingPools[poolId].stakeTokenDecimals;
        stakingPoolInfo.rewardTokenAddress = _stakingPools[poolId].rewardTokenAddress;
        stakingPoolInfo.rewardTokenDecimals = _stakingPools[poolId].rewardTokenDecimals;
        stakingPoolInfo.poolAprWei = _stakingPools[poolId].poolAprWei;
        stakingPoolInfo.earlyUnstakeCooldownPeriodDays = _stakingPools[poolId].earlyUnstakeCooldownPeriodDays;
        stakingPoolInfo.earlyUnstakePenaltyPercentWei = _stakingPools[poolId].earlyUnstakePenaltyPercentWei;
        stakingPoolInfo.revshareStakeDurationExtensionDays = _stakingPools[poolId].revshareStakeDurationExtensionDays;
        stakingPoolInfo.isOpen = _stakingPools[poolId].isOpen;
        stakingPoolInfo.isActive = _stakingPools[poolId].isActive;
        stakingPoolInfo.isInitialized = _stakingPools[poolId].isInitialized;
    }
}
