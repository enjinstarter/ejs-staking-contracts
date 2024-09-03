// SPDX-License-Identifier: Apache-2.0
// Copyright 2024 Enjinstarter
pragma solidity ^0.8.0;

import {IStakingPoolV2} from "../interfaces/IStakingPoolV2.sol";
import {StakingServiceV2} from "../StakingServiceV2.sol";

/**
 * @title MockStakingServiceV2
 * @author Tim Loh
 */
contract MockStakingServiceV2 is StakingServiceV2 {
    constructor(address stakingPoolContract_)
        StakingServiceV2(stakingPoolContract_)
    // solhint-disable-next-line no-empty-blocks
    {

    }

    function _calculateStakeMaturityTimestamp(uint256 stakeDurationDays, uint256 stakeTimestamp)
        internal
        pure
        override
        returns (uint256 calculatedStakeMaturityTimestamp)
    {
        // slither-disable-next-line incorrect-equality
        if (stakeDurationDays == 180) {
            calculatedStakeMaturityTimestamp = stakeTimestamp;
        } else {
            calculatedStakeMaturityTimestamp = super._calculateStakeMaturityTimestamp(stakeDurationDays, stakeTimestamp);
        }

    }

    function _calculateUnstakeCooldownExpiryTimestamp(uint256 cooldownPeriodDays, uint256 unstakeTimestamp)
        internal
        pure
        override
        returns (uint256 calculatedCooldownExpiryTimestamp)
    {
        // slither-disable-next-line incorrect-equality
        if (cooldownPeriodDays == 12) {
            calculatedCooldownExpiryTimestamp = unstakeTimestamp - 1;
        } else {
            calculatedCooldownExpiryTimestamp = super._calculateUnstakeCooldownExpiryTimestamp(cooldownPeriodDays, unstakeTimestamp);
        }
    }

    function _getUnstakeInfoByStakekey(IStakingPoolV2.StakingPoolInfo memory stakingPoolInfo, bytes memory stakekey)
        internal
        view
        override
        returns (uint256 unstakeAmountWei, uint256 unstakePenaltyAmountWei, uint256 unstakePenaltyPercentWei, uint256 unstakeCooldownPeriodDays, bool isStakeMature)
    {
        bytes memory testStakekey = _getStakeKey(keccak256(abi.encodePacked("b2507daa-6117-4da1-a037-5483116c1397")), msg.sender, keccak256(abi.encodePacked("491fbb37-cd20-4edd-90e8-a4dc5c590c43")));

        if (keccak256(stakekey) == keccak256(testStakekey)) {
            isStakeMature = false;
            unstakePenaltyPercentWei = 0;
            unstakePenaltyAmountWei = 0;
            unstakeAmountWei =  0;
            unstakeCooldownPeriodDays = 0;
        } else {
            (
                unstakeAmountWei,
                unstakePenaltyAmountWei,
                unstakePenaltyPercentWei,
                unstakeCooldownPeriodDays,
                isStakeMature
            ) = super._getUnstakeInfoByStakekey(stakingPoolInfo, stakekey);
        }
    }
}
