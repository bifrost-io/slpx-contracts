import {ApiPromise, Keyring, WsProvider} from "@polkadot/api";
import {MultiLocation} from "@polkadot/types/interfaces";
import {u8aToHex} from "@polkadot/util";

async function calculate_multilocation_derivative_account(api:ApiPromise,para_id:number,publicKey:string){
    let interior;
    if (para_id == 2006) {
        interior  = {
            // X2: [{ Parachain: 2006 }, { AccountId32: { network: {polkadot:null}, id: publicKey } }],
            X2: [{ Parachain: 2006 }, { AccountId32: { network: null, id: publicKey } }],
        };
    } else {
        interior  = {
            X2: [{ Parachain: 2004 }, { AccountKey20: { network: null, key: publicKey } }],
        };
    }
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
    const keyring = new Keyring({ type: 'sr25519', ss58Format: 5 })

    console.log('bifrost account id is %s',keyring.addFromAddress(DescendOriginAddress32).address);

    console.log('32 byte address is %s', DescendOriginAddress32);
    console.log('20 byte address is %s', DescendOriginAddress20);
    return DescendOriginAddress32
}

const main =async () => {
    const wsProvider = new WsProvider("ws://127.0.0.1:9920")
    // const wsProvider = new WsProvider("wss://bifrost-rpc.dwellir.com")
    const bifrost_api = await ApiPromise.create({provider: wsProvider})

    await calculate_multilocation_derivative_account(bifrost_api,2006,"0x27558776c1b7ef238ba52e944450fc584947c5d53320c7be65320d6a25f90294")
    await calculate_multilocation_derivative_account(bifrost_api,2004,"0x962c0940d72E7Db6c9a5F81f1cA87D8DB2B82A23")
    console.log(u8aToHex(Uint8Array.from([192, 203, 194, 44, 13, 69, 121, 241, 104, 120, 142, 80, 65, 101, 112, 225, 143, 229, 227, 83, 175, 232, 81, 16, 112, 44, 233, 215, 243, 74, 45, 40]
    )));
    console.log(u8aToHex(Uint8Array.from([192, 30, 231, 241, 14, 164, 175, 70, 115, 207, 255, 98, 113, 14, 29, 119, 146, 171, 168, 243])));
}
main()
    .then()
    .catch((err) => console.log(err))
    .finally(() => process.exit())


