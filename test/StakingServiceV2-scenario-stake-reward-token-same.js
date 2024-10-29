const { expect } = require("chai");
const hre = require("hardhat");
const testHelpers = require("./test-helpers.js");
const stakePoolHelpers = require("./stake-pool-v2-helpers.js");
const stakeServiceHelpers = require("./stake-service-v2-helpers.js");

describe("StakingServiceV2", function () {
  const rewardTokenAdminMintWei = hre.ethers.utils.parseEther("10000000");
  const stakeRewardTokenAdminMintWei = rewardTokenAdminMintWei;
  const stakeTokenAdminMintWei = hre.ethers.utils.parseEther("1000000");
  const totalStakeRewardLessByWei = hre.ethers.utils.parseEther("1");

  const rewardToken18DecimalsInfo = [
    {
      tokenName: "MockRewardToken18",
      tokenSymbol: "MREWARD18",
      tokenDecimals: hre.ethers.BigNumber.from(18),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
    {
      tokenName: "MockRewardToken06",
      tokenSymbol: "MREWARD06",
      tokenDecimals: hre.ethers.BigNumber.from(6),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
  ];

  const stakeRewardToken18DecimalsInfo = [
    {
      tokenName: "MockStakeRewardToken18",
      tokenSymbol: "MSTAKEREWARD18",
      tokenDecimals: hre.ethers.BigNumber.from(18),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
    {
      tokenName: "MockStakeRewardToken06",
      tokenSymbol: "MSTAKEREWARD06",
      tokenDecimals: hre.ethers.BigNumber.from(6),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
  ];

  const stakeToken18DecimalsInfo = [
    {
      tokenName: "MockStakeToken18",
      tokenSymbol: "MSTAKE18",
      tokenDecimals: hre.ethers.BigNumber.from(18),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
    {
      tokenName: "MockStakeToken06",
      tokenSymbol: "MSTAKE06",
      tokenDecimals: hre.ethers.BigNumber.from(6),
      tokenCapWei: hre.ethers.utils.parseEther("10000000000"),
    },
  ];

  const contractAdminMintAmountsWei = {
    rewardToken: rewardTokenAdminMintWei,
    stakeRewardToken: stakeRewardTokenAdminMintWei,
    stakeToken: stakeTokenAdminMintWei,
  };

  let accounts;
  let governanceRoleAccounts;
  let contractAdminRoleAccounts;
  let contractUsageRoleAccounts;
  let enduserAccounts;
  let unusedRoleAccounts;

  let rewardToken18DecimalsInstances;
  let stakeRewardToken18DecimalsInstances;
  let stakeToken18DecimalsInstances;
  let stakingPoolInstance;
  let stakingServiceInstance;

  let stakingPoolStakeRewardTokenSameConfigs;
  let stakingPoolsRewardBalanceOf;

  before(async () => {
    accounts = await hre.ethers.getSigners();
    /*
    console.log(`accounts.length: ${accounts.length}`);
    for (let i = 0; i < accounts.length; i++) {
      console.log(`accounts[${i}]: ${await accounts[i].getAddress()}`);
    }
    console.log();
    */
    governanceRoleAccounts = accounts.slice(0, 2);
    /*
    console.log(`governanceRoleAccounts.length: ${governanceRoleAccounts.length}`);
    for (let i = 0; i < governanceRoleAccounts.length; i++) {
      console.log(`governanceRoleAccounts[${i}]: ${await governanceRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    contractAdminRoleAccounts = accounts.slice(2, 4);
    /*
    console.log(`contractAdminRoleAccounts.length: ${contractAdminRoleAccounts.length}`);
    for (let i = 0; i < contractAdminRoleAccounts.length; i++) {
      console.log(`contractAdminRoleAccounts[${i}]: ${await contractAdminRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    unusedRoleAccounts = accounts.slice(4, 10);
    /*
    console.log(`unusedRoleAccounts.length: ${unusedRoleAccounts.length}`);
    for (let i = 0; i < unusedRoleAccounts.length; i++) {
      console.log(`unusedRoleAccounts[${i}]: ${await unusedRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    contractUsageRoleAccounts = accounts.slice(10, 15);
    /*
    console.log(`contractUsageRoleAccounts.length: ${contractUsageRoleAccounts.length}`);
    for (let i = 0; i < contractUsageRoleAccounts.length; i++) {
      console.log(`contractUsageRoleAccounts[${i}]: ${await contractUsageRoleAccounts[i].getAddress()}`);
    }
    console.log();
    */
    enduserAccounts = accounts.slice(15);
    /*
    console.log(`enduserAccounts.length: ${enduserAccounts.length}`);
    for (let i = 0; i < enduserAccounts.length; i++) {
      console.log(`enduserAccounts[${i}]: ${await enduserAccounts[i].getAddress()}`);
    }
    console.log();
    */
  });

  beforeEach(async () => {
    [
      rewardToken18DecimalsInstances,
      stakeToken18DecimalsInstances,
      stakeRewardToken18DecimalsInstances,
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      stakingPoolsRewardBalanceOf,
    ] = await stakePoolHelpers.initializeStakingPoolTestData(
      rewardToken18DecimalsInfo,
      stakeToken18DecimalsInfo,
      stakeRewardToken18DecimalsInfo,
      governanceRoleAccounts,
      contractAdminRoleAccounts,
      contractAdminMintAmountsWei,
    );

    stakingServiceInstance = await stakeServiceHelpers.newStakingService(
      stakingPoolInstance.address,
    );

    await testHelpers.grantRole(
      stakingServiceInstance,
      testHelpers.GOVERNANCE_ROLE,
      governanceRoleAccounts.slice(1),
      governanceRoleAccounts[0],
      true,
    );

    await testHelpers.grantRole(
      stakingServiceInstance,
      testHelpers.CONTRACT_ADMIN_ROLE,
      contractAdminRoleAccounts,
      governanceRoleAccounts[0],
      true,
    );

    await stakePoolHelpers.testCreateStakingPool(
      stakingPoolInstance,
      stakingPoolStakeRewardTokenSameConfigs,
      contractAdminRoleAccounts.slice(0, 1),
      true,
    );
  });

  describe("Scenario - same stake and reward token", function () {
    it("Should be able to stake, claim reward, revoke, unstake and withdraw", async () => {
      const stakeEvents = [
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(150),
          eventType: "AddReward",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          rewardAmountWei: hre.ethers.utils.parseEther(
            "3221.751459875567837144",
          ),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(301),
          eventType: "AddReward",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          rewardAmountWei: hre.ethers.utils.parseEther(
            "176892.717713562728261908",
          ),
          hasPermission: true,
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(452),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "56289.771597347214289913",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
          stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(603),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "65543.437176927627080171",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
          stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(754),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "43414.852562734645967971",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
          stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(905),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "99607.043352635206319059",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
          stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1056),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "58894.582172763617423307",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "f3159f39-bb26-47fc-8b0f-44d6959b20e1",
          stakeId: hre.ethers.utils.id("f3159f39-bb26-47fc-8b0f-44d6959b20e1"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1207),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
          stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1358),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
          stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1509),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "93956.444016158729639480",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "383009f7-ee4e-4576-8032-8b055bb41147",
          stakeId: hre.ethers.utils.id("383009f7-ee4e-4576-8032-8b055bb41147"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1660),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "28691.921604226736341486",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
          stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1811),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "38694.164531031409115445",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
          stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(1962),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "63157.920515015815280309",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "4defd107-efe9-414a-8354-0f37d113b24a",
          stakeId: hre.ethers.utils.id("4defd107-efe9-414a-8354-0f37d113b24a"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2113),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
          stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2264),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "21261.660445841801241206",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
          stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2415),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "383009f7-ee4e-4576-8032-8b055bb41147",
          stakeId: hre.ethers.utils.id("383009f7-ee4e-4576-8032-8b055bb41147"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2566),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "53216.859980957368515064",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "76643db8-1d4f-4983-bcd2-d262b24b0336",
          stakeId: hre.ethers.utils.id("76643db8-1d4f-4983-bcd2-d262b24b0336"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2717),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "f3159f39-bb26-47fc-8b0f-44d6959b20e1",
          stakeId: hre.ethers.utils.id("f3159f39-bb26-47fc-8b0f-44d6959b20e1"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(2868),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "31925.519305154605484789",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
          stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3019),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
          stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3170),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "76643db8-1d4f-4983-bcd2-d262b24b0336",
          stakeId: hre.ethers.utils.id("76643db8-1d4f-4983-bcd2-d262b24b0336"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3321),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "76643db8-1d4f-4983-bcd2-d262b24b0336",
          stakeId: hre.ethers.utils.id("76643db8-1d4f-4983-bcd2-d262b24b0336"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3472),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "1389.203351175896125017",
          ),
          stakeExceedPoolReward: false,
          stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
          stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3623),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
          stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3774),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
          stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(3925),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("225.2785556503"),
          stakeExceedPoolReward: false,
          stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
          stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(4076),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("2675.72918873882"),
          stakeExceedPoolReward: false,
          stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
          stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
        },
        {
          eventSecondsAfterStartblockTimestamp: hre.ethers.BigNumber.from(4227),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
          stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(88513),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
          stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(89419),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
          stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(89570),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
          stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(89721),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "7b4b92e3-fb72-4557-af1b-0ab99d06e59d",
          stakeId: hre.ethers.utils.id("7b4b92e3-fb72-4557-af1b-0ab99d06e59d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(90290),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "f0cc2925-5733-4e6e-976d-57b093e0edff",
          stakeId: hre.ethers.utils.id("f0cc2925-5733-4e6e-976d-57b093e0edff"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(90404),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7115.7665900114"),
          stakeExceedPoolReward: false,
          stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
          stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(90590),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
          stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(90695),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1811.9845913533"),
          stakeExceedPoolReward: false,
          stakeUuid: "91e47baa-30f2-4aa1-8687-b726166a78ca",
          stakeId: hre.ethers.utils.id("91e47baa-30f2-4aa1-8687-b726166a78ca"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(90845),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
          stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(262370),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
          stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(263010),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("539.38315573149"),
          stakeExceedPoolReward: false,
          stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
          stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(264165),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
          stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(273927),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("866.3800184366"),
          stakeExceedPoolReward: false,
          stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
          stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(308146),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
          stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(436965),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
          stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(438202),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "7938b802-f7ae-4356-b217-c29d35545d8a",
          stakeId: hre.ethers.utils.id("7938b802-f7ae-4356-b217-c29d35545d8a"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(439937),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "da8dd4f1-76a2-4138-b227-acc61e60edc1",
          stakeId: hre.ethers.utils.id("da8dd4f1-76a2-4138-b227-acc61e60edc1"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(441322),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("5110.51272510989"),
          stakeExceedPoolReward: false,
          stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
          stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(442213),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3789.41891704938"),
          stakeExceedPoolReward: false,
          stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
          stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(443262),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
          stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(444179),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "91e47baa-30f2-4aa1-8687-b726166a78ca",
          stakeId: hre.ethers.utils.id("91e47baa-30f2-4aa1-8687-b726166a78ca"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(445597),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "2c527a7a-8e01-4a03-8829-acaeed5c00ad",
          stakeId: hre.ethers.utils.id("2c527a7a-8e01-4a03-8829-acaeed5c00ad"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(446917),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("2249.19019644633"),
          stakeExceedPoolReward: false,
          stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
          stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(15554868),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
          stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(15564625),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3906.28534120275"),
          stakeExceedPoolReward: false,
          stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
          stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31537660),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
          stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31541724),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7432.00457249105"),
          stakeExceedPoolReward: false,
          stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
          stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31566820),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("6034.66820432398"),
          stakeExceedPoolReward: false,
          stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
          stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31572954),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3385.3172954628"),
          stakeExceedPoolReward: false,
          stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
          stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31589263),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("6557.27214892638"),
          stakeExceedPoolReward: false,
          stakeUuid: "74354a47-9a30-4a35-b8c0-5fd9c2a08e74",
          stakeId: hre.ethers.utils.id("74354a47-9a30-4a35-b8c0-5fd9c2a08e74"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31595195),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("2505.89519536014"),
          stakeExceedPoolReward: false,
          stakeUuid: "2c3b7992-a766-4cf9-9272-2a6c57024cc7",
          stakeId: hre.ethers.utils.id("2c3b7992-a766-4cf9-9272-2a6c57024cc7"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31685312),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("770.20036585288"),
          stakeExceedPoolReward: false,
          stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
          stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31697298),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
          stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31729841),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
          stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31977322),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
          stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31978835),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
          stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31979933),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7926.24399682459"),
          stakeExceedPoolReward: false,
          stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
          stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31980968),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("5033.7876626605"),
          stakeExceedPoolReward: false,
          stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
          stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(47100625),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
          stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(47110835),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
          stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(47127406),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("6599.78039131017"),
          stakeExceedPoolReward: false,
          stakeUuid: "1fb7d744-83e8-4285-8c5e-b91728f9b600",
          stakeId: hre.ethers.utils.id("1fb7d744-83e8-4285-8c5e-b91728f9b600"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(47131459),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("4429.22933899988"),
          stakeExceedPoolReward: false,
          stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
          stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63102820),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
          stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63163330),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
          stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63175630),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
          stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63183213),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
          stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63184342),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("84.70426195331"),
          stakeExceedPoolReward: false,
          stakeUuid: "1ac89b36-4501-4f92-9005-5f66f7cfd5f2",
          stakeId: hre.ethers.utils.id("1ac89b36-4501-4f92-9005-5f66f7cfd5f2"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63185562),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("2055.62603138765"),
          stakeExceedPoolReward: false,
          stakeUuid: "a54fb4bf-52f5-4a40-8725-e01240179728",
          stakeId: hre.ethers.utils.id("a54fb4bf-52f5-4a40-8725-e01240179728"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63186260),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("9833.84578513"),
          stakeExceedPoolReward: false,
          stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
          stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63187851),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1854.12966454286"),
          stakeExceedPoolReward: false,
          stakeUuid: "4ce0220f-cd6b-4f77-9fc5-ae21929619b4",
          stakeId: hre.ethers.utils.id("4ce0220f-cd6b-4f77-9fc5-ae21929619b4"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63188541),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("9405.14059556136"),
          stakeExceedPoolReward: false,
          stakeUuid: "4f1b92ab-faa8-4c97-9fad-dd22f768df0a",
          stakeId: hre.ethers.utils.id("4f1b92ab-faa8-4c97-9fad-dd22f768df0a"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63189018),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("353.23876522253"),
          stakeExceedPoolReward: false,
          stakeUuid: "12746d63-2a5e-4cf3-84c5-ca04a317cf1e",
          stakeId: hre.ethers.utils.id("12746d63-2a5e-4cf3-84c5-ca04a317cf1e"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63221312),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
          stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63223690),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
          stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63226050),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "2c3b7992-a766-4cf9-9272-2a6c57024cc7",
          stakeId: hre.ethers.utils.id("2c3b7992-a766-4cf9-9272-2a6c57024cc7"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63515933),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
          stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63559011),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
          stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63561156),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
          stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63562237),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
          stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63563753),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
          stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63568710),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
          stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63569189),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
          stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63571029),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
          stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63572087),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "8a55dd59-621b-4f05-a3f3-fbb8e39bb355",
          stakeId: hre.ethers.utils.id("8a55dd59-621b-4f05-a3f3-fbb8e39bb355"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63573020),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
          stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63574302),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "616c63bc-9a57-43ad-84e4-4696a3006280",
          stakeId: hre.ethers.utils.id("616c63bc-9a57-43ad-84e4-4696a3006280"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63575374),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
          stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63576727),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
          stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63577270),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
          stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(63578590),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "0d7ae9e9-7354-40b4-854b-369b9c1e64e3",
          stakeId: hre.ethers.utils.id("0d7ae9e9-7354-40b4-854b-369b9c1e64e3"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(78663406),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "1fb7d744-83e8-4285-8c5e-b91728f9b600",
          stakeId: hre.ethers.utils.id("1fb7d744-83e8-4285-8c5e-b91728f9b600"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(78664579),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "0a8d5d75-5c1f-442e-9899-a7343ec5117d",
          stakeId: hre.ethers.utils.id("0a8d5d75-5c1f-442e-9899-a7343ec5117d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(78665126),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("9354.46258664962"),
          stakeExceedPoolReward: false,
          stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
          stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(78666126),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "76c91dc7-eae0-4aba-9605-54c309c9c898",
          stakeId: hre.ethers.utils.id("76c91dc7-eae0-4aba-9605-54c309c9c898"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(78667112),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("620.01082112667"),
          stakeExceedPoolReward: false,
          stakeUuid: "ba8ebfdf-991d-4409-a532-2fcaeff8616a",
          stakeId: hre.ethers.utils.id("ba8ebfdf-991d-4409-a532-2fcaeff8616a1"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(78668164),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("5807.86316457633"),
          stakeExceedPoolReward: false,
          stakeUuid: "8b76695b-cdac-4fed-994c-7efc81bb24df",
          stakeId: hre.ethers.utils.id("8b76695b-cdac-4fed-994c-7efc81bb24df"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94720342),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "1ac89b36-4501-4f92-9005-5f66f7cfd5f2",
          stakeId: hre.ethers.utils.id("1ac89b36-4501-4f92-9005-5f66f7cfd5f2"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94721332),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
          stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94722259),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "ffb20171-8376-46a9-8d1c-5ab38ee15070",
          stakeId: hre.ethers.utils.id("ffb20171-8376-46a9-8d1c-5ab38ee15070"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94723329),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "4f1b92ab-faa8-4c97-9fad-dd22f768df0a",
          stakeId: hre.ethers.utils.id("4f1b92ab-faa8-4c97-9fad-dd22f768df0a"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94724722),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "4ce0220f-cd6b-4f77-9fc5-ae21929619b4",
          stakeId: hre.ethers.utils.id("4ce0220f-cd6b-4f77-9fc5-ae21929619b4"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94726472),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "2d0edccd-93f8-44d9-94bd-8f9b64b2d829",
          stakeId: hre.ethers.utils.id("2d0edccd-93f8-44d9-94bd-8f9b64b2d829"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94728128),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "1fb7d744-83e8-4285-8c5e-b91728f9b600",
          stakeId: hre.ethers.utils.id("1fb7d744-83e8-4285-8c5e-b91728f9b600"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94729836),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "ba8ebfdf-991d-4409-a532-2fcaeff8616a",
          stakeId: hre.ethers.utils.id("ba8ebfdf-991d-4409-a532-2fcaeff8616a1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94730498),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "1ac89b36-4501-4f92-9005-5f66f7cfd5f2",
          stakeId: hre.ethers.utils.id("1ac89b36-4501-4f92-9005-5f66f7cfd5f2"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94732248),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "a54fb4bf-52f5-4a40-8725-e01240179728",
          stakeId: hre.ethers.utils.id("a54fb4bf-52f5-4a40-8725-e01240179728"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94733652),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "4ce0220f-cd6b-4f77-9fc5-ae21929619b4",
          stakeId: hre.ethers.utils.id("4ce0220f-cd6b-4f77-9fc5-ae21929619b4"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94734812),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "ba8ebfdf-991d-4409-a532-2fcaeff8616a",
          stakeId: hre.ethers.utils.id("ba8ebfdf-991d-4409-a532-2fcaeff8616a1"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94735717),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1668.49635717648"),
          stakeExceedPoolReward: false,
          stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
          stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94737150),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("4112.46150381816"),
          stakeExceedPoolReward: false,
          stakeUuid: "7d01b41c-cc37-4eda-a80b-1a812ac68479",
          stakeId: hre.ethers.utils.id("7d01b41c-cc37-4eda-a80b-1a812ac68479"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94738208),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("8208.33359740074"),
          stakeExceedPoolReward: false,
          stakeUuid: "33a2d68d-4bec-4d52-8620-33cb2ef24beb",
          stakeId: hre.ethers.utils.id("33a2d68d-4bec-4d52-8620-33cb2ef24beb"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94739779),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("2204.23258414384"),
          stakeExceedPoolReward: false,
          stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
          stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94740257),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("2339.36488186848"),
          stakeExceedPoolReward: false,
          stakeUuid: "8654524f-8da3-4962-96f7-bb6b70817059",
          stakeId: hre.ethers.utils.id("8654524f-8da3-4962-96f7-bb6b70817059"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94741988),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("118.11491988429"),
          stakeExceedPoolReward: false,
          stakeUuid: "b24973af-cc7d-4a42-ad62-6f4dd45048e8",
          stakeId: hre.ethers.utils.id("b24973af-cc7d-4a42-ad62-6f4dd45048e8"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94744110),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "96e45742-51ff-4a8d-8749-d2c510a7d003",
          stakeId: hre.ethers.utils.id("96e45742-51ff-4a8d-8749-d2c510a7d003"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94745417),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "017991f9-bbac-4fa7-8c59-79db77721943",
          stakeId: hre.ethers.utils.id("017991f9-bbac-4fa7-8c59-79db77721943"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94746541),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1396.05002350443"),
          stakeExceedPoolReward: false,
          stakeUuid: "b20f3ad7-7f88-4461-ac9d-86504e244a53",
          stakeId: hre.ethers.utils.id("b20f3ad7-7f88-4461-ac9d-86504e244a53"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94747338),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3733.88087403792"),
          stakeExceedPoolReward: false,
          stakeUuid: "6fbfe4ea-0203-475f-a385-4c09f1fa7dbe",
          stakeId: hre.ethers.utils.id("6fbfe4ea-0203-475f-a385-4c09f1fa7dbe"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94748117),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("9824.75387523475"),
          stakeExceedPoolReward: false,
          stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
          stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94748808),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("6965.37608107324"),
          stakeExceedPoolReward: false,
          stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
          stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94749824),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b50b5418-c81d-42d1-9f0f-f5e1752391a2",
          stakeId: hre.ethers.utils.id("b50b5418-c81d-42d1-9f0f-f5e1752391a2"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94750075),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
          stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94752445),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7652.9854424456"),
          stakeExceedPoolReward: false,
          stakeUuid: "03aef19f-bfe6-4432-9324-e4c146e4f4dc",
          stakeId: hre.ethers.utils.id("03aef19f-bfe6-4432-9324-e4c146e4f4dc"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94753608),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("5746.66911736668"),
          stakeExceedPoolReward: false,
          stakeUuid: "cd13b8f2-36c1-47f9-94af-85e97a946907",
          stakeId: hre.ethers.utils.id("cd13b8f2-36c1-47f9-94af-85e97a946907"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94754692),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("8768.80746923888"),
          stakeExceedPoolReward: false,
          stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
          stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94756395),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3233.74042763951"),
          stakeExceedPoolReward: false,
          stakeUuid: "c7d2e899-c633-4b7a-9d47-7e88f9b09c0d",
          stakeId: hre.ethers.utils.id("c7d2e899-c633-4b7a-9d47-7e88f9b09c0d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(94757894),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("940.08130789442"),
          stakeExceedPoolReward: false,
          stakeUuid: "a0a6d235-7496-4985-a775-446f6c1cda04",
          stakeId: hre.ethers.utils.id("a0a6d235-7496-4985-a775-446f6c1cda04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(110201126),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
          stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(110209400),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "2c3b7992-a766-4cf9-9272-2a6c57024cc7",
          stakeId: hre.ethers.utils.id("2c3b7992-a766-4cf9-9272-2a6c57024cc7"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126275779),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
          stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126283078),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
          stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126284008),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "7f01cb71-c1eb-4429-8cdc-649c72f06c57",
          stakeId: hre.ethers.utils.id("7f01cb71-c1eb-4429-8cdc-649c72f06c57"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126285525),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
          stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126286067),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "c3e0a4bf-1330-4991-9d77-08c9013dfb04",
          stakeId: hre.ethers.utils.id("c3e0a4bf-1330-4991-9d77-08c9013dfb04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126286610),
          eventType: "RemoveReward",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126287153),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
          stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126288715),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
          stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126289650),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
          stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126290996),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
          stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126291778),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
          stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126292551),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "cd881e25-1aac-486d-a3d5-efbed7d3a841",
          stakeId: hre.ethers.utils.id("cd881e25-1aac-486d-a3d5-efbed7d3a841"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126293612),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "6fbfe4ea-0203-475f-a385-4c09f1fa7dbe",
          stakeId: hre.ethers.utils.id("6fbfe4ea-0203-475f-a385-4c09f1fa7dbe"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126294602),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "0bd53c67-6c29-4b08-a2bf-57195cf770c0",
          stakeId: hre.ethers.utils.id("0bd53c67-6c29-4b08-a2bf-57195cf770c0"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126296287),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
          stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126297214),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b24973af-cc7d-4a42-ad62-6f4dd45048e8",
          stakeId: hre.ethers.utils.id("b24973af-cc7d-4a42-ad62-6f4dd45048e8"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126298324),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "6fbfe4ea-0203-475f-a385-4c09f1fa7dbe",
          stakeId: hre.ethers.utils.id("6fbfe4ea-0203-475f-a385-4c09f1fa7dbe"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126299832),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "33a2d68d-4bec-4d52-8620-33cb2ef24beb",
          stakeId: hre.ethers.utils.id("33a2d68d-4bec-4d52-8620-33cb2ef24beb"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126301700),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b4705246-330e-41c6-8bd3-14f7219307e7",
          stakeId: hre.ethers.utils.id("b4705246-330e-41c6-8bd3-14f7219307e7"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126303021),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "03aef19f-bfe6-4432-9324-e4c146e4f4dc",
          stakeId: hre.ethers.utils.id("03aef19f-bfe6-4432-9324-e4c146e4f4dc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126304798),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
          stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126306485),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "33a2d68d-4bec-4d52-8620-33cb2ef24beb",
          stakeId: hre.ethers.utils.id("33a2d68d-4bec-4d52-8620-33cb2ef24beb"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126307983),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "e56565b1-0fb7-419a-93a6-3bf58e5d6b0d",
          stakeId: hre.ethers.utils.id("e56565b1-0fb7-419a-93a6-3bf58e5d6b0d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126309838),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b24973af-cc7d-4a42-ad62-6f4dd45048e8",
          stakeId: hre.ethers.utils.id("b24973af-cc7d-4a42-ad62-6f4dd45048e8"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126310628),
          eventType: "RemoveRevokedStakes",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126311418),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
          stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126312777),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "03aef19f-bfe6-4432-9324-e4c146e4f4dc",
          stakeId: hre.ethers.utils.id("03aef19f-bfe6-4432-9324-e4c146e4f4dc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126314188),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "eaf8bbbb-0659-48be-98ce-26631dada22c",
          stakeId: hre.ethers.utils.id("eaf8bbbb-0659-48be-98ce-26631dada22c"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126315770),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
          stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126316577),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
          stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126317749),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "a0a6d235-7496-4985-a775-446f6c1cda04",
          stakeId: hre.ethers.utils.id("a0a6d235-7496-4985-a775-446f6c1cda04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126319637),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "127e8c73-152c-4d96-bceb-edaaa791aa89",
          stakeId: hre.ethers.utils.id("127e8c73-152c-4d96-bceb-edaaa791aa89"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126320564),
          eventType: "RemovePenalty",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126321492),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "a0a6d235-7496-4985-a775-446f6c1cda04",
          stakeId: hre.ethers.utils.id("a0a6d235-7496-4985-a775-446f6c1cda04"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126322367),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
          stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126323674),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1423.67439769709"),
          stakeExceedPoolReward: false,
          stakeUuid: "b79fe3cd-bc65-47ac-9733-38faddc6adb8",
          stakeId: hre.ethers.utils.id("b79fe3cd-bc65-47ac-9733-38faddc6adb8"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126324397),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
          stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126325310),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther(
            "7083.491000957529999983",
          ),
          stakeExceedPoolReward: true,
          stakeUuid: "5b4c5559-8dea-4627-866c-6f8f05d07256",
          stakeId: hre.ethers.utils.id("5b4c5559-8dea-4627-866c-6f8f05d07256"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126331901),
          eventType: "AddReward",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          rewardAmountWei: hre.ethers.utils.parseEther(
            "359.200961483466612328",
          ),
          hasPermission: true,
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126339729),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("4763.25310401376"),
          stakeExceedPoolReward: false,
          stakeUuid: "5b4c5559-8dea-4627-866c-6f8f05d07256",
          stakeId: hre.ethers.utils.id("5b4c5559-8dea-4627-866c-6f8f05d07256"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(126343614),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "74354a47-9a30-4a35-b8c0-5fd9c2a08e74",
          stakeId: hre.ethers.utils.id("74354a47-9a30-4a35-b8c0-5fd9c2a08e74"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(149499860),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
          stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(149500992),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
          stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(149501845),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "5b4c5559-8dea-4627-866c-6f8f05d07256",
          stakeId: hre.ethers.utils.id("5b4c5559-8dea-4627-866c-6f8f05d07256"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(149502618),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "12746d63-2a5e-4cf3-84c5-ca04a317cf1e",
          stakeId: hre.ethers.utils.id("12746d63-2a5e-4cf3-84c5-ca04a317cf1e"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164981764),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "8b76695b-cdac-4fed-994c-7efc81bb24df",
          stakeId: hre.ethers.utils.id("8b76695b-cdac-4fed-994c-7efc81bb24df"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164983311),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "74354a47-9a30-4a35-b8c0-5fd9c2a08e74",
          stakeId: hre.ethers.utils.id("74354a47-9a30-4a35-b8c0-5fd9c2a08e74"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164984556),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "10725343-f9f0-4619-b942-7288efb6dcde",
          stakeId: hre.ethers.utils.id("10725343-f9f0-4619-b942-7288efb6dcde"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164986180),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
          stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164987696),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
          stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164988628),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
          stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164989550),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "b598dc41-8507-465d-9f8d-a353dbacaaa0",
          stakeId: hre.ethers.utils.id("b598dc41-8507-465d-9f8d-a353dbacaaa0"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(164991224),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "e2075665-d0c0-43c5-906f-085dd586feb4",
          stakeId: hre.ethers.utils.id("e2075665-d0c0-43c5-906f-085dd586feb4"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(181050750),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "7d01b41c-cc37-4eda-a80b-1a812ac68479",
          stakeId: hre.ethers.utils.id("7d01b41c-cc37-4eda-a80b-1a812ac68479"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599210541),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b20f3ad7-7f88-4461-ac9d-86504e244a53",
          stakeId: hre.ethers.utils.id("b20f3ad7-7f88-4461-ac9d-86504e244a53"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599211257),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "8654524f-8da3-4962-96f7-bb6b70817059",
          stakeId: hre.ethers.utils.id("8654524f-8da3-4962-96f7-bb6b70817059"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599212714),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "8654524f-8da3-4962-96f7-bb6b70817059",
          stakeId: hre.ethers.utils.id("8654524f-8da3-4962-96f7-bb6b70817059"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599217608),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "cd13b8f2-36c1-47f9-94af-85e97a946907",
          stakeId: hre.ethers.utils.id("cd13b8f2-36c1-47f9-94af-85e97a946907"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599220395),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "c7d2e899-c633-4b7a-9d47-7e88f9b09c0d",
          stakeId: hre.ethers.utils.id("c7d2e899-c633-4b7a-9d47-7e88f9b09c0d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599221667),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "cd13b8f2-36c1-47f9-94af-85e97a946907",
          stakeId: hre.ethers.utils.id("cd13b8f2-36c1-47f9-94af-85e97a946907"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599222548),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "c7d2e899-c633-4b7a-9d47-7e88f9b09c0d",
          stakeId: hre.ethers.utils.id("c7d2e899-c633-4b7a-9d47-7e88f9b09c0d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599228463),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1537.50643491724"),
          stakeExceedPoolReward: false,
          stakeUuid: "294ab977-ac77-4fb6-a3a7-8cb8f44267f8",
          stakeId: hre.ethers.utils.id("294ab977-ac77-4fb6-a3a7-8cb8f44267f8"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599238178),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "8b76695b-cdac-4fed-994c-7efc81bb24df",
          stakeId: hre.ethers.utils.id("8b76695b-cdac-4fed-994c-7efc81bb24df"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599241470),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1158.72400163996"),
          stakeExceedPoolReward: false,
          stakeUuid: "8ca03356-87b9-4120-aa3c-67dadafcc109",
          stakeId: hre.ethers.utils.id("8ca03356-87b9-4120-aa3c-67dadafcc109"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599244762),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7290.30569106773"),
          stakeExceedPoolReward: false,
          stakeUuid: "dbc6ac7d-16be-49b3-9cc9-d24e8bb28e8a",
          stakeId: hre.ethers.utils.id("dbc6ac7d-16be-49b3-9cc9-d24e8bb28e8a"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599253801),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("6172.17664272682"),
          stakeExceedPoolReward: false,
          stakeUuid: "c336bdb8-ea79-4676-8493-123bedf5284c",
          stakeId: hre.ethers.utils.id("c336bdb8-ea79-4676-8493-123bedf5284c"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599255275),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("583.303060566634"),
          stakeExceedPoolReward: false,
          stakeUuid: "b755c782-e4a3-4409-84d1-4f7d51236e44",
          stakeId: hre.ethers.utils.id("b755c782-e4a3-4409-84d1-4f7d51236e44"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599256750),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("8037.4344309411"),
          stakeExceedPoolReward: false,
          stakeUuid: "3f9c30e6-7650-4682-9c87-1cc37c15e0dc",
          stakeId: hre.ethers.utils.id("3f9c30e6-7650-4682-9c87-1cc37c15e0dc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599257990),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "8b76695b-cdac-4fed-994c-7efc81bb24df",
          stakeId: hre.ethers.utils.id("8b76695b-cdac-4fed-994c-7efc81bb24df"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599260838),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("9913.93493572353"),
          stakeExceedPoolReward: false,
          stakeUuid: "a9428841-194b-45d2-b8e2-8b235b9479fc",
          stakeId: hre.ethers.utils.id("a9428841-194b-45d2-b8e2-8b235b9479fc"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599267066),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3034.36659944174"),
          stakeExceedPoolReward: false,
          stakeUuid: "d0bda781-c4ae-4624-a812-4e81433dff4f",
          stakeId: hre.ethers.utils.id("d0bda781-c4ae-4624-a812-4e81433dff4f"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599272540),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("5980.18140201611"),
          stakeExceedPoolReward: false,
          stakeUuid: "cc730c9f-81bb-4ff4-818b-42f26ceb38c5",
          stakeId: hre.ethers.utils.id("cc730c9f-81bb-4ff4-818b-42f26ceb38c5"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599275644),
          eventType: "RemoveReward",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599278748),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "7d01b41c-cc37-4eda-a80b-1a812ac68479",
          stakeId: hre.ethers.utils.id("7d01b41c-cc37-4eda-a80b-1a812ac68479"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599281898),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("4986.1513620559"),
          stakeExceedPoolReward: false,
          stakeUuid: "3cc4dcb1-f5a5-4f5c-abc9-7bd66b08fc4d",
          stakeId: hre.ethers.utils.id("3cc4dcb1-f5a5-4f5c-abc9-7bd66b08fc4d"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599286745),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("1017.79763287203"),
          stakeExceedPoolReward: false,
          stakeUuid: "be55c910-a8ea-4909-96d3-6685e8d327a3",
          stakeId: hre.ethers.utils.id("be55c910-a8ea-4909-96d3-6685e8d327a3"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599289403),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b79fe3cd-bc65-47ac-9733-38faddc6adb8",
          stakeId: hre.ethers.utils.id("b79fe3cd-bc65-47ac-9733-38faddc6adb8"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599295443),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7916.26765302041"),
          stakeExceedPoolReward: false,
          stakeUuid: "b872e70f-8ace-47ed-a4a5-b9a0632aface",
          stakeId: hre.ethers.utils.id("b872e70f-8ace-47ed-a4a5-b9a0632aface"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599296474),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("0.000000000000000001"),
          stakeExceedPoolReward: true,
          stakeUuid: "a7180d6b-29a9-4e45-be19-f704ad557097",
          stakeId: hre.ethers.utils.id("a7180d6b-29a9-4e45-be19-f704ad557097"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599297506),
          eventType: "AddReward",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          rewardAmountWei: hre.ethers.utils.parseEther("7594.51560472897"),
          hasPermission: true,
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599298538),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("7594.51560472897"),
          stakeExceedPoolReward: false,
          stakeUuid: "a7180d6b-29a9-4e45-be19-f704ad557097",
          stakeId: hre.ethers.utils.id("a7180d6b-29a9-4e45-be19-f704ad557097"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599306371),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "cc730c9f-81bb-4ff4-818b-42f26ceb38c5",
          stakeId: hre.ethers.utils.id("cc730c9f-81bb-4ff4-818b-42f26ceb38c5"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599307537),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "c336bdb8-ea79-4676-8493-123bedf5284c",
          stakeId: hre.ethers.utils.id("c336bdb8-ea79-4676-8493-123bedf5284c"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599316063),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3365.92853323147"),
          stakeExceedPoolReward: false,
          stakeUuid: "52b47321-0fb6-432c-a05a-2cacc8c94450",
          stakeId: hre.ethers.utils.id("52b47321-0fb6-432c-a05a-2cacc8c94450"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599320300),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "294ab977-ac77-4fb6-a3a7-8cb8f44267f8",
          stakeId: hre.ethers.utils.id("294ab977-ac77-4fb6-a3a7-8cb8f44267f8"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599322737),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
          stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599326618),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("9006.38472389375"),
          stakeExceedPoolReward: false,
          stakeUuid: "8168111f-b4dd-43a2-931b-804d4865e48d",
          stakeId: hre.ethers.utils.id("8168111f-b4dd-43a2-931b-804d4865e48d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599329633),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "7d01b41c-cc37-4eda-a80b-1a812ac68479",
          stakeId: hre.ethers.utils.id("7d01b41c-cc37-4eda-a80b-1a812ac68479"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599336804),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
          stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599342802),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
          stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599346259),
          eventType: "RemovePenalty",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599349716),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
          stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599352828),
          eventType: "RemoveRevokedStakes",
          poolIndex: 0,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599355939),
          eventType: "Unstake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "a9428841-194b-45d2-b8e2-8b235b9479fc",
          stakeId: hre.ethers.utils.id("a9428841-194b-45d2-b8e2-8b235b9479fc"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599363464),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("314.474055108155"),
          stakeExceedPoolReward: false,
          stakeUuid: "2dd68174-0e29-4f52-84f3-b3ac134449b5",
          stakeId: hre.ethers.utils.id("2dd68174-0e29-4f52-84f3-b3ac134449b5"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599365442),
          eventType: "Withdraw",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
          stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599374014),
          eventType: "Unstake",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b755c782-e4a3-4409-84d1-4f7d51236e44",
          stakeId: hre.ethers.utils.id("b755c782-e4a3-4409-84d1-4f7d51236e44"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599378180),
          eventType: "RemovePenalty",
          poolIndex: 0,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599382345),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
          stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599389829),
          eventType: "Withdraw",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
          stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599391543),
          eventType: "Unstake",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "3f9c30e6-7650-4682-9c87-1cc37c15e0dc",
          stakeId: hre.ethers.utils.id("3f9c30e6-7650-4682-9c87-1cc37c15e0dc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599394085),
          eventType: "RemoveReward",
          poolIndex: 0,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599396627),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "91d0dded-33a0-4712-af27-1a05ba1210ff",
          stakeId: hre.ethers.utils.id("91d0dded-33a0-4712-af27-1a05ba1210ff"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599405654),
          eventType: "Stake",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("4992.27322827974"),
          stakeExceedPoolReward: false,
          stakeUuid: "2b474aad-7acc-4087-a0d8-c0b655e685cc",
          stakeId: hre.ethers.utils.id("2b474aad-7acc-4087-a0d8-c0b655e685cc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599411064),
          eventType: "Claim",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "a9428841-194b-45d2-b8e2-8b235b9479fc",
          stakeId: hre.ethers.utils.id("a9428841-194b-45d2-b8e2-8b235b9479fc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599420783),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "51039073-96ad-4c2f-9938-3c56eba19b6f",
          stakeId: hre.ethers.utils.id("51039073-96ad-4c2f-9938-3c56eba19b6f"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599423364),
          eventType: "Stake",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("8328.97836721121"),
          stakeExceedPoolReward: false,
          stakeUuid: "c291ba1c-5e7f-4513-bb47-c73c2cd2100a",
          stakeId: hre.ethers.utils.id("c291ba1c-5e7f-4513-bb47-c73c2cd2100a"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599430343),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b755c782-e4a3-4409-84d1-4f7d51236e44",
          stakeId: hre.ethers.utils.id("b755c782-e4a3-4409-84d1-4f7d51236e44"),
        },
        {
          bankSigner: governanceRoleAccounts[0],
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599439522),
          eventType: "Stake",
          poolIndex: 2,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeAmountWei: hre.ethers.utils.parseEther("3514.57502188163"),
          stakeExceedPoolReward: false,
          stakeUuid: "6cd00945-9017-4774-9596-9fcf430e9f58",
          stakeId: hre.ethers.utils.id("6cd00945-9017-4774-9596-9fcf430e9f58"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599447188),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "a9428841-194b-45d2-b8e2-8b235b9479fc",
          stakeId: hre.ethers.utils.id("a9428841-194b-45d2-b8e2-8b235b9479fc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599451832),
          eventType: "RemoveRevokedStakes",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599456477),
          eventType: "Claim",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
          stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599461981),
          eventType: "Withdraw",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
          stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599465292),
          eventType: "Claim",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "3f9c30e6-7650-4682-9c87-1cc37c15e0dc",
          stakeId: hre.ethers.utils.id("3f9c30e6-7650-4682-9c87-1cc37c15e0dc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599471694),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "5958942b-f6f7-44ba-ad74-a7af1e33e6c1",
          stakeId: hre.ethers.utils.id("5958942b-f6f7-44ba-ad74-a7af1e33e6c1"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599479590),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "40ffd49d-a897-4ef4-b52e-d7897074382d",
          stakeId: hre.ethers.utils.id("40ffd49d-a897-4ef4-b52e-d7897074382d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599486252),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "b755c782-e4a3-4409-84d1-4f7d51236e44",
          stakeId: hre.ethers.utils.id("b755c782-e4a3-4409-84d1-4f7d51236e44"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599492446),
          eventType: "Revoke",
          poolIndex: 1,
          signer: enduserAccounts[0],
          signerAddress: await enduserAccounts[0].getAddress(),
          stakeUuid: "32e1466a-1fc6-4679-a753-b55b77c4537d",
          stakeId: hre.ethers.utils.id("32e1466a-1fc6-4679-a753-b55b77c4537d"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599496996),
          eventType: "Revoke",
          poolIndex: 2,
          signer: enduserAccounts[2],
          signerAddress: await enduserAccounts[2].getAddress(),
          stakeUuid: "3f9c30e6-7650-4682-9c87-1cc37c15e0dc",
          stakeId: hre.ethers.utils.id("3f9c30e6-7650-4682-9c87-1cc37c15e0dc"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599501809),
          eventType: "Revoke",
          poolIndex: 0,
          signer: enduserAccounts[1],
          signerAddress: await enduserAccounts[1].getAddress(),
          stakeUuid: "d5f88099-472a-4974-ad2a-c8d70af8f37f",
          stakeId: hre.ethers.utils.id("d5f88099-472a-4974-ad2a-c8d70af8f37f"),
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599503789),
          eventType: "RemoveRevokedStakes",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599506452),
          eventType: "RemovePenalty",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599513380),
          eventType: "RemoveReward",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599517620),
          eventType: "RemoveReward",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599523349),
          eventType: "RemovePenalty",
          poolIndex: 0,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599524551),
          eventType: "RemoveRevokedStakes",
          poolIndex: 0,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599526511),
          eventType: "RemovePenalty",
          poolIndex: 2,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAccount: governanceRoleAccounts[0],
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599529000),
          eventType: "RemoveReward",
          poolIndex: 0,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
        {
          eventSecondsAfterStartblockTimestamp:
            hre.ethers.BigNumber.from(31599537956),
          eventType: "RemoveRevokedStakes",
          poolIndex: 1,
          signer: contractAdminRoleAccounts[1],
          signerAddress: await contractAdminRoleAccounts[1].getAddress(),
          adminWalletAddress: await governanceRoleAccounts[0].getAddress(),
          hasPermission: true,
        },
      ];

      const stakeInfos = [];

      const stakeInfos000 = new Map();
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId},${stakeEvents[5].signerAddress},${stakeEvents[5].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[6].poolIndex].poolId},${stakeEvents[6].signerAddress},${stakeEvents[6].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId},${stakeEvents[11].signerAddress},${stakeEvents[11].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId},${stakeEvents[18].signerAddress},${stakeEvents[18].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId},${stakeEvents[22].signerAddress},${stakeEvents[22].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId},${stakeEvents[26].signerAddress},${stakeEvents[26].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[35].poolIndex].poolId},${stakeEvents[35].signerAddress},${stakeEvents[35].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId},${stakeEvents[40].signerAddress},${stakeEvents[40].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId},${stakeEvents[45].signerAddress},${stakeEvents[45].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId},${stakeEvents[46].signerAddress},${stakeEvents[46].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId},${stakeEvents[58].signerAddress},${stakeEvents[58].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId},${stakeEvents[59].signerAddress},${stakeEvents[59].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId},${stakeEvents[64].signerAddress},${stakeEvents[64].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId},${stakeEvents[65].signerAddress},${stakeEvents[65].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId},${stakeEvents[68].signerAddress},${stakeEvents[68].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId},${stakeEvents[69].signerAddress},${stakeEvents[69].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[78].poolIndex].poolId},${stakeEvents[78].signerAddress},${stakeEvents[78].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[79].poolIndex].poolId},${stakeEvents[79].signerAddress},${stakeEvents[79].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId},${stakeEvents[102].signerAddress},${stakeEvents[102].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId},${stakeEvents[103].signerAddress},${stakeEvents[103].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId},${stakeEvents[120].signerAddress},${stakeEvents[120].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId},${stakeEvents[121].signerAddress},${stakeEvents[121].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId},${stakeEvents[126].signerAddress},${stakeEvents[126].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId},${stakeEvents[127].signerAddress},${stakeEvents[127].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId},${stakeEvents[133].signerAddress},${stakeEvents[133].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId},${stakeEvents[134].signerAddress},${stakeEvents[134].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[172].poolIndex].poolId},${stakeEvents[172].signerAddress},${stakeEvents[172].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[174].poolIndex].poolId},${stakeEvents[174].signerAddress},${stakeEvents[174].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[176].poolIndex].poolId},${stakeEvents[176].signerAddress},${stakeEvents[176].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[198].poolIndex].poolId},${stakeEvents[198].signerAddress},${stakeEvents[198].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[200].poolIndex].poolId},${stakeEvents[200].signerAddress},${stakeEvents[200].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[201].poolIndex].poolId},${stakeEvents[201].signerAddress},${stakeEvents[201].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[202].poolIndex].poolId},${stakeEvents[202].signerAddress},${stakeEvents[202].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId},${stakeEvents[203].signerAddress},${stakeEvents[203].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId},${stakeEvents[204].signerAddress},${stakeEvents[204].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId},${stakeEvents[206].signerAddress},${stakeEvents[206].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[207].poolIndex].poolId},${stakeEvents[207].signerAddress},${stakeEvents[207].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[208].poolIndex].poolId},${stakeEvents[208].signerAddress},${stakeEvents[208].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[211].poolIndex].poolId},${stakeEvents[211].signerAddress},${stakeEvents[211].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[212].poolIndex].poolId},${stakeEvents[212].signerAddress},${stakeEvents[212].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[214].poolIndex].poolId},${stakeEvents[214].signerAddress},${stakeEvents[214].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[217].poolIndex].poolId},${stakeEvents[217].signerAddress},${stakeEvents[217].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[220].poolIndex].poolId},${stakeEvents[220].signerAddress},${stakeEvents[220].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[223].poolIndex].poolId},${stakeEvents[223].signerAddress},${stakeEvents[223].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[231].poolIndex].poolId},${stakeEvents[231].signerAddress},${stakeEvents[231].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[240].poolIndex].poolId},${stakeEvents[240].signerAddress},${stakeEvents[240].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[243].poolIndex].poolId},${stakeEvents[243].signerAddress},${stakeEvents[243].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos000.set(
        `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[245].poolIndex].poolId},${stakeEvents[245].signerAddress},${stakeEvents[245].stakeId}`,
        structuredClone(stakeServiceHelpers.initialStakeInfo),
      );
      stakeInfos.push(stakeInfos000);

      const stakingPoolStats = [];
      const stakingPoolStats000 = new Map();
      const firstStakeEvents = [4, 2, 3];

      for (let i = 0; i < firstStakeEvents.length; i++) {
        const stakingPoolStatInitial = structuredClone(
          stakeServiceHelpers.initialStakingPoolStat,
        );
        if (
          stakingPoolStakeRewardTokenSameConfigs[
            stakeEvents[firstStakeEvents[i]].poolIndex
          ].poolAprWei.eq(hre.ethers.constants.Zero)
        ) {
          stakingPoolStatInitial.poolSizeWei = stakeServiceHelpers
            .computePoolSizeWei(
              stakingPoolStakeRewardTokenSameConfigs[
                stakeEvents[firstStakeEvents[i]].poolIndex
              ].stakeDurationDays,
              stakingPoolStakeRewardTokenSameConfigs[
                stakeEvents[firstStakeEvents[i]].poolIndex
              ].poolAprWei,
              hre.ethers.constants.Zero,
              stakingPoolStakeRewardTokenSameConfigs[
                stakeEvents[firstStakeEvents[i]].poolIndex
              ].stakeTokenDecimals,
            )
            .toString();
        }

        stakingPoolStats000.set(
          `${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[firstStakeEvents[i]].poolIndex].poolId}`,
          stakingPoolStatInitial,
        );
      }

      stakingPoolStats.push(stakingPoolStats000);

      const {
        nextExpectStakeInfos: stakeInfos001,
        nextExpectStakingPoolStats: stakingPoolStats001,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[0],
        stakeEvents[0],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos000,
        stakingPoolStats000,
      );
      stakeInfos.push(stakeInfos001);
      stakingPoolStats.push(stakingPoolStats001);
      console.log(
        `stakingPoolStatsAfterEvent000 after: ${JSON.stringify(stakingPoolStats[1].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[0].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos002,
        nextExpectStakingPoolStats: stakingPoolStats002,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[1],
        stakeEvents[1],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos001,
        stakingPoolStats001,
      );
      stakeInfos.push(stakeInfos002);
      stakingPoolStats.push(stakingPoolStats002);
      console.log(
        `stakingPoolStatsAfterEvent001 after: ${JSON.stringify(stakingPoolStats[2].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[1].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos003,
        nextExpectStakingPoolStats: stakingPoolStats003,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[2],
        stakeEvents[2],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos002,
        stakingPoolStats002,
      );
      stakeInfos.push(stakeInfos003);
      console.log(
        `\nstakeInfoAfterEvent002 after: ${JSON.stringify(stakeInfos[3].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats003);
      console.log(
        `stakingPoolStatsAfterEvent002 after: ${JSON.stringify(stakingPoolStats[3].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos004,
        nextExpectStakingPoolStats: stakingPoolStats004,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[3],
        stakeEvents[3],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos003,
        stakingPoolStats003,
      );
      stakeInfos.push(stakeInfos004);
      console.log(
        `\nstakeInfoAfterEvent003 after: ${JSON.stringify(stakeInfos[4].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats004);
      console.log(
        `stakingPoolStatsAfterEvent003 after: ${JSON.stringify(stakingPoolStats[4].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos005,
        nextExpectStakingPoolStats: stakingPoolStats005,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[4],
        stakeEvents[4],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos004,
        stakingPoolStats004,
      );
      stakeInfos.push(stakeInfos005);
      console.log(
        `\nstakeInfoAfterEvent004 after: ${JSON.stringify(stakeInfos[5].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats005);
      console.log(
        `stakingPoolStatsAfterEvent004 after: ${JSON.stringify(stakingPoolStats[5].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos006,
        nextExpectStakingPoolStats: stakingPoolStats006,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[5],
        stakeEvents[5],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos005,
        stakingPoolStats005,
      );
      stakeInfos.push(stakeInfos006);
      console.log(
        `\nstakeInfoAfterEvent005 after: ${JSON.stringify(stakeInfos[6].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId},${stakeEvents[5].signerAddress},${stakeEvents[5].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats006);
      console.log(
        `stakingPoolStatsAfterEvent005 after: ${JSON.stringify(stakingPoolStats[6].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos007,
        nextExpectStakingPoolStats: stakingPoolStats007,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[6],
        stakeEvents[6],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos006,
        stakingPoolStats006,
      );
      stakeInfos.push(stakeInfos007);
      console.log(
        `\nstakeInfoAfterEvent006 after: ${JSON.stringify(stakeInfos[7].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[6].poolIndex].poolId},${stakeEvents[6].signerAddress},${stakeEvents[6].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats007);
      console.log(
        `stakingPoolStatsAfterEvent006 after: ${JSON.stringify(stakingPoolStats[7].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[6].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos008,
        nextExpectStakingPoolStats: stakingPoolStats008,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[7],
        stakeEvents[4],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos007,
        stakingPoolStats007,
      );
      stakeInfos.push(stakeInfos008);
      console.log(
        `\nstakeInfoAfterEvent007 after: ${JSON.stringify(stakeInfos[8].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats008);
      console.log(
        `stakingPoolStatsAfterEvent007 after: ${JSON.stringify(stakingPoolStats[8].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos009,
        nextExpectStakingPoolStats: stakingPoolStats009,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[8],
        stakeEvents[4],
        stakeEvents[7],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos008,
        stakingPoolStats008,
      );
      stakeInfos.push(stakeInfos009);
      console.log(
        `\nstakeInfoAfterEvent008 after: ${JSON.stringify(stakeInfos[9].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats009);
      console.log(
        `stakingPoolStatsAfterEvent008 after: ${JSON.stringify(stakingPoolStats[9].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos010,
        nextExpectStakingPoolStats: stakingPoolStats010,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[9],
        stakeEvents[9],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos009,
        stakingPoolStats009,
      );
      stakeInfos.push(stakeInfos010);
      console.log(
        `\nstakeInfoAfterEvent009 after: ${JSON.stringify(stakeInfos[10].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats010);
      console.log(
        `stakingPoolStatsAfterEvent009 after: ${JSON.stringify(stakingPoolStats[10].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos011,
        nextExpectStakingPoolStats: stakingPoolStats011,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[10],
        stakeEvents[10],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos010,
        stakingPoolStats010,
      );
      stakeInfos.push(stakeInfos011);
      console.log(
        `\nstakeInfoAfterEvent010 after: ${JSON.stringify(stakeInfos[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats011);
      console.log(
        `stakingPoolStatsAfterEvent010 after: ${JSON.stringify(stakingPoolStats[11].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos012,
        nextExpectStakingPoolStats: stakingPoolStats012,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[11],
        stakeEvents[11],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos011,
        stakingPoolStats011,
      );
      stakeInfos.push(stakeInfos012);
      console.log(
        `\nstakeInfoAfterEvent011 after: ${JSON.stringify(stakeInfos[12].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId},${stakeEvents[11].signerAddress},${stakeEvents[11].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats012);
      console.log(
        `stakingPoolStatsAfterEvent011 after: ${JSON.stringify(stakingPoolStats[12].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos013,
        nextExpectStakingPoolStats: stakingPoolStats013,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[12],
        stakeEvents[12],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos012,
        stakingPoolStats012,
      );
      stakeInfos.push(stakeInfos013);
      console.log(
        `\nstakeInfoAfterEvent012 after: ${JSON.stringify(stakeInfos[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId},${stakeEvents[12].signerAddress},${stakeEvents[12].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats013);
      console.log(
        `stakingPoolStatsAfterEvent012 after: ${JSON.stringify(stakingPoolStats[13].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[12].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos014,
        nextExpectStakingPoolStats: stakingPoolStats014,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[13],
        stakeEvents[3],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos013,
        stakingPoolStats013,
      );
      stakeInfos.push(stakeInfos014);
      console.log(
        `\nstakeInfoAfterEvent013 after: ${JSON.stringify(stakeInfos[14].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats014);
      console.log(
        `stakingPoolStatsAfterEvent013 after: ${JSON.stringify(stakingPoolStats[14].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos015,
        nextExpectStakingPoolStats: stakingPoolStats015,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[14],
        stakeEvents[14],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos014,
        stakingPoolStats014,
      );
      stakeInfos.push(stakeInfos015);
      console.log(
        `\nstakeInfoAfterEvent014 after: ${JSON.stringify(stakeInfos[15].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats015);
      console.log(
        `stakingPoolStatsAfterEvent014 after: ${JSON.stringify(stakingPoolStats[15].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos016,
        nextExpectStakingPoolStats: stakingPoolStats016,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[15],
        stakeEvents[9],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos015,
        stakingPoolStats015,
      );
      stakeInfos.push(stakeInfos016);
      console.log(
        `\nstakeInfoAfterEvent015 after: ${JSON.stringify(stakeInfos[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId},${stakeEvents[9].signerAddress},${stakeEvents[9].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats016);
      console.log(
        `stakingPoolStatsAfterEvent015 after: ${JSON.stringify(stakingPoolStats[16].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[9].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos017,
        nextExpectStakingPoolStats: stakingPoolStats017,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[16],
        stakeEvents[16],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos016,
        stakingPoolStats016,
      );
      stakeInfos.push(stakeInfos017);
      console.log(
        `\nstakeInfoAfterEvent016 after: ${JSON.stringify(stakeInfos[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats017);
      console.log(
        `stakingPoolStatsAfterEvent016 after: ${JSON.stringify(stakingPoolStats[17].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos018,
        nextExpectStakingPoolStats: stakingPoolStats018,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[17],
        stakeEvents[6],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos017,
        stakingPoolStats017,
      );
      stakeInfos.push(stakeInfos018);
      console.log(
        `\nstakeInfoAfterEvent017 after: ${JSON.stringify(stakeInfos[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[6].poolIndex].poolId},${stakeEvents[6].signerAddress},${stakeEvents[6].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats018);
      console.log(
        `stakingPoolStatsAfterEvent017 after: ${JSON.stringify(stakingPoolStats[18].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[6].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos019,
        nextExpectStakingPoolStats: stakingPoolStats019,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[18],
        stakeEvents[18],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos018,
        stakingPoolStats018,
      );
      stakeInfos.push(stakeInfos019);
      console.log(
        `\nstakeInfoAfterEvent018 after: ${JSON.stringify(stakeInfos[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId},${stakeEvents[18].signerAddress},${stakeEvents[18].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats019);
      console.log(
        `stakingPoolStatsAfterEvent018 after: ${JSON.stringify(stakingPoolStats[19].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos020,
        nextExpectStakingPoolStats: stakingPoolStats020,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[19],
        stakeEvents[14],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos019,
        stakingPoolStats019,
      );
      stakeInfos.push(stakeInfos020);
      console.log(
        `\nstakeInfoAfterEvent019 after: ${JSON.stringify(stakeInfos[20].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats020);
      console.log(
        `stakingPoolStatsAfterEvent019 after: ${JSON.stringify(stakingPoolStats[20].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos021,
        nextExpectStakingPoolStats: stakingPoolStats021,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[20],
        stakeEvents[16],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos020,
        stakingPoolStats020,
      );
      stakeInfos.push(stakeInfos021);
      console.log(
        `\nstakeInfoAfterEvent020 after: ${JSON.stringify(stakeInfos[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats021);
      console.log(
        `stakingPoolStatsAfterEvent020 after: ${JSON.stringify(stakingPoolStats[21].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos022,
        nextExpectStakingPoolStats: stakingPoolStats022,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[21],
        stakeEvents[16],
        stakeEvents[20],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos021,
        stakingPoolStats021,
      );
      stakeInfos.push(stakeInfos022);
      console.log(
        `\nstakeInfoAfterEvent021 after: ${JSON.stringify(stakeInfos[22].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId},${stakeEvents[16].signerAddress},${stakeEvents[16].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats022);
      console.log(
        `stakingPoolStatsAfterEvent021 after: ${JSON.stringify(stakingPoolStats[22].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[16].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos023,
        nextExpectStakingPoolStats: stakingPoolStats023,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[22],
        stakeEvents[22],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos022,
        stakingPoolStats022,
      );
      stakeInfos.push(stakeInfos023);
      console.log(
        `\nstakeInfoAfterEvent022 after: ${JSON.stringify(stakeInfos[23].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId},${stakeEvents[22].signerAddress},${stakeEvents[22].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats023);
      console.log(
        `stakingPoolStatsAfterEvent022 after: ${JSON.stringify(stakingPoolStats[23].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos024,
        nextExpectStakingPoolStats: stakingPoolStats024,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[23],
        stakeEvents[5],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos023,
        stakingPoolStats023,
      );
      stakeInfos.push(stakeInfos024);
      console.log(
        `\nstakeInfoAfterEvent023 after: ${JSON.stringify(stakeInfos[24].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId},${stakeEvents[5].signerAddress},${stakeEvents[5].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats024);
      console.log(
        `stakingPoolStatsAfterEvent023 after: ${JSON.stringify(stakingPoolStats[24].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos025,
        nextExpectStakingPoolStats: stakingPoolStats025,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[24],
        stakeEvents[22],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos024,
        stakingPoolStats024,
      );
      stakeInfos.push(stakeInfos025);
      console.log(
        `\nstakeInfoAfterEvent024 after: ${JSON.stringify(stakeInfos[25].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId},${stakeEvents[22].signerAddress},${stakeEvents[22].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats025);
      console.log(
        `stakingPoolStatsAfterEvent024 after: ${JSON.stringify(stakingPoolStats[25].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos026,
        nextExpectStakingPoolStats: stakingPoolStats026,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[25],
        stakeEvents[25],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos025,
        stakingPoolStats025,
      );
      stakeInfos.push(stakeInfos026);
      console.log(
        `\nstakeInfoAfterEvent025 after: ${JSON.stringify(stakeInfos[26].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats026);
      console.log(
        `stakingPoolStatsAfterEvent025 after: ${JSON.stringify(stakingPoolStats[26].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos027,
        nextExpectStakingPoolStats: stakingPoolStats027,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[26],
        stakeEvents[26],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos026,
        stakingPoolStats026,
      );
      stakeInfos.push(stakeInfos027);
      console.log(
        `\nstakeInfoAfterEvent026 after: ${JSON.stringify(stakeInfos[27].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId},${stakeEvents[26].signerAddress},${stakeEvents[26].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats027);
      console.log(
        `stakingPoolStatsAfterEvent026 after: ${JSON.stringify(stakingPoolStats[27].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos028,
        nextExpectStakingPoolStats: stakingPoolStats028,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[27],
        stakeEvents[2],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos027,
        stakingPoolStats027,
      );
      stakeInfos.push(stakeInfos028);
      console.log(
        `\nstakeInfoAfterEvent027 after: ${JSON.stringify(stakeInfos[28].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats028);
      console.log(
        `stakingPoolStatsAfterEvent027 after: ${JSON.stringify(stakingPoolStats[28].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos029,
        nextExpectStakingPoolStats: stakingPoolStats029,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[28],
        stakeEvents[3],
        stakeEvents[13],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos028,
        stakingPoolStats028,
      );
      stakeInfos.push(stakeInfos029);
      console.log(
        `\nstakeInfoAfterEvent028 after: ${JSON.stringify(stakeInfos[29].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats029);
      console.log(
        `stakingPoolStatsAfterEvent028 after: ${JSON.stringify(stakingPoolStats[29].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos030,
        nextExpectStakingPoolStats: stakingPoolStats030,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[29],
        stakeEvents[14],
        stakeEvents[19],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos029,
        stakingPoolStats029,
      );
      stakeInfos.push(stakeInfos030);
      console.log(
        `\nstakeInfoAfterEvent029 after: ${JSON.stringify(stakeInfos[30].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats030);
      console.log(
        `stakingPoolStatsAfterEvent029 after: ${JSON.stringify(stakingPoolStats[30].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos031,
        nextExpectStakingPoolStats: stakingPoolStats031,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[30],
        stakeEvents[11],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos030,
        stakingPoolStats030,
      );
      stakeInfos.push(stakeInfos031);
      console.log(
        `\nstakeInfoAfterEvent030 after: ${JSON.stringify(stakeInfos[31].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId},${stakeEvents[11].signerAddress},${stakeEvents[11].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats031);
      console.log(
        `stakingPoolStatsAfterEvent030 after: ${JSON.stringify(stakingPoolStats[31].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos032,
        nextExpectStakingPoolStats: stakingPoolStats032,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[31],
        stakeEvents[22],
        stakeEvents[24],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos031,
        stakingPoolStats031,
      );
      stakeInfos.push(stakeInfos032);
      console.log(
        `\nstakeInfoAfterEvent031 after: ${JSON.stringify(stakeInfos[32].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId},${stakeEvents[22].signerAddress},${stakeEvents[22].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats032);
      console.log(
        `stakingPoolStatsAfterEvent031 after: ${JSON.stringify(stakingPoolStats[32].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[22].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos033,
        nextExpectStakingPoolStats: stakingPoolStats033,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[32],
        stakeEvents[14],
        stakeEvents[19],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos032,
        stakingPoolStats032,
      );
      stakeInfos.push(stakeInfos033);
      console.log(
        `\nstakeInfoAfterEvent032 after: ${JSON.stringify(stakeInfos[33].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId},${stakeEvents[14].signerAddress},${stakeEvents[14].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats033);
      console.log(
        `stakingPoolStatsAfterEvent032 after: ${JSON.stringify(stakingPoolStats[33].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[14].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos034,
        nextExpectStakingPoolStats: stakingPoolStats034,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[33],
        stakeEvents[33],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos033,
        stakingPoolStats033,
      );
      stakeInfos.push(stakeInfos034);
      console.log(
        `\nstakeInfoAfterEvent033 after: ${JSON.stringify(stakeInfos[34].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats034);
      console.log(
        `stakingPoolStatsAfterEvent033 after: ${JSON.stringify(stakingPoolStats[34].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos035,
        nextExpectStakingPoolStats: stakingPoolStats035,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[34],
        stakeEvents[25],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos034,
        stakingPoolStats034,
      );
      stakeInfos.push(stakeInfos035);
      console.log(
        `\nstakeInfoAfterEvent034 after: ${JSON.stringify(stakeInfos[35].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats035);
      console.log(
        `stakingPoolStatsAfterEvent034 after: ${JSON.stringify(stakingPoolStats[35].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos036,
        nextExpectStakingPoolStats: stakingPoolStats036,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[35],
        stakeEvents[35],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos035,
        stakingPoolStats035,
      );
      stakeInfos.push(stakeInfos036);
      console.log(
        `\nstakeInfoAfterEvent035 after: ${JSON.stringify(stakeInfos[36].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[35].poolIndex].poolId},${stakeEvents[35].signerAddress},${stakeEvents[35].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats036);
      console.log(
        `stakingPoolStatsAfterEvent035 after: ${JSON.stringify(stakingPoolStats[36].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[35].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos037,
        nextExpectStakingPoolStats: stakingPoolStats037,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[36],
        stakeEvents[33],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos036,
        stakingPoolStats036,
      );
      stakeInfos.push(stakeInfos037);
      console.log(
        `\nstakeInfoAfterEvent036 after: ${JSON.stringify(stakeInfos[37].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats037);
      console.log(
        `stakingPoolStatsAfterEvent036 after: ${JSON.stringify(stakingPoolStats[37].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos038,
        nextExpectStakingPoolStats: stakingPoolStats038,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[37],
        stakeEvents[11],
        stakeEvents[30],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos037,
        stakingPoolStats037,
      );
      stakeInfos.push(stakeInfos038);
      console.log(
        `\nstakeInfoAfterEvent037 after: ${JSON.stringify(stakeInfos[38].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId},${stakeEvents[11].signerAddress},${stakeEvents[11].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats038);
      console.log(
        `stakingPoolStatsAfterEvent037 after: ${JSON.stringify(stakingPoolStats[38].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos039,
        nextExpectStakingPoolStats: stakingPoolStats039,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[38],
        stakeEvents[38],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos038,
        stakingPoolStats038,
      );
      stakeInfos.push(stakeInfos039);
      console.log(
        `\nstakeInfoAfterEvent038 after: ${JSON.stringify(stakeInfos[39].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats039);
      console.log(
        `stakingPoolStatsAfterEvent038 after: ${JSON.stringify(stakingPoolStats[39].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos040,
        nextExpectStakingPoolStats: stakingPoolStats040,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[39],
        stakeEvents[26],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos039,
        stakingPoolStats039,
      );
      stakeInfos.push(stakeInfos040);
      console.log(
        `\nstakeInfoAfterEvent039 after: ${JSON.stringify(stakeInfos[40].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId},${stakeEvents[26].signerAddress},${stakeEvents[26].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats040);
      console.log(
        `stakingPoolStatsAfterEvent039 after: ${JSON.stringify(stakingPoolStats[40].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos041,
        nextExpectStakingPoolStats: stakingPoolStats041,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[40],
        stakeEvents[40],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos040,
        stakingPoolStats040,
      );
      stakeInfos.push(stakeInfos041);
      console.log(
        `\nstakeInfoAfterEvent040 after: ${JSON.stringify(stakeInfos[41].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId},${stakeEvents[40].signerAddress},${stakeEvents[40].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats041);
      console.log(
        `stakingPoolStatsAfterEvent040 after: ${JSON.stringify(stakingPoolStats[41].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos042,
        nextExpectStakingPoolStats: stakingPoolStats042,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[41],
        stakeEvents[33],
        stakeEvents[36],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos041,
        stakingPoolStats041,
      );
      stakeInfos.push(stakeInfos042);
      console.log(
        `\nstakeInfoAfterEvent041 after: ${JSON.stringify(stakeInfos[42].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats042);
      console.log(
        `stakingPoolStatsAfterEvent041 after: ${JSON.stringify(stakingPoolStats[42].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos043,
        nextExpectStakingPoolStats: stakingPoolStats043,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[42],
        stakeEvents[26],
        stakeEvents[39],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos042,
        stakingPoolStats042,
      );
      stakeInfos.push(stakeInfos043);
      console.log(
        `\nstakeInfoAfterEvent042 after: ${JSON.stringify(stakeInfos[43].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId},${stakeEvents[26].signerAddress},${stakeEvents[26].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats043);
      console.log(
        `stakingPoolStatsAfterEvent042 after: ${JSON.stringify(stakingPoolStats[43].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos044,
        nextExpectStakingPoolStats: stakingPoolStats044,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[43],
        stakeEvents[11],
        stakeEvents[30],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos043,
        stakingPoolStats043,
      );
      stakeInfos.push(stakeInfos044);
      console.log(
        `\nstakeInfoAfterEvent043 after: ${JSON.stringify(stakeInfos[44].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId},${stakeEvents[11].signerAddress},${stakeEvents[11].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats044);
      console.log(
        `stakingPoolStatsAfterEvent043 after: ${JSON.stringify(stakingPoolStats[44].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[11].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos045,
        nextExpectStakingPoolStats: stakingPoolStats045,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[44],
        stakeEvents[33],
        stakeEvents[36],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos044,
        stakingPoolStats044,
      );
      stakeInfos.push(stakeInfos045);
      console.log(
        `\nstakeInfoAfterEvent044 after: ${JSON.stringify(stakeInfos[45].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId},${stakeEvents[33].signerAddress},${stakeEvents[33].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats045);
      console.log(
        `stakingPoolStatsAfterEvent044 after: ${JSON.stringify(stakingPoolStats[45].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[33].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos046,
        nextExpectStakingPoolStats: stakingPoolStats046,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[45],
        stakeEvents[45],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos045,
        stakingPoolStats045,
      );
      stakeInfos.push(stakeInfos046);
      console.log(
        `\nstakeInfoAfterEvent045 after: ${JSON.stringify(stakeInfos[46].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId},${stakeEvents[45].signerAddress},${stakeEvents[45].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats046);
      console.log(
        `stakingPoolStatsAfterEvent045 after: ${JSON.stringify(stakingPoolStats[46].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos047,
        nextExpectStakingPoolStats: stakingPoolStats047,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[46],
        stakeEvents[46],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos046,
        stakingPoolStats046,
      );
      stakeInfos.push(stakeInfos047);
      console.log(
        `\nstakeInfoAfterEvent046 after: ${JSON.stringify(stakeInfos[47].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId},${stakeEvents[46].signerAddress},${stakeEvents[46].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats047);
      console.log(
        `stakingPoolStatsAfterEvent046 after: ${JSON.stringify(stakingPoolStats[47].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos048,
        nextExpectStakingPoolStats: stakingPoolStats048,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[47],
        stakeEvents[40],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos047,
        stakingPoolStats047,
      );
      stakeInfos.push(stakeInfos048);
      console.log(
        `\nstakeInfoAfterEvent047 after: ${JSON.stringify(stakeInfos[48].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId},${stakeEvents[40].signerAddress},${stakeEvents[40].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats048);
      console.log(
        `stakingPoolStatsAfterEvent047 after: ${JSON.stringify(stakingPoolStats[48].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos049,
        nextExpectStakingPoolStats: stakingPoolStats049,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[48],
        stakeEvents[35],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos048,
        stakingPoolStats048,
      );
      stakeInfos.push(stakeInfos049);
      console.log(
        `\nstakeInfoAfterEvent048 after: ${JSON.stringify(stakeInfos[49].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[35].poolIndex].poolId},${stakeEvents[35].signerAddress},${stakeEvents[35].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats049);
      console.log(
        `stakingPoolStatsAfterEvent048 after: ${JSON.stringify(stakingPoolStats[49].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[35].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos050,
        nextExpectStakingPoolStats: stakingPoolStats050,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[49],
        stakeEvents[40],
        stakeEvents[47],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos049,
        stakingPoolStats049,
      );
      stakeInfos.push(stakeInfos050);
      console.log(
        `\nstakeInfoAfterEvent049 after: ${JSON.stringify(stakeInfos[50].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId},${stakeEvents[40].signerAddress},${stakeEvents[40].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats050);
      console.log(
        `stakingPoolStatsAfterEvent049 after: ${JSON.stringify(stakingPoolStats[50].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[40].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos051,
        nextExpectStakingPoolStats: stakingPoolStats051,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[50],
        stakeEvents[50],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos050,
        stakingPoolStats050,
      );
      stakeInfos.push(stakeInfos051);
      console.log(
        `\nstakeInfoAfterEvent050 after: ${JSON.stringify(stakeInfos[51].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats051);
      console.log(
        `stakingPoolStatsAfterEvent050 after: ${JSON.stringify(stakingPoolStats[51].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos052,
        nextExpectStakingPoolStats: stakingPoolStats052,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[51],
        stakeEvents[18],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos051,
        stakingPoolStats051,
      );
      stakeInfos.push(stakeInfos052);
      console.log(
        `\nstakeInfoAfterEvent051 after: ${JSON.stringify(stakeInfos[52].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId},${stakeEvents[18].signerAddress},${stakeEvents[18].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats052);
      console.log(
        `stakingPoolStatsAfterEvent051 after: ${JSON.stringify(stakingPoolStats[52].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos053,
        nextExpectStakingPoolStats: stakingPoolStats053,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[52],
        stakeEvents[52],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos052,
        stakingPoolStats052,
      );
      stakeInfos.push(stakeInfos053);
      console.log(
        `\nstakeInfoAfterEvent052 after: ${JSON.stringify(stakeInfos[53].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats053);
      console.log(
        `stakingPoolStatsAfterEvent052 after: ${JSON.stringify(stakingPoolStats[53].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos054,
        nextExpectStakingPoolStats: stakingPoolStats054,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[53],
        stakeEvents[10],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos053,
        stakingPoolStats053,
      );
      stakeInfos.push(stakeInfos054);
      console.log(
        `\nstakeInfoAfterEvent053 after: ${JSON.stringify(stakeInfos[54].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats054);
      console.log(
        `stakingPoolStatsAfterEvent053 after: ${JSON.stringify(stakingPoolStats[54].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos055,
        nextExpectStakingPoolStats: stakingPoolStats055,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[54],
        stakeEvents[54],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos054,
        stakingPoolStats054,
      );
      stakeInfos.push(stakeInfos055);
      console.log(
        `\nstakeInfoAfterEvent054 after: ${JSON.stringify(stakeInfos[55].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats055);
      console.log(
        `stakingPoolStatsAfterEvent054 after: ${JSON.stringify(stakingPoolStats[55].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos056,
        nextExpectStakingPoolStats: stakingPoolStats056,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[55],
        stakeEvents[55],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos055,
        stakingPoolStats055,
      );
      stakeInfos.push(stakeInfos056);
      console.log(
        `\nstakeInfoAfterEvent055 after: ${JSON.stringify(stakeInfos[56].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats056);
      console.log(
        `stakingPoolStatsAfterEvent055 after: ${JSON.stringify(stakingPoolStats[56].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos057,
        nextExpectStakingPoolStats: stakingPoolStats057,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[56],
        stakeEvents[56],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos056,
        stakingPoolStats056,
      );
      stakeInfos.push(stakeInfos057);
      console.log(
        `\nstakeInfoAfterEvent056 after: ${JSON.stringify(stakeInfos[57].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats057);
      console.log(
        `stakingPoolStatsAfterEvent056 after: ${JSON.stringify(stakingPoolStats[57].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos058,
        nextExpectStakingPoolStats: stakingPoolStats058,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[57],
        stakeEvents[57],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos057,
        stakingPoolStats057,
      );
      stakeInfos.push(stakeInfos058);
      console.log(
        `\nstakeInfoAfterEvent057 after: ${JSON.stringify(stakeInfos[58].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats058);
      console.log(
        `stakingPoolStatsAfterEvent057 after: ${JSON.stringify(stakingPoolStats[58].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos059,
        nextExpectStakingPoolStats: stakingPoolStats059,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[58],
        stakeEvents[58],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos058,
        stakingPoolStats058,
      );
      stakeInfos.push(stakeInfos059);
      console.log(
        `\nstakeInfoAfterEvent058 after: ${JSON.stringify(stakeInfos[59].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId},${stakeEvents[58].signerAddress},${stakeEvents[58].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats059);
      console.log(
        `stakingPoolStatsAfterEvent058 after: ${JSON.stringify(stakingPoolStats[59].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos060,
        nextExpectStakingPoolStats: stakingPoolStats060,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[59],
        stakeEvents[59],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos059,
        stakingPoolStats059,
      );
      stakeInfos.push(stakeInfos060);
      console.log(
        `\nstakeInfoAfterEvent059 after: ${JSON.stringify(stakeInfos[60].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId},${stakeEvents[59].signerAddress},${stakeEvents[59].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats060);
      console.log(
        `stakingPoolStatsAfterEvent059 after: ${JSON.stringify(stakingPoolStats[60].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos061,
        nextExpectStakingPoolStats: stakingPoolStats061,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[60],
        stakeEvents[46],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos060,
        stakingPoolStats060,
      );
      stakeInfos.push(stakeInfos061);
      console.log(
        `\nstakeInfoAfterEvent060 after: ${JSON.stringify(stakeInfos[61].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId},${stakeEvents[46].signerAddress},${stakeEvents[46].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats061);
      console.log(
        `stakingPoolStatsAfterEvent060 after: ${JSON.stringify(stakingPoolStats[61].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos062,
        nextExpectStakingPoolStats: stakingPoolStats062,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[61],
        stakeEvents[50],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos061,
        stakingPoolStats061,
      );
      stakeInfos.push(stakeInfos062);
      console.log(
        `\nstakeInfoAfterEvent061 after: ${JSON.stringify(stakeInfos[62].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats062);
      console.log(
        `stakingPoolStatsAfterEvent061 after: ${JSON.stringify(stakingPoolStats[62].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos063,
        nextExpectStakingPoolStats: stakingPoolStats063,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[62],
        stakeEvents[45],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos062,
        stakingPoolStats062,
      );
      stakeInfos.push(stakeInfos063);
      console.log(
        `\nstakeInfoAfterEvent062 after: ${JSON.stringify(stakeInfos[63].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId},${stakeEvents[45].signerAddress},${stakeEvents[45].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats063);
      console.log(
        `stakingPoolStatsAfterEvent062 after: ${JSON.stringify(stakingPoolStats[63].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos064,
        nextExpectStakingPoolStats: stakingPoolStats064,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[63],
        stakeEvents[18],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos063,
        stakingPoolStats063,
      );
      stakeInfos.push(stakeInfos064);
      console.log(
        `\nstakeInfoAfterEvent063 after: ${JSON.stringify(stakeInfos[64].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId},${stakeEvents[18].signerAddress},${stakeEvents[18].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats064);
      console.log(
        `stakingPoolStatsAfterEvent063 after: ${JSON.stringify(stakingPoolStats[64].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos065,
        nextExpectStakingPoolStats: stakingPoolStats065,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[64],
        stakeEvents[64],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos064,
        stakingPoolStats064,
      );
      stakeInfos.push(stakeInfos065);
      console.log(
        `\nstakeInfoAfterEvent064 after: ${JSON.stringify(stakeInfos[65].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId},${stakeEvents[64].signerAddress},${stakeEvents[64].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats065);
      console.log(
        `stakingPoolStatsAfterEvent064 after: ${JSON.stringify(stakingPoolStats[65].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos066,
        nextExpectStakingPoolStats: stakingPoolStats066,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[65],
        stakeEvents[65],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos065,
        stakingPoolStats065,
      );
      stakeInfos.push(stakeInfos066);
      console.log(
        `\nstakeInfoAfterEvent065 after: ${JSON.stringify(stakeInfos[66].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId},${stakeEvents[65].signerAddress},${stakeEvents[65].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats066);
      console.log(
        `stakingPoolStatsAfterEvent065 after: ${JSON.stringify(stakingPoolStats[66].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos067,
        nextExpectStakingPoolStats: stakingPoolStats067,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[66],
        stakeEvents[52],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos066,
        stakingPoolStats066,
      );
      stakeInfos.push(stakeInfos067);
      console.log(
        `\nstakeInfoAfterEvent066 after: ${JSON.stringify(stakeInfos[67].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats067);
      console.log(
        `stakingPoolStatsAfterEvent066 after: ${JSON.stringify(stakingPoolStats[67].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos068,
        nextExpectStakingPoolStats: stakingPoolStats068,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[67],
        stakeEvents[10],
        stakeEvents[53],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos067,
        stakingPoolStats067,
      );
      stakeInfos.push(stakeInfos068);
      console.log(
        `\nstakeInfoAfterEvent067 after: ${JSON.stringify(stakeInfos[68].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats068);
      console.log(
        `stakingPoolStatsAfterEvent067 after: ${JSON.stringify(stakingPoolStats[68].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos069,
        nextExpectStakingPoolStats: stakingPoolStats069,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[68],
        stakeEvents[68],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos068,
        stakingPoolStats068,
      );
      stakeInfos.push(stakeInfos069);
      console.log(
        `\nstakeInfoAfterEvent068 after: ${JSON.stringify(stakeInfos[69].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId},${stakeEvents[68].signerAddress},${stakeEvents[68].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats069);
      console.log(
        `stakingPoolStatsAfterEvent068 after: ${JSON.stringify(stakingPoolStats[69].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos070,
        nextExpectStakingPoolStats: stakingPoolStats070,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[69],
        stakeEvents[69],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos069,
        stakingPoolStats069,
      );
      stakeInfos.push(stakeInfos070);
      console.log(
        `\nstakeInfoAfterEvent069 after: ${JSON.stringify(stakeInfos[70].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId},${stakeEvents[69].signerAddress},${stakeEvents[69].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats070);
      console.log(
        `stakingPoolStatsAfterEvent069 after: ${JSON.stringify(stakingPoolStats[70].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos071,
        nextExpectStakingPoolStats: stakingPoolStats071,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[70],
        stakeEvents[55],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos070,
        stakingPoolStats070,
      );
      stakeInfos.push(stakeInfos071);
      console.log(
        `\nstakeInfoAfterEvent070 after: ${JSON.stringify(stakeInfos[71].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats071);
      console.log(
        `stakingPoolStatsAfterEvent070 after: ${JSON.stringify(stakingPoolStats[71].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos072,
        nextExpectStakingPoolStats: stakingPoolStats072,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[71],
        stakeEvents[56],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos071,
        stakingPoolStats071,
      );
      stakeInfos.push(stakeInfos072);
      console.log(
        `\nstakeInfoAfterEvent071 after: ${JSON.stringify(stakeInfos[72].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats072);
      console.log(
        `stakingPoolStatsAfterEvent071 after: ${JSON.stringify(stakingPoolStats[72].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos073,
        nextExpectStakingPoolStats: stakingPoolStats073,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[72],
        stakeEvents[45],
        stakeEvents[62],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos072,
        stakingPoolStats072,
      );
      stakeInfos.push(stakeInfos073);
      console.log(
        `\nstakeInfoAfterEvent072 after: ${JSON.stringify(stakeInfos[73].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId},${stakeEvents[45].signerAddress},${stakeEvents[45].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats073);
      console.log(
        `stakingPoolStatsAfterEvent072 after: ${JSON.stringify(stakingPoolStats[73].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos074,
        nextExpectStakingPoolStats: stakingPoolStats074,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[73],
        stakeEvents[46],
        stakeEvents[60],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos073,
        stakingPoolStats073,
      );
      stakeInfos.push(stakeInfos074);
      console.log(
        `\nstakeInfoAfterEvent073 after: ${JSON.stringify(stakeInfos[74].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId},${stakeEvents[46].signerAddress},${stakeEvents[46].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats074);
      console.log(
        `stakingPoolStatsAfterEvent073 after: ${JSON.stringify(stakingPoolStats[74].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos075,
        nextExpectStakingPoolStats: stakingPoolStats075,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[74],
        stakeEvents[74],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos074,
        stakingPoolStats074,
      );
      stakeInfos.push(stakeInfos075);
      console.log(
        `\nstakeInfoAfterEvent074 after: ${JSON.stringify(stakeInfos[75].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats075);
      console.log(
        `stakingPoolStatsAfterEvent074 after: ${JSON.stringify(stakingPoolStats[75].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos076,
        nextExpectStakingPoolStats: stakingPoolStats076,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[75],
        stakeEvents[75],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos075,
        stakingPoolStats075,
      );
      stakeInfos.push(stakeInfos076);
      console.log(
        `\nstakeInfoAfterEvent075 after: ${JSON.stringify(stakeInfos[76].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats076);
      console.log(
        `stakingPoolStatsAfterEvent075 after: ${JSON.stringify(stakingPoolStats[76].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos077,
        nextExpectStakingPoolStats: stakingPoolStats077,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[76],
        stakeEvents[76],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos076,
        stakingPoolStats076,
      );
      stakeInfos.push(stakeInfos077);
      console.log(
        `\nstakeInfoAfterEvent076 after: ${JSON.stringify(stakeInfos[77].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats077);
      console.log(
        `stakingPoolStatsAfterEvent076 after: ${JSON.stringify(stakingPoolStats[77].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos078,
        nextExpectStakingPoolStats: stakingPoolStats078,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[77],
        stakeEvents[77],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos077,
        stakingPoolStats077,
      );
      stakeInfos.push(stakeInfos078);
      console.log(
        `\nstakeInfoAfterEvent077 after: ${JSON.stringify(stakeInfos[78].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats078);
      console.log(
        `stakingPoolStatsAfterEvent077 after: ${JSON.stringify(stakingPoolStats[78].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos079,
        nextExpectStakingPoolStats: stakingPoolStats079,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[78],
        stakeEvents[78],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos078,
        stakingPoolStats078,
      );
      stakeInfos.push(stakeInfos079);
      console.log(
        `\nstakeInfoAfterEvent078 after: ${JSON.stringify(stakeInfos[79].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[78].poolIndex].poolId},${stakeEvents[78].signerAddress},${stakeEvents[78].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats079);
      console.log(
        `stakingPoolStatsAfterEvent078 after: ${JSON.stringify(stakingPoolStats[79].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[78].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos080,
        nextExpectStakingPoolStats: stakingPoolStats080,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[79],
        stakeEvents[79],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos079,
        stakingPoolStats079,
      );
      stakeInfos.push(stakeInfos080);
      console.log(
        `\nstakeInfoAfterEvent079 after: ${JSON.stringify(stakeInfos[80].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[79].poolIndex].poolId},${stakeEvents[79].signerAddress},${stakeEvents[79].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats080);
      console.log(
        `stakingPoolStatsAfterEvent079 after: ${JSON.stringify(stakingPoolStats[80].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[79].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos081,
        nextExpectStakingPoolStats: stakingPoolStats081,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[80],
        stakeEvents[59],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos080,
        stakingPoolStats080,
      );
      stakeInfos.push(stakeInfos081);
      console.log(
        `\nstakeInfoAfterEvent080 after: ${JSON.stringify(stakeInfos[81].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId},${stakeEvents[59].signerAddress},${stakeEvents[59].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats081);
      console.log(
        `stakingPoolStatsAfterEvent080 after: ${JSON.stringify(stakingPoolStats[81].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos082,
        nextExpectStakingPoolStats: stakingPoolStats082,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[81],
        stakeEvents[65],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos081,
        stakingPoolStats081,
      );
      stakeInfos.push(stakeInfos082);
      console.log(
        `\nstakeInfoAfterEvent081 after: ${JSON.stringify(stakeInfos[82].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId},${stakeEvents[65].signerAddress},${stakeEvents[65].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats082);
      console.log(
        `stakingPoolStatsAfterEvent081 after: ${JSON.stringify(stakingPoolStats[82].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos083,
        nextExpectStakingPoolStats: stakingPoolStats083,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[82],
        stakeEvents[58],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos082,
        stakingPoolStats082,
      );
      stakeInfos.push(stakeInfos083);
      console.log(
        `\nstakeInfoAfterEvent082 after: ${JSON.stringify(stakeInfos[83].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId},${stakeEvents[58].signerAddress},${stakeEvents[58].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats083);
      console.log(
        `stakingPoolStatsAfterEvent082 after: ${JSON.stringify(stakingPoolStats[83].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos084,
        nextExpectStakingPoolStats: stakingPoolStats084,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[83],
        stakeEvents[64],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos083,
        stakingPoolStats083,
      );
      stakeInfos.push(stakeInfos084);
      console.log(
        `\nstakeInfoAfterEvent083 after: ${JSON.stringify(stakeInfos[84].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId},${stakeEvents[64].signerAddress},${stakeEvents[64].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats084);
      console.log(
        `stakingPoolStatsAfterEvent083 after: ${JSON.stringify(stakingPoolStats[84].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos085,
        nextExpectStakingPoolStats: stakingPoolStats085,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[84],
        stakeEvents[45],
        stakeEvents[72],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos084,
        stakingPoolStats084,
      );
      stakeInfos.push(stakeInfos085);
      console.log(
        `\nstakeInfoAfterEvent084 after: ${JSON.stringify(stakeInfos[85].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId},${stakeEvents[45].signerAddress},${stakeEvents[45].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats085);
      console.log(
        `stakingPoolStatsAfterEvent084 after: ${JSON.stringify(stakingPoolStats[85].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos086,
        nextExpectStakingPoolStats: stakingPoolStats086,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[85],
        stakeEvents[52],
        stakeEvents[66],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos085,
        stakingPoolStats085,
      );
      stakeInfos.push(stakeInfos086);
      console.log(
        `\nstakeInfoAfterEvent085 after: ${JSON.stringify(stakeInfos[86].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats086);
      console.log(
        `stakingPoolStatsAfterEvent085 after: ${JSON.stringify(stakingPoolStats[86].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos087,
        nextExpectStakingPoolStats: stakingPoolStats087,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[86],
        stakeEvents[46],
        stakeEvents[60],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos086,
        stakingPoolStats086,
      );
      stakeInfos.push(stakeInfos087);
      console.log(
        `\nstakeInfoAfterEvent086 after: ${JSON.stringify(stakeInfos[87].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId},${stakeEvents[46].signerAddress},${stakeEvents[46].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats087);
      console.log(
        `stakingPoolStatsAfterEvent086 after: ${JSON.stringify(stakingPoolStats[87].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos088,
        nextExpectStakingPoolStats: stakingPoolStats088,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[87],
        stakeEvents[50],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos087,
        stakingPoolStats087,
      );
      stakeInfos.push(stakeInfos088);
      console.log(
        `\nstakeInfoAfterEvent087 after: ${JSON.stringify(stakeInfos[88].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats088);
      console.log(
        `stakingPoolStatsAfterEvent087 after: ${JSON.stringify(stakingPoolStats[88].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos089,
        nextExpectStakingPoolStats: stakingPoolStats089,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[88],
        stakeEvents[10],
        stakeEvents[53],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos088,
        stakingPoolStats088,
      );
      stakeInfos.push(stakeInfos089);
      console.log(
        `\nstakeInfoAfterEvent088 after: ${JSON.stringify(stakeInfos[89].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats089);
      console.log(
        `stakingPoolStatsAfterEvent088 after: ${JSON.stringify(stakingPoolStats[89].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos090,
        nextExpectStakingPoolStats: stakingPoolStats090,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[89],
        stakeEvents[59],
        stakeEvents[80],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos089,
        stakingPoolStats089,
      );
      stakeInfos.push(stakeInfos090);
      console.log(
        `\nstakeInfoAfterEvent089 after: ${JSON.stringify(stakeInfos[90].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId},${stakeEvents[59].signerAddress},${stakeEvents[59].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats090);
      console.log(
        `stakingPoolStatsAfterEvent089 after: ${JSON.stringify(stakingPoolStats[90].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos091,
        nextExpectStakingPoolStats: stakingPoolStats091,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[90],
        stakeEvents[50],
        stakeEvents[87],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos090,
        stakingPoolStats090,
      );
      stakeInfos.push(stakeInfos091);
      console.log(
        `\nstakeInfoAfterEvent090 after: ${JSON.stringify(stakeInfos[91].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats091);
      console.log(
        `stakingPoolStatsAfterEvent090 after: ${JSON.stringify(stakingPoolStats[91].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos092,
        nextExpectStakingPoolStats: stakingPoolStats092,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[91],
        stakeEvents[45],
        stakeEvents[72],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos091,
        stakingPoolStats091,
      );
      stakeInfos.push(stakeInfos092);
      console.log(
        `\nstakeInfoAfterEvent091 after: ${JSON.stringify(stakeInfos[92].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId},${stakeEvents[45].signerAddress},${stakeEvents[45].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats092);
      console.log(
        `stakingPoolStatsAfterEvent091 after: ${JSON.stringify(stakingPoolStats[92].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[45].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos093,
        nextExpectStakingPoolStats: stakingPoolStats093,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[92],
        stakeEvents[55],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos092,
        stakingPoolStats092,
      );
      stakeInfos.push(stakeInfos093);
      console.log(
        `\nstakeInfoAfterEvent092 after: ${JSON.stringify(stakeInfos[93].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats093);
      console.log(
        `stakingPoolStatsAfterEvent092 after: ${JSON.stringify(stakingPoolStats[93].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos094,
        nextExpectStakingPoolStats: stakingPoolStats094,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[93],
        stakeEvents[46],
        stakeEvents[60],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos093,
        stakingPoolStats093,
      );
      stakeInfos.push(stakeInfos094);
      console.log(
        `\nstakeInfoAfterEvent093 after: ${JSON.stringify(stakeInfos[94].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId},${stakeEvents[46].signerAddress},${stakeEvents[46].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats094);
      console.log(
        `stakingPoolStatsAfterEvent093 after: ${JSON.stringify(stakingPoolStats[94].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[46].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos095,
        nextExpectStakingPoolStats: stakingPoolStats095,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[94],
        stakeEvents[69],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos094,
        stakingPoolStats094,
      );
      stakeInfos.push(stakeInfos095);
      console.log(
        `\nstakeInfoAfterEvent094 after: ${JSON.stringify(stakeInfos[95].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId},${stakeEvents[69].signerAddress},${stakeEvents[69].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats095);
      console.log(
        `stakingPoolStatsAfterEvent094 after: ${JSON.stringify(stakingPoolStats[95].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos096,
        nextExpectStakingPoolStats: stakingPoolStats096,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[95],
        stakeEvents[64],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos095,
        stakingPoolStats095,
      );
      stakeInfos.push(stakeInfos096);
      console.log(
        `\nstakeInfoAfterEvent095 after: ${JSON.stringify(stakeInfos[96].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId},${stakeEvents[64].signerAddress},${stakeEvents[64].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats096);
      console.log(
        `stakingPoolStatsAfterEvent095 after: ${JSON.stringify(stakingPoolStats[96].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos097,
        nextExpectStakingPoolStats: stakingPoolStats097,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[96],
        stakeEvents[56],
        stakeEvents[71],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos096,
        stakingPoolStats096,
      );
      stakeInfos.push(stakeInfos097);
      console.log(
        `\nstakeInfoAfterEvent096 after: ${JSON.stringify(stakeInfos[97].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats097);
      console.log(
        `stakingPoolStatsAfterEvent096 after: ${JSON.stringify(stakingPoolStats[97].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos098,
        nextExpectStakingPoolStats: stakingPoolStats098,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[97],
        stakeEvents[55],
        stakeEvents[92],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos097,
        stakingPoolStats097,
      );
      stakeInfos.push(stakeInfos098);
      console.log(
        `\nstakeInfoAfterEvent097 after: ${JSON.stringify(stakeInfos[98].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId},${stakeEvents[55].signerAddress},${stakeEvents[55].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats098);
      console.log(
        `stakingPoolStatsAfterEvent097 after: ${JSON.stringify(stakingPoolStats[98].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[55].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos099,
        nextExpectStakingPoolStats: stakingPoolStats099,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[98],
        stakeEvents[68],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos098,
        stakingPoolStats098,
      );
      stakeInfos.push(stakeInfos099);
      console.log(
        `\nstakeInfoAfterEvent098 after: ${JSON.stringify(stakeInfos[99].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId},${stakeEvents[68].signerAddress},${stakeEvents[68].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats099);
      console.log(
        `stakingPoolStatsAfterEvent098 after: ${JSON.stringify(stakingPoolStats[99].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos100,
        nextExpectStakingPoolStats: stakingPoolStats100,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[99],
        stakeEvents[50],
        stakeEvents[87],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos099,
        stakingPoolStats099,
      );
      stakeInfos.push(stakeInfos100);
      console.log(
        `\nstakeInfoAfterEvent099 after: ${JSON.stringify(stakeInfos[100].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId},${stakeEvents[50].signerAddress},${stakeEvents[50].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats100);
      console.log(
        `stakingPoolStatsAfterEvent099 after: ${JSON.stringify(stakingPoolStats[100].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[50].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos101,
        nextExpectStakingPoolStats: stakingPoolStats101,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[100],
        stakeEvents[100],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos100,
        stakingPoolStats100,
      );
      stakeInfos.push(stakeInfos101);
      console.log(
        `\nstakeInfoAfterEvent100 after: ${JSON.stringify(stakeInfos[101].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats101);
      console.log(
        `stakingPoolStatsAfterEvent100 after: ${JSON.stringify(stakingPoolStats[101].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos102,
        nextExpectStakingPoolStats: stakingPoolStats102,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[101],
        stakeEvents[18],
        stakeEvents[63],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos101,
        stakingPoolStats101,
      );
      stakeInfos.push(stakeInfos102);
      console.log(
        `\nstakeInfoAfterEvent101 after: ${JSON.stringify(stakeInfos[102].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId},${stakeEvents[18].signerAddress},${stakeEvents[18].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats102);
      console.log(
        `stakingPoolStatsAfterEvent101 after: ${JSON.stringify(stakingPoolStats[102].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[18].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos103,
        nextExpectStakingPoolStats: stakingPoolStats103,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[102],
        stakeEvents[102],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos102,
        stakingPoolStats102,
      );
      stakeInfos.push(stakeInfos103);
      console.log(
        `\nstakeInfoAfterEvent102 after: ${JSON.stringify(stakeInfos[103].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId},${stakeEvents[102].signerAddress},${stakeEvents[102].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats103);
      console.log(
        `stakingPoolStatsAfterEvent102 after: ${JSON.stringify(stakingPoolStats[103].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos104,
        nextExpectStakingPoolStats: stakingPoolStats104,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[103],
        stakeEvents[103],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos103,
        stakingPoolStats103,
      );
      stakeInfos.push(stakeInfos104);
      console.log(
        `\nstakeInfoAfterEvent103 after: ${JSON.stringify(stakeInfos[104].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId},${stakeEvents[103].signerAddress},${stakeEvents[103].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats104);
      console.log(
        `stakingPoolStatsAfterEvent103 after: ${JSON.stringify(stakingPoolStats[104].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos105,
        nextExpectStakingPoolStats: stakingPoolStats105,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[104],
        stakeEvents[74],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos104,
        stakingPoolStats104,
      );
      stakeInfos.push(stakeInfos105);
      console.log(
        `\nstakeInfoAfterEvent104 after: ${JSON.stringify(stakeInfos[105].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats105);
      console.log(
        `stakingPoolStatsAfterEvent104 after: ${JSON.stringify(stakingPoolStats[105].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos106,
        nextExpectStakingPoolStats: stakingPoolStats106,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[105],
        stakeEvents[65],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos105,
        stakingPoolStats105,
      );
      stakeInfos.push(stakeInfos106);
      console.log(
        `\nstakeInfoAfterEvent105 after: ${JSON.stringify(stakeInfos[106].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId},${stakeEvents[65].signerAddress},${stakeEvents[65].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats106);
      console.log(
        `stakingPoolStatsAfterEvent105 after: ${JSON.stringify(stakingPoolStats[106].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos107,
        nextExpectStakingPoolStats: stakingPoolStats107,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[106],
        stakeEvents[64],
        stakeEvents[95],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos106,
        stakingPoolStats106,
      );
      stakeInfos.push(stakeInfos107);
      console.log(
        `\nstakeInfoAfterEvent106 after: ${JSON.stringify(stakeInfos[107].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId},${stakeEvents[64].signerAddress},${stakeEvents[64].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats107);
      console.log(
        `stakingPoolStatsAfterEvent106 after: ${JSON.stringify(stakingPoolStats[107].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[64].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos108,
        nextExpectStakingPoolStats: stakingPoolStats108,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[107],
        stakeEvents[78],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos107,
        stakingPoolStats107,
      );
      stakeInfos.push(stakeInfos108);
      console.log(
        `\nstakeInfoAfterEvent107 after: ${JSON.stringify(stakeInfos[108].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[78].poolIndex].poolId},${stakeEvents[78].signerAddress},${stakeEvents[78].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats108);
      console.log(
        `stakingPoolStatsAfterEvent107 after: ${JSON.stringify(stakingPoolStats[108].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[78].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos109,
        nextExpectStakingPoolStats: stakingPoolStats109,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[108],
        stakeEvents[77],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos108,
        stakingPoolStats108,
      );
      stakeInfos.push(stakeInfos109);
      console.log(
        `\nstakeInfoAfterEvent108 after: ${JSON.stringify(stakeInfos[109].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats109);
      console.log(
        `stakingPoolStatsAfterEvent108 after: ${JSON.stringify(stakingPoolStats[109].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos110,
        nextExpectStakingPoolStats: stakingPoolStats110,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[109],
        stakeEvents[65],
        stakeEvents[105],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos109,
        stakingPoolStats109,
      );
      stakeInfos.push(stakeInfos110);
      console.log(
        `\nstakeInfoAfterEvent109 after: ${JSON.stringify(stakeInfos[110].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId},${stakeEvents[65].signerAddress},${stakeEvents[65].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats110);
      console.log(
        `stakingPoolStatsAfterEvent109 after: ${JSON.stringify(stakingPoolStats[110].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[65].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos111,
        nextExpectStakingPoolStats: stakingPoolStats111,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[110],
        stakeEvents[68],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos110,
        stakingPoolStats110,
      );
      stakeInfos.push(stakeInfos111);
      console.log(
        `\nstakeInfoAfterEvent110 after: ${JSON.stringify(stakeInfos[111].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId},${stakeEvents[68].signerAddress},${stakeEvents[68].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats111);
      console.log(
        `stakingPoolStatsAfterEvent110 after: ${JSON.stringify(stakingPoolStats[111].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[68].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos112,
        nextExpectStakingPoolStats: stakingPoolStats112,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[111],
        stakeEvents[102],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos111,
        stakingPoolStats111,
      );
      stakeInfos.push(stakeInfos112);
      console.log(
        `\nstakeInfoAfterEvent111 after: ${JSON.stringify(stakeInfos[112].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId},${stakeEvents[102].signerAddress},${stakeEvents[102].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats112);
      console.log(
        `stakingPoolStatsAfterEvent111 after: ${JSON.stringify(stakingPoolStats[112].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos113,
        nextExpectStakingPoolStats: stakingPoolStats113,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[112],
        stakeEvents[74],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos112,
        stakingPoolStats112,
      );
      stakeInfos.push(stakeInfos113);
      console.log(
        `\nstakeInfoAfterEvent112 after: ${JSON.stringify(stakeInfos[113].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId},${stakeEvents[74].signerAddress},${stakeEvents[74].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats113);
      console.log(
        `stakingPoolStatsAfterEvent112 after: ${JSON.stringify(stakingPoolStats[113].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[74].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos114,
        nextExpectStakingPoolStats: stakingPoolStats114,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[113],
        stakeEvents[75],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos113,
        stakingPoolStats113,
      );
      stakeInfos.push(stakeInfos114);
      console.log(
        `\nstakeInfoAfterEvent113 after: ${JSON.stringify(stakeInfos[114].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId},${stakeEvents[75].signerAddress},${stakeEvents[75].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats114);
      console.log(
        `stakingPoolStatsAfterEvent113 after: ${JSON.stringify(stakingPoolStats[114].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[75].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos115,
        nextExpectStakingPoolStats: stakingPoolStats115,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[114],
        stakeEvents[77],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos114,
        stakingPoolStats114,
      );
      stakeInfos.push(stakeInfos115);
      console.log(
        `\nstakeInfoAfterEvent114 after: ${JSON.stringify(stakeInfos[115].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId},${stakeEvents[77].signerAddress},${stakeEvents[77].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats115);
      console.log(
        `stakingPoolStatsAfterEvent114 after: ${JSON.stringify(stakingPoolStats[115].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[77].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos116,
        nextExpectStakingPoolStats: stakingPoolStats116,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[115],
        stakeEvents[102],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos115,
        stakingPoolStats115,
      );
      stakeInfos.push(stakeInfos116);
      console.log(
        `\nstakeInfoAfterEvent115 after: ${JSON.stringify(stakeInfos[116].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId},${stakeEvents[102].signerAddress},${stakeEvents[102].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats116);
      console.log(
        `stakingPoolStatsAfterEvent115 after: ${JSON.stringify(stakingPoolStats[116].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[102].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos117,
        nextExpectStakingPoolStats: stakingPoolStats117,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[116],
        stakeEvents[116],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos116,
        stakingPoolStats116,
      );
      stakeInfos.push(stakeInfos117);
      console.log(
        `\nstakeInfoAfterEvent116 after: ${JSON.stringify(stakeInfos[117].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats117);
      console.log(
        `stakingPoolStatsAfterEvent116 after: ${JSON.stringify(stakingPoolStats[117].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos118,
        nextExpectStakingPoolStats: stakingPoolStats118,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[117],
        stakeEvents[117],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos117,
        stakingPoolStats117,
      );
      stakeInfos.push(stakeInfos118);
      console.log(
        `\nstakeInfoAfterEvent117 after: ${JSON.stringify(stakeInfos[118].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats118);
      console.log(
        `stakingPoolStatsAfterEvent117 after: ${JSON.stringify(stakingPoolStats[118].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos119,
        nextExpectStakingPoolStats: stakingPoolStats119,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[118],
        stakeEvents[118],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos118,
        stakingPoolStats118,
      );
      stakeInfos.push(stakeInfos119);
      console.log(
        `\nstakeInfoAfterEvent118 after: ${JSON.stringify(stakeInfos[119].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats119);
      console.log(
        `stakingPoolStatsAfterEvent118 after: ${JSON.stringify(stakingPoolStats[119].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos120,
        nextExpectStakingPoolStats: stakingPoolStats120,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[119],
        stakeEvents[119],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos119,
        stakingPoolStats119,
      );
      stakeInfos.push(stakeInfos120);
      console.log(
        `\nstakeInfoAfterEvent119 after: ${JSON.stringify(stakeInfos[120].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats120);
      console.log(
        `stakingPoolStatsAfterEvent119 after: ${JSON.stringify(stakingPoolStats[120].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos121,
        nextExpectStakingPoolStats: stakingPoolStats121,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[120],
        stakeEvents[120],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos120,
        stakingPoolStats120,
      );
      stakeInfos.push(stakeInfos121);
      console.log(
        `\nstakeInfoAfterEvent120 after: ${JSON.stringify(stakeInfos[121].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId},${stakeEvents[120].signerAddress},${stakeEvents[120].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats121);
      console.log(
        `stakingPoolStatsAfterEvent120 after: ${JSON.stringify(stakingPoolStats[121].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos122,
        nextExpectStakingPoolStats: stakingPoolStats122,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[121],
        stakeEvents[121],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos121,
        stakingPoolStats121,
      );
      stakeInfos.push(stakeInfos122);
      console.log(
        `\nstakeInfoAfterEvent121 after: ${JSON.stringify(stakeInfos[122].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId},${stakeEvents[121].signerAddress},${stakeEvents[121].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats122);
      console.log(
        `stakingPoolStatsAfterEvent121 after: ${JSON.stringify(stakingPoolStats[122].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos123,
        nextExpectStakingPoolStats: stakingPoolStats123,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[122],
        stakeEvents[56],
        stakeEvents[71],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos122,
        stakingPoolStats122,
      );
      stakeInfos.push(stakeInfos123);
      console.log(
        `\nstakeInfoAfterEvent122 after: ${JSON.stringify(stakeInfos[123].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId},${stakeEvents[56].signerAddress},${stakeEvents[56].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats123);
      console.log(
        `stakingPoolStatsAfterEvent122 after: ${JSON.stringify(stakingPoolStats[123].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[56].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos124,
        nextExpectStakingPoolStats: stakingPoolStats124,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[123],
        stakeEvents[10],
        stakeEvents[53],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos123,
        stakingPoolStats123,
      );
      stakeInfos.push(stakeInfos124);
      console.log(
        `\nstakeInfoAfterEvent123 after: ${JSON.stringify(stakeInfos[124].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId},${stakeEvents[10].signerAddress},${stakeEvents[10].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats124);
      console.log(
        `stakingPoolStatsAfterEvent123 after: ${JSON.stringify(stakingPoolStats[124].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[10].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos125,
        nextExpectStakingPoolStats: stakingPoolStats125,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[124],
        stakeEvents[124],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos124,
        stakingPoolStats124,
      );
      stakeInfos.push(stakeInfos125);
      console.log(
        `\nstakeInfoAfterEvent124 after: ${JSON.stringify(stakeInfos[125].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats125);
      console.log(
        `stakingPoolStatsAfterEvent124 after: ${JSON.stringify(stakingPoolStats[125].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos126,
        nextExpectStakingPoolStats: stakingPoolStats126,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[125],
        stakeEvents[125],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos125,
        stakingPoolStats125,
      );
      stakeInfos.push(stakeInfos126);
      console.log(
        `\nstakeInfoAfterEvent125 after: ${JSON.stringify(stakeInfos[126].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats126);
      console.log(
        `stakingPoolStatsAfterEvent125 after: ${JSON.stringify(stakingPoolStats[126].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos127,
        nextExpectStakingPoolStats: stakingPoolStats127,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[126],
        stakeEvents[126],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos126,
        stakingPoolStats126,
      );
      stakeInfos.push(stakeInfos127);
      console.log(
        `\nstakeInfoAfterEvent126 after: ${JSON.stringify(stakeInfos[127].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId},${stakeEvents[126].signerAddress},${stakeEvents[126].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats127);
      console.log(
        `stakingPoolStatsAfterEvent126 after: ${JSON.stringify(stakingPoolStats[127].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos128,
        nextExpectStakingPoolStats: stakingPoolStats128,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[127],
        stakeEvents[127],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos127,
        stakingPoolStats127,
      );
      stakeInfos.push(stakeInfos128);
      console.log(
        `\nstakeInfoAfterEvent127 after: ${JSON.stringify(stakeInfos[128].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId},${stakeEvents[127].signerAddress},${stakeEvents[127].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats128);
      console.log(
        `stakingPoolStatsAfterEvent127 after: ${JSON.stringify(stakingPoolStats[128].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos129,
        nextExpectStakingPoolStats: stakingPoolStats129,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[128],
        stakeEvents[59],
        stakeEvents[80],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos128,
        stakingPoolStats128,
      );
      stakeInfos.push(stakeInfos129);
      console.log(
        `\nstakeInfoAfterEvent128 after: ${JSON.stringify(stakeInfos[129].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId},${stakeEvents[59].signerAddress},${stakeEvents[59].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats129);
      console.log(
        `stakingPoolStatsAfterEvent128 after: ${JSON.stringify(stakingPoolStats[129].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[59].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos130,
        nextExpectStakingPoolStats: stakingPoolStats130,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[129],
        stakeEvents[69],
        stakeEvents[94],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos129,
        stakingPoolStats129,
      );
      stakeInfos.push(stakeInfos130);
      console.log(
        `\nstakeInfoAfterEvent129 after: ${JSON.stringify(stakeInfos[130].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId},${stakeEvents[69].signerAddress},${stakeEvents[69].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats130);
      console.log(
        `stakingPoolStatsAfterEvent129 after: ${JSON.stringify(stakingPoolStats[130].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos131,
        nextExpectStakingPoolStats: stakingPoolStats131,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[130],
        stakeEvents[130],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos130,
        stakingPoolStats130,
      );
      stakeInfos.push(stakeInfos131);
      console.log(
        `\nstakeInfoAfterEvent130 after: ${JSON.stringify(stakeInfos[131].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats131);
      console.log(
        `stakingPoolStatsAfterEvent130 after: ${JSON.stringify(stakingPoolStats[131].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos132,
        nextExpectStakingPoolStats: stakingPoolStats132,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[131],
        stakeEvents[131],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos131,
        stakingPoolStats131,
      );
      stakeInfos.push(stakeInfos132);
      console.log(
        `\nstakeInfoAfterEvent131 after: ${JSON.stringify(stakeInfos[132].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats132);
      console.log(
        `stakingPoolStatsAfterEvent131 after: ${JSON.stringify(stakingPoolStats[132].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos133,
        nextExpectStakingPoolStats: stakingPoolStats133,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[132],
        stakeEvents[132],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos132,
        stakingPoolStats132,
      );
      stakeInfos.push(stakeInfos133);
      console.log(
        `\nstakeInfoAfterEvent132 after: ${JSON.stringify(stakeInfos[133].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats133);
      console.log(
        `stakingPoolStatsAfterEvent132 after: ${JSON.stringify(stakingPoolStats[133].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos134,
        nextExpectStakingPoolStats: stakingPoolStats134,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[133],
        stakeEvents[133],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos133,
        stakingPoolStats133,
      );
      stakeInfos.push(stakeInfos134);
      console.log(
        `\nstakeInfoAfterEvent133 after: ${JSON.stringify(stakeInfos[134].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId},${stakeEvents[133].signerAddress},${stakeEvents[133].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats134);
      console.log(
        `stakingPoolStatsAfterEvent133 after: ${JSON.stringify(stakingPoolStats[134].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos135,
        nextExpectStakingPoolStats: stakingPoolStats135,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[134],
        stakeEvents[134],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos134,
        stakingPoolStats134,
      );
      stakeInfos.push(stakeInfos135);
      console.log(
        `\nstakeInfoAfterEvent134 after: ${JSON.stringify(stakeInfos[135].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId},${stakeEvents[134].signerAddress},${stakeEvents[134].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats135);
      console.log(
        `stakingPoolStatsAfterEvent134 after: ${JSON.stringify(stakingPoolStats[135].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos136,
        nextExpectStakingPoolStats: stakingPoolStats136,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[135],
        stakeEvents[100],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos135,
        stakingPoolStats135,
      );
      stakeInfos.push(stakeInfos136);
      console.log(
        `\nstakeInfoAfterEvent135 after: ${JSON.stringify(stakeInfos[136].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats136);
      console.log(
        `stakingPoolStatsAfterEvent135 after: ${JSON.stringify(stakingPoolStats[136].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos137,
        nextExpectStakingPoolStats: stakingPoolStats137,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[136],
        stakeEvents[58],
        stakeEvents[82],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos136,
        stakingPoolStats136,
      );
      stakeInfos.push(stakeInfos137);
      console.log(
        `\nstakeInfoAfterEvent136 after: ${JSON.stringify(stakeInfos[137].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId},${stakeEvents[58].signerAddress},${stakeEvents[58].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats137);
      console.log(
        `stakingPoolStatsAfterEvent136 after: ${JSON.stringify(stakingPoolStats[137].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[58].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos138,
        nextExpectStakingPoolStats: stakingPoolStats138,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[137],
        stakeEvents[119],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos137,
        stakingPoolStats137,
      );
      stakeInfos.push(stakeInfos138);
      console.log(
        `\nstakeInfoAfterEvent137 after: ${JSON.stringify(stakeInfos[138].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats138);
      console.log(
        `stakingPoolStatsAfterEvent137 after: ${JSON.stringify(stakingPoolStats[138].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos139,
        nextExpectStakingPoolStats: stakingPoolStats139,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[138],
        stakeEvents[126],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos138,
        stakingPoolStats138,
      );
      stakeInfos.push(stakeInfos139);
      console.log(
        `\nstakeInfoAfterEvent138 after: ${JSON.stringify(stakeInfos[139].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId},${stakeEvents[126].signerAddress},${stakeEvents[126].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats139);
      console.log(
        `stakingPoolStatsAfterEvent138 after: ${JSON.stringify(stakingPoolStats[139].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos140,
        nextExpectStakingPoolStats: stakingPoolStats140,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[139],
        stakeEvents[69],
        stakeEvents[94],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos139,
        stakingPoolStats139,
      );
      stakeInfos.push(stakeInfos140);
      console.log(
        `\nstakeInfoAfterEvent139 after: ${JSON.stringify(stakeInfos[140].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId},${stakeEvents[69].signerAddress},${stakeEvents[69].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats140);
      console.log(
        `stakingPoolStatsAfterEvent139 after: ${JSON.stringify(stakingPoolStats[140].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[69].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos141,
        nextExpectStakingPoolStats: stakingPoolStats141,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[140],
        stakeEvents[100],
        stakeEvents[135],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos140,
        stakingPoolStats140,
      );
      stakeInfos.push(stakeInfos141);
      console.log(
        `\nstakeInfoAfterEvent140 after: ${JSON.stringify(stakeInfos[141].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats141);
      console.log(
        `stakingPoolStatsAfterEvent140 after: ${JSON.stringify(stakingPoolStats[141].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos142,
        nextExpectStakingPoolStats: stakingPoolStats142,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[141],
        stakeEvents[52],
        stakeEvents[66],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos141,
        stakingPoolStats141,
      );
      stakeInfos.push(stakeInfos142);
      console.log(
        `\nstakeInfoAfterEvent141 after: ${JSON.stringify(stakeInfos[142].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId},${stakeEvents[52].signerAddress},${stakeEvents[52].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats142);
      console.log(
        `stakingPoolStatsAfterEvent141 after: ${JSON.stringify(stakingPoolStats[142].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[52].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos143,
        nextExpectStakingPoolStats: stakingPoolStats143,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[142],
        stakeEvents[142],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos142,
        stakingPoolStats142,
      );
      stakeInfos.push(stakeInfos143);
      stakingPoolStats.push(stakingPoolStats143);
      console.log(
        `stakingPoolStatsAfterEvent142 after: ${JSON.stringify(stakingPoolStats[143].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[142].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos144,
        nextExpectStakingPoolStats: stakingPoolStats144,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[143],
        stakeEvents[126],
        stakeEvents[138],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos143,
        stakingPoolStats143,
      );
      stakeInfos.push(stakeInfos144);
      console.log(
        `\nstakeInfoAfterEvent143 after: ${JSON.stringify(stakeInfos[144].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId},${stakeEvents[126].signerAddress},${stakeEvents[126].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats144);
      console.log(
        `stakingPoolStatsAfterEvent143 after: ${JSON.stringify(stakingPoolStats[144].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos145,
        nextExpectStakingPoolStats: stakingPoolStats145,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[144],
        stakeEvents[100],
        stakeEvents[135],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos144,
        stakingPoolStats144,
      );
      stakeInfos.push(stakeInfos145);
      console.log(
        `\nstakeInfoAfterEvent144 after: ${JSON.stringify(stakeInfos[145].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats145);
      console.log(
        `stakingPoolStatsAfterEvent144 after: ${JSON.stringify(stakingPoolStats[145].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos146,
        nextExpectStakingPoolStats: stakingPoolStats146,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[145],
        stakeEvents[119],
        stakeEvents[137],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos145,
        stakingPoolStats145,
      );
      stakeInfos.push(stakeInfos146);
      console.log(
        `\nstakeInfoAfterEvent145 after: ${JSON.stringify(stakeInfos[146].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats146);
      console.log(
        `stakingPoolStatsAfterEvent145 after: ${JSON.stringify(stakingPoolStats[146].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos147,
        nextExpectStakingPoolStats: stakingPoolStats147,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[146],
        stakeEvents[116],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos146,
        stakingPoolStats146,
      );
      stakeInfos.push(stakeInfos147);
      console.log(
        `\nstakeInfoAfterEvent146 after: ${JSON.stringify(stakeInfos[147].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats147);
      console.log(
        `stakingPoolStatsAfterEvent146 after: ${JSON.stringify(stakingPoolStats[147].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos148,
        nextExpectStakingPoolStats: stakingPoolStats148,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[147],
        stakeEvents[126],
        stakeEvents[138],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos147,
        stakingPoolStats147,
      );
      stakeInfos.push(stakeInfos148);
      console.log(
        `\nstakeInfoAfterEvent147 after: ${JSON.stringify(stakeInfos[148].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId},${stakeEvents[126].signerAddress},${stakeEvents[126].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats148);
      console.log(
        `stakingPoolStatsAfterEvent147 after: ${JSON.stringify(stakingPoolStats[148].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos149,
        nextExpectStakingPoolStats: stakingPoolStats149,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[148],
        stakeEvents[100],
        stakeEvents[135],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos148,
        stakingPoolStats148,
      );
      stakeInfos.push(stakeInfos149);
      console.log(
        `\nstakeInfoAfterEvent148 after: ${JSON.stringify(stakeInfos[149].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId},${stakeEvents[100].signerAddress},${stakeEvents[100].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats149);
      console.log(
        `stakingPoolStatsAfterEvent148 after: ${JSON.stringify(stakingPoolStats[149].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[100].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos150,
        nextExpectStakingPoolStats: stakingPoolStats150,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[149],
        stakeEvents[125],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos149,
        stakingPoolStats149,
      );
      stakeInfos.push(stakeInfos150);
      console.log(
        `\nstakeInfoAfterEvent149 after: ${JSON.stringify(stakeInfos[150].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats150);
      console.log(
        `stakingPoolStatsAfterEvent149 after: ${JSON.stringify(stakingPoolStats[150].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos151,
        nextExpectStakingPoolStats: stakingPoolStats151,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[150],
        stakeEvents[119],
        stakeEvents[137],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos150,
        stakingPoolStats150,
      );
      stakeInfos.push(stakeInfos151);
      console.log(
        `\nstakeInfoAfterEvent150 after: ${JSON.stringify(stakeInfos[151].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId},${stakeEvents[119].signerAddress},${stakeEvents[119].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats151);
      console.log(
        `stakingPoolStatsAfterEvent150 after: ${JSON.stringify(stakingPoolStats[151].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[119].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos152,
        nextExpectStakingPoolStats: stakingPoolStats152,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[151],
        stakeEvents[116],
        stakeEvents[146],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos151,
        stakingPoolStats151,
      );
      stakeInfos.push(stakeInfos152);
      console.log(
        `\nstakeInfoAfterEvent151 after: ${JSON.stringify(stakeInfos[152].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats152);
      console.log(
        `stakingPoolStatsAfterEvent151 after: ${JSON.stringify(stakingPoolStats[152].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos153,
        nextExpectStakingPoolStats: stakingPoolStats153,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[152],
        stakeEvents[121],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos152,
        stakingPoolStats152,
      );
      stakeInfos.push(stakeInfos153);
      console.log(
        `\nstakeInfoAfterEvent152 after: ${JSON.stringify(stakeInfos[153].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId},${stakeEvents[121].signerAddress},${stakeEvents[121].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats153);
      console.log(
        `stakingPoolStatsAfterEvent152 after: ${JSON.stringify(stakingPoolStats[153].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos154,
        nextExpectStakingPoolStats: stakingPoolStats154,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[153],
        stakeEvents[125],
        stakeEvents[149],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos153,
        stakingPoolStats153,
      );
      stakeInfos.push(stakeInfos154);
      console.log(
        `\nstakeInfoAfterEvent153 after: ${JSON.stringify(stakeInfos[154].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId},${stakeEvents[125].signerAddress},${stakeEvents[125].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats154);
      console.log(
        `stakingPoolStatsAfterEvent153 after: ${JSON.stringify(stakingPoolStats[154].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[125].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos155,
        nextExpectStakingPoolStats: stakingPoolStats155,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[154],
        stakeEvents[118],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos154,
        stakingPoolStats154,
      );
      stakeInfos.push(stakeInfos155);
      console.log(
        `\nstakeInfoAfterEvent154 after: ${JSON.stringify(stakeInfos[155].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats155);
      console.log(
        `stakingPoolStatsAfterEvent154 after: ${JSON.stringify(stakingPoolStats[155].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos156,
        nextExpectStakingPoolStats: stakingPoolStats156,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[155],
        stakeEvents[126],
        stakeEvents[138],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos155,
        stakingPoolStats155,
      );
      stakeInfos.push(stakeInfos156);
      console.log(
        `\nstakeInfoAfterEvent155 after: ${JSON.stringify(stakeInfos[156].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId},${stakeEvents[126].signerAddress},${stakeEvents[126].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats156);
      console.log(
        `stakingPoolStatsAfterEvent155 after: ${JSON.stringify(stakingPoolStats[156].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[126].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos157,
        nextExpectStakingPoolStats: stakingPoolStats157,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[156],
        stakeEvents[130],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos156,
        stakingPoolStats156,
      );
      stakeInfos.push(stakeInfos157);
      console.log(
        `\nstakeInfoAfterEvent156 after: ${JSON.stringify(stakeInfos[157].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats157);
      console.log(
        `stakingPoolStatsAfterEvent156 after: ${JSON.stringify(stakingPoolStats[157].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos158,
        nextExpectStakingPoolStats: stakingPoolStats158,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[157],
        stakeEvents[132],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos157,
        stakingPoolStats157,
      );
      stakeInfos.push(stakeInfos158);
      console.log(
        `\nstakeInfoAfterEvent157 after: ${JSON.stringify(stakeInfos[158].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats158);
      console.log(
        `stakingPoolStatsAfterEvent157 after: ${JSON.stringify(stakingPoolStats[158].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos159,
        nextExpectStakingPoolStats: stakingPoolStats159,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[158],
        stakeEvents[118],
        stakeEvents[154],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos158,
        stakingPoolStats158,
      );
      stakeInfos.push(stakeInfos159);
      console.log(
        `\nstakeInfoAfterEvent158 after: ${JSON.stringify(stakeInfos[159].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId},${stakeEvents[118].signerAddress},${stakeEvents[118].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats159);
      console.log(
        `stakingPoolStatsAfterEvent158 after: ${JSON.stringify(stakingPoolStats[159].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[118].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos160,
        nextExpectStakingPoolStats: stakingPoolStats160,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[159],
        stakeEvents[116],
        stakeEvents[146],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos159,
        stakingPoolStats159,
      );
      stakeInfos.push(stakeInfos160);
      console.log(
        `\nstakeInfoAfterEvent159 after: ${JSON.stringify(stakeInfos[160].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId},${stakeEvents[116].signerAddress},${stakeEvents[116].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats160);
      console.log(
        `stakingPoolStatsAfterEvent159 after: ${JSON.stringify(stakingPoolStats[160].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[116].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos161,
        nextExpectStakingPoolStats: stakingPoolStats161,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[160],
        stakeEvents[121],
        stakeEvents[152],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos160,
        stakingPoolStats160,
      );
      stakeInfos.push(stakeInfos161);
      console.log(
        `\nstakeInfoAfterEvent160 after: ${JSON.stringify(stakeInfos[161].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId},${stakeEvents[121].signerAddress},${stakeEvents[121].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats161);
      console.log(
        `stakingPoolStatsAfterEvent160 after: ${JSON.stringify(stakingPoolStats[161].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[121].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos162,
        nextExpectStakingPoolStats: stakingPoolStats162,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[161],
        stakeEvents[161],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos161,
        stakingPoolStats161,
      );
      stakeInfos.push(stakeInfos162);
      stakingPoolStats.push(stakingPoolStats162);
      console.log(
        `stakingPoolStatsAfterEvent161 after: ${JSON.stringify(stakingPoolStats[162].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[161].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos163,
        nextExpectStakingPoolStats: stakingPoolStats163,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[162],
        stakeEvents[132],
        stakeEvents[157],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos162,
        stakingPoolStats162,
      );
      stakeInfos.push(stakeInfos163);
      console.log(
        `\nstakeInfoAfterEvent162 after: ${JSON.stringify(stakeInfos[163].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats163);
      console.log(
        `stakingPoolStatsAfterEvent162 after: ${JSON.stringify(stakingPoolStats[163].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos164,
        nextExpectStakingPoolStats: stakingPoolStats164,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[163],
        stakeEvents[130],
        stakeEvents[156],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos163,
        stakingPoolStats163,
      );
      stakeInfos.push(stakeInfos164);
      console.log(
        `\nstakeInfoAfterEvent163 after: ${JSON.stringify(stakeInfos[164].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId},${stakeEvents[130].signerAddress},${stakeEvents[130].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats164);
      console.log(
        `stakingPoolStatsAfterEvent163 after: ${JSON.stringify(stakingPoolStats[164].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[130].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos165,
        nextExpectStakingPoolStats: stakingPoolStats165,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[164],
        stakeEvents[132],
        stakeEvents[157],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos164,
        stakingPoolStats164,
      );
      stakeInfos.push(stakeInfos165);
      console.log(
        `\nstakeInfoAfterEvent164 after: ${JSON.stringify(stakeInfos[165].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId},${stakeEvents[132].signerAddress},${stakeEvents[132].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats165);
      console.log(
        `stakingPoolStatsAfterEvent164 after: ${JSON.stringify(stakingPoolStats[165].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[132].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos166,
        nextExpectStakingPoolStats: stakingPoolStats166,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[165],
        stakeEvents[127],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos165,
        stakingPoolStats165,
      );
      stakeInfos.push(stakeInfos166);
      console.log(
        `\nstakeInfoAfterEvent165 after: ${JSON.stringify(stakeInfos[166].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId},${stakeEvents[127].signerAddress},${stakeEvents[127].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats166);
      console.log(
        `stakingPoolStatsAfterEvent165 after: ${JSON.stringify(stakingPoolStats[166].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos167,
        nextExpectStakingPoolStats: stakingPoolStats167,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[166],
        stakeEvents[127],
        stakeEvents[165],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos166,
        stakingPoolStats166,
      );
      stakeInfos.push(stakeInfos167);
      console.log(
        `\nstakeInfoAfterEvent166 after: ${JSON.stringify(stakeInfos[167].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId},${stakeEvents[127].signerAddress},${stakeEvents[127].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats167);
      console.log(
        `stakingPoolStatsAfterEvent166 after: ${JSON.stringify(stakingPoolStats[167].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos168,
        nextExpectStakingPoolStats: stakingPoolStats168,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[167],
        stakeEvents[134],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos167,
        stakingPoolStats167,
      );
      stakeInfos.push(stakeInfos168);
      console.log(
        `\nstakeInfoAfterEvent167 after: ${JSON.stringify(stakeInfos[168].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId},${stakeEvents[134].signerAddress},${stakeEvents[134].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats168);
      console.log(
        `stakingPoolStatsAfterEvent167 after: ${JSON.stringify(stakingPoolStats[168].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos169,
        nextExpectStakingPoolStats: stakingPoolStats169,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[168],
        stakeEvents[127],
        stakeEvents[165],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos168,
        stakingPoolStats168,
      );
      stakeInfos.push(stakeInfos169);
      console.log(
        `\nstakeInfoAfterEvent168 after: ${JSON.stringify(stakeInfos[169].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId},${stakeEvents[127].signerAddress},${stakeEvents[127].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats169);
      console.log(
        `stakingPoolStatsAfterEvent168 after: ${JSON.stringify(stakingPoolStats[169].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[127].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos170,
        nextExpectStakingPoolStats: stakingPoolStats170,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[169],
        stakeEvents[169],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos169,
        stakingPoolStats169,
      );
      stakeInfos.push(stakeInfos170);
      stakingPoolStats.push(stakingPoolStats170);
      console.log(
        `stakingPoolStatsAfterEvent169 after: ${JSON.stringify(stakingPoolStats[170].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[169].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos171,
        nextExpectStakingPoolStats: stakingPoolStats171,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[170],
        stakeEvents[134],
        stakeEvents[167],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos170,
        stakingPoolStats170,
      );
      stakeInfos.push(stakeInfos171);
      console.log(
        `\nstakeInfoAfterEvent170 after: ${JSON.stringify(stakeInfos[171].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId},${stakeEvents[134].signerAddress},${stakeEvents[134].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats171);
      console.log(
        `stakingPoolStatsAfterEvent170 after: ${JSON.stringify(stakingPoolStats[171].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[134].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos172,
        nextExpectStakingPoolStats: stakingPoolStats172,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[171],
        stakeEvents[38],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos171,
        stakingPoolStats171,
      );
      stakeInfos.push(stakeInfos172);
      console.log(
        `\nstakeInfoAfterEvent171 after: ${JSON.stringify(stakeInfos[172].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats172);
      console.log(
        `stakingPoolStatsAfterEvent171 after: ${JSON.stringify(stakingPoolStats[172].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos173,
        nextExpectStakingPoolStats: stakingPoolStats173,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[172],
        stakeEvents[172],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos172,
        stakingPoolStats172,
      );
      stakeInfos.push(stakeInfos173);
      console.log(
        `\nstakeInfoAfterEvent172 after: ${JSON.stringify(stakeInfos[173].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[172].poolIndex].poolId},${stakeEvents[172].signerAddress},${stakeEvents[172].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats173);
      console.log(
        `stakingPoolStatsAfterEvent172 after: ${JSON.stringify(stakingPoolStats[173].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[172].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos174,
        nextExpectStakingPoolStats: stakingPoolStats174,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[173],
        stakeEvents[54],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos173,
        stakingPoolStats173,
      );
      stakeInfos.push(stakeInfos174);
      console.log(
        `\nstakeInfoAfterEvent173 after: ${JSON.stringify(stakeInfos[174].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats174);
      console.log(
        `stakingPoolStatsAfterEvent173 after: ${JSON.stringify(stakingPoolStats[174].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos175,
        nextExpectStakingPoolStats: stakingPoolStats175,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[174],
        stakeEvents[174],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos174,
        stakingPoolStats174,
      );
      stakeInfos.push(stakeInfos175);
      console.log(
        `\nstakeInfoAfterEvent174 after: ${JSON.stringify(stakeInfos[175].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[174].poolIndex].poolId},${stakeEvents[174].signerAddress},${stakeEvents[174].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats175);
      console.log(
        `stakingPoolStatsAfterEvent174 after: ${JSON.stringify(stakingPoolStats[175].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[174].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos176,
        nextExpectStakingPoolStats: stakingPoolStats176,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[175],
        stakeEvents[175],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos175,
        stakingPoolStats175,
      );
      stakeInfos.push(stakeInfos176);
      stakingPoolStats.push(stakingPoolStats176);
      console.log(
        `stakingPoolStatsAfterEvent175 after: ${JSON.stringify(stakingPoolStats[176].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[175].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos177,
        nextExpectStakingPoolStats: stakingPoolStats177,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[176],
        stakeEvents[176],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos176,
        stakingPoolStats176,
      );
      stakeInfos.push(stakeInfos177);
      console.log(
        `\nstakeInfoAfterEvent176 after: ${JSON.stringify(stakeInfos[177].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[176].poolIndex].poolId},${stakeEvents[176].signerAddress},${stakeEvents[176].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats177);
      console.log(
        `stakingPoolStatsAfterEvent176 after: ${JSON.stringify(stakingPoolStats[177].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[176].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos178,
        nextExpectStakingPoolStats: stakingPoolStats178,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[177],
        stakeEvents[57],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos177,
        stakingPoolStats177,
      );
      stakeInfos.push(stakeInfos178);
      console.log(
        `\nstakeInfoAfterEvent177 after: ${JSON.stringify(stakeInfos[178].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats178);
      console.log(
        `stakingPoolStatsAfterEvent177 after: ${JSON.stringify(stakingPoolStats[178].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos179,
        nextExpectStakingPoolStats: stakingPoolStats179,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[178],
        stakeEvents[76],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos178,
        stakingPoolStats178,
      );
      stakeInfos.push(stakeInfos179);
      console.log(
        `\nstakeInfoAfterEvent178 after: ${JSON.stringify(stakeInfos[179].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats179);
      console.log(
        `stakingPoolStatsAfterEvent178 after: ${JSON.stringify(stakingPoolStats[179].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos180,
        nextExpectStakingPoolStats: stakingPoolStats180,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[179],
        stakeEvents[38],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos179,
        stakingPoolStats179,
      );
      stakeInfos.push(stakeInfos180);
      console.log(
        `\nstakeInfoAfterEvent179 after: ${JSON.stringify(stakeInfos[180].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats180);
      console.log(
        `stakingPoolStatsAfterEvent179 after: ${JSON.stringify(stakingPoolStats[180].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos181,
        nextExpectStakingPoolStats: stakingPoolStats181,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[180],
        stakeEvents[176],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos180,
        stakingPoolStats180,
      );
      stakeInfos.push(stakeInfos181);
      console.log(
        `\nstakeInfoAfterEvent180 after: ${JSON.stringify(stakeInfos[181].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[176].poolIndex].poolId},${stakeEvents[176].signerAddress},${stakeEvents[176].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats181);
      console.log(
        `stakingPoolStatsAfterEvent180 after: ${JSON.stringify(stakingPoolStats[181].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[176].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos182,
        nextExpectStakingPoolStats: stakingPoolStats182,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[181],
        stakeEvents[79],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos181,
        stakingPoolStats181,
      );
      stakeInfos.push(stakeInfos182);
      console.log(
        `\nstakeInfoAfterEvent181 after: ${JSON.stringify(stakeInfos[182].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[79].poolIndex].poolId},${stakeEvents[79].signerAddress},${stakeEvents[79].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats182);
      console.log(
        `stakingPoolStatsAfterEvent181 after: ${JSON.stringify(stakingPoolStats[182].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[79].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos183,
        nextExpectStakingPoolStats: stakingPoolStats183,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[182],
        stakeEvents[103],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos182,
        stakingPoolStats182,
      );
      stakeInfos.push(stakeInfos183);
      console.log(
        `\nstakeInfoAfterEvent182 after: ${JSON.stringify(stakeInfos[183].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId},${stakeEvents[103].signerAddress},${stakeEvents[103].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats183);
      console.log(
        `stakingPoolStatsAfterEvent182 after: ${JSON.stringify(stakingPoolStats[183].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos184,
        nextExpectStakingPoolStats: stakingPoolStats184,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[183],
        stakeEvents[57],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos183,
        stakingPoolStats183,
      );
      stakeInfos.push(stakeInfos184);
      console.log(
        `\nstakeInfoAfterEvent183 after: ${JSON.stringify(stakeInfos[184].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId},${stakeEvents[57].signerAddress},${stakeEvents[57].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats184);
      console.log(
        `stakingPoolStatsAfterEvent183 after: ${JSON.stringify(stakingPoolStats[184].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[57].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos185,
        nextExpectStakingPoolStats: stakingPoolStats185,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[184],
        stakeEvents[38],
        stakeEvents[179],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos184,
        stakingPoolStats184,
      );
      stakeInfos.push(stakeInfos185);
      console.log(
        `\nstakeInfoAfterEvent184 after: ${JSON.stringify(stakeInfos[185].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId},${stakeEvents[38].signerAddress},${stakeEvents[38].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats185);
      console.log(
        `stakingPoolStatsAfterEvent184 after: ${JSON.stringify(stakingPoolStats[185].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[38].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos186,
        nextExpectStakingPoolStats: stakingPoolStats186,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[185],
        stakeEvents[54],
        stakeEvents[173],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos185,
        stakingPoolStats185,
      );
      stakeInfos.push(stakeInfos186);
      console.log(
        `\nstakeInfoAfterEvent185 after: ${JSON.stringify(stakeInfos[186].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats186);
      console.log(
        `stakingPoolStatsAfterEvent185 after: ${JSON.stringify(stakingPoolStats[186].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos187,
        nextExpectStakingPoolStats: stakingPoolStats187,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[186],
        stakeEvents[76],
        stakeEvents[178],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos186,
        stakingPoolStats186,
      );
      stakeInfos.push(stakeInfos187);
      console.log(
        `\nstakeInfoAfterEvent186 after: ${JSON.stringify(stakeInfos[187].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats187);
      console.log(
        `stakingPoolStatsAfterEvent186 after: ${JSON.stringify(stakingPoolStats[187].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos188,
        nextExpectStakingPoolStats: stakingPoolStats188,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[187],
        stakeEvents[54],
        stakeEvents[173],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos187,
        stakingPoolStats187,
      );
      stakeInfos.push(stakeInfos188);
      console.log(
        `\nstakeInfoAfterEvent187 after: ${JSON.stringify(stakeInfos[188].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats188);
      console.log(
        `stakingPoolStatsAfterEvent187 after: ${JSON.stringify(stakingPoolStats[188].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos189,
        nextExpectStakingPoolStats: stakingPoolStats189,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[188],
        stakeEvents[76],
        stakeEvents[178],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos188,
        stakingPoolStats188,
      );
      stakeInfos.push(stakeInfos189);
      console.log(
        `\nstakeInfoAfterEvent188 after: ${JSON.stringify(stakeInfos[189].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId},${stakeEvents[76].signerAddress},${stakeEvents[76].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats189);
      console.log(
        `stakingPoolStatsAfterEvent188 after: ${JSON.stringify(stakingPoolStats[189].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[76].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos190,
        nextExpectStakingPoolStats: stakingPoolStats190,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[189],
        stakeEvents[54],
        stakeEvents[173],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos189,
        stakingPoolStats189,
      );
      stakeInfos.push(stakeInfos190);
      console.log(
        `\nstakeInfoAfterEvent189 after: ${JSON.stringify(stakeInfos[190].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId},${stakeEvents[54].signerAddress},${stakeEvents[54].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats190);
      console.log(
        `stakingPoolStatsAfterEvent189 after: ${JSON.stringify(stakingPoolStats[190].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[54].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos191,
        nextExpectStakingPoolStats: stakingPoolStats191,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[190],
        stakeEvents[117],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos190,
        stakingPoolStats190,
      );
      stakeInfos.push(stakeInfos191);
      console.log(
        `\nstakeInfoAfterEvent190 after: ${JSON.stringify(stakeInfos[191].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats191);
      console.log(
        `stakingPoolStatsAfterEvent190 after: ${JSON.stringify(stakingPoolStats[191].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos192,
        nextExpectStakingPoolStats: stakingPoolStats192,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[191],
        stakeEvents[124],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos191,
        stakingPoolStats191,
      );
      stakeInfos.push(stakeInfos192);
      console.log(
        `\nstakeInfoAfterEvent191 after: ${JSON.stringify(stakeInfos[192].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId},${stakeEvents[124].signerAddress},${stakeEvents[124].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats192);
      console.log(
        `stakingPoolStatsAfterEvent191 after: ${JSON.stringify(stakingPoolStats[192].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[124].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos193,
        nextExpectStakingPoolStats: stakingPoolStats193,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[192],
        stakeEvents[120],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos192,
        stakingPoolStats192,
      );
      stakeInfos.push(stakeInfos193);
      console.log(
        `\nstakeInfoAfterEvent192 after: ${JSON.stringify(stakeInfos[193].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId},${stakeEvents[120].signerAddress},${stakeEvents[120].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats193);
      console.log(
        `stakingPoolStatsAfterEvent192 after: ${JSON.stringify(stakingPoolStats[193].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos194,
        nextExpectStakingPoolStats: stakingPoolStats194,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[193],
        stakeEvents[120],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos193,
        stakingPoolStats193,
      );
      stakeInfos.push(stakeInfos194);
      console.log(
        `\nstakeInfoAfterEvent193 after: ${JSON.stringify(stakeInfos[194].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId},${stakeEvents[120].signerAddress},${stakeEvents[120].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats194);
      console.log(
        `stakingPoolStatsAfterEvent193 after: ${JSON.stringify(stakingPoolStats[194].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[120].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos195,
        nextExpectStakingPoolStats: stakingPoolStats195,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[194],
        stakeEvents[131],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos194,
        stakingPoolStats194,
      );
      stakeInfos.push(stakeInfos195);
      console.log(
        `\nstakeInfoAfterEvent194 after: ${JSON.stringify(stakeInfos[195].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats195);
      console.log(
        `stakingPoolStatsAfterEvent194 after: ${JSON.stringify(stakingPoolStats[195].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos196,
        nextExpectStakingPoolStats: stakingPoolStats196,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[195],
        stakeEvents[133],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos195,
        stakingPoolStats195,
      );
      stakeInfos.push(stakeInfos196);
      console.log(
        `\nstakeInfoAfterEvent195 after: ${JSON.stringify(stakeInfos[196].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId},${stakeEvents[133].signerAddress},${stakeEvents[133].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats196);
      console.log(
        `stakingPoolStatsAfterEvent195 after: ${JSON.stringify(stakingPoolStats[196].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos197,
        nextExpectStakingPoolStats: stakingPoolStats197,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[196],
        stakeEvents[131],
        stakeEvents[194],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos196,
        stakingPoolStats196,
      );
      stakeInfos.push(stakeInfos197);
      console.log(
        `\nstakeInfoAfterEvent196 after: ${JSON.stringify(stakeInfos[197].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId},${stakeEvents[131].signerAddress},${stakeEvents[131].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats197);
      console.log(
        `stakingPoolStatsAfterEvent196 after: ${JSON.stringify(stakingPoolStats[197].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[131].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos198,
        nextExpectStakingPoolStats: stakingPoolStats198,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[197],
        stakeEvents[133],
        stakeEvents[195],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos197,
        stakingPoolStats197,
      );
      stakeInfos.push(stakeInfos198);
      console.log(
        `\nstakeInfoAfterEvent197 after: ${JSON.stringify(stakeInfos[198].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId},${stakeEvents[133].signerAddress},${stakeEvents[133].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats198);
      console.log(
        `stakingPoolStatsAfterEvent197 after: ${JSON.stringify(stakingPoolStats[198].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[133].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos199,
        nextExpectStakingPoolStats: stakingPoolStats199,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[198],
        stakeEvents[198],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos198,
        stakingPoolStats198,
      );
      stakeInfos.push(stakeInfos199);
      console.log(
        `\nstakeInfoAfterEvent198 after: ${JSON.stringify(stakeInfos[199].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[198].poolIndex].poolId},${stakeEvents[198].signerAddress},${stakeEvents[198].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats199);
      console.log(
        `stakingPoolStatsAfterEvent198 after: ${JSON.stringify(stakingPoolStats[199].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[198].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos200,
        nextExpectStakingPoolStats: stakingPoolStats200,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[199],
        stakeEvents[103],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos199,
        stakingPoolStats199,
      );
      stakeInfos.push(stakeInfos200);
      console.log(
        `\nstakeInfoAfterEvent199 after: ${JSON.stringify(stakeInfos[200].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId},${stakeEvents[103].signerAddress},${stakeEvents[103].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats200);
      console.log(
        `stakingPoolStatsAfterEvent199 after: ${JSON.stringify(stakingPoolStats[200].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos201,
        nextExpectStakingPoolStats: stakingPoolStats201,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[200],
        stakeEvents[200],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos200,
        stakingPoolStats200,
      );
      stakeInfos.push(stakeInfos201);
      console.log(
        `\nstakeInfoAfterEvent200 after: ${JSON.stringify(stakeInfos[201].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[200].poolIndex].poolId},${stakeEvents[200].signerAddress},${stakeEvents[200].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats201);
      console.log(
        `stakingPoolStatsAfterEvent200 after: ${JSON.stringify(stakingPoolStats[201].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[200].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos202,
        nextExpectStakingPoolStats: stakingPoolStats202,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[201],
        stakeEvents[201],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos201,
        stakingPoolStats201,
      );
      stakeInfos.push(stakeInfos202);
      console.log(
        `\nstakeInfoAfterEvent201 after: ${JSON.stringify(stakeInfos[202].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[201].poolIndex].poolId},${stakeEvents[201].signerAddress},${stakeEvents[201].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats202);
      console.log(
        `stakingPoolStatsAfterEvent201 after: ${JSON.stringify(stakingPoolStats[202].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[201].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos203,
        nextExpectStakingPoolStats: stakingPoolStats203,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[202],
        stakeEvents[202],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos202,
        stakingPoolStats202,
      );
      stakeInfos.push(stakeInfos203);
      console.log(
        `\nstakeInfoAfterEvent202 after: ${JSON.stringify(stakeInfos[203].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[202].poolIndex].poolId},${stakeEvents[202].signerAddress},${stakeEvents[202].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats203);
      console.log(
        `stakingPoolStatsAfterEvent202 after: ${JSON.stringify(stakingPoolStats[203].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[202].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos204,
        nextExpectStakingPoolStats: stakingPoolStats204,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[203],
        stakeEvents[203],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos203,
        stakingPoolStats203,
      );
      stakeInfos.push(stakeInfos204);
      console.log(
        `\nstakeInfoAfterEvent203 after: ${JSON.stringify(stakeInfos[204].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId},${stakeEvents[203].signerAddress},${stakeEvents[203].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats204);
      console.log(
        `stakingPoolStatsAfterEvent203 after: ${JSON.stringify(stakingPoolStats[204].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos205,
        nextExpectStakingPoolStats: stakingPoolStats205,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[204],
        stakeEvents[204],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos204,
        stakingPoolStats204,
      );
      stakeInfos.push(stakeInfos205);
      console.log(
        `\nstakeInfoAfterEvent204 after: ${JSON.stringify(stakeInfos[205].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId},${stakeEvents[204].signerAddress},${stakeEvents[204].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats205);
      console.log(
        `stakingPoolStatsAfterEvent204 after: ${JSON.stringify(stakingPoolStats[205].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos206,
        nextExpectStakingPoolStats: stakingPoolStats206,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[205],
        stakeEvents[103],
        stakeEvents[199],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos205,
        stakingPoolStats205,
      );
      stakeInfos.push(stakeInfos206);
      console.log(
        `\nstakeInfoAfterEvent205 after: ${JSON.stringify(stakeInfos[206].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId},${stakeEvents[103].signerAddress},${stakeEvents[103].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats206);
      console.log(
        `stakingPoolStatsAfterEvent205 after: ${JSON.stringify(stakingPoolStats[206].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[103].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos207,
        nextExpectStakingPoolStats: stakingPoolStats207,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[206],
        stakeEvents[206],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos206,
        stakingPoolStats206,
      );
      stakeInfos.push(stakeInfos207);
      console.log(
        `\nstakeInfoAfterEvent206 after: ${JSON.stringify(stakeInfos[207].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId},${stakeEvents[206].signerAddress},${stakeEvents[206].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats207);
      console.log(
        `stakingPoolStatsAfterEvent206 after: ${JSON.stringify(stakingPoolStats[207].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos208,
        nextExpectStakingPoolStats: stakingPoolStats208,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[207],
        stakeEvents[207],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos207,
        stakingPoolStats207,
      );
      stakeInfos.push(stakeInfos208);
      console.log(
        `\nstakeInfoAfterEvent207 after: ${JSON.stringify(stakeInfos[208].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[207].poolIndex].poolId},${stakeEvents[207].signerAddress},${stakeEvents[207].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats208);
      console.log(
        `stakingPoolStatsAfterEvent207 after: ${JSON.stringify(stakingPoolStats[208].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[207].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos209,
        nextExpectStakingPoolStats: stakingPoolStats209,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[208],
        stakeEvents[208],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos208,
        stakingPoolStats208,
      );
      stakeInfos.push(stakeInfos209);
      console.log(
        `\nstakeInfoAfterEvent208 after: ${JSON.stringify(stakeInfos[209].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[208].poolIndex].poolId},${stakeEvents[208].signerAddress},${stakeEvents[208].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats209);
      console.log(
        `stakingPoolStatsAfterEvent208 after: ${JSON.stringify(stakingPoolStats[209].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[208].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos210,
        nextExpectStakingPoolStats: stakingPoolStats210,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[209],
        stakeEvents[209],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos209,
        stakingPoolStats209,
      );
      stakeInfos.push(stakeInfos210);
      stakingPoolStats.push(stakingPoolStats210);
      console.log(
        `stakingPoolStatsAfterEvent209 after: ${JSON.stringify(stakingPoolStats[210].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[209].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos211,
        nextExpectStakingPoolStats: stakingPoolStats211,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[210],
        stakeEvents[117],
        stakeEvents[190],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos210,
        stakingPoolStats210,
      );
      stakeInfos.push(stakeInfos211);
      console.log(
        `\nstakeInfoAfterEvent210 after: ${JSON.stringify(stakeInfos[211].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats211);
      console.log(
        `stakingPoolStatsAfterEvent210 after: ${JSON.stringify(stakingPoolStats[211].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos212,
        nextExpectStakingPoolStats: stakingPoolStats212,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[211],
        stakeEvents[211],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos211,
        stakingPoolStats211,
      );
      stakeInfos.push(stakeInfos212);
      console.log(
        `\nstakeInfoAfterEvent211 after: ${JSON.stringify(stakeInfos[212].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[211].poolIndex].poolId},${stakeEvents[211].signerAddress},${stakeEvents[211].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats212);
      console.log(
        `stakingPoolStatsAfterEvent211 after: ${JSON.stringify(stakingPoolStats[212].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[211].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos213,
        nextExpectStakingPoolStats: stakingPoolStats213,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[212],
        stakeEvents[212],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos212,
        stakingPoolStats212,
      );
      stakeInfos.push(stakeInfos213);
      console.log(
        `\nstakeInfoAfterEvent212 after: ${JSON.stringify(stakeInfos[213].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[212].poolIndex].poolId},${stakeEvents[212].signerAddress},${stakeEvents[212].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats213);
      console.log(
        `stakingPoolStatsAfterEvent212 after: ${JSON.stringify(stakingPoolStats[213].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[212].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos214,
        nextExpectStakingPoolStats: stakingPoolStats214,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[213],
        stakeEvents[172],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos213,
        stakingPoolStats213,
      );
      stakeInfos.push(stakeInfos214);
      console.log(
        `\nstakeInfoAfterEvent213 after: ${JSON.stringify(stakeInfos[214].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[172].poolIndex].poolId},${stakeEvents[172].signerAddress},${stakeEvents[172].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats214);
      console.log(
        `stakingPoolStatsAfterEvent213 after: ${JSON.stringify(stakingPoolStats[214].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[172].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos215,
        nextExpectStakingPoolStats: stakingPoolStats215,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[214],
        stakeEvents[214],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos214,
        stakingPoolStats214,
      );
      stakeInfos.push(stakeInfos215);
      console.log(
        `\nstakeInfoAfterEvent214 after: ${JSON.stringify(stakeInfos[215].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[214].poolIndex].poolId},${stakeEvents[214].signerAddress},${stakeEvents[214].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats215);
      console.log(
        `stakingPoolStatsAfterEvent214 after: ${JSON.stringify(stakingPoolStats[215].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[214].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos216,
        nextExpectStakingPoolStats: stakingPoolStats216,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[215],
        stakeEvents[215],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos215,
        stakingPoolStats215,
      );
      stakeInfos.push(stakeInfos216);
      console.log(
        `\nstakeInfoAfterEvent215 after: ${JSON.stringify(stakeInfos[216].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[215].poolIndex].poolId},${stakeEvents[215].signerAddress},${stakeEvents[215].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats216);
      console.log(
        `stakingPoolStatsAfterEvent215 after: ${JSON.stringify(stakingPoolStats[216].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[215].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos217,
        nextExpectStakingPoolStats: stakingPoolStats217,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[216],
        stakeEvents[216],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos216,
        stakingPoolStats216,
      );
      stakeInfos.push(stakeInfos217);
      stakingPoolStats.push(stakingPoolStats217);
      console.log(
        `stakingPoolStatsAfterEvent216 after: ${JSON.stringify(stakingPoolStats[217].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[216].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos218,
        nextExpectStakingPoolStats: stakingPoolStats218,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[217],
        stakeEvents[217],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos217,
        stakingPoolStats217,
      );
      stakeInfos.push(stakeInfos218);
      console.log(
        `\nstakeInfoAfterEvent217 after: ${JSON.stringify(stakeInfos[218].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[217].poolIndex].poolId},${stakeEvents[217].signerAddress},${stakeEvents[217].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats218);
      console.log(
        `stakingPoolStatsAfterEvent217 after: ${JSON.stringify(stakingPoolStats[218].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[217].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos219,
        nextExpectStakingPoolStats: stakingPoolStats219,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[218],
        stakeEvents[208],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos218,
        stakingPoolStats218,
      );
      stakeInfos.push(stakeInfos219);
      console.log(
        `\nstakeInfoAfterEvent218 after: ${JSON.stringify(stakeInfos[219].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[208].poolIndex].poolId},${stakeEvents[208].signerAddress},${stakeEvents[208].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats219);
      console.log(
        `stakingPoolStatsAfterEvent218 after: ${JSON.stringify(stakingPoolStats[219].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[208].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos220,
        nextExpectStakingPoolStats: stakingPoolStats220,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[219],
        stakeEvents[202],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos219,
        stakingPoolStats219,
      );
      stakeInfos.push(stakeInfos220);
      console.log(
        `\nstakeInfoAfterEvent219 after: ${JSON.stringify(stakeInfos[220].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[202].poolIndex].poolId},${stakeEvents[202].signerAddress},${stakeEvents[202].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats220);
      console.log(
        `stakingPoolStatsAfterEvent219 after: ${JSON.stringify(stakingPoolStats[220].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[202].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos221,
        nextExpectStakingPoolStats: stakingPoolStats221,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[220],
        stakeEvents[220],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos220,
        stakingPoolStats220,
      );
      stakeInfos.push(stakeInfos221);
      console.log(
        `\nstakeInfoAfterEvent220 after: ${JSON.stringify(stakeInfos[221].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[220].poolIndex].poolId},${stakeEvents[220].signerAddress},${stakeEvents[220].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats221);
      console.log(
        `stakingPoolStatsAfterEvent220 after: ${JSON.stringify(stakingPoolStats[221].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[220].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos222,
        nextExpectStakingPoolStats: stakingPoolStats222,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[221],
        stakeEvents[198],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos221,
        stakingPoolStats221,
      );
      stakeInfos.push(stakeInfos222);
      console.log(
        `\nstakeInfoAfterEvent221 after: ${JSON.stringify(stakeInfos[222].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[198].poolIndex].poolId},${stakeEvents[198].signerAddress},${stakeEvents[198].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats222);
      console.log(
        `stakingPoolStatsAfterEvent221 after: ${JSON.stringify(stakingPoolStats[222].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[198].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos223,
        nextExpectStakingPoolStats: stakingPoolStats223,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[222],
        stakeEvents[25],
        stakeEvents[34],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos222,
        stakingPoolStats222,
      );
      stakeInfos.push(stakeInfos223);
      console.log(
        `\nstakeInfoAfterEvent222 after: ${JSON.stringify(stakeInfos[223].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats223);
      console.log(
        `stakingPoolStatsAfterEvent222 after: ${JSON.stringify(stakingPoolStats[223].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos224,
        nextExpectStakingPoolStats: stakingPoolStats224,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[223],
        stakeEvents[223],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos223,
        stakingPoolStats223,
      );
      stakeInfos.push(stakeInfos224);
      console.log(
        `\nstakeInfoAfterEvent223 after: ${JSON.stringify(stakeInfos[224].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[223].poolIndex].poolId},${stakeEvents[223].signerAddress},${stakeEvents[223].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats224);
      console.log(
        `stakingPoolStatsAfterEvent223 after: ${JSON.stringify(stakingPoolStats[224].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[223].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos225,
        nextExpectStakingPoolStats: stakingPoolStats225,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[224],
        stakeEvents[117],
        stakeEvents[190],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos224,
        stakingPoolStats224,
      );
      stakeInfos.push(stakeInfos225);
      console.log(
        `\nstakeInfoAfterEvent224 after: ${JSON.stringify(stakeInfos[225].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId},${stakeEvents[117].signerAddress},${stakeEvents[117].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats225);
      console.log(
        `stakingPoolStatsAfterEvent224 after: ${JSON.stringify(stakingPoolStats[225].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[117].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos226,
        nextExpectStakingPoolStats: stakingPoolStats226,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[225],
        stakeEvents[2],
        stakeEvents[27],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos225,
        stakingPoolStats225,
      );
      stakeInfos.push(stakeInfos226);
      console.log(
        `\nstakeInfoAfterEvent225 after: ${JSON.stringify(stakeInfos[226].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats226);
      console.log(
        `stakingPoolStatsAfterEvent225 after: ${JSON.stringify(stakingPoolStats[226].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos227,
        nextExpectStakingPoolStats: stakingPoolStats227,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[226],
        stakeEvents[3],
        stakeEvents[13],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos226,
        stakingPoolStats226,
      );
      stakeInfos.push(stakeInfos227);
      console.log(
        `\nstakeInfoAfterEvent226 after: ${JSON.stringify(stakeInfos[227].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats227);
      console.log(
        `stakingPoolStatsAfterEvent226 after: ${JSON.stringify(stakingPoolStats[227].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos228,
        nextExpectStakingPoolStats: stakingPoolStats228,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[227],
        stakeEvents[227],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos227,
        stakingPoolStats227,
      );
      stakeInfos.push(stakeInfos228);
      stakingPoolStats.push(stakingPoolStats228);
      console.log(
        `stakingPoolStatsAfterEvent227 after: ${JSON.stringify(stakingPoolStats[228].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[227].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos229,
        nextExpectStakingPoolStats: stakingPoolStats229,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[228],
        stakeEvents[5],
        stakeEvents[23],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos228,
        stakingPoolStats228,
      );
      stakeInfos.push(stakeInfos229);
      console.log(
        `\nstakeInfoAfterEvent228 after: ${JSON.stringify(stakeInfos[229].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId},${stakeEvents[5].signerAddress},${stakeEvents[5].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats229);
      console.log(
        `stakingPoolStatsAfterEvent228 after: ${JSON.stringify(stakingPoolStats[229].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos230,
        nextExpectStakingPoolStats: stakingPoolStats230,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[229],
        stakeEvents[229],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos229,
        stakingPoolStats229,
      );
      stakeInfos.push(stakeInfos230);
      stakingPoolStats.push(stakingPoolStats230);
      console.log(
        `stakingPoolStatsAfterEvent229 after: ${JSON.stringify(stakingPoolStats[230].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[229].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos231,
        nextExpectStakingPoolStats: stakingPoolStats231,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[230],
        stakeEvents[206],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos230,
        stakingPoolStats230,
      );
      stakeInfos.push(stakeInfos231);
      console.log(
        `\nstakeInfoAfterEvent230 after: ${JSON.stringify(stakeInfos[231].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId},${stakeEvents[206].signerAddress},${stakeEvents[206].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats231);
      console.log(
        `stakingPoolStatsAfterEvent230 after: ${JSON.stringify(stakingPoolStats[231].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos232,
        nextExpectStakingPoolStats: stakingPoolStats232,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[231],
        stakeEvents[231],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos231,
        stakingPoolStats231,
      );
      stakeInfos.push(stakeInfos232);
      console.log(
        `\nstakeInfoAfterEvent231 after: ${JSON.stringify(stakeInfos[232].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[231].poolIndex].poolId},${stakeEvents[231].signerAddress},${stakeEvents[231].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats232);
      console.log(
        `stakingPoolStatsAfterEvent231 after: ${JSON.stringify(stakingPoolStats[232].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[231].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos233,
        nextExpectStakingPoolStats: stakingPoolStats233,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[232],
        stakeEvents[25],
        stakeEvents[34],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos232,
        stakingPoolStats232,
      );
      stakeInfos.push(stakeInfos233);
      console.log(
        `\nstakeInfoAfterEvent232 after: ${JSON.stringify(stakeInfos[233].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats233);
      console.log(
        `stakingPoolStatsAfterEvent232 after: ${JSON.stringify(stakingPoolStats[233].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos234,
        nextExpectStakingPoolStats: stakingPoolStats234,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[233],
        stakeEvents[203],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos233,
        stakingPoolStats233,
      );
      stakeInfos.push(stakeInfos234);
      console.log(
        `\nstakeInfoAfterEvent233 after: ${JSON.stringify(stakeInfos[234].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId},${stakeEvents[203].signerAddress},${stakeEvents[203].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats234);
      console.log(
        `stakingPoolStatsAfterEvent233 after: ${JSON.stringify(stakingPoolStats[234].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos235,
        nextExpectStakingPoolStats: stakingPoolStats235,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[234],
        stakeEvents[234],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos234,
        stakingPoolStats234,
      );
      stakeInfos.push(stakeInfos235);
      stakingPoolStats.push(stakingPoolStats235);
      console.log(
        `stakingPoolStatsAfterEvent234 after: ${JSON.stringify(stakingPoolStats[235].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[234].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos236,
        nextExpectStakingPoolStats: stakingPoolStats236,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[235],
        stakeEvents[26],
        stakeEvents[39],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos235,
        stakingPoolStats235,
      );
      stakeInfos.push(stakeInfos236);
      console.log(
        `\nstakeInfoAfterEvent235 after: ${JSON.stringify(stakeInfos[236].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId},${stakeEvents[26].signerAddress},${stakeEvents[26].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats236);
      console.log(
        `stakingPoolStatsAfterEvent235 after: ${JSON.stringify(stakingPoolStats[236].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos237,
        nextExpectStakingPoolStats: stakingPoolStats237,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[236],
        stakeEvents[5],
        stakeEvents[23],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos236,
        stakingPoolStats236,
      );
      stakeInfos.push(stakeInfos237);
      console.log(
        `\nstakeInfoAfterEvent236 after: ${JSON.stringify(stakeInfos[237].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId},${stakeEvents[5].signerAddress},${stakeEvents[5].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats237);
      console.log(
        `stakingPoolStatsAfterEvent236 after: ${JSON.stringify(stakingPoolStats[237].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos238,
        nextExpectStakingPoolStats: stakingPoolStats238,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[237],
        stakeEvents[204],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos237,
        stakingPoolStats237,
      );
      stakeInfos.push(stakeInfos238);
      console.log(
        `\nstakeInfoAfterEvent237 after: ${JSON.stringify(stakeInfos[238].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId},${stakeEvents[204].signerAddress},${stakeEvents[204].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats238);
      console.log(
        `stakingPoolStatsAfterEvent237 after: ${JSON.stringify(stakingPoolStats[238].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos239,
        nextExpectStakingPoolStats: stakingPoolStats239,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[238],
        stakeEvents[238],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos238,
        stakingPoolStats238,
      );
      stakeInfos.push(stakeInfos239);
      stakingPoolStats.push(stakingPoolStats239);
      console.log(
        `stakingPoolStatsAfterEvent238 after: ${JSON.stringify(stakingPoolStats[239].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[238].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos240,
        nextExpectStakingPoolStats: stakingPoolStats240,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[239],
        stakeEvents[25],
        stakeEvents[34],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos239,
        stakingPoolStats239,
      );
      stakeInfos.push(stakeInfos240);
      console.log(
        `\nstakeInfoAfterEvent239 after: ${JSON.stringify(stakeInfos[240].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId},${stakeEvents[25].signerAddress},${stakeEvents[25].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats240);
      console.log(
        `stakingPoolStatsAfterEvent239 after: ${JSON.stringify(stakingPoolStats[240].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[25].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos241,
        nextExpectStakingPoolStats: stakingPoolStats241,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[240],
        stakeEvents[240],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos240,
        stakingPoolStats240,
      );
      stakeInfos.push(stakeInfos241);
      console.log(
        `\nstakeInfoAfterEvent240 after: ${JSON.stringify(stakeInfos[241].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[240].poolIndex].poolId},${stakeEvents[240].signerAddress},${stakeEvents[240].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats241);
      console.log(
        `stakingPoolStatsAfterEvent240 after: ${JSON.stringify(stakingPoolStats[241].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[240].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos242,
        nextExpectStakingPoolStats: stakingPoolStats242,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[241],
        stakeEvents[206],
        stakeEvents[230],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos241,
        stakingPoolStats241,
      );
      stakeInfos.push(stakeInfos242);
      console.log(
        `\nstakeInfoAfterEvent241 after: ${JSON.stringify(stakeInfos[242].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId},${stakeEvents[206].signerAddress},${stakeEvents[206].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats242);
      console.log(
        `stakingPoolStatsAfterEvent241 after: ${JSON.stringify(stakingPoolStats[242].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos243,
        nextExpectStakingPoolStats: stakingPoolStats243,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[242],
        stakeEvents[3],
        stakeEvents[13],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos242,
        stakingPoolStats242,
      );
      stakeInfos.push(stakeInfos243);
      console.log(
        `\nstakeInfoAfterEvent242 after: ${JSON.stringify(stakeInfos[243].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId},${stakeEvents[3].signerAddress},${stakeEvents[3].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats243);
      console.log(
        `stakingPoolStatsAfterEvent242 after: ${JSON.stringify(stakingPoolStats[243].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[3].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos244,
        nextExpectStakingPoolStats: stakingPoolStats244,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[243],
        stakeEvents[243],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos243,
        stakingPoolStats243,
      );
      stakeInfos.push(stakeInfos244);
      console.log(
        `\nstakeInfoAfterEvent243 after: ${JSON.stringify(stakeInfos[244].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[243].poolIndex].poolId},${stakeEvents[243].signerAddress},${stakeEvents[243].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats244);
      console.log(
        `stakingPoolStatsAfterEvent243 after: ${JSON.stringify(stakingPoolStats[244].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[243].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos245,
        nextExpectStakingPoolStats: stakingPoolStats245,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[244],
        stakeEvents[203],
        stakeEvents[233],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos244,
        stakingPoolStats244,
      );
      stakeInfos.push(stakeInfos245);
      console.log(
        `\nstakeInfoAfterEvent244 after: ${JSON.stringify(stakeInfos[245].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId},${stakeEvents[203].signerAddress},${stakeEvents[203].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats245);
      console.log(
        `stakingPoolStatsAfterEvent244 after: ${JSON.stringify(stakingPoolStats[245].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos246,
        nextExpectStakingPoolStats: stakingPoolStats246,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[245],
        stakeEvents[245],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos245,
        stakingPoolStats245,
      );
      stakeInfos.push(stakeInfos246);
      console.log(
        `\nstakeInfoAfterEvent245 after: ${JSON.stringify(stakeInfos[246].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[245].poolIndex].poolId},${stakeEvents[245].signerAddress},${stakeEvents[245].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats246);
      console.log(
        `stakingPoolStatsAfterEvent245 after: ${JSON.stringify(stakingPoolStats[246].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[245].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos247,
        nextExpectStakingPoolStats: stakingPoolStats247,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[246],
        stakeEvents[206],
        stakeEvents[230],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos246,
        stakingPoolStats246,
      );
      stakeInfos.push(stakeInfos247);
      console.log(
        `\nstakeInfoAfterEvent246 after: ${JSON.stringify(stakeInfos[247].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId},${stakeEvents[206].signerAddress},${stakeEvents[206].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats247);
      console.log(
        `stakingPoolStatsAfterEvent246 after: ${JSON.stringify(stakingPoolStats[247].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[206].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos248,
        nextExpectStakingPoolStats: stakingPoolStats248,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[247],
        stakeEvents[247],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos247,
        stakingPoolStats247,
      );
      stakeInfos.push(stakeInfos248);
      stakingPoolStats.push(stakingPoolStats248);
      console.log(
        `stakingPoolStatsAfterEvent247 after: ${JSON.stringify(stakingPoolStats[248].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[247].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos249,
        nextExpectStakingPoolStats: stakingPoolStats249,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[248],
        stakeEvents[4],
        stakeEvents[7],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos248,
        stakingPoolStats248,
      );
      stakeInfos.push(stakeInfos249);
      console.log(
        `\nstakeInfoAfterEvent248 after: ${JSON.stringify(stakeInfos[249].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats249);
      console.log(
        `stakingPoolStatsAfterEvent248 after: ${JSON.stringify(stakingPoolStats[249].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos250,
        nextExpectStakingPoolStats: stakingPoolStats250,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[249],
        stakeEvents[2],
        stakeEvents[27],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos249,
        stakingPoolStats249,
      );
      stakeInfos.push(stakeInfos250);
      console.log(
        `\nstakeInfoAfterEvent249 after: ${JSON.stringify(stakeInfos[250].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats250);
      console.log(
        `stakingPoolStatsAfterEvent249 after: ${JSON.stringify(stakingPoolStats[250].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos251,
        nextExpectStakingPoolStats: stakingPoolStats251,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[250],
        stakeEvents[204],
        stakeEvents[237],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos250,
        stakingPoolStats250,
      );
      stakeInfos.push(stakeInfos251);
      console.log(
        `\nstakeInfoAfterEvent250 after: ${JSON.stringify(stakeInfos[251].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId},${stakeEvents[204].signerAddress},${stakeEvents[204].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats251);
      console.log(
        `stakingPoolStatsAfterEvent250 after: ${JSON.stringify(stakingPoolStats[251].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos252,
        nextExpectStakingPoolStats: stakingPoolStats252,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[251],
        stakeEvents[5],
        stakeEvents[23],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos251,
        stakingPoolStats251,
      );
      stakeInfos.push(stakeInfos252);
      console.log(
        `\nstakeInfoAfterEvent251 after: ${JSON.stringify(stakeInfos[252].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId},${stakeEvents[5].signerAddress},${stakeEvents[5].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats252);
      console.log(
        `stakingPoolStatsAfterEvent251 after: ${JSON.stringify(stakingPoolStats[252].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[5].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos253,
        nextExpectStakingPoolStats: stakingPoolStats253,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[252],
        stakeEvents[26],
        stakeEvents[39],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos252,
        stakingPoolStats252,
      );
      stakeInfos.push(stakeInfos253);
      console.log(
        `\nstakeInfoAfterEvent252 after: ${JSON.stringify(stakeInfos[253].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId},${stakeEvents[26].signerAddress},${stakeEvents[26].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats253);
      console.log(
        `stakingPoolStatsAfterEvent252 after: ${JSON.stringify(stakingPoolStats[253].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[26].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos254,
        nextExpectStakingPoolStats: stakingPoolStats254,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[253],
        stakeEvents[203],
        stakeEvents[233],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos253,
        stakingPoolStats253,
      );
      stakeInfos.push(stakeInfos254);
      console.log(
        `\nstakeInfoAfterEvent253 after: ${JSON.stringify(stakeInfos[254].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId},${stakeEvents[203].signerAddress},${stakeEvents[203].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats254);
      console.log(
        `stakingPoolStatsAfterEvent253 after: ${JSON.stringify(stakingPoolStats[254].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[203].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos255,
        nextExpectStakingPoolStats: stakingPoolStats255,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[254],
        stakeEvents[2],
        stakeEvents[27],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos254,
        stakingPoolStats254,
      );
      stakeInfos.push(stakeInfos255);
      console.log(
        `\nstakeInfoAfterEvent254 after: ${JSON.stringify(stakeInfos[255].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId},${stakeEvents[2].signerAddress},${stakeEvents[2].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats255);
      console.log(
        `stakingPoolStatsAfterEvent254 after: ${JSON.stringify(stakingPoolStats[255].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[2].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos256,
        nextExpectStakingPoolStats: stakingPoolStats256,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[255],
        stakeEvents[204],
        stakeEvents[237],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos255,
        stakingPoolStats255,
      );
      stakeInfos.push(stakeInfos256);
      console.log(
        `\nstakeInfoAfterEvent255 after: ${JSON.stringify(stakeInfos[256].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId},${stakeEvents[204].signerAddress},${stakeEvents[204].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats256);
      console.log(
        `stakingPoolStatsAfterEvent255 after: ${JSON.stringify(stakingPoolStats[256].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[204].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos257,
        nextExpectStakingPoolStats: stakingPoolStats257,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[256],
        stakeEvents[4],
        stakeEvents[7],
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos256,
        stakingPoolStats256,
      );
      stakeInfos.push(stakeInfos257);
      console.log(
        `\nstakeInfoAfterEvent256 after: ${JSON.stringify(stakeInfos[257].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId},${stakeEvents[4].signerAddress},${stakeEvents[4].stakeId}`))}`,
      );
      stakingPoolStats.push(stakingPoolStats257);
      console.log(
        `stakingPoolStatsAfterEvent256 after: ${JSON.stringify(stakingPoolStats[257].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[4].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos258,
        nextExpectStakingPoolStats: stakingPoolStats258,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[257],
        stakeEvents[257],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos257,
        stakingPoolStats257,
      );
      stakeInfos.push(stakeInfos258);
      stakingPoolStats.push(stakingPoolStats258);
      console.log(
        `stakingPoolStatsAfterEvent257 after: ${JSON.stringify(stakingPoolStats[258].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[257].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos259,
        nextExpectStakingPoolStats: stakingPoolStats259,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[258],
        stakeEvents[258],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos258,
        stakingPoolStats258,
      );
      stakeInfos.push(stakeInfos259);
      stakingPoolStats.push(stakingPoolStats259);
      console.log(
        `stakingPoolStatsAfterEvent258 after: ${JSON.stringify(stakingPoolStats[259].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[258].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos260,
        nextExpectStakingPoolStats: stakingPoolStats260,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[259],
        stakeEvents[259],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos259,
        stakingPoolStats259,
      );
      stakeInfos.push(stakeInfos260);
      stakingPoolStats.push(stakingPoolStats260);
      console.log(
        `stakingPoolStatsAfterEvent259 after: ${JSON.stringify(stakingPoolStats[260].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[259].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos261,
        nextExpectStakingPoolStats: stakingPoolStats261,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[260],
        stakeEvents[260],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos260,
        stakingPoolStats260,
      );
      stakeInfos.push(stakeInfos261);
      stakingPoolStats.push(stakingPoolStats261);
      console.log(
        `stakingPoolStatsAfterEvent260 after: ${JSON.stringify(stakingPoolStats[261].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[260].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos262,
        nextExpectStakingPoolStats: stakingPoolStats262,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[261],
        stakeEvents[261],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos261,
        stakingPoolStats261,
      );
      stakeInfos.push(stakeInfos262);
      stakingPoolStats.push(stakingPoolStats262);
      console.log(
        `stakingPoolStatsAfterEvent261 after: ${JSON.stringify(stakingPoolStats[262].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[261].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos263,
        nextExpectStakingPoolStats: stakingPoolStats263,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[262],
        stakeEvents[262],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos262,
        stakingPoolStats262,
      );
      stakeInfos.push(stakeInfos263);
      stakingPoolStats.push(stakingPoolStats263);
      console.log(
        `stakingPoolStatsAfterEvent262 after: ${JSON.stringify(stakingPoolStats[263].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[262].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos264,
        nextExpectStakingPoolStats: stakingPoolStats264,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[263],
        stakeEvents[263],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos263,
        stakingPoolStats263,
      );
      stakeInfos.push(stakeInfos264);
      stakingPoolStats.push(stakingPoolStats264);
      console.log(
        `stakingPoolStatsAfterEvent263 after: ${JSON.stringify(stakingPoolStats[264].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[263].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos265,
        nextExpectStakingPoolStats: stakingPoolStats265,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[264],
        stakeEvents[264],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos264,
        stakingPoolStats264,
      );
      stakeInfos.push(stakeInfos265);
      stakingPoolStats.push(stakingPoolStats265);
      console.log(
        `stakingPoolStatsAfterEvent264 after: ${JSON.stringify(stakingPoolStats[265].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[264].poolIndex].poolId}`))}`,
      );

      const {
        nextExpectStakeInfos: stakeInfos266,
        nextExpectStakingPoolStats: stakingPoolStats266,
      } = stakeServiceHelpers.getNextExpectStakeInfoStakingPoolStats(
        stakeEvents[265],
        stakeEvents[265],
        null,
        stakingPoolStakeRewardTokenSameConfigs,
        stakeInfos265,
        stakingPoolStats265,
      );
      stakeInfos.push(stakeInfos266);
      stakingPoolStats.push(stakingPoolStats266);
      console.log(
        `stakingPoolStatsAfterEvent265 after: ${JSON.stringify(stakingPoolStats[266].get(`${stakingPoolStakeRewardTokenSameConfigs[stakeEvents[265].poolIndex].poolId}`))}`,
      );

      await stakeServiceHelpers.testStakeClaimRevokeUnstakeWithdraw(
        stakingServiceInstance,
        stakingPoolStakeRewardTokenSameConfigs,
        contractAdminRoleAccounts[1],
        stakeEvents,
        stakeInfos,
        stakingPoolStats,
      );
    });
  });
});
