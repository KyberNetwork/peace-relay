import React, { Component } from 'react'
import { Alert } from 'reactstrap'
import { connect } from 'react-redux'
import Parser from 'html-react-parser'

const mapStateToProps = (state) => ({
	txs: state.txStatus.txs
	})

class TxStatus extends Component {
	renderChildren(txs) {
		if (!txs) {
			return
		}
		return Object.keys(txs).map((tx,key) => {
			if (!txs[tx]) return null
			return(<Alert color="info" key={key}>{Parser(txs[tx])}</Alert>)
			}
		)
	}

	render() {
		return (
			<div>
			{this.renderChildren(this.props.txs)}
			</div>
		)
	}
}

export default connect(mapStateToProps)(TxStatus)