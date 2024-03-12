const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const testHelpers = require("./test-helpers.js");

describe("UnitConverter", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, ...otherAccounts] = await ethers.getSigners();

    const unitConverterInstance = await testHelpers.newMockUnitConverter();

    return { unitConverterInstance, owner, otherAccounts };
  }

  let unitConverterInstance;
  let owner;
  let otherAccounts;

  beforeEach(async () => {
    ({ unitConverterInstance, owner, otherAccounts } =
      await loadFixture(deployFixture));
  });

  describe("Scale Wei to Decimals", function () {
    it("0 Decimals: Should scale correctly from wei to decimals", async () => {
      const tokenDecimals = 0;
      const weiAmount = ethers.utils.parseEther("46840.815447540670016000");
      const expectDecimalsAmount = ethers.BigNumber.from("46840");

      const decimalsAmount = await unitConverterInstance.scaleWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("6 Decimals: Should scale correctly from wei to decimals", async () => {
      const tokenDecimals = 6;
      const weiAmount = ethers.utils.parseEther("634346.455557912450793000");
      const expectDecimalsAmount = ethers.BigNumber.from("634346455557");

      const decimalsAmount = await unitConverterInstance.scaleWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("18 Decimals: Should scale correctly from wei to decimals", async () => {
      const tokenDecimals = 18;
      const weiAmount = ethers.utils.parseEther("735442.455714068783403000");
      const expectDecimalsAmount = ethers.utils.parseEther(
        "735442.455714068783403000",
      );

      const decimalsAmount = await unitConverterInstance.scaleWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("0 Decimals: Should scale correctly from wei to decimals for zero amount", async () => {
      const tokenDecimals = 0;
      const weiAmount = ethers.constants.Zero;
      const expectDecimalsAmount = ethers.constants.Zero;

      const decimalsAmount = await unitConverterInstance.scaleWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("6 Decimals: Should scale correctly from wei to decimals for zero amount", async () => {
      const tokenDecimals = 6;
      const weiAmount = ethers.constants.Zero;
      const expectDecimalsAmount = ethers.constants.Zero;

      const decimalsAmount = await unitConverterInstance.scaleWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("18 Decimals: Should scale correctly from wei to decimals for zero amount", async () => {
      const tokenDecimals = 18;
      const weiAmount = ethers.constants.Zero;
      const expectDecimalsAmount = ethers.constants.Zero;

      const decimalsAmount = await unitConverterInstance.scaleWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("Should revert with the right error if scale from wei to decimals for more than 18 decimals", async () => {
      const tokenDecimals = 19;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      await expect(
        unitConverterInstance.scaleWeiToDecimals(weiAmount, tokenDecimals),
      ).to.be.revertedWith("UnitConverter: decimals");
    });
  });

  describe("Scale Decimals to Wei", function () {
    it("0 Decimals: Should scale correctly from decimals to wei", async () => {
      const tokenDecimals = 0;
      const decimalsAmount = ethers.BigNumber.from("174532");
      const expectWeiAmount = ethers.utils.parseEther("174532");

      const weiAmount = await unitConverterInstance.scaleDecimalsToWei(
        decimalsAmount,
        tokenDecimals,
      );

      expect(weiAmount).to.equal(expectWeiAmount);
    });

    it("6 Decimals: Should scale correctly from decimals to wei", async () => {
      const tokenDecimals = 6;
      const decimalsAmount = ethers.BigNumber.from("910703964144");
      const expectWeiAmount = ethers.utils.parseEther("910703.964144");

      const weiAmount = await unitConverterInstance.scaleDecimalsToWei(
        decimalsAmount,
        tokenDecimals,
      );

      expect(weiAmount).to.equal(expectWeiAmount);
    });

    it("18 Decimals: Should scale correctly from decimals to wei", async () => {
      const tokenDecimals = 18;
      const decimalsAmount = ethers.utils.parseEther(
        "456784.566558246937155000",
      );
      const expectWeiAmount = ethers.utils.parseEther(
        "456784.566558246937155000",
      );

      const weiAmount = await unitConverterInstance.scaleDecimalsToWei(
        decimalsAmount,
        tokenDecimals,
      );

      expect(weiAmount).to.equal(expectWeiAmount);
    });

    it("0 Decimals: Should scale correctly from decimals to wei for zero amount", async () => {
      const tokenDecimals = 0;
      const decimalsAmount = ethers.constants.Zero;
      const expectWeiAmount = ethers.constants.Zero;

      const weiAmount = await unitConverterInstance.scaleDecimalsToWei(
        decimalsAmount,
        tokenDecimals,
      );

      expect(weiAmount).to.equal(expectWeiAmount);
    });

    it("6 Decimals: Should scale correctly from decimals to wei for zero amount", async () => {
      const tokenDecimals = 6;
      const decimalsAmount = ethers.constants.Zero;
      const expectWeiAmount = ethers.constants.Zero;

      const weiAmount = await unitConverterInstance.scaleDecimalsToWei(
        decimalsAmount,
        tokenDecimals,
      );

      expect(weiAmount).to.equal(expectWeiAmount);
    });

    it("18 Decimals: Should scale correctly from decimals to wei for zero amount", async () => {
      const tokenDecimals = 18;
      const decimalsAmount = ethers.constants.Zero;
      const expectWeiAmount = ethers.constants.Zero;

      const weiAmount = await unitConverterInstance.scaleDecimalsToWei(
        decimalsAmount,
        tokenDecimals,
      );

      expect(weiAmount).to.equal(expectWeiAmount);
    });

    it("Should revert with the right error if scale from decimals to wei for more than 18 decimals", async () => {
      const tokenDecimals = 19;
      const decimalsAmount = ethers.utils.parseEther(
        "287204138220471955815000",
      );

      await expect(
        unitConverterInstance.scaleDecimalsToWei(decimalsAmount, tokenDecimals),
      ).to.be.revertedWith("UnitConverter: decimals");
    });
  });

  describe("Truncate Wei to Decimals", function () {
    it("0 Decimals: Should truncate correctly from wei to decimals", async () => {
      const tokenDecimals = 0;
      const weiAmount = ethers.utils.parseEther("46840.815447540670016000");
      const expectDecimalsAmount = ethers.utils.parseEther("46840");

      const decimalsAmount = await unitConverterInstance.truncateWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("6 Decimals: Should truncate correctly from wei to decimals", async () => {
      const tokenDecimals = 6;
      const weiAmount = ethers.utils.parseEther("634346.455557912450793000");
      const expectDecimalsAmount = ethers.utils.parseEther("634346.455557");

      const decimalsAmount = await unitConverterInstance.truncateWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("18 Decimals: Should truncate correctly from wei to decimals", async () => {
      const tokenDecimals = 18;
      const weiAmount = ethers.utils.parseEther("735442.455714068783403000");
      const expectDecimalsAmount = ethers.utils.parseEther(
        "735442.455714068783403000",
      );

      const decimalsAmount = await unitConverterInstance.truncateWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("0 Decimals: Should truncate correctly from wei to decimals for zero amount", async () => {
      const tokenDecimals = 0;
      const weiAmount = ethers.constants.Zero;
      const expectDecimalsAmount = ethers.constants.Zero;

      const decimalsAmount = await unitConverterInstance.truncateWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("6 Decimals: Should truncate correctly from wei to decimals for zero amount", async () => {
      const tokenDecimals = 6;
      const weiAmount = ethers.constants.Zero;
      const expectDecimalsAmount = ethers.constants.Zero;

      const decimalsAmount = await unitConverterInstance.truncateWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("18 Decimals: Should truncate correctly from wei to decimals for zero amount", async () => {
      const tokenDecimals = 18;
      const weiAmount = ethers.constants.Zero;
      const expectDecimalsAmount = ethers.constants.Zero;

      const decimalsAmount = await unitConverterInstance.truncateWeiToDecimals(
        weiAmount,
        tokenDecimals,
      );

      expect(decimalsAmount).to.equal(expectDecimalsAmount);
    });

    it("Should revert with the right error if truncate from wei to decimals for more than 18 decimals", async () => {
      const tokenDecimals = 19;
      const weiAmount = ethers.utils.parseEther("875571.347998357194506000");

      await expect(
        unitConverterInstance.truncateWeiToDecimals(weiAmount, tokenDecimals),
      ).to.be.revertedWith("UnitConverter: decimals");
    });
  });
});
