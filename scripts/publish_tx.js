import {
  AnchorMode,
  makeContractDeploy,
  broadcastTransaction,
} from '@stacks/transactions';
import { StacksTestnet, HIRO_MOCKNET_DEFAULT } from '@stacks/network';
import { readFileSync } from 'fs';

async function main() {

  const contractName = process.argv[2];
  const contractFilename = process.argv[3];
  const networkLayer = parseInt(process.argv[4]);
  const nonce = parseInt(process.argv[5]);
  const senderKey = process.env.USER_KEY;
  const networkUrl = networkLayer == 2 ? process.env.HYPERCHAIN_URL : "http://localhost:20443" ;

  const codeBody = readFileSync(contractFilename, { encoding: 'utf-8' });

  // console.log('make contract')
  const transaction = await makeContractDeploy({
    codeBody, contractName, senderKey, network: new StacksTestnet({url: networkUrl}),
    anchorMode: AnchorMode.Any, fee: 10000, nonce
  });

  // console.log(transaction.serialize().toString('hex'));

  // const network = new StacksTestnet({url: "http://localhost:20443"});
  const network = new StacksTestnet({url: networkUrl});

  const txid = await broadcastTransaction(
    transaction, network
)
console.log({txid}) 
  // console.log('deploy')
  // const txid = await broadcastTransaction(
  //     transaction, new StacksTestnet({url: networkUrl})
  // );

  // console.log(txid);
}


main()