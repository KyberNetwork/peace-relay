export function newTxStatus(id,msg) {
  return function(dispatch) {
    let payload = [id,msg]
    dispatch({type: "NEW_TX", payload: payload})
  }
}

export function updateTxStatus(id,msg) {
  return function(dispatch) {
    let payload = [id,msg]
    dispatch({type: "UPDATE_TX", payload: payload})
  }
}

export function removeTxStatus(id) {
  return function(dispatch) {
    dispatch({type: "REMOVE_TX", payload:id})
  }
}