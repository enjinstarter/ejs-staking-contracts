// SPDX-License-Identifier: Apache-2.0
// Copyright 2023 Enjinstarter
pragma solidity ^0.8.0;

import {IERC20, SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {UnitConverter} from "./UnitConverter.sol";

/**
 * @title TransferErc20
 * @author Tim Loh
 * @notice Utility functions to transfer ERC20 tokens from calling contract or sender to given account
 */
library TransferErc20 {
    using SafeERC20 for IERC20;
    using UnitConverter for uint256;

    uint256 public constant TOKEN_MAX_DECIMALS = 18;

    /**
     * @dev Transfer ERC20 tokens from calling contract to given account
     * @param erc20Token The ERC20 token to be transferred
     * @param tokenDecimals The ERC20 token decimal places
     * @param amountWei The amount to transfer in Wei
     * @param toAccount The account to receive the ERC20 tokens
     */
    // https://github.com/crytic/slither/wiki/Detector-Documentation#dead-code
    // slither-disable-next-line dead-code
    function transferTokensFromContractToAccount(
        IERC20 erc20Token,
        uint256 tokenDecimals,
        uint256 amountWei,
        address toAccount
    ) internal {
        require(tokenDecimals <= TOKEN_MAX_DECIMALS, "TransferErc20: token decimals");
        require(amountWei > 0, "TransferErc20: wei amount");
        require(toAccount != address(0), "TransferErc20: account");

        uint256 amountDecimals = amountWei.scaleWeiToDecimals(tokenDecimals);
        require(amountDecimals > 0, "TransferErc20: decimals amount");

        erc20Token.safeTransfer(toAccount, amountDecimals);
    }

    /**
     * @dev Transfer ERC20 tokens from sender to given account
     * @param erc20Token The ERC20 token to be transferred
     * @param tokenDecimals The ERC20 token decimal places
     * @param amountWei The amount to transfer in Wei
     * @param toAccount The account to receive the ERC20 tokens
     */
    // https://github.com/crytic/slither/wiki/Detector-Documentation#dead-code
    // slither-disable-next-line dead-code
    function transferTokensFromSenderToAccount(
        IERC20 erc20Token,
        uint256 tokenDecimals,
        uint256 amountWei,
        address toAccount
    ) internal {
        require(tokenDecimals <= TOKEN_MAX_DECIMALS, "TransferErc20: token decimals");
        require(amountWei > 0, "TransferErc20: wei amount");
        require(toAccount != address(0), "TransferErc20: account");

        uint256 amountDecimals = amountWei.scaleWeiToDecimals(tokenDecimals);
        require(amountDecimals > 0, "TransferErc20: decimals amount");

        erc20Token.safeTransferFrom(msg.sender, toAccount, amountDecimals);
    }

    /**
     * @dev Transfer ERC20 tokens from sender to calling contract
     * @param erc20Token The ERC20 token to be transferred
     * @param tokenDecimals The ERC20 token decimal places
     * @param amountWei The amount to transfer in Wei
     */
    // https://github.com/crytic/slither/wiki/Detector-Documentation#dead-code
    // slither-disable-next-line dead-code
    function transferTokensFromSenderToContract(IERC20 erc20Token, uint256 tokenDecimals, uint256 amountWei) internal {
        transferTokensFromSenderToAccount(erc20Token, tokenDecimals, amountWei, address(this));
    }
}
