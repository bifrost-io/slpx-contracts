// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./XCM.sol";

contract AstarXcmAction is Ownable {
    address internal constant BNC_ADDRESS =  0xfFffFffF00000000000000010000000000000007;
    address internal constant ASTR_ADDRESS = 0x0000000000000000000000000000000000000000;
    address internal constant VASTR_ADDRESS =  0xFfFfFfff00000000000000010000000000000008;
    address internal constant XCM_ADDRESS = 0x0000000000000000000000000000000000005004;

    uint256 internal  constant BIFROST_PARACHAIN_ID = 2030;

    uint8 internal constant PALLET_INDEX = 125;
    uint8 internal constant MINT_CALL_INDEX = 0;
    uint8 internal constant SWAP_CALL_INDEX = 1;
    uint8 internal constant REDEEM_CALL_INDEX = 2;

    bytes1 internal constant TARGET_CHAIN = bytes1(0);
    bytes2 internal constant ASTR_BYTES = 0x0801;

    uint256 public bifrost_transaction_fee = 1000000000000;

    XCM xcm = XCM(0x0000000000000000000000000000000000005004);

    mapping (address => bytes32) public addressToSubstratePublickey;
    mapping (address => bytes2) public assetAddressToCurrencyId;

    constructor() {
        assetAddressToCurrencyId[ASTR_ADDRESS] = 0x0801;
        assetAddressToCurrencyId[VASTR_ADDRESS] = 0x0901;
    }

    function xcm_transfer_asset(bytes32 public_key ,address asset,uint256 amount) internal {
        address[] memory asset_id = new address[](1);
        uint256[] memory asset_amount = new uint256[](1);
        IERC20 erc20 = IERC20(asset);
        erc20.transferFrom(msg.sender, address(this), amount);
        asset_id[0] = asset;
        asset_amount[0] = amount;
        xcm.assets_withdraw(asset_id, asset_amount, public_key, false, BIFROST_PARACHAIN_ID, 0);
    }

    function xcm_transfer_astr(bytes32 public_key , uint256 amount) internal {
        address[] memory asset_id = new address[](1);
        uint256[] memory asset_amount = new uint256[](1);
        asset_id[0] = ASTR_ADDRESS;
        asset_amount[0] = amount;
        xcm.assets_reserve_transfer(asset_id, asset_amount, public_key, false, BIFROST_PARACHAIN_ID, 0);
    }

    function bind(bytes32 substrate_publickey) external {
        addressToSubstratePublickey[msg.sender] = substrate_publickey;
    }

    function mint_vastr() payable external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "AstarXcmAction: The address is not bind to the substrate_publickey");
        xcm_transfer_astr(public_key, msg.value);

        bytes memory callcode =  buildMintCallBytes(msg.sender , ASTR_BYTES);

        // xcm transact
        xcm.remote_transact(BIFROST_PARACHAIN_ID, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }

    function redeem_astr(uint128 vastr_amount) external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "AstarXcmAction: The address is not bind to the substrate_publickey");

        bytes2 vtoken = assetAddressToCurrencyId[VASTR_ADDRESS];
        require(vtoken != bytes2(0), "AstarXcmAction: The input token does not exist");


        xcm_transfer_asset(public_key, VASTR_ADDRESS, vastr_amount);

        bytes memory callcode =  buildRedeemCallBytes(msg.sender , vtoken);
        // xcm transact
        xcm.remote_transact(2030, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }


    function swap_assets_for_exact_assets(address asset_id_in, address asset_id_out,uint256 asset_in_amount, uint128 asset_id_out_min) external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "AstarXcmAction: The address is not bind to the substrate_publickey");

        bytes2 currency_in = assetAddressToCurrencyId[asset_id_in];
        bytes2 currnecy_out = assetAddressToCurrencyId[asset_id_out];
        require(currency_in != bytes2(0) &&  currnecy_out != bytes2(0), "AstarXcmAction: The input token does not exist");

        xcm_transfer_asset(public_key,asset_id_in, asset_in_amount);

        bytes memory callcode =  buildSwapCallBytes(msg.sender , currency_in,currnecy_out,asset_id_out_min);
        // xcm transact
        xcm.remote_transact(2030, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }

    function swap_assets_for_exact_astr(address asset_id_in, uint256 asset_in_amount, uint128 asset_id_out_min) external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "AstarXcmAction: The address is not bind to the substrate_publickey");

        bytes2 currency_in = assetAddressToCurrencyId[asset_id_in];
        require(currency_in != bytes2(0), "AstarXcmAction: The input token does not exist");

        xcm_transfer_asset(public_key,asset_id_in, asset_in_amount);

        bytes memory callcode =  buildSwapCallBytes(msg.sender , currency_in,ASTR_BYTES,asset_id_out_min);
        // xcm transact
        xcm.remote_transact(2030, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }

    function swap_astr_for_exact_assets(address asset_id_out, uint128 asset_id_out_min) payable external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "AstarXcmAction: The address is not bind to the substrate_publickey");


        bytes2 currnecy_out = assetAddressToCurrencyId[asset_id_out];
        require(currnecy_out != bytes2(0), "AstarXcmAction: The input token does not exist");


        xcm_transfer_astr(public_key , msg.value);

        bytes memory callcode =  buildSwapCallBytes(msg.sender , ASTR_BYTES,currnecy_out,asset_id_out_min);
        // xcm transact
        xcm.remote_transact(2030, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }

    function set_bifrost_transaction_fee(uint256 fee) onlyOwner external {
        bifrost_transaction_fee = fee;
    }

    function buildMintCallBytes(address caller , bytes2 token) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(MINT_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, abi.encodePacked(caller) , token, TARGET_CHAIN);
    }

    function buildSwapCallBytes(address caller , bytes2 currency_in, bytes2 currency_in_out, uint128 currency_out_min) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(SWAP_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, abi.encodePacked(caller) , currency_in,currency_in_out, encode_uint128(currency_out_min) ,TARGET_CHAIN);
    }

    function buildRedeemCallBytes(address caller , bytes2 vtoken) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(REDEEM_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, abi.encodePacked(caller) , vtoken, TARGET_CHAIN);
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