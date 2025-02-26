# Project Name

URBIT Token - UIP-0132

## Contract Addresses

Currently deployed Sepolia contract addresses:

| Contract Name | Address                                      |
| ------------- | -------------------------------------------- |
| Azimuth       | `0xF07cD672D61453c29138c8db5b44fC9FA84811B5` |
| TokenTreasury | `0x9B4FBc6872227F1DC38b63C9bD68EF090acAA602` |
| PlanetToken   | `0xF3F55D64D57e7A812C3e5e4B6d36A851Df85787D` |
| Ecliptic      | `0x2E35a61198C383212CeF06C22f1E81B6b097135C` |
| Polls         | `0x3A3a06199Dc537FB56A6975A8B12A8eD7fCbf897` |
| Claims        | `0xdB164DBEF321e7DE938809fE35A5A8A928c4F4df` |

## Setup Instructions

This project uses Node.js v22.13.0. If you're using `nvm`, run: `nvm use`.

## Local Deployment

This will spin up a local hardhat chain and let you interact without needing Metamask or an Infura API key.

### 1. Install Dependencies for Hardhat

In the project directory:

```sh
npm install
```

### 2. Start a Local Hardhat Node

Start the Hardhat development blockchain:

```sh
npx hardhat node
```

### 3. Deploy the Smart Contracts

In a new terminal window, deploy the contracts to the local Hardhat network:

```sh
npx hardhat run scripts/deploy.js --network localhost
```

### 4. Start the Frontend

Now navigate to the `ui` folder. Install the UI dependencies and start the development server:

```sh
cd ui
npm install
npm run dev
```

### 5. Access the Application

Your local frontend should now be accessible at [http://localhost:5173](http://localhost:5173) (or another port if configured).
