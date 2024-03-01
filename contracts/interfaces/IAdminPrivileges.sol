// SPDX-License-Identifier: Apache-2.0
// Copyright 2023 Enjinstarter
pragma solidity ^0.8.0;

/**
 * @title AdminPrivileges Interface
 * @author Tim Loh
 * @notice Interface for admin privileges role definitions that are inherited by other contracts
 */
interface IAdminPrivileges {
    // solhint-disable func-name-mixedcase

    // https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions
    // slither-disable-next-line naming-convention
    function GOVERNANCE_ROLE() external view returns (bytes32);

    // https://github.com/crytic/slither/wiki/Detector-Documentation#conformance-to-solidity-naming-conventions
    // slither-disable-next-line naming-convention
    function CONTRACT_ADMIN_ROLE() external view returns (bytes32);

    // solhint-enable func-name-mixedcase
}
