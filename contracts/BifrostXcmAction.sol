// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "./XcmTransactorV2.sol";
import "./Xtokens.sol";
import "./ScaleCodec.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

contract BifrostXcmAction {
  address public owner;
  string internal moonbeamChainID = "000003E8"; // moonbeam chain id for address encoding
  string internal parachainID = "00000007EE"; // bifrost, 2030
  uint64 xtokenWeight = 5000000000;
  uint64 transactRequiredWeightAtMost = 4000000000;
  uint256 feeAmount = 8000;
  uint64 overallWeight = 8000000000;

  // native erc-20 precompiled contract address https://github.com/PureStake/moonbeam/blob/master/precompiles/balances-erc20/ERC20.sol
  address internal constant MOVR_ADDRESS = 0x0000000000000000000000000000000000000802;

  // pre-compiled contract address
  XcmTransactorV2 xcmtransactor = XcmTransactorV2(0x000000000000000000000000000000000000080D);
  Xtokens xtokens = Xtokens(0x0000000000000000000000000000000000000804);

  constructor() {
    owner = msg.sender;
  }

  modifier onlyOwner() {
    require(msg.sender == owner, "Only owner can call this.");
    _;
  }

  function setOwner(address newOwner) external onlyOwner {
    owner = newOwner;
  }

  function buildMintCallBytes(ScaleCodec.Multilocation memory tokenID, uint256 tokenAmount) internal pure returns (bytes memory) {
    bytes memory prefix = new bytes(2);
    prefix[0] = bytes1(uint8(124));
    prefix[1] = bytes1(uint8(0));
    bytes memory tokenIDBytes = ScaleCodec.toBytesMultilocation(tokenID);
    bytes memory tokenAmountBytes = ScaleCodec.toBytes256(tokenAmount);
    bytes memory rst = bytes.concat(prefix, tokenIDBytes, tokenAmountBytes);
    return rst;
  }

  function buildRedeemCallBytes(ScaleCodec.Multilocation memory vtokenID, uint256 vtokenAmount) internal pure returns (bytes memory) {
    bytes memory prefix = new bytes(2);
    prefix[0] = bytes1(uint8(124));
    prefix[1] = bytes1(uint8(1));
    bytes memory vTokenIDBytes = ScaleCodec.toBytesMultilocation(vtokenID);
    bytes memory tokenAmountBytes = ScaleCodec.toBytes256(vtokenAmount);
    bytes memory rst = bytes.concat(prefix, vTokenIDBytes, tokenAmountBytes);
    return rst;
  }

  function buildSwapCallBytes(ScaleCodec.Multilocation memory inTokenID, ScaleCodec.Multilocation memory outTokenID, uint256 amountInMax, uint256 amountOut) internal pure returns (bytes memory) {
    bytes memory prefix = new bytes(2);
    prefix[0] = bytes1(uint8(124));
    prefix[1] = bytes1(uint8(2));
    bytes memory inTokenIDBytes = ScaleCodec.toBytesMultilocation(inTokenID);
    bytes memory outTokenIDBytes = ScaleCodec.toBytesMultilocation(outTokenID);
    bytes memory amountInMaxBytes = ScaleCodec.toBytes256(amountInMax);
    bytes memory amountOutBytes = ScaleCodec.toBytes256(amountOut);
    bytes memory rst = bytes.concat(prefix, inTokenIDBytes, outTokenIDBytes, amountInMaxBytes, amountOutBytes);
    return rst;
  }

  /// generate bifrost account_id32
  /// 1. public key = evm address + parachain id hex + 16 zeros
  /// 2. concat "01" + public key + "00"
  /// 01 means parachain
  /// 00 means any network
  function generateBifrostAccountId32() internal view returns (string memory) {
    string memory concatAccountId32 = string.concat("01",Strings.toHexString(msg.sender), moonbeamChainID, "0000000000000000","00");
    return concatAccountId32;
  }

  /// mint vtoken from token asset
  ///
  /// @param tokenID multilocation of token
  /// @param tokenAmount token amount
  function mint(ScaleCodec.Multilocation memory tokenID, uint256 tokenAmount) public {
    // xtokens call
    bytes[] memory interior = new bytes[](2);
    interior[0] = ScaleCodec.fromHex(parachainID);
    string memory concatAccountId32 = generateBifrostAccountId32();
    console.log(concatAccountId32);
    interior[1] = ScaleCodec.fromHex(concatAccountId32);
    Xtokens.Multilocation memory derivedAccount = Xtokens.Multilocation(
        1,
        interior
    );
    xtokens.transfer(MOVR_ADDRESS, tokenAmount, derivedAccount, xtokenWeight);

    // xcm transactor call
    bytes[] memory chainDest = new bytes[](1);
    chainDest[0] = ScaleCodec.fromHex(parachainID);
    XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation(
        1,
        chainDest
    );
    bytes memory call_data = buildMintCallBytes(tokenID, tokenAmount);
    xcmtransactor.transactThroughSigned(
        dest,
        MOVR_ADDRESS,
        transactRequiredWeightAtMost,
        call_data,
        feeAmount,
        overallWeight
    );
  }

  /// redeem vtoken to token asset
  ///
  /// @param vtokenID multilocation of vtoken
  /// @param vtokenAmount token amount
  function redeem(ScaleCodec.Multilocation memory vtokenID, uint256 vtokenAmount) public {
    // xtokens call
    bytes[] memory interior = new bytes[](2);
    interior[0] = ScaleCodec.fromHex(parachainID);
    string memory concatAccountId32 = generateBifrostAccountId32();
    interior[1] = ScaleCodec.fromHex(concatAccountId32);
    Xtokens.Multilocation memory derivedAccount = Xtokens.Multilocation(
        1, 
        interior
    );
    xtokens.transfer(MOVR_ADDRESS, vtokenAmount, derivedAccount, xtokenWeight);

    // xcm transactor call
    bytes[] memory chainDest = new bytes[](1);
    chainDest[0] = ScaleCodec.fromHex(parachainID);
    XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation(
        1,
        chainDest
    );
    bytes memory call_data = buildRedeemCallBytes(vtokenID, vtokenAmount);
    xcmtransactor.transactThroughSigned(
        dest,
        MOVR_ADDRESS,
        transactRequiredWeightAtMost,
        call_data,
        feeAmount,
        overallWeight
    );
  }

  /// swap token asset
  ///
  /// @param inTokenID multilocation of input token
  /// @param outTokenID multilocation of output token
  /// @param amountInMax amount input max
  /// @param amountOut amount output
  function swap(ScaleCodec.Multilocation memory inTokenID, ScaleCodec.Multilocation memory outTokenID, uint256 amountInMax, uint256 amountOut) public {
    // xtokens call
    bytes[] memory interior = new bytes[](2);
    interior[0] = ScaleCodec.fromHex(parachainID);
    string memory concatAccountId32 = generateBifrostAccountId32();
    interior[1] = ScaleCodec.fromHex(concatAccountId32);
    Xtokens.Multilocation memory derivedAccount = Xtokens.Multilocation(
        1,
        interior
    );
    xtokens.transfer(MOVR_ADDRESS, amountInMax, derivedAccount, xtokenWeight);

    // xcm transactor call
    bytes[] memory chainDest = new bytes[](1);
    chainDest[0] = ScaleCodec.fromHex(parachainID);
    XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation(
        1,
        chainDest
    );
    bytes memory call_data = buildSwapCallBytes(inTokenID, outTokenID, amountInMax, amountOut);
    xcmtransactor.transactThroughSigned(
        dest,
        MOVR_ADDRESS,
        transactRequiredWeightAtMost,
        call_data,
        feeAmount,
        overallWeight
    );
  }
}
