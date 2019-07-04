import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Header from 'layouts/header/header'
import Footer from 'layouts/footer/footer'
import SettingsPane from 'components/settings-pane/settings-pane'
import Welcome from 'components/welcome/welcome'
import Timeline from 'components/timeline/timeline'
import Spinner from 'components/spinner/spinner'
import SharingPane from 'components/sharing-pane/sharing-pane'
import Error from 'components/error/error'
import { toggleSettings, OPEN_PROFILE } from 'actions/timeline'
import { checkOutages } from 'utils'
import URLSearchParams from 'url-search-params' // polyfill

class Main extends Component {

  componentDidMount () {
    // check if drawer should be open on load
    const { query } = this.props.location || {}
    if (query.action === "open-profile") {
      this.props.dispatch(toggleSettings(OPEN_PROFILE))

      // remove action from url
      const { pathname, search, hash } = this.props.location
      const queryParams = new URLSearchParams(search)
      queryParams.delete('action')
      this.props.router.replace(pathname + queryParams.toString() + hash)
    }
  }

  render () {
    const { phases, isLoggedIn, appError, authError, isFetchingPersonalisation } = this.props

    let showWhenLoading = ''
    let showWhenLoaded = 'hidden'
    let showWhenHasError = 'hidden'

    if (phases.length > 0 && !appError && isFetchingPersonalisation === false) { // assumes there will always be both supplementary and phases
      showWhenLoading = 'hidden'
      showWhenLoaded = ''
    }

    if (appError) {
      showWhenHasError = ''
      showWhenLoading = 'hidden'
    }

    return (
      <div className='site-container-wrapper'>
        <div className='site-container'>
          <Header isLoggedIn={isLoggedIn} authError={authError} systemAlert={checkOutages('main')} />
          <SharingPane calledFrom="Welcome" />
          <div className={showWhenLoaded}>
            <SettingsPane />
            <Welcome />
          </div>
          <div id='content'>
            <div className={showWhenLoading}>
              <Spinner />
            </div>
            <div className={showWhenLoaded} role='main'>
              <Timeline phases={phases} />
            </div>
            <div className={showWhenHasError}>
              <Error />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}

function mapStateToProps () {
  return {}
}

Main.propTypes = {
  phases: PropTypes.array,
  about: PropTypes.array,
  isLoggedIn: PropTypes.bool,
  isFetchingPersonalisation: PropTypes.bool,
  appError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
    PropTypes.object
  ]),
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  dispatch: PropTypes.func,
  router: PropTypes.object,
  location: PropTypes.object
}

export default connect(mapStateToProps)(Main)
