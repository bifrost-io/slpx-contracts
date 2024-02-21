// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DerivativeContract is ReentrancyGuard {
    address public astarReceiver;
    address public VASTR = 0xfffFffff00000000000000010000000000000010;

    constructor() {
        astarReceiver = msg.sender;
    }

    function withdrawVAstr() external nonReentrant returns (uint256) {
        require(msg.sender == astarReceiver, "forbidden");
        uint256 balance = IERC20(VASTR).balanceOf(address(this));
        require(balance != 0, "balance to low");
        IERC20(VASTR).transfer(astarReceiver, balance);
        return balance;
    }

    function withdrawAstr(uint256 _amount) external nonReentrant {
        require(msg.sender == astarReceiver, "forbidden");
        require(_amount != 0, "balance to low");
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "failed to withdrawAstr");
    }

    receive() external payable {}
}
