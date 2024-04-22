// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DerivativeContract is ReentrancyGuard {
    address public receiver;

    event Withdraw(address caller, address to, address token, uint256 amount);

    constructor() {
        receiver = msg.sender;
    }

    function withdrawErc20Token(
        address _erc20
    ) external nonReentrant returns (uint256) {
        require(msg.sender == receiver, "forbidden");
        require(_erc20 != address(0), "invalid erc20");
        uint256 balance = IERC20(_erc20).balanceOf(address(this));
        require(balance != 0, "balance to low");
        IERC20(_erc20).transfer(receiver, balance);
        emit Withdraw(msg.sender, receiver, _erc20, balance);
        return balance;
    }

    function withdrawNativeToken(uint256 _amount) external nonReentrant {
        require(msg.sender == receiver, "forbidden");
        require(_amount != 0, "balance to low");
        (bool success, ) = receiver.call{value: _amount}("");
        require(success, "failed to withdrawNativeToken");
        emit Withdraw(msg.sender, receiver, address(0), _amount);
    }
}
