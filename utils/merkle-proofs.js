const Web3 = require('web3')
const EP  = require('eth-proof')

var eP = new EP(new Web3.providers.HttpProvider("http://localhost:8545"))
Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send

var txHash = '0xb53f752216120e8cbe18783f41c6d960254ad59fac16229d4eaec5f7591319de'

eP.getTransactionProof(txHash).then((result)=>{
  var myTrustedBlockHash = Buffer.from('f82990de9b368d810ce4b858c45717737245aa965771565f8a41df4c75acc171','hex')
  var verified = EP.transaction(result.path, result.value, result.parentNodes, result.header, myTrustedBlockHash)
  console.log(verified) // true
}).catch((e)=>{console.log(e)})