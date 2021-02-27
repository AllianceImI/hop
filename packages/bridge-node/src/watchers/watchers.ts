import '../moduleAlias'
import * as config from 'src/config'
import { contracts } from 'src/contracts'
import CommitTransferWatcher from 'src/watchers/CommitTransferWatcher'
import BondTransferRootWatcher from 'src/watchers/BondTransferRootWatcher'
import BondWithdrawalWatcher from 'src/watchers/BondWithdrawalWatcher'
import ChallengeWatcher from 'src/watchers/ChallengeWatcher'
import SettleBondedWithdrawalWatcher from 'src/watchers/SettleBondedWithdrawalWatcher'
import StakeWatcher from 'src/watchers/StakeWatcher'
import arbbots from 'src/arb-bot/bots'
import { l2ArbitrumProvider } from 'src/wallets/l2ArbitrumWallet'
import { l2OptimismProvider } from 'src/wallets/l2OptimismWallet'
import { l2xDaiProvider } from 'src/wallets/l2xDaiWallet'
import l1WalletOld from 'src/wallets/l1WalletOld'
import { store } from 'src/store'
import PubSub from 'src/pubsub/PubSub'
import Logger from 'src/logger'

const providers: any = {
  arbitrum: l2ArbitrumProvider,
  optimism: l2OptimismProvider,
  xdai: l2xDaiProvider
}

const tokens = Object.keys(config.tokens)
const networks = ['arbitrum', 'optimism', 'xdai']
const pubsubLogger = new Logger('[pubsub]', { color: 'magenta' })

const startStakeWatchers = () => {
  const watchers: any[] = []
  for (let token of tokens) {
    for (let network of ['kovan'].concat(networks)) {
      const tokenContracts = contracts[token][network]
      if (!tokenContracts) {
        continue
      }
      let bridgeContract = tokenContracts.l2Bridge
      let tokenContract = tokenContracts.l2CanonicalToken
      if (network === 'kovan') {
        bridgeContract = tokenContracts.l1Bridge
        tokenContract = tokenContracts.l1CanonicalToken
      }
      watchers.push(
        new StakeWatcher({
          label: `${network} ${token}`,
          bridgeContract,
          tokenContract
        })
      )
    }
  }
  watchers.forEach(watcher => watcher.start())
  return watchers
}

function startWatchers (orderNum: number = 0) {
  const watchers: any[] = []
  try {
    const hostname = config.hostname
    const pubsub = new PubSub()
    const topic = '/hop-exchange/bonders'
    pubsub.subscribe(topic, (data: any) => {
      if (!(data && data.hostname)) {
        return
      }

      if (data.hostname === hostname) {
        return
      }

      if (!store.bonders[data.hostname]) {
        if (data.order === orderNum) {
          pubsubLogger.warn(
            `Warning: host "${hostname}" has same order number "${data.order}"`
          )
        }

        pubsubLogger.log(
          `Bonder "${data.hostname}" (order ${data.order}) is online`
        )
      }

      if (store.bonders[data.hostname] && !store.bonders[data.hostname].up) {
        pubsubLogger.log(
          `Bonder "${data.hostname}" (order ${data.order}) is back online`
        )
      }

      store.bonders[data.hostname] = {
        hostname: data.hostname,
        order: data.order,
        timestamp: Date.now(),
        up: true
      }
    })

    setInterval(() => {
      pubsub.publish(topic, {
        hostname,
        order: orderNum
      })

      for (let k in store.bonders) {
        const v = store.bonders[k]
        if (v.up) {
          if (Date.now() - v.timestamp > 10 * 1000) {
            pubsubLogger.log(
              `Bonder "${v.hostname}" (order ${v.order}) appears to be down`
            )
            v.up = false
          }
        }
      }
    }, 3 * 1000)
  } catch (err) {
    pubsubLogger.error(err)
  }

  const order = () => {
    let delta = 0
    for (let k in store.bonders) {
      const v = store.bonders[k]
      if (!v.up && v.order === orderNum - 1) {
        delta = 1
      }
    }

    return Math.max(orderNum - delta, 0)
  }

  for (let network of networks) {
    for (let token of tokens) {
      if (!contracts[token][network]) {
        continue
      }
      const label = `${network} ${token}`
      let l1Bridge = contracts[token].kovan.l1Bridge
      if (
        (token === 'DAI' && network === 'arbitrum') ||
        (token === 'DAI' && network === 'optimism') ||
        (token === 'DAI' && network === 'xdai')
      ) {
        l1Bridge = l1Bridge.connect(l1WalletOld)
      }

      watchers.push(
        new BondTransferRootWatcher({
          order,
          label,
          l1BridgeContract: l1Bridge,
          l2BridgeContract: contracts[token][network].l2Bridge
        })
      )

      watchers.push(
        new BondWithdrawalWatcher({
          order,
          label,
          l1BridgeContract: l1Bridge,
          l2BridgeContract: contracts[token][network].l2Bridge,
          // TODO
          contracts: {
            '42': contracts[token].kovan?.l1Bridge,
            '69': contracts[token].optimism?.l2Bridge,
            '79377087078960': contracts[token].arbitrum?.l2Bridge,
            '77': contracts[token].xdai?.l2Bridge
          },
          l2Provider: providers[network]
        })
      )

      watchers.push(
        new SettleBondedWithdrawalWatcher({
          order,
          label,
          l1BridgeContract: l1Bridge,
          l2BridgeContract: contracts[token][network].l2Bridge
        })
      )

      watchers.push(
        new CommitTransferWatcher({
          order,
          label,
          l2BridgeContract: contracts[token][network].l2Bridge
        })
      )
    }
  }

  watchers.forEach(watcher => watcher.start())
  watchers.push(...startStakeWatchers())

  const stop = () => {
    return watchers.map(watcher => {
      return watcher.stop()
    })
  }

  return { stop, watchers }
}

function startChallengeWatchers () {
  const watchers: any[] = []
  for (let network of networks) {
    for (let token of tokens) {
      watchers.push(
        new ChallengeWatcher({
          label: network,
          l1BridgeContract: contracts[token].kovan.l1Bridge,
          l2BridgeContract: contracts[token][network].l2Bridge,
          l2Provider: providers[network]
        })
      )
    }
  }
  watchers.forEach(watcher => watcher.start())
  return watchers
}

function startCommitTransferWatchers () {
  const watchers: any[] = []
  for (let network of networks) {
    for (let token of tokens) {
      watchers.push(
        new CommitTransferWatcher({
          label: network,
          l2BridgeContract: contracts[token][network].l2Bridge
        })
      )
    }
  }
  watchers.forEach(watcher => watcher.start())
  return watchers
}

export {
  startWatchers,
  startStakeWatchers,
  startChallengeWatchers,
  startCommitTransferWatchers
}