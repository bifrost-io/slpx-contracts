// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "./Blake2b.sol";

library AddressToAccount {
    using Blake2b for Blake2b.Instance;

    function blake2bHash(bytes memory src) public view returns (bytes32 des) {
        Blake2b.Instance memory instance = Blake2b.init(hex"", 32);
        return abi.decode(instance.finalize(src), (bytes32));
    }

    function AddressToSubstrateAccount(
        address addr
    ) public view returns (bytes32 account) {
        bytes memory prefix = bytes("evm:");
        bytes memory addrBytes = abi.encodePacked(addr);
        bytes memory data = abi.encodePacked(prefix, addrBytes);
        return blake2bHash(data);
    }
}
