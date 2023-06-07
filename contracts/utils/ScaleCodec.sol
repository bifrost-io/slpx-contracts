// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

library ScaleCodec {
  struct Multilocation {
    uint8 parents;
    bytes[] interior;
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
    for (uint i = 0; i < 32; i++) {
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
    for (uint i = 0; i < 32; i++) {
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

  // Convert an Multilocation to raw bytes
  function toBytesMultilocation(Multilocation memory x) internal pure returns (bytes memory) {
    uint len = 1;
    for (uint i = 0; i < x.interior.length; i++) {
      len += x.interior[i].length;
    }
    bytes memory b = new bytes(len);
    b[0] = bytes1(x.parents);
    uint index = 1;
    for (uint i = 0; i < x.interior.length; i++) {
      // b[i+1] = x.interior[i];
      for (uint j = 0; j < x.interior[i].length; j++) {
        b[index] = x.interior[i][j];
        index++;
      }
    }
    return b;
  }
}