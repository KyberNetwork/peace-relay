const Web3 = require('web3');
const rlp = require('rlp');
const EthereumBlock = require('ethereumjs-block/from-rpc')
const PeacerelayABI = require('../build/contracts/PeaceRelay.json').abi
const sign = require('./signing');

const GasPrice = 10**(-9);
const USD = 800;
const Ropsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const Kovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

describe("Peacerelay", function(accounts) {

	// it("Should be able to submit a block", async function() {
  //   block = await From.eth.getBlock(0);
  //   console.log(block.hash, '0x' + rlp.encode(getRawHeader(block)).toString('hex'));
  //   var relay = await Peacerelay.deployed();
  //   var hash = block.hash;
  //   var header = '0x' + rlp.encode(getRawHeader(block)).toString('hex');
	// 	await relay.blockSubmit(hash, header, {from: accounts[0]})
  // });
  
  it("Should be able to submit a block", async function() {
    this.timeout(30000);

    block = await Kovan.eth.getBlock(5233557)
    var Peacerelay = new Ropsten.eth.Contract(PeacerelayABI)
    var PeacerelayRopsten = "0xf77101E0931aE8437eac52c5656660cFeE8754E4";
    Peacerelay.options.address = PeacerelayRopsten;

    data = await Peacerelay.methods.submitBlock(block.hash, '0x' + rlp.encode(getRawHeader(block)).toString('hex')).encodeABI();
    var a = await sign.submitBlock(data);
  });

	it("The block submitted is valid", async function() {

    block = await Kovan.eth.getBlock(5233557)
    var Peacerelay = new Ropsten.eth.Contract(PeacerelayABI)
    var PeacerelayRopsten = "0xf77101E0931aE8437eac52c5656660cFeE8754E4";
    Peacerelay.options.address = PeacerelayRopsten;
    
    var header = '0x' + rlp.encode(getRawHeader(block)).toString('hex');
    //var parsedHeader = rlpParser.parse(header);
    data = await Peacerelay.methods.blocks("0xd7b13bacff702d5771c0d0b9bb87f341586a3754ed594ef4bc7ce38f1ee2e7b3").encodeABI();
    console.log(data);
    var a = await sign.ethCall(data);
    console.log(a);
    // assert.equal(parsedHeader.receiptRoot == block.receiptRoot);
    // assert.equal(parsedHeader.txRoot == block.txRoot);
    // assert.equal(parsedHeader.stateRoot == block.stateRoot);
    // assert.equal(parsedHeader.prevBlockHash == block.prevBlockHash);
  });

	// it("should return the initial allowances", async function() {
	// 	var token = await Token.deployed();
	// 	var initial = (await token.allowance.call(accounts[0], accounts[1])).toNumber();
	// 	assert.equal(initial, 0, "allowance is incorrect");
	// });

});

function getRawHeader(_block) {
  if (typeof _block.difficulty != 'string') {
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}