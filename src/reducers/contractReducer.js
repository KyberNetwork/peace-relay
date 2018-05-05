import { PeaceRelayABI, ETCTokenABI, ETCLockingABI,
    ETC_TOKEN_ADDRESS, PEACE_RELAY_ADDRESS_RINKEBY, PEACE_RELAY_ADDRESS_KOVAN, ETC_LOCKING_ADDRESS } from '../components/Constants'

export default function reducer(state={
    ETCToken: '',
    ETCLocking: '',
    PeaceRelayKovan: '',
    PeaceRelayRinkeby: ''
  }, action) {
      switch (action.type) {
          case "WEB3_INJECTED": {
              let web3 = action.payload,
              ETCToken = web3.eth.contract(ETCTokenABI).at(ETC_TOKEN_ADDRESS),
              ETCLocking = web3.eth.contract(ETCLockingABI).at(ETC_LOCKING_ADDRESS),
              PeaceRelayKovan = web3.eth.contract(PeaceRelayABI).at(PEACE_RELAY_ADDRESS_KOVAN),
              PeaceRelayRinkeby = web3.eth.contract(PeaceRelayABI).at(PEACE_RELAY_ADDRESS_RINKEBY)

              return {
                  ...state,
                  ETCToken: ETCToken,
                  ETCLocking: ETCLocking,
                  PeaceRelayKovan: PeaceRelayKovan,
                  PeaceRelayRinkeby: PeaceRelayRinkeby
              }
          }
      }
      return state
  }