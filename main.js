import React,{Component} from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux'
import {createStore, applyMiddleware} from 'redux'
import applicationStore from './src/reducers'
import promise from 'redux-promise-middleware'
import thunk from 'redux-thunk'
import {createLogger} from 'redux-logger'
import App from 'src/components/App.jsx';

const logger = createLogger();
const middleware = applyMiddleware(promise(),thunk,logger);
const store = createStore(applicationStore, middleware);


render(
  <Provider store ={store}>
  <App />
  </Provider>,
  document.getElementById('app')
)