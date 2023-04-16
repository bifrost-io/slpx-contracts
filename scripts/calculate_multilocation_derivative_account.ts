import {ApiPromise, WsProvider} from "@polkadot/api";
import {MultiLocation} from "@polkadot/types/interfaces";
import {u8aToHex} from "@polkadot/util";

async function calculate_multilocation_derivative_account(api:ApiPromise,publicKey:string){
    const interior = {
        X2: [{ Parachain: 2006 }, { AccountId32: { network: {polkadot:null}, id: publicKey } }],
    };
    const multilocation: MultiLocation = api.createType(
        'XcmV3MultiLocation',
        JSON.parse(
            JSON.stringify({
                parents: 1,
                interior: interior,
            })
        )
    );
    console.log('Multilocation for calculation', multilocation.toString());

    const toHash = new Uint8Array([
        ...new Uint8Array([32]),
        ...new TextEncoder().encode('multiloc'),
        ...multilocation.toU8a(),
    ]);

    const DescendOriginAddress32 = u8aToHex(api.registry.hash(toHash).slice(0, 32));
    const DescendOriginAddress20 = u8aToHex(api.registry.hash(toHash).slice(0, 20));

    console.log('32 byte address is %s', DescendOriginAddress32);
    console.log('20 byte address is %s', DescendOriginAddress20);
    return DescendOriginAddress32
}

const main =async () => {
    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    const bifrost_api = await ApiPromise.create({provider: wsProvider})

    await calculate_multilocation_derivative_account(bifrost_api,"0x143d7946b235b2758531401bccb58bbe70c97df10647352fe9b1e190302c3b25")
}

main()


