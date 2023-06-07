// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "./Constants.sol";

library BuildCallData {
    function buildMintCallBytes(address caller , bytes2 token, bytes1 targetChain) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(Constants.PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(Constants.MINT_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, abi.encodePacked(caller) , token, targetChain);
    }

    function buildSwapCallBytes(address caller , bytes2 currency_in, bytes2 currency_in_out, uint128 currency_out_min,bytes1 targetChain) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(Constants.PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(Constants.SWAP_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, abi.encodePacked(caller) , currency_in,currency_in_out, encode_uint128(currency_out_min) ,targetChain);
    }

    function buildRedeemCallBytes(address caller , bytes2 vtoken,bytes1 targetChain) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(Constants.PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(Constants.REDEEM_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, abi.encodePacked(caller) , vtoken, targetChain);
    }

    //https://docs.substrate.io/reference/scale-codec/
    function encode_uint128(uint128 x) internal pure returns (bytes memory) {
        bytes memory b = new bytes(16);
        for (uint i = 0; i < 16; i++) {
            b[i] = bytes1(uint8(x / (2**(8*i))));
        }
        return b;
    }
}

