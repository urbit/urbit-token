// SPDX-License-Identifier: MIT
pragma solidity 0.4.24;

interface IPlanetTreasury {
    function isDepleted(uint16) external view returns (bool);
    function burn(uint16) external;
}
