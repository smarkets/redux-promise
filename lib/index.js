'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = promiseMiddleware;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fluxStandardAction = require('flux-standard-action');

var _lodashUniqueId = require('lodash/uniqueId');

var _lodashUniqueId2 = _interopRequireDefault(_lodashUniqueId);

function isPromise(val) {
  return val && typeof val.then === 'function';
}

var UNCAUGHT_ERROR = '@@redux-promise/uncaught';

exports.UNCAUGHT_ERROR = UNCAUGHT_ERROR;
function uncaughtPromise(err) {
  return {
    type: UNCAUGHT_ERROR,
    payload: err,
    error: true
  };
}

function promiseMiddleware(_ref) {
  var dispatch = _ref.dispatch;

  return function (next) {
    return function (action) {
      if (isPromise(action)) {
        return action.then(dispatch, function (err) {
          dispatch(uncaughtPromise(err));
          return Promise.reject(err);
        });
      } else if (!_fluxStandardAction.isFSA(action) || !isPromise(action.payload)) {
        return next(action);
      }

      var sequenceId = _lodashUniqueId2['default']();

      dispatch(_extends({}, action, {
        payload: undefined,
        sequence: {
          type: 'start',
          id: sequenceId
        }
      }));

      action.payload.then(function (result) {
        return dispatch(_extends({}, action, {
          payload: result,
          sequence: {
            type: 'next',
            id: sequenceId
          }
        }));
      }, function (error) {
        return dispatch(_extends({}, action, {
          payload: error,
          error: true,
          sequence: {
            type: 'next',
            id: sequenceId
          }
        }));
      });

      return action.payload;
    };
  };
}