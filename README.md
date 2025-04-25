# Project Name

URBIT Token - UIP-0132

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
