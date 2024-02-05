import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";

// YQFkWxtiL3vLwDjWRuapLcfs7QHu2bjvpRqjiy8iCw1Ypu5

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
    Receiver = await ethers.getContractFactory("AstarReceiver");
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
    slpx = await Slpx.deploy();
    receiver = await Receiver.deploy();

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

    slpx.initialize(
      remoteOFTWithFee.address,
      remoteOFT.address,
      receiverBytes32
    );
    receiver.initialize(
      nativeOFTWithFee.address,
      localOFT.address,
      slpx.address
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
    const payload = ethers.utils.solidityPack(
      ["address", "uint8"],
      [owner.address, 0]
    );
    nativeFee = (
      await nativeOFTWithFee.estimateSendAndCallFee(
        localChainId,
        receiverBytes32,
        totalAmount,
        payload,
        700000,
        false,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 1200000])
      )
    ).nativeFee;
    console.log("nativeFee: ", nativeFee);
    await remoteOFTWithFee.approve(slpx.address, ethers.utils.parseEther("10"));
    console.log(await remoteOFTWithFee.balanceOf(owner.address));
    await slpx.mint(
      ethers.utils.parseEther("2"),
      500000,
      ethers.utils.solidityPack(["uint16", "uint256"], [1, 700000]),
      { value: nativeFee } // pass a msg.value to pay the LayerZero message fee
    );

    console.log(await ethers.provider.getBalance(receiver.address));
    console.log(await receiver.ca());
    expect(await receiver.nextMessageId()).to.be.equal(1);
    console.log(await receiver.derivativeAddress(owner.address));

    const s = await ethers.getContractAt(
      "DerivativeContract",
      await receiver.derivativeAddress(owner.address)
    );
    console.log(await s.astarReceiver());
    console.log(await receiver.address);
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
    const payload = ethers.utils.solidityPack(
      ["address", "uint8"],
      [owner.address, 1]
    );
    nativeFee = (
      await nativeOFTWithFee.estimateSendAndCallFee(
        localChainId,
        receiverBytes32,
        amount,
        payload,
        700000,
        false,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 1200000])
      )
    ).nativeFee;
    console.log("nativeFee: ", nativeFee);
    await remoteOFT.approve(slpx.address, ethers.utils.parseEther("10"));
    console.log(await remoteOFT.balanceOf(owner.address));
    await slpx.redeem(
      ethers.utils.parseEther("2"),
      500000,
      ethers.utils.solidityPack(["uint16", "uint256"], [1, 700000]),
      { value: nativeFee } // pass a msg.value to pay the LayerZero message fee
    );

    console.log(await erc20.balanceOf(receiver.address));
    console.log(await receiver.ca());
    expect(await receiver.nextMessageId()).to.be.equal(1);
    console.log(await receiver.derivativeAddress(owner.address));

    const s = await ethers.getContractAt(
      "DerivativeContract",
      await receiver.derivativeAddress(owner.address)
    );
    console.log(await s.astarReceiver());
    console.log(await receiver.address);
  });

  it("claimVAstr", async function () {
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
    const payload = ethers.utils.solidityPack(
      ["address", "uint8"],
      [owner.address, 0]
    );
    nativeFee = (
      await nativeOFTWithFee.estimateSendAndCallFee(
        localChainId,
        receiverBytes32,
        totalAmount,
        payload,
        700000,
        false,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 1200000])
      )
    ).nativeFee;
    console.log("nativeFee: ", nativeFee);
    await remoteOFTWithFee.approve(slpx.address, ethers.utils.parseEther("10"));
    console.log(await remoteOFTWithFee.balanceOf(owner.address));
    await slpx.mint(
      ethers.utils.parseEther("2"),
      500000,
      ethers.utils.solidityPack(["uint16", "uint256"], [1, 700000]),
      { value: nativeFee } // pass a msg.value to pay the LayerZero message fee
    );

    console.log(await ethers.provider.getBalance(receiver.address));
    console.log(await receiver.ca());
    let contract = await receiver.derivativeAddress(owner.address);
    expect(await receiver.nextMessageId()).to.be.equal(1);
    console.log(await receiver.derivativeAddress(owner.address));

    const s = await ethers.getContractAt("DerivativeContract", contract);
    console.log(await s.astarReceiver());
    console.log(await receiver.address);

    await erc20.mint(contract, ethers.utils.parseEther("2"));
    await receiver.claimVAstr(owner.address, defaultAdapterParams, {
      value: nativeFee,
    });
    console.log(await remoteOFT.balanceOf(owner.address));

    await owner.sendTransaction({
      to: contract,
      value: ethers.utils.parseEther("1"),
    });
    console.log(
      await ethers.provider.getBalance(
        await receiver.derivativeAddress(owner.address)
      )
    );
    console.log(await remoteOFTWithFee.balanceOf(owner.address));
    await receiver.claimAstr(
      owner.address,
      ethers.utils.parseEther("1"),
      defaultAdapterParams,
      { value: nativeFee }
    );
    console.log(
      await ethers.provider.getBalance(
        await receiver.derivativeAddress(owner.address)
      )
    );
    console.log(await remoteOFTWithFee.balanceOf(owner.address));
  });
});
