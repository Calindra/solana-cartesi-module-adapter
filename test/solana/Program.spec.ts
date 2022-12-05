import { ethers } from "hardhat"
import Factory from "../../src/solana/Factory"
import { FakeFactory } from "../FakeFactory"
import { SolanaTwitter } from "./fixtures/anchor/types/solana_twitter"
import fs from "fs";
import path from "path";
import { expect } from "chai";

describe('Program', () => {
    let factory: Factory

    beforeEach(() => {
        const config = FakeFactory.getConfig()
        factory = new Factory(config)
    })

    it('should instantiate a Program', async () => {
        const [signer] = await ethers.getSigners();
        const idl = JSON.parse(fs.readFileSync(path.join(__dirname, './fixtures/anchor/idl/solana_twitter.json'), 'utf-8'));
        const { program } = factory.getWorkspace<SolanaTwitter>({ idl, signer });
        expect(program).to.have.property('methods');
        expect(program.methods).to.have.property('sendTweet');
    })
})