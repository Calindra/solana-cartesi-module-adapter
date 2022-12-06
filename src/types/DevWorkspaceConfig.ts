import { Idl } from "@project-serum/anchor";
import { CartesiConfig } from "./CartesiConfig";
import { WorkspaceArgs } from "./Framework";

export interface DevWorkspaceArgs<T extends Idl> extends CartesiConfig, WorkspaceArgs<T> {

}
