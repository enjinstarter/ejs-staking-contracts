const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");

async function newStakingService(stakingPoolAddress) {
  const StakingServiceFactory =
    await hre.ethers.getContractFactory("StakingServiceV2");
  const stakingServiceContractInstance =
    await StakingServiceFactory.deploy(stakingPoolAddress);
  await stakingServiceContractInstance.deployed();

  return stakingServiceContractInstance;
}

module.exports = {
  newStakingService,
};
