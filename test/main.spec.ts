import { convertEthAddress2Solana, convertSolanaAddress2Eth, getWorkspace } from "../src/main"
import { SolanaTwitter } from "./solana/fixtures/anchor/types/solana_twitter"
import { expect } from "chai";
import { ethers } from "hardhat";
import { clearCache, createCacheKey } from "../src/utils/factoryCache";
import { DevWorkspaceArgs } from "../src/types/DevWorkspaceConfig";
import { PublicKey } from "@solana/web3.js";

describe('.getWorkspace()', () => {
    const idl = require('./solana/fixtures/anchor/idl/solana_twitter.json')
    
    beforeEach(() => {
        clearCache()
    })

    it('should cache the connection', async () => {
        
        const config: DevWorkspaceArgs<SolanaTwitter> = {
            idl,
            inspectURL: "",
            graphqlURL: "",
            contractAddress: "",
            report: {
                maxRetry: 0,
                baseDelay: 0
            },
        }
        const workspace = getWorkspace(config)

        const [signer] = await ethers.getSigners();

        const config2 = { ...config, signer }
        const workspace2 = getWorkspace(config2)

        expect(workspace.connection === workspace2.connection).to.be.true
    })

    it('should get a new connection', async () => {
        const config: DevWorkspaceArgs<SolanaTwitter> = {
            idl,
            inspectURL: "",
            graphqlURL: "",
            contractAddress: "",
            report: {
                maxRetry: 0,
                baseDelay: 0
            }
        }
        const workspace = getWorkspace(config)

        const config2: DevWorkspaceArgs<SolanaTwitter> = {
            idl,
            graphqlURL: "http://diff",
            inspectURL: "",
            contractAddress: "",
            report: {
                maxRetry: 0,
                baseDelay: 0
            }
        }
        const workspace2 = getWorkspace(config2)

        expect(workspace.connection !== workspace2.connection).to.be.true
    })

    it('should create a cache key', () => {
        const config: DevWorkspaceArgs<SolanaTwitter> = {
            idl,
            inspectURL: "http://inspect",
            graphqlURL: "http://graphql",
            contractAddress: "0x",
            report: {
                maxRetry: 0,
                baseDelay: 0
            },
            signer: { signer: 1 } as any
        }
        const key = createCacheKey(config)
        expect(key).not.to.match(/\bsigner\b/)
        expect(key).to.match(/\bidlMetadataAddress\b/)
        expect(key).to.match(/\bDEVemLxXHPz1tbnBbTVXtvNBHupP2RCBw1jTFN8Uz3FD\b/)
    })

    it('should give the same key', () => {
        const config: DevWorkspaceArgs<SolanaTwitter> = {
            idl,
            inspectURL: "http://inspect",
            graphqlURL: "http://graphql",
            contractAddress: "0x",
            report: {
                maxRetry: 0,
                baseDelay: 0
            },
        }

        const config2DiffKeyOrder: DevWorkspaceArgs<SolanaTwitter> = {
            idl,
            graphqlURL: "http://graphql",
            contractAddress: "0x",
            report: {
                maxRetry: 0,
                baseDelay: 0
            },
            inspectURL: "http://inspect",
        }
        const key = createCacheKey(config)
        const key2 = createCacheKey(config2DiffKeyOrder)
        expect(key).to.eq(key2)
    })

    it('should convert an address from eth format to solana format', () => {
        const pubkey = convertEthAddress2Solana('0x84AC028fE98a70064C3235Db2ec300Fe59807287')
        expect(pubkey.toBase58()).to.eq('1111111111112tStw61VBr4vCYFHcTUkzGw4F95V')
    })

    it('should convert from Solana publicKey to ethereum address', () => {
        const pubkey = new PublicKey('1111111111112tStw61VBr4vCYFHcTUkzGw4F95V')
        const ethereumAddress = convertSolanaAddress2Eth(pubkey);
        expect(ethereumAddress).to.eq('0x84ac028fe98a70064c3235db2ec300fe59807287')
    })
})