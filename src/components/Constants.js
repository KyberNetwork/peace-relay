export const MAIN_NETWORK_ID = "1"
export const MORDEN_NETWORK_ID = "2"
export const ROPSTEN_NETWORK_ID = "3"
export const RINKEBY_NETWORK_ID = "4"
export const KOVAN_NETWORK_ID = "42"
export const MAX_ATTEMPTS = 500
export const RINKEBY_ETHERSCAN_LINK = "https://rinkeby.etherscan.io/tx/"
export const KOVAN_ETHERSCAN_LINK = "https://kovan.etherscan.io/tx/"

export const RIGHT_NETWORK_IDS = [RINKEBY_NETWORK_ID, KOVAN_NETWORK_ID]
export const METAMASK_NOT_FOUND = 0

var settings = require('../../cli/settings.json')
var EP = require('eth-proof')
var Web3 = require('web3')

export const InfuraRinkeby = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/GuujZSIzbY0azOouyBPX"));
export const InfuraKovan = new Web3(new Web3.providers.HttpProvider("https://kovan.infura.io/GuujZSIzbY0azOouyBPX"));

export const PeaceRelayABI = require('../../build/contracts/PeaceRelay.json').abi;
export const ETHTokenABI = require('../../build/contracts/ETHToken.json').abi;
export const ETHLockingABI = require('../../build/contracts/ETHLocking.json').abi;
 
export const PEACE_RELAY_ADDRESS_RINKEBY = settings['rinkeby'].peaceRelayAddress
export const PEACE_RELAY_ADDRESS_KOVAN = settings['kovan'].peaceRelayAddress
export const ETH_TOKEN_ADDRESS = settings['rinkeby'].ethTokenAddress
export const ETH_LOCKING_ADDRESS = settings['kovan'].ethLockingAddress

var PeaceRelayRinkebyContract = InfuraRinkeby.eth.contract(PeaceRelayABI);
var PeaceRelayKovanContract = InfuraKovan.eth.contract(PeaceRelayABI);
var ETHTokenContract = InfuraRinkeby.eth.contract(ETHTokenABI);
var ETHLockingContract = InfuraKovan.eth.contract(ETHLockingABI);

export var PeaceRelayRinkeby = PeaceRelayRinkebyContract.at(PEACE_RELAY_ADDRESS_RINKEBY)
export var PeaceRelayKovan = PeaceRelayKovanContract.at(PEACE_RELAY_ADDRESS_KOVAN)
export var ETHToken = ETHTokenContract.at(ETH_TOKEN_ADDRESS)
export var ETHLocking = ETHLockingContract.at(ETH_LOCKING_ADDRESS)

const EpRinkeby = new EP(new Web3.providers.HttpProvider("https://rinkeby.infura.io/GuujZSIzbY0azOouyBPX"));
const EpKovan = new EP(new Web3.providers.HttpProvider("https://kovan.infura.io/GuujZSIzbY0azOouyBPX"));

export var EPs = {'kovan': EpKovan, 'rinkeby': EpRinkeby};