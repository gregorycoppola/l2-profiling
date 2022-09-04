for VARIABLE in {10001..100000}
do
	~/stacks.js/node_modules/.bin/stx make_keychain > ../mass-keys/${VARIABLE}
done
