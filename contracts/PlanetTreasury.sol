// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interface/IAzimuth.sol";
import "./interface/IEcliptic.sol";
import "./PlanetToken.sol";

/**
 * @title PlanetTreasury
 * @notice Manage capacity for spawning planets
 *
 * @dev This contract allows star owners to revoke their capacity to spawn planets
 * and instead receive ERC-20 tokens. They may also deposit tokens to regain spawning capacity.
 *
 * The Ecliptic contract must be the owner of this contract. PlanetTreasury relies on
 * Ecliptic's record of each star’s spawn count to determine the number of tokens
 * to mint when withdrawing (or burn when depositing) spawn capacity.
 *
 * No partial deposits or withdrawals are allowed — the amount being transacted
 * will always equal the star's current unspawned planet count.
 */

contract PlanetTreasury is Ownable, ReentrancyGuard {
    IAzimuth public immutable azimuth;
    PlanetToken public immutable planetToken;

    /// @notice true once a star’s tokens have been withdrawn
    mapping(uint16 => bool) public hasWithdrawn;

    event TokensWithdrawn(uint16 indexed starId, uint256 amount);
    event TokensDeposited(uint16 indexed starId, uint256 amount);

    constructor(address initialOwner, IAzimuth _azimuth) Ownable(initialOwner) {
        azimuth = _azimuth;
        planetToken = new PlanetToken(address(this));
    }

    /**
     * @notice The star relinquishes its spawn capacity and receives tokens
     */
    function withdrawCapacity(uint16 _starId) external nonReentrant {
        address owner = azimuth.getOwner(_starId);
        require(msg.sender == owner, "Must be star owner");

        require(
            azimuth.getSpawnProxy(uint32(_starId)) == address(this),
            "Must set proxy to treasury first"
        );

        require(!hasWithdrawn[_starId], "Spawn capacity already withdrawn");

        uint256 amount = uint256(getUnspawnedCount(_starId)) * 1e18;
        planetToken.mint(msg.sender, amount);

        hasWithdrawn[_starId] = true;
        emit TokensWithdrawn(_starId, amount);
    }

    /**
     * @notice Batch version of withdrawCapacity
     */

    function batchWithdrawCapacity(
        uint16[] calldata _starIds
    ) external nonReentrant {
        for (uint256 i = 0; i < _starIds.length; i++) {
            uint16 starId = _starIds[i];

            require(msg.sender == azimuth.getOwner(starId), "Not star owner");
            require(
                azimuth.getSpawnProxy(uint32(starId)) == address(this),
                "Spawn proxy not set"
            );
            require(!hasWithdrawn[starId], "Already withdrawn");

            uint256 amount = uint256(getUnspawnedCount(starId)) * 1e18;
            planetToken.mint(msg.sender, amount);

            hasWithdrawn[starId] = true;
            emit TokensWithdrawn(starId, amount);
        }
    }
    /**
     * @notice Deposit tokens and restore spawn rights by clearing proxy
     */
    function depositCapacity(uint16 _starId) external nonReentrant {
        require(hasWithdrawn[_starId], "Nothing to deposit");

        address owner = azimuth.getOwner(_starId);
        require(msg.sender == owner, "Must be star owner");
        require(
            azimuth.getSpawnProxy(uint32(_starId)) == address(this),
            "Not withdrawn"
        );

        uint256 amount = uint256(getUnspawnedCount(_starId)) * 1e18;
        require(
            planetToken.allowance(msg.sender, address(this)) >= amount,
            "Insufficient allowance"
        );

        // burn tokens from the sender
        planetToken.burnFrom(msg.sender, amount);

        // Clear spawn proxy to restore rights

        IEcliptic ecliptic = IEcliptic(azimuth.owner());

        ecliptic.setSpawnProxy(_starId, address(0));
        hasWithdrawn[_starId] = false;
        emit TokensDeposited(_starId, amount);
    }

    /**
     * @notice Batch version of depositCapacity
     */
    function batchDepositCapacity(
        uint16[] calldata _starIds
    ) external nonReentrant {
        uint256 totalAmount = 0;
        uint256[] memory amounts = new uint256[](_starIds.length);

        // Calculate total burn amount first
        for (uint256 i = 0; i < _starIds.length; i++) {
            uint16 starId = _starIds[i];
            require(hasWithdrawn[starId], "Nothing to deposit");
            require(msg.sender == azimuth.getOwner(starId), "Not star owner");
            require(
                azimuth.getSpawnProxy(uint32(starId)) == address(this),
                "Not withdrawn"
            );

            uint256 amount = uint256(getUnspawnedCount(starId)) * 1e18;
            amounts[i] = amount;
            totalAmount += amount;
        }

        // Burn entire amount once
        planetToken.burnFrom(msg.sender, totalAmount);

        // Restore spawn rights and reset flags
        IEcliptic ecliptic = IEcliptic(azimuth.owner());
        for (uint256 i = 0; i < _starIds.length; i++) {
            uint16 starId = _starIds[i];
            ecliptic.setSpawnProxy(starId, address(0));
            hasWithdrawn[starId] = false;

            emit TokensDeposited(starId, amounts[i]);
        }
    }

    /**
     * @notice Returns number of unspawned planets for a star
     */
    function getUnspawnedCount(uint32 _starId) public view returns (uint32) {
        return 65535 - azimuth.getSpawnCount(_starId);
    }
}
