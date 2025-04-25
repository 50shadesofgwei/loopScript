import { ethers, BigNumber, providers } from 'ethers'
import dotenv from 'dotenv';
dotenv.config();
import * as utils from '../utils/index.js'
import { checkTxSuccess, buildAndSendTx, approveUsdcForSpend } from './index.js'
import { OrderObject, RawQuoteDetails } from '../utils/index.js';
const { 
    encodePositionId,
    mulDiv, 
    TokenAddressesArbitrum, 
    getTokenAddress, 
    MoneyMarkets,
    ContangoMarketDirectory,
    getDecimalsForSymbol,
    typecastTradeParams,
    typecastExecutionParams,
    get0xApiQuote,
    SPOT_EXECUTOR_ADDRESS,
    GLOBAL_ARBITRUM_RPC
 } = utils;


export class ContangoTxExecutor {
    leverage: number
    executorAddress: string
    privKey: string
    maestro: ethers.Contract
    lens: ethers.Contract
    vault: ethers.Contract
    fees: number

    constructor(
        leverage: number,
        executorAddress: string,
        privKey: string,
        maestro: ethers.Contract,
        lens: ethers.Contract,
        vault: ethers.Contract,
        fees: number
    ) {
        this.leverage = leverage;
        this.executorAddress = executorAddress;
        this.privKey = privKey;
        this.maestro = maestro;
        this.lens = lens;
        this.vault = vault;
        this.fees = fees;
    }

    async executeTrade(order: OrderObject, moneyMarket: number = 1): Promise<string | null> {
        try {
            // Approve USDC
            // const approveReceipt = await approveUsdcForSpend(utils.VAULT_ADDRESS, BigInt(order.sizeUsd * 1e6));
            // const approvalSuccess = checkTxSuccess(approveReceipt!);
            // if (!approvalSuccess) {
            //     console.error("Failed to approve USDC.");
            //     return null;
            // }

            const usdcAddress = getTokenAddress('USDC')!;
            const assetAddress = getTokenAddress(order.symbol)!;
            const usdcDecimals = getDecimalsForSymbol("USDC")!;
            const assetDecimals = getDecimalsForSymbol(order.symbol)!;

            // await this.depositToVault(usdcAddress, BigNumber.from(order.sizeUsd * 1e6));

            const price = await this.getPriceFromMoneyMarket(order.symbol, MoneyMarkets.AAVE);
            const collateralUsd = order.sizeUsd * this.fees;
            const collateralAsset = collateralUsd / price!;
            let quantity = collateralAsset * this.leverage;
            let flashloanAmount = collateralUsd * this.leverage;
            const limitPrice = price! * 0.995;

            let sellToken = usdcAddress;
            let buyToken = assetAddress;
            let positionId: string;
            let cashflowCurrency: number;
            let quantityDecimals: number;

            if (!order.isLong) {
                positionId = ContangoMarketDirectory.getPositionId("USDC", order.symbol, moneyMarket) as string;
                quantity = collateralUsd * this.leverage;
                flashloanAmount = (collateralAsset * this.leverage) * 10 ** assetDecimals;
                sellToken = assetAddress;
                buyToken = usdcAddress;
                cashflowCurrency = 1;
                quantityDecimals = usdcDecimals;
            } else {
                positionId = ContangoMarketDirectory.getPositionId(order.symbol, "USDC", moneyMarket) as string;
                flashloanAmount = flashloanAmount * 10 ** usdcDecimals;
                cashflowCurrency = 2;
                quantityDecimals = assetDecimals;
            }

            const quoteDetails: RawQuoteDetails = {
                chainId: 42161,
                sellToken,
                buyToken,
                sellAmount: flashloanAmount,
                taker: SPOT_EXECUTOR_ADDRESS
            };

            const zeroExQuote = await get0xApiQuote(quoteDetails);
            if (!zeroExQuote) {
                console.error("0x API quote failed.");
                return null;
            }

            const tradeParams = typecastTradeParams({
                positionId,
                quantity,
                limitPrice,
                cashflowCurrency,
                cashflow: collateralUsd
            }, quantityDecimals, assetDecimals, usdcDecimals);

            console.log("TRADE_PARAMS", tradeParams)

            const executionParams = typecastExecutionParams({
                spender: zeroExQuote.spender,
                router: zeroExQuote.spender,
                swapAmount: flashloanAmount,
                txData: zeroExQuote.txData,
                flashloanProvider: "0x5e2aDC1F256f990D73a69875E06AF8A8404e3a03"
            });

            console.log("EXECUTION_PARAMS", executionParams)

            const txData = await this.maestro.populateTransaction.trade(tradeParams, executionParams);
            txData.from = this.executorAddress;
            txData.nonce = await GLOBAL_ARBITRUM_RPC.getTransactionCount(this.executorAddress);
            const txReceipt = await buildAndSendTx(txData);
            const executionSuccess = checkTxSuccess(txReceipt!);

            if (!executionSuccess) {
                console.error("Failed to execute trade.");
                return null;
            }

            const tradeId = this.getIdFromTxReceipt(txReceipt!);
            return tradeId;

        } catch (error) {
            console.error("ContangoTxExecutor - Failed to execute trade on Contango.", error);
            return null;
        }
    }

    async depositToVault(tokenAddress: string, amount: BigNumber): Promise<boolean> {
        try {
            const txData = await this.vault.populateTransaction.deposit(
                ethers.utils.getAddress(tokenAddress), // checksum
                this.executorAddress,
                amount
            );

            txData.from = this.executorAddress;
            txData.nonce = await GLOBAL_ARBITRUM_RPC.getTransactionCount(this.executorAddress);

            const txReceipt = await buildAndSendTx(txData);
            const executionSuccess = txReceipt ? checkTxSuccess(txReceipt) : false;

            if (!executionSuccess) {
                console.error("Failed to deposit to vault.");
                return false;
            }

            return true;

        } catch (error) {
            console.error("ContangoTxExecutor.ts - Error depositing to Vault contract:", error);
            return false;
        }
    }

    async getPriceFromMoneyMarket(symbol: string, moneyMarket: number): Promise<number | null> {
        try {
            if (symbol === "ETH") symbol = "WETHUSDC";
            if (symbol === "BTC") symbol = "WBTCUSDC";

            const positionId = encodePositionId(symbol, moneyMarket, 0, 0);
            const idBytes = ethers.utils.arrayify(positionId);

            const [collateralPrice, quotePrice, commonUnit]: [ethers.BigNumber, ethers.BigNumber, ethers.BigNumber] =
                await this.lens.prices(idBytes);

            const normalizedPrice = collateralPrice.toNumber() / commonUnit.toNumber();

            return normalizedPrice;
        } catch (error) {
            console.error("ContangoTxExecutor.ts - Error fetching prices from money market:", error);
            return null;
        }
    }

    getIdFromTxReceipt(
        txReceipt: providers.TransactionReceipt
    ): string | null {
        try {
            const eventAddress = ethers.utils.getAddress("0xC2462f03920D47fC5B9e2C5F0ba5D2ded058fD78");
    
            for (const log of txReceipt.logs) {
                if (log.address.toLowerCase() === eventAddress.toLowerCase()) {
                    const lastTopic = log.topics[3];
                    const extractedHash = ethers.utils.hexlify(lastTopic);
                    return extractedHash;
                }
            }
    
            console.warn("Event address not found in logs.");
            return null;
    
        } catch (error) {
            console.error("ContangoCaller - Failed to get position ID from tx receipt.", error);
            return null;
        }
    }
}

const txExecutor = new ContangoTxExecutor(
    3,
    process.env.EXECUTOR_ADDRESS!,
    process.env.EXECUTOR_PRIV_KEY!,
    utils.MAESTRO_CONTRACT,
    utils.LENS_CONTRACT,
    utils.VAULT_CONTRACT,
    1
)

const testOrder: OrderObject = {
    symbol: "ETH",
    isLong: true,
    sizeUsd: 10
};

(async () => {
    ContangoMarketDirectory.initialize()
    const tx = await txExecutor.executeTrade(testOrder, 1);
})();