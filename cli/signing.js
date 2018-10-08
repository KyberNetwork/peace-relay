const buffer = require("buffer");
const EthereumTx = require("ethereumjs-tx");
const secp256k1 = require("secp256k1/elliptic");
const keccak256 = require("js-sha3").keccak256;
const request = require("request-promise-native");

async function submitBlock(data, chain) {
  try {
    const nonce = await getNonce(privateToAddress(chain.privateKey),chain.url);
    const stx = signTransaction(
      {
        to: chain.peaceRelayAddress,
        value: 0,
        data: data,
        gasLimit: "0x493e0",
        gasPrice: "0x59682F00",
        nonce: nonce,
        chainId: chain.id
      }, 
      chain.privateKey);
    hash = await submitTx(stx,chain.url);
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
  result = await request.post(chainurl, {json: { jsonrpc: "2.0", method: "eth_getTransactionCount", params: [address, "pending"], id:1 }});
  return result.result;
}

async function submitTx(stx, chainurl){
  result = await request.post(chainurl, {json: { jsonrpc :"2.0", method :"eth_sendRawTransaction", params :[stx],"id":1}})
  return result;
}

module.exports = submitBlock