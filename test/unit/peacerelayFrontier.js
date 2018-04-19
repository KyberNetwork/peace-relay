const rlp = require('rlp');
const Web3 = require('web3');
const ethProof  = require('eth-proof')
const EthereumBlock = require('ethereumjs-block/from-rpc')


const PeaceRelay = artifacts.require("./Peacerelay.sol");
const EthProof = new ethProof(new Web3.providers.HttpProvider("http://localhost:8545"));

contract('Peacerelay', (accounts) => {
  var block;
  
  // it("Offline Transaction proof", async () => {
  //   var txHash = '0xb22c17a15fe9a71f7af6b2ed900635c3a3da077264dac85538c82f5f2ddb45b4';
  //   var block2 = await web3.eth.getBlock(197);
  //   var result = await ethProof.getTransactionProof(txHash);
  //   var myTrustedBlockHash = Buffer.from(block2.hash,'hex')
  //   var verified = EthProof.transaction(result.path, result.value, result.parentNodes, result.header, myTrustedBlockHash)
  //   console.log(verified) 
  // });

  it("Submitting a block", async () => {
    
    const relay = await PeaceRelay.deployed();
    const highestBlock = await relay.highestBlock();
    const newBlockNumber = highestBlock.toNumber() + 1;
    block = await web3.eth.getBlock(newBlockNumber)

    await relay.submitBlock(block.hash, '0x' + rlp.encode(getRawHeader(block)).toString('hex'));
    const submittedBlock = await relay.blocks(block.hash);

    assert.equal(block.stateRoot, submittedBlock[1].toString());
    assert.equal(block.transactionsRoot, submittedBlock[2].toString());
    assert.equal(block.receiptsRoot, submittedBlock[3].toString());
  });

  it("Get Transactions Root", async () => {
    const relay = await PeaceRelay.deployed();
    const txRoot = await relay.getTxRoot.call(block.hash);
    assert.equal(block.transactionsRoot, txRoot);
  });

  it("Get State Root", async () => {
    const relay = await PeaceRelay.deployed();
    const stateRoot = await relay.getStateRoot.call(block.hash);
    assert.equal(block.stateRoot, stateRoot);
  });

  it("Get Receipts Root", async () => {
    const relay = await PeaceRelay.deployed();
    const receiptsRoot = await relay.getReceiptRoot.call(block.hash);
    assert.equal(block.receiptsRoot, receiptsRoot);
  });

  // it("Check transaction proof", async () => {
    
  // });

  // it("Check state proof", async () => {
    
  // });

  // it("Check receipts proof", async () => {
    
  // });
});

function getRawHeader(_block) {
  if (typeof _block.difficulty != 'string') {
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}