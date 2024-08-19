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

-   `MAINNET_ETHERSCAN_API_KEY`: Etherscan API Key to verify contracts on Ethereum mainnet
-   `MAINNET_PRIVATE_KEY`: Private key to deploy contracts to Ethereum mainnet
-   `MAINNET_URL`: RPC endpoint for Ethereum mainnet
-   `MAINNET_STAKING_POOL_ADDRESS`: Staking pool contract address on Ethereum mainnet

-   `SEPOLIA_ETHERSCAN_API_KEY`: Etherscan API Key to verify contracts on Ethereum Sepolia testnet
-   `SEPOLIA_PRIVATE_KEY`: Private key to deploy contracts to Ethereum Sepolia testnet
-   `SEPOLIA_URL`: RPC endpoint for Ethereum Sepolia testnet
-   `SEPOLIA_STAKING_POOL_ADDRESS`: Staking pool contract address on Ethereum Sepolia testnet
-   `SEPOLIA_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on Ethereum Sepolia testnet
-   `SEPOLIA_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on Ethereum Sepolia testnet
-   `SEPOLIA_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on Ethereum Sepolia testnet
-   `SEPOLIA_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on Ethereum Sepolia testnet

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

-   `POLYGON_AMOY_POLYGONSCAN_API_KEY`: Polygonscan API Key to verify contracts on Polygon Amoy testnet
-   `POLYGON_AMOY_PRIVATE_KEY`: Private key to deploy contracts to Polygon Amoy testnet
-   `POLYGON_AMOY_URL`: RPC endpoint for Polygon Amoy testnet
-   `POLYGON_AMOY_STAKING_POOL_ADDRESS`: Staking pool contract address on Polygon Amoy testnet
-   `POLYGON_AMOY_MOCK_ERC20_TOKEN_NAME`: Mock ERC20 token name on Polygon Amoy testnet
-   `POLYGON_AMOY_MOCK_ERC20_TOKEN_SYMBOL`: Mock ERC20 token symbol on Polygon Amoy testnet
-   `POLYGON_AMOY_MOCK_ERC20_TOKEN_DECIMALS`: Mock ERC20 token decimals on Polygon Amoy testnet
-   `POLYGON_AMOY_MOCK_ERC20_TOKEN_CAP_ETHER`: Mock ERC20 token cap in ether on Polygon Amoy testnet

## Testing

```console
$ npm test
```

## Deployment

```console
$ npm run deploy-bsc-testnet-mock-erc20-token
$ npm run deploy-bsc-testnet-staking-pool-v2
$ npm run deploy-bsc-testnet-staking-service-v2
```
