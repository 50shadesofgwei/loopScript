import { ethers } from "ethers";
import * as fs from "fs/promises";

export const EXPONENT = 1000000000000000000n;  // 1e18
export const QUOTE_EXPONENT = 1000000n;        // 1e6


export enum Instruments {
    ETH_USDC = 'WETHUSDC.n',
    ETH_USDCE = 'WETHUSDC',
    ETH_DAI = 'WETHDAI',
    ETH_USDT = 'WETHUSDT',
    ETH_LUSD = 'WETHLUSD',
    WBTC_USDC = 'WBTCUSDC.n',
    WBTC_USDCE = 'WBTCUSDC',
    WBTC_DAI = 'WBTCDAI',
    WBTC_USDT = 'WBTCUSDT',
    USDC_ETH = 'USDC.nWETH',
    USDCE_ETH = 'USDTWETH',
    DAI_ETH = 'DAIWETH',
    USDT_ETH = 'USDTWETH',
    USDC_WBTC = 'USDC.nWBTC',
    USDCE_WBTC = 'USDCWBTC',
    DAI_WBTC = 'DAIWBTC',
    USDT_WBTC = 'USDTWBTC'
}

export enum MoneyMarkets {
    AAVE = 1,
    COMPOUND = 2,
    EXACTLY = 4,
    AAVEV2 = 10,
    LODESTAR = 12,
    MOONWELL = 13,
    SILO = 16,
    DOLOMITE = 17
}

export function getMoneyMarketId(marketName: string): number {
    const normalized = marketName.toUpperCase() as keyof typeof MoneyMarkets;

    // Check if normalized is a key (ignores reverse mappings)
    if (!Object.prototype.hasOwnProperty.call(MoneyMarkets, normalized)) {
        throw new Error(`Invalid money market name: ${marketName}`);
    }

    const value = MoneyMarkets[normalized];

    if (typeof value !== "number") {
        throw new Error(`Invalid enum access: ${marketName} resolved to non-number`);
    }

    return value;
}

export const STABLECOINS = ['USDC', 'USDC.n', 'USDT', 'DAI']

export function encodePositionId(
    symbol: string,
    moneyMarketId: number,
    number: number,
    flags: number,
    expiry: number = 2 ** 32 - 1
): string {
    const MAX_UINT48 = BigInt(2 ** 48 - 1);
    const MAX_UINT32 = BigInt(2 ** 32 - 1);

    if (BigInt(number) > MAX_UINT48) {
        throw new Error(`InvalidUInt48: ${number}`);
    }
    if (BigInt(expiry) > MAX_UINT32) {
        throw new Error(`InvalidUInt32: ${expiry}`);
    }
    if (expiry === 0) {
        throw new Error("InvalidExpiry");
    }

    // Convert `symbol` to bytes32 (padded/truncated to 32 bytes)
    const encoder = new TextEncoder();
    const symbolBytes = encoder.encode(symbol);
    if (symbolBytes.length > 32) {
        throw new Error("Symbol exceeds 32 bytes");
    }
    const symbolBytes32 = new Uint8Array(32);
    symbolBytes32.set(symbolBytes);

    const symbolInt = BigInt('0x' + Buffer.from(symbolBytes32).toString('hex'));

    // Construct the position_id using bitwise operations
    const positionId = 
        symbolInt |
        (BigInt(moneyMarketId) << BigInt(120)) |
        (BigInt(expiry) << BigInt(88)) |
        (BigInt(flags) << BigInt(80)) |
        BigInt(number);

    const idBytes = Buffer.alloc(32);
    idBytes.writeBigUInt64BE((positionId >> BigInt(192)) & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
    idBytes.writeBigUInt64BE((positionId >> BigInt(128)) & BigInt('0xFFFFFFFFFFFFFFFF'), 8);
    idBytes.writeBigUInt64BE((positionId >> BigInt(64)) & BigInt('0xFFFFFFFFFFFFFFFF'), 16);
    idBytes.writeBigUInt64BE(positionId & BigInt('0xFFFFFFFFFFFFFFFF'), 24);

    return '0x' + idBytes.toString('hex');
}


export function mulDiv(a: bigint, b: bigint, unit: bigint): bigint {
    try {
        const numerator = a * b;
        if (numerator !== 0n && unit !== 0n) {
            return numerator / unit;
        }
        return 0n;
    } catch (error) {
        console.error(`Error calculating mulDiv for values a: ${a}, b: ${b}, unit: ${unit}. Error:`, error);
        return 0n;
    }
}

type Prices = {
    collateral: bigint;
    debt: bigint;
    common_unit: bigint;
};

type Balances = {
    collateral: bigint;
    debt: bigint;
};

type NormalizedBalances = {
    collateral: bigint;
    debt: bigint;
    unit: bigint;
};

type Metadata = {
    liquidation_threshold: bigint;
    base: { decimals: bigint };
    quote: { decimals: bigint };
};

export function calculateLiquidationPriceFromMetadata(
    prices: Prices,
    normalizedBalances: NormalizedBalances,
    metadata: Metadata,
    isLong: boolean
): number | null {
    try {
        const liquidationThreshold = metadata.liquidation_threshold;

        const quantity = mulDiv(
            normalizedBalances.collateral,
            normalizedBalances.unit,
            prices.collateral
        );

        const debtTimesRatio = mulDiv(
            normalizedBalances.debt,
            EXPONENT,
            liquidationThreshold
        );

        const price = mulDiv(
            debtTimesRatio,
            prices.common_unit,
            prices.debt
        );

        let liquidationPrice: bigint;

        if (!isLong) {
            liquidationPrice = mulDiv(
                quantity,
                metadata.base.decimals,
                price
            );
        } else {
            liquidationPrice = mulDiv(
                price,
                metadata.quote.decimals,
                quantity
            );
        }

        return Number(liquidationPrice) / Number(QUOTE_EXPONENT);
    } catch (error) {
        console.error("Error calculating liquidation price from metadata:", error);
        return null;
    }
}

export function calculateNormalizedBalances(
    prices: Prices,
    balances: Balances,
    metadata: Metadata
): NormalizedBalances | null {
    try {
        const collateral = mulDiv(
            balances.collateral,
            prices.collateral,
            metadata.base.decimals
        );

        const debt = mulDiv(
            balances.debt,
            prices.debt,
            metadata.quote.decimals
        );

        const unit = prices.common_unit;

        return {
            collateral,
            debt,
            unit
        };
    } catch (error) {
        console.error("Error normalizing balances:", error);
        return null;
    }
}

export async function getLensContract(): Promise<ethers.Contract | null> {
    try {
        const providerUrl = process.env.ARBITRUM_RPC_URL;
        if (!providerUrl) throw new Error("ARBITRUM_RPC_URL not set");

        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const lensAddress = "0xe03835Dfae2644F37049c1feF13E8ceD6b1Bb72a";

        const lensAbiJson = await fs.readFile("GlobalUtils/ABIs/ContangoLens.json", "utf-8");
        const lensAbi = JSON.parse(lensAbiJson);

        const contract = new ethers.Contract(lensAddress, lensAbi, provider);
        return contract;

    } catch (error) {
        console.error("Error building lens contract:", error);
        return null;
    }
}

export function convertContangoIdToBytes(id: string): Uint8Array | null {
    try {
        const rawBytes = ethers.utils.arrayify(id);  // Converts hex string to bytes (Uint8Array)
        return rawBytes;
    } catch (error) {
        console.error(`Error encountered while converting Contango ID to bytes:`, error);
        return null;
    }
}

export async function generatePositionIds(outputFile = "position_ids.json"): Promise<void> {
    const positionIds: { [key: string]: string } = {};

    for (const instrumentKey of Object.keys(Instruments)) {
        const instrumentValue = Instruments[instrumentKey as keyof typeof Instruments];

        for (const marketKey of Object.keys(MoneyMarkets)) {
            if (isNaN(Number(marketKey))) {  // Skip reverse mappings
                const marketValue = MoneyMarkets[marketKey as keyof typeof MoneyMarkets]; // Numeric ID
                
                const number = 0;  // Default position number
                const flags = 0;   // Default flags
                const expiry = 2 ** 32 - 1;  // Default expiry
        
                const positionId = encodePositionId(
                    instrumentValue,  // Symbol
                    marketValue,      // Numeric market ID (good!)
                    number,
                    flags,
                    expiry
                );
        
                const key = `${instrumentKey}_${marketKey}`;  // Use marketKey (string) for the key
                positionIds[key] = positionId;
            }
        }
    }

    // Save to file
    await fs.writeFile(outputFile, JSON.stringify(positionIds, null, 4));

    console.log(`Position IDs saved to ${outputFile}`);
}
