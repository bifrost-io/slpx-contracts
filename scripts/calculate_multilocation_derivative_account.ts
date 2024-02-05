import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { MultiLocation } from "@polkadot/types/interfaces";
import { u8aToHex, stringToU8a, hexToU8a } from "@polkadot/util";

export async function calculate_multilocation_derivative_account(
  api: ApiPromise,
  para_id: number,
  publicKey: string
) {
  let interior;
  if (para_id == 1000) {
    interior = {
      //X2: [
      //         { Parachain: 2034 },
      //         { AccountId32: { network: null, id: publicKey } },
      //       ],
      X2: [
        { Parachain: 1000 },
        { AccountId32: { network: { rococo: null }, id: publicKey } },
      ],
    };
  } else {
    interior = {
      X2: [
        { Parachain: para_id },
        { AccountKey20: { network: null, key: publicKey } },
      ],
    };
  }
  const multilocation: MultiLocation = api.createType(
    "StagingXcmV3MultiLocation",
    JSON.parse(
      JSON.stringify({
        parents: 1,
        interior: interior,
      })
    )
  );
  console.log("Multilocation for calculation", multilocation.toString());

  const toHash = new Uint8Array([
    ...new Uint8Array([32]),
    ...new TextEncoder().encode("multiloc"),
    ...multilocation.toU8a(),
  ]);

  const DescendOriginAddress32 = u8aToHex(
    api.registry.hash(toHash).slice(0, 32)
  );
  const DescendOriginAddress20 = u8aToHex(
    api.registry.hash(toHash).slice(0, 20)
  );
  const keyring = new Keyring({ type: "sr25519", ss58Format: 5 });

  console.log(
    "bifrost account id is %s",
    keyring.addFromAddress(DescendOriginAddress32).address
  );

  console.log("32 byte address is %s", DescendOriginAddress32);
  console.log("20 byte address is %s", DescendOriginAddress20);
  return keyring.addFromAddress(DescendOriginAddress32).address;
}

const main = async () => {
  const wsProvider = new WsProvider("wss://bifrost-rpc.dwellir.com")
  const bifrost_api = await ApiPromise.create({ provider: wsProvider });

  // await calculate_multilocation_derivative_account(
  //   bifrost_api,
  //   2023,
  //   "0x9E545E3C0baAB3E08CdfD552C960A1050f373042"
  // );
  await calculate_multilocation_derivative_account(
    bifrost_api,
    1000,
    "0x05dc1098d0cfab4e451e7be345f75f6e03977ce24ed2e5eb76bf6cc4ea00de9c"
  );
};
main()
  .then()
  .catch((err) => console.log(err))
  .finally(() => process.exit());
