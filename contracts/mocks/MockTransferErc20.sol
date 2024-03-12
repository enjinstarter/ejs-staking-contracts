// SPDX-License-Identifier: Apache-2.0
// Copyright 2023 Enjinstarter
pragma solidity ^0.8.0;

import {IERC20, TransferErc20} from "../libraries/TransferErc20.sol";

/**
 * @title MockTransferErc20
 * @author Tim Loh
 */
contract MockTransferErc20 {
    using TransferErc20 for IERC20;

    function transferTokensFromContractToAccount(
        address erc20TokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address toAccount
    ) public {
        IERC20(erc20TokenAddress).transferTokensFromContractToAccount(tokenDecimals, amountWei, toAccount);
    }

    function transferTokensFromSenderToAccount(
        address erc20TokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei,
        address toAccount
    ) public {
        IERC20(erc20TokenAddress).transferTokensFromSenderToAccount(tokenDecimals, amountWei, toAccount);
    }

    function transferTokensFromSenderToContract(
        address erc20TokenAddress,
        uint256 tokenDecimals,
        uint256 amountWei
    ) public {
        IERC20(erc20TokenAddress).transferTokensFromSenderToContract(tokenDecimals, amountWei);
    }
}
