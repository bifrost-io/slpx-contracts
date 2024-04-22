// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/ProxyOFTV2.sol";

contract MantaProxyOFT is ProxyOFTV2 {
    constructor(
        address token,
        address _lzEndpoint
    ) ProxyOFTV2(token, 6, _lzEndpoint) {}
}
