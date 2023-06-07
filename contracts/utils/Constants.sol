// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

library Constants {
    uint8  constant public PALLET_INDEX = 125;
    uint8  constant public MINT_CALL_INDEX = 0;
    uint8  constant public SWAP_CALL_INDEX = 1;
    uint8  constant public REDEEM_CALL_INDEX = 2;

    uint32 constant public BIFROST_KUSAMA_PARA_ID = 2001;
    uint32 constant public BIFROST_POLKADOT_PARA_ID = 2030;

    bytes1 constant public ASTAR_CHAIN = 0x00;
    bytes1 constant public MOOBEAM_CHAIN = 0x01;

    bytes2 constant public MOVR_BYTES = 0x020a;
    bytes2 constant public GLMR_BYTES = 0x0801;
    bytes2 constant public ASTR_BYTES = 0x0803;

    address constant public MOONRIVER_BNC_ADDRESS =  0xfFFFfFfF006cD1E2a35Acdb1786cAF7893547b75;
    address constant public MOONBEAM_BNC_ADDRESS =  0xFFffffFf7cC06abdF7201b350A1265c62C8601d2;
    address constant public ASTAR_BNC_ADDRESS =  0xfFffFffF00000000000000010000000000000007;

    address constant public MOVR_ADDRESS = 0x0000000000000000000000000000000000000802;
    address constant public GLMR_ADDRESS = 0x0000000000000000000000000000000000000802;
    address constant public vMOVR_ADDRESS = 0xfFfffFfF98e37bF6a393504b5aDC5B53B4D0ba11;
    address constant public KSM_ADDRESS = 0xFfFFfFff1FcaCBd218EDc0EbA20Fc2308C778080;
    address constant public vKSM_ADDRESS = 0xFFffffFFC6DEec7Fc8B11A2C8ddE9a59F8c62EFe;
    address constant public ASTR_ADDRESS = 0x0000000000000000000000000000000000000000;
    address constant public VASTR_ADDRESS =  0xFfFfFfff00000000000000010000000000000008;
}