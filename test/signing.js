const buffer = require("buffer");
const EthereumTx = require("ethereumjs-tx");
const secp256k1 = require("secp256k1/elliptic");
const keccak256 = require("js-sha3").keccak256;
const request = require("superagent");

async function submitBlock(data) {
  try {
    const nonce = await getNonce(privateToAddress("34118fdd165018d7218fc9fc97cfc5566f0708775c0e148322e37782f2533048"),"https://ropsten.infura.io");
    const stx = signTransaction(
      {
        to: "0xf77101E0931aE8437eac52c5656660cFeE8754E4",
        value: 0,
        data: data,
        gasLimit: "0x493e0",
        gasPrice: "0x3B9ACA00",
        nonce: nonce,
        chainId: 3
      }, 
      "34118fdd165018d7218fc9fc97cfc5566f0708775c0e148322e37782f2533048");
    hash = await submitTx(stx,"https://ropsten.infura.io");
    return hash;
  } catch (err) {
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
  return result.body;
}

async function ethCall(data){
  result = await request
  .post("https://ropsten.infura.io")
  .send({ jsonrpc :"2.0", method :"eth_sendRawTransaction", params :[{to: "0xf77101E0931aE8437eac52c5656660cFeE8754E4", data: data},"latest"],"id":1})
  return result.body;
}
module.exports = {submitBlock, ethCall}