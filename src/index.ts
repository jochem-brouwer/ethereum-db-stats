import { SecureTrie } from 'merkle-patricia-tree'
import { TrieNode, BranchNode, ExtensionNode, LeafNode } from 'merkle-patricia-tree/dist/trieNode'
const level = require('level')
const rlp = require('rlp')
const fs = require('fs')

const KECCAK_NULL = "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
const KECCAK_EMPTY_TRIE = "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421"

interface StringMap {
    [key: string]: number
}

type Result = {
    stateRoot: string                               // state root hash of the results of this dump
    accounts: number                                // total number of accounts,
    eoaAccounts: number                             // total number of EOA accounts (where codeHash / storageHash is the default "empty" value)
    codeHashMap: StringMap                          // map of codehash to number of accounts having this codehash 
    storageHashMap: StringMap                       // map of storageHash to number of accounts having this hash 
    storageHashKeyCount: StringMap                  // map of storageHash to number of keys of this particular storage hash
}

export default class EthereumStats {

    trie: SecureTrie
    stateRoot: Buffer




    constructor(dbDir: string, stateRoot: string) {
        const db = new level(dbDir)
        this.trie = new SecureTrie(db)
        this.stateRoot = Buffer.from(stateRoot.slice(2), 'hex')
    }

    async start(): Promise<Result> {
        console.log("Dumping stats for state root: 0x" + this.stateRoot.toString('hex'))

        const results:Result = {
            stateRoot: this.stateRoot.toString('hex'),
            accounts: 0,
            eoaAccounts: 0,
            codeHashMap: {},              
            storageHashMap: {},         
            storageHashKeyCount: {}    
        }

        let differentSRoots = 0

        await this.trie._walkTrie(this.stateRoot, function(nodeRef: Buffer, node: TrieNode, key, walkController) {
            if (node instanceof LeafNode) {
                results.accounts++
                const account = rlp.decode(node.value)
                const [nonce, balance, stateRoot, codeHash] = account 

                const storageRootString = stateRoot.toString('hex')
                const codeHashString = codeHash.toString('hex')
                
                if (storageRootString == KECCAK_EMPTY_TRIE && codeHashString == KECCAK_NULL) {
                    results.eoaAccounts++
                }
                results.codeHashMap[codeHashString] = (results.codeHashMap[codeHashString] || 0) + 1

                if (!results.storageHashMap[storageRootString]) {
                    differentSRoots++
                    results.storageHashMap[storageRootString] = 1
                } else {
                    results.storageHashMap[storageRootString]++
                }
            }
            walkController.next()
        })

        let count = 0
        for (let storageRoot in results.storageHashMap) {
            count++
            console.log("storage root progress: " + count + "/" + differentSRoots)
            let root = Buffer.from(storageRoot, 'hex')

            results.storageHashKeyCount[storageRoot] = 0
            await this.trie._walkTrie(root, function(nodeRef: Buffer, node: TrieNode, key, walkController) {
                if (node instanceof LeafNode) {
                    results.storageHashKeyCount[storageRoot]++
                }
                walkController.next()
            })
        }

        return results
    }

}