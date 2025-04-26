"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.ContangoTxExecutor = void 0;
var ethers_1 = require("ethers");
var dotenv_1 = require("dotenv");
dotenv_1["default"].config();
var utils = require("../utils/index.js");
var index_js_1 = require("./index.js");
var encodePositionId = utils.encodePositionId, mulDiv = utils.mulDiv, TokenAddressesArbitrum = utils.TokenAddressesArbitrum, getTokenAddress = utils.getTokenAddress, MoneyMarkets = utils.MoneyMarkets, ContangoMarketDirectory = utils.ContangoMarketDirectory, getDecimalsForSymbol = utils.getDecimalsForSymbol, typecastTradeParams = utils.typecastTradeParams, typecastExecutionParams = utils.typecastExecutionParams, get0xApiQuote = utils.get0xApiQuote, SPOT_EXECUTOR_ADDRESS = utils.SPOT_EXECUTOR_ADDRESS, GLOBAL_ARBITRUM_RPC = utils.GLOBAL_ARBITRUM_RPC;
var ContangoTxExecutor = /** @class */ (function () {
    function ContangoTxExecutor(leverage, executorAddress, privKey, maestro, lens, vault, fees) {
        this.leverage = leverage;
        this.executorAddress = executorAddress;
        this.privKey = privKey;
        this.maestro = maestro;
        this.lens = lens;
        this.vault = vault;
        this.fees = fees;
    }
    ContangoTxExecutor.prototype.executeTrade = function (order, moneyMarket) {
        if (moneyMarket === void 0) { moneyMarket = 1; }
        return __awaiter(this, void 0, Promise, function () {
            var approveReceipt, approvalSuccess, usdcAddress, assetAddress, usdcDecimals, assetDecimals, price, collateralUsd, collateralAsset, quantity, flashloanAmount, limitPrice, sellToken, buyToken, positionId, cashflowCurrency, quantityDecimals, quoteDetails, zeroExQuote, tradeParams, executionParams, txData, _a, txReceipt, executionSuccess, tradeId, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 8, , 9]);
                        return [4 /*yield*/, index_js_1.approveUsdcForSpend(utils.VAULT_ADDRESS, BigInt(order.sizeUsd * 1e6))];
                    case 1:
                        approveReceipt = _b.sent();
                        approvalSuccess = index_js_1.checkTxSuccess(approveReceipt);
                        if (!approvalSuccess) {
                            console.error("Failed to approve USDC.");
                            return [2 /*return*/, null];
                        }
                        usdcAddress = getTokenAddress('USDC');
                        assetAddress = getTokenAddress(order.symbol);
                        usdcDecimals = getDecimalsForSymbol("USDC");
                        assetDecimals = getDecimalsForSymbol(order.symbol);
                        return [4 /*yield*/, this.depositToVault(usdcAddress, ethers_1.BigNumber.from(order.sizeUsd * 1e6))];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, this.getPriceFromMoneyMarket(order.symbol, MoneyMarkets.AAVE)];
                    case 3:
                        price = _b.sent();
                        collateralUsd = order.sizeUsd * this.fees;
                        collateralAsset = collateralUsd / price;
                        quantity = collateralAsset * this.leverage;
                        flashloanAmount = collateralUsd * this.leverage;
                        limitPrice = price * 0.995;
                        sellToken = usdcAddress;
                        buyToken = assetAddress;
                        positionId = void 0;
                        cashflowCurrency = void 0;
                        quantityDecimals = void 0;
                        if (!order.isLong) {
                            positionId = ContangoMarketDirectory.getPositionId("USDC", order.symbol, moneyMarket);
                            quantity = collateralUsd * this.leverage;
                            flashloanAmount = (collateralAsset * this.leverage) * Math.pow(10, assetDecimals);
                            sellToken = assetAddress;
                            buyToken = usdcAddress;
                            cashflowCurrency = 1;
                            quantityDecimals = usdcDecimals;
                        }
                        else {
                            positionId = ContangoMarketDirectory.getPositionId(order.symbol, "USDC", moneyMarket);
                            flashloanAmount = flashloanAmount * Math.pow(10, usdcDecimals);
                            cashflowCurrency = 2;
                            quantityDecimals = assetDecimals;
                        }
                        quoteDetails = {
                            chainId: 42161,
                            sellToken: sellToken,
                            buyToken: buyToken,
                            sellAmount: flashloanAmount,
                            taker: SPOT_EXECUTOR_ADDRESS
                        };
                        return [4 /*yield*/, get0xApiQuote(quoteDetails)];
                    case 4:
                        zeroExQuote = _b.sent();
                        if (!zeroExQuote) {
                            console.error("0x API quote failed.");
                            return [2 /*return*/, null];
                        }
                        tradeParams = typecastTradeParams({
                            positionId: positionId,
                            quantity: quantity,
                            limitPrice: limitPrice,
                            cashflowCurrency: cashflowCurrency,
                            cashflow: collateralUsd
                        }, quantityDecimals, assetDecimals, usdcDecimals);
                        console.log("TRADE_PARAMS", tradeParams);
                        executionParams = typecastExecutionParams({
                            spender: zeroExQuote.spender,
                            router: zeroExQuote.spender,
                            swapAmount: flashloanAmount,
                            txData: zeroExQuote.txData,
                            flashloanProvider: "0x5e2aDC1F256f990D73a69875E06AF8A8404e3a03"
                        });
                        console.log("EXECUTION_PARAMS", executionParams);
                        return [4 /*yield*/, this.maestro.populateTransaction.trade(tradeParams, executionParams)];
                    case 5:
                        txData = _b.sent();
                        txData.from = this.executorAddress;
                        _a = txData;
                        return [4 /*yield*/, GLOBAL_ARBITRUM_RPC.getTransactionCount(this.executorAddress)];
                    case 6:
                        _a.nonce = _b.sent();
                        return [4 /*yield*/, index_js_1.buildAndSendTx(txData)];
                    case 7:
                        txReceipt = _b.sent();
                        executionSuccess = index_js_1.checkTxSuccess(txReceipt);
                        if (!executionSuccess) {
                            console.error("Failed to execute trade.");
                            return [2 /*return*/, null];
                        }
                        tradeId = this.getIdFromTxReceipt(txReceipt);
                        return [2 /*return*/, tradeId];
                    case 8:
                        error_1 = _b.sent();
                        console.error("ContangoTxExecutor - Failed to execute trade on Contango.", error_1);
                        return [2 /*return*/, null];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    ContangoTxExecutor.prototype.depositToVault = function (tokenAddress, amount) {
        return __awaiter(this, void 0, Promise, function () {
            var txData, _a, txReceipt, executionSuccess, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.vault.populateTransaction.deposit(ethers_1.ethers.utils.getAddress(tokenAddress), // checksum
                            this.executorAddress, amount)];
                    case 1:
                        txData = _b.sent();
                        txData.from = this.executorAddress;
                        _a = txData;
                        return [4 /*yield*/, GLOBAL_ARBITRUM_RPC.getTransactionCount(this.executorAddress)];
                    case 2:
                        _a.nonce = _b.sent();
                        return [4 /*yield*/, index_js_1.buildAndSendTx(txData)];
                    case 3:
                        txReceipt = _b.sent();
                        executionSuccess = txReceipt ? index_js_1.checkTxSuccess(txReceipt) : false;
                        if (!executionSuccess) {
                            console.error("Failed to deposit to vault.");
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/, true];
                    case 4:
                        error_2 = _b.sent();
                        console.error("ContangoTxExecutor.ts - Error depositing to Vault contract:", error_2);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ContangoTxExecutor.prototype.getPriceFromMoneyMarket = function (symbol, moneyMarket) {
        return __awaiter(this, void 0, Promise, function () {
            var positionId, idBytes, _a, collateralPrice, quotePrice, commonUnit, normalizedPrice, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (symbol === "ETH")
                            symbol = "WETHUSDC";
                        if (symbol === "BTC")
                            symbol = "WBTCUSDC";
                        positionId = encodePositionId(symbol, moneyMarket, 0, 0);
                        idBytes = ethers_1.ethers.utils.arrayify(positionId);
                        return [4 /*yield*/, this.lens.prices(idBytes)];
                    case 1:
                        _a = _b.sent(), collateralPrice = _a[0], quotePrice = _a[1], commonUnit = _a[2];
                        normalizedPrice = collateralPrice.toNumber() / commonUnit.toNumber();
                        return [2 /*return*/, normalizedPrice];
                    case 2:
                        error_3 = _b.sent();
                        console.error("ContangoTxExecutor.ts - Error fetching prices from money market:", error_3);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ContangoTxExecutor.prototype.getIdFromTxReceipt = function (txReceipt) {
        try {
            var eventAddress = ethers_1.ethers.utils.getAddress("0xC2462f03920D47fC5B9e2C5F0ba5D2ded058fD78");
            for (var _i = 0, _a = txReceipt.logs; _i < _a.length; _i++) {
                var log = _a[_i];
                if (log.address.toLowerCase() === eventAddress.toLowerCase()) {
                    var lastTopic = log.topics[3];
                    var extractedHash = ethers_1.ethers.utils.hexlify(lastTopic);
                    return extractedHash;
                }
            }
            console.warn("Event address not found in logs.");
            return null;
        }
        catch (error) {
            console.error("ContangoCaller - Failed to get position ID from tx receipt.", error);
            return null;
        }
    };
    return ContangoTxExecutor;
}());
exports.ContangoTxExecutor = ContangoTxExecutor;
