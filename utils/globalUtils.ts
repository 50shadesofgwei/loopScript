import { ethers } from "ethers";
import axios from "axios";
import * as fs from "fs/promises";
import dotenv from 'dotenv';
dotenv.config();

export const MAESTRO_ADDRESS = "0xa6a147946FACAc9E0B99824870B36088764f969F"
export const SPOT_EXECUTOR_ADDRESS = "0x7e4EC0C90E5e8ACe890c2080bd8377ef70991462"
export const VAULT_ADDRESS = "0x3F37C7d8e61C000085AAc0515775b06A3412F36b"
export const LENS_ADDRESS = "0xe03835Dfae2644F37049c1feF13E8ceD6b1Bb72a"

const rpc = process.env.ARBITRUM_RPC_URL as string
export const GLOBAL_ARBITRUM_RPC = new ethers.providers.JsonRpcProvider(rpc)

const VAULT_ABI = JSON.parse(await fs.readFile("utils/ABIs/vaultABI.json", "utf-8"));
const MAESTRO_ABI = JSON.parse(await fs.readFile("utils/ABIs/maestroABI.json", "utf-8"));
const LENS_ABI = JSON.parse(await fs.readFile("utils/ABIs/lensABI.json", "utf-8"));

export const VAULT_CONTRACT = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, GLOBAL_ARBITRUM_RPC);
export const MAESTRO_CONTRACT = new ethers.Contract(MAESTRO_ADDRESS, MAESTRO_ABI, GLOBAL_ARBITRUM_RPC);
export const LENS_CONTRACT = new ethers.Contract(LENS_ADDRESS, LENS_ABI, GLOBAL_ARBITRUM_RPC);

export type RawTradeParams = {
    positionId: string;       // hex string
    quantity: number;         // float
    limitPrice: number;       // float
    cashflowCurrency: number; // 0 = Neither, 1 = Base, 2 = Quote
    cashflow: number;         // float
};

export type TypedTradeParams = [
    Uint8Array,  // positionId (bytes32 hex string)
    bigint,  // quantity (scaled)
    bigint,  // limitPrice (scaled)
    number,  // cashflowCurrency
    bigint   // cashflow (scaled)
];

export function typecastTradeParams(
    params: RawTradeParams,
    quantityDecimals?: number,
    limitPriceDecimals?: number,
    cashflowDecimals?: number
): TypedTradeParams {
    try {

        const positionId = ethers.utils.arrayify(params.positionId);
        const quantity = BigInt(
            Math.floor(params.quantity * 10 ** (quantityDecimals || 0))
        );

        const limitPrice = BigInt(
            Math.floor(params.limitPrice * 10 ** (limitPriceDecimals || 0))
        );

        const cashflow = BigInt(
            Math.floor(params.cashflow * 10 ** (cashflowDecimals || 0))
        );

        const cashflowCurrency = params.cashflowCurrency;

        return [positionId, quantity, limitPrice, cashflowCurrency, cashflow];
    } catch (error) {
        console.error("Error in typecasting TradeParams:", error);
        throw error;
    }
}


export type RawExecutionParams = {
    spender: string;             // address
    router: string;              // address
    swapAmount: number;          // float
    txData: string;              // hex string (bytes)
    flashloanProvider: string;   // address
};

export type TypedExecutionParams = [
    string,  // spender (address)
    string,  // router (address)
    bigint,  // swapAmount (BigInt)
    Uint8Array,  // txData (hex bytes)
    string   // flashloanProvider (address)
];

export function typecastExecutionParams(
    params: RawExecutionParams
): TypedExecutionParams {
    try {
        const spender = ethers.utils.getAddress(params.spender);
        const router = ethers.utils.getAddress(params.router);
        const txData = ethers.utils.arrayify(params.txData); // assumes hex string like 0x...
        const swapAmount = BigInt(Math.floor(params.swapAmount)); // no decimals specified here
        const flashloanProvider = ethers.utils.getAddress(params.flashloanProvider);

        return [spender, router, swapAmount, txData, flashloanProvider];
    } catch (error) {
        console.error("Error in typecasting ExecutionParams:", error);
        throw error;
    }
}


export type RawTPSLParams = {
    positionId: string;  // hex string (bytes32)
    limitPrice: number;  // float
    tolerance: number;   // float (0.003e4 = 0.3%)
    orderType: number;   // enum (int)
};

export type TypedTPSLParams = [
    string,  // positionId (bytes32)
    bigint,  // limitPrice (scaled)
    bigint,  // tolerance (scaled)
    number,  // cashflowCurrency (constant = 2)
    bigint,  // deadline (uint32 max)
    number   // orderType (enum)
];

export function typecastTPSLParams(
    params: RawTPSLParams,
    limitDecimals: number
): TypedTPSLParams {
    try {
        const positionId = ethers.utils.hexZeroPad(params.positionId, 32); // ensure bytes32

        const limitPrice = BigInt(
            Math.floor(params.limitPrice * 10 ** limitDecimals)
        );

        const tolerance = BigInt(
            Math.floor(params.tolerance * 10 ** 4) // tolerance always scaled by 10^4
        );

        const cashflowCurrency = 2; // Quote (constant)
        const deadline = BigInt(2 ** 32 - 1); // uint32 max
        const orderType = params.orderType;

        return [positionId, limitPrice, tolerance, cashflowCurrency, deadline, orderType];
    } catch (error) {
        console.error("Error in typecasting TPSLParams:", error);
        throw error;
    }
}

export type RawQuoteDetails = {
    chainId: number;      // Chain ID (int)
    sellToken: string;    // Address (hex string)
    buyToken: string;     // Address (hex string)
    sellAmount: number;   // Number (could be scaled already)
    taker: string;        // Address (hex string)
};

export type TypedQuoteDetails = {
    chainId: number;
    sellToken: string;    // checksummed address
    buyToken: string;     // checksummed address
    sellAmount: bigint;   // scaled BigInt
    taker: string;        // checksummed address
};


export function typecastQuoteDetails(params: RawQuoteDetails): TypedQuoteDetails {
    try {
        const sellToken = ethers.utils.getAddress(params.sellToken);
        const buyToken = ethers.utils.getAddress(params.buyToken);
        const taker = ethers.utils.getAddress(params.taker);
        const sellAmount = BigInt(params.sellAmount); 

        return {
            chainId: params.chainId,
            sellToken,
            buyToken,
            sellAmount,
            taker
        };
    } catch (error) {
        console.error("Error in typecasting QuoteDetails:", error);
        throw error;
    }
}

export type ZeroExAPIResponse = {
    spender: string,
    swapAmount: number,
    txData: string
}

export async function get0xApiQuote(quoteDetails: RawQuoteDetails): Promise<ZeroExAPIResponse | null> {
    try {
        const apiKey = process.env.ZERO_EX_API_KEY!;
        if (!apiKey) throw new Error("0x API key not set in environment variables");

        const params = {
            chainId: quoteDetails.chainId,
            sellToken: quoteDetails.sellToken,
            buyToken: quoteDetails.buyToken,
            sellAmount: quoteDetails.sellAmount,
            taker: quoteDetails.taker
        };

        const headers = {
            "0x-api-key": apiKey,
            "0x-version": "v2"
        };

        const response = await axios.get("https://api.0x.org/swap/allowance-holder/quote", { params, headers });

        const data = response.data;

        const spender = data?.transaction?.to || null;
        const txData = data?.transaction?.data || null;

        return {
            spender,
            swapAmount: quoteDetails.sellAmount,
            txData
        };
    } catch (error) {
        console.error("Failed to fetch 0x API quote:", error);
        return null;
    }
}

export enum ModifyPositionOptions {
    INCREASE_LONG = 1,
    DECREASE_SHORT = 2,
    DECREASE_LONG = 3,
    INCREASE_SHORT = 4
}

export type OrderObject = {
    symbol: string;
    isLong: boolean;
    sizeUsd: number;
};

export async function getModifyPositionDetails(
    order: OrderObject,
    positionId: string,
    isPositionIdLong: (positionId: string) => Promise<boolean>  // dependency
): Promise<ModifyPositionOptions | null> {
    try {
        const isLong = await isPositionIdLong(positionId);

        if (order.isLong && isLong) return ModifyPositionOptions.INCREASE_LONG;
        if (order.isLong && !isLong) return ModifyPositionOptions.DECREASE_SHORT;
        if (!order.isLong && isLong) return ModifyPositionOptions.DECREASE_LONG;
        if (!order.isLong && !isLong) return ModifyPositionOptions.INCREASE_SHORT;

        return null;  // fallback (shouldn't reach)
    } catch (error) {
        console.error("Failed to identify modify position case:", error);
        return null;
    }
}

export enum TokenAddressesArbitrum {
    USDC = '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    USDC_BRIDGED = '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    ETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    WBTC = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
}

export function getTokenName(address: string): string | null {
    try {
        const lowerAddress = address.toLowerCase();
        for (const [key, value] of Object.entries(TokenAddressesArbitrum)) {
            if (value.toLowerCase() === lowerAddress) {
                return key;
            }
        }
        return null;  // Not found
    } catch (error) {
        console.error("Invalid token address:", error);
        return null;
    }
}

export function getTokenAddress(name: string): string | null {
    try {
        const normalized = name.toUpperCase() === 'BTC' ? 'WBTC' : name.toUpperCase();
        const address = TokenAddressesArbitrum[normalized as keyof typeof TokenAddressesArbitrum];
        return address || null;
    } catch (error) {
        console.error("Invalid token name:", error);
        return null;
    }
}

const DECIMALS: Record<string, number> = {
    USDC: 6,
    BTC: 8,
    BTC2: 8,
    ETH: 18,
    ETH2: 18,
    SNX: 18,
    SOL: 9,
    W: 18,
    WIF: 6,
    ARB: 18,
    BNB: 18,
    ENA: 18,
    DOGE: 8,
    AVAX: 18,
    PENDLE: 18,
    NEAR: 24,
    AAVE: 18,
    ATOM: 6,
    XRP: 6,
    LINK: 18,
    UNI: 18,
    LTC: 8,
    OP: 18,
    GMX: 18,
    PEPE: 18,
    wstETH: 18,
    SHIB: 18,
    STX: 18,
    ORDI: 18,
    EIGEN: 18,
    SATS: 18, // Unconfirmed
    POL: 18,
    APE: 18,
    SUI: 9, // Unconfirmed
    SEI: 18,
    APT: 8, // Unconfirmed
    TIA: 9, // Unconfirmed
    TRX: 8, // Unconfirmed
    TON: 9, // Unconfirmed
    TAO: 9, // Unconfirmed
    BONK: 18, // Unconfirmed
    WLD: 18,
    BOME: 18,
    MEME: 18,
    FLOKI: 18 // Unconfirmed
};

export function getDecimalsForSymbol(symbol: string): number | null {
    return DECIMALS[symbol] ?? null;
}
