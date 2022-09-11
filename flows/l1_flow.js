const { spawn } = require('child_process');
const axios = require('axios')

async function sleep(reason, ms) {
  const promise = new Promise((resolve) => {
      // info_log(`start to sleep for: ${reason}`)
      setTimeout(resolve, ms);
  });

  await promise
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
  const child = spawn('bitcoind', ['-port=18442', '-rpcport=18443']);

  child.stdout.on('data', data => {
    const trimmed = data.toString().trim()
    console.log(`${trimmed}`);
  });

  child.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
  });

  return child
}

function spawn_l1() {
  const child = spawn('/home/greg/main1/target/release/stacks-node',
    [
      'start',
      '--config=/home/greg/main1/testnet/stacks-node/conf/mocknet-miner-conf.toml'
    ]
  );

  child.stdout.on('data', data => {
    const trimmed = data.toString().trim()
    console.log(`${trimmed}`);
  });

  child.stderr.on('data', data => {
    const trimmed = data.toString().trim()
    console.error(`${trimmed}`);
  });

  return child
}

async function main() {
  // const child = spawn_bitcoind()

  // console.log('sleeping 1')
  // await sleep('wait to start', 2500)
  // console.log('sleeping 2')

  // const NUM_BLOCKS = 10
  // for (let i = 0; i < NUM_BLOCKS; i++) { 
  //   console.log("create block", {i})
  //   generate_block()

  //   const sleepTime = 4000
  //   console.log(`sleep for ${sleepTime} ms`)
  //   await sleep('wait to start', sleepTime)
  // }

  const child = spawn_l1()
}

main()