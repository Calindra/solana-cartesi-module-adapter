import { InputFacet } from "@cartesi/rollups"
import { BigNumber, BytesLike, ContractTransaction, Overrides } from "ethers"
import { CartesiConfig } from "../src/types/CartesiConfig"
import sinon from 'sinon';
import { ConnectionAdapter } from "../src/solana/connection.adapter";
import { AdaptedWallet } from "../src/solana/wallet.adapter";
import { ethers } from "hardhat";

type AddInputType = {
    (_input: BytesLike, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    calledOnce: boolean;
};

export interface InputFacetSinon extends InputFacet {
    addInput: AddInputType
}

export class FakeFactory {
    static getConfig(): CartesiConfig {
        return {
            report: { maxRetry: 10, baseDelay: 1 },
            graphqlURL: 'http://localhost:4000/graphql',
            inspectURL: 'http://localhost:5005/inspect'
        }
    }

    static createInputContract() {
        const inputReturn = {
            wait: () => {
                return {
                    events: [
                        {
                            event: 'InputAdded',
                            args: {
                                epochNumber: BigNumber.from(0),
                                inputIndex: BigNumber.from(1),
                            }
                        }
                    ]
                }
            },
            hash: '0xd54120315e60e3ae3a64fc64a3e6e07807e1d522350b725e30428c3b217fb662'
        }
        const addInput = sinon.fake.returns(inputReturn)
        return {
            addInput
        } as unknown as InputFacetSinon
    }

    static createConnection() {
        let config = FakeFactory.getConfig()
        let connection = new ConnectionAdapter(config)
        return connection;
    }

    static async connectWallet(connection: ConnectionAdapter) {
        const inputContract = FakeFactory.createInputContract();
        let wallet = new AdaptedWallet();
        const [signer] = await ethers.getSigners();
        connection.etherSigner = signer;
        connection.wallet = wallet;
        connection.inputContract = inputContract;
        return {
            inputContract
        }
    }
}
