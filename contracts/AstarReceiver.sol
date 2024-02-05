// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/IOFTReceiverV2.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/IOFTWithFee.sol";
import "./interfaces/XCM.sol";
import "./interfaces/XCM_v2.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";
import "./AstarSlpx.sol";


contract AstarReceiver is Ownable, IOFTReceiverV2 {
    bytes1 private constant ASTAR_CHAIN_TYPE = 0x00;
    bytes2 private constant ASTR_CURRENCY_ID = 0x0803;
    bytes2 private constant VASTR_CURRENCY_ID = 0x0903;
    uint256 private constant BIFROST_PARA_ID = 2030;
    bool private constant IS_RELAY_CHAIN = false;
    address public VASTR = 0xfffFffff00000000000000010000000000000010;
    address public BNC = 0xfFffFffF00000000000000010000000000000007;
    address public astarSlpx = 0x2fD8bbF5dc8b342C09ABF34f211b3488e2d9d691;
    address public polkadotXcm = 0x0000000000000000000000000000000000005004;
    address public astrNativeOFT = 0xEaFAF3EDA029A62bCbE8a0C9a4549ef0fEd5a400;
    address public vAstrProxyOFT = 0xF1d4797E51a4640a76769A50b57abE7479ADd3d8;
    address public astarZkSlpx;
    uint16  public destChainId = 10220;
    mapping(address => address) public derivativeAddress;

    event Mint(address caller, address derivativeAddress, uint256 amount);
    event Redeem(address caller, address derivativeAddress, uint256 amount);

    constructor(address _astarZkSlpx) {
       astarZkSlpx = _astarZkSlpx;
    }

    function zkSlpxMint(address _from, address _to, uint256 _amount) internal {
        require(_from != address(0), "Mint: _from != address(0)");
        require(_to != address(0), "Mint: _to != address(0)");
        require(_amount != 0, "Mint: _amount != 0");
        xcmTransferNativeAsset(_from, _amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN_TYPE, _to);
        bytes memory callData = BuildCallData.buildMintCallBytes(_from, ASTR_CURRENCY_ID, targetChain, "AstarZkEvm");
        (uint64 transactWeight, uint256 feeAmount) = AstarSlpx(astarSlpx).operationToFeeInfo(AstarSlpx.Operation.Mint);

        // xcm transact
        require(XCM(polkadotXcm).remote_transact(BIFROST_PARA_ID,IS_RELAY_CHAIN,BNC,feeAmount,callData,transactWeight),"Failed to send xcm");
        emit Mint(_from, _to, _amount);
    }

    function zkSlpxRedeem(address _from, address _to, uint256 _amount) internal {
        require(_from != address(0), "Redeem: _from != address(0)");
        require(_to != address(0), "Redeem: _to != address(0)");
        require(_amount != 0, "Redeem: _amount != 0");
        xcmTransferAsset(VASTR, _from, _amount);

        bytes memory targetChain = abi.encodePacked(ASTAR_CHAIN_TYPE, _to);
        bytes memory callData = BuildCallData.buildRedeemCallBytes(_from, VASTR_CURRENCY_ID, targetChain);
        (uint64 transactWeight, uint256 feeAmount) = AstarSlpx(astarSlpx).operationToFeeInfo(AstarSlpx.Operation.Redeem);

        // xcm transact
        require(XCM(polkadotXcm).remote_transact(BIFROST_PARA_ID,IS_RELAY_CHAIN,BNC,feeAmount,callData,transactWeight),"Failed to send xcm");
        emit Mint(_from, _to, _amount);
    }
    

    function onOFTReceived(uint16, bytes calldata, uint64, bytes32 _from, uint _amount, bytes calldata _payload) external override {
        require(_msgSender() == astrNativeOFT || _msgSender() == vAstrProxyOFT, "only native oft can call");
        require(address(uint160(uint(_from))) == astarZkSlpx, "only receive msg from astarZkSlpx");
        (address caller, uint8 actionId) = abi.decode(_payload, (address, uint8));
        if(derivativeAddress[caller] == address(0)) {
            setDerivativeAddress(caller);
        }

        if(actionId == 0) {
            IOFTWithFee(astrNativeOFT).withdraw(_amount);
            zkSlpxMint(caller, derivativeAddress[caller], _amount);
        } else if (actionId == 1) {
            zkSlpxRedeem(caller, derivativeAddress[caller], _amount);
        }
    }

    function claimVAstr(address addr, bytes calldata _adapterParams) external payable {
        uint256 amount = DerivativeContract(payable(derivativeAddress[addr])).withdrawVAstr();
        IERC20(VASTR).approve(vAstrProxyOFT, amount);
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        IOFTV2(vAstrProxyOFT).sendFrom{ value: msg.value }(
            address(this),
            destChainId,
            bytes32(uint(uint160(addr))),
            amount,
            callParams
        );
    }

    function claimAstr(address addr, uint256 _amount, uint256 _minAmount, bytes calldata _adapterParams) external payable {
        DerivativeContract(payable(derivativeAddress[addr])).withdrawAstr(_amount);
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        IOFTWithFee(astrNativeOFT).sendFrom{ value: _amount + msg.value }(
            address(this),
            destChainId,
            bytes32(uint(uint160(addr))),
            _amount,
            _minAmount,
            callParams
        );
    }

    function setDerivativeAddress(address addr) internal {
        bytes memory bytecode = type(DerivativeContract).creationCode;
        bytes32 salt = bytes32(uint256(uint160(addr)));
        bytes memory deploymentData = abi.encodePacked(bytecode, salt);
        address contractAddress;
        assembly {
            contractAddress := create2(0, add(deploymentData, 32), mload(deploymentData), salt)
        }

        derivativeAddress[addr] = contractAddress;
    }

    function xcmTransferNativeAsset(address to, uint256 amount) internal {
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(to);
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = address(0);
        assetAmount[0] = amount;
        require(
            XCM(polkadotXcm).assets_reserve_transfer(
                assetId,
                assetAmount,
                publicKey,
                IS_RELAY_CHAIN,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
    }


    function xcmTransferAsset(address assetAddress, address to,  uint256 amount) internal {
        require(assetAddress != address(0), "Invalid assetAddress");
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(to);

        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = assetAddress;
        assetAmount[0] = amount;
        require(
            XCM(polkadotXcm).assets_withdraw(
                assetId,
                assetAmount,
                publicKey,
                IS_RELAY_CHAIN,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
    }

    function getXtokensDestination(bytes32 publicKey) internal pure returns (XCM_v2.Multilocation memory) {
        bytes[] memory interior = new bytes[](2);
        interior[0] = bytes.concat(hex"00", bytes4(uint32(2030)));
        interior[1] = bytes.concat(hex"01", publicKey, hex"00");
        XCM_v2.Multilocation memory dest = XCM_v2.Multilocation({parents: 1,interior: interior});
        return dest;
    }

    receive() external payable {}
}

contract DerivativeContract is ReentrancyGuard  {
    address public astarReceiver;
    address public VASTR = 0xfffFffff00000000000000010000000000000010;

    constructor() {
        astarReceiver = msg.sender;
    }

    function balanceOf() public view returns (uint) {
        return IERC20(VASTR).balanceOf(address(this));
    }

    function withdrawVAstr() external nonReentrant returns(uint256) {
        require(msg.sender == astarReceiver, "DerivativeContract: forbidden");
        uint256 balance = balanceOf();
        require(balance != 0, "DerivativeContract: balance to low");
        IERC20(VASTR).transfer(astarReceiver, balance);
        return balance;
    }

    function withdrawAstr(uint256 _amount) external nonReentrant {
        require(msg.sender == astarReceiver, "DerivativeContract: forbidden");
        require(_amount != 0, "DerivativeContract: balance to low");
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success, "DerivativeContract: failed to withdrawAstr");
    }

    receive() external payable {}
}
