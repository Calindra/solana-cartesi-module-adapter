import { Idl } from "@project-serum/anchor";
import Factory from "../main";
import { DevWorkspaceArgs } from "../types/DevWorkspaceConfig";

export const cacheFactoryByContractAddress = new Map<string, Factory>();

export function clearCache() {
    cacheFactoryByContractAddress.clear()
}

const CACHE_IGNORE_PROPERTIES = ['signer', 'idl'];

export function createCacheKey<T extends Idl>(config: DevWorkspaceArgs<T>) {
    const objKey = Object.getOwnPropertyNames(config)
        .filter(propertyName => !CACHE_IGNORE_PROPERTIES.includes(propertyName))
        .sort()
        .reduce((a: any, propertyName) => {
            a[propertyName] = (config as any)[propertyName]
            return a
        }, { idlMetadataAddress: config.idl.metadata.address })
    return JSON.stringify(objKey)
}