var Web3 = require('web3');
var rlp = require('rlp');
var EthereumBlock = require('ethereumjs-block/from-rpc');

helpers = () => {}

helpers.web3ify = (input) => {
  output = {}
  output.value = '0x' + rlp.encode(input.value).toString('hex')
  output.header = '0x' + rlp.encode(input.header).toString('hex')
  output.path = '0x00' + input.path.toString('hex')
  //output.path = (output.path.length%2==0 ? '0x00' : '0x1') + output.path
  output.parentNodes = '0x' + rlp.encode(input.parentNodes).toString('hex')
  output.txRoot = '0x' + input.header[4].toString('hex')
  output.blockHash = '0x' + input.blockHash.toString('hex')
  return output
}

module.exports = helpers;
