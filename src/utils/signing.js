const buffer = require("buffer");
const EthereumTx = require("ethereumjs-tx");
const secp256k1 = require("secp256k1/elliptic");
const keccak256 = require("js-sha3").keccak256;
const request = require("superagent");
const settings = require("../../cli/settings.json");
import { KOVAN_NETWORK_ID, RINKEBY_NETWORK_ID, ROPSTEN_NETWORK_ID } from '../components/Constants.js';

var chainUrlMapping = {
  'kovan': "https://kovan.infura.io",
  'ropsten': "https://ropsten.infura.io",
  'rinkeby': "https://rinkeby.infura.io"
}

var chainIdMapping = {
  'kovan': parseInt(KOVAN_NETWORK_ID),
  'ropsten':parseInt(ROPSTEN_NETWORK_ID),
  'rinkeby': parseInt(RINKEBY_NETWORK_ID)
}

async function helper(data, chain, contractAddr, amount) {
  try {
    const nonce = await getNonce(privateToAddress(settings[chain].privateKey), settings[chain].url);
    const stx = signTransaction(
      {
        to: contractAddr,
        value: amount,
        data: data,
        gasLimit: "0x7A120",
        gasPrice: "0x3B9ACA00",
        nonce: nonce,
        chainId: chainIdMapping[chain]
      }, 
      settings[chain].privateKey);
    let hash = await submitTx(stx, chainUrlMapping[chain]);
    return hash;
  } catch (err) {
    throw err;
  }
}

async function lock(data, amount) {
  try {
    var hash = await helper(data, 'kovan', settings['kovan'].ethLockingAddress, amount);
    return hash;
  } catch(err) {
    throw err;
  }
}

async function unlock(data) {
  try {
    var hash = await helper(data, 'kovan', settings['kovan'].ethLockingAddress, 0);
    return hash;
  } catch(err) {
    throw err;
  }
}

async function burn(data, amount) {
  try {
    var hash = await helper(data, 'rinkeby', settings['rinkeby'].ethTokenAddress, amount);
    return hash;
  } catch(err) {
    throw err;
  }
}

async function mint(data) {
  try {
    var hash = await helper(data, 'rinkeby', settings['rinkeby'].ethTokenAddress, 0);
    return hash;
  } catch(err) {
    throw err;
  }
}

function signTransaction(args, privateKey) {
  const unsignedTransaction = new EthereumTx(args);
  unsignedTransaction.sign(Buffer.from(privateKey, "hex"));
  const stx = unsignedTransaction.serialize();
  return `0x${stx.toString("hex")}`;
};

function privateToPublic(privateKey) {
  return secp256k1.publicKeyCreate(Buffer.from(privateKey, "hex"), false).slice(1);
};

function publicToAddress(pubKey) {
  let pubKeyBuf = Buffer.from(pubKey, "hex");
  if ((pubKeyBuf.length !== 64)) {
    pubKeyBuf = secp256k1.publicKeyConvert(pubKeyBuf, false).slice(1);
  }
  if (pubKeyBuf.length !== 64) {
    throw new Error("Invalid public key length");
  }
  return keccak256(pubKeyBuf).slice(-40);
};

function privateToAddress(privateKey){
  return `0x${publicToAddress(privateToPublic(privateKey))}`;
}

async function getNonce(address, chainurl){
  let result = await request
  .post(chainurl)
  .send({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "pending"], id:1 })
  return result.body.result;
}

async function submitTx(stx, chainurl){
  let result = await request
  .post(chainurl)
  .send({ jsonrpc :"2.0", method :"eth_sendRawTransaction", params :[stx],"id":1})
  return result.body.result;
}


async function ethCall(data, chain, contractAddr){
  let result = await request
  .post(chainUrlMapping.chain)
  .send({ jsonrpc :"2.0", method :"eth_call", params :[{to: contractAddr, data: data},"latest"],"id":chainIdMapping.chain})
  return result;
}

async function getBlockInfo(blockHash, chain) {
  let result = await request
  .post(chainUrlMapping.chain)
  .send({ jsonrpc :"2.0", method :"eth_getBlockByHash", params :[blockHash, true], "id":chainIdMapping.chain})
  return result.body.result;
}

async function getTransactionReceipt(txHash, chain) {
  let result = await request
  .post(chainUrlMapping.chain)
  .send({ jsonrpc :"2.0", method :"eth_getTransactionReceipt", params :[txHash], "id":chainIdMapping.chain})
  return result.body.result;
}

module.exports = {ethCall, mint, unlock};