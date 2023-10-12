
import { useWeb3React } from "@web3-react/core"
import { injected, walletConnect } from "../components/wallet/Connectors"
import Contract from "web3-eth-contract"
import { useState, useEffect } from "react"
import { ethers } from "ethers";
import migrationAbi from "../contracts/migration.json"
import oftAbi from "../contracts/oft.json"
import { oldTokenAddresses, mockAddresses, oftTestnetAddresses, oftAddresses, migrationAddresses, bridges, migrationAddressesExpired } from "./addresses";
const lzChainIds = require("./chainIds.json");

const TESTNET = true;
const EXPIRED = false;

export default function Home() {
  const { active, account, library, activate, deactivate } = useWeb3React()
  const [oldTokenBalance, setOldTokenBalance] = useState(0)
  const [newTokenBalance, setNewTokenBalance] = useState(0)
  const [inputMigrate, setInputMigrate] = useState()
  const [inputBridge, setInputBridge] = useState();
  const [chainId, setChainId] = useState("43113");

  useEffect(() => {
    console.log(active);
    if (active) updateTokenState();
  }, [active]);

  async function connect() {
    try {
      await activate(injected);
    } catch (ex) {
      console.log(ex)
    }
  }

  async function disconnect() {
    try {
      deactivate()
      setUwURewards([])
      setInputBridge(0)
      setInputMigrate(0)
    } catch (ex) {
      console.log(ex)
    }
  }

  async function connectWalletConnect() {
    try {
      await activate(walletConnect);
    } catch (ex) {
      console.log(ex)
    }
  }

  async function updateTokenState() {
    let chainId = (await library._provider.networkVersion).toString();
    let oldTokens = TESTNET ? mockAddresses : oldTokenAddresses;
    let newTokens = TESTNET ? oftTestnetAddresses : oftAddresses;
    console.log(oldTokens)
    console.log(chainId)
    console.log(oldTokens.get(chainId))
    console.log(newTokens.get(chainId))
    const oldTokenContract = new Contract(oftAbi, oldTokens.get(chainId), {
      from: account, // default from address
      gasPrice: '0'
    });
    oldTokenContract.setProvider(library);
    const newTokenContract = new Contract(oftAbi, newTokens.get(chainId), {
      from: account, // default from address
      gasPrice: '0'
    });
    newTokenContract.setProvider(library);

    const oldBalance = await oldTokenContract.methods.balanceOf(account).call();
    const newBalance = await newTokenContract.methods.balanceOf(account).call();
    console.log(oldBalance);
    console.log(newBalance);
    setOldTokenBalance(oldBalance);
    setNewTokenBalance(newBalance);
    setChainId(chainId);
  }

  async function bridgeToken(chainName) {
    const contract = new Contract(oftAbi, oftTestnetAddresses.get(chainId), {
      from: account, // default from address
    });
    contract.setProvider(library);

    const accountAddressBytes32 = ethers.utils.solidityPack(
      ['address'],
      [account],
    );
    let amount = ethers.utils.parseEther(inputBridge);

    const remoteChainId = lzChainIds[chainName];

    let estimatedFee = await contract.methods.estimateSendFee(remoteChainId, accountAddressBytes32, amount, false, '0x').call();
    const nativeFee = estimatedFee[0];

    console.log(`Sending 1 token to ${remoteChainId} from ${chainId}`);
    await contract.methods.sendFrom(account, remoteChainId, accountAddressBytes32, amount, account, ethers.constants.AddressZero, '0x').send({ from: account, value: nativeFee });
    await updateTokenState();
  }

  async function migrateToken() {
    const contract = new Contract(migrationAbi, EXPIRED ? migrationAddressesExpired.get(chainId) : migrationAddresses.get(chainId), {
      from: account, // default from address
    });
    contract.setProvider(library);

    let amount = ethers.utils.parseEther(inputMigrate);
    await contract.methods.migrate(amount).send({ from: account })
    await updateTokenState();
  }

  async function approveToken() {
    const contract = new Contract(oftAbi, mockAddresses.get(chainId), {
      from: account, // default from address
    });
    contract.setProvider(library);

    let amount = ethers.utils.parseEther(inputMigrate);
    await contract.methods.approve(EXPIRED ? migrationAddressesExpired.get(chainId) : migrationAddresses.get(chainId), amount).send({ from: account })
    await updateTokenState();
  }

  function formatEthereumAddress(address) {
    if (typeof address !== 'string' || !address.match(/^0x[0-9a-fA-F]+$/)) {
      throw new Error('Invalid Ethereum address format');
    }

    const prefix = '0x';
    const firstChars = address.slice(2, 6); // Get characters from index 2 to 5
    const lastChars = address.slice(-4); // Get the last 4 characters

    return prefix + firstChars + '...' + lastChars;
  }

  return (
    <div className="p-10 bg-purple-200 flex flex-col h-screen">
      <header className="bg-purple-200">
        <div class="mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div class="sm:flex sm:items-center sm:justify-between">
            <div class="text-center sm:text-left">
              <h1 class="text-2xl font-bold text-gray-900 sm:text-3xl">
                OFT testing site
              </h1>

              <p class="mt-1.5 text-sm text-gray-500">
                This UI allows you to migrate and bridge test tokens on sepolia, fuji and fantom testnet.
              </p>
            </div>

            {!active ? (
              <div class="mt-4 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:items-center">
                <button
                  class="inline-flex items-center justify-center gap-1.5 block rounded-lg bg-orange-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-700 focus:outline-none focus:ring"
                  type="button"
                  onClick={connect}
                >
                  <span class="text-sm font-medium"> MetaMask </span>
                </button>

                {/* <button
                  class="block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 focus:outline-none focus:ring"
                  type="button"
                  onClick={connectWalletConnect}
                >
                  WalletConnect
                </button> */}
              </div>
            ) : (
              <div class="mt-4 flex flex-col gap-4 sm:mt-0 sm:flex-row sm:items-center">
                <span className="flex flex-col items-left">Connected with <b>{formatEthereumAddress(account)}</b></span>
                <button
                  class="block rounded-lg bg-red-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-red-700 focus:outline-none focus:ring"
                  type="button"
                  onClick={disconnect}
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8 bg-purple-200">
        {active && (
          <div class="h-32 inline rounded-lg bg-white flex flex-col place-content-center">
            <p>OLD TOKEN: {Number(ethers.utils.formatEther(oldTokenBalance)).toFixed(2)}</p>
            <input type="number" placeholder="input here" value={inputMigrate} onChange={(e) => setInputMigrate(e.target.value)} />
            <button className={`ml-10 inline bg-orange-400 rounded sm:items-center text-center sm:justify-between`} onClick={approveToken}>Approve</button>
            <button className={`ml-10 inline bg-cyan-400 rounded sm:items-center text-center sm:justify-between`} onClick={migrateToken}>migrate</button>
            <p>NEW TOKEN: {Number(ethers.utils.formatEther(newTokenBalance)).toFixed(2)}</p>
          </div>
        )}
        <div class="h-32 inline rounded-lg bg-white flex flex-col place-content-center">
          {active && (
            <div class="mx-auto">
              <input type="number" placeholder="input here" value={inputBridge} onChange={(e) => setInputBridge(e.target.value)} />
              <button className={`ml-10 inline py-2 px-4 ${inputBridge === 0 ? 'bg-cyan-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-white'} rounded sm:items-center text-center sm:justify-between`} onClick={() => bridgeToken(bridges.get(chainId)[0])} disabled={inputBridge === 0}>
                Bridge {bridges.get(chainId)[0]}
              </button>
              <button className={`ml-10 inline py-2 px-4 ${inputBridge === 0 ? 'bg-cyan-400 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-white'} rounded sm:items-center text-center sm:justify-between`} onClick={() => bridgeToken(bridges.get(chainId)[1])} disabled={inputBridge === 0}>
                Bridge {bridges.get(chainId)[1]}
              </button>
            </div>
          )}
        </div>
      </div>
      <footer class="flex absolute bottom-0 bg-purple-200">
        <div
          class="mt-8 grid grid-cols-2 gap-8 lg:mt-0 lg:grid-cols-5 lg:gap-y-16"
        >
          <div class="col-span-2">
            <div>
              <p><a className="text-green-500 hover:underline" href="https://github.com/pbnather">Github ↗</a>, copyright by <a className="text-green-500 hover:underline" href="https://twitter.com/pbnather">@pbnather</a> 2023</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}