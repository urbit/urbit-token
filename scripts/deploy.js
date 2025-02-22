const hre = require("hardhat");
const path = require("path");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Contract deployments

  // ------------------------
  // Deploy Azimuth
  // ------------------------

  const Azimuth = await hre.ethers.getContractFactory("Azimuth");
  const azimuth = await Azimuth.deploy();
  await azimuth.waitForDeployment();
  console.log("Azimuth deployed to:", azimuth.target);

  // (Optional) Wait 5 confirmations before verifying
  await azimuth.deploymentTransaction().wait(5);

  // ------------------------
  // Deploy Polls
  // ------------------------

  const Polls = await hre.ethers.getContractFactory("Polls");
  const polls = await Polls.deploy(2592000, 2592000);
  await polls.waitForDeployment();
  console.log("Polls deployed to:", polls.target);

  // ------------------------
  // Deploy Claims
  // ------------------------

  const Claims = await hre.ethers.getContractFactory("Claims");
  const claims = await Claims.deploy(azimuth.target);
  await claims.waitForDeployment();
  console.log("Claims deployed to:", claims.target);

  // ------------------------
  // Deploy PlanetTreasury
  // ------------------------

  const TokenTreasury = await hre.ethers.getContractFactory("PlanetTreasury");
  const tokenTreasury = await TokenTreasury.deploy(
    deployer.address,
    azimuth.target
  );
  await tokenTreasury.waitForDeployment();
  console.log("PlanetTreasury deployed to:", tokenTreasury.target);

  await sleep(5000); // wait 5 seconds

  // Get the PlanetToken address from PlanetTreasury
  const planetTokenAddress = await tokenTreasury.planetToken();
  console.log("PlanetToken deployed to:", planetTokenAddress);

  // ------------------------
  // Deploy Ecliptic
  // ------------------------

  const Ecliptic = await hre.ethers.getContractFactory("Ecliptic");
  const ecliptic = await Ecliptic.deploy(
    "0x0000000000000000000000000000000000000000",
    azimuth.target,
    polls.target,
    claims.target,
    "0x0000000000000000000000000000000000000000",
    tokenTreasury.target,
    planetTokenAddress
  );
  await ecliptic.waitForDeployment();
  console.log("Ecliptic deployed to:", ecliptic.target);

  // Save deployed addresses to a file
  const deploymentData = {
    Azimuth: azimuth.target,
    TokenTreasury: tokenTreasury.target,
    PlanetToken: planetTokenAddress,
    Ecliptic: ecliptic.target,
    Polls: polls.target,
    Claims: claims.target,
  };

  console.log("Deployment data:", deploymentData);
  //  fake key for testing
  const pk1 =
    "0xe3ea4c86481cd60e2a3c9600e1955fe97a187ab17adb33caebbb8d43109abc30";
  const pk2 =
    "0x3d5ff28ddf49a36b89eaecfd5ed290e5cb4bd20b29b70d8fda3d7a37670baba0";
  const cryptType = 1;
  const suite = false;
  try {
    // Ownership transfers

    // azimuth
    console.log("\nTransferring ownerships...");
    await azimuth.transferOwnership(ecliptic.target);
    console.log("Azimuth ownership transferred to Ecliptic.");

    // polls
    await polls.transferOwnership(ecliptic.target);
    console.log("Polls ownership transferred to Ecliptic.");

    // treasury
    await tokenTreasury.transferOwnership(ecliptic.target);
    console.log("PlanetTreasury ownership transferred to Ecliptic.");

    console.log("\nCreating Galaxy 0...");
    await ecliptic.createGalaxy(0, deployer.address);
    console.log("Galaxy 0 created for:", deployer.address);

    await sleep(5000); // wait 5 seconds

    // Configure keys for Galaxy 0
    console.log("\nConfiguring keys for Galaxy 0...");
    await ecliptic.configureKeys(0, pk1, pk2, cryptType, suite);
    console.log("Keys configured for Galaxy 0.");

    await sleep(5000); // wait 5 seconds

    // Spawn Star 256
    console.log("\nSpawning Star 256...");
    await ecliptic.spawn(256, deployer.address);
    console.log("Star 256 spawned for:", deployer.address);

    await sleep(5000); // wait 5 seconds

    // Configure keys for Star 256
    console.log("\nConfiguring keys for Star 256...");
    await ecliptic.configureKeys(256, pk1, pk2, cryptType, suite);
    console.log("Keys configured for Star 256.");

    // spawn planet 65792
    console.log("\nSpawning Planet 65792...");
    await ecliptic.spawn(65792, deployer.address);
    console.log("Planet 65792 spawned for:", deployer.address);

    // spawn planet 131328
    console.log("\nSpawning Planet 131328...");
    await ecliptic.spawn(131328, deployer.address);
    console.log("Planet 131328 spawned for:", deployer.address);

    // spawn planet 196864
    console.log("\nSpawning Planet 196864...");
    await ecliptic.spawn(196864, deployer.address);
    console.log("Planet 196864 spawned for:", deployer.address);
  } catch (error) {
    console.error("Error:", error);
  }

  await sleep(5000); // wait 5 seconds

  // // Mint tokens
  // const mintAmount = hre.ethers.parseEther("50"); // 50 tokens
  // await tokenTreasury.mint(deployer.address, mintAmount);
  // console.log(`Minted ${mintAmount.toString()} tokens to ${deployer.address}`);

  // Etherscan verification
  console.log("\nVerifying contracts on Etherscan...");

  try {
    await hre.run("verify:verify", {
      address: azimuth.target,
      contract: "contracts/Azimuth.sol:Azimuth",
      waitConfirmations: 5,
    });
    console.log("Azimuth verified!");
  } catch (error) {
    console.error("Verification failed:", error);
  }

  // await hre.run("verify:verify", {
  //   address: claims.target,
  //   contract: "contracts/Claims.sol:Claims",
  //   constructorArguments: [azimuth.target],
  // });
  // console.log("Claims verified!");

  // await hre.run("verify:verify", {
  //   address: polls.target,
  //   contract: "contracts/Polls.sol:Polls",
  //   constructorArguments: [2592000, 2592000],
  // });
  // console.log("Polls verified!");

  try {
    await hre.run("verify:verify", {
      address: ecliptic.target,
      contract: "contracts/Ecliptic.sol:Ecliptic",
      constructorArguments: [
        "0x0000000000000000000000000000000000000000",
        azimuth.target,
        polls.target,
        claims.target,
        "0x0000000000000000000000000000000000000000",
        tokenTreasury.target,
        planetTokenAddress,
      ],
      waitConfirmations: 5,
    });

    console.log("Ecliptic verified!");
  } catch (error) {
    console.error("Verification failed:", error);
  }

  try {
    await hre.run("verify:verify", {
      address: tokenTreasury.target,
      contract: "contracts/PlanetTreasury.sol:PlanetTreasury",
      constructorArguments: [deployer.address, azimuth.target],
      waitConfirmations: 5,
    });
    console.log("PlanetTreasury verified!");
  } catch (error) {
    console.error("Verification failed:", error);
  }

  try {
    await hre.run("verify:verify", {
      address: planetTokenAddress,
      contract: "contracts/PlanetToken.sol:PlanetToken",
      constructorArguments: [deployer.address],
      waitConfirmations: 5,
    });
    console.log("PlanetToken verified!");
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
