import React, { Component } from 'react'
import { Button, Input } from 'reactstrap'
import { ETHToken } from './Constants.js';

export default class Balances extends Component {
	constructor(props) {
		super(props);
		this.state = {
			kovanBalance: 0,
			rinkebyBalance: 0,
			kovanAddress: "",
			rinkebyAddress: ""
		}
		
		this.queryBalance = this.queryBalance.bind(this);
		this.handleChange = this.handleChange.bind(this);
	}

	queryBalance(queryNetwork) {
		if (!this.props.web3) {
			console.log('Web3 failed to pass down to component, or is not initialised.')
			return;
		}

		if (queryNetwork == 'kovan') {
			console.log('balanceOf() method not implemented in Smart Contract by design.')
		} else {
			let balance = ETHToken.balanceOf(this.state.rinkebyAddress)
			balance = this.props.web3.fromWei(balance, 'ether').toNumber()
			if (balance != this.state.rinkebyBalance) {
				this.setState({rinkebyBalance: balance})
			}
		}
	}

	handleChange(event) {
		this.setState({[event.target.name]: event.target.value});
	}

	render() {
		return (
			<div className="tokenBalance">
				<h4 className="tokenBalanceTitle">ETH Tokens in Rinkeby</h4>
				<hr className="divider"/>
				<p>{this.state.rinkebyBalance} ETH</p>
	            <Input type='text' name="rinkebyAddress" placeholder="Wallet Address" value={this.state.rinkebyAddress} onChange={this.handleChange}/>
	          	<Button color="info" onClick={() => this.queryBalance('rinkeby')} block>Query</Button>
			</div>
		);
	}
}