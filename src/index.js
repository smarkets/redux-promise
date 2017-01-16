import { isFSA } from 'flux-standard-action';
import uniqueId from 'lodash/uniqueId';

function isPromise(val) {
  return val && typeof val.then === 'function';
}

export const UNCAUGHT_ERROR = '@@redux-promise/uncaught';

function uncaughtPromise(err) {
  return {
    type: UNCAUGHT_ERROR,
    payload: err,
    error: true
  };
}

export default function promiseMiddleware({ dispatch }) {
  return next => action => {
    if (isPromise(action)) {
      return action.then(dispatch, (err) => {
        dispatch(uncaughtPromise(err));
        return Promise.reject(err);
      });
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
