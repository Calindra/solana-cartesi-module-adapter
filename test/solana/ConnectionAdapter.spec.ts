import { AdaptedWallet } from "../../src/solana/wallet.adapter";
import { clusterApiUrl, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import { ConnectionAdapter } from "../../src/solana/connection.adapter";
import hardhat from "hardhat";

describe('ConnectionAdapter', () => {
    let connection: ConnectionAdapter
    it('should instantiate a new ConnectionAdapter', () => {
        const network = clusterApiUrl('devnet');
        connection = new ConnectionAdapter(network);
        expect(connection).to.be.instanceOf(ConnectionAdapter);
    });

    it('should send transaction to Cartesi', async () => {
        const ethers = (hardhat as any).ethers
        const [signer] = await ethers.getSigners();
        //const owner = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
        const network = clusterApiUrl('devnet');
        connection = new ConnectionAdapter(network);
        let transaction = new Transaction();
        let wallet = new AdaptedWallet();
        let fromKeypair = Keypair.generate();
        let toKeypair = Keypair.generate();
        connection.etherSigner = signer;
        connection.wallet = wallet;
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toKeypair.publicKey,
                lamports: LAMPORTS_PER_SOL,
            }),
        );
        await connection.sendTransaction(transaction, [fromKeypair]);
    });
});