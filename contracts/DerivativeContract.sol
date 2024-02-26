// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DerivativeContract is ReentrancyGuard {
    address public astarReceiver;

    event Withdraw(address caller, address to, address token, uint256 amount);

    constructor() {
        astarReceiver = msg.sender;
    }

    function withdraw(address _erc20) external nonReentrant returns (uint256) {
        require(msg.sender == astarReceiver, "forbidden");
        require(_erc20 != address(0), "invalid erc20");
        uint256 balance = IERC20(_erc20).balanceOf(address(this));
        require(balance != 0, "balance to low");
        IERC20(_erc20).transfer(astarReceiver, balance);
        emit Withdraw(msg.sender, astarReceiver, _erc20, balance);
        return balance;
    }

    function withdrawAstr(uint256 _amount) external nonReentrant {
        require(msg.sender == astarReceiver, "forbidden");
        require(_amount != 0, "balance to low");
        (bool success, ) = astarReceiver.call{value: _amount}("");
        require(success, "failed to withdrawAstr");
        emit Withdraw(msg.sender, astarReceiver, address(0), _amount);
    }
}
