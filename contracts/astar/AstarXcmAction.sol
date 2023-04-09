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

    bytes1 internal constant TARGET_CHAIN = bytes1(0);
    bytes2 internal constant ASTR_BYTES = 0x0801;

    uint256 public bifrost_transaction_fee = 1000000000000;
    bytes32 public xcm_action_account_id;

    XCM xcm = XCM(0x0000000000000000000000000000000000005004);

    mapping (string => bytes) public tokenNameToBytes;

    function xcm_transfer_asset(address asset,uint256 amount) internal {
        address[] memory asset_id = new address[](1);
        uint256[] memory asset_amount = new uint256[](1);
        IERC20 erc20 = IERC20(asset);
        erc20.transferFrom(msg.sender, address(this), amount);
        asset_id[0] = asset;
        asset_amount[0] = amount;
        xcm.assets_withdraw(asset_id, asset_amount, xcm_action_account_id, false, BIFROST_PARACHAIN_ID, 0);
    }

    function xcm_transfer_astr(uint256 amount) internal {
        address[] memory asset_id = new address[](1);
        uint256[] memory asset_amount = new uint256[](1);
        asset_id[0] = ASTR_ADDRESS;
        asset_amount[0] = amount;
        xcm.assets_reserve_transfer(asset_id, asset_amount, xcm_action_account_id, false, BIFROST_PARACHAIN_ID, 0);
    }

    function mint_vastr() payable external {
        xcm_transfer_asset(BNC_ADDRESS, bifrost_transaction_fee);
        xcm_transfer_astr(msg.value);

        bytes memory callcode =  buildMintCallBytes(ASTR_BYTES, msg.sender);

        // xcm transact
        xcm.remote_transact(BIFROST_PARACHAIN_ID, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }


    function swap(address asset_id , uint256 asset_amount , bytes memory callcode) payable external {
        if (asset_id == BNC_ADDRESS){
            xcm_transfer_asset(BNC_ADDRESS, bifrost_transaction_fee + asset_amount);
        } else if (asset_id == ASTR_ADDRESS){
            xcm_transfer_asset(BNC_ADDRESS, bifrost_transaction_fee);
            xcm_transfer_astr(msg.value);
        } else {
            xcm_transfer_asset(BNC_ADDRESS, bifrost_transaction_fee);
            xcm_transfer_asset(asset_id, asset_amount);
        }
        // xcm transact
        xcm.remote_transact(2030, false, BNC_ADDRESS, bifrost_transaction_fee / 10, callcode, 8000000000);
    }


    function set_bifrost_transaction_fee(uint256 fee) onlyOwner external {
        bifrost_transaction_fee = fee;
    }

    function set_xcm_action_account_id(bytes32 account_id) onlyOwner external {
        xcm_action_account_id = account_id;
    }

    function buildMintCallBytes(bytes2 token, address receiver) public pure returns (bytes memory) {

        bytes memory prefix = new bytes(2);
        // storage pallet index
        prefix[0] = bytes1(PALLET_INDEX);
        // storage call index
        prefix[1] = bytes1(MINT_CALL_INDEX);

        // astar target_chain = bytes1(0)
        return bytes.concat(prefix, token, TARGET_CHAIN, abi.encodePacked(receiver));
    }
}