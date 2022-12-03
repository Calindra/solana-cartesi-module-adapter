import { Provider } from "@ethersproject/providers";
import { ContractReceipt, ethers, Signer } from "ethers";
import {
    InputFacet,
    InputFacet__factory,
    OutputFacet,
    OutputFacet__factory,
    ERC20PortalFacet,
    ERC20PortalFacet__factory,
} from "@cartesi/rollups";
import { InputAddedEvent } from "@cartesi/rollups/dist/src/types/contracts/interfaces/IInput";

import { Config } from "../types/Config";
import { getReports, InputKeys } from "../graphql/reports";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface Args {
    dapp: string;
    address?: string;
    addressFile?: string;
}

interface Contracts {
    inputContract: InputFacet;
    outputContract: OutputFacet;
    erc20Portal: ERC20PortalFacet;
}

const contractAddress = '0xA17BE28F84C89474831261854686a6357B7B9c1E';

/**
 * Connect to instance of Rollups application
 * @param chainId number of chain id of connected network
 * @param provider provider or signer of connected network
 * @param args args for connection logic
 * @returns Connected rollups contracts
 */
export const cartesiRollups = async (
    provider: Provider | Signer
): Promise<Contracts> => {
    console.log(`Connect to contracts address=${contractAddress}`);
    const inputContract = InputFacet__factory.connect(contractAddress, provider);
    const outputContract = OutputFacet__factory.connect(contractAddress, provider);
    const erc20Portal = ERC20PortalFacet__factory.connect(contractAddress, provider);
    return {
        inputContract,
        outputContract,
        erc20Portal,
    };
};

export async function pollingReportResults(receipt: ContractReceipt, config: Config) {
    const MAX_REQUESTS = config.report.maxRetry;
    const inputKeys = getInputKeys(receipt);
    for (let i = 0; i < MAX_REQUESTS; i++) {
        await delay(config.report.baseDelay * (i + 1));
        const reports = await getReports(config.graphqlURL, inputKeys);
        if (reports.length > 0) {
            return reports.map((r: any) => {
                const strJson = ethers.utils.toUtf8String(r.payload);
                return {
                    ...r,
                    json: JSON.parse(strJson)
                };
            })
        }
    }
}

/**
* Retrieve InputKeys from an InputAddedEvent
* @param receipt Blockchain transaction receipt
* @returns input identification keys
*/
export const getInputKeys = (receipt: ContractReceipt): InputKeys => {
    // get InputAddedEvent from transaction receipt
    const event = receipt.events?.find((e) => e.event === "InputAdded");

    if (!event) {
        throw new Error(
            `InputAdded event not found in receipt of transaction ${receipt.transactionHash}`
        );
    }

    const inputAdded = event as InputAddedEvent;
    return {
        epoch_index: inputAdded.args.epochNumber.toNumber(),
        input_index: inputAdded.args.inputIndex.toNumber(),
    };
};

export const toBuffer = (arr: Buffer | Uint8Array | Array<number>): Buffer => {
    if (Buffer.isBuffer(arr)) {
        return arr;
    } else if (arr instanceof Uint8Array) {
        return Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
    } else {
        return Buffer.from(arr);
    }
};