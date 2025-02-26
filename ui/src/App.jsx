import { useState, useEffect } from "react";
import { ethers } from "ethers";
import * as ob from "urbit-ob";
import LogPanel from "./LogPanel";

import PlanetTokenABI from "../../artifacts/contracts/PlanetToken.sol/PlanetToken.json";
import PlanetTreasuryABI from "../../artifacts/contracts/PlanetTreasury.sol/PlanetTreasury.json";
import AzimuthABI from "../../artifacts/contracts/Azimuth.sol/Azimuth.json";
import EclipticABI from "../../artifacts/contracts/Ecliptic.sol/Ecliptic.json";
import contractAddresses from "./contracts.json";

const MyApp = () => {
  const [selectedShip, setSelectedShip] = useState(null);
  const [allShips, setAllShips] = useState([]);
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isDepleted, setIsDepleted] = useState(null);
  const [unspawnedCount, setUnspawnedCount] = useState(0);
  const [treasuryBalance, setTreasuryBalance] = useState(null);
  const [keyRevisionNumber, setKeyRevisionNumber] = useState(0);
  const [allowance, setAllowance] = useState(null);
  const [allowanceTreasury, setAllowanceTreasury] = useState(null);
  const [totalSupply, setTotalSupply] = useState(null);

  const {
    PLANET_TOKEN_ADDRESS,
    PLANET_TREASURY_ADDRESS,
    AZIMUTH_ADDRESS,
    ECLIPTIC_ADDRESS,
    POLLS_ADDRESS,
    CLAIMS_ADDRESS,
  } = contractAddresses;

  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

  // Create a contract instance
  const contract_azimuth = new ethers.Contract(
    AZIMUTH_ADDRESS,
    AzimuthABI.abi,
    provider
  );

  // Fetch wallet first
  useEffect(() => {
    const asyncFunction = async () => {
      const walletData = await fetchWallet();

      setWalletAddress(walletData);
    };
    asyncFunction();
  }, []); // Runs once on mount

  // Fetch everything else when wallet is ready
  useEffect(() => {
    const asyncFunction = async () => {
      if (!walletAddress) return;
      await Promise.all([
        fetchShips(),
        fetchBalance(),
        fetchIsDepleted(),
        fetchUnspawnedCount(),
        fetchTreasuryBalance(),
        fetchKeys(),
        fetchAllowance(),
        fetchTotalSupply(),
      ]);
    };
    asyncFunction();

    return () => {};
  }, [walletAddress, selectedShip]);

  const spawnStar = async () => {
    const signer = await provider.getSigner();

    const contract_ecliptic = new ethers.Contract(
      ECLIPTIC_ADDRESS,
      EclipticABI.abi,
      signer
    );

    for (let i = 0; i < 100; i++) {
      const point = Number(0) + i * 256;
      try {
        const isActive = await contract_azimuth.isActive(Number(point));
        if (!isActive) {
          console.log(
            `Spawning star at point ${point} for ${walletAddress}...`
          );
          const tx = await contract_ecliptic.spawn(
            Number(point),
            walletAddress
          );
          console.log("Transaction sent:", tx.hash);

          // Wait for transaction to confirm before breaking out
          await tx.wait();
          console.log(`Planet ${point} successfully spawned!`);
          // refresh
          fetchShips();
          break;
        }
      } catch (error) {
        console.error("Error fetching isActive:", error);
        break;
      }
    }
  };

  const isStar = (point) => {
    return point >= 256 && point < 65536;
  };

  const spawnUsingToken = async () => {
    if (!isDepleted) {
      console.error("This star still has its capacity!");
      return;
    }

    const signer = await provider.getSigner();

    const contract_ecliptic = new ethers.Contract(
      ECLIPTIC_ADDRESS,
      EclipticABI.abi,
      signer
    );

    for (let i = 0; i < 100; i++) {
      const point = Number(selectedShip) + i * 65536;
      try {
        const isActive = await contract_azimuth.isActive(Number(point));
        if (!isActive) {
          console.log(
            `Spawning planet at point ${point} for ${walletAddress}...`
          );
          const tx = await contract_ecliptic.tokenRedemptionSpawn(
            Number(point)
          );
          console.log("Transaction sent:", tx.hash);

          // Wait for transaction to confirm before breaking out
          await tx.wait();
          console.log(`Planet ${point} successfully spawned!`);

          // refresh
          fetchTreasuryBalance();
          fetchUnspawnedCount();
          fetchShips();
          fetchBalance();
          fetchAllowance();
          fetchTotalSupply();
          break;
        }
      } catch (error) {
        console.error("Error fetching isActive:", error);
        break;
      }
    }
  };

  const spawnPlanet = async () => {
    if (isDepleted) {
      console.error("No capacity available to spawn a planet.");
      return;
    }

    if (keyRevisionNumber === 0) {
      console.error("Keys must be set to spawn a planet from star.");
      return;
    }

    const signer = await provider.getSigner();

    const contract_ecliptic = new ethers.Contract(
      ECLIPTIC_ADDRESS,
      EclipticABI.abi,
      signer
    );

    for (let i = 0; i < 100; i++) {
      const point = Number(selectedShip) + i * 65536;
      try {
        const isActive = await contract_azimuth.isActive(Number(point));
        if (!isActive) {
          console.log(
            `Spawning planet at point ${point} for ${walletAddress}...`
          );
          const tx = await contract_ecliptic.spawn(
            Number(point),
            walletAddress
          );
          console.log("Transaction sent:", tx.hash);

          // Wait for transaction to confirm before breaking out
          await tx.wait();
          console.log(`Planet ${point} successfully spawned!`);
          // refresh
          fetchTreasuryBalance();
          fetchUnspawnedCount();
          fetchShips();
          fetchTotalSupply();
          break;
        }
      } catch (error) {
        console.error("Error fetching isActive:", error);
        break;
      }
    }
  };

  const fetchAllowance = async () => {
    const contract_token = new ethers.Contract(
      PLANET_TOKEN_ADDRESS,
      PlanetTokenABI.abi,
      provider
    );

    try {
      const allowance = await contract_token.allowance(
        walletAddress,
        ECLIPTIC_ADDRESS
      );

      const formattedAllowance = ethers.formatUnits(allowance, 18);

      setAllowance(formattedAllowance);
    } catch (error) {
      console.error("Error fetching allowance from Ecliptic:", error);
    }

    try {
      const allowanceTreasury = await contract_token.allowance(
        walletAddress,
        PLANET_TREASURY_ADDRESS
      );

      const formattedAllowanceTreasury = ethers.formatUnits(
        allowanceTreasury,
        18
      );

      setAllowanceTreasury(formattedAllowanceTreasury);
    } catch (error) {
      console.error("Error fetching allowance from treasury:", error);
    }
  };

  const withdrawCapacity = async () => {
    if (!selectedShip) return;

    const signer = await provider.getSigner();

    const contract_treasury = new ethers.Contract(
      PLANET_TREASURY_ADDRESS,
      PlanetTreasuryABI.abi,
      signer
    );

    try {
      const tx = await contract_treasury.withdrawCapacity(selectedShip);
      console.log("Withdrawing capacity...");
      console.log("tx:", JSON.stringify(tx));
      await tx.wait();

      console.log(`Capacity withdrawn from ${ob.patp(selectedShip)}`);

      // refresh
      fetchIsDepleted();
      fetchBalance();
      fetchAllowance();
      fetchTreasuryBalance();
    } catch (error) {
      console.error("Error withdrawing capacity:", error);
    }
  };

  const depositCapacity = async () => {
    if (!selectedShip) return;

    const signer = await provider.getSigner();

    const contract_treasury = new ethers.Contract(
      PLANET_TREASURY_ADDRESS,
      PlanetTreasuryABI.abi,
      signer
    );

    try {
      console.log(`Depositing capacity for ${ob.patp(selectedShip)}...`);
      const tx = await contract_treasury.depositCapacity(selectedShip);
      console.log("tx:", JSON.stringify(tx));
      await tx.wait();

      console.log(`Capacity deposited to ${ob.patp(selectedShip)}`);
      // refresh
      fetchIsDepleted();
      fetchBalance();
      fetchAllowance();
      fetchTotalSupply();
      fetchTreasuryBalance();
    } catch (error) {
      console.error("Error depositing capacity:", error);
    }
  };

  const fetchKeys = async () => {
    if (!selectedShip) return;

    const contract_azimuth = new ethers.Contract(
      AZIMUTH_ADDRESS,
      AzimuthABI.abi,
      provider
    );

    try {
      const keys = await contract_azimuth.getKeyRevisionNumber(selectedShip);

      setKeyRevisionNumber(Number(keys));
    } catch (error) {
      console.error("Error fetching keys:", error);
    }
  };

  const configureKeys = async () => {
    if (!selectedShip) return;

    const signer = await provider.getSigner();

    const contract_ecliptic = new ethers.Contract(
      ECLIPTIC_ADDRESS,
      EclipticABI.abi,
      signer
    );

    const pk1 =
      "0x0000000000000000000000000000000000000000000000000000000000000000";

    const pk2 =
      "0x0000000000000000000000000000000000000000000000000000000000000000";
    const cryptType = 1;
    const suite = false;

    try {
      console.log("Setting keys...");
      const tx = await contract_ecliptic.configureKeys(
        selectedShip,
        pk1,
        pk2,
        cryptType,
        suite
      );
      console.log("tx:", JSON.stringify(tx));
      await tx.wait();
      console.log(`Keys set for ${ob.patp(selectedShip)}`);
      // refresh
      fetchKeys();
    } catch (error) {
      console.error("Error setting keys:", error);
    }
  };

  const fetchWallet = async () => {
    // hardcoded to hardhat default address
    return "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  };

  const fetchShips = async () => {
    if (!walletAddress || !contract_azimuth) return;

    try {
      const ships = await contract_azimuth.getOwnedPoints(walletAddress);
      // console.log("Ships:", ships);

      // setSelectedShip(ships[0]);
      setAllShips(ships);
    } catch (error) {
      console.error("Error fetching ships:", error);
    }
  };

  const fetchTotalSupply = async () => {
    const contract = new ethers.Contract(
      PLANET_TOKEN_ADDRESS,
      PlanetTokenABI.abi,
      provider
    );

    try {
      const totalSupply = await contract.totalSupply();

      const formattedSupply = ethers.formatUnits(totalSupply, 18);

      setTotalSupply(formattedSupply);
    } catch (error) {
      console.error("Error fetching totalSupply:", error);
    }
  };

  const fetchTreasuryBalance = async () => {
    const contract_treasury = new ethers.Contract(
      PLANET_TREASURY_ADDRESS,
      PlanetTreasuryABI.abi,
      provider
    );

    try {
      const treasuryBalance = await contract_treasury.getTreasuryBalance();
      const formattedBalance = ethers.formatUnits(treasuryBalance, 18);
      setTreasuryBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching treasuryBalance:", error);
    }
  };

  const fetchIsDepleted = async () => {
    if (!selectedShip) return;

    if (!isStar(selectedShip)) {
      setIsDepleted(true);
      return;
    }

    const contract_treasury = new ethers.Contract(
      PLANET_TREASURY_ADDRESS,
      PlanetTreasuryABI.abi,
      provider
    );

    try {
      const isDepleted = await contract_treasury.isDepleted(selectedShip);

      setIsDepleted(isDepleted);
    } catch (error) {
      console.error("Error fetching isDepleted:", error);
    }
  };

  const fetchUnspawnedCount = async () => {
    if (!selectedShip) return;

    if (!isStar(selectedShip)) {
      setUnspawnedCount(0);
      return;
    }

    const contract_treasury = new ethers.Contract(
      PLANET_TREASURY_ADDRESS,
      PlanetTreasuryABI.abi,
      provider
    );

    try {
      const unspawnedCount = await contract_treasury.getUnspawnedCount(
        selectedShip
      );
      setUnspawnedCount(unspawnedCount);
    } catch (error) {
      console.error("Error fetching unspawnedCount:", error);
    }
  };

  const fetchBalance = async () => {
    if (!walletAddress) return;

    const contract = new ethers.Contract(
      PLANET_TOKEN_ADDRESS,
      PlanetTokenABI.abi,
      provider
    );

    try {
      const rawBalance = await contract.balanceOf(walletAddress);

      const formattedBalance = ethers.formatUnits(rawBalance, 18);

      setBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const shortenAddress = (address) => {
    return `${address.slice(0, 4 + 2)}...${address.slice(-4)}`;
  };

  return (
    <div>
      <div
        style={{
          position: "fixed",
          backgroundColor: "#111111",
          top: 0,
          left: 0,
          height: "100vh",
          width: "100vw",
        }}
      >
        <LogPanel />
        <div
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              padding: "40px",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                Ethereum Address:
              </div>
              <div>{walletAddress && shortenAddress(walletAddress)}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                Treasury Balance:
              </div>
              <div>{Number(treasuryBalance).toLocaleString()}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                Total Token Supply
              </div>
              <div>{Number(totalSupply).toLocaleString()}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                My URBIT Balance:
              </div>
              <div>{Number(balance).toLocaleString()}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                Token Spend Allowance (Ecliptic):
              </div>
              <div>{Number(allowance).toLocaleString()}</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-end",
              }}
            >
              <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                Token Spend Allowance (Treasury):
              </div>
              <div>{Number(allowanceTreasury).toLocaleString()}</div>
            </div>
          </div>

          <div
            style={{
              // flexGrow: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: "0",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Available Ships:</div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
              }}
            >
              {allShips.map((ship, index) => (
                <div
                  key={index}
                  style={{
                    margin: "8px",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    cursor: "pointer",
                    backgroundColor:
                      Number(selectedShip) === Number(ship)
                        ? "#3b82f6"
                        : "#f0f0f0",
                    color:
                      Number(selectedShip) === Number(ship) ? "#fff" : "#000",
                  }}
                  onClick={() => {
                    console.log("Selected ship:", ob.patp(ship));
                    setSelectedShip(Number(ship));
                  }}
                >
                  {ob.patp(ship)}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "20px", height: "140px" }}>
              <div style={{ marginTop: "20px" }}>
                <b>Selected Ship:</b>{" "}
                {selectedShip ? ob.patp(selectedShip) : ob.patp(0)}
              </div>

              {isStar(selectedShip) && (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                      Has Capacity:
                    </div>
                    <div style={{ color: !isDepleted ? "#22c55e" : "#ef4444" }}>
                      {!isDepleted ? "TRUE" : "FALSE"}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                      Unspawned Planets:{" "}
                    </div>
                    <div>{Number(unspawnedCount).toLocaleString()}</div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "flex-end",
                    }}
                  >
                    <div style={{ paddingRight: "8px", fontWeight: "bold" }}>
                      Keys set:{" "}
                    </div>
                    <div>{keyRevisionNumber > 0 ? "TRUE" : "FALSE"}</div>
                  </div>
                </>
              )}
            </div>

            <div
              style={{
                marginTop: "40px",
                marginBottom: "20px",
                width: "700px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                {isStar(selectedShip) && (
                  <>
                    <button
                      onClick={() => spawnUsingToken()}
                      style={{
                        marginRight: "12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "18px",
                        cursor: "pointer",
                      }}
                    >
                      {`Redeem Planet from ${ob.patp(
                        selectedShip
                      )} Using Token`}
                    </button>

                    <button
                      onClick={() => spawnPlanet()}
                      style={{
                        marginRight: "12px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "4px",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      {`Spawn Planet From ${ob.patp(
                        selectedShip
                      )} as its Owner`}
                    </button>

                    {keyRevisionNumber === 0 && (
                      <button
                        onClick={() => configureKeys()}
                        style={{
                          marginRight: "12px",
                          backgroundColor: "#3b82f6",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: "bold",
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                      >
                        Set Keys
                      </button>
                    )}

                    {isDepleted ? (
                      <button
                        onClick={() => depositCapacity()}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: "bold",
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                      >
                        Deposit Capacity
                      </button>
                    ) : (
                      <button
                        onClick={() => withdrawCapacity()}
                        style={{
                          backgroundColor: "#3b82f6",
                          color: "white",
                          padding: "8px 16px",
                          borderRadius: "4px",
                          border: "none",
                          fontWeight: "bold",
                          fontSize: "18px",
                          cursor: "pointer",
                        }}
                      >
                        Withdraw Capacity
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MyApp;
