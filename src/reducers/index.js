import {combineReducers} from "redux"

import web3Status from "./web3StatusReducer"
import contracts from "./contractReducer"
import txStatus from "./txStatusReducer"

export default combineReducers({
  web3Status,
  contracts,
  txStatus
})