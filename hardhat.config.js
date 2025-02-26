require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("@nomicfoundation/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.28",
// };

// const INFURA_API_KEY = process.env.INFURA_API_KEY;
// const NETWORK_URL_SEPOLIA = `https://${process.env.INFURA_URL_SEPOLIA}${INFURA_API_KEY}`;
// const NETWORK_URL_MAINNET = `https://:${process.env.INFURA_URL_MAINNET}${INFURA_API_KEY}`;

module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    // mainnet: {
    //   url: NETWORK_URL_MAINNET,
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    //   // gasPrice: "auto",
    // },
    // sepolia: {
    //   url: NETWORK_URL_SEPOLIA,
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    // },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,
  // },
  solidity: {
    // Note - needs a low optimization run due to Ecliptic contract size
    compilers: [
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1,
          },
        },
      },
    ],
  },
  sourcify: {
    enabled: true,
  },
};
