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
exports.generatePositionIds = exports.convertContangoIdToBytes = exports.getLensContract = exports.calculateNormalizedBalances = exports.calculateLiquidationPriceFromMetadata = exports.mulDiv = exports.encodePositionId = exports.STABLECOINS = exports.getMoneyMarketId = exports.MoneyMarkets = exports.Instruments = exports.QUOTE_EXPONENT = exports.EXPONENT = void 0;
var ethers_1 = require("ethers");
var fs = require("fs/promises");
exports.EXPONENT = 1000000000000000000n; // 1e18
exports.QUOTE_EXPONENT = 1000000n; // 1e6
var Instruments;
(function (Instruments) {
    Instruments["ETH_USDC"] = "WETHUSDC.n";
    Instruments["ETH_USDCE"] = "WETHUSDC";
    Instruments["ETH_DAI"] = "WETHDAI";
    Instruments["ETH_USDT"] = "WETHUSDT";
    Instruments["ETH_LUSD"] = "WETHLUSD";
    Instruments["WBTC_USDC"] = "WBTCUSDC.n";
    Instruments["WBTC_USDCE"] = "WBTCUSDC";
    Instruments["WBTC_DAI"] = "WBTCDAI";
    Instruments["WBTC_USDT"] = "WBTCUSDT";
    Instruments["USDC_ETH"] = "USDC.nWETH";
    Instruments["USDCE_ETH"] = "USDTWETH";
    Instruments["DAI_ETH"] = "DAIWETH";
    Instruments["USDT_ETH"] = "USDTWETH";
    Instruments["USDC_WBTC"] = "USDC.nWBTC";
    Instruments["USDCE_WBTC"] = "USDCWBTC";
    Instruments["DAI_WBTC"] = "DAIWBTC";
    Instruments["USDT_WBTC"] = "USDTWBTC";
})(Instruments = exports.Instruments || (exports.Instruments = {}));
var MoneyMarkets;
(function (MoneyMarkets) {
    MoneyMarkets[MoneyMarkets["AAVE"] = 1] = "AAVE";
    MoneyMarkets[MoneyMarkets["COMPOUND"] = 2] = "COMPOUND";
    MoneyMarkets[MoneyMarkets["EXACTLY"] = 4] = "EXACTLY";
    MoneyMarkets[MoneyMarkets["AAVEV2"] = 10] = "AAVEV2";
    MoneyMarkets[MoneyMarkets["LODESTAR"] = 12] = "LODESTAR";
    MoneyMarkets[MoneyMarkets["MOONWELL"] = 13] = "MOONWELL";
    MoneyMarkets[MoneyMarkets["SILO"] = 16] = "SILO";
    MoneyMarkets[MoneyMarkets["DOLOMITE"] = 17] = "DOLOMITE";
})(MoneyMarkets = exports.MoneyMarkets || (exports.MoneyMarkets = {}));
function getMoneyMarketId(marketName) {
    var normalized = marketName.toUpperCase();
    // Check if normalized is a key (ignores reverse mappings)
    if (!Object.prototype.hasOwnProperty.call(MoneyMarkets, normalized)) {
        throw new Error("Invalid money market name: " + marketName);
    }
    var value = MoneyMarkets[normalized];
    if (typeof value !== "number") {
        throw new Error("Invalid enum access: " + marketName + " resolved to non-number");
    }
    return value;
}
exports.getMoneyMarketId = getMoneyMarketId;
exports.STABLECOINS = ['USDC', 'USDC.n', 'USDT', 'DAI'];
function encodePositionId(symbol, moneyMarketId, number, flags, expiry) {
    if (expiry === void 0) { expiry = Math.pow(2, 32) - 1; }
    var MAX_UINT48 = BigInt(Math.pow(2, 48) - 1);
    var MAX_UINT32 = BigInt(Math.pow(2, 32) - 1);
    if (BigInt(number) > MAX_UINT48) {
        throw new Error("InvalidUInt48: " + number);
    }
    if (BigInt(expiry) > MAX_UINT32) {
        throw new Error("InvalidUInt32: " + expiry);
    }
    if (expiry === 0) {
        throw new Error("InvalidExpiry");
    }
    // Convert `symbol` to bytes32 (padded/truncated to 32 bytes)
    var encoder = new TextEncoder();
    var symbolBytes = encoder.encode(symbol);
    if (symbolBytes.length > 32) {
        throw new Error("Symbol exceeds 32 bytes");
    }
    var symbolBytes32 = new Uint8Array(32);
    symbolBytes32.set(symbolBytes);
    var symbolInt = BigInt('0x' + Buffer.from(symbolBytes32).toString('hex'));
    // Construct the position_id using bitwise operations
    var positionId = symbolInt |
        (BigInt(moneyMarketId) << BigInt(120)) |
        (BigInt(expiry) << BigInt(88)) |
        (BigInt(flags) << BigInt(80)) |
        BigInt(number);
    var idBytes = Buffer.alloc(32);
    idBytes.writeBigUInt64BE((positionId >> BigInt(192)) & BigInt('0xFFFFFFFFFFFFFFFF'), 0);
    idBytes.writeBigUInt64BE((positionId >> BigInt(128)) & BigInt('0xFFFFFFFFFFFFFFFF'), 8);
    idBytes.writeBigUInt64BE((positionId >> BigInt(64)) & BigInt('0xFFFFFFFFFFFFFFFF'), 16);
    idBytes.writeBigUInt64BE(positionId & BigInt('0xFFFFFFFFFFFFFFFF'), 24);
    return '0x' + idBytes.toString('hex');
}
exports.encodePositionId = encodePositionId;
function mulDiv(a, b, unit) {
    try {
        var numerator = a * b;
        if (numerator !== 0n && unit !== 0n) {
            return numerator / unit;
        }
        return 0n;
    }
    catch (error) {
        console.error("Error calculating mulDiv for values a: " + a + ", b: " + b + ", unit: " + unit + ". Error:", error);
        return 0n;
    }
}
exports.mulDiv = mulDiv;
function calculateLiquidationPriceFromMetadata(prices, normalizedBalances, metadata, isLong) {
    try {
        var liquidationThreshold = metadata.liquidation_threshold;
        var quantity = mulDiv(normalizedBalances.collateral, normalizedBalances.unit, prices.collateral);
        var debtTimesRatio = mulDiv(normalizedBalances.debt, exports.EXPONENT, liquidationThreshold);
        var price = mulDiv(debtTimesRatio, prices.common_unit, prices.debt);
        var liquidationPrice = void 0;
        if (!isLong) {
            liquidationPrice = mulDiv(quantity, metadata.base.decimals, price);
        }
        else {
            liquidationPrice = mulDiv(price, metadata.quote.decimals, quantity);
        }
        return Number(liquidationPrice) / Number(exports.QUOTE_EXPONENT);
    }
    catch (error) {
        console.error("Error calculating liquidation price from metadata:", error);
        return null;
    }
}
exports.calculateLiquidationPriceFromMetadata = calculateLiquidationPriceFromMetadata;
function calculateNormalizedBalances(prices, balances, metadata) {
    try {
        var collateral = mulDiv(balances.collateral, prices.collateral, metadata.base.decimals);
        var debt = mulDiv(balances.debt, prices.debt, metadata.quote.decimals);
        var unit = prices.common_unit;
        return {
            collateral: collateral,
            debt: debt,
            unit: unit
        };
    }
    catch (error) {
        console.error("Error normalizing balances:", error);
        return null;
    }
}
exports.calculateNormalizedBalances = calculateNormalizedBalances;
function getLensContract() {
    return __awaiter(this, void 0, Promise, function () {
        var providerUrl, provider, lensAddress, lensAbiJson, lensAbi, contract, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    providerUrl = process.env.ARBITRUM_RPC_URL;
                    if (!providerUrl)
                        throw new Error("ARBITRUM_RPC_URL not set");
                    provider = new ethers_1.ethers.providers.JsonRpcProvider(providerUrl);
                    lensAddress = "0xe03835Dfae2644F37049c1feF13E8ceD6b1Bb72a";
                    return [4 /*yield*/, fs.readFile("GlobalUtils/ABIs/ContangoLens.json", "utf-8")];
                case 1:
                    lensAbiJson = _a.sent();
                    lensAbi = JSON.parse(lensAbiJson);
                    contract = new ethers_1.ethers.Contract(lensAddress, lensAbi, provider);
                    return [2 /*return*/, contract];
                case 2:
                    error_1 = _a.sent();
                    console.error("Error building lens contract:", error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getLensContract = getLensContract;
function convertContangoIdToBytes(id) {
    try {
        var rawBytes = ethers_1.ethers.utils.arrayify(id); // Converts hex string to bytes (Uint8Array)
        return rawBytes;
    }
    catch (error) {
        console.error("Error encountered while converting Contango ID to bytes:", error);
        return null;
    }
}
exports.convertContangoIdToBytes = convertContangoIdToBytes;
function generatePositionIds(outputFile) {
    if (outputFile === void 0) { outputFile = "position_ids.json"; }
    return __awaiter(this, void 0, Promise, function () {
        var positionIds, _i, _a, instrumentKey, instrumentValue, _b, _c, marketKey, marketValue, number, flags, expiry, positionId, key;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    positionIds = {};
                    for (_i = 0, _a = Object.keys(Instruments); _i < _a.length; _i++) {
                        instrumentKey = _a[_i];
                        instrumentValue = Instruments[instrumentKey];
                        for (_b = 0, _c = Object.keys(MoneyMarkets); _b < _c.length; _b++) {
                            marketKey = _c[_b];
                            if (isNaN(Number(marketKey))) { // Skip reverse mappings
                                marketValue = MoneyMarkets[marketKey];
                                number = 0;
                                flags = 0;
                                expiry = Math.pow(2, 32) - 1;
                                positionId = encodePositionId(instrumentValue, // Symbol
                                marketValue, // Numeric market ID (good!)
                                number, flags, expiry);
                                key = instrumentKey + "_" + marketKey;
                                positionIds[key] = positionId;
                            }
                        }
                    }
                    // Save to file
                    return [4 /*yield*/, fs.writeFile(outputFile, JSON.stringify(positionIds, null, 4))];
                case 1:
                    // Save to file
                    _d.sent();
                    console.log("Position IDs saved to " + outputFile);
                    return [2 /*return*/];
            }
        });
    });
}
exports.generatePositionIds = generatePositionIds;
