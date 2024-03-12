const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const testHelpers = require("./test-helpers.js");

describe("TransferErc20", function () {
  const TOKEN_0_DECIMALS_CAP_WEI = ethers.utils.parseEther("10000000000");
  const TOKEN_0_DECIMALS_NAME = "Mock ERC20 0 Decimals";
  const TOKEN_0_DECIMALS_SYMBOL = "M00DE20";

  const TOKEN_6_DECIMALS_CAP_WEI = ethers.utils.parseEther("10000000000");
  const TOKEN_6_DECIMALS_NAME = "Mock ERC20 6 Decimals";
  const TOKEN_6_DECIMALS_SYMBOL = "M06DE20";

  const TOKEN_18_DECIMALS_CAP_WEI = ethers.utils.parseEther("10000000000");
  const TOKEN_18_DECIMALS_NAME = "Mock ERC20 18 Decimals";
  const TOKEN_18_DECIMALS_SYMBOL = "M18DE20";

  const TOKEN_DEPOSIT_AMOUNT_WEI = ethers.utils.parseEther("1000000");

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, ...otherAccounts] = await ethers.getSigners();

    const transferErc20Instance = await testHelpers.newMockTransferErc20();

    const token0DecimalsInstance =
      await testHelpers.newMockErc20TokenWithDeposit(
        TOKEN_0_DECIMALS_NAME,
        TOKEN_0_DECIMALS_SYMBOL,
        0,
        TOKEN_0_DECIMALS_CAP_WEI,
        owner,
        [transferErc20Instance.address],
        [TOKEN_DEPOSIT_AMOUNT_WEI],
      );

    const token6DecimalsInstance =
      await testHelpers.newMockErc20TokenWithDeposit(
        TOKEN_6_DECIMALS_NAME,
        TOKEN_6_DECIMALS_SYMBOL,
        6,
        TOKEN_6_DECIMALS_CAP_WEI,
        owner,
        [transferErc20Instance.address],
        [TOKEN_DEPOSIT_AMOUNT_WEI],
      );

    const token18DecimalsInstance =
      await testHelpers.newMockErc20TokenWithDeposit(
        TOKEN_18_DECIMALS_NAME,
        TOKEN_18_DECIMALS_SYMBOL,
        18,
        TOKEN_18_DECIMALS_CAP_WEI,
        owner,
        [transferErc20Instance.address],
        [TOKEN_DEPOSIT_AMOUNT_WEI],
      );

    return {
      transferErc20Instance,
      token0DecimalsInstance,
      token6DecimalsInstance,
      token18DecimalsInstance,
      owner,
      otherAccounts,
    };
  }

  async function approveAndTransferFromSenderToAccountWithVerify(
    tokenInstance,
    tokenDecimals,
    sender,
    toAccount,
    weiAmount,
  ) {
    const senderAddress = await sender.getAddress();
    const toAddress = await toAccount.getAddress();
    const decimalsAmount = testHelpers.scaleWeiToDecimals(
      weiAmount,
      tokenDecimals,
    );

    const transferTransactionResponse = await tokenInstance
      .connect(owner)
      .transfer(senderAddress, decimalsAmount);

    const transferTransactionReceipt = await transferTransactionResponse.wait();

    await testHelpers.approveTransferWithVerify(
      tokenInstance,
      sender,
      transferErc20Instance.address,
      weiAmount,
    );

    const transferTokensFromSenderToAccountTransaction = transferErc20Instance
      .connect(sender)
      .transferTokensFromSenderToAccount(
        tokenInstance.address,
        tokenDecimals,
        weiAmount,
        toAddress,
      );

    await expect(transferTokensFromSenderToAccountTransaction)
      .to.emit(tokenInstance, "Transfer")
      .withArgs(senderAddress, toAddress, decimalsAmount);

    await expect(
      transferTokensFromSenderToAccountTransaction,
    ).to.changeTokenBalances(
      tokenInstance,
      [sender, toAccount],
      [testHelpers.bnNeg(decimalsAmount), decimalsAmount],
    );
  }

  async function approveAndTransferFromSenderToContractWithVerify(
    tokenInstance,
    tokenDecimals,
    sender,
    weiAmount,
  ) {
    const senderAddress = await sender.getAddress();
    const decimalsAmount = testHelpers.scaleWeiToDecimals(
      weiAmount,
      tokenDecimals,
    );

    const transferTransactionResponse = await tokenInstance
      .connect(owner)
      .transfer(senderAddress, decimalsAmount);

    const transferTransactionReceipt = await transferTransactionResponse.wait();

    await testHelpers.approveTransferWithVerify(
      tokenInstance,
      sender,
      transferErc20Instance.address,
      weiAmount,
    );

    const transferTokensFromSenderToContractTransaction = transferErc20Instance
      .connect(sender)
      .transferTokensFromSenderToContract(
        tokenInstance.address,
        tokenDecimals,
        weiAmount,
      );

    await expect(transferTokensFromSenderToContractTransaction)
      .to.emit(tokenInstance, "Transfer")
      .withArgs(senderAddress, transferErc20Instance.address, decimalsAmount);

    await expect(
      transferTokensFromSenderToContractTransaction,
    ).to.changeTokenBalances(
      tokenInstance,
      [sender, transferErc20Instance],
      [testHelpers.bnNeg(decimalsAmount), decimalsAmount],
    );
  }

  async function transferFromContractToAccountWithVerify(
    tokenInstance,
    tokenDecimals,
    sender,
    toAccount,
    weiAmount,
  ) {
    const toAddress = await toAccount.getAddress();
    const decimalsAmount = testHelpers.scaleWeiToDecimals(
      weiAmount,
      tokenDecimals,
    );

    const transferTokensFromContractToAccountTransaction = transferErc20Instance
      .connect(sender)
      .transferTokensFromContractToAccount(
        tokenInstance.address,
        tokenDecimals,
        weiAmount,
        toAddress,
      );

    await expect(transferTokensFromContractToAccountTransaction)
      .to.emit(tokenInstance, "Transfer")
      .withArgs(transferErc20Instance.address, toAddress, decimalsAmount);

    await expect(
      transferTokensFromContractToAccountTransaction,
    ).to.changeTokenBalances(
      tokenInstance,
      [transferErc20Instance, toAccount],
      [testHelpers.bnNeg(decimalsAmount), decimalsAmount],
    );
  }

  let transferErc20Instance;
  let token0DecimalsInstance;
  let token6DecimalsInstance;
  let token18DecimalsInstance;
  let owner;
  let otherAccounts;

  beforeEach(async () => {
    ({
      transferErc20Instance,
      token0DecimalsInstance,
      token6DecimalsInstance,
      token18DecimalsInstance,
      owner,
      otherAccounts,
    } = await loadFixture(deployFixture));
  });

  describe("Transfer ERC20 tokens from calling contract to given account", function () {
    it("0 Decimals: Should be able to transfer ERC20 tokens from calling contract to given account", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 0;
      const weiAmount = ethers.utils.parseEther("46840.815447540670016000");

      await transferFromContractToAccountWithVerify(
        token0DecimalsInstance,
        tokenDecimals,
        sender,
        toAccount,
        weiAmount,
      );
    });

    it("6 Decimals: Should be able to transfer ERC20 tokens from calling contract to given account", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 6;
      const weiAmount = ethers.utils.parseEther("634346.455557912450793000");

      await transferFromContractToAccountWithVerify(
        token6DecimalsInstance,
        tokenDecimals,
        sender,
        toAccount,
        weiAmount,
      );
    });

    it("18 Decimals: Should be able to transfer ERC20 tokens from calling contract to given account", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 18;
      const weiAmount = ethers.utils.parseEther("0.900719925474099330");

      await transferFromContractToAccountWithVerify(
        token18DecimalsInstance,
        tokenDecimals,
        sender,
        toAccount,
        weiAmount,
      );
    });

    it("Should revert with the right error if token decimals is more than 18 decimals", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 19;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      const toAddress = await toAccount.getAddress();

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token0DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token6DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token18DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");
    });

    it("Should revert with the right error for zero wei amount", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const weiAmount = ethers.constants.Zero;

      const toAddress = await toAccount.getAddress();

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token0DecimalsInstance.address,
            0,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token6DecimalsInstance.address,
            6,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token18DecimalsInstance.address,
            18,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");
    });

    it("Should revert with the right error for zero to address", async () => {
      const sender = otherAccounts[8];
      const toAddress = ethers.constants.AddressZero;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token0DecimalsInstance.address,
            0,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: account");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token6DecimalsInstance.address,
            6,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: account");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token18DecimalsInstance.address,
            18,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: account");
    });

    it("Should revert with the right error for zero decimals amount", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];

      const toAddress = await toAccount.getAddress();

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token0DecimalsInstance.address,
            0,
            ethers.utils.parseEther("0.999999999999999999"),
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: decimals amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromContractToAccount(
            token6DecimalsInstance.address,
            6,
            ethers.utils.parseEther("0.000000999999999999"),
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: decimals amount");
    });
  });

  describe("Transfer ERC20 tokens from sender to given account", function () {
    it("0 Decimals: Should be able to transfer ERC20 tokens from sender to given account", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 0;
      const weiAmount = ethers.utils.parseEther("57891.655720868231015000");

      await approveAndTransferFromSenderToAccountWithVerify(
        token0DecimalsInstance,
        tokenDecimals,
        sender,
        toAccount,
        weiAmount,
      );
    });

    it("6 Decimals: Should be able to transfer ERC20 tokens from sender to given account", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 6;
      const weiAmount = ethers.utils.parseEther("910703.964144");

      await approveAndTransferFromSenderToAccountWithVerify(
        token6DecimalsInstance,
        tokenDecimals,
        sender,
        toAccount,
        weiAmount,
      );
    });

    it("18 Decimals: Should be able to transfer ERC20 tokens from sender to given account", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 18;
      const weiAmount = ethers.utils.parseEther("0.900719925474099330");

      await approveAndTransferFromSenderToAccountWithVerify(
        token18DecimalsInstance,
        tokenDecimals,
        sender,
        toAccount,
        weiAmount,
      );
    });

    it("Should revert with the right error if token decimals is more than 18 decimals", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const tokenDecimals = 19;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      const toAddress = await toAccount.getAddress();

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token0DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token6DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token18DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");
    });

    it("Should revert with the right error for zero wei amount", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];
      const weiAmount = ethers.constants.Zero;

      const toAddress = await toAccount.getAddress();

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token0DecimalsInstance.address,
            0,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token6DecimalsInstance.address,
            6,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token18DecimalsInstance.address,
            18,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");
    });

    it("Should revert with the right error for zero to address", async () => {
      const sender = otherAccounts[8];
      const toAddress = ethers.constants.AddressZero;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token0DecimalsInstance.address,
            0,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: account");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token6DecimalsInstance.address,
            6,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: account");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token18DecimalsInstance.address,
            18,
            weiAmount,
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: account");
    });

    it("Should revert with the right error for zero decimals amount", async () => {
      const sender = otherAccounts[8];
      const toAccount = otherAccounts[9];

      const toAddress = await toAccount.getAddress();

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token0DecimalsInstance.address,
            0,
            ethers.utils.parseEther("0.999999999999999999"),
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: decimals amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToAccount(
            token6DecimalsInstance.address,
            6,
            ethers.utils.parseEther("0.000000999999999999"),
            toAddress,
          ),
      ).to.be.revertedWith("TransferErc20: decimals amount");
    });
  });

  describe("Transfer ERC20 tokens from sender to contract", function () {
    it("0 Decimals: Should be able to transfer ERC20 tokens from sender to contract", async () => {
      const sender = otherAccounts[8];
      const tokenDecimals = 0;
      const weiAmount = ethers.utils.parseEther("57891.655720868231015000");

      await approveAndTransferFromSenderToContractWithVerify(
        token0DecimalsInstance,
        tokenDecimals,
        sender,
        weiAmount,
      );
    });

    it("6 Decimals: Should be able to transfer ERC20 tokens from sender to contract", async () => {
      const sender = otherAccounts[8];
      const tokenDecimals = 6;
      const weiAmount = ethers.utils.parseEther("910703.964144");

      await approveAndTransferFromSenderToContractWithVerify(
        token6DecimalsInstance,
        tokenDecimals,
        sender,
        weiAmount,
      );
    });

    it("18 Decimals: Should be able to transfer ERC20 tokens from sender to contract", async () => {
      const sender = otherAccounts[8];
      const tokenDecimals = 18;
      const weiAmount = ethers.utils.parseEther("0.900719925474099330");

      await approveAndTransferFromSenderToContractWithVerify(
        token18DecimalsInstance,
        tokenDecimals,
        sender,
        weiAmount,
      );
    });

    it("Should revert with the right error if token decimals is more than 18 decimals", async () => {
      const sender = otherAccounts[8];
      const tokenDecimals = 19;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token0DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token6DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token18DecimalsInstance.address,
            tokenDecimals,
            weiAmount,
          ),
      ).to.be.revertedWith("TransferErc20: token decimals");
    });

    it("Should revert with the right error for zero wei amount", async () => {
      const sender = otherAccounts[8];
      const weiAmount = ethers.constants.Zero;

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token0DecimalsInstance.address,
            0,
            weiAmount,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token6DecimalsInstance.address,
            6,
            weiAmount,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token18DecimalsInstance.address,
            18,
            weiAmount,
          ),
      ).to.be.revertedWith("TransferErc20: wei amount");
    });

    it("Should revert with the right error for zero decimals amount", async () => {
      const sender = otherAccounts[8];

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token0DecimalsInstance.address,
            0,
            ethers.utils.parseEther("0.999999999999999999"),
          ),
      ).to.be.revertedWith("TransferErc20: decimals amount");

      await expect(
        transferErc20Instance
          .connect(sender)
          .transferTokensFromSenderToContract(
            token6DecimalsInstance.address,
            6,
            ethers.utils.parseEther("0.000000999999999999"),
          ),
      ).to.be.revertedWith("TransferErc20: decimals amount");
    });
  });
});
