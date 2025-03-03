// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

//  PlanetToken: ERC-20 token contract
//
//    This contract defines an ERC-20 token used to represent the capacity to spawn planets.
//    The initial supply of tokens is minted by this contract and transferred to the
//    Treasury upon deployment.
//
//    The initialSupply value must be calculated off-chain due to Ethereum's block gas limit and
//    passed in as a constructor argument. The value should be equal to the total number of unspawned
//    planets at the time of deployment, calculated as 4,278,124,800 (all non-galaxy prefix planets)
//    less the number of planets already spawned.
//

contract PlanetToken is ERC20, ERC20Burnable, Ownable, ERC20Permit {
    constructor(
        address initialOwner,
        uint256 initialSupply
    ) ERC20("URBIT", "URBIT") ERC20Permit("URBIT") Ownable(initialOwner) {
        // Mint the initial supply to the treasury
        _mint(initialOwner, initialSupply);
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}
