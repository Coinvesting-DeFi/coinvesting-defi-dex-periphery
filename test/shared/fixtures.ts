import { Wallet, Contract } from 'ethers'
import { Web3Provider } from 'ethers/providers'
import { deployContract } from 'ethereum-waffle'

import { expandTo18Decimals } from './utilities'

import CoinvestingDeFiFactory from '@coinvestingdefi/dex-core/build/CoinvestingDeFiFactory.json'
import CoinvestingDeFiRouter from '../../build/CoinvestingDeFiRouter.json'
import ERC20Test from '../../build/ERC20Test.json'
import ICoinvestingDeFiPair from '../../build/ICoinvestingDeFiPair.json'
import RouterEventEmitter from '../../build/RouterEventEmitter.json'
import WETH9 from '../../build/WETH9.json'

const overrides = {
  gasLimit: 9999999
}

interface V2Fixture {
  token0: Contract
  token1: Contract
  WETH: Contract
  WETHPartner: Contract
  factory: Contract
  router01: Contract
  router02: Contract
  routerEventEmitter: Contract
  router: Contract
  pair: Contract
  WETHPair: Contract
}

export async function v2Fixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<V2Fixture> {
  // deploy tokens
  const tokenA = await deployContract(wallet, ERC20Test, [expandTo18Decimals(10000)])
  const tokenB = await deployContract(wallet, ERC20Test, [expandTo18Decimals(10000)])
  const WETH = await deployContract(wallet, WETH9)
  const WETHPartner = await deployContract(wallet, ERC20Test, [expandTo18Decimals(10000)])

  // deploy factory
  const factory = await deployContract(wallet, CoinvestingDeFiFactory, [wallet.address])

  // deploy routers
  const router01 = await deployContract(wallet, CoinvestingDeFiRouter, [factory.address, WETH.address], overrides)
  const router02 = await deployContract(wallet, CoinvestingDeFiRouter, [factory.address, WETH.address], overrides)

  // event emitter for testing
  const routerEventEmitter = await deployContract(wallet, RouterEventEmitter, [])

  // initialize
  await factory.createPair(tokenA.address, tokenB.address)
  const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
  const pair = new Contract(pairAddress, JSON.stringify(ICoinvestingDeFiPair.abi), provider).connect(wallet)

  const token0Address = await pair.token0()
  const token0 = tokenA.address === token0Address ? tokenA : tokenB
  const token1 = tokenA.address === token0Address ? tokenB : tokenA

  await factory.createPair(WETH.address, WETHPartner.address)
  const WETHPairAddress = await factory.getPair(WETH.address, WETHPartner.address)
  const WETHPair = new Contract(WETHPairAddress, JSON.stringify(ICoinvestingDeFiPair.abi), provider).connect(wallet)

  return {
    token0,
    token1,
    WETH,
    WETHPartner,
    factory,
    router01,
    router02,
    router: router02, // the default router, 01 had a minor bug
    routerEventEmitter,
    pair,
    WETHPair
  }
}
