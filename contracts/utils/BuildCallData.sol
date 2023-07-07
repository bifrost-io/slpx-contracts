// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

library BuildCallData {
    uint8 public constant PALLET_INDEX = 125;
    uint8 public constant MINT_CALL_INDEX = 0;
    uint8 public constant SWAP_CALL_INDEX = 1;
    uint8 public constant REDEEM_CALL_INDEX = 2;

    function buildMintCallBytes(
        address caller,
        bytes2 token,
        bytes1 targetChain
    ) public pure returns (bytes memory) {
        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(MINT_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return
            bytes.concat(prefix, abi.encodePacked(caller), token, targetChain);
    }

    function buildSwapCallBytes(
        address caller,
        bytes2 currency_in,
        bytes2 currency_out,
        uint128 currency_out_min,
        bytes1 targetChain
    ) public pure returns (bytes memory) {
        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(SWAP_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return
            bytes.concat(
                prefix,
                abi.encodePacked(caller),
                currency_in,
                currency_out,
                encode_uint128(currency_out_min),
                targetChain
            );
    }

    function buildRedeemCallBytes(
        address caller,
        bytes2 vtoken,
        bytes1 targetChain
    ) public pure returns (bytes memory) {
        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(REDEEM_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return
            bytes.concat(prefix, abi.encodePacked(caller), vtoken, targetChain);
    }

    //https://docs.substrate.io/reference/scale-codec/
    function encode_uint128(uint128 x) internal pure returns (bytes memory) {
        bytes memory b = new bytes(16);
        for (uint i = 0; i < 16; i++) {
            b[i] = bytes1(uint8(x / (2 ** (8 * i))));
        }
        return b;
    }
}
