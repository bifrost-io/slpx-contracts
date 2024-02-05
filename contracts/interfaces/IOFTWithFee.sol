// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "./ICommonOFT.sol";

interface IOFTWithFee is ICommonOFT {
    function deposit() external payable;
    function withdraw(uint _amount) external;
    function sendFrom(
        address _from,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint _minAmount,
        LzCallParams calldata _callParams
    ) external payable;
    function sendAndCall(
        address _from,
        uint16 _dstChainId,
        bytes32 _toAddress,
        uint _amount,
        uint _minAmount,
        bytes calldata _payload,
        uint64 _dstGasForCall,
        LzCallParams calldata _callParams
    ) external payable;
}
