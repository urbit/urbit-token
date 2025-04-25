// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IAzimuth {
    function owner() external returns (address);
    function isSpawnProxy(uint32, address) external returns (bool);
    function hasBeenLinked(uint32) external returns (bool);
    function getPrefix(uint32) external returns (uint16);
    function getOwner(uint32) external view returns (address);
    function canTransfer(uint32, address) external view returns (bool);
    function isOwner(uint32, address) external view returns (bool);
    function getKeyRevisionNumber(uint32) external view returns (uint32);
    function getSpawnCount(uint32) external view returns (uint32);
    function getSpawnProxy(uint32) external view returns (address);
}
