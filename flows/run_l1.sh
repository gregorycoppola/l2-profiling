# mac
# sudo node l1_flow.js /Users/greg/bitcoin-22.0/bin/bitcoind

# linux
rm -rf ~/.bitcoin/regtest/
node l1_flow.js /home/greg/bitcoin-22.0/bin/bitcoind | tee /log/l1_flow
