// SPDX-License-Identifier: Apache-2.0
// Copyright 2022 Enjinstarter
pragma solidity ^0.8.15;

/**
 * @title IAdminWallet
 * @author Tim Loh
 */
interface IAdminWallet {
    /**
     * @dev Emitted when admin wallet has been changed from `oldWallet` to `newWallet`
     */
    event AdminWalletChanged(
        address indexed oldWallet,
        address indexed newWalet,
        address indexed sender
    );

    /**
     * @dev Returns the admin wallet address.
     */
    function adminWallet() external view returns (address);
}
