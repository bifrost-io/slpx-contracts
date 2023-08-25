import { ApiPromise, WsProvider } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { blake2AsHex } from "@polkadot/util-crypto";

export async function getWsProviderInstance(wss: string) {
  const wsProvider = new WsProvider(wss);
  return await ApiPromise.create({ provider: wsProvider });
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

export async function sudo(
  api: ApiPromise,
  signer: KeyringPair,
  call: SubmittableExtrinsic<"promise", ISubmittableResult>
) {
  return new Promise((resolve) => {
    api.tx.sudo.sudo(call).signAndSend(signer, ({ status }) => {
      if (status.isFinalized) {
        console.log(
          `✔️  - sudoCall finalized at block hash #${status.asFinalized.toString()}`
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
      .mint(token, amount,"Hello")
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

export async function councilPropose(
  api: ApiPromise,
  signer: KeyringPair,
  threshold: any,
  call: any,
  encodedLength: any
) {
  return new Promise((resolve) => {
    api.tx.council
      .propose(threshold, call, encodedLength)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - councilPropose finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function crossAssetToAstar(
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
            `✔️  - cross_asset_to_astar finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}
const cross_bnc_to_bifrost = async (
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
            `✔️  - cross_bnc_to_moonbease finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
};

export async function crossAstrToBifrost(
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
            `✔️  - cross_star_to_bifrost finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function notePreimage(
  api: ApiPromise,
  signer: KeyringPair,
  proposal_hash: string
) {
  return new Promise((resolve) => {
    api.tx.preimage
      .notePreimage(proposal_hash)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - notePreimage finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function technicalCommitteePropose(
  api: ApiPromise,
  signer: KeyringPair,
  threshold: bigint,
  call: any,
  encodedLength: number
) {
  return new Promise((resolve) => {
    api.tx.technicalCommittee
      .propose(threshold, call, encodedLength)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - technicalCommitteePropose finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function vote(
  api: ApiPromise,
  signer: KeyringPair,
  ref_index: number,
  amount: bigint
) {
  return new Promise((resolve) => {
    api.tx.democracy
      .vote(ref_index, {
        Standard: { vote: { aye: true, conviction: "none" }, balance: amount },
      })
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - vote finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

// Propose a call need root origin
export async function democracyForCallNeedRootOrigin(
  api: ApiPromise,
  signer: KeyringPair,
  call: any
) {
  try {
    // submit preimage
    let call_hash = call.method.toHex();
    let preimage_hash = blake2AsHex(call_hash);
    await notePreimage(api, signer, call_hash);

    let external_propose_majority_call =
      api.tx.democracy.externalProposeMajority({
        Legacy: {
          hash: preimage_hash,
        },
      });
    await councilPropose(
      api,
      signer,
      1n,
      external_propose_majority_call,
      external_propose_majority_call.encodedLength
    );

    // technical committee propose the external propose majority call as a fast track call
    const fast_track_call = api.tx.democracy.fastTrack(preimage_hash, 5n, 1n);
    await technicalCommitteePropose(
      api,
      signer,
      1n,
      fast_track_call,
      fast_track_call.encodedLength
    );

    // a user vote for the referendum
    const ref_index = await api.query.democracy.referendumCount();
    await vote(api, signer, parseInt(ref_index.toString()) - 1, 50n);
  } catch (e) {
    console.log(e);
  }
}

export async function addLiquidity(
  api: ApiPromise,
  signer: KeyringPair,
  token_in: any,
  token_out: any,
  token_in_amount: any,
  token_out_amount: any
) {
  return new Promise((resolve) => {
    api.tx.zenlinkProtocol
      .addLiquidity(
        token_in,
        token_out,
        token_in_amount,
        token_out_amount,
        0n,
        0n,
        200000n
      )
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - addLiquidity finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

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
          `✔️  - transfer finalized at block hash #${status.asFinalized.toString()}`
        );
        resolve(status.asFinalized.toString());
      }
    });
  });
}

export async function waitFor(ms: any) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
