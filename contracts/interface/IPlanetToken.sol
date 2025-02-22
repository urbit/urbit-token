// SPDX-License-Identifier: MIT
pragma solidity ^0.4.24;

interface IPlanetToken {
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external returns (bool);
}
