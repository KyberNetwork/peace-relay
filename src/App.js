import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col } from 'reactstrap'
import NavigationBar from './components/NavigationBar'
import ConversionForm from './components/ConversionForm'
import Balances from './components/Balances'
import { fetchWeb3 } from './actions/web3Actions'

import './app.css'

const mapStateToProps = (state) => ({
  web3: state.web3Status.web3,
  currNetwork: state.web3Status.currNetwork,
  currAccount: state.web3Status.currAccount,
  truncatedAccount: state.web3Status.truncatedAccount
  })

class App extends Component {
  constructor(props) {
    super(props)
    this.fetchWeb3 = this.fetchWeb3.bind(this)
  }
  
  componentDidMount() {
    setInterval(
      () => this.fetchWeb3(), 1500
    )
  }

  fetchWeb3() {
    this.props.dispatch(fetchWeb3(this.props))
  }

  render() {
    return (
    <div className="App">
      <NavigationBar network={this.props.currNetwork} truncatedAccount={this.props.truncatedAccount}/>
      <Container fluid={true} className="mainContainer">
        <Row>
        <Col xs="9">
        <ConversionForm web3={this.props.web3} network={this.props.currNetwork} account={this.props.currAccount} />
        </Col>
        <Col xs="3">
        <Balances web3={this.props.web3}/>
        </Col>
        </Row>
      </Container>
    </div>
    )
  } 
}

export default connect(mapStateToProps)(App)