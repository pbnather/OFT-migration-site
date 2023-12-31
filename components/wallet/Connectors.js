import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletLinkConnector } from '@web3-react/walletlink-connector'
import { WalletConnectConnector } from '@web3-react/walletconnect-connector'

export const injected = new InjectedConnector({
    supportedChainIds: [43113, 4002, 11155111],
})

export const walletlink = new WalletLinkConnector({
    supportedChainIds: [43113, 4002, 11155111],
})

export const walletConnect = new WalletConnectConnector({
    supportedChainIds: [1],
    rpc: { 1: "https://rpc.ankr.com/eth" },
    qrcode: true,
    pollingInterval: 8000
})