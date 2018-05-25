import { PeaceRelayABI, ETHTokenABI, ETHLockingABI,
    ETH_TOKEN_ADDRESS, PEACE_RELAY_ADDRESS_RINKEBY, PEACE_RELAY_ADDRESS_KOVAN, ETH_LOCKING_ADDRESS } from '../components/Constants'

export default function reducer(state={
    ETHToken: '',
    ETHLocking: '',
    PeaceRelayKovan: '',
    PeaceRelayRinkeby: ''
  }, action) {
      switch (action.type) {
          case "WEB3_INJECTED": {
              let web3 = action.payload,
              ETHToken = web3.eth.contract(ETHTokenABI).at(ETH_TOKEN_ADDRESS),
              ETHLocking = web3.eth.contract(ETHLockingABI).at(ETH_LOCKING_ADDRESS),
              PeaceRelayKovan = web3.eth.contract(PeaceRelayABI).at(PEACE_RELAY_ADDRESS_KOVAN),
              PeaceRelayRinkeby = web3.eth.contract(PeaceRelayABI).at(PEACE_RELAY_ADDRESS_RINKEBY)

              return {
                  ...state,
                  ETHToken: ETHToken,
                  ETHLocking: ETHLocking,
                  PeaceRelayKovan: PeaceRelayKovan,
                  PeaceRelayRinkeby: PeaceRelayRinkeby
              }
          }
      }
      return state
  }