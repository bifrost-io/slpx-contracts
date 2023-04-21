// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./XcmTransactorV2.sol";
import "./Xtokens.sol";
import "./ScaleCodec.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BifrostXcmAction is Ownable {

  uint32 internal constant BIFROST_PARA_ID = 2030;

  uint64 xtokenWeight = 10000000000;
  uint64 transactRequiredWeightAtMost = 10000000000;
  uint256 feeAmount = 1000000000000;
  uint64 overallWeight = 10000000000;

    uint8 internal constant PALLET_INDEX = 125;
    uint8 internal constant MINT_CALL_INDEX = 0;
    uint8 internal constant SWAP_CALL_INDEX = 1;
    uint8 internal constant REDEEM_CALL_INDEX = 2;

    // Moonbeam chain ===> 0x02
    bytes1 internal constant TARGET_CHAIN = hex"02";
    bytes2 internal constant GLMR_BYTES = 0x0801;
    bytes2 internal constant vGLMR_BYTES = 0x0901;

  // native erc-20 precompiled contract address https://github.com/PureStake/moonbeam/blob/master/precompiles/balances-erc20/ERC20.sol
  address internal constant GLMR = 0x0000000000000000000000000000000000000802;
  address internal constant vGLMR = 0xFffFFFff45ee082d5f3bA85fC27ef14e6C95e06d;
  address internal constant BNC =  0xFFffffFf7cC06abdF7201b350A1265c62C8601d2;

  // pre-compiled contract address
  XcmTransactorV2 xcmtransactor = XcmTransactorV2(0x000000000000000000000000000000000000080D);
  Xtokens xtokens = Xtokens(0x0000000000000000000000000000000000000804);

  mapping (address => bytes32) public addressToSubstratePublickey;
  mapping (address => bytes2) public assetAddressToCurrencyId;

      constructor() {
        assetAddressToCurrencyId[GLMR] = 0x0801;
        assetAddressToCurrencyId[vGLMR] = 0x0901;
    }

  function bind(bytes32 substrate_publickey) external {
        addressToSubstratePublickey[msg.sender] = substrate_publickey;
    }

   function set_bifrost_transaction_fee(uint256 fee) onlyOwner external {
        feeAmount = fee;
    }

  function transfer_glmr_to_bifrost(bytes32 public_key,uint256 amount) internal {
    bytes[] memory interior = new bytes[](2);
    // Parachain: 2030
    interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
    // AccountId32: { id: public_key , network: any }
    interior[1] = bytes.concat(hex"01", public_key , bytes1(0));

    Xtokens.Multilocation memory dest_account = Xtokens.Multilocation({
      parents: 1, interior: interior
    });
    xtokens.transfer(GLMR, amount, dest_account, xtokenWeight);
  }

  function transfer_assets_to_bifrost(address asset_address,bytes32 public_key,uint256 amount) public   {
    bytes[] memory interior = new bytes[](2);
    // Parachain: 2030
    interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
    // AccountId32: { id: public_key , network: any }
    interior[1] = bytes.concat(hex"01", public_key , bytes1(0));

    Xtokens.Multilocation memory dest_account = Xtokens.Multilocation({
      parents: 1, interior: interior
    });
    IERC20 asset = IERC20(asset_address);
    asset.transferFrom(msg.sender, address(this), amount);
    xtokens.transfer(asset_address, amount, dest_account, xtokenWeight);
  }

  function mint_glmr() payable external  {
    // Check if the public key is bound 
    bytes32 public_key = addressToSubstratePublickey[msg.sender];
    require(public_key != bytes32(0) , "MoonbeamXcmAction: The address is not bind to the substrate_publickey");

    // xtokens call
    transfer_glmr_to_bifrost(public_key,msg.value);

    // xcm transactor call
    bytes[] memory interior = new bytes[](1);
    // Parachain: 2030
    interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
    XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
      parents: 1, interior: interior
    });
    // Build bifrost xcm-action mint call data
    bytes memory call_data = buildMintCallBytes(msg.sender, GLMR_BYTES);
    // XCM Transact
    xcmtransactor.transactThroughSigned(
        dest,
        BNC,
        transactRequiredWeightAtMost,
        call_data,
        feeAmount,
        overallWeight
    );
  }

  function redeem(address vtoken_address, uint256 vtoken_amount) external  {
     // Check if the public key is bound 
    bytes32 public_key = addressToSubstratePublickey[msg.sender];
    require(public_key != bytes32(0) , "MoonbeamXcmAction: The address is not bind to the substrate_publickey");

    bytes2 vtoken = assetAddressToCurrencyId[vGLMR];
    require(vtoken != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

    // xtokens call
    transfer_assets_to_bifrost(vtoken_address,public_key,vtoken_amount);

    // xcm transactor call
    bytes[] memory interior = new bytes[](1);
    // Parachain: 2030
    interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
    XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
      parents: 1, interior: interior
    });

    bytes memory call_data = buildRedeemCallBytes(msg.sender, vtoken);
    xcmtransactor.transactThroughSigned(
        dest,
        BNC,
        transactRequiredWeightAtMost,
        call_data,
        feeAmount,
        overallWeight
    );
  }

  function swap_assets_for_exact_assets(address asset_id_in, address asset_id_out,uint256 asset_in_amount, uint128 asset_id_out_min) external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "MoonbeamXcmAction: The address is not bind to the substrate_publickey");

        bytes2 currency_in = assetAddressToCurrencyId[asset_id_in];
        bytes2 currnecy_out = assetAddressToCurrencyId[asset_id_out];
        require(currency_in != bytes2(0) &&  currnecy_out != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        transfer_assets_to_bifrost(asset_id_in,public_key,asset_in_amount);

        // xcm transactor call
        bytes[] memory interior = new bytes[](1);
        // Parachain: 2030
        interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
        XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
          parents: 1, interior: interior
        });

        bytes memory call_data =  buildSwapCallBytes(msg.sender , currency_in,currnecy_out,asset_id_out_min);
        xcmtransactor.transactThroughSigned(
            dest,
            BNC,
            transactRequiredWeightAtMost,
            call_data,
            feeAmount,
            overallWeight
        );
    }

    function swap_assets_for_exact_glmr(address asset_id_in, uint256 asset_in_amount, uint128 asset_id_out_min) external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "MoonbeamXcmAction: The address is not bind to the substrate_publickey");

        bytes2 currency_in = assetAddressToCurrencyId[asset_id_in];
        require(currency_in != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        transfer_assets_to_bifrost(asset_id_in,public_key,asset_in_amount);

        // xcm transactor call
        bytes[] memory interior = new bytes[](1);
        // Parachain: 2030
        interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
        XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
          parents: 1, interior: interior
        });

        bytes memory call_data =  buildSwapCallBytes(msg.sender , currency_in,GLMR_BYTES,asset_id_out_min);
        xcmtransactor.transactThroughSigned(
            dest,
            BNC,
            transactRequiredWeightAtMost,
            call_data,
            feeAmount,
            overallWeight
        );
    }

    function swap_glmr_for_exact_assets(address asset_id_out, uint128 asset_id_out_min) payable external {
        bytes32 public_key = addressToSubstratePublickey[msg.sender];
        require(public_key != bytes32(0) , "MoonbeamXcmAction: The address is not bind to the substrate_publickey");


        bytes2 currnecy_out = assetAddressToCurrencyId[asset_id_out];
        require(currnecy_out != bytes2(0), "MoonbeamXcmAction: The input token does not exist");

        transfer_glmr_to_bifrost(public_key , msg.value);

        // xcm transactor call
        bytes[] memory interior = new bytes[](1);
        // Parachain: 2030
        interior[0] = bytes.concat(hex"00", bytes4(BIFROST_PARA_ID));
        XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation({
          parents: 1, interior: interior
        });

        bytes memory call_data =  buildSwapCallBytes(msg.sender , GLMR_BYTES,currnecy_out,asset_id_out_min);
        xcmtransactor.transactThroughSigned(
            dest,
            BNC,
            transactRequiredWeightAtMost,
            call_data,
            feeAmount,
            overallWeight
        );
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
