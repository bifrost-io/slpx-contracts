// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IOFTWithFee.sol";
import "./interfaces/IOFTV2.sol";

contract AstarZkSlpx is Ownable {
    address public astrOFTWithFee = 0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400;
    address public vAstrOFT = 0x051713fD66845a13BF23BACa008C5C22C27Ccb58;
    uint8 private constant MINT = 0;
    uint8 private constant REDEEM = 1;
    uint16 public constant destChainId = 10210;
    bytes32 public remoteContract;

    mapping(uint8 => uint256) public minAmount;

    event Mint(address caller, uint256 amount);
    event Redeem(address caller, uint256 amount);

    function setRemoteContract(address _remoteContract) public onlyOwner {
        remoteContract = bytes32(uint(uint160(_remoteContract)));
    }

    function setMinAmount(uint8 _action, uint256 _minAmount) public onlyOwner {
        minAmount[_action] = _minAmount;
    }

    function mint(uint256 _amount, uint64 _dstGasForCall, bytes calldata _adapterParams) external payable {
        require(_amount >= minAmount[MINT], "amount too small");
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(msg.sender), 
            address(0), 
            _adapterParams
        );

        IOFTWithFee(astrOFTWithFee).sendAndCall{value: msg.value}(
            msg.sender,
            destChainId,
            remoteContract,
            _amount,
            _amount,
            abi.encode(_msgSender(), MINT),
            _dstGasForCall,
            callParams
        );

        emit Mint(msg.sender, _amount);
    }

    function redeem(uint256 _amount, uint64 _dstGasForCall, bytes calldata _adapterParams) external payable {
        require(_amount >= minAmount[REDEEM], "amount too small");
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(msg.sender),
            address(0),
            _adapterParams
        );

        IOFTV2(vAstrOFT).sendAndCall{value: msg.value}(
            msg.sender,
            destChainId,
            remoteContract,
            _amount,
            abi.encode(_msgSender(), REDEEM),
            _dstGasForCall,
            callParams
        );

        emit Redeem(msg.sender, _amount);
    }
}
