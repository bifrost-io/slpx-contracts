import { ApiPromise } from "@polkadot/api";
import { KeyringPair } from "@polkadot/keyring/types";
import { blake2AsHex } from "@polkadot/util-crypto";
import { MOVR_DECIMALS } from "./constants";
import { Vec } from "@polkadot/types";
import { H256 } from "@polkadot/types/interfaces/runtime";

export async function sudo(api: ApiPromise, signer: KeyringPair, call: any) {
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

export async function councilCollectivePropose(
  api: ApiPromise,
  signer: KeyringPair,
  threshold: any,
  call: any,
  encodedLength: any
) {
  return new Promise((resolve) => {
    api.tx.councilCollective
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

export async function techCommitteeCollectivePropose(
  api: ApiPromise,
  signer: KeyringPair,
  threshold: bigint,
  call: any,
  encodedLength: number
) {
  return new Promise((resolve) => {
    api.tx.techCommitteeCollective
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

export async function councilCollectiveVote(
  api: ApiPromise,
  signer: KeyringPair,
  proposeHash: H256,
  proposeIndex: number
) {
  return new Promise((resolve) => {
    api.tx.councilCollective
      .vote(proposeHash, proposeIndex, true)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - councilCollectiveVote finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function techCommitteeCollectiveVote(
  api: ApiPromise,
  signer: KeyringPair,
  proposeHash: H256,
  proposeIndex: number
) {
  return new Promise((resolve) => {
    api.tx.techCommitteeCollective
      .vote(proposeHash, proposeIndex, true)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - techCommitteeCollectiveVote finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function councilCollectiveClose(
  api: ApiPromise,
  signer: KeyringPair,
  proposeHash: H256,
  proposeIndex: number
) {
  return new Promise((resolve) => {
    api.tx.councilCollective
      .close(proposeHash, proposeIndex, [100000000000n, 100000n], 1000n)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - councilCollectiveClose finalized at block hash #${status.asFinalized.toString()}`
          );
          resolve(status.asFinalized.toString());
        }
      });
  });
}

export async function techCommitteeCollectiveClose(
  api: ApiPromise,
  signer: KeyringPair,
  proposeHash: H256,
  proposeIndex: number
) {
  return new Promise((resolve) => {
    api.tx.techCommitteeCollective
      .close(proposeHash, proposeIndex, [100000000000n, 100000n], 1000n)
      .signAndSend(signer, ({ status }) => {
        if (status.isFinalized) {
          console.log(
            `✔️  - techCommitteeCollectiveClose finalized at block hash #${status.asFinalized.toString()}`
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

// Propose a call need root origin
export async function MoonbeamCallNeedRootOrigin(
  api: ApiPromise,
  alith: KeyringPair,
  baltathar: KeyringPair,
  charleth: KeyringPair,
  call: any
) {
  try {
    // submit preimage
    let call_hash = call.method.toHex();
    let preimage_hash = blake2AsHex(call_hash);
    console.log("Preimage Hash is: ", preimage_hash);
    await notePreimage(api, baltathar, call_hash);

    let external_propose_majority_call =
      api.tx.democracy.externalProposeMajority({
        Legacy: {
          hash: preimage_hash,
        },
      });
    await councilCollectivePropose(
      api,
      baltathar,
      2n,
      external_propose_majority_call,
      external_propose_majority_call.encodedLength
    );

    const councilProposalIndexCodec =
      await api.query.councilCollective.proposalCount();
    const councilProposalHashCodec =
      await api.query.councilCollective.proposals();
    const councilProposalIndex =
      parseInt(councilProposalIndexCodec.toString()) - 1;
    const councilProposalHash = (councilProposalHashCodec as Vec<H256>)[0];

    await councilCollectiveVote(
      api,
      baltathar,
      councilProposalHash,
      councilProposalIndex
    );
    await councilCollectiveVote(
      api,
      charleth,
      councilProposalHash,
      councilProposalIndex
    );

    await councilCollectiveClose(
      api,
      baltathar,
      councilProposalHash,
      councilProposalIndex
    );

    // technical committee propose the external propose majority call as a fast track call
    const fast_track_call = api.tx.democracy.fastTrack(preimage_hash, 5n, 1n);
    await techCommitteeCollectivePropose(
      api,
      alith,
      2n,
      fast_track_call,
      fast_track_call.encodedLength
    );

    const techCommitteeProposalIndexCodec =
      await api.query.techCommitteeCollective.proposalCount();
    const techCommitteeProposalHashCodec =
      await api.query.techCommitteeCollective.proposals();
    const techCommitteeProposalIndex =
      parseInt(techCommitteeProposalIndexCodec.toString()) - 1;
    const techCommitteeProposalHash = (
      techCommitteeProposalHashCodec as Vec<H256>
    )[0];
    await techCommitteeCollectiveVote(
      api,
      alith,
      techCommitteeProposalHash,
      techCommitteeProposalIndex
    );
    await techCommitteeCollectiveVote(
      api,
      baltathar,
      techCommitteeProposalHash,
      techCommitteeProposalIndex
    );
    await techCommitteeCollectiveClose(
      api,
      baltathar,
      techCommitteeProposalHash,
      techCommitteeProposalIndex
    );

    // a user vote for the referendum
    const ref_index = await api.query.democracy.referendumCount();
    await vote(api, baltathar, parseInt(ref_index.toString()) - 1, 50n);
  } catch (e) {
    console.log(e);
  }
}
