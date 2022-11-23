import {
  Observer,
} from './server.js';
import { readFileSync } from 'fs';
import {
  info_log,
} from './logger.js';

import { exit } from 'node:process';
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
import { StacksTestnet } from '@stacks/network';

import { default as axios } from 'axios';
import { finished } from 'stream';
function sleep(reason, ms) {
  return new Promise((resolve) => {
      // info_log(`start to sleep for: ${reason}`)
      setTimeout(resolve, ms);
  });
}

const L1_URL = "http://localhost:20443"
const L2_URL = "http://localhost:30443"

const userKey = '753b7cc01a1a2e86221266a154af739463fce51219d97e4f856cd7200c3bd2a601'
const userAddr = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'

// const PK_MINER = '6e14c883fb38097e0eecdcad9d498c1086d5c038a138f56ad512811512b604df01'
// const ADDR_MINER = 'STTAKDFQ15A90V9S6NK66BZMM4X1EGMV29X73DW7'
const PK_MINER = '6e14c883fb38097e0eecdcad9d498c1086d5c038a138f56ad512811512b604df01'
const ADDR_MINER = 'STTAKDFQ15A90V9S6NK66BZMM4X1EGMV29X73DW7'

async function publishContract(senderKey, contractName, contractFilename, networkUrl, nonce) {
  const codeBody = readFileSync(contractFilename, { encoding: 'utf-8' });
  const transaction = await makeContractDeploy({
    codeBody, contractName, senderKey, network: new StacksTestnet({url: networkUrl}),
    anchorMode: AnchorMode.Any, fee: 50000, nonce
  });
  const network = new StacksTestnet({url: networkUrl});
  const txid = await broadcastTransaction(
    transaction, network
  )
  return '0x' + txid.txid
}

async function registerNft(senderKey, nonce) {
  const network = new StacksTestnet({url: L1_URL});

  const txOptions = {
      contractAddress: ADDR_MINER,
      contractName: 'hc-alpha',
      functionName: 'register-new-nft-contract',
      functionArgs: [contractPrincipalCV(userAddr, 'simple-nft-l1'), stringAsciiCV("hyperchain-deposit-nft-token")],
      senderKey,
      validateWithAbi: false,
      network,
      anchorMode: AnchorMode.Any,
      fee: 50000,
      nonce,
  };

  const transaction = await makeContractCall(txOptions);
  const txid = await broadcastTransaction(
    transaction, network
  )
  return '0x' + txid.txid
}

async function mintNft(nonce) {
  const network = new StacksTestnet({url: L1_URL});
  const senderKey = userKey;
  const addr = userAddr;
  const txOptions = {
      contractAddress: addr,
      contractName: 'simple-nft-l1',
      functionName: 'gift-nft',
      functionArgs: [standardPrincipalCV(addr), uintCV(5)],
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

async function hyperchainMintNft(keyInfo, id, nonce) {
  const network = new StacksTestnet({url: L2_URL});
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
      fee: 10000 + 10 * id,
      nonce
  };

  const transaction = await makeContractCall(txOptions);
  const txid = await broadcastTransaction(
    transaction, network
  )
  return '0x' + txid.txid
}


async function depositNft(nonce) {
  const network = new StacksTestnet({url: L1_URL});
  const senderKey = userKey;
  const addr = userAddr;

  const txOptions = {
      contractAddress: ADDR_MINER,
      contractName: 'hc-alpha',
      functionName: 'deposit-nft-asset',
      functionArgs: [
          uintCV(5), // ID
          standardPrincipalCV(addr), // sender
          contractPrincipalCV(addr, 'simple-nft-l1'), // contract ID of nft contract on L1
          contractPrincipalCV(addr, 'simple-nft-l2'), // contract ID of nft contract on L2
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

async function transferNft(nonce) {
  const network = new StacksTestnet({url: L2_URL});
  const senderKey = userKey;
  const addr = userAddr;
  const alt_addr = process.env.ALT_USER_ADDR;

  const txOptions = {
      contractAddress: addr,
      contractName: 'simple-nft-l2',
      functionName: 'transfer',
      functionArgs: [
          uintCV(5), // ID
          standardPrincipalCV(addr), // sender
          standardPrincipalCV(alt_addr), // recipient
      ],
      senderKey,
      validateWithAbi: false,
      network,
      anchorMode: AnchorMode.Any,
      fee: 10000,
      nonce,
  };

  const transaction = await makeContractCall(txOptions);
  const txid = await broadcastTransaction(
    transaction, network
  )
  return '0x' + txid.txid

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

async function getNextNonce(principal, network_url) {
  const query = `${network_url}/v2/accounts/${principal}`
  const result = await axios.get(query)
  const nonce = result.data.nonce
  return nonce
}

/// Wait for the stacks height to be positive.
async function waitForStacksHeight(network_url) {
  info_log("waiting for: the L2 to make a first block")
  const query = `${network_url}/v2/info`
  while (true) {
    try {

      const result = await axios.get(query)
      const stacks_tip_height = result.data.stacks_tip_height
    
      if (stacks_tip_height > 0) {
        info_log("found: the L2 to make a first block")
        return
      }

    } catch (error) {
      console.log('caught error:', {error})
    }

    await sleep(`wait for stacks height`, 12000)

  }
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
  // const keyInfos = loadKeys()
  // const num_mints = 10000
  // for (var i = 0; i < num_mints; i++) {
  //   const keyInfo = keyInfos[i]
  //   if (!keyInfo) {
  //     info_log(`problem with key ${i}, keyInfo is ${keyInfo}`)
  //     exit(1)
  //   }
  // }

  // const l1_observer = new Observer(60303)
  // const l1_server = l1_observer.makeServer()

  // const l2_observer = new Observer(60304)
  // const l2_server = l2_observer.makeServer()

  // await sleep(`wait to start`, 5000)

  // const minerPublish0id = await publishContract(PK_MINER, 'trait-standards', '../contracts/trait-standards.clar', L1_URL, 0)
  // const minerPublish1id = await publishContract(PK_MINER, 'hc-alpha', '../contracts/hyperchains.clar', L1_URL, 1)

  // console.log({minerPublish0id, minerPublish1id})
  // // await waitForTransaction(l1_observer, minerPublish0id, 'minerPublish0id')
  // // await waitForTransaction(l1_observer, minerPublish1id, 'minerPublish1id')  

  // await sleep(`wait to start`, 5000)

  // const userPublish0id = await publishContract(userKey, 'trait-standards', '../contracts/trait-standards.clar', L1_URL, 0)
  // const userPublish1id = await publishContract(userKey, 'simple-nft-l1', '../contracts/simple-nft.clar', L1_URL, 1)
  // console.log({userPublish0id, userPublish1id})

  // await waitForTransaction(l1_observer, userPublish0id, 'userPublish0id')
  // await waitForTransaction(l1_observer, userPublish1id, 'userPublish1id')

  const miner_register_nonce = await getNextNonce(ADDR_MINER, L1_URL)

  console.log({miner_register_nonce})
  const registerTxid = await registerNft(PK_MINER, miner_register_nonce)
  console.log({registerTxid})
  // await waitForTransaction(l1_observer, registerTxid, 'registerTxid')

  // await waitForStacksHeight(L2_URL)

  // const userPublish2id = await publishContract(userKey, 'trait-standards', '../contracts-l2/trait-standards.clar', L2_URL, 0)
  // const userPublish3id = await publishContract(userKey, 'simple-nft-l2', '../contracts-l2/simple-nft-l2.clar', L2_URL, 1)

  // await waitForTransaction(l2_observer, userPublish2id, 'user2')
  // await waitForTransaction(l2_observer, userPublish3id, 'user3')

  // var mintIds = []
  // info_log('start submitting mints', {num_mints})
  // l2_observer.stop_showing_mempool_alerts()
  // const num_rounds = 10;
  // for (var j = 0; j < num_rounds; j++) {
  //   for (var i = 0; i < num_mints; i++) {
  //     const keyInfo = keyInfos[i]
  //     if (!keyInfo) {
  //       info_log(`problem with key ${i}, keyInfo is ${keyInfo}`)
  //       exit(1)
  //     }
  //     const id = j * num_mints + i
  //     const nonce = j
  //     const mintTxid = await hyperchainMintNft(keyInfo, id, nonce)
  //     mintIds.push(mintTxid)
  //   }
  // }


  // info_log('start collecting mints', {num_mints})
  // while (true) {
  //   const finished_transactions = l2_observer.transactions_id_set()
  //   var transactionsProcessed = 0
  //   var transactionsOutstanding = 0
  //   for (const mintId of mintIds) {
  //     if (finished_transactions.has(mintId)) {
  //       transactionsProcessed += 1
  //     } else {
  //       transactionsOutstanding += 1
  //     }
  //   }
  //   // info_log(`processing update: transactionsProcessed ${transactionsProcessed} transactionsOutstanding ${transactionsOutstanding}`)
  //   await sleep(`endless loop`, 10000)

  //   if (transactionsProcessed == mintIds.length) {
  //     break
  //   }
  // }

  // console.log("Exiting the process.")
  // exit(1)
}

main()