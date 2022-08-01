# ejs-staking-contracts

## Environment Variables

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

## Testing

```console
$ npm test
```

## Deployment

```console
$ npm run deploy-bsc-testnet-mock-erc20-token
$ npm run deploy-bsc-testnet-staking-pool
$ npm run deploy-bsc-testnet-staking-service
```
