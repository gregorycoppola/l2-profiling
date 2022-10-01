// import { readFileSync } from 'fs';
const fs = require('fs')
const fname = `../key-maker/all-testnet-keys.txt`
const file_contents = fs.readFileSync(fname, { encoding: 'utf-8' });
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
        console.log(`error in loadKeys: i ${i}, line: "${line}"`)
    }
}

for (const keyInfo of buffer) {
    console.log(`
[[ustx_balance]]
address = "${keyInfo.address}"
amount = 10000000000000000
`)
}