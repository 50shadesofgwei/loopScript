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
exports.getDecimalsForSymbol = exports.getTokenAddress = exports.getTokenName = exports.TokenAddressesArbitrum = exports.getModifyPositionDetails = exports.ModifyPositionOptions = exports.get0xApiQuote = exports.typecastQuoteDetails = exports.typecastTPSLParams = exports.typecastExecutionParams = exports.typecastTradeParams = exports.LENS_CONTRACT = exports.MAESTRO_CONTRACT = exports.VAULT_CONTRACT = exports.GLOBAL_ARBITRUM_RPC = exports.LENS_ADDRESS = exports.VAULT_ADDRESS = exports.SPOT_EXECUTOR_ADDRESS = exports.MAESTRO_ADDRESS = void 0;
var ethers_1 = require("ethers");
var axios_1 = require("axios");
var fs = require("fs/promises");
var dotenv_1 = require("dotenv");
dotenv_1["default"].config();
exports.MAESTRO_ADDRESS = "0xa6a147946FACAc9E0B99824870B36088764f969F";
exports.SPOT_EXECUTOR_ADDRESS = "0x7e4EC0C90E5e8ACe890c2080bd8377ef70991462";
exports.VAULT_ADDRESS = "0x3F37C7d8e61C000085AAc0515775b06A3412F36b";
exports.LENS_ADDRESS = "0xe03835Dfae2644F37049c1feF13E8ceD6b1Bb72a";
var rpc = process.env.ARBITRUM_RPC_URL;
exports.GLOBAL_ARBITRUM_RPC = new ethers_1.ethers.providers.JsonRpcProvider(rpc);
var VAULT_ABI = JSON.parse(await fs.readFile("utils/ABIs/vaultABI.json", "utf-8"));
var MAESTRO_ABI = JSON.parse(await fs.readFile("utils/ABIs/maestroABI.json", "utf-8"));
var LENS_ABI = JSON.parse(await fs.readFile("utils/ABIs/lensABI.json", "utf-8"));
exports.VAULT_CONTRACT = new ethers_1.ethers.Contract(exports.VAULT_ADDRESS, VAULT_ABI, exports.GLOBAL_ARBITRUM_RPC);
exports.MAESTRO_CONTRACT = new ethers_1.ethers.Contract(exports.MAESTRO_ADDRESS, MAESTRO_ABI, exports.GLOBAL_ARBITRUM_RPC);
exports.LENS_CONTRACT = new ethers_1.ethers.Contract(exports.LENS_ADDRESS, LENS_ABI, exports.GLOBAL_ARBITRUM_RPC);
function typecastTradeParams(params, quantityDecimals, limitPriceDecimals, cashflowDecimals) {
    try {
        var positionId = ethers_1.ethers.utils.arrayify(params.positionId);
        var quantity = BigInt(Math.floor(params.quantity * Math.pow(10, (quantityDecimals || 0))));
        var limitPrice = BigInt(Math.floor(params.limitPrice * Math.pow(10, (limitPriceDecimals || 0))));
        var cashflow = BigInt(Math.floor(params.cashflow * Math.pow(10, (cashflowDecimals || 0))));
        var cashflowCurrency = params.cashflowCurrency;
        return [positionId, quantity, limitPrice, cashflowCurrency, cashflow];
    }
    catch (error) {
        console.error("Error in typecasting TradeParams:", error);
        throw error;
    }
}
exports.typecastTradeParams = typecastTradeParams;
function typecastExecutionParams(params) {
    try {
        var spender = ethers_1.ethers.utils.getAddress(params.spender);
        var router = ethers_1.ethers.utils.getAddress(params.router);
        var txData = ethers_1.ethers.utils.arrayify(params.txData); // assumes hex string like 0x...
        var swapAmount = BigInt(Math.floor(params.swapAmount)); // no decimals specified here
        var flashloanProvider = ethers_1.ethers.utils.getAddress(params.flashloanProvider);
        return [spender, router, swapAmount, txData, flashloanProvider];
    }
    catch (error) {
        console.error("Error in typecasting ExecutionParams:", error);
        throw error;
    }
}
exports.typecastExecutionParams = typecastExecutionParams;
function typecastTPSLParams(params, limitDecimals) {
    try {
        var positionId = ethers_1.ethers.utils.hexZeroPad(params.positionId, 32); // ensure bytes32
        var limitPrice = BigInt(Math.floor(params.limitPrice * Math.pow(10, limitDecimals)));
        var tolerance = BigInt(Math.floor(params.tolerance * Math.pow(10, 4)) // tolerance always scaled by 10^4
        );
        var cashflowCurrency = 2; // Quote (constant)
        var deadline = BigInt(Math.pow(2, 32) - 1); // uint32 max
        var orderType = params.orderType;
        return [positionId, limitPrice, tolerance, cashflowCurrency, deadline, orderType];
    }
    catch (error) {
        console.error("Error in typecasting TPSLParams:", error);
        throw error;
    }
}
exports.typecastTPSLParams = typecastTPSLParams;
function typecastQuoteDetails(params) {
    try {
        var sellToken = ethers_1.ethers.utils.getAddress(params.sellToken);
        var buyToken = ethers_1.ethers.utils.getAddress(params.buyToken);
        var taker = ethers_1.ethers.utils.getAddress(params.taker);
        var sellAmount = BigInt(params.sellAmount);
        return {
            chainId: params.chainId,
            sellToken: sellToken,
            buyToken: buyToken,
            sellAmount: sellAmount,
            taker: taker
        };
    }
    catch (error) {
        console.error("Error in typecasting QuoteDetails:", error);
        throw error;
    }
}
exports.typecastQuoteDetails = typecastQuoteDetails;
function get0xApiQuote(quoteDetails) {
    var _a, _b;
    return __awaiter(this, void 0, Promise, function () {
        var apiKey, params, headers, response, data, spender, txData, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    apiKey = process.env.ZERO_EX_API_KEY;
                    if (!apiKey)
                        throw new Error("0x API key not set in environment variables");
                    params = {
                        chainId: quoteDetails.chainId,
                        sellToken: quoteDetails.sellToken,
                        buyToken: quoteDetails.buyToken,
                        sellAmount: quoteDetails.sellAmount,
                        taker: quoteDetails.taker
                    };
                    headers = {
                        "0x-api-key": apiKey,
                        "0x-version": "v2"
                    };
                    return [4 /*yield*/, axios_1["default"].get("https://api.0x.org/swap/allowance-holder/quote", { params: params, headers: headers })];
                case 1:
                    response = _c.sent();
                    data = response.data;
                    spender = ((_a = data === null || data === void 0 ? void 0 : data.transaction) === null || _a === void 0 ? void 0 : _a.to) || null;
                    txData = ((_b = data === null || data === void 0 ? void 0 : data.transaction) === null || _b === void 0 ? void 0 : _b.data) || null;
                    return [2 /*return*/, {
                            spender: spender,
                            swapAmount: quoteDetails.sellAmount,
                            txData: txData
                        }];
                case 2:
                    error_1 = _c.sent();
                    console.error("Failed to fetch 0x API quote:", error_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.get0xApiQuote = get0xApiQuote;
var ModifyPositionOptions;
(function (ModifyPositionOptions) {
    ModifyPositionOptions[ModifyPositionOptions["INCREASE_LONG"] = 1] = "INCREASE_LONG";
    ModifyPositionOptions[ModifyPositionOptions["DECREASE_SHORT"] = 2] = "DECREASE_SHORT";
    ModifyPositionOptions[ModifyPositionOptions["DECREASE_LONG"] = 3] = "DECREASE_LONG";
    ModifyPositionOptions[ModifyPositionOptions["INCREASE_SHORT"] = 4] = "INCREASE_SHORT";
})(ModifyPositionOptions = exports.ModifyPositionOptions || (exports.ModifyPositionOptions = {}));
function getModifyPositionDetails(order, positionId, isPositionIdLong // dependency
) {
    return __awaiter(this, void 0, Promise, function () {
        var isLong, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, isPositionIdLong(positionId)];
                case 1:
                    isLong = _a.sent();
                    if (order.isLong && isLong)
                        return [2 /*return*/, ModifyPositionOptions.INCREASE_LONG];
                    if (order.isLong && !isLong)
                        return [2 /*return*/, ModifyPositionOptions.DECREASE_SHORT];
                    if (!order.isLong && isLong)
                        return [2 /*return*/, ModifyPositionOptions.DECREASE_LONG];
                    if (!order.isLong && !isLong)
                        return [2 /*return*/, ModifyPositionOptions.INCREASE_SHORT];
                    return [2 /*return*/, null]; // fallback (shouldn't reach)
                case 2:
                    error_2 = _a.sent();
                    console.error("Failed to identify modify position case:", error_2);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.getModifyPositionDetails = getModifyPositionDetails;
var TokenAddressesArbitrum;
(function (TokenAddressesArbitrum) {
    TokenAddressesArbitrum["USDC"] = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";
    TokenAddressesArbitrum["USDC_BRIDGED"] = "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8";
    TokenAddressesArbitrum["ETH"] = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
    TokenAddressesArbitrum["WBTC"] = "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f";
})(TokenAddressesArbitrum = exports.TokenAddressesArbitrum || (exports.TokenAddressesArbitrum = {}));
function getTokenName(address) {
    try {
        var lowerAddress = address.toLowerCase();
        for (var _i = 0, _a = Object.entries(TokenAddressesArbitrum); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (value.toLowerCase() === lowerAddress) {
                return key;
            }
        }
        return null; // Not found
    }
    catch (error) {
        console.error("Invalid token address:", error);
        return null;
    }
}
exports.getTokenName = getTokenName;
function getTokenAddress(name) {
    try {
        var normalized = name.toUpperCase() === 'BTC' ? 'WBTC' : name.toUpperCase();
        var address = TokenAddressesArbitrum[normalized];
        return address || null;
    }
    catch (error) {
        console.error("Invalid token name:", error);
        return null;
    }
}
exports.getTokenAddress = getTokenAddress;
var DECIMALS = {
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
    SATS: 18,
    POL: 18,
    APE: 18,
    SUI: 9,
    SEI: 18,
    APT: 8,
    TIA: 9,
    TRX: 8,
    TON: 9,
    TAO: 9,
    BONK: 18,
    WLD: 18,
    BOME: 18,
    MEME: 18,
    FLOKI: 18 // Unconfirmed
};
function getDecimalsForSymbol(symbol) {
    var _a;
    return (_a = DECIMALS[symbol]) !== null && _a !== void 0 ? _a : null;
}
exports.getDecimalsForSymbol = getDecimalsForSymbol;
