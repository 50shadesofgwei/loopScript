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
exports.checkTxSuccess = exports.approveUsdcForSpend = exports.buildAndSendTx = void 0;
var ethers_1 = require("ethers");
var fs = require("fs/promises");
var index_js_1 = require("../utils/index.js");
var dotenv_1 = require("dotenv");
dotenv_1["default"].config();
function buildAndSendTx(txData) {
    return __awaiter(this, void 0, Promise, function () {
        var rpc, provider, privateKey, wallet, estimatedGas, feeData, maxFeePerGas, signedTx, txReceipt, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    rpc = process.env.ARBITRUM_RPC_URL;
                    provider = new ethers_1.ethers.providers.JsonRpcProvider(rpc);
                    privateKey = process.env.EXECUTOR_PRIV_KEY;
                    wallet = new ethers_1.ethers.Wallet(privateKey, provider);
                    return [4 /*yield*/, provider.estimateGas(txData)];
                case 1:
                    estimatedGas = _a.sent();
                    txData.gasLimit = estimatedGas;
                    return [4 /*yield*/, provider.getFeeData()];
                case 2:
                    feeData = _a.sent();
                    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
                        throw new Error("Missing fee data from provider");
                    }
                    maxFeePerGas = feeData.maxFeePerGas.mul(105).div(100);
                    txData.maxFeePerGas = maxFeePerGas;
                    txData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
                    return [4 /*yield*/, wallet.sendTransaction(txData)];
                case 3:
                    signedTx = _a.sent();
                    return [4 /*yield*/, signedTx.wait()];
                case 4:
                    txReceipt = _a.sent();
                    return [2 /*return*/, txReceipt];
                case 5:
                    error_1 = _a.sent();
                    console.error("txExecutionUtils.ts - Error while sending transaction:", error_1);
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.buildAndSendTx = buildAndSendTx;
function approveUsdcForSpend(spender, amount) {
    return __awaiter(this, void 0, Promise, function () {
        var privateKey, executorWallet, usdcAddress, usdcAbiJson, usdcAbi, usdcContract, approveTxData, _a, receipt, success, error_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    privateKey = process.env.EXECUTOR_PRIV_KEY;
                    if (typeof privateKey === 'undefined' || privateKey === '') {
                        throw new Error("Missing or undefined private key");
                    }
                    executorWallet = new ethers_1.ethers.Wallet(privateKey, index_js_1.GLOBAL_ARBITRUM_RPC);
                    usdcAddress = index_js_1.TokenAddressesArbitrum.USDC;
                    return [4 /*yield*/, fs.readFile("utils/ABIs/USDCABI.json", "utf-8")];
                case 1:
                    usdcAbiJson = _b.sent();
                    usdcAbi = JSON.parse(usdcAbiJson);
                    usdcContract = new ethers_1.ethers.Contract(usdcAddress, usdcAbi, index_js_1.GLOBAL_ARBITRUM_RPC);
                    return [4 /*yield*/, usdcContract.populateTransaction.approve(spender, amount)];
                case 2:
                    approveTxData = _b.sent();
                    approveTxData.from = executorWallet.address;
                    _a = approveTxData;
                    return [4 /*yield*/, index_js_1.GLOBAL_ARBITRUM_RPC.getTransactionCount(executorWallet.address)];
                case 3:
                    _a.nonce = _b.sent();
                    return [4 /*yield*/, buildAndSendTx(approveTxData)];
                case 4:
                    receipt = _b.sent();
                    success = receipt ? checkTxSuccess(receipt) : false;
                    if (!success)
                        throw new Error("Approval transaction failed");
                    return [2 /*return*/, receipt];
                case 5:
                    error_2 = _b.sent();
                    console.error("txExecutionUtils.ts - Error while approving USDC for spend:", error_2);
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.approveUsdcForSpend = approveUsdcForSpend;
function checkTxSuccess(txReceipt) {
    try {
        return txReceipt.status === 1;
    }
    catch (error) {
        console.error("txExecutionUtils.ts - Error checking for Tx success:", error);
        return null;
    }
}
exports.checkTxSuccess = checkTxSuccess;
