import * as utils from './utils/index.js'
import * as executor from './txExecution/index.js'

const leverageStr = process.env.TRADE_LEVERAGE!
const TRADE_LEVERAGE = Number(leverageStr);

if (isNaN(TRADE_LEVERAGE)) {
  throw new Error("TRADE_LEVERAGE must be a valid number");
}


const txExecutor = new executor.ContangoTxExecutor(
    TRADE_LEVERAGE,
    process.env.EXECUTOR_ADDRESS!,
    process.env.EXECUTOR_PRIV_KEY!,
    utils.MAESTRO_CONTRACT,
    utils.LENS_CONTRACT,
    utils.VAULT_CONTRACT,
    1
)

// Valid symbols are 'ETH' and 'BTC'
// Accepts USDC as collateral
const testOrder: utils.OrderObject = {
    symbol: "ETH",
    isLong: true,
    sizeUsd: 10
};

// MoneyMarket = 1 -> AAVE
(async () => {
    utils.ContangoMarketDirectory.initialize()
    const tx = await txExecutor.executeTrade(testOrder, 1);
})();