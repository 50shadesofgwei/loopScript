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
exports.ContangoMarketDirectory = exports.Markets = exports.Market = void 0;
var fs = require("fs/promises");
var contangoUtils_js_1 = require("./contangoUtils.js");
var Market = /** @class */ (function () {
    function Market(positionId, moneyMarketId, base, quote, baseDecimals, quoteDecimals) {
        this.positionId = positionId;
        this.id = moneyMarketId;
        this.base = base;
        this.quote = quote;
        this.baseDecimals = baseDecimals;
        this.quoteDecimals = quoteDecimals;
    }
    return Market;
}());
exports.Market = Market;
var Markets = /** @class */ (function () {
    function Markets() {
        this.markets = {}; // internal storage
    }
    Markets.prototype.addMarket = function (name, market) {
        this.markets[name] = market;
    };
    Markets.prototype.getMarket = function (name) {
        return this.markets[name];
    };
    Markets.prototype.getAllMarkets = function () {
        return Object.values(this.markets);
    };
    Markets.prototype.toString = function () {
        return "<MarketCollection " + Object.keys(this.markets).join(", ") + ">";
    };
    return Markets;
}());
exports.Markets = Markets;
var ContangoMarketDirectory = /** @class */ (function () {
    function ContangoMarketDirectory() {
    }
    ContangoMarketDirectory.initialize = function () {
        return __awaiter(this, void 0, Promise, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!!ContangoMarketDirectory.isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, ContangoMarketDirectory.updateAllMarketParameters()];
                    case 1:
                        _a.sent();
                        ContangoMarketDirectory.isInitialized = true;
                        console.info("ContangoMarketDirectory - Markets Initialized");
                        _a.label = 2;
                    case 2: return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error("ContangoMarketDirectory - Failed to initialize market directory.", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContangoMarketDirectory.getPositionId = function (base, quote, moneyMarketId) {
        try {
            base = base === "BTC" ? "WBTC" : base;
            quote = quote === "BTC" ? "WBTC" : quote;
            for (var _i = 0, _a = this.markets.getAllMarkets(); _i < _a.length; _i++) {
                var market = _a[_i];
                if (market.base === base && market.quote === quote && market.id === moneyMarketId) {
                    return market.positionId;
                }
            }
            console.warn("No matching position ID found for " + base + "/" + quote + " with money market ID " + moneyMarketId + ".");
            return null;
        }
        catch (error) {
            console.error("ContangoMarketDirectory - Failed to get position ID.", error);
            return null;
        }
    };
    ContangoMarketDirectory.getAssetsForPositionId = function (positionId) {
        return __awaiter(this, void 0, Promise, function () {
            var normalizedPositionId, _i, _a, market, marketNormalizedId;
            return __generator(this, function (_b) {
                try {
                    normalizedPositionId = positionId.split(/ffffffff/i)[0].toLowerCase();
                    for (_i = 0, _a = this.markets.getAllMarkets(); _i < _a.length; _i++) {
                        market = _a[_i];
                        marketNormalizedId = market.positionId.split(/ffffffff/i)[0].toLowerCase();
                        if (marketNormalizedId === normalizedPositionId) {
                            return [2 /*return*/, [market.base, market.quote]];
                        }
                    }
                    console.warn("ContangoMarketDirectory - No assets found for ID " + normalizedPositionId);
                    return [2 /*return*/, null];
                }
                catch (error) {
                    console.error("ContangoMarketDirectory - Failed to get assets for position ID.", error);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/];
            });
        });
    };
    ContangoMarketDirectory.updateAllMarketParameters = function () {
        return __awaiter(this, void 0, Promise, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, contangoUtils_js_1.generatePositionIds()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.buildMarketsFromPositionIds()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        console.error("ContangoMarketDirectory - Failed to fetch market parameters.", error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContangoMarketDirectory.buildMarketsFromPositionIds = function () {
        return __awaiter(this, void 0, Promise, function () {
            var data, positionIds, _i, _a, _b, marketName, positionId, _c, base, quote, moneyMarket, baseDecimals, quoteDecimals, moneyMarketId, market, error_3;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile("position_ids.json", "utf-8")];
                    case 1:
                        data = _d.sent();
                        positionIds = JSON.parse(data);
                        for (_i = 0, _a = Object.entries(positionIds); _i < _a.length; _i++) {
                            _b = _a[_i], marketName = _b[0], positionId = _b[1];
                            _c = marketName.split("_"), base = _c[0], quote = _c[1], moneyMarket = _c[2];
                            baseDecimals = this.getDecimals(base);
                            quoteDecimals = this.getDecimals(quote);
                            moneyMarketId = contangoUtils_js_1.getMoneyMarketId(moneyMarket);
                            if (base === "USDCE")
                                baseDecimals = this.getDecimals("USDC");
                            if (quote === "USDCE")
                                quoteDecimals = this.getDecimals("USDC");
                            market = new Market(positionId, moneyMarketId, base, quote, baseDecimals, quoteDecimals);
                            this.markets.addMarket(marketName, market);
                        }
                        console.info("Contango markets built successfully.");
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _d.sent();
                        console.error("ContangoMarketDirectory - Failed to build markets from positionID file.", error_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ContangoMarketDirectory.isPositionIdLong = function (positionId) {
        return __awaiter(this, void 0, Promise, function () {
            var assets, base, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getAssetsForPositionId(positionId)];
                    case 1:
                        assets = _a.sent();
                        if (!assets)
                            return [2 /*return*/, null];
                        base = assets[0];
                        return [2 /*return*/, !contangoUtils_js_1.STABLECOINS.includes(base)];
                    case 2:
                        error_4 = _a.sent();
                        console.error("ContangoMarketDirectory - Failed to determine long/short position.", error_4);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ContangoMarketDirectory.getDecimals = function (symbol) {
        var decimalsMap = {
            ETH: 18,
            WBTC: 8,
            USDC: 6,
            USDT: 6,
            DAI: 18,
            LUSD: 18
        };
        return decimalsMap[symbol] || 18;
    };
    ContangoMarketDirectory.markets = new Markets();
    ContangoMarketDirectory.isInitialized = false;
    return ContangoMarketDirectory;
}());
exports.ContangoMarketDirectory = ContangoMarketDirectory;
