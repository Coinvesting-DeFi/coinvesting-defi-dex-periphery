const Router = artifacts.require("CoinvestingDeFiRouter");

module.exports = async function (deployer) {
  await deployer.deploy(Router, process.env.FACTORY, process.env.WETH);
};
