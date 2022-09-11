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
  const generate_result = await axios.post('http://localhost:18443/', {
    method: "generate",
    params: [1],
    id: 0,
    jsonrpc: '2.0',
  },
  {
    auth: {
      username: 'username',
      password: 'password',  
    }
  })

  console.log({generate_block})
}

async function main() {

  const child = spawn('bitcoind', ['-port=18442', '-rpcport=18443']);

  child.stdout.on('data', data => {
    console.log(`stdout:\n${data}`);
  });

  child.stderr.on('data', data => {
    console.error(`stderr: ${data}`);
  });

  console.log('sleeping 1')
  await sleep('wait to start', 2000)
  console.log('sleeping 2')

  generate_block()
}

main()