// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023 Snowfork <hello@snowfork.com>
pragma solidity 0.8.10;

import "./MultiAddress.sol";

interface IGateway {
    /// @dev Quote a fee in Ether for sending a token
    /// 1. Delivery costs to BridgeHub
    /// 2. XCM execution costs on destinationChain
    function quoteSendTokenFee(address token, uint32 destinationChain, uint128 destinationFee)
    external
    view
    returns (uint256);

    /// @dev Send ERC20 tokens to parachain `destinationChain` and deposit into account `destinationAddress`
    function sendToken(
        address token,
        uint32 destinationChain,
        MultiAddress.MultiAddress calldata destinationAddress,
        uint128 destinationFee,
        uint128 amount
    ) external payable;
}