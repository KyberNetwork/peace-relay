# Peace Relay
Here are some links you might want to check out first:
1. [BTCRelay](https://github.com/ethereum/btcrelay)
2. [Formal introduction of Peace Relay](https://medium.com/@loiluu/peacerelay-connecting-the-many-ethereum-blockchains-22605c300ad3)

## What is PeaceRelay?
Peace Relay is a system of smart contracts that aim to allow for cross-EVM-chain communication using relay contracts.

These contracts will be able to verifiy merkle-patricia proofs about state, transactions, or receipts within specific blocks.

This, along with the wonderful Ethash verification work done by SmartPool, allows for trustless cross chain transfers of all tokens on any EVM chain. This implementation uses the merkle-patricia proofs implemented by [Zac Mitton](https://github.com/zmitton/eth-proof).

## How It Works
* Important Notes:
  * In order to do cross-chain verification, we need valid block header information stored in PeaceRelay contracts so that other proofs (Eg. transaction proof, account state proof) can be verified based on merkle roots in the block header. In this rudimentary version of Peace Relay, we assume the block header submitted is the correct header from the counter chain. In the future, these headers will be verified based on PoW within and chain re-organization will be taken care of.
  * In the demo, when user in one chain (say ETH) wants to transfer his funds to another chain (say ETC). He will lock his ethers in ETH and gets some tokens on ETC in return. He then can use these tokens for his business on ETC chain. If someone wish to trade ethers between chains, they can use Peace Relay the way others use BTC Relay - by verifying a transaction and its value.
  
* Step by step:

  Let us assume that the user would like to transfer funds from ETH to ETC. We shall use the **Kovan testnet to represent ETH** and **Rinkeby testnet to represent ETC**. In other words, we will be **locking / unlocking ETH in Kovan** and **obtain ETH tokens (minting / burning) in Rinkeby**.
  * `PeaceRelay` contracts deployed on Kovan and Rinkeby (1 each)
  * `ETHLocking` contract deployed on Kovan
  * `ETHToken` contract deployed on Rinkeby
  
  ### ETH to ETH tokens on ETC || Kovan to Rinkeby
  1. Send the desired ETH to be converted to the `ETHLocking` contract on Kovan using the `ETHLocking.lock()` function.
      - Note that there is no way this function will abort(throw) unless it runs out of gas during execution.
  2. Wait for Kovan block which contains the transaction to be relayed to Rinkeby. In the meantime, generate the proof of the transaction off-chain.
  3. Send transaction to execute `ETHToken.mint()` function using the generated proof in the previous step. This will mint ETH tokens.
      - The user can then spend those tokens at will until one day where they wish to convert them back to ethers in ETH / Kovan

  ### ETH tokens on ETC back to ETH || Rinkeby back to Kovan
  1. Send tokens to be burnt using the `ETHToken.burn()` function.
  2. Wait for Rinkeby block containing the transaction to be relayed to Kovan. In the meantime, generate the proof of the transaction off-chain.
      - The proof here contains the transaction and corresponding transaction receipt
  3. Send transaction to execute `ETHLocking.unlock()` function with the proof generated in the previous step to unlock ethers.

# Setup 
## Pre-requisites
There are 2 wallets needed: 1 that does the submitting of block headers, and another that will submit mint / unlock transactions for the smart contracts.

## Contract deployment
The contracts' codes can be found in the ./contracts folder.
1. Deploy a `PeaceRelay` contract on Rinkeby. This contract relays block headers from Kovan. The constructor argument is the desired **Kovan** block number to start relaying from, such as `7422101`.
2. Deploy a `ETHToken` contract on Rinkeby, which takes in the Rinkeby `PeaceRelay` contract address (previous step) as a constructor argument. Eg. `"0xa469a40f1bfa089761b226c084c6eaec6a19bc4f"`
3. Deploy another `PeaceRelay` contract on Kovan. This contract relays block headers from Rinkeby. The constructor argument is the desired **Rinkeby** block number to start relaying from.
4. Deploy a `ETHLocking` contract on Kovan, which has the Rinkeby `ETHToken` (Step 2) and Kovan `PeaceRelay` (Step 3) contract addresses  as its constructor arguments. Eg. `"0xd8f16118cd79042491cde899d4963aae7d35fb7b","0xa469a40f1bfa089761b226c084c6eaec6a19bc4f"`
5. Go back to the deployed `ETHToken` contract on Rinkeby and call the `changeETHLockingAddr()` function using the `ETHLocking` contract address (Step 4) as the input argument.
6. **IMPORTANT:** The relayers' addresses must be authorised in the `PeaceRelay` contracts by calling the `authorise()` function. This need not be done if the creators of the `PeaceRelay` contracts are the relayers themselves.

## Setting up the relayers
We use AWS to do the relaying of block headers. All necessary files can be found in the ./cli folder. Create a linux server (you may run locally as well) and upload those files onto the server.
1. Edit the `settings.json` file. Input the different contract addresses and private keys of the 2 wallets that does the block header submissions and transaction submissions.
2. Run the command `node peacerelay.js --from={srcChain} --to={destChain} --start={blockNum}` where
  * `srcChain` is the chain **from** which the block headers are to be relayed (smallcaps)
  * `destChain` is the chain **to** which the block headers are to be relayed (smallcaps)
  * `blockNum` is the starting block number to be relayed
  * Eg. `node peacerelay.js --from=kovan --to=rinkeby --start=6919465` (Relays Kovan block headers to the Rinkeby PeaceRelay contract,  starting from block 6919465)
  * Eg. `node peacerelay.js --from=rinkeby --to=kovan --start=2136659` (Relays Rinkeby block headers to the Kovan PeaceRelay contract, starting from block 2136659)
  
## Setting up the website
0. It is assumed that the contracts have been deployed and relayers have been set up, and either `npm` or `yarn` has been installed.
1. Run `truffle deploy` to compile contracts. You should now have a `build` folder. The json files will be needed for the front-end website. To be specific, only the ABI of the contracts is needed, so an alternative is to copy the contract codes to [Remix](http://remix.ethereum.org) to obtain the ABI.
2. Ensure that the `settings.json` file has the correct information as mentioned in step 2 of the 'setting up the relayers' section.
3. Run `npm install` or `yarn install` to install dependencies.
4. Run `npm run dev` or `yarn && yarn start`.
5. Website should be available via `localhost:3000`

## Example
1. [PeaceRelay contract](https://rinkeby.etherscan.io/address/0xa469a40f1bfa089761b226c084c6eaec6a19bc4f#code) relaying Kovan blocks to Rinkeby. Note that "imports" will need to have the code concatenated into one file as etherscan does not support "imports" in separate files for verification.
2. [ETHToken contract](https://rinkeby.etherscan.io/address/0xd8f16118cd79042491cde899d4963aae7d35fb7b#code)
3. [PeaceRelay contract](https://kovan.etherscan.io/address/0xa469a40f1bfa089761b226c084c6eaec6a19bc4f#code) relaying Rinkeby blocks to Kovan.
4. [ETHLocking contract](https://kovan.etherscan.io/address/0xd8f16118cd79042491cde899d4963aae7d35fb7b)
