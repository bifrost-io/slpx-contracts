// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;

import "./XcmTransactorV2.sol";
import "./Xtokens.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BifrostXcmAction {
  address public owner;

  constructor() {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this.");
    _;
  }

  function setOwner(address newOwner) external onlyOwner {
    owner = newOwner;
  }

  // todo xtokens calls
  // todo XcmTransactorV2 calls
}
