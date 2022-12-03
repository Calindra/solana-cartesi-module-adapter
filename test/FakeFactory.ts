import { InputFacet } from "@cartesi/rollups"
import { BigNumber, BytesLike, ContractTransaction, Overrides } from "ethers"
import { Config } from "../src/types/Config"
import sinon from 'sinon';

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
    static getConfig(): Config {
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
}