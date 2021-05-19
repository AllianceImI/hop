import { ethers, providers, Contract, BigNumber } from 'ethers'
import { formatUnits, parseUnits } from 'ethers/lib/utils'
import ContractBase from './ContractBase'
import queue from 'src/decorators/queue'

export default class Token extends ContractBase {
  tokenContract: Contract
  _decimals: number

  constructor (tokenContract: Contract) {
    super(tokenContract)
    this.tokenContract = tokenContract
  }

  async getBalance (): Promise<BigNumber> {
    const address = await this.tokenContract.signer.getAddress()
    const balance = await this.tokenContract.balanceOf(address)
    return balance
  }

  async decimals () {
    if (!this._decimals) {
      const _decimals = await this.tokenContract.decimals()
      this._decimals = Number(_decimals.toString())
    }
    return this._decimals
  }

  // RPC error if too many requests so need to queue
  @queue
  async getAllowance (spender: string): Promise<BigNumber> {
    const owner = await this.tokenContract.signer.getAddress()
    const allowance = await this.tokenContract.allowance(owner, spender)
    return allowance
  }

  @queue
  async approve (spender: string): Promise<providers.TransactionResponse> {
    return this.tokenContract.approve(
      spender,
      ethers.constants.MaxUint256,
      await this.txOverrides()
    )
  }

  async formatUnits (value: BigNumber) {
    return Number(formatUnits(value.toString(), await this.decimals()))
  }

  async parseUnits (value: string | number) {
    return parseUnits(value.toString(), await this.decimals())
  }
}