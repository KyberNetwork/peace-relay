import React, { Component } from 'react'
import { Jumbotron, Row, Col, Form, FormGroup, Label, Input } from 'reactstrap'
import { RINKEBY_NETWORK_ID, KOVAN_NETWORK_ID } from './Constants';
import TxStatus from './TxStatus'
import LockTxStatus from './LockTxStatus'
import BurnTxStatus from './BurnTxStatus'

export default class ConversionForm extends Component {
  render() {
    const currNetwork = this.props.network;
    if (currNetwork == RINKEBY_NETWORK_ID) {
      return (
      <div>
        <Row>
          <Col xs="3" className="txStatus">
          <h4 className="txStatusTitle">Transaction Status</h4>
          </Col>
          <Col xs="9">
          <h1 className="conversionFormTitle">Rinkeby to Kovan</h1>
          </Col>
        </Row>
        <hr className="divider"/>
        <Row>
          <Col xs="3">
            <TxStatus />
          </Col>

          <Col xs="9">
            <TokenForm
            srcChain='rinkeby'
            destChain='kovan'
            submitButtonText='Convert Back To Kovan'
            isLock={false}
            />
          </Col>
        </Row>
      </div>
      );

    } else if (currNetwork == KOVAN_NETWORK_ID) {
      return (
      <div>
        <Row>
          <Col xs="3" className="txStatus">
          <h4 className="txStatusTitle">Transaction Status</h4>
          </Col>
          <Col xs="9">
          <h1 className="conversionFormTitle">Kovan to Rinkeby</h1>
          </Col>
        </Row>
        <hr className="divider"/>
        <Row>
          <Col xs="3">
            <TxStatus />
          </Col>

          <Col xs="9">
            <TokenForm 
            srcChain='kovan'
            destChain='rinkeby'
            submitButtonText='Convert To Rinkeby'
            isLock={true}
            />
          </Col>
        </Row>
      </div>
      );
    } else {
      return (
      <Jumbotron>
        <h1>Wrong network</h1>
      </Jumbotron>
      )
    }
  }
}

class TokenForm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ethAmt: 0,
      recipient: '',
    }

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    //submitLockTx(this.state.recipient, this.state.ethAmt, this.props.srcChain, this.props.destChain)
    event.preventDefault();
  }

  render() {
    return (
      <div className="tokenForm">
        <Form onSubmit={this.handleSubmit}>
        
          <FormGroup>
            <label>Amount</label>
            <Input type="number" name="ethAmt" value={this.state.ethAmt} onChange={this.handleChange} />
          </FormGroup>
  
          <FormGroup>
            <Label>Recipient address</Label>
            <Input type='text' name="recipient" value={this.state.recipient} onChange={this.handleChange}/>
          </FormGroup>
          
          <LockOrBurn 
          isLock={this.props.isLock}
          recipient={this.state.recipient} 
          ethAmt={this.state.ethAmt}
          srcChain={this.props.srcChain}
          destChain={this.props.destChain}
          submitButtonText={this.props.submitButtonText}
          parent={this}
          />
        </Form>
      </div>
    );
  }
}

function LockOrBurn(props) {
  const isLock = props.isLock
  if (isLock) {
    return (
    <div>
    <LockTxStatus
    recipient={props.recipient}
    ethAmt={props.ethAmt}
    srcChain={props.srcChain}
    destChain={props.destChain}
    submitButtonText={props.submitButtonText}
    />
    </div>
    )
  } else {
    return (
    <div>
    <BurnTxStatus
    recipient={props.recipient}
    ethAmt={props.ethAmt}
    srcChain={props.srcChain}
    destChain={props.destChain}
    submitButtonText={props.submitButtonText}
    />
    </div>
    )
  }
}