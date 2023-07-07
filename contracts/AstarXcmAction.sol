// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "./interfaces/XCM.sol";
import "./interfaces/IXcmAction.sol";
import "./utils/BuildCallData.sol";
import "./utils/AddressToAccount.sol";

contract AstarXcmAction is IXcmAction, OwnableUpgradeable, PausableUpgradeable {
    address public constant NATIVE_ASSET_ADDRESS =
        0x0000000000000000000000000000000000000000;
//    address public constant BNC_ADDRESS =
//        0xfFffFffF00000000000000010000000000000007;
    address public constant BNC_ADDRESS =
    0xfFFFFfFf00000000000000010000000000000002;
    address public constant XCM_ADDRESS =
        0x0000000000000000000000000000000000005004;
    bytes2 public constant ASTR_BYTES = 0x0803;
    bytes2 public constant VASTR_BYTES = 0x0903;
    bytes1 public constant ASTAR_CHAIN = 0x00;
    uint32 public constant BIFROST_PARA_ID = 2030;

    uint256 public bifrostTransactionFee;
    uint64 public transactWeight;

    mapping(address => bytes2) public assetAddressToCurrencyId;
    mapping(address => uint256) public assetAddressToMinimumValue;

    function initialize(
        uint256 _bifrostTransactionFee,
        uint64 _transactWeight
    ) public initializer {
        __Ownable_init();
        __Pausable_init();
        setBifrostTransactionFee(_bifrostTransactionFee, _transactWeight);
    }

    function setBifrostTransactionFee(
        uint256 _bifrostTransactionFee,
        uint64 _transactWeight
    ) public onlyOwner {
        require(
            _bifrostTransactionFee <= 1000000000000,
            "Transaction Fee too large"
        );
        require(_transactWeight <= 10000000000, "TransactWeight too large");
        bifrostTransactionFee = _bifrostTransactionFee;
        transactWeight = _transactWeight;
    }

    function setAssetAddressInfo(
        address assetAddress,
        uint256 minimumValue,
        bytes2 currencyId
    ) public onlyOwner {
        require(minimumValue != 0, "Invalid minimumValue");
        require(currencyId != bytes2(0), "Invalid currencyId");
        assetAddressToMinimumValue[assetAddress] = minimumValue;
        assetAddressToCurrencyId[assetAddress] = currencyId;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function xcmTransferAsset(address assetAddress, uint256 amount) internal {
        require(assetAddress != address(0), "Invalid assetAddress");
        require(
            assetAddressToMinimumValue[assetAddress] != 0,
            "Not set MinimumValue"
        );
        require(
            amount >= assetAddressToMinimumValue[assetAddress],
            "Less than MinimumValue"
        );
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(
            _msgSender()
        );
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        IERC20 erc20 = IERC20(assetAddress);
        erc20.transferFrom(_msgSender(), address(this), amount);
        assetId[0] = assetAddress;
        assetAmount[0] = amount;
        require(
            XCM(XCM_ADDRESS).assets_withdraw(
                assetId,
                assetAmount,
                publicKey,
                false,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
    }

    function xcmTransferNativeAsset(uint256 amount) internal {
        require(
            assetAddressToMinimumValue[NATIVE_ASSET_ADDRESS] != 0,
            "Not set MinimumValue"
        );
        require(
            amount >= assetAddressToMinimumValue[NATIVE_ASSET_ADDRESS],
            "Less than MinimumValue"
        );
        bytes32 publicKey = AddressToAccount.AddressToSubstrateAccount(
            _msgSender()
        );
        address[] memory assetId = new address[](1);
        uint256[] memory assetAmount = new uint256[](1);
        assetId[0] = NATIVE_ASSET_ADDRESS;
        assetAmount[0] = amount;
        require(
            XCM(XCM_ADDRESS).assets_reserve_transfer(
                assetId,
                assetAmount,
                publicKey,
                false,
                BIFROST_PARA_ID,
                0
            ),
            "Failed to send xcm"
        );
    }

    function mintVNativeAsset() external payable override whenNotPaused {
        xcmTransferNativeAsset(msg.value);

        bytes memory callcode = BuildCallData.buildMintCallBytes(
            _msgSender(),
            ASTR_BYTES,
            ASTAR_CHAIN
        );

        // xcm transact
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                bifrostTransactionFee,
                callcode,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Mint(_msgSender(), NATIVE_ASSET_ADDRESS, msg.value, callcode);
    }

    function mintVAsset(address, uint256) external pure override {
        require(false, "Not support");
    }

    function redeemAsset(
        address vAssetAddress,
        uint256 amount
    ) external override whenNotPaused {
        bytes2 vtoken = assetAddressToCurrencyId[vAssetAddress];
        require(vtoken == VASTR_BYTES, "Not support");

        xcmTransferAsset(vAssetAddress, amount);

        bytes memory callcode = BuildCallData.buildRedeemCallBytes(
            _msgSender(),
            vtoken,
            ASTAR_CHAIN
        );
        // xcm transact
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                bifrostTransactionFee,
                callcode,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Redeem(_msgSender(), vAssetAddress, amount, callcode);
    }

    function swapAssetsForExactAssets(
        address assetInAddress,
        address assetOutAddress,
        uint256 assetInAmount,
        uint128 assetOutMin
    ) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(
            assetIn != bytes2(0) && assetOut != bytes2(0),
            "Invalid currencyId"
        );

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory callcode = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            assetIn,
            assetOut,
            assetOutMin,
            ASTAR_CHAIN
        );
        // xcm transact
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                bifrostTransactionFee,
                callcode,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Swap(
            _msgSender(),
            assetInAddress,
            assetOutAddress,
            assetInAmount,
            assetOutMin,
            callcode
        );
    }

    function swapAssetsForExactNativeAssets(
        address assetInAddress,
        uint256 assetInAmount,
        uint128 assetOutMin
    ) external override whenNotPaused {
        bytes2 assetIn = assetAddressToCurrencyId[assetInAddress];
        require(assetIn != bytes2(0), "Invalid assetIn");

        xcmTransferAsset(assetInAddress, assetInAmount);

        bytes memory callcode = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            assetIn,
            ASTR_BYTES,
            assetOutMin,
            ASTAR_CHAIN
        );
        // xcm transact
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                bifrostTransactionFee,
                callcode,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Swap(
            _msgSender(),
            assetInAddress,
            NATIVE_ASSET_ADDRESS,
            assetInAmount,
            assetOutMin,
            callcode
        );
    }

    function swapNativeAssetsForExactAssets(
        address assetOutAddress,
        uint128 assetOutMin
    ) external payable override whenNotPaused {
        bytes2 assetOut = assetAddressToCurrencyId[assetOutAddress];
        require(assetOut != bytes2(0), "Invalid assetOut");

        xcmTransferNativeAsset(msg.value);

        bytes memory callcode = BuildCallData.buildSwapCallBytes(
            _msgSender(),
            ASTR_BYTES,
            assetOut,
            assetOutMin,
            ASTAR_CHAIN
        );
        // xcm transact
        require(
            XCM(XCM_ADDRESS).remote_transact(
                BIFROST_PARA_ID,
                false,
                BNC_ADDRESS,
                bifrostTransactionFee,
                callcode,
                transactWeight
            ),
            "Failed to send xcm"
        );
        emit Swap(
            _msgSender(),
            NATIVE_ASSET_ADDRESS,
            assetOutAddress,
            msg.value,
            assetOutMin,
            callcode
        );
    }
}
