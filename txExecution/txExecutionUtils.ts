import { ethers, providers } from "ethers";
import * as fs from "fs/promises";
import { TokenAddressesArbitrum, GLOBAL_ARBITRUM_RPC } from "../utils/index.js";
import dotenv from 'dotenv';
dotenv.config();
type TransactionReceipt = providers.TransactionReceipt;

export async function buildAndSendTx(
    txData: ethers.PopulatedTransaction
): Promise<ethers.providers.TransactionReceipt | null> {
    try {
        const rpc = process.env.ARBITRUM_RPC_URL as string
        const provider = new ethers.providers.JsonRpcProvider(rpc)
        const privateKey = process.env.EXECUTOR_PRIV_KEY as string
        const wallet = new ethers.Wallet(privateKey, provider);

        const estimatedGas = await provider.estimateGas(txData);
        txData.gasLimit = estimatedGas;

        const feeData = await provider.getFeeData();
        if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
            throw new Error("Missing fee data from provider");
        }

        const maxFeePerGas = feeData.maxFeePerGas.mul(105).div(100);
        txData.maxFeePerGas = maxFeePerGas;
        txData.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

        const signedTx = await wallet.sendTransaction(txData);
        const txReceipt = await signedTx.wait();

        return txReceipt;

    } catch (error) {
        console.error("txExecutionUtils.ts - Error while sending transaction:", error);
        return null;
    }
}

export async function approveUsdcForSpend(
    spender: string,
    amount: bigint,
): Promise<ethers.providers.TransactionReceipt | null> {
    try {
        const privateKey = process.env.EXECUTOR_PRIV_KEY;
        if (typeof privateKey === 'undefined' || privateKey === '') {
            throw new Error("Missing or undefined private key");
        }

        const executorWallet = new ethers.Wallet(privateKey, GLOBAL_ARBITRUM_RPC);
        const usdcAddress = TokenAddressesArbitrum.USDC;
        const usdcAbiJson = await fs.readFile("utils/ABIs/USDCABI.json", "utf-8");
        const usdcAbi = JSON.parse(usdcAbiJson);

        const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, GLOBAL_ARBITRUM_RPC);
        const approveTxData = await usdcContract.populateTransaction.approve(spender, amount);

        approveTxData.from = executorWallet.address;
        approveTxData.nonce = await GLOBAL_ARBITRUM_RPC.getTransactionCount(executorWallet.address);

        const receipt = await buildAndSendTx(approveTxData);

        const success = receipt ? checkTxSuccess(receipt) : false;
        if (!success) throw new Error("Approval transaction failed");

        return receipt;

    } catch (error) {
        console.error("txExecutionUtils.ts - Error while approving USDC for spend:", error);
        return null;
    }
}

export function checkTxSuccess(txReceipt: TransactionReceipt): boolean | null {
    try {
        return txReceipt.status === 1;
    } catch (error) {
        console.error("txExecutionUtils.ts - Error checking for Tx success:", error);
        return null;
    }
}