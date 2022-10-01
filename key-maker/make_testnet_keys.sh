for VARIABLE in {1..10000}
do
	~/stacks.js/node_modules/.bin/stx make_keychain -t > ../mass-testnet-keys/${VARIABLE}
done
