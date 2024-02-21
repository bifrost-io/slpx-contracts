// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IOFTWithFee.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/Types.sol";

contract AstarZkSlpx is Ownable {
    address public astrOFTWithFee;
    address public vAstrOFT;
    uint16 public destChainId;
    bytes32 public remoteContract;

    mapping(Types.Operation => uint256) public minAmount;

    event Mint(address caller, uint256 amount);
    event Redeem(address caller, uint256 amount);

    constructor(
        address _astrOFTWithFee,
        address _vAstrOFT,
        uint16 _destChainId
    ) {
        require(_astrOFTWithFee != address(0), "Invalid astrOFTWithFee");
        require(_vAstrOFT != address(0), "Invalid astrOFTWithFee");
        astrOFTWithFee = _astrOFTWithFee;
        vAstrOFT = _vAstrOFT;
        destChainId = _destChainId;
    }

    function setRemoteContract(address _remoteContract) public onlyOwner {
        require(_remoteContract != address(0), "Invalid remoteContract");
        remoteContract = bytes32(uint256(uint160(_remoteContract)));
    }

    function setMinAmount(
        Types.Operation _operation,
        uint256 _minAmount
    ) public onlyOwner {
        require(_minAmount != 0, "Invalid minAmount");
        minAmount[_operation] = _minAmount;
    }

    function mint(
        uint256 _amount,
        uint64 _dstGasForCall,
        bytes calldata _adapterParams
    ) external payable {
        require(_amount >= minAmount[Types.Operation.Mint], "amount too small");
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );

        (uint256 estimateFee, bytes memory payload) = estimateSendAndCallFee(
            _msgSender(),
            Types.Operation.Redeem,
            _amount,
            _dstGasForCall,
            _adapterParams
        );
        require(msg.value <= estimateFee, "Too much fee");

        IOFTWithFee(astrOFTWithFee).sendAndCall{value: msg.value}(
            _msgSender(),
            destChainId,
            remoteContract,
            _amount,
            _amount,
            payload,
            _dstGasForCall,
            callParams
        );

        emit Mint(_msgSender(), _amount);
    }

    function redeem(
        uint256 _amount,
        uint64 _dstGasForCall,
        bytes calldata _adapterParams
    ) external payable {
        require(
            _amount >= minAmount[Types.Operation.Redeem],
            "amount too small"
        );
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );

        (uint256 estimateFee, bytes memory payload) = estimateSendAndCallFee(
            _msgSender(),
            Types.Operation.Redeem,
            _amount,
            _dstGasForCall,
            _adapterParams
        );
        require(msg.value <= estimateFee, "Too much fee");

        IOFTV2(vAstrOFT).sendAndCall{value: msg.value}(
            _msgSender(),
            destChainId,
            remoteContract,
            _amount,
            payload,
            _dstGasForCall,
            callParams
        );

        emit Redeem(_msgSender(), _amount);
    }

    function estimateSendAndCallFee(
        address caller,
        Types.Operation operation,
        uint256 _amount,
        uint64 _dstGasForCall,
        bytes calldata _adapterParams
    ) public view returns (uint256, bytes memory) {
        if (operation == Types.Operation.Mint) {
            bytes memory payload = abi.encode(caller, Types.Operation.Mint);
            (uint256 estimateFee, uint256 _useZro) = IOFTWithFee(astrOFTWithFee)
                .estimateSendAndCallFee(
                    destChainId,
                    remoteContract,
                    _amount,
                    payload,
                    _dstGasForCall,
                    false,
                    _adapterParams
                );
            return (estimateFee, payload);
        } else {
            bytes memory payload = abi.encode(caller, Types.Operation.Redeem);
            (uint256 estimateFee, uint256 _useZro) = IOFTV2(vAstrOFT)
                .estimateSendAndCallFee(
                    destChainId,
                    remoteContract,
                    _amount,
                    payload,
                    _dstGasForCall,
                    false,
                    _adapterParams
                );
            return (estimateFee, payload);
        }
    }
}
