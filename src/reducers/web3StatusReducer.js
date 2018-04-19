export default function reducer(state={
    web3: null,
    currNetwork: -1,
    currAccount: '',
    truncatedAccount: ''
  }, action) {
      switch (action.type) {
          case "WEB3_INJECTED": {
              return {
                  ...state,
                  web3: action.payload,
              }
          }
  
          case "NETWORK_CHANGED": {
              return {
                  ...state, 
                  currNetwork: action.payload,
              }
          }
  
          case "WALLET_ADDR_CHANGED": {
              return {
                  ...state,
                  currAccount: action.payload,
                  truncatedAccount: action.payload.slice(0,10)
              }
          }
  
          case "WALLET_LOCKED": {
              return {
                  ...state,
                  currAccount: action.payload,
                  truncatedAccount: action.payload
              }
          }
  
          case "WEB3_NOT_FOUND": {
              return {
                  ...state,
                  currNetwork: action.payload
              }
          }
      }
      return state
  }