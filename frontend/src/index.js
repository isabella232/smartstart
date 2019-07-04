/* globals module */
import React from 'react'
import { render } from 'react-dom'
import { AppContainer } from 'react-hot-loader'
import configureStore from 'store/store'
import { CookiesProvider } from 'react-cookie'

import Root from './containers/root'

const store = configureStore()

render(
  <AppContainer>
    <Root
      store={ store }
    />
  </AppContainer>,
  document.getElementById('app')
)


if (module.hot) {
  module.hot.accept('./containers/root', () => {
    const RootContainer = require('./containers/root').default
    render(
      <AppContainer>
        <CookiesProvider>
          <RootContainer
            store={ store }
          />
        </CookiesProvider>
      </AppContainer>,
      document.getElementById('app')
    )
  })
}
