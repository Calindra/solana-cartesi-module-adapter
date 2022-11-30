import { AnchorProviderAdapter } from '../../src/solana/anchorProvider.adapter';
import { expect } from 'chai';
import Factory from '../../src/solana/Factory';
import { ConnectionAdapter } from '../../src/solana/connection.adapter';

describe('Factory', ()  => {
  let factory: Factory;

  beforeEach(() => {
    factory = new Factory()
  })

  it('should create a connection', () => {
    const connection = factory.getConnection()
    expect(connection).to.not.be.undefined;
    expect(connection).to.be.instanceOf(ConnectionAdapter)
  })

  it('should create a provider', () => {
    const { provider } = factory.getProvider()
    expect(provider).to.not.be.undefined;
    expect(provider).to.be.instanceOf(AnchorProviderAdapter)
  })

  it('should set the signer', () => {
    const { provider } = factory.getProvider()
    const adaptedProvider = provider as AnchorProviderAdapter
    const signer = {} as any
    factory.onWalletConnected(signer);

    expect(adaptedProvider.signer).not.to.be.undefined;
  })
})
