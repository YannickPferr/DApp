const YPCSwap = artifacts.require("YPCSwap");
const YannickPferrCoin = artifacts.require("YannickPferrCoin");

module.exports = function (deployer) {
  deployer.deploy(YPCSwap);
};
