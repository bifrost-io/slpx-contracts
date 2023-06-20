export const ASTR_METADATA = {
  name: "Astar Native Token",
  symbol: "ASTR",
  decimals: 18,
  minimalBalance: 10_000_000_000_000_000n,
};

export const VASTR_METADATA = {
  name: "Voucher ASTR",
  symbol: "VASTR",
  decimals: 18,
  minimalBalance: 10_000_000_000_000_000n,
};

export const MOVR_METADATA = {
  name: "Moonriver Native Token",
  symbol: "MOVR",
  decimals: 18,
  minimalBalance: 1_000_000n,
};

export const GLMR_METADATA = {
  name: "Moonbeam Native Token",
  symbol: "GLMR",
  decimals: 18,
  minimalBalance: 1_000_000n,
};

export const KSM_METADATA = {
  name: "Kusama",
  symbol: "KSM",
  decimals: 12,
  minimalBalance: 100_000_000n,
};

export const ASTR = { Token2: 3 };
export const VASTR = { VToken2: 3 };
export const GLMR = { Token2: 1 };
export const VGLMR = { VToken2: 1 };
export const DOT = { Token2: 0 };
export const VDOT = { VToken2: 0 };
export const BNC = { Native: "BNC" };
export const MOVR = { Token: "MOVR" };
export const KSM = { Token: "KSM" };
export const vMOVR = { VToken: "MOVR" };
export const vKSM = { VToken: "KSM" };

export const ASSET_ASTR_LOCATION = {
  V3: { parents: 1, interior: { X1: { Parachain: 2006 } } },
};
export const ASSET_VASTR_LOCATION = {
  V3: {
    parents: 0,
    interior: {
      X1: {
        GeneralKey: {
          length: 2,
          data: "0x0901000000000000000000000000000000000000000000000000000000000000",
        },
      },
    },
  },
};
export const ASSET_VKSM_LOCATION = {
  V3: {
    parents: 0,
    interior: {
      X1: {
        GeneralKey: {
          length: 2,
          data: "0x0104000000000000000000000000000000000000000000000000000000000000",
        },
      },
    },
  },
};

export const ASSET_VMOVR_LOCATION = {
  V3: {
    parents: 0,
    interior: {
      X1: {
        GeneralKey: {
          length: 2,
          data: "0x010a000000000000000000000000000000000000000000000000000000000000",
        },
      },
    },
  },
};
export const ASSET_VDOT_LOCATION = {
  V3: {
    parents: 0,
    interior: {
      X1: {
        GeneralKey: {
          length: 2,
          data: "0x0900000000000000000000000000000000000000000000000000000000000000",
        },
      },
    },
  },
};

export const ASSET_VGLMR_LOCATION = {
  V3: {
    parents: 0,
    interior: {
      X1: {
        GeneralKey: {
          length: 2,
          data: "0x0901000000000000000000000000000000000000000000000000000000000000",
        },
      },
    },
  },
};
export const ASSET_MOVR_LOCATION = {
  V3: {
    parents: 1,
    interior: { X2: [{ Parachain: 2023 }, { PalletInstance: 10 }] },
  },
};
export const ASSET_GLMR_LOCATION = {
  V3: {
    parents: 1,
    interior: { X2: [{ Parachain: 2004 }, { PalletInstance: 10 }] },
  },
};
export const ASSET_KSM_LOCATION = {
  V3: { parents: 1, interior: "Here" },
};
export const ASSET_DOT_LOCATION = {
  V3: { parents: 1, interior: "Here" },
};
export const BNC_DECIMALS = 1_000_000_000_000n;
export const ASTR_DECIMALS = 1_000_000_000_000_000_000n;
export const MOVR_DECIMALS = 1_000_000_000_000_000_000n;
export const GLMR_DECIMALS = 1_000_000_000_000_000_000n;
export const KSM_DECIMALS = 1_000_000_000_000n;
export const TEST_ACCOUNT = "aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv";
export const ALICE = "gXCcrjjFX3RPyhHYgwZDmw8oe4JFpd5anko3nTY8VrmnJpe";
export const ALITH = "0xf24FF3a9CF04c71Dbc94D0b566f7A27B94566cac";
export const Hardhat0 = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
