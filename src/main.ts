import { Idl } from "@project-serum/anchor";
import Factory from "./solana/Factory";
import { DevWorkspaceArgs } from "./types/DevWorkspaceConfig";
export { DevWorkspaceArgs } from "./types/DevWorkspaceConfig";
import { cacheFactoryByContractAddress, createCacheKey } from "./utils/factoryCache";
export { convertEthAddress2Solana, convertSolanaAddress2Eth } from "./utils/cartesi";
export { default } from "./solana/Factory";

export function getWorkspace<T extends Idl>(config: DevWorkspaceArgs<T>) {
    const cacheKey = createCacheKey(config)
    let factory = cacheFactoryByContractAddress.get(cacheKey);
    if (!factory) {
        factory = new Factory(config);
        cacheFactoryByContractAddress.set(cacheKey, factory)
    }
    return factory.getWorkspace(config)
}

export async function onWalletConnected<T extends Idl>(config: DevWorkspaceArgs<T>) {
    const cacheKey = createCacheKey(config)
    let factory = cacheFactoryByContractAddress.get(cacheKey);
    if (!factory) {
        factory = new Factory(config);
        cacheFactoryByContractAddress.set(cacheKey, factory)
    }
    if (config.signer) {
        await factory.onWalletConnected(config.signer)
    }
    return factory.getWorkspace(config)
}