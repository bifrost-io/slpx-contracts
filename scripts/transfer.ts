import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { decodeAddress } from "@polkadot/util-crypto";
import { ALICE, ALITH } from "./constants";

export async function balanceTransfer(
  api: ApiPromise,
  signer: KeyringPair,
  to: string,
  amount: bigint
) {
  return new Promise((resolve) => {
    api.tx.balances.transfer(to, amount).signAndSend(signer, ({ status }) => {
      if (status.isFinalized) {
        console.log(
          `✔️  - balanceTransfer finalized at block hash #${status.asFinalized.toString()}`
        );
        resolve(status.asFinalized.toString());
      }
    });
  });
}

export async function assetTransfer(
  api: ApiPromise,
  signer: KeyringPair,
  token_id: bigint,
  address: string,
  amount: bigint
) {
  return new Promise((resolve) => {
    api.tx.assets
      .transfer(token_id, address, amount)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - assetTransfer finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function bifrostTransferTokenToAstar(
  api: ApiPromise,
  signer: KeyringPair,
  token: any,
  amount: bigint
) {
  return new Promise((resolve) => {
    api.tx.xTokens
      .transfer(
        token,
        amount,
        {
          V3: {
            parents: 1,
            interior: {
              X2: [
                { Parachain: 2006 },
                { AccountId32: { network: null, id: signer.addressRaw } },
              ],
            },
          },
        },
        5000000000n
      )
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - bifrostTransferTokenToAstar finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}
const moonbeamTransferBncToBifrost = async (
  api: ApiPromise,
  signer: KeyringPair,
  amount: bigint
) => {
  return new Promise((resolve) => {
    api.tx.polkadotXcm
      .reserveWithdrawAssets(
        { V3: { parents: 1, interior: { X1: { Parachain: 2030 } } } },
        {
          V3: {
            parents: 0,
            interior: {
              X1: { AccountId32: { network: null, id: signer.addressRaw } },
            },
          },
        },
        {
          V3: [
            {
              id: {
                Concrete: {
                  parents: 1,
                  interior: {
                    X2: [
                      { Parachain: 2030 },
                      {
                        GeneralKey: {
                          length: 2,
                          data: "0x0001000000000000000000000000000000000000000000000000000000000000",
                        },
                      },
                    ],
                  },
                },
              },
              fun: { Fungible: amount },
            },
          ],
        },
        0
      )
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - moonbeamTransferBncToBifrost finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
};

export async function AstarTransferAstrToBifrost(
  api: ApiPromise,
  signer: KeyringPair,
  amount: bigint
) {
  return new Promise((resolve) => {
    api.tx.polkadotXcm
      .reserveTransferAssets(
        { V3: { parents: 1, interior: { X1: { Parachain: 2030 } } } },
        {
          V3: {
            parents: 0,
            interior: {
              X1: { AccountId32: { network: null, id: signer.addressRaw } },
            },
          },
        },
        {
          V3: [
            {
              id: { Concrete: { parents: 0, interior: "Here" } },
              fun: { Fungible: amount },
            },
          ],
        },
        0
      )
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - AstarTransferAstrToBifrost finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function kusamaTransferKsmToBifrost(
  api: ApiPromise,
  signer: KeyringPair,
  amount: any,
  receiver = ALICE
) {
  const paras = [
    { V3: { parents: 0, interior: { X1: { Parachain: 2001 } } } },
    {
      V3: {
        parents: 0,
        interior: {
          X1: { AccountId32: { network: null, id: decodeAddress(receiver) } },
        },
      },
    },
    {
      V3: [
        {
          id: { Concrete: { parents: 0, interior: "Here" } },
          fun: { Fungible: amount },
        },
      ],
    },
    0,
  ];
  return new Promise((resolve) => {
    api.tx.xcmPallet
      .reserveTransferAssets(...paras)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - kusamaTransferKsmToBifrost finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function kusamaTransferKsmToMoonriver(
  api: ApiPromise,
  signer: KeyringPair,
  amount: any,
  receiver = ALITH
) {
  const paras = [
    { V3: { parents: 0, interior: { X1: { Parachain: 2023 } } } },
    {
      V3: {
        parents: 0,
        interior: { X1: { AccountKey20: { network: null, key: ALITH } } },
      },
    },
    {
      V3: [
        {
          id: { Concrete: { parents: 0, interior: "Here" } },
          fun: { Fungible: amount },
        },
      ],
    },
    0,
  ];
  return new Promise((resolve) => {
    api.tx.xcmPallet
      .reserveTransferAssets(...paras)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - kusamaTransferKsmToMoonriver finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function moonriverTransferMovrToBifrost(
  api: ApiPromise,
  signer: KeyringPair,
  amount: bigint,
  receiver = ALICE
) {
  const paras = [
    "SelfReserve",
    amount,
    {
      V3: {
        parents: 1n,
        interior: {
          X2: [
            { Parachain: 2001n },
            { AccountId32: { network: null, id: decodeAddress(receiver) } },
          ],
        },
      },
    },
    4000000000n,
  ];
  return new Promise((resolve) => {
    api.tx.xTokens.transfer(...paras).signAndSend(signer, ({ status }) => {
      if (status.isFinalized) {
        console.log(
          `✔️  - moonriverTransferMovrToBifrost finalized at block hash #${status.asFinalized.toString()}`
        );
        resolve(status.asFinalized.toString());
      }
    });
  });
}
