// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IAzimuth.sol";
import "./PlanetToken.sol";

contract PlanetTreasury is Ownable, ReentrancyGuard {
    IAzimuth public immutable azimuth;

    PlanetToken public immutable planetToken;

    // TODO: enable ministry
    // address public immutable ministry;

    // Track whether a star has capacity to spawn planets or is depleted
    mapping(uint16 => bool) public isDepleted;

    event TokensWithdrawn(uint16 indexed starId, uint256 amount);

    event TokensDeposited(uint16 indexed starId, uint256 amount);

    event TokenBurned(uint16 indexed starId);

    constructor(address initialOwner, IAzimuth _azimuth) Ownable(initialOwner) {
        azimuth = _azimuth;
        planetToken = new PlanetToken(address(this));
    }

    // Withdraw all tokens from a star's escrow, removing capacity to spawn planets
    //
    function withdrawCapacity(uint16 _starId) external nonReentrant {
        // Must be the star owner (TODO: extend to addresses with valid permissions?)
        address owner = azimuth.getOwner(_starId);
        require(msg.sender == owner, "Must be star owner");

        // Must have capacity to withdraw
        require(!isDepleted[_starId], "Star does not have capacity");

        // Get unspawned planet count from Ecliptic, which equals this star's token balance
        // uint256 balance = getUnspawnedCount(_starId) * 1e18;
        uint256 balance = uint256(getUnspawnedCount(_starId)) * 1e18;

        // Transfer tokens from Treasury to the star owner
        require(
            planetToken.transfer(msg.sender, balance),
            "PlanetTreasury: Transfer failed"
        );

        isDepleted[_starId] = true;

        emit TokensWithdrawn(_starId, balance);
    }

    // Deposit tokens into escrow.
    // Tokens must be equal to the star's current unspawned count, no partial deposits
    function depositCapacity(uint16 _starId) external nonReentrant {
        uint256 amount = uint256(getUnspawnedCount(_starId)) * 1e18;

        require(
            planetToken.transferFrom(msg.sender, address(this), amount),
            "PlanetTreasury: Transfer failed"
        );

        isDepleted[_starId] = false;
        emit TokensDeposited(_starId, amount);
    }

    // Burn token from escrow upon spawning planets
    function burn(uint16 _starId) external nonReentrant onlyOwner {
        require(
            planetToken.balanceOf(address(this)) >= 1e18,
            "No tokens to burn"
        );

        planetToken.burn(1e18);

        emit TokenBurned(_starId);
    }

    function getUnspawnedCount(uint32 _starId) public view returns (uint32) {
        return 65535 - azimuth.getSpawnCount(_starId);
    }

    function getTreasuryBalance() public view returns (uint256) {
        return planetToken.balanceOf(address(this));
    }
}
