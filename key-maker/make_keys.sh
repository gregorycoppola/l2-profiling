for VARIABLE in {1898..10000}
do
	~/stacks.js/node_modules/.bin/stx make_keychain > ${VARIABLE}
done
