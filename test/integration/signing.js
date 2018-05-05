const buffer = require("buffer");
const EthereumTx = require("ethereumjs-tx");
const secp256k1 = require("secp256k1/elliptic");
const keccak256 = require("js-sha3").keccak256;
const request = require("superagent");
const settings = require("../../cli/settings.json");
var BigNumber = require('bignumber.js');
var EP = require('eth-proof');


var chainUrlMapping = {
  'kovan': "https://kovan.infura.io",
  'ropsten': "https://ropsten.infura.io"
}

var chainIdMapping = {
  'kovan': 42,
  'ropsten': 3
}

async function helper(data, chain, contractAddr, amount) {
  try {
    const nonce = await getNonce(privateToAddress(settings[chain].privateKey), chainUrlMapping[chain]);
    const stx = signTransaction(
      {
        to: contractAddr,
        value: amount,
        data: data,
        gasLimit: "0x493e0",
        gasPrice: "0x3B9ACA00",
        nonce: nonce,
        chainId: chainIdMapping[chain]
      }, 
      settings[chain].privateKey);
    hash = await submitTx(stx, chainUrlMapping[chain]);
    return hash;
  } catch (err) {
    throw err;
  }
}

async function lock(data, amount) {
  try {
    var hash = await helper(data, 'kovan', settings['kovan'].etcLockingAddress, amount);
    return hash;
  } catch(err) {
    throw err;
  }
}

async function unlock(data) {
  try {
    var hash = await helper(data, 'kovan', settings['kovan'].etcLockingAddress, 0);
    return hash;
  } catch(err) {
    throw err;
  }
}

async function burn(data, amount) {
  try {
    var hash = await helper(data, 'ropsten', settings['ropsten'].etcTokenAddress, amount);
    return hash;
  } catch(err) {
    throw err;
  }
}

async function mint(data) {
  try {
    var hash = await helper(data, 'ropsten', settings['ropsten'].etcTokenAddress, 0);
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
  result = await request
  .post(chainurl)
  .send({ jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "pending"], id:1 })
  return result.body.result;
}

async function submitTx(stx, chainurl){
  result = await request
  .post(chainurl)
  .send({ jsonrpc :"2.0", method :"eth_sendRawTransaction", params :[stx],"id":1})
  return result.body.result;
}


async function ethCall(data, chain, contractAddr){
  result = await request
  .post(chainUrlMapping.chain)
  .send({ jsonrpc :"2.0", method :"eth_call", params :[{to: contractAddr, data: data},"latest"],"id":chainIdMapping.chain})
  return result;
}

async function getBlockInfo(blockHash, chain) {
  result = await request
  .post(chainUrlMapping.chain)
  .send({ jsonrpc :"2.0", method :"eth_getBlockByHash", params :[blockHash, true], "id":chainIdMapping.chain})
  return result.body.result;
}

async function getTransactionReceipt(txHash, chain) {
  result = await request
  .post(chainUrlMapping.chain)
  .send({ jsonrpc :"2.0", method :"eth_getTransactionReceipt", params :[txHash], "id":chainIdMapping.chain})

  return result.body.result;
}

// const Ropsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
// const Kovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

// // TODO : Fix this(require undefined, because this is web-page)
// const PeacerelayABI = require('../../build/contracts/PeaceRelay.json').abi;
// const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
// const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;

// var PeaceRelayRopsten = new Ropsten.eth.Contract(PeacerelayABI);
// var PeaceRelayKovan = new Kovan.eth.Contract(PeacerelayABI);
// var ETCToken = new Ropsten.eth.Contract(ETCTokenABI);
// var ETCLocking = new Kovan.eth.Contract(ETCLockingABI);

// PeaceRelayRopsten.options.address = settings['ropsten'].peaceRelayAddress;
// PeaceRelayKovan.options.address = settings['kovan'].peaceRelayAddress;
// ETCToken.options.address = settings['ropsten'].etcTokenAddress;
// ETCLocking.options.address = settings['kovan'].etcLockingAddress;

// module.exports = {ethCall, getBlockInfo, getTransactionReceipt, lock, unlock, mint, burn, PeaceRelayKovan,
//                   PeaceRelayRopsten, ETCToken, ETCLocking, EP};
module.exports = {ethCall, mint};