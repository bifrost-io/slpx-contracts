import { ApiPromise, Keyring, WsProvider } from "@polkadot/api";
import { MultiLocation } from "@polkadot/types/interfaces";
import { u8aToHex, stringToU8a, hexToU8a } from "@polkadot/util";
import * as polkadotCryptoUtils from "@polkadot/util-crypto";

const main = async () => {
  // d6BNfrypoMvfNpkTBPGVN7y3LzGFpAhNosAs5U7y2otreKT
  const wsProvider = new WsProvider("wss://wss.api.moonbeam.network");
  // const wsProvider = new WsProvider("wss://moonbeam.public.blastapi.io")
  const api = await ApiPromise.create({ provider: wsProvider });
  const xcmTransaction = {
    V2: {
      gasLimit: 720000,
      action: { Call: "0xae0daa9bfc50f03ce23d30c796709a58470b5f42" },
      value: 0,
      input:
        "0x9a41b9240001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000007b00000000000000000000000000000000000000000000000000000000000001c8",
    },
  };
  const tx = api.tx.ethereumXcm.transact(xcmTransaction);
  const alice = "5DV1dYwnQ27gKCKwhikaw1rz1bYdvZZUuFkuduB4hEK3FgDT";
  const info = await tx.paymentInfo(alice);
  console.log(`Required Weight: ${info.partialFee.toString()}`);
};
main()
  .then()
  .catch((err) => console.log(err))
  .finally(() => process.exit());
