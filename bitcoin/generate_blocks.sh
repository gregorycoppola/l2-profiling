# Script to generate a new block every minute
# Put this script at the root of your unpacked folder
#!/bin/bash

echo "Generating a block every minute. Press [CTRL+C] to stop.."

# bitcoin-cli loadwallet wallet2
bitcoin-cli createwallet wallet2
address=`bitcoin-cli getnewaddress`

while :
do
        echo "Generate a new block `date '+%d/%m/%Y %H:%M:%S'`"
        bitcoin-cli generatetoaddress 1 $address
        sleep 6
done
