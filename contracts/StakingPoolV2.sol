// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Enjinstarter
pragma solidity ^0.8.0;

import {AdminPrivileges} from "./AdminPrivileges.sol";
import {IStakingPool} from "./interfaces/IStakingPool.sol";

/**
 * @title StakingPoolV2
 * @author Tim Loh
 * @notice Contains the staking pool configs used by StakingService
 */
contract StakingPoolV2 is AdminPrivileges, IStakingPool {
    struct StakingPoolInfo {
        uint256 stakeDurationDays;
        address stakeTokenAddress;
        uint256 stakeTokenDecimals;
        address rewardTokenAddress;
        uint256 rewardTokenDecimals;
        uint256 poolAprWei; // pool APR in Wei
        bool isOpen; // true if staking pool allows staking
        bool isActive; // true if staking pool allows claim rewards and unstake
        bool isInitialized; // true if staking pool has been initialized
    }

    uint256 public constant TOKEN_MAX_DECIMALS = 18;

    mapping(bytes32 => StakingPoolInfo) private _stakingPools;

    /**
     * @inheritdoc IStakingPool
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
     * @inheritdoc IStakingPool
     */
    function createStakingPool(
        bytes32 poolId,
        uint256 stakeDurationDays,
        address stakeTokenAddress,
        uint256 stakeTokenDecimals,
        address rewardTokenAddress,
        uint256 rewardTokenDecimals,
        uint256 poolAprWei
    ) external virtual override onlyRole(CONTRACT_ADMIN_ROLE) {
        require(stakeDurationDays > 0, "SPool2: stake duration");
        require(stakeTokenAddress != address(0), "SPool2: stake token");
        require(
            stakeTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SPool2: stake decimals"
        );
        require(rewardTokenAddress != address(0), "SPool2: reward token");
        require(
            rewardTokenDecimals <= TOKEN_MAX_DECIMALS,
            "SPool2: reward decimals"
        );
        require(
            stakeTokenAddress != rewardTokenAddress ||
                stakeTokenDecimals == rewardTokenDecimals,
            "SPool2: decimals different"
        );

        require(!_stakingPools[poolId].isInitialized, "SPool2: exists");

        _stakingPools[poolId] = StakingPoolInfo({
            stakeDurationDays: stakeDurationDays,
            stakeTokenAddress: stakeTokenAddress,
            stakeTokenDecimals: stakeTokenDecimals,
            rewardTokenAddress: rewardTokenAddress,
            rewardTokenDecimals: rewardTokenDecimals,
            poolAprWei: poolAprWei,
            isOpen: true,
            isActive: true,
            isInitialized: true
        });

        emit StakingPoolCreated(
            poolId,
            msg.sender,
            stakeDurationDays,
            stakeTokenAddress,
            stakeTokenDecimals,
            rewardTokenAddress,
            rewardTokenDecimals,
            poolAprWei
        );
    }

    /**
     * @inheritdoc IStakingPool
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
     * @inheritdoc IStakingPool
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
     * @inheritdoc IStakingPool
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
     * @inheritdoc IStakingPool
     */
    function getStakingPoolInfo(bytes32 poolId)
        external
        view
        virtual
        override
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
        require(_stakingPools[poolId].isInitialized, "SPool2: uninitialized");

        stakeDurationDays = _stakingPools[poolId].stakeDurationDays;
        stakeTokenAddress = _stakingPools[poolId].stakeTokenAddress;
        stakeTokenDecimals = _stakingPools[poolId].stakeTokenDecimals;
        rewardTokenAddress = _stakingPools[poolId].rewardTokenAddress;
        rewardTokenDecimals = _stakingPools[poolId].rewardTokenDecimals;
        poolAprWei = _stakingPools[poolId].poolAprWei;
        isOpen = _stakingPools[poolId].isOpen;
        isActive = _stakingPools[poolId].isActive;
    }
}
