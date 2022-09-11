// const { exec } = require('child_process');

// console.log('start')

// exec('/home/greg/bitcoin-22.0/bin/bitcoind -port=18442 -rpcport=18443', (error, stdout, stderr) => {
//   if (error) {
//     console.error(`error: ${error.message}`);
//   }

//   if (stderr) {
//     console.error(`stderr: ${stderr}`);
//   }

//   console.log(`stdout:\n${stdout}`);
// });

// console.log('end')

const { spawn } = require('child_process');

const child = spawn('bitcoind', ['-port=18442', '-rpcport=18443']);

child.stdout.on('data', data => {
  console.log(`stdout:\n${data}`);
});

child.stderr.on('data', data => {
  console.error(`stderr: ${data}`);
});