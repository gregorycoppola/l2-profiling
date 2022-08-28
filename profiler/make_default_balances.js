import { readFileSync } from 'fs';

function loadKeys() {
  var buffer = []
  for (var i = 1; i < 1000; i++) {
    const fname = `../mass-keys/${i}`
    const codeBody = readFileSync(fname, { encoding: 'utf-8' });
    const json = JSON.parse(codeBody)
    buffer.push(json.keyInfo)
  }
  return buffer
}

async function main() {

  const keyInfos = loadKeys()

  for (var i = 0; i <= 10; i++) {
    console.log(`
[[ustx_balance]]
address = "${keyInfos[i].address}"
amount = 10000000000000000`)
  }
}

main()