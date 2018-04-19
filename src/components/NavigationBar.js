import React from 'react';
import { Collapse, Navbar, NavbarToggler, NavbarBrand, Nav, NavItem, Button } from 'reactstrap';
import { RIGHT_NETWORK_IDS, METAMASK_NOT_FOUND, MAIN_NETWORK_ID, RINKEBY_NETWORK_ID, KOVAN_NETWORK_ID } from './Constants'
import Banner from '../assets/Banner.png'

export default class NavigationBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: false
    };

    this.getAddress = this.getAddress.bind(this);
    this.getNetwork = this.getNetwork.bind(this);
    this.isWrongNetwork = this.isWrongNetwork.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  shouldComponentUpdate(nextProps,nextState) {
    return (
      (
        (this.props.truncatedAccount != nextProps.truncatedAccount) || 
        (this.props.network != nextProps.network)
      )
    )
  }

  getAddress() {
    if(this.props.network == -1) {
      return null
    } else if (this.props.network == METAMASK_NOT_FOUND) {
      return (
        <Button color="danger" href="/getMetamask">Metamask Undetected</Button>
      ) 
    } else if (!this.props.truncatedAccount) {
      return (
        <Button color="warning" href="/unlockMetamask">Metamask Locked</Button>
      )
    } else {
      return (
        <Button color="success" disabled>{this.props.truncatedAccount}</Button>
      )
    }
  }

  getNetwork() {
    switch(this.props.network) {
      case MAIN_NETWORK_ID:
      return <Button color="danger" disabled>Mainnet</Button>

      case RINKEBY_NETWORK_ID:
      return <Button id="rinkebyNetworkButton" disabled>Rinkeby Network</Button>

      case KOVAN_NETWORK_ID:
      return <Button id="kovanNetworkButton" disabled>Kovan Network</Button>

      default:
      return <Button color="danger" disabled>Wrong network</Button>
    }
  }

  isWrongNetwork() {
    if((RIGHT_NETWORK_IDS.includes(this.props.network)) || (!this.props.network) || (this.props.network == -1)) {
      return null
    }
    return (
      <Navbar className="wrongNetworkBar">
        <Nav navbar>
        <NavItem>
          Wrong Network Detected. Kindly switch to Rinkeby or Kovan.
        </NavItem>
        </Nav>
      </Navbar>
    )
  }

  toggle() {
    this.setState({ isOpen: !this.state.isOpen })
  }

  render() {
    return (
      <div>
        <Navbar color="faded" light className="navbar-expand-lg">
          <NavbarBrand><img className="banner" src={Banner} /></NavbarBrand>
          <NavbarToggler onClick={this.toggle} />
          <Collapse isOpen={this.state.isOpen} navbar>
          <Nav className="ml-auto" navbar>
          <NavItem className="navbarButton">
            {this.getNetwork()}
          </NavItem>
          <NavItem className="navbarButton">
            {this.getAddress()}
          </NavItem>
          </Nav>
          </Collapse>
        </Navbar>
        {this.isWrongNetwork()}
      </div>
    );
  }
}