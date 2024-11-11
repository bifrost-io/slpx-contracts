// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/Types.sol";

contract MantaPacificSlpx is Ownable {
    address public constant mantaOFT =
        0x17313cE6e47D796E61fDeAc34Ab1F58e3e089082;
    address public constant vMantaOFT =
        0x7746ef546d562b443AE4B4145541a3b1a3D75717;
    address public constant manta = 0x95CeF13441Be50d20cA4558CC0a27B601aC544E5;
    uint16 public constant destChainId = 126;
    bytes32 public remoteContract;
    uint256 public minAmount;

    event Mint(address indexed caller, uint256 indexed amount);
    event Redeem(address indexed caller, uint256 indexed amount);

    function setRemoteContract(address _remoteContract) public onlyOwner {
        require(_remoteContract != address(0), "Invalid remoteContract");
        remoteContract = bytes32(uint256(uint160(_remoteContract)));
    }

    function setMinAmount(uint256 _minAmount) public onlyOwner {
        require(_minAmount != 0, "Invalid minAmount");
        minAmount = _minAmount;
    }

    function create_order(
        address assetAddress,
        uint256 amount,
        uint32 channel_id,
        uint64 dstGasForCall,
        bytes calldata adapterParams
    ) external payable {
        require(amount >= minAmount, "amount too small");

        address oft;
        address sender;

        if (assetAddress == manta) {
            IERC20(assetAddress).transferFrom(
                _msgSender(),
                address(this),
                amount
            );
            IERC20(assetAddress).approve(mantaOFT, amount);
            oft = mantaOFT;
            sender = address(this);
        } else if (assetAddress == vMantaOFT) {
            oft = vMantaOFT;
            sender = _msgSender();
        } else {
            revert("Invalid assetAddress");
        }

        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(sender),
            address(0),
            adapterParams
        );

        bytes memory payload = abi.encode(_msgSender(), channel_id);
        (uint256 estimateFee, ) = IOFTV2(oft).estimateSendAndCallFee(
            destChainId,
            remoteContract,
            amount,
            payload,
            dstGasForCall,
            false,
            adapterParams
        );

        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            (bool success, ) = _msgSender().call{value: refundAmount}("");
            require(success, "failed to refund");
        }

        IOFTV2(oft).sendAndCall{value: estimateFee}(
            sender,
            destChainId,
            remoteContract,
            amount,
            payload,
            dstGasForCall,
            callParams
        );

        if (assetAddress == manta) {
            emit Mint(_msgSender(), amount);
        } else {
            emit Redeem(_msgSender(), amount);
        }
    }

    function estimateSendAndCallFee(
        address assetAddress,
        uint256 amount,
        uint32 channel_id,
        uint64 dstGasForCall,
        bytes calldata adapterParams
    ) public view returns (uint256) {
        address oft;

        if (assetAddress == manta) {
            oft = mantaOFT;
        } else if (assetAddress == vMantaOFT) {
            oft = vMantaOFT;
        } else {
            revert("Invalid assetAddress");
        }

        bytes memory payload = abi.encode(_msgSender(), channel_id);
        (uint256 estimateFee, ) = IOFTV2(oft).estimateSendAndCallFee(
            destChainId,
            remoteContract,
            amount,
            payload,
            dstGasForCall,
            false,
            adapterParams
        );

        return estimateFee;
    }
}
