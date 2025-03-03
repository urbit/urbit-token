// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IAzimuth.sol";
import "./PlanetToken.sol";

//  PlanetTreasury: manage capacity for spawning planets
//
//    This contract allows star owners to revoke their capacity to spawn planets and
//    instead receive ERC-20 tokens. They may also deposit tokens to regain spawning capacity.
//    The initial supply of ERC-20 tokens are minted by the PlanetToken contract and transferred
//    to this contract immediately, with the token supply being equal to the total number
//    of unspawned planets at the time of deployment.
//
//    The Ecliptic contract shall be the owner of this contract, and will instruct this contract
//    to burn one token per planet spawned.
//
//    No partial deposits or withdrawals are allowed -- the amount being transacted will
//    always be equal to the star's current unspawned count.
//

contract PlanetTreasury is Ownable, ReentrancyGuard {
    // IAzimuth: Azimuth contract reference
    //
    IAzimuth public immutable azimuth;

    // PlanetToken: ERC-20 token contract reference
    //
    PlanetToken public immutable planetToken;

    // isDepleted: Indicates whether or not a star has capacity to spawn planets
    //
    mapping(uint16 => bool) public isDepleted;

    // Events

    // TokensWithdrawn: Emitted when tokens are withdrawn from a star's escrow
    //
    event TokensWithdrawn(uint16 indexed starId, uint256 amount);

    // TokensDeposited: Emitted when tokens are deposited into a star's escrow
    //
    event TokensDeposited(uint16 indexed starId, uint256 amount);

    // TokenBurned: Emitted when a token is burned during the spawn process
    //
    event TokenBurned(uint16 indexed starId);

    //  constructor(): Initialize the contract with the Azimuth and PlanetToken contracts
    //
    constructor(
        address initialOwner,
        IAzimuth _azimuth,
        uint256 initialSupply
    ) Ownable(initialOwner) {
        azimuth = _azimuth;
        planetToken = new PlanetToken(address(this), initialSupply);
    }

    // withdrawCapacity: Withdraw all tokens from a star's escrow, removing capacity to spawn planets
    //
    function withdrawCapacity(uint16 _starId) external nonReentrant {
        // Must be the star owner (TODO: extend to addresses with valid permissions?)
        address owner = azimuth.getOwner(_starId);
        require(msg.sender == owner, "Must be star owner");

        // Must have capacity to withdraw
        require(!isDepleted[_starId], "Star does not have capacity");

        // Get unspawned planet count from Ecliptic, which determines the balance to withdraw
        uint256 balance = uint256(getUnspawnedCount(_starId)) * 1e18;

        // Transfer tokens from Treasury to the star owner
        require(
            planetToken.transfer(msg.sender, balance),
            "PlanetTreasury: Transfer failed"
        );

        // Mark the star as depleted
        isDepleted[_starId] = true;

        emit TokensWithdrawn(_starId, balance);
    }

    // batchWithdrawCapacity: Withdraw tokens from multiple stars' escrows
    //

    function batchWithdrawCapacity(
        uint16[] calldata _starIds
    ) external nonReentrant {
        // Initialize total balance and a memory array to store individual balances
        uint256 totalBalance = 0;
        uint256[] memory balances = new uint256[](_starIds.length);

        //  Check conditions and calculate balances
        for (uint i = 0; i < _starIds.length; i++) {
            uint16 star = _starIds[i];
            address owner = azimuth.getOwner(star);
            require(msg.sender == owner, "Must be star owner");
            require(!isDepleted[star], "Star does not have capacity");
            balances[i] = uint256(getUnspawnedCount(star)) * 1e18;
            totalBalance += balances[i];
        }

        // Send the total balance to the sender
        require(
            planetToken.transfer(msg.sender, totalBalance),
            "PlanetTreasury: Transfer failed"
        );

        // Mark stars as depleted
        for (uint i = 0; i < _starIds.length; i++) {
            uint16 star = _starIds[i];
            isDepleted[star] = true;
            emit TokensWithdrawn(star, balances[i]);
        }
    }

    // depositCapacity: Deposit tokens into a star's escrow, regaining capacity to spawn planets
    //
    function depositCapacity(uint16 _starId) external nonReentrant {
        uint256 amount = uint256(getUnspawnedCount(_starId)) * 1e18;

        // Must be the star owner
        address owner = azimuth.getOwner(_starId);
        require(msg.sender == owner, "Must be star owner");

        // Check if the msg.sender has enough tokens
        require(
            planetToken.balanceOf(msg.sender) >= amount,
            "PlanetTreasury: Insufficient balance"
        );

        // Check if the token spend approval is in place
        require(
            planetToken.allowance(msg.sender, address(this)) >= amount,
            "PlanetTreasury: Insufficient allowance"
        );

        // Transfer tokens from sender to Treasury
        require(
            planetToken.transferFrom(msg.sender, address(this), amount),
            "PlanetTreasury: Transfer failed"
        );

        // Mark the star as not depleted
        isDepleted[_starId] = false;

        emit TokensDeposited(_starId, amount);
    }

    // batchDepositCapacity: Deposit tokens into multiple stars' escrows
    //
    function batchDepositCapacity(
        uint16[] calldata _starIds
    ) external nonReentrant {
        // Initialize total amount and an array to store individual amounts
        uint256 totalAmount = 0;
        uint256[] memory amounts = new uint256[](_starIds.length);

        // Calculate amounts for each star and accumulate the total
        for (uint i = 0; i < _starIds.length; i++) {
            uint16 star = _starIds[i];
            amounts[i] = uint256(getUnspawnedCount(star)) * 1e18;
            totalAmount += amounts[i];
        }

        // Transfer tokens from sender to Treasury
        require(
            planetToken.transferFrom(msg.sender, address(this), totalAmount),
            "PlanetTreasury: Transfer failed"
        );

        // Mark all stars as not depleted
        for (uint i = 0; i < _starIds.length; i++) {
            uint16 star = _starIds[i];
            isDepleted[star] = false;
            emit TokensDeposited(star, amounts[i]);
        }
    }

    // Burn token from escrow during the spawn process
    //
    function burn(uint16 _starId) external nonReentrant onlyOwner {
        planetToken.burn(1e18);

        emit TokenBurned(_starId);
    }

    // getUnspawnedCount: Get the number of unspawned planets for a star
    //
    function getUnspawnedCount(uint32 _starId) public view returns (uint32) {
        return 65535 - azimuth.getSpawnCount(_starId);
    }

    // getTreasuryBalance: Get the balance of the treasury
    //
    function getTreasuryBalance() public view returns (uint256) {
        return planetToken.balanceOf(address(this));
    }
}
