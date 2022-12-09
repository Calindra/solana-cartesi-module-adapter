import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import { WalletAdapter } from "../../src/solana/wallet.adapter"


describe('WalletAdapter', () => {
    it('should give an instance of a Wallet', () => {
        const wallet = new WalletAdapter();
        expect(wallet).to.have.property('signTransaction')
    })

    describe('.signTransaction()', () => {
        it('should sign a transaction', async () => {
            const wallet = new WalletAdapter();

            const transaction = new Transaction();
            const fromKeypair = Keypair.generate();
            const toKeypair = Keypair.generate();
            transaction.add(
                SystemProgram.transfer({
                    fromPubkey: fromKeypair.publicKey,
                    toPubkey: toKeypair.publicKey,
                    lamports: LAMPORTS_PER_SOL,
                }),
            );
            transaction.recentBlockhash = 'JAnZtVsDWxSJNmpg4cLgTrrDRMVT48droqtWdEHnY141';
            transaction.feePayer = fromKeypair.publicKey;
            wallet.publicKey = fromKeypair.publicKey;
            const signedTransaction = await wallet.signTransaction(transaction);
            expect(signedTransaction.signatures.length).to.eq(1);
            expect(signedTransaction.signatures[0].publicKey.toBase58()).to.eq(fromKeypair.publicKey.toBase58());
        })
    })
})
