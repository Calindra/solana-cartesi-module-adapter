import { AnchorProviderAdapter } from '../../src/solana/anchorProvider.adapter';
import { expect } from 'chai';
import Factory from '../../src/solana/Factory';
import { ConnectionAdapter } from '../../src/solana/connection.adapter';
import { FakeFactory } from '../FakeFactory';
import { ethers } from 'hardhat';

describe('Factory', ()  => {
  let factory: Factory;

  beforeEach(() => {
    const config = FakeFactory.getConfig();
    factory = new Factory(config);
  })

  it('should create a connection', () => {
    const connection = factory.getConnection()
    expect(connection).to.not.be.undefined;
    expect(connection).to.be.instanceOf(ConnectionAdapter)
  })

  it('should create a provider', () => {
    const { provider } = factory.getOrCreateWorkspaceWithoutProgram()
    expect(provider).to.not.be.undefined;
    expect(provider).to.be.instanceOf(AnchorProviderAdapter)
  })

  it('should set the signer', async () => {
    const { connection } = factory.getOrCreateWorkspaceWithoutProgram()
    const connectionAdapter = connection as ConnectionAdapter
    const [signer] = await ethers.getSigners()
    await factory.onWalletConnected(signer);
    expect(connectionAdapter.etherSigner).not.to.be.undefined;
  })
})
