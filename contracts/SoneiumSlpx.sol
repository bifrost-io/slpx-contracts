// SPDX-License-Identifier: Apache-2.0
pragma solidity 0.8.10;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import "./interfaces/IOFTV2.sol";
import "./interfaces/Types.sol";

contract SoneiumSlpx is OwnerIsCreator {
    address private constant vAstrOFT = 0x60336f9296C79dA4294A19153eC87F8E52158e5F;
    uint16 private constant destChainId = 210;
    bytes32 public remoteContract;

    // Astar Chain Selector
    uint64 private constant astarChainSelector = 6422105447186081193;
    address private constant AstrToken = 0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441;
    address private constant SoneiumRouter = 0x8C8B88d827Fe14Df2bc6392947d513C86afD6977;
    address public AstarReceiver;

    mapping(Types.Operation => uint256) public minAmount;

    event Mint(address indexed caller, uint256 indexed amount, address indexed receiver, uint32 channelId);
    event Redeem(address indexed caller, uint256 indexed amount);

    function setRemoteContract(address _remoteContract) public onlyOwner {
        require(_remoteContract != address(0), "Invalid remoteContract");
        AstarReceiver = _remoteContract;
        remoteContract = bytes32(uint256(uint160(_remoteContract)));
    }

    function setMinAmount(
        Types.Operation _operation,
        uint256 _minAmount
    ) public onlyOwner {
        require(_minAmount != 0, "Invalid minAmount");
        minAmount[_operation] = _minAmount;
    }

    function mint(uint256 _amount, address receiver, uint32 channelId, uint256 gasLimit) external payable {
        require(_amount >= minAmount[Types.Operation.Mint], "amount too small");
        require(gasLimit != 0, "amount too small");
        IERC20(AstrToken).transferFrom(msg.sender, address(this), _amount);

        // set the token amounts
        Client.EVMTokenAmount[]
            memory tokenAmounts = new Client.EVMTokenAmount[](1);
        Client.EVMTokenAmount memory tokenAmount = Client.EVMTokenAmount({
            token: AstrToken,
            amount: _amount
        });
        tokenAmounts[0] = tokenAmount;
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        bytes memory data = abi.encode(msg.sender, Types.Operation.Mint, receiver, channelId);
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(AstarReceiver), // ABI-encoded receiver address
            data: data, // ABI-encoded string message
            tokenAmounts: tokenAmounts, // Tokens amounts
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({gasLimit: gasLimit}) // Additional arguments, setting gas limit and non-strict sequency mode
            ),
            feeToken: address(0) // Setting feeToken to zero address, indicating native asset will be used for fees
        });

        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(SoneiumRouter);

        // approve the Router to spend tokens on contract's behalf. I will spend the amount of the given token
        IERC20(AstrToken).approve(address(router), _amount);

        // Get the fee required to send the message
        uint256 estimateFee = router.getFee(astarChainSelector, evm2AnyMessage);
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            require(success, "failed to refund");
        }

        // Send the message through the router and store the returned message ID
        router.ccipSend{value: estimateFee}(astarChainSelector, evm2AnyMessage);
        emit Mint(msg.sender, _amount, receiver, channelId);
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
            payable(msg.sender),
            address(0),
            _adapterParams
        );

        (uint256 estimateFee, bytes memory payload) = estimateSendAndCallFee(
            msg.sender,
            Types.Operation.Redeem,
            _amount,
            0,
            _dstGasForCall,
            _adapterParams
        );
        require(msg.value >= estimateFee, "too small fee");
        if (msg.value != estimateFee) {
            uint256 refundAmount = msg.value - estimateFee;
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            require(success, "failed to refund");
        }

        IOFTV2(vAstrOFT).sendAndCall{value: estimateFee}(
            msg.sender,
            destChainId,
            remoteContract,
            _amount,
            payload,
            _dstGasForCall,
            callParams
        );

        emit Redeem(msg.sender, _amount);
    }

    function estimateSendAndCallFee(
        address caller,
        Types.Operation operation,
        uint256 _amount,
        uint256 gasLimit,
        uint64 _dstGasForCall,
        bytes calldata _adapterParams
    ) public view returns (uint256, bytes memory) {
        if (operation == Types.Operation.Redeem) {
            bytes memory payload = abi.encode(caller, Types.Operation.Redeem);
            (uint256 estimateFee, ) = IOFTV2(vAstrOFT).estimateSendAndCallFee(
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
            Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
            Client.EVMTokenAmount memory tokenAmount = Client.EVMTokenAmount({
                token: AstrToken,
                amount: _amount
            });
            tokenAmounts[0] = tokenAmount;
            bytes memory data = abi.encode(msg.sender, Types.Operation.Mint, address(0), 0);
            Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
                receiver: abi.encode(caller),
                data: data,
                tokenAmounts: tokenAmounts,
                extraArgs: Client._argsToBytes(
                    Client.EVMExtraArgsV1({
                        gasLimit: gasLimit // Gas limit for the callback on the destination chain
                    })),
                feeToken: address(0)
            });

            return (IRouterClient(SoneiumRouter).getFee(
                astarChainSelector,
                message
            ), abi.encode(""));
        }
    }
}
