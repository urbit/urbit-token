// SPDX-License-Identifier: MIT
pragma solidity 0.4.24;

// Treasury's ITreasuryProxy

interface ITreasuryProxy {
  function upgradeTo(address _impl) external returns (bool);

  function freeze() external returns (bool);
}
