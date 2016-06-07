import { isFSA } from 'flux-standard-action';
import uniqueId from 'lodash/utility/uniqueId';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export default function promiseMiddleware({ dispatch }) {
  return next => action => {
    if (isPromise(action)) {
      return action.then(dispatch);
    } else if (!isFSA(action) || !isPromise(action.payload)) {
      return next(action);
    }

    const sequenceId = uniqueId();

    dispatch({
      ...action,
      payload: undefined,
      sequence: {
        type: 'start',
        id: sequenceId
      }
    });

    action.payload.then(
      result => dispatch({
        ...action,
        payload: result,
        sequence: {
          type: 'next',
          id: sequenceId
        }
      }),
      error => dispatch({
        ...action,
        payload: error,
        error: true,
        sequence: {
          type: 'next',
          id: sequenceId
        }
      })
    );

    return action.payload;
  };
}
