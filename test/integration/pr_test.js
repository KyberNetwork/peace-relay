var PrRelayer = require('../../cli/peacerelay.js');
const Web3 = require('web3');
var settings = require('../../cli/settings.json');
const sign = require('./signing');
var BigNumber = require('bignumber.js');
var helper = require('../../utils/helpers.js');

const EP = require('eth-proof');
const EpRopsten = new EP(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const EpKovan = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const EthereumBlock = require('ethereumjs-block/from-rpc');


const KovanWallet = settings['kovan'].walletAddress;
const RopstenWallet = settings['ropsten'].walletAddress;
 
const Ropsten = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
const Kovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io"));

const PeacerelayABI = require('../../build/contracts/PeaceRelay.json').abi;
const ETCTokenABI = require('../../build/contracts/ETCToken.json').abi;
const ETCLockingABI = require('../../build/contracts/ETCLocking.json').abi;

var PeaceRelayRopsten = new Ropsten.eth.Contract(PeacerelayABI);
var PeaceRelayKovan = new Kovan.eth.Contract(PeacerelayABI);
var ETCToken = new Ropsten.eth.Contract(ETCTokenABI);
var ETCLocking = new Kovan.eth.Contract(ETCLockingABI);

PeaceRelayRopsten.options.address = settings['ropsten'].peaceRelayAddress;
PeaceRelayKovan.options.address = settings['kovan'].peaceRelayAddress;
ETCToken.options.address = settings['ropsten'].etcTokenAddress;
ETCLocking.options.address = settings['kovan'].etcLockingAddress;

this.providers.sendAsync = this.providers.send;

function fetchAndVerifyProof(peaceRelay, txHash, srcChain, dstChain) {
  return new Promise((resolve, reject) => {
    return getEP(srcChain).getTransactionProof(txHash).then((proof) => {

	        proof = helper.web3ify(proof);
          var data = await peaceRelay.methods.checkTxProof(proof.value,
                                                            new BigNumber(proof.blockHash),
                                                            proof.path,
                                                            proof.parentNodes);
          var res = await sign.ethCall(data, dstChain, peaceRelay.options.address);
          
          resolve(res); })
                                                    
                                                    .catch((e) => {reject(e);});
  });                   
}

function getEP(chain) {
  if(chain.equals('kovan')) {
    return EpKovan;
  } else {
    return EpRopsten;
  }
}

function fetchBlockHash(chain, txHash) {
  return new Promise((resolve, reject) => {
    return getEP(chain).getTransactionProof(txHash).then((proof) => {
	      proof = helper.web3ify(proof);
        resolve(proof.blockHash);
    });
  });
}

describe("Kovan to Ropsten", function() {
    
    var lockTxHash, mintTxHash;

    it("should lock token in Kovan", function() {
        var data = await ETCLocking.methods.lock(RopstenWallet).encodeABI();
        lockTxHash = await sign.lock(data, 0.5);
        setTimeout(function() {
            Kovan.eth.getTransactionReceipt(lockTxHash).then((proof) => {
              assert.equal(proof.transactionHash, lockTxHash);
              assert.equal(proof.from, KovanWallet);
              assert.equal(proof.to, settings['kovan'].peaceRelayAddress);

            });
        }, 10000);
    });

    it("should relay block of the Kovan's lock transaction in Ropsten", function() {
       return fetchBlockHash('kovan', lockTxHash).then((blockHash) => {
          var blockInfo = await sign.getBlockInfo(blockHash, 'kovan');

          var data = await PeaceRelayRopsten.methods.getTxRoot(new BigNumber(blockHash.toString('hex')));
          var txRoot = await sign.ethCall(data, 'ropsten', settings['ropsten'].peaceRelayAddress);
          
          data = await PeaceRelayRopsten.methods.getStateRoot(new BigNumber(blockHash.toString('hex')));
          var stateRoot = await sign.ethCall(data, 'ropsten', settings['ropsten'].peaceRelayAddress); 

          data = await PeaceRelayRopsten.methods.getReceiptRoot(new BigNumber(blockHash.toString('hex')));
          var receiptRoot = await sign.ethCall(data, 'ropsten', settings['ropsten'].peaceRelayAddress);

          assert.equal(txRoot, blockInfo.transactionRoot);
          assert.equal(stateRoot, blockInfo.stateRoot);

       });
    });

  it("should verify the Kovan's lock proof in Ropsten", function() {
     return fetchAndVerifyProof(peaceRelayRopsten, lockTxHash, 'kovan', 'ropsten').then((res) => {
       assert.equal(res, true);
     });
  });

  it("should not verify wrong proof", function() {
    return getEP('kovan').getTransactionProof(lockTxHash).then((proof) => {
	        proof = helper.web3ify(proof);
          var wrongBlockHash = '0x02a843c95efe6387a085aac84f5e2e80a513a0085c0a1a12f165ad1134f04058';

          var data = await peaceRelayRopsten.methods.checkTxProof(proof.value,
                                                                  new BigNumber(wrongBlockHash),
                                                                  proof.path,
                                                                  proof.parentNodes);
          var res = await sign.ethCall(data, 'ropsten', peaceRelayRopsten.options.address);
          
          assert.equal(res, false); 

          })
                                                    
                                                    .catch((e) => {reject(e);});
  });

  it("should mint token", function() {
      return getEP('kovan').getTransactionProof(lockTxHash).then((proof) => {
       	proof = helper.web3ify(proof); 
        var data = await ETCToken.methods.mint(proof.value.toString('hex'), proof.blockHash.toString('hex'), 
                                               proof.path.toString('hex'), proof.parentNodes.toString('hex')).encodeABI();

        mintTxHash = await sign.mint(data);
      
      });
  });

  it("should fetch the correct info of the lock transaction", function() {
      var amountMinted = '0x0000000000000000000000001dcd6500'; // 0.5 ETH
      var addMintedFor = RopstenWallet; //TODO : FIX THIS
      var txReceipt = await sign.getTransactionReceipt(mintTxHash, 'ropsten');
      assert.equal(txReceipt.logs[0].data, amountMinted, "Should have given user correct amt");
      assert.equal(txReceipt.logs[0].topics[1], addMintedFor, "Should have given to correct person");
  });

});

describe("Ropsten to Kovan", function() {
    var burnTxHash, unlockTxHash;

    it("should burn token in Ropsten", function() {
        var data = await ETCToken.methods.burn(KovanWallet).encodeABI();
        burnTxHash = await sign.burn(data, 0.5);
        setTimeout(function() {
            Ropsten.eth.getTransactionReceipt(burnTxHash).then((proof) => {
              assert.equal(proof.transactionHash, burnTxHash);
              assert.equal(proof.from, RopstenWallet);
              assert.equal(proof.to, settings['ropsten'].peaceRelayAddress);

            });
        }, 10000);
    });

    it("should relay block of the Ropsten's burn transaction in Kovan's peacerelay", function() {
       return fetchBlockHash('ropsten', burnTxHash).then((blockHash) => {
          var blockInfo = await sign.getBlockInfo(blockHash, 'ropsten');

          var data = await PeaceRelayRopsten.methods.getTxRoot(new BigNumber(blockHash.toString('hex')));
          var txRoot = await sign.ethCall(data, 'kovan', settings['kovan'].peaceRelayAddress);
          data = await PeaceRelayRopsten.methods.getStateRoot(new BigNumber(blockHash.toString('hex'))); var stateRoot = await sign.ethCall(data, 'kovan', settings['kovan'].peaceRelayAddress); data = await PeaceRelayRopsten.methods.getReceiptRoot(new BigNumber(blockHash.toString('hex'))); var receiptRoot = await sign.ethCall(data, 'kovan', settings['kovan'].peaceRelayAddress); assert.equal(txRoot, blockInfo.transactionRoot); assert.equal(stateRoot, blockInfo.stateRoot); }); });

  it("should verify the Ropsten's burn proof in Kovan", function() {
     return fetchAndVerifyProof(PeaceRelayKovan, burnTxHash, 'ropsten', 'kovan').then((res) => {
       assert.equal(res, true);
     });
  });

  it("should not verify wrong proof", function() {
    return getEP('ropsten').getTransactionProof(burnTxHash).then((proof) => {
	        proof = helper.web3ify(proof);
          var wrongBlockHash = '0x4da4aa87238f0011c2a259f5deda2c906136594a4f57b399c83d3f2dc07ddfa2';

          var data = await peaceRelayKovan.methods.checkTxProof(proof.value.toString('hex'),
                                                                new BigNumber(wrongBlockHash),
                                                                proof.path.toString('hex'),
                                                                proof.parentNodes.toString('hex'));
          var res = await sign.ethCall(data, 'kovan', peaceRelayKovan.options.address);
          
          assert.equal(res, false); 

          })
                                                    
                                                    .catch((e) => {reject(e);});
  });

  it("should unlock token", function() {
      return getEP('ropsten').getTransactionProof(burnTxHash).then((proof) => {
       
        proof = helper.web3ify(proof); 
        var data = await ETCToken.methods.mint(proof.value.toString('hex'), proof.blockHash.toString('hex'), 
                                               proof.path.toString('hex'), proof.parentNodes.toString('hex')).encodeABI();

        unlockTxHash = await sign.unlock(data);
      
      });
  });

  it("should fetch the correct info of the burn transaction", function() {
      var amountMinted = '0x0000000000000000000000001dcd6500'; // 0.5 ETH
      var addMintedFor = KovanWallet; //TODO : FIX THIS
      var txReceipt = await sign.getTransactionReceipt(unlockTxHash, 'kovan');
      assert.equal(txReceipt.logs[0].data, amountMinted, "Should have given user correct amt");
      assert.equal(txReceipt.logs[0].topics[1], addMintedFor, "Should have given to correct person");
  });

});

function getRawHeader(_block) {
  if (typeof _block.difficulty != 'string') {
    _block.difficulty = '0x' + _block.difficulty.toString(16)
  }
  var block = new EthereumBlock(_block)
  return block.header.raw
}
