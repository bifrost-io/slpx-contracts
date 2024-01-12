import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { blake2AsHex, decodeAddress } from "@polkadot/util-crypto";
import { ALICE, ALITH } from "./constants";
import { MultiLocation } from "@polkadot/types/interfaces";
import { u8aToHex } from "@polkadot/util";
import fs from "fs/promises";

export async function getWsProviderInstance(wss: string) {
  const wsProvider = new WsProvider(wss);
  return await ApiPromise.create({ provider: wsProvider });
}

export async function waitFor(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function calculate_multilocation_derivative_account(
    api: ApiPromise,
    para_id: number,
    publicKey: string
) {
  let interior;
  if (para_id == 2006) {
    interior = {
      X2: [
        { Parachain: 2006 },
        { AccountId32: { network: { polkadot: null }, id: publicKey } },
      ],
    };
  } else if(para_id == 2034) {
    interior = {
      X2: [
        { Parachain: 2034 },
        { AccountId32: { network: { polkadot: null }, id: publicKey } },
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
  const keyring = new Keyring({ type: "sr25519", ss58Format: 6 });

  console.log(
      "bifrost account id is %s",
      keyring.addFromAddress(DescendOriginAddress32).address
  );

  console.log("32 byte address is %s", DescendOriginAddress32);
  console.log("20 byte address is %s", DescendOriginAddress20);
  return keyring.addFromAddress(DescendOriginAddress32).address;
}

export async function replaceSlpxAddress(
  key = "ASTAR_SLPX_ADDRESS" ||
    "MOONRIVER_SLPX_ADDRESS" ||
    "MOONBEAM_SLPX_ADDRESS",
  newAddress: string
) {
  const envPath = ".env";
  let envContent = await fs.readFile(envPath, "utf8");

  const regex = new RegExp(`${key}=.*`);
  envContent = envContent.replace(regex, `${key}=${newAddress}`);

  await fs.writeFile(envPath, envContent);

  console.log(`${key} updated successfully.`);
}

export async function registerTokenMetadata(
  api: ApiPromise,
  signer: KeyringPair,
  metadata: any
) {
  return new Promise((resolve) => {
    api.tx.council
      .propose(
        1,
        api.tx.assetRegistry.registerTokenMetadata(metadata),
        api.tx.assetRegistry.registerTokenMetadata(metadata).encodedLength
      )
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - RegisterTokenMetadata finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function registerMultilocation(
  api: ApiPromise,
  signer: KeyringPair,
  token: any,
  location: any
) {
  return new Promise((resolve) => {
    api.tx.council
      .propose(
        1,
        api.tx.assetRegistry.registerMultilocation(token, location, 0),
        api.tx.assetRegistry.registerMultilocation(token, location, 0)
          .encodedLength
      )
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - RegisterMultilocation finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function mintVtoken(
  api: ApiPromise,
  signer: KeyringPair,
  token: any,
  amount: any
) {
  return new Promise((resolve) => {
    api.tx.vtokenMinting
      .mint(token, amount, "Hello")
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - mint vtoken finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}
