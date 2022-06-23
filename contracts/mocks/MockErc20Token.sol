// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";

/**
 * @title MockErc20Token
 * @author Tim Loh
 */
contract MockErc20Token is ERC20Capped {
    uint8 private _tokenDecimals;

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals,
        uint256 tokenCapWei
    ) ERC20(tokenName, tokenSymbol) ERC20Capped(tokenCapWei) {
        _tokenDecimals = tokenDecimals;
        _mint(msg.sender, tokenCapWei);
    }

    function decimals()
        public
        view
        virtual
        override
        returns (uint8 tokenDecimals)
    {
        tokenDecimals = _tokenDecimals;
    }
}
