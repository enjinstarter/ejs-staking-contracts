// SPDX-License-Identifier: Apache-2.0
// Copyright 2023 Enjinstarter
pragma solidity ^0.8.0;

import {UnitConverter} from "../libraries/UnitConverter.sol";

/**
 * @title MockUnitConverter
 * @author Tim Loh
 */
contract MockUnitConverter {
    using UnitConverter for uint256;

    function scaleWeiToDecimals(uint256 weiAmount, uint256 decimals) public pure returns (uint256 decimalsAmount) {
        decimalsAmount = weiAmount.scaleWeiToDecimals(decimals);
    }

    function scaleDecimalsToWei(uint256 decimalsAmount, uint256 decimals) public pure returns (uint256 weiAmount) {
        weiAmount = decimalsAmount.scaleDecimalsToWei(decimals);
    }

    function truncateWeiToDecimals(uint256 weiAmount, uint256 decimals) public pure returns (uint256 truncatedWeiAmount) {
        truncatedWeiAmount = weiAmount.truncateWeiToDecimals(decimals);
    }
}
