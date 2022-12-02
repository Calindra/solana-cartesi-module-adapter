import { InputFacet } from "@cartesi/rollups"
import { BigNumber } from "ethers"
import { Config } from "../src/types/Config"


export class FakeFactory {
    static getConfig(): Config {
        return {
            graphqlURL: 'http://localhost:4000/graphql'
        }
    }

    static createInputContract() {
        return {
            addInput: () => {
                return {
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
            }
        } as unknown as InputFacet
    }
}