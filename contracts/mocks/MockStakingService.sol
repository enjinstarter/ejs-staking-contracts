// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Enjinstarter
pragma solidity ^0.8.0;

import "../AdminPrivileges.sol";
import "../StakingService.sol";

/**
 * @title MockStakingService
 * @author Tim Loh
 */
contract MockStakingService is StakingService {
    constructor(address stakingPoolContract_)
        StakingService(stakingPoolContract_)
    {}

    function transferTokensToAccount(
        address tokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address account
    ) external virtual onlyRole(GOVERNANCE_ROLE) {
        _transferTokensToAccount(
            tokenAddress,
            tokenDecimals,
            amountWei,
            account
        );
    }

    function transferTokensToContract(
        address tokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address account
    ) external virtual onlyRole(GOVERNANCE_ROLE) {
        _transferTokensToContract(
            tokenAddress,
            tokenDecimals,
            amountWei,
            account
        );
    }

    function _calculateStakeMaturityTimestamp(uint256, uint256 stakeTimestamp)
        internal
        view
        virtual
        override
        returns (uint256 calculatedStakeMaturityTimestamp)
    {
        calculatedStakeMaturityTimestamp = stakeTimestamp;
    }
}
