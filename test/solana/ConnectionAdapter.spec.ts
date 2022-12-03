import { AdaptedWallet } from "../../src/solana/wallet.adapter";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { expect } from "chai";
import { ConnectionAdapter } from "../../src/solana/connection.adapter";
import hardhat from "hardhat";
import { FakeFactory as FakeFactory } from "../FakeFactory";
import nock from 'nock';

describe('ConnectionAdapter', () => {
    const ethers = hardhat.ethers;

    let connection: ConnectionAdapter
    let config = FakeFactory.getConfig()

    beforeEach(() => {
        nock.disableNetConnect()
        nock('http://localhost:4000')
            .post('/graphql')
            .reply(200, require('../fixtures/graphql/no-report.json'))
        nock('http://localhost:4000')
            .post('/graphql')
            .reply(200, require('../fixtures/graphql/report.json'))
        connection = new ConnectionAdapter(config);
    })

    afterEach(() => {
        nock.cleanAll();
    })

    it('should instantiate a new ConnectionAdapter', () => {
        expect(connection).to.be.instanceOf(ConnectionAdapter);
    });

    describe('.sendTransaction()', () => {
        beforeEach(() => {
            nock('https://api.devnet.solana.com')
                .post('/')
                .reply(200, require('./fixtures/getRecentBlockHash.json'))
        })
        it('should send transaction to Cartesi InputContract', async () => {
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
            const tx = await connection.sendTransaction(transaction, []);

            expect(inputContract.addInput.calledOnce).to.be.true;

            // mocked in the future we will use a contract from hardhat
            expect(tx).to.eq('0xd54120315e60e3ae3a64fc64a3e6e07807e1d522350b725e30428c3b217fb662');
        });
    })

    describe('.getAccountInfo()', () => {
        beforeEach(() => {
            nock('http://localhost:5005')
                .get('/inspect/accountInfo/A5G76zb35NE1nWYZEHFHfNEWXBCiGkqNSY5kL1i1Cfpb')
                .reply(200, require('../fixtures/inspect/accountInfo/account.json'))
        })
        it('should return the AccountInfo given a public key', async () => {
            const publicKey = new PublicKey('A5G76zb35NE1nWYZEHFHfNEWXBCiGkqNSY5kL1i1Cfpb');
            const accountInfo = await connection.getAccountInfo(publicKey);
            expect(accountInfo?.owner.toBase58()).to.eq('DEVemLxXHPz1tbnBbTVXtvNBHupP2RCBw1jTFN8Uz3FD');
        })
    });

    describe('.getProgramAccounts()', () => {
        beforeEach(() => {
            nock('http://localhost:5005')
                .get('/inspect/programAccounts/DEVemLxXHPz1tbnBbTVXtvNBHupP2RCBw1jTFN8Uz3FD')
                .reply(200, require('../fixtures/inspect/programAccounts/accounts.json'))
        })
        it('should return all AccountInfo owned by a program', async () => {
            const programId = new PublicKey('DEVemLxXHPz1tbnBbTVXtvNBHupP2RCBw1jTFN8Uz3FD')
            const accounts = await connection.getProgramAccounts(programId);
            expect(accounts.length).to.eq(4);
        })
    })

    describe('.requestAirdrop()', () => {
        beforeEach(() => {
            nock('https://api.devnet.solana.com')
                .post('/')
                .reply(200, require('./fixtures/getRecentBlockHash.json'))
        })
        it('should call the input contract to transfer the $sol to do the airdrop', async () => {
            const [signer] = await ethers.getSigners();
            let wallet = new AdaptedWallet();
            let toKeypair = Keypair.generate();
            const inputContract = FakeFactory.createInputContract();
            connection.etherSigner = signer;
            connection.wallet = wallet;
            connection.inputContract = inputContract;
            const tx = await connection.requestAirdrop(toKeypair.publicKey, LAMPORTS_PER_SOL);
            expect(inputContract.addInput.calledOnce).to.be.true;

            // mocked in the future we will use a contract from hardhat
            expect(tx).to.eq('0xd54120315e60e3ae3a64fc64a3e6e07807e1d522350b725e30428c3b217fb662');
        })
    })

    describe('.getBalance()', () => {
        beforeEach(() => {
            nock('http://localhost:5005')
                .get('/inspect/accountInfo/A5G76zb35NE1nWYZEHFHfNEWXBCiGkqNSY5kL1i1Cfpb')
                .reply(200, require('../fixtures/inspect/accountInfo/account.json'))
        })

        it('should read the number of lamports that an account holds', async () => {
            const publicKey = new PublicKey('A5G76zb35NE1nWYZEHFHfNEWXBCiGkqNSY5kL1i1Cfpb');
            const accountInfo = await connection.getAccountInfo(publicKey);
            expect(accountInfo?.lamports).to.eq(10467840);
        })
    })
});