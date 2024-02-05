import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";

describe("NativeOFTWithFee: ", function () {
  const localChainId = 1;
  const remoteChainId = 2;
  const sharedDecimals = 6;

  let owner,
    alice,
    bob,
    localEndpoint,
    remoteEndpoint,
    nativeOFTWithFee,
    remoteOFTWithFee,
    LZEndpointMock,
    NativeOFTWithFee,
    OFTWithFee,
    ownerAddressBytes32,
    Receiver,
    receiver,
    ProxyOFTV2,
    localOFT,
    ERC20,
    erc20;

  let defaultAdapterParams = ethers.utils.solidityPack(
    ["uint16", "uint256"],
    [1, 200000]
  );

  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();
    LZEndpointMock = await ethers.getContractFactory("LZEndpointMock");
    NativeOFTWithFee = await ethers.getContractFactory("NativeOFTWithFee");
    ProxyOFTV2 = await ethers.getContractFactory("ProxyOFTV2");
    OFTWithFee = await ethers.getContractFactory("OFTWithFee");
    Receiver = await ethers.getContractFactory("AstarReceiver");
    ERC20 = await ethers.getContractFactory("ERC20Mock");
  });

  beforeEach(async function () {
    localEndpoint = await LZEndpointMock.deploy(localChainId);
    remoteEndpoint = await LZEndpointMock.deploy(remoteChainId);

    //------  deploy: base & other chain  -------------------------------------------------------
    // create two NativeOFTWithFee instances. both tokens have the same name and symbol on each chain
    // 1. base chain
    // 2. other chain
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
    localOFT = await ProxyOFTV2.deploy(
      erc20.address,
      sharedDecimals,
      localEndpoint.address
    );
    receiver = await Receiver.deploy();

    receiver.initialize(nativeOFTWithFee.address, localOFT.address);

    // internal bookkeeping for endpoints (not part of a real deploy, just for this test)
    await localEndpoint.setDestLzEndpoint(
      remoteOFTWithFee.address,
      remoteEndpoint.address
    );
    await remoteEndpoint.setDestLzEndpoint(
      nativeOFTWithFee.address,
      localEndpoint.address
    );

    //------  setTrustedRemote(s) -------------------------------------------------------
    // for each OFTV2, setTrustedRemote to allow it to receive from the remote OFTV2 contract.
    // Note: This is sometimes referred to as the "wire-up" process.
    // set each contracts source address so it can send to each other
    await nativeOFTWithFee.setTrustedRemoteAddress(
      remoteChainId,
      remoteOFTWithFee.address
    );
    await remoteOFTWithFee.setTrustedRemoteAddress(
      localChainId,
      nativeOFTWithFee.address
    );

    await nativeOFTWithFee.setMinDstGas(remoteChainId, 0, 200000);
    await nativeOFTWithFee.setMinDstGas(remoteChainId, 1, 200000);
    await remoteOFTWithFee.setMinDstGas(localChainId, 0, 200000);
    await remoteOFTWithFee.setMinDstGas(localChainId, 1, 200000);

    ownerAddressBytes32 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [owner.address]
    );
  });

  it("sendFrom() - tokens from main to other chain using default", async function () {
    expect(await ethers.provider.getBalance(localEndpoint.address)).to.be.equal(
      ethers.utils.parseEther("0")
    );

    // ensure they're both allocated initial amounts
    let aliceBalance = await ethers.provider.getBalance(alice.address);
    expect(await nativeOFTWithFee.balanceOf(owner.address)).to.equal(0);
    expect(await remoteOFTWithFee.balanceOf(owner.address)).to.equal(0);
    expect(await ethers.provider.getBalance(nativeOFTWithFee.address)).to.equal(
      0
    );

    let depositAmount = ethers.utils.parseEther("7");
    await nativeOFTWithFee.deposit({ value: depositAmount });

    expect(await nativeOFTWithFee.balanceOf(owner.address)).to.equal(
      depositAmount
    );
    expect(
      await ethers.provider.getBalance(nativeOFTWithFee.address)
    ).to.be.equal(depositAmount);

    let leftOverAmount = ethers.utils.parseEther("0");
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
    expect(await ethers.provider.getBalance(localEndpoint.address)).to.be.equal(
      ethers.utils.parseEther("0")
    );
    await nativeOFTWithFee.sendFrom(
      owner.address,
      remoteChainId, // destination chainId
      ownerAddressBytes32, // destination address to send tokens to
      totalAmount, // quantity of tokens to send (in units of wei)
      totalAmount, // quantity of tokens to send (in units of wei)
      [owner.address, ethers.constants.AddressZero, defaultAdapterParams],
      { value: nativeFee.add(totalAmount.sub(depositAmount)) } // pass a msg.value to pay the LayerZero message fee
    );

    // expect(await ethers.provider.getBalance(owner.address)).to.be.equal(ownerBalance.sub(messageFee).sub(transFee).sub(depositAmount))
    expect(
      await ethers.provider.getBalance(nativeOFTWithFee.address)
    ).to.be.equal(totalAmount);
    expect(await ethers.provider.getBalance(localEndpoint.address)).to.be.equal(
      nativeFee
    ); // collects
    expect(
      await nativeOFTWithFee.balanceOf(nativeOFTWithFee.address)
    ).to.be.equal(totalAmount);
    expect(await nativeOFTWithFee.balanceOf(owner.address)).to.be.equal(
      leftOverAmount
    );
    expect(await remoteOFTWithFee.balanceOf(owner.address)).to.be.equal(
      totalAmount
    );
    expect(await nativeOFTWithFee.outboundAmount()).to.be.equal(totalAmount);
    expect(await remoteOFTWithFee.totalSupply()).to.be.equal(totalAmount);

    const aliceAddressBytes32 = ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [receiver.address]
    );
    // estimate nativeFees
    nativeFee = (
      await nativeOFTWithFee.estimateSendAndCallFee(
        localChainId,
        aliceAddressBytes32,
        totalAmount,
        "0x00",
        700000,
        false,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 1500000])
      )
    ).nativeFee;
    console.log("nativeFee: ", nativeFee);
    await remoteOFTWithFee.sendAndCall(
      owner.address,
      localChainId, // destination chainId
      ethers.utils.defaultAbiCoder.encode(["address"], [receiver.address]),
      totalAmount, // quantity of tokens to send (in units of wei)
      totalAmount, // quantity of tokens to send (in units of wei)
      "0x00",
      700000,
      [
        owner.address,
        ethers.constants.AddressZero,
        ethers.utils.solidityPack(["uint16", "uint256"], [1, 1000000]),
      ],
      { value: ethers.utils.parseEther("1") } // pass a msg.value to pay the LayerZero message fee
    );

    console.log("owner.address: ", owner.address);
    console.log("remoteOFTWithFee address: ", remoteOFTWithFee.address);
    console.log("nativeOFTWithFee address: ", nativeOFTWithFee.address);

    // expect(await nativeOFTWithFee.balanceOf(nativeOFTWithFee.address)).to.equal(totalAmount)
    console.log(await ethers.provider.getBalance(receiver.address));
    // console.log(await ethers.provider.getBalance(receiver.address))
    // console.log(await ethers.provider.getBalance(owner.address))
    // // expect(await ethers.provider.getBalance(owner.address)).to.equal(totalAmount)
    // expect(await remoteOFTWithFee.balanceOf(owner.address)).to.equal(0)
    // expect(await nativeOFTWithFee.outboundAmount()).to.be.equal(leftOverAmount)
    // expect(await remoteOFTWithFee.totalSupply()).to.be.equal(leftOverAmount)
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
});
