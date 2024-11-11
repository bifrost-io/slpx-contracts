// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.10;

import "./interfaces/IVETH.sol";
import "./interfaces/snowbridge/IGateway.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interfaces/snowbridge/MultiAddress.sol";

contract EthereumSlpx {
    address constant gateway = 0x74bAA141B18D5D1eeF1591abf37167FbeCE23B72;
    address constant slpcore = 0x74bAA141B18D5D1eeF1591abf37167FbeCE23B72;
    address constant veth = 0x4Bc3263Eb5bb2Ef7Ad9aB6FB68be80E43b43801F;
    uint128 constant destinationFee = 1000000;
    uint32 constant paraId = 2030;
    function mint() external payable {
        uint256 fee = IGateway(gateway).quoteSendTokenFee(
            veth,
            paraId,
            destinationFee
        );
        require(msg.value >= fee, "msg.value to low");
        IVETH(slpcore).mint{value: msg.value - fee}();
        uint256 vethAmount = IERC20(veth).balanceOf(address(this));
        IERC20(veth).approve(gateway, vethAmount);
        IGateway(gateway).sendToken{value: fee}(
            veth,
            paraId,
            MultiAddress.MultiAddress({
                kind: MultiAddress.Kind.Index,
                data: abi.encode(paraId)
            }),
            destinationFee,
            uint128(vethAmount)
        );
    }
}
