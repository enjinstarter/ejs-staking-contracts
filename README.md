# ejs-staking-contracts

## Overview

The **EJS Staking Contracts** project is a Hardhat-based Ethereum smart contract development environment. It is designed to deploy and manage staking-related contracts, including staking pools, and staking services. The project supports multiple blockchain networks, including Ethereum, Binance Smart Chain (BSC), Polygon, and OKC, with a focus on modularity, security, and extensibility.

---

## Architecture

### Key Components

1. **Smart Contracts**

    - **MockERC20Token**: A mock ERC20 token for testing purposes.
    - **StakingPool**: Manages staking pools and tracks pool statistics.
    - **StakingService**: Provides staking-related services.
    - **UnitConverter**: Utility contract for unit conversions.

2. **Deployment Scripts**

    - Located in the deploys directory.
    - Includes scripts for deploying individual contracts (`deploy-mock-erc20-token.js`, deploy-staking-pool.js, deploy-staking-service.js, deploy-unit-converter.js).
    - Uses helper functions from deploy-helpers.js for contract deployment, and verification.

3. **Configuration**

    - **Hardhat Configuration**: Defined in hardhat.config.js, supporting multiple networks and plugins.
    - **Environment Variables**: Managed via .env files for network-specific settings (e.g., private keys, API keys, RPC URLs).

4. **Plugins**
    - Hardhat plugins for testing, gas reporting, contract sizing, and verification.
    - Custom plugins like `@enjinstarter/hardhat-oklink-verify` for OKC network verification.

---

## Functional Requirements

### Core Features

1. **Staking**

    - Users can stake tokens in a pool and earn rewards.
    - Supports multiple staking pools with configurable parameters.

2. **Token Management**

    - Deploy mock ERC20 tokens for testing purposes.
    - Configure token properties (e.g., name, symbol, decimals, cap) via environment variables.

3. **Deployment**

    - Deploy contracts to various networks using Hardhat scripts.

4. **Verification**

    - Verify contracts on block explorers (e.g., Etherscan, Polygonscan, OKLink).

5. **Testing**

    - Write unit and integration tests using Hardhat's testing framework.
    - Measure test coverage with `solidity-coverage`.

6. **Gas Optimization**
    - Analyze gas usage with `hardhat-gas-reporter`.
    - Optimize contract functions based on gas reports.

---

## Project Structure

### Key Files and Directories

1. **Configuration**

    - hardhat.config.js: Main configuration file for Hardhat.
    - .env and .env.example: Environment variable files for network-specific settings.

2. **Deployment Scripts**

    - deploys: Contains deployment scripts and helper functions.
        - deploy-mock-erc20-token.js
        - deploy-staking-pool.js
        - deploy-staking-service.js
        - deploy-unit-converter.js
        - deploy-helpers.js: Shared helper functions for deployment and verification.

3. **Reports**

    - coverage.json: Test coverage report.
    - gas-reporter-output.txt: Gas usage report.

4. **Plugins**
    - Hardhat plugins for testing, verification, and analysis:
        - `@nomiclabs/hardhat-ethers`
        - `@nomiclabs/hardhat-etherscan`
        - `hardhat-gas-reporter`
        - `solidity-coverage`
        - `@enjinstarter/hardhat-oklink-verify`

---

## Network Configuration

### Supported Networks

The project supports the following networks, configured in hardhat.config.js:

1. **Ethereum**

    - Mainnet
    - Goerli
    - Ropsten

2. **Binance Smart Chain**

    - Mainnet
    - Testnet

3. **Polygon**

    - Mainnet
    - Mumbai Testnet

4. **OKC**
    - Mainnet
    - Testnet

### Environment Variables

Environment variables are used to configure network-specific settings, such as:

-   `COINMARKETCAP_API_KEY`: CoinMarketCap API key to fetch gas price
-   `REPORT_GAS`: true to report gas usage for unit tests

-   `BSC_MAINNET_BSCSCAN_API_KEY`: Bscscan API Key to verify contracts on BSC mainnet
-   `BSC_MAINNET_PRIVATE_KEY`: Private key to deploy contracts to BSC mainnet
-   `BSC_MAINNET_URL`: RPC endpoint for BSC mainnet
-   `BSC_MAINNET_STAKING_POOL_ADDRESS`: Staking pool contract address on BSC mainnet

-   `BSC_TESTNET_BSCSCAN_API_KEY`: Bscscan API Key to verify contracts on BSC testnet
-   `BSC_TESTNET_PRIVATE_KEY`: Private key to deploy contracts to BSC testnet
-   `BSC_TESTNET_URL`: RPC endpoint for BSC testnet
-   `BSC_TESTNET_STAKING_POOL_ADDRESS`: Staking pool contract address on BSC testnet
-   `BSC_TESTNET_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on BSC testnet
-   `BSC_TESTNET_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on BSC testnet
-   `BSC_TESTNET_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on BSC testnet
-   `BSC_TESTNET_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on BSC testnet

-   `GOERLI_ETHERSCAN_API_KEY`: Etherscan API Key to verify contracts on Ethereum Goerli testnet
-   `GOERLI_PRIVATE_KEY`: Private key to deploy contracts to Ethereum Goerli testnet
-   `GOERLI_URL`: RPC endpoint for Ethereum Goerli testnet
-   `GOERLI_STAKING_POOL_ADDRESS`: Staking pool contract address on Ethereum Goerli testnet
-   `GOERLI_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on BSC testnet
-   `GOERLI_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on BSC testnet
-   `GOERLI_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on BSC testnet
-   `GOERLI_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on BSC testnet

-   `MAINNET_ETHERSCAN_API_KEY`: Etherscan API Key to verify contracts on Ethereum mainnet
-   `MAINNET_PRIVATE_KEY`: Private key to deploy contracts to Ethereum mainnet
-   `MAINNET_URL`: RPC endpoint for Ethereum mainnet
-   `MAINNET_STAKING_POOL_ADDRESS`: Staking pool contract address on Ethereum mainnet

-   `OKC_MAINNET_OKLINK_API_KEY`: OKLink API Key to verify contracts on OKC mainnet
-   `OKC_MAINNET_PRIVATE_KEY`: Private key to deploy contracts to OKC mainnet
-   `OKC_MAINNET_URL`: RPC endpoint for OKC mainnet
-   `OKC_MAINNET_STAKING_POOL_ADDRESS`: Staking pool contract address on OKC mainnet

-   `OKC_TESTNET_OKLINK_API_KEY`: OKLink API Key to verify contracts on OKC testnet
-   `OKC_TESTNET_PRIVATE_KEY`: Private key to deploy contracts to OKC testnet
-   `OKC_TESTNET_URL`: RPC endpoint for OKC testnet
-   `OKC_TESTNET_STAKING_POOL_ADDRESS`: Staking pool contract address on OKC testnet
-   `OKC_TESTNET_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on OKC testnet
-   `OKC_TESTNET_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on OKC testnet
-   `OKC_TESTNET_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on OKC testnet
-   `OKC_TESTNET_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on OKC testnet

-   `POLYGON_MAINNET_POLYGONSCAN_API_KEY`: Polygonscan API Key to verify contracts on Polygon mainnet
-   `POLYGON_MAINNET_PRIVATE_KEY`: Private key to deploy contracts to Polygon mainnet
-   `POLYGON_MAINNET_URL`: RPC endpoint for Polygon mainnet
-   `POLYGON_MAINNET_STAKING_POOL_ADDRESS`: Staking pool contract address on Polygon mainnet

-   `POLYGON_MUMBAI_POLYGONSCAN_API_KEY`: Polygonscan API Key to verify contracts on Polygon Mumbai testnet
-   `POLYGON_MUMBAI_PRIVATE_KEY`: Private key to deploy contracts to Polygon Mumbai testnet
-   `POLYGON_MUMBAI_URL`: RPC endpoint for Polygon Mumbai testnet
-   `POLYGON_MUMBAI_STAKING_POOL_ADDRESS`: Staking pool contract address on Polygon Mumbai testnet
-   `POLYGON_TESTNET_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on BSC testnet
-   `POLYGON_TESTNET_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on BSC testnet
-   `POLYGON_TESTNET_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on BSC testnet
-   `POLYGON_TESTNET_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on BSC testnet

-   `ROPSTEN_ETHERSCAN_API_KEY`: Etherscan API Key to verify contracts on Ethereum Ropsten testnet
-   `ROPSTEN_PRIVATE_KEY`: Private key to deploy contracts to Ethereum Ropsten testnet
-   `ROPSTEN_URL`: RPC endpoint for Ethereum Ropsten testnet
-   `ROPSTEN_STAKING_POOL_ADDRESS`: Staking pool contract address on Ethereum Ropsten testnet
-   `ROPSTEN_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on BSC testnet
-   `ROPSTEN_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on BSC testnet
-   `ROPSTEN_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on BSC testnet
-   `ROPSTEN_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on BSC testnet

---

## Security Considerations

1. **Access Control**

    - Use role-based access control for administrative functions.
    - Ensure private keys are securely stored in .env files.

2. **Reentrancy**

    - Follow the checks-effects-interactions pattern to prevent reentrancy attacks.

3. **Static Analysis**

    - Use `solhint` and `slither` for static analysis of Solidity code.

4. **Auditing**

    - Regularly audit the codebase for vulnerabilities.

5. **Testing**
    - Write comprehensive tests to cover edge cases and potential exploits.

---

## Deployment Workflow

1. **Setup Environment**

    - Configure .env file with network-specific settings.

2. **Compile Contracts**

    - Run `npx hardhat compile` to compile Solidity contracts.

3. **Test Contracts**

    ```sh
    $ npm test
    ```

4. **Deploy Contracts**

    - Use deployment scripts in deploys:
        ```sh
        npm run deploy-bsc-testnet-mock-erc20-token
        npm run deploy-bsc-testnet-staking-pool
        npm run deploy-bsc-testnet-staking-service
        ```

5. **Verify Contracts**

    - Verify contracts on block explorers:
        ```sh
        npx hardhat verify --network <network-name> <contract-address> <constructor-args>
        ```

---

## References

-   [Hardhat Documentation](https://hardhat.org/docs)
-   [Etherscan Verification](https://hardhat.org/plugins/nomiclabs-hardhat-etherscan.html)
-   [Solidity Coverage](https://github.com/sc-forks/solidity-coverage)
-   [Gas Reporter](https://github.com/cgewecke/hardhat-gas-reporter)
