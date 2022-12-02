import { AdaptedWallet } from "../../src/solana/wallet.adapter";
import { Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import { ConnectionAdapter } from "../../src/solana/connection.adapter";
import hardhat from "hardhat";
import { FakeFactory as FakeFactory } from "../FakeFactory";
import nock from 'nock';

describe('ConnectionAdapter', () => {
    let connection: ConnectionAdapter
    let config = FakeFactory.getConfig()
    beforeEach(() => {
        nock.disableNetConnect()
        nock('https://api.devnet.solana.com')
            .post('/')
            .reply(200, require('./fixtures/getRecentBlockHash.json'))
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

    it('should instantiate a new ConnectionAdapter', () => {
        connection = new ConnectionAdapter(config);
        expect(connection).to.be.instanceOf(ConnectionAdapter);
    });

    it('should send transaction to Cartesi', async () => {
        const ethers = (hardhat as any).ethers
        const [signer] = await ethers.getSigners();
        connection = new ConnectionAdapter(config);
        let transaction = new Transaction();
        let wallet = new AdaptedWallet();
        let fromKeypair = Keypair.generate();
        let toKeypair = Keypair.generate();
        connection.etherSigner = signer;
        connection.wallet = wallet;
        connection.inputContract = FakeFactory.createInputContract();
        transaction.add(
            SystemProgram.transfer({
                fromPubkey: fromKeypair.publicKey,
                toPubkey: toKeypair.publicKey,
                lamports: LAMPORTS_PER_SOL,
            }),
        );
        const tx = await connection.sendTransaction(transaction, []);

        // mocked in the future we will use a contract from hardhat
        expect(tx).to.eq('0xd54120315e60e3ae3a64fc64a3e6e07807e1d522350b725e30428c3b217fb662');
    });
});