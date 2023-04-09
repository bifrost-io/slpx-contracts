export const ASTR_METADATA = {
    name: 'Astar Native Token',
    symbol: 'ASTR',
    decimals: 18,
    minimalBalance: 10_000_000_000_000_000n,
}

export const VASTR_METADATA = {
    name: 'Voucher ASTR',
    symbol: 'VASTR',
    decimals: 18,
    minimalBalance: 10_000_000_000_000_000n,
}

export const ASTR = { Token2: 1 }
export const VASTR = { VToken2: 1 }
export const BNC = { Native: 'BNC' }

export const ASSET_ASTR_LOCATION = { V3: { parents: 1, interior: { X1: { Parachain: 2006 } } } }
export const ASSET_VASTR_LOCATION = { V3: { parents: 0, interior: { X1: { GeneralKey: { length:2 , data: "0x0901000000000000000000000000000000000000000000000000000000000000"} } } } }
export const BNC_DECIMALS = 1_000_000_000_000n
export const ASTR_DECIMALS = 1_000_000_000_000_000_000n
export const TEST_ACCOUNT = "aNhuaXEfaSiXJcC1YxssiHgNjCvoJbESD68KjycecaZvqpv"