import getWeb3 from '../utils/getWeb3'
import { METAMASK_NOT_FOUND } from '../components/Constants'

export function fetchWeb3(state) {
  return async function(dispatch) {
    let results = await getWeb3;
    if (results.web3) {
      
      if (state.web3 != results.web3) {
        dispatch({type: "WEB3_INJECTED", payload: results.web3})
      }
  
      if (state.currNetwork !== results.web3.version.network) {
        dispatch({type: "NETWORK_CHANGED", payload: results.web3.version.network})
      }

      if (results.web3.eth.accounts[0]) {
        if (results.web3.eth.accounts[0] != state.currAccount) {
          dispatch({type: "WALLET_ADDR_CHANGED", payload: results.web3.eth.accounts[0]})
        }
      } else {
        dispatch({type: "WALLET_LOCKED", payload: ''})
      }
    } else {
      dispatch({type: "WEB3_NOT_FOUND", payload: METAMASK_NOT_FOUND})
    }
  }
}