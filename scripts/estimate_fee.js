import {
    makeContractCall,
    AnchorMode,
    standardPrincipalCV,
    uintCV,
    PostConditionMode,
    broadcastTransaction,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

import 
    payload
   from '@stacks/transactions';

import axios from 'axios'

async function main() {
    const network = new StacksTestnet({url: process.env.HYPERCHAIN_URL});
    const senderKey = process.env.USER_KEY;
    const addr = process.env.USER_ADDR;
    const alt_addr = process.env.ALT_USER_ADDR;
    const nonce = parseInt(process.argv[2]);

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
        postConditionMode: PostConditionMode.Allow
    };


    // const payload1 = payload.createContractCallPayload(
    //     addr,
    //     'simple-nft-l2',
    //     'transfer',
    //     [
    //         uintCV(5), // ID
    //         standardPrincipalCV(addr), // sender
    //         standardPrincipalCV(alt_addr), // recipient
    //     ],
    //   );

    const transaction = await makeContractCall(txOptions);
    // const transaction_payload = '0x' + transaction.serialize().toString('hex');
    const transaction_payload = payload.serializePayload(transaction.payload).toString('hex')

    // console.log(transaction_payload);


    const tuple = {
        transaction_payload: transaction_payload,
        // estimated_len: transaction_payload.length,
    }

    console.log(tuple)

    const tupleStr = JSON.stringify(tuple);
const customConfig = {
    headers: {
    'Content-Type': 'application/json'
    }
};
    const result = await axios.post('http://localhost:20443/v2/fees/transaction', tupleStr, customConfig)

    console.log({result})
    // const txid = await broadcastTransaction(
    //     transaction, network
    // );

    // console.log(txid);
}

main()