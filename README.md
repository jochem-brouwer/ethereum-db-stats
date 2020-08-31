Usage:

First `npm i`. Then `ts-node cli.ts <database location> <block state root hash>`

For example: `ts-node cli.ts ~/Library/Ethereum/geth/chaindata/ 0x4fe1cda039a517e6edbd88ffbc00889f4d6ef22534c44695eb278bc375546292`

The database location should point to the chaindata of your node which should be a LevelDB database. The state root hash is the state root of a block (this example is block 196610) which will be the root to use to retrieve all data. Note that it should be 0x-prefixed.

When the script is done, it dumps `data.json` which is of type `Result`: 

```
type Result = {
    stateRoot: string                               // state root hash of the results of this dump
    accounts: number                                // total number of accounts,
    eoaAccounts: number                             // total number of EOA accounts (where codeHash / storageHash is the default "empty" value)
    codeHashMap: StringMap                          // map of codehash to number of accounts having this codehash 
    storageHashMap: StringMap                       // map of storageHash to number of accounts having this hash 
    storageHashKeyCount: StringMap                  // map of storageHash to number of keys of this particular storage hash
}
```