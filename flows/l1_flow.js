// const { spawn } = require('child_process');
import {spawn} from 'child_process';
// const axios = require('axios')
import { default as axios } from 'axios';
import { readFileSync } from 'fs';

import {
  info_log,
} from './logger.js';

import {
  AnchorMode,
  makeContractCall,
  makeContractDeploy,
  broadcastTransaction,
  contractPrincipalCV,
  standardPrincipalCV,
  stringAsciiCV,
  uintCV,
} from '@stacks/transactions';
import {
  Observer,
} from './observer.js';
// const fs = require('fs')
const bitcoind_binary = process.argv[2]

// const observer = require('./observer.js')
// import {
//   Observer,
// } from './observer.js';

import {
  default as transactions
} from '@stacks/transactions';

import { default as stacks_network } from '@stacks/network';
// const stacks_network = require('@stacks/network')
// const transactions = require('@stacks/transactions')
async function sleep(reason, ms) {
  const promise = new Promise((resolve) => {
      // info_log(`start to sleep for: ${reason}`)
      setTimeout(resolve, ms);
  });

  await promise
}

const color = {};
color.black ="\x1b[30m";
color.red = "\x1b[31m";
color.green = "\x1b[32m";
color.yellow = "\x1b[33m";
color.blue = "\x1b[34m";
color.magenta = "\x1b[35m";
color.cyan = "\x1b[36m";
color.white = "\x1b[37m";
for (var key in color){
   console.log( color[key] + key);
}

async function publishContract(senderKey, contractName, contractFilename, networkUrl, nonce) {
  const codeBody = readFileSync(contractFilename, { encoding: 'utf-8' });
  const transaction = await transactions.makeContractDeploy({
    codeBody, contractName, senderKey, network: new stacks_network.StacksTestnet({url: networkUrl}),
    anchorMode: transactions.AnchorMode.Any, fee: 50000, nonce
  });
  const network = new stacks_network.StacksTestnet({url: networkUrl});
  const txid = await transactions.broadcastTransaction(
    transaction, network
  )
  console.log({txid})
  return '0x' + txid.txid
}

async function generate_block() {

  console.log('generate_block')
  try {
    const generate_result = await axios.post('http://127.0.0.1:18443/', {
      method: "generatetoaddress",
      params: [1, 'mkHS9ne12qx9pS9VojpwU5xtRd4T7X7ZUt'],  // random BTC address
      id: 'curltest',
      jsonrpc: '2.0',
    },
    {
      auth: {
        username: 'username',
        password: 'password',  
      }
    })
    // console.log({generate_result})

  }
  catch (error) {

    console.log({error, response:error.response, inner_error: error.response.data.error})
  }
}

function spawn_bitcoind() {
  const child = spawn(bitcoind_binary, ['-port=18442', '-rpcport=18443']);

  child.stdout.on('data', data => {
    const trimmed = data.toString().trim()
    console.log(`${trimmed}`);
  });

  child.stderr.on('data', data => {
    const trimmed = data.toString().trim()
    console.log(color.cyan + `${trimmed}`);
  });

  return child
}

function spawn_l1() {
  const child = spawn('/Users/greg/main1/target/release/stacks-node', ['start', '--config=/Users/greg/main1/testnet/stacks-node/conf/mocknet-miner-conf.toml']);

  child.stdout.on('data', data => {
    const trimmed = data.toString().trim()
    console.log(`${trimmed}`);
  });

  child.stderr.on('data', data => {
    const trimmed = data.toString().trim()
    console.log(color.blue + `${trimmed}`);
  });

  return child
}

/// Wait for the stacks height to be positive.
async function waitForStacksHeight(network_url, observer) {
   await waitForStacksHeight_internal(network_url, observer, 1)
}

async function waitForStacksHeight_internal(network_url, observer, min_height) {
  info_log(`waiting for: the L2 to make a first block ${min_height}`)
  const query = `${network_url}/v2/info`
  while (true) {
    const transactions = observer.transactions_seen_fn()
    info_log(`got number of transactions is ${transactions.length}`)
    if (transactions.length >= min_height) {
      info_log(`found a transaction, waking up!`)
      return
    }

    info_log('waiting')
    await sleep('wait to start', 4000)

  }
}

async function waitForTransaction(observer, targetTx, reason) {
  await waitForTransaction_internal(observer, targetTx, reason, true)
}

async function waitForTransaction_quiet(observer, targetTx, reason) {
  await waitForTransaction_internal(observer, targetTx, reason, false)
}

async function waitForTransaction_internal(observer, targetTx, reason, printOutput) {
  if (printOutput) {
    info_log(`wait for transaction ${targetTx} ${reason}`)
  }

  while (true) {
    const transactions = observer.transactions_seen_fn()
    var tx_ids = []
    for (const transaction of transactions) {
      tx_ids.push(transaction.txid)
    }
    for (const transaction of transactions) {
      if (transaction.txid == targetTx) {
        if (printOutput) {
          info_log(`found transaction ${targetTx} ${reason}`)
        }

        if (transaction.status != 'success') {
          if (printOutput) {
            info_log(`transaction unsuccessful ${transaction} ${reason}`)
          }
          exit(1)
        }
        return true
      }
    }
    await sleep(`wait for tx ${targetTx} ${reason}`, 2000)
  }
}

async function hyperchainMintNft(keyInfo, id, nonce, url, userAddr) {
  const network = new stacks_network.StacksTestnet({url});
  const senderKey = keyInfo.privateKey;
  const txOptions = {
      contractAddress: userAddr,
      contractName: 'simple-nft-l2',
      functionName: 'gift-nft',
      functionArgs: [
        standardPrincipalCV(keyInfo.address), // recipient
        uintCV(id), // ID
      ],
      senderKey,
      validateWithAbi: false,
      network,
      anchorMode: AnchorMode.Any,
      fee: 10000,
      nonce
  };

  const transaction = await makeContractCall(txOptions);
  const txid = await broadcastTransaction(
    transaction, network
  )
  return '0x' + txid.txid
}

function loadKeys() {
  const fname = `../key-maker/all-keys.txt`
  const file_contents = readFileSync(fname, { encoding: 'utf-8' });
  const lines = file_contents.split('\n')

  var buffer = []
  for (var i = 1; i < lines.length; i++) {
    try {
      const line = lines[i].trim();
      if (line.length == 0) {
        continue;
      }
      const json = JSON.parse(line)
      buffer.push(json.keyInfo)
  
    } catch (error) {
      info_log(`error in loadKeys: i ${i}, line: "${line}"`)
    }
  }
  return buffer
}

async function main() {
  const keyInfos = loadKeys()
  const num_mints = 10000
  for (var i = 0; i < num_mints; i++) {
    const keyInfo = keyInfos[i]
    if (!keyInfo) {
      info_log(`problem with key ${i}, keyInfo is ${keyInfo}`)
      exit(1)
    }
  }

  const l1_observer = new Observer(60303)
  const l1_server = l1_observer.makeServer()
  
    const L1_URL = "http://localhost:20443"

  await waitForStacksHeight(L1_URL, l1_observer)


  // send the transactions
  const userKey = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601'
  const userAddr = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
  const userPublish0id = await publishContract(userKey, 'trait-standards', '../contracts/trait-standards.clar', L1_URL, 0)
  const userPublish1id = await publishContract(userKey, 'simple-nft', '../contracts/simple-nft.clar', L1_URL, 1)
  
  await waitForTransaction(l1_observer, userPublish0id, 'user0')
  await waitForTransaction(l1_observer, userPublish1id, 'user1')

  var mintIds = []
  info_log('start submitting mints', {num_mints})
  l1_observer.stop_showing_mempool_alerts()
  for (var i = 0; i < num_mints; i++) {
    const keyInfo = keyInfos[i]
    if (!keyInfo) {
      info_log(`problem with key ${i}, keyInfo is ${keyInfo}`)
      exit(1)
    }
    const mintTxid = await hyperchainMintNft(keyInfo, i, 0, L1_URL, userAddr)
    mintIds.push(mintTxid)
  }
}

main()
