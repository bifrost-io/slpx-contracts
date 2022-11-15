// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.16;

import "./XcmTransactorV2.sol";
import "./Xtokens.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract BifrostXcmAction {
  address public owner;
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

  //https://docs.substrate.io/reference/scale-codec/
  function toBytes64(uint64 x) internal pure returns (bytes memory) {
      bytes memory b = new bytes(8);
      for (uint i = 0; i < 8; i++) {
          b[i] = bytes1(uint8(x / (2**(8*i)))); 
      }
      return b;
  }

  function toBytes256(uint256 x) internal pure returns (bytes memory) {
      bytes memory b = new bytes(32);
      for (uint i = 0; i < 8; i++) {
          b[i] = bytes1(uint8(x / (2**(8*i)))); 
      }
      return b;
  }

  //https://docs.substrate.io/reference/scale-codec/
  function toTruncBytes64(uint64 x) internal pure returns (bytes memory) {
      bytes memory b = new bytes(8);
      uint len = 0;
      for (uint i = 0; i < 8; i++) {
          uint8 temp = uint8(x / (2**(8*i)));
          if(temp != 0) {
              b[i] = bytes1(temp); 
          } else {
              len = i;
              break;
          }
      }
      bytes memory rst = new bytes(len);
      for (uint i = 0; i < len; i++) {
          rst[i] = b[i];
      }
      return rst;
  }

  function toTruncBytes256(uint256 x) internal pure returns (bytes memory) {
      bytes memory b = new bytes(32);
      uint len = 0;
      for (uint i = 0; i < 8; i++) {
          uint8 temp = uint8(x / (2**(8*i)));
          if(temp != 0) {
              b[i] = bytes1(temp); 
          } else {
              len = i;
              break;
          }
      }
      bytes memory rst = new bytes(len);
      for (uint i = 0; i < len; i++) {
          rst[i] = b[i];
      }
      return rst;
  }

  // Convert an hexadecimal character to their value
  function fromScaleChar(uint8 c) internal pure returns (uint8) {
      if (bytes1(c) >= bytes1('0') && bytes1(c) <= bytes1('9')) {
          return 48 + c - uint8(bytes1('0'));
      }
      if (bytes1(c) >= bytes1('a') && bytes1(c) <= bytes1('z')) {
          return 97 + c - uint8(bytes1('a'));
      }
      if (bytes1(c) >= bytes1('A') && bytes1(c) <= bytes1('Z')) {
          return 65 + c - uint8(bytes1('A'));
      }
      revert("fail");
  }

  // encode the string to bytes
  // following the scale format
  // format: len + content
  // a-z: 61->87
  // A-Z: 41->57
  // 0-9: 30->40
  function toScaleString(string memory s) internal pure returns (bytes memory) {
      bytes memory ss = bytes(s);
      bytes memory len = toTruncBytes64(uint64(ss.length*4));
      bytes memory content = new bytes(ss.length);
      for (uint i=0; i<ss.length; ++i) {
          content[i] = bytes1(fromScaleChar(uint8(ss[i])));
      }
      bytes memory rst = bytes.concat(len, content);
      return rst;
  }

  function buildMintCallBytes(uint256 tokenID, uint256 tokenAmount) internal pure returns (bytes memory) {
      bytes memory prefix = new bytes(2);
      prefix[0] = bytes1(uint8(127));
      prefix[1] = bytes1(uint8(0));
      bytes memory tokenIDBytes = toBytes256(tokenID);
      bytes memory tokenAmountBytes = toBytes256(tokenAmount);
      bytes memory rst = bytes.concat(prefix, tokenIDBytes, tokenAmountBytes);
      return rst;
  }

  function buildRedeemCallBytes(uint256 vtokenID, uint256 vtokenAmount) internal pure returns (bytes memory) {
      bytes memory prefix = new bytes(2);
      prefix[0] = bytes1(uint8(127));
      prefix[1] = bytes1(uint8(0));
      bytes memory vTokenIDBytes = toBytes256(vtokenID);
      bytes memory tokenAmountBytes = toBytes256(vtokenAmount);
      bytes memory rst = bytes.concat(prefix, vTokenIDBytes, tokenAmountBytes);
      return rst;
  }

  function buildSwapCallBytes(uint256 inTokenID, uint256 outTokenID,  uint256 vtokenAmount) internal pure returns (bytes memory) {
      bytes memory prefix = new bytes(2);
      prefix[0] = bytes1(uint8(127));
      prefix[1] = bytes1(uint8(0));
      bytes memory inTokenIDBytes = toBytes256(inTokenID);
      bytes memory outTokenIDBytes = toBytes256(outTokenID);
      bytes memory tokenAmountBytes = toBytes256(vtokenAmount);
      bytes memory rst = bytes.concat(prefix, inTokenIDBytes, outTokenIDBytes, tokenAmountBytes);
      return rst;
  }

  // Convert an hexadecimal character to their value
  function fromHexChar(uint8 c) internal pure returns (uint8) {
      if (bytes1(c) >= bytes1('0') && bytes1(c) <= bytes1('9')) {
          return c - uint8(bytes1('0'));
      }
      if (bytes1(c) >= bytes1('a') && bytes1(c) <= bytes1('f')) {
          return 10 + c - uint8(bytes1('a'));
      }
      if (bytes1(c) >= bytes1('A') && bytes1(c) <= bytes1('F')) {
          return 10 + c - uint8(bytes1('A'));
      }
      revert("fail");
  }
  // Convert an hexadecimal string to raw bytes
  function fromHex(string memory s) internal pure returns (bytes memory) {
      bytes memory ss = bytes(s);
      require(ss.length%2 == 0); // length must be even
      bytes memory r = new bytes(ss.length/2);
      for (uint i=0; i<ss.length/2; ++i) {
          r[i] = bytes1(fromHexChar(uint8(ss[2*i])) * 16 +
                      fromHexChar(uint8(ss[2*i+1])));
      }
      return r;
  }

  /// generate bifrost account_id32
  /// 1. public key = append 24 zeros to the evm address
  /// 2. concat "01" + public key + "00"
  /// 01 means parachain
  /// 00 means any network
  function generateBifrostAccountId32() internal view returns (string memory) {
    string memory concatAccountId32 = string.concat("01",Strings.toHexString(msg.sender),"000000000000000000000000","00");
    return concatAccountId32;
  }

  /// mint vtoken from token asset
  ///
  /// @param tokenAmount token amount
  /// @param tokenID asset id of token
  function mint(uint256 tokenID, uint256 tokenAmount) public {
    // xtokens call
    bytes[] memory interior = new bytes[](2);
    interior[0] = fromHex(parachainID);
    string memory concatAccountId32 = generateBifrostAccountId32();
    console.log(concatAccountId32);
    interior[1] = fromHex(concatAccountId32);
    Xtokens.Multilocation memory derivedAccount = Xtokens.Multilocation(
        1,
        interior
    );
    xtokens.transfer(MOVR_ADDRESS, tokenAmount, derivedAccount, xtokenWeight);

    // xcm transactor call
    bytes[] memory chainDest = new bytes[](1);
    chainDest[0] = fromHex(parachainID);
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
  /// @param vtokenAmount token amount
  /// @param vtokenID asset id of vtoken
  function redeem(uint256 vtokenID, uint256 vtokenAmount) public {
    // xtokens call
    bytes[] memory interior = new bytes[](2);
    interior[0] = fromHex(parachainID);
    string memory concatAccountId32 = generateBifrostAccountId32();
    interior[1] = fromHex(concatAccountId32);
    Xtokens.Multilocation memory derivedAccount = Xtokens.Multilocation(
        1, 
        interior
    );
    xtokens.transfer(MOVR_ADDRESS, vtokenAmount, derivedAccount, xtokenWeight);

    // xcm transactor call
    bytes[] memory chainDest = new bytes[](1);
    chainDest[0] = fromHex(parachainID);
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
  /// @param inTokenAmount input xc-token amount
  /// @param inTokenID asset id of input token
  /// @param outTokenID asset if of output token
  function swap(uint256 inTokenID, uint256 outTokenID, uint256 inTokenAmount) public {
    // xtokens call
    bytes[] memory interior = new bytes[](2);
    interior[0] = fromHex(parachainID);
    string memory concatAccountId32 = generateBifrostAccountId32();
    interior[1] = fromHex(concatAccountId32);
    Xtokens.Multilocation memory derivedAccount = Xtokens.Multilocation(
        1,
        interior
    );
    xtokens.transfer(MOVR_ADDRESS, inTokenAmount, derivedAccount, xtokenWeight);

    // xcm transactor call
    bytes[] memory chainDest = new bytes[](1);
    chainDest[0] = fromHex(parachainID);
    XcmTransactorV2.Multilocation memory dest = XcmTransactorV2.Multilocation(
        1,
        chainDest
    );
    bytes memory call_data = buildSwapCallBytes(inTokenID, outTokenID, inTokenAmount);
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
