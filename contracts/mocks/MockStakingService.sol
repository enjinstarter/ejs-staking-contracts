// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Enjinstarter
pragma solidity ^0.8.0;

import "../libraries/UnitConverter.sol";
import "../AdminPrivileges.sol";
import "../StakingService.sol";

/**
 * @title MockStakingService
 * @author Tim Loh
 */
contract MockStakingService is StakingService {
    using UnitConverter for uint256;

    constructor(address stakingPoolContract_)
        StakingService(stakingPoolContract_)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function scaleWeiToDecimals(uint256 weiAmount, uint256 decimals)
        external
        pure
        returns (uint256)
    {
        return weiAmount.scaleWeiToDecimals(decimals);
    }

    function scaleDecimalsToWei(uint256 decimalsAmount, uint256 decimals)
        external
        pure
        returns (uint256)
    {
        return decimalsAmount.scaleDecimalsToWei(decimals);
    }

    function transferTokensToAccount(
        address tokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address account
    ) external onlyRole(GOVERNANCE_ROLE) {
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
    ) external onlyRole(GOVERNANCE_ROLE) {
        _transferTokensToContract(
            tokenAddress,
            tokenDecimals,
            amountWei,
            account
        );
    }

    function _calculateStakeMaturityTimestamp(uint256, uint256 stakeTimestamp)
        internal
        pure
        override
        returns (uint256 calculatedStakeMaturityTimestamp)
    {
        calculatedStakeMaturityTimestamp = stakeTimestamp;
    }
}
