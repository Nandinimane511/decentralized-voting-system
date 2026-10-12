require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    // Default Ganache GUI setup (Port 7545)
    ganache: {
      url: "http://127.0.0.1:7545",
      // chainId: 1337 or 5777 depending on Ganache version
    },
    // Ganache CLI / Hardhat local node (Port 8545)
    localhost: {
      url: "http://127.0.0.1:8545",
    }
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
  }
};
