import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'reactstrap'
import { newTxStatus, updateTxStatus, removeTxStatus } from '../actions/txStatusActions'
import { MAX_ATTEMPTS, KOVAN_ETHERSCAN_LINK, InfuraRinkeby, InfuraKovan,  
  ETHLocking, ETH_TOKEN_ADDRESS, EPs, PeaceRelayKovan, PEACE_RELAY_ADDRESS_KOVAN} from './Constants.js'

var helper  = require('../../utils/helpers.js');
var BN = require('bn.js');
var signing = require('../utils/signing.js');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const mapStateToProps = (state) => ({
  web3: state.web3Status.web3,
  currAccount: state.web3Status.currAccount,
  ETHToken: state.contracts.ETHToken,
  PeaceRelayRinkeby: state.contracts.PeaceRelayRinkeby,
  })
  
class BurnTxStatus extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      relays: {'kovan': PeaceRelayKovan, 'rinkeby': this.props.PeaceRelayRinkeby}
    }

    this.createNewTxStatus = this.createNewTxStatus.bind(this)
    this.updateTxStatus = this.updateTxStatus.bind(this);
    this.removeTxStatus = this.removeTxStatus.bind(this)
    this.submitBurnTx = this.submitBurnTx.bind(this)
    this.unlock = this.unlock.bind(this)
  }

  createNewTxStatus(id,msg) {
    this.props.dispatch(newTxStatus(id,msg))
  }

  updateTxStatus(id,msg) {
    this.props.dispatch(updateTxStatus(id,msg))
  }

  removeTxStatus(id) {
    this.props.dispatch(removeTxStatus(id))
  }

  submitBurnTx() {
    let id = new Date().getTime()
    this.createNewTxStatus(id,"About to burn " + this.props.ethAmt + " ETH from " + this.props.srcChain + " to " + this.props.destChain)
    this.burn(id,async function(self,burnTxHash,id) {
      var attempts = 0;
      var receipt = self.getTransactionReceipt(attempts,burnTxHash);
      if (!receipt) {
        self.updateTxStatus(id,'Unable to get Transaction Receipt!')
        return
      }
      
      self.updateTxStatus(id,"Checking vaildity of transaction...")
      if(self.isValidReceipt(receipt.status)) {
        let [txProof,receiptProof] = await self.getProofsFromTxHash(burnTxHash,self.props.srcChain);
        let blockHash = txProof.blockHash;
        blockHash = self.convertBlockHashToBigNumFormat(blockHash);
        
        /* 
        SubmitBlock event has been disabled in Infura for now, so need to do long polling
  
        var relayEvent = relays[destChain].SubmitBlock({blockHash: blockHash});
        relayEvent.watch(function(err, result) {
          if(!err) {
            mint(proof, destChain);
          } else {
            console.log(err);
          }
        });
        */

        attempts = 0;
        self.updateTxStatus(id,"Waiting for block from "+ self.props.srcChain + " to be relayed to " + self.props.destChain)
        if (await self.verifyRelayData(attempts,self.props.destChain,blockHash)) {
          await self.unlock(id, txProof, receiptProof, blockHash, self.props.destChain);
        } 
      } else {
        self.updateTxStatus(id,"Burn trx failed")
      }
    });
  }

  async burn(id,callback) {
    var data;
    let chain = this.props.srcChain,
    recipient = this.props.recipient,
    amount = this.props.ethAmt,
    self = this

    if(chain == 'rinkeby') {
      data = this.props.ETHToken.burn.getData(this.props.web3.toWei(amount),recipient);
      await this.props.web3.eth.sendTransaction({
        data: data, 
        from: this.props.currAccount,
        to: ETH_TOKEN_ADDRESS, 
        gas: 100000}, 
        
        async function(err, res) {
          if(!err) {
            self.updateTxStatus(id,"Waiting for transaction to be mined....")
            callback(self,res,id)
          } else {
            self.removeTxStatus(id)
          }
        })

    } else {
        self.updateTxStatus(id,"This function has not been implemented in the " + this.props.srcChain + "network yet. \
        Kindly use the " + this.props.destChain + "network.")
    }
  }

  getTransactionReceipt(attempts,lockTxHash) {
    if (attempts >= MAX_ATTEMPTS) {
      return null
    }
  
    let receipt = InfuraRinkeby.eth.getTransactionReceipt(lockTxHash);
    if (!receipt) {
      //receipt is null, try again
      return this.getTransactionReceipt(attempts+1,lockTxHash);
    } else {
      console.log("blockNumber:" + receipt.blockNumber)
      return receipt;
    }
  }

  isValidReceipt(status) {
    return (status == 1)
  }

  async getProofsFromTxHash(lockTxHash,srcChain) {
    let txProof = await EPs[srcChain].getTransactionProof(lockTxHash)
    txProof = helper.web3ify(txProof)
    let receiptProof = await EPs[srcChain].getReceiptProof(lockTxHash)
    receiptProof = helper.web3ify(receiptProof)
    return [txProof,receiptProof]
  }
  
  convertBlockHashToBigNumFormat(blockHash) {  
    blockHash = new BN(blockHash).toString()
    console.log("Block hash in Big Number:" + blockHash)
    return blockHash
  }
  
  async unlock(id, txProof, receiptProof, blockHash, destChain) {
    var data, res
    if(destChain == 'kovan') {
      data = ETHLocking.unlock.getData(txProof.value, blockHash, txProof.path, txProof.parentNodes,
      receiptProof.value, receiptProof.path, receiptProof.parentNodes)
      var unlockHash = await signing.unlock(data)
      this.updateTxStatus(id,"Waiting for <a href='" + KOVAN_ETHERSCAN_LINK + unlockHash + "' target='_blank'>transaction</a> to be mined."); 
      
    } else {
        this.updateTxStatus(id,"Wrong destination network.")
    }
  }
  
  async verifyRelayData(attempts,destChain,blockHash) {
    if (attempts >= MAX_ATTEMPTS) {
      return false
    } else if (this.dataHasRelayed(destChain,blockHash)) {
      console.log("Relay successful");
      return true
    } else {
      console.log('Attempt ' + attempts + ' has failed.');
      attempts += 1;
      await delay(15000);
      return this.verifyRelayData(attempts,destChain,blockHash);
    }
  }
  
  dataHasRelayed(destChain, blockHash) {
  
    var data = this.state.relays[destChain].blocks.getData(blockHash);
    var res = InfuraKovan.eth.call({
      data: data, 
      from: this.props.currAccount,
      to: PEACE_RELAY_ADDRESS_KOVAN
    });
    return (res > 0);
  }

  render() {
    return (
    <Button color="danger" onClick={this.submitBurnTx}>{this.props.submitButtonText}</Button>
    )
  }
}

export default connect(mapStateToProps)(BurnTxStatus)