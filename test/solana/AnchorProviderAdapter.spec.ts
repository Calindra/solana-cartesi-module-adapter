import { AnchorProvider } from "@project-serum/anchor";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import nock from "nock";
import { AnchorProviderAdapter } from "../../src/solana/anchorProvider.adapter"
import { ConnectionAdapter } from "../../src/solana/connection.adapter";
import { WalletAdapter } from "../../src/solana/wallet.adapter";
import { FakeFactory } from "../FakeFactory";

describe('AnchorProviderAdapter', () => {
    let connection: ConnectionAdapter
    let wallet: WalletAdapter
    let provider: AnchorProviderAdapter

    beforeEach(() => {
        connection = FakeFactory.createConnection();
        wallet = new WalletAdapter();
        provider = new AnchorProviderAdapter(connection, wallet, {});
    })

    it('should give me an instance of AnchorProvider', () => {
        expect(provider).to.be.instanceOf(AnchorProvider);
    })

    describe('.sendAndConfirm()', () => {
        beforeEach(() => {
            nock.disableNetConnect()
            nock('http://localhost:4000')
                .post('/graphql')
                .reply(200, require('../fixtures/graphql/no-report.json'))
            nock('http://localhost:4000')
                .post('/graphql')
                .reply(200, require('../fixtures/graphql/report.json'))
        })
        
        afterEach(() => {
            nock.cleanAll();
        })

        it('should delegate to Connection', async () => {
            const { inputContract } = await FakeFactory.connectWallet(connection);

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

            await provider.sendAndConfirm(transaction);

            expect(inputContract.addInput.calledOnce).to.be.true;
        })
    })
})