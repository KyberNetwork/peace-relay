export default function reducer(state={
    txs: ''
  }, action) {
      switch (action.type) {
          case "NEW_TX": {
              let [id,msg] = action.payload
              return {
                  ...state,
                  txs: {...state.txs, [id]:msg}
                }
            }
            case "UPDATE_TX": {
                let [id,msg] = action.payload
                return {
                    ...state,
                    txs: {...state.txs, [id]:msg}
                }
            }

            case "REMOVE_TX": {
                let id = action.payload
                return {
                    ...state,
                    txs: {...state.txs, [id]: null}
                }
            }
        }
      return state
    }