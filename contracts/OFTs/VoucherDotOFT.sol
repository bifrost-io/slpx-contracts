// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@layerzerolabs/solidity-examples/contracts/token/oft/v2/OFTV2.sol";

contract VoucherDotOFT is OFTV2 {
    constructor(
        address _lzEndpoint
    ) OFTV2("Bifrost Voucher DOT", "vDOT", 6, _lzEndpoint) {}
}
