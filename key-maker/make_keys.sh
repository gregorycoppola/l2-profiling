for VARIABLE in {37532..100000}
do
	~/stacks.js/node_modules/.bin/stx make_keychain > ../mass-testnet-keys/${VARIABLE}
done
