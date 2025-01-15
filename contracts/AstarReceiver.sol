// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./interfaces/IOFTReceiverV2.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/IOFTWithFee.sol";
import "./interfaces/XCM.sol";
import "./interfaces/XCM_v2.sol";
import "./interfaces/Types.sol";
import "./interfaces/IWASTR.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";
import "./AstarSlpx.sol";
import "./DerivativeContract.sol";

contract AstarReceiver is CCIPReceiver, Ownable, IOFTReceiverV2 {
    bytes1 private constant ASTAR_CHAIN_TYPE = 0x00;
    bytes2 private constant ASTR_CURRENCY_ID = 0x0803;
    bytes2 private constant VASTR_CURRENCY_ID = 0x0903;
    uint256 private constant BIFROST_PARA_ID = 2030;
    bool private constant IS_RELAY_CHAIN = false;
    uint16 public constant destChainId = 340;
    address public constant BNC = 0xfFffFffF00000000000000010000000000000007;
    address public constant VASTR = 0xfffFffff00000000000000010000000000000010;
    address public constant astarSlpx =
        0xc6bf0C5C78686f1D0E2E54b97D6de6e2cEFAe9fD;
    address public constant polkadotXcm =
        0x0000000000000000000000000000000000005004;
    address public constant vAstrProxyOFT =
        0xba273b7Fa296614019c71Dcc54DCa6C922A93BcF;

    uint64 private constant soneiumChainSelector = 12505351618335765396;
    address private constant WASTR =
        0x37795FdD8C165CaB4D6c05771D564d80439CD093;
    address private constant astarRouter =
        0x8D5c5CB8ec58285B424C93436189fB865e437feF;
    address public soneiumSlpx;

    uint256 public vastrLayerZeroFee;
    address public scriptTrigger;
    mapping(address => address) public callerToDerivativeAddress;
    mapping(address => bool) public isDerivativeAddress;

    event SetDerivativeAddress(
        address indexed caller,
        address indexed derivativeAddress
    );
    event Receive(address indexed sender, uint256 indexed amount);
    event SetLayerZeroFee(
        address indexed scriptTrigger,
        uint256 indexed vastrFee
    );
    event SetScriptTrigger(address indexed scriptTrigger);

    constructor(address _soneiumSlpx, address router) CCIPReceiver(router) {
        require(_soneiumSlpx != address(0), "Invalid soneiumSlpx");
        soneiumSlpx = _soneiumSlpx;
    }

    function create_order(
        address caller,
        address assetAddress,
        bytes2 token,
        uint128 amount,
        address receiver,
        uint32 channel_id
    ) internal {
        require(amount > 0, "amount must be greater than 0");
        if (assetAddress == address(0)) {
            xcmTransferNativeAsset(caller, uint256(amount));
        } else {
            xcmTransferAsset(assetAddress, caller, uint256(amount));
        }

        // Build bifrost slpx create order call data
        bytes memory callData = BuildCallData.buildCreateOrderCallBytes(
            caller,
            block.chainid,
            block.number,
            token,
            amount,
            abi.encodePacked(ASTAR_CHAIN_TYPE, receiver),
            "Soneium",
            channel_id
        );
        // XCM Transact
        (uint64 transactWeight, uint256 feeAmount) = AstarSlpx(astarSlpx)
            .operationToFeeInfo(AstarSlpx.Operation.Mint);
        require(
            XCM(polkadotXcm).remote_transact(
                BIFROST_PARA_ID,
                IS_RELAY_CHAIN,
                BNC,
                feeAmount,
                callData,
                transactWeight
            ),
            "Failed to send xcm"
        );
    }

    function onOFTReceived(
        uint16 _srcChainId,
        bytes calldata,
        uint64,
        bytes32 _from,
        uint _amount,
        bytes calldata _payload
    ) external override {
        require(_srcChainId == destChainId, "only receive msg from astar-zk");
        require(_msgSender() == vAstrProxyOFT, "only native oft can call");
        require(
            address(uint160(uint(_from))) == soneiumSlpx,
            "only receive msg from soneiumSlpx"
        );
        processOFTReceive(_amount, _payload);
    }

    /// handle a received message
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    ) internal override {
        Client.EVMTokenAmount[] memory tokenAmounts = any2EvmMessage
            .destTokenAmounts;
        address token = tokenAmounts[0].token; // we expect one token to be transfered at once but of course, you can transfer several tokens.
        uint256 amount = tokenAmounts[0].amount; // we expect one token to be transfered at once but of course, you can transfer several tokens.
        processCCIPReceive(token, amount, any2EvmMessage.data);
    }

    function processCCIPReceive(address token, uint256 amount, bytes memory data) internal {
        require(token == WASTR, "only receive WASTR");
        IWASTR(payable(WASTR)).withdraw(amount);

        (address caller, Types.Operation operation, address receiver, uint32 channelId) = abi.decode(
            data,
            (address, Types.Operation, address, uint32)
        );
        if (callerToDerivativeAddress[receiver] == address(0)) {
            setDerivativeAddress(receiver);
        }
        require(operation == Types.Operation.Mint, "only mint operation is allowed");
        create_order(
            caller,
            address(0),
            ASTAR_CHAIN_TYPE,
            uint128(amount),
            callerToDerivativeAddress[receiver],
            channelId
        );
    }

    function processOFTReceive(uint256 amount, bytes memory data) internal  {
        (address caller, Types.Operation operation) = abi.decode(
            data,
            (address, Types.Operation)
        );
        if (callerToDerivativeAddress[caller] == address(0)) {
            setDerivativeAddress(caller);
        }
        require(operation == Types.Operation.Redeem, "only redeem operation is allowed");
        bool success = IERC20(VASTR).transfer(
            scriptTrigger,
            vastrLayerZeroFee
        );
        require(success, "failed to charge");
        create_order(
            caller,
            VASTR,
            VASTR_CURRENCY_ID,
            uint128(amount - vastrLayerZeroFee),
            callerToDerivativeAddress[caller],
            0
        );
    }

    function claimVAstr(
        address addr,
        bytes calldata _adapterParams
    ) external payable {
        require(_msgSender() == scriptTrigger, "must be scriptTrigger");
        address derivativeAddress = callerToDerivativeAddress[addr];
        require(derivativeAddress != address(0), "invalid address");
        uint256 amount = DerivativeContract(derivativeAddress)
            .withdrawErc20Token(VASTR);
        IERC20(VASTR).approve(vAstrProxyOFT, amount);
        ICommonOFT.LzCallParams memory callParams = ICommonOFT.LzCallParams(
            payable(_msgSender()),
            address(0),
            _adapterParams
        );
        bytes32 toAddress = bytes32(uint256(uint160(addr)));
        (uint256 estimateFee, ) = IOFTV2(vAstrProxyOFT).estimateSendFee(
            destChainId,
            toAddress,
            amount,
            false,
            _adapterParams
        );
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            (bool success, ) = _msgSender().call{value: refundAmount}("");
            require(success, "failed to refund");
        }
        IOFTV2(vAstrProxyOFT).sendFrom{value: estimateFee}(
            address(this),
            destChainId,
            toAddress,
            amount,
            callParams
        );
    }

    function claimAstr(address addr, uint256 gasLimit) external payable {
        require(_msgSender() == scriptTrigger, "must be scriptTrigger");
        uint256 _amount = DerivativeContract(callerToDerivativeAddress[addr]).withdrawNativeToken();

        IWASTR(payable(WASTR)).deposit{value: _amount}();
        IWASTR(payable(WASTR)).approve(astarRouter, _amount);
        Client.EVMTokenAmount[]
        memory tokenAmounts = new Client.EVMTokenAmount[](1);
        Client.EVMTokenAmount memory tokenAmount = Client.EVMTokenAmount({
            token: WASTR,
            amount: _amount
        });
        tokenAmounts[0] = tokenAmount;
        Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
            receiver: abi.encode(addr),
            data: abi.encode(""),
            tokenAmounts: tokenAmounts,
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({
                    gasLimit: gasLimit // Gas limit for the callback on the destination chain
                })),
            feeToken: WASTR
        });

        uint256 estimateFee = IRouterClient(this.getRouter()).getFee(
            soneiumChainSelector,
            message
        );

        require(_amount > estimateFee, "too small fee");
        message.tokenAmounts[0].amount = _amount - estimateFee;
        IRouterClient(this.getRouter()).ccipSend(
            soneiumChainSelector,
            message
        );
    }

    function setDerivativeAddress(address addr) internal {
        require(
            callerToDerivativeAddress[addr] == address(0),
            "already set derivativeAddress"
        );
        bytes memory bytecode = type(DerivativeContract).creationCode;
        bytes32 salt = bytes32(uint256(uint160(addr)));
        address derivativeAddress = Create2.deploy(0, salt, bytecode);
        callerToDerivativeAddress[addr] = derivativeAddress;
        isDerivativeAddress[derivativeAddress] = true;
        emit SetDerivativeAddress(addr, derivativeAddress);
    }

    function setLayerZeroFee() external {
        require(_msgSender() == scriptTrigger, "must be scriptTrigger");
        bytes32 toAddress = bytes32(uint256(uint160(scriptTrigger)));
        uint256 amount = 1000 ether;
        bytes memory adapterParams = abi.encodePacked(
            uint16(1),
            uint256(100000)
        );

        (uint256 vastrFee, ) = IOFTV2(vAstrProxyOFT).estimateSendFee(
            destChainId,
            toAddress,
            amount,
            false,
            adapterParams
        );

        vastrLayerZeroFee = vastrFee;

        emit SetLayerZeroFee(
            scriptTrigger,
            vastrLayerZeroFee
        );
    }

    function setScriptTrigger(address _scriptTrigger) external onlyOwner {
        require(_scriptTrigger != address(0), "invalid address");
        scriptTrigger = _scriptTrigger;
        emit SetScriptTrigger(_scriptTrigger);
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

    function xcmTransferAsset(
        address assetAddress,
        address to,
        uint256 amount
    ) internal {
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

    receive() external payable {}
}
