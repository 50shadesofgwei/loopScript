import * as fs from "fs/promises";
import { encodePositionId, mulDiv, generatePositionIds, getMoneyMarketId, STABLECOINS } from "./contangoUtils.js";


export class Market {
    positionId: string;
    id: number;
    base: string;
    quote: string;
    baseDecimals: number;
    quoteDecimals: number;

    constructor(
        positionId: string,
        moneyMarketId: number,
        base: string,
        quote: string,
        baseDecimals: number,
        quoteDecimals: number
    ) {
        this.positionId = positionId;
        this.id = moneyMarketId;
        this.base = base;
        this.quote = quote;
        this.baseDecimals = baseDecimals;
        this.quoteDecimals = quoteDecimals;
    }
}

export class Markets {
    private markets: { [key: string]: Market } = {};  // internal storage

    addMarket(name: string, market: Market): void {
        this.markets[name] = market;
    }

    getMarket(name: string): Market | undefined {
        return this.markets[name];
    }

    getAllMarkets(): Market[] {
        return Object.values(this.markets); 
    }

    toString(): string {
        return `<MarketCollection ${Object.keys(this.markets).join(", ")}>`;
    }
}

export class ContangoMarketDirectory {
    static markets: Markets = new Markets();
    private static isInitialized = false;

    constructor() {
    }

    static async initialize(): Promise<void> {
        try {
            if (!ContangoMarketDirectory.isInitialized) {
                await ContangoMarketDirectory.updateAllMarketParameters();
                ContangoMarketDirectory.isInitialized = true;
                console.info("ContangoMarketDirectory - Markets Initialized");
            }
        } catch (error) {
            console.error("ContangoMarketDirectory - Failed to initialize market directory.", error);
        }
    }

    static getPositionId(base: string, quote: string, moneyMarketId: number): string | null {
        try {
            base = base === "BTC" ? "WBTC" : base;
            quote = quote === "BTC" ? "WBTC" : quote;

            for (const market of this.markets.getAllMarkets()) {
                if (market.base === base && market.quote === quote && market.id === moneyMarketId) {
                    return market.positionId;
                }
            }
            console.warn(`No matching position ID found for ${base}/${quote} with money market ID ${moneyMarketId}.`);
            return null;
        } catch (error) {
            console.error("ContangoMarketDirectory - Failed to get position ID.", error);
            return null;
        }
    }

    static async getAssetsForPositionId(positionId: string): Promise<[string, string] | null> {
        try {
            const normalizedPositionId = positionId.split(/ffffffff/i)[0].toLowerCase();

            for (const market of this.markets.getAllMarkets()) {
                const marketNormalizedId = market.positionId.split(/ffffffff/i)[0].toLowerCase();
                if (marketNormalizedId === normalizedPositionId) {
                    return [market.base, market.quote];
                }
            }
            console.warn(`ContangoMarketDirectory - No assets found for ID ${normalizedPositionId}`);
            return null;
        } catch (error) {
            console.error("ContangoMarketDirectory - Failed to get assets for position ID.", error);
            return null;
        }
    }

    private static async updateAllMarketParameters(): Promise<void> {
        try {
            await generatePositionIds();
            await this.buildMarketsFromPositionIds();
        } catch (error) {
            console.error("ContangoMarketDirectory - Failed to fetch market parameters.", error);
        }
    }

    private static async buildMarketsFromPositionIds(): Promise<void> {
        try {
            const data = await fs.readFile("position_ids.json", "utf-8");
            const positionIds: { [key: string]: string } = JSON.parse(data);

            for (const [marketName, positionId] of Object.entries(positionIds)) {
                const [base, quote, moneyMarket] = marketName.split("_");
                let baseDecimals = this.getDecimals(base);
                let quoteDecimals = this.getDecimals(quote);
                const moneyMarketId = getMoneyMarketId(moneyMarket);

                if (base === "USDCE") baseDecimals = this.getDecimals("USDC");
                if (quote === "USDCE") quoteDecimals = this.getDecimals("USDC");

                const market = new Market(positionId, moneyMarketId, base, quote, baseDecimals, quoteDecimals);
                this.markets.addMarket(marketName, market);
            }
            console.info("Contango markets built successfully.");
        } catch (error) {
            console.error("ContangoMarketDirectory - Failed to build markets from positionID file.", error);
        }
    }

    static async isPositionIdLong(positionId: string): Promise<boolean | null> {
        try {
            const assets = await this.getAssetsForPositionId(positionId);
            if (!assets) return null;
            const [base] = assets;
            return !STABLECOINS.includes(base);
        } catch (error) {
            console.error("ContangoMarketDirectory - Failed to determine long/short position.", error);
            return null;
        }
    }

    private static getDecimals(symbol: string): number {
        const decimalsMap: { [key: string]: number } = {
            ETH: 18,
            WBTC: 8,
            USDC: 6,
            USDT: 6,
            DAI: 18,
            LUSD: 18
        };
        return decimalsMap[symbol] || 18;
    }
}
