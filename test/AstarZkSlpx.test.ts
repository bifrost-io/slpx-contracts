import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";

// YQFkWxtiL3vLwDjWRuapLcfs7QHu2bjvpRqjiy8iCw1Ypu5

const Opration = {
  Mint: 0,
  Redeem: 1,
};

describe("NativeOFTWithFee: ", function () {
  const localChainId = 1;
  const remoteChainId = 2;
  const sharedDecimals = 6;

  let owner,
    alice,
    localEndpoint,
    remoteEndpoint,
    nativeOFTWithFee,
    remoteOFTWithFee,
    LZEndpointMock,
    NativeOFTWithFee,
    OFTWithFee,
    ownerAddressBytes32,
    Receiver,
    Slpx,
    receiver,
    slpx,
    ProxyOFTV2,
    localOFT,
    ERC20,
    erc20,
    OFTV2,
    remoteOFT,
    receiverBytes32;

  let defaultAdapterParams = ethers.utils.solidityPack(
    ["uint16", "uint256"],
    [1, 200000]
  );

  const beforeClaim = () => {};

  before(async function () {
    [owner, alice] = await ethers.getSigners();
    LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    NativeOFTWithFee = await ethers.getContractFactory("NativeOFTWithFee");
    OFTWithFee = await ethers.getContractFactory("OFTWithFee");
    ProxyOFTV2 = await ethers.getContractFactory("VoucherAstrProxyOFT");
    OFTV2 = await ethers.getContractFactory("VoucherAstrOFT");
    ERC20 = await ethers.getContractFactory("ERC20Mock");
    Slpx = await ethers.getContractFactory("AstarZkSlpx");
    const AddressToAccount = await ethers.getContractFactory("AddressToAccount");
    const BuildCallData = await ethers.getContractFactory("BuildCallData");
    const addressToAccount = await AddressToAccount.deploy()
    const buildCallData = await BuildCallData.deploy()
    Slpx = await ethers.getContractFactory("AstarZkSlpx");

    Receiver = await ethers.getContractFactory("AstarReceiver", {
      libraries: {
        AddressToAccount: addressToAccount.address,
        BuildCallData: buildCallData.address,
      }
    });
  });

  beforeEach(async function () {
    localEndpoint = await LZEndpointMock.deploy(localChainId);
    remoteEndpoint = await LZEndpointMock.deploy(remoteChainId);

    nativeOFTWithFee = await NativeOFTWithFee.deploy(
      "Shibuya Token",
      "SBY",
      6,
      localEndpoint.address
    );
    remoteOFTWithFee = await OFTWithFee.deploy(
      "LayerZero Shibuya Token",
      "LSBY",
      6,
      remoteEndpoint.address
    );
    erc20 = await ERC20.deploy("ERC20", "ERC20");
    localOFT = await ProxyOFTV2.deploy(erc20.address, localEndpoint.address);
    remoteOFT = await OFTV2.deploy(remoteEndpoint.address);
    slpx = await Slpx.deploy(remoteOFTWithFee.address, remoteOFT.address, localChainId);
    receiver = await Receiver.deploy(slpx.address);

    console.log("owner.address: ", owner.address);
    console.log("remoteOFTWithFee address: ", remoteOFTWithFee.address);
    console.log("nativeOFTWithFee address: ", nativeOFTWithFee.address);
    console.log("localOFT address: ", localOFT.address);
    console.log("remoteOFT address: ", remoteOFT.address);
    console.log("slpx address: ", slpx.address);
    console.log("receiver address: ", receiver.address);
    console.log("ERC20 address: ", erc20.address);

    receiverBytes32 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [receiver.address]
    );

    // internal bookkeeping for endpoints (not part of a real deploy, just for this test)
    await localEndpoint.setDestLzEndpoint(
      remoteOFTWithFee.address,
      remoteEndpoint.address
    );
    await remoteEndpoint.setDestLzEndpoint(
      nativeOFTWithFee.address,
      localEndpoint.address
    );
    await localEndpoint.setDestLzEndpoint(
      remoteOFT.address,
      remoteEndpoint.address
    );
    await remoteEndpoint.setDestLzEndpoint(
      localOFT.address,
      localEndpoint.address
    );

    await nativeOFTWithFee.setTrustedRemoteAddress(
      remoteChainId,
      remoteOFTWithFee.address
    );
    await remoteOFTWithFee.setTrustedRemoteAddress(
      localChainId,
      nativeOFTWithFee.address
    );
    await localOFT.setTrustedRemoteAddress(remoteChainId, remoteOFT.address);
    await remoteOFT.setTrustedRemoteAddress(localChainId, localOFT.address);

    await nativeOFTWithFee.setMinDstGas(remoteChainId, 0, 200000);
    await nativeOFTWithFee.setMinDstGas(remoteChainId, 1, 200000);
    await remoteOFTWithFee.setMinDstGas(localChainId, 0, 200000);
    await remoteOFTWithFee.setMinDstGas(localChainId, 1, 200000);
    await localOFT.setMinDstGas(remoteChainId, 0, 200000);
    await localOFT.setMinDstGas(remoteChainId, 1, 200000);
    await remoteOFT.setMinDstGas(localChainId, 0, 200000);
    await remoteOFT.setMinDstGas(localChainId, 1, 200000);

    ownerAddressBytes32 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [owner.address]
    );
  });

  it("mint", async function () {
    let depositAmount = ethers.utils.parseEther("7");
    await nativeOFTWithFee.deposit({ value: depositAmount });
    let totalAmount = ethers.utils.parseEther("8");
    // estimate nativeFees
    let nativeFee = (
      await nativeOFTWithFee.estimateSendFee(
        remoteChainId,
        ownerAddressBytes32,
        totalAmount,
        false,
        defaultAdapterParams
      )
    ).nativeFee;
    await nativeOFTWithFee.sendFrom(
      owner.address,
      remoteChainId, // destination chainId
      ownerAddressBytes32, // destination address to send tokens to
      totalAmount, // quantity of tokens to send (in units of wei)
      totalAmount, // quantity of tokens to send (in units of wei)
      [owner.address, ethers.constants.AddressZero, defaultAdapterParams],
      { value: nativeFee.add(totalAmount.sub(depositAmount)) } // pass a msg.value to pay the LayerZero message fee
    );
    expect(await remoteOFTWithFee.balanceOf(owner.address)).to.be.equal(
      totalAmount
    );

    // estimate nativeFees
    const _dstGasForCall = 3000000
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 3200000])
    const payload = ethers.utils.solidityPack(
      ["address", "uint8"],
      [owner.address, Opration.Mint]
    );
    nativeFee = (
      await slpx.estimateSendAndCallFee(
        owner.address,
        Opration.Mint,
        ethers.utils.parseEther("2"),
          _dstGasForCall,
          adapterParams
      )
    );
    console.log("nativeFee: ", nativeFee);
    await remoteOFTWithFee.approve(slpx.address, ethers.utils.parseEther("10"));
    const beforeBalance = await remoteOFTWithFee.balanceOf(owner.address);
    console.log("beforeBalance:",ethers.utils.formatUnits(beforeBalance));
    await slpx.mint(
      ethers.utils.parseEther("2"),
        _dstGasForCall,
        adapterParams,
      { value: nativeFee[0] } // pass a msg.value to pay the LayerZero message fee
    );
    const afterBalance = await remoteOFTWithFee.balanceOf(owner.address);
    console.log("afterBalance:",ethers.utils.formatUnits(afterBalance));

    console.log(await receiver.derivativeAddress(owner.address));
  });

  it("redeem()", async function () {
    const initialAmount = ethers.utils.parseEther("8.00000001"); // 1 ether
    const amount = ethers.utils.parseEther("8.00000000");
    const dust = ethers.utils.parseEther("0.00000001");
    await erc20.mint(owner.address, initialAmount);

    // verify alice has tokens and bob has no tokens on remote chain
    expect(await erc20.balanceOf(owner.address)).to.be.equal(initialAmount);
    expect(await remoteOFT.balanceOf(owner.address)).to.be.equal(0);

    // alice sends tokens to bob on remote chain
    // approve the proxy to swap your tokens
    await erc20.approve(localOFT.address, initialAmount);

    // swaps token to remote chain
    const bobAddressBytes32 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [owner.address]
    );
    let nativeFee = (
      await localOFT.estimateSendFee(
        remoteChainId,
        bobAddressBytes32,
        initialAmount,
        false,
        defaultAdapterParams
      )
    ).nativeFee;
    await localOFT.sendFrom(
      owner.address,
      remoteChainId,
      bobAddressBytes32,
      initialAmount,
      [owner.address, ethers.constants.AddressZero, defaultAdapterParams],
      { value: nativeFee }
    );

    // tokens are now owned by the proxy contract, because this is the original oft chain
    expect(await erc20.balanceOf(localOFT.address)).to.equal(amount);
    expect(await erc20.balanceOf(owner.address)).to.equal(dust);

    // tokens received on the remote chain
    expect(await remoteOFT.totalSupply()).to.equal(amount);
    expect(await remoteOFT.balanceOf(owner.address)).to.be.equal(amount);

    // estimate nativeFees
    const _dstGasForCall = 3000000
    const adapterParams = ethers.utils.solidityPack(["uint16", "uint256"], [1, 3200000])
    nativeFee = (
      await slpx.estimateSendAndCallFee(
          owner.address,
          Opration.Redeem,
          ethers.utils.parseEther("2"),
          _dstGasForCall,
          adapterParams
      )
    );
    console.log("nativeFee: ", nativeFee);
    await remoteOFT.approve(slpx.address, ethers.utils.parseEther("10"));
    const beforeBalance = await remoteOFT.balanceOf(owner.address);
    console.log("beforeBalance:",ethers.utils.formatUnits(beforeBalance));
    await slpx.redeem(
      ethers.utils.parseEther("2"),
        _dstGasForCall,
      adapterParams,
      { value: nativeFee[0] } // pass a msg.value to pay the LayerZero message fee
    );

    const afterBalance = await remoteOFT.balanceOf(owner.address);
    console.log("afterBalance:",ethers.utils.formatUnits(afterBalance));
  });
});
