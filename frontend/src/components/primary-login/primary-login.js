import './primary-login.scss'
import './realme-login-primary.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { piwikTrackPost } from 'actions/application'
import URLSearchParams from 'url-search-params' // polyfill
import get from 'lodash/get'

export class PrimaryLogin extends Component {
  constructor (props) {
    super(props)

    this.state = {
      insistentLoginMessageShown: false,
      loggedInMessageShown: false,
      realmeHelpShown: false,
      concertinaVerb: 'expand'
    }

    this.concertinaToggle = this.concertinaToggle.bind(this)
    this.loginAction = this.loginAction.bind(this)
  }

  loginAction (event) {
    event.preventDefault()

    // track the event
    const piwikEvent = {
      'category': 'Login',
      'action': 'Click',
      'name': 'Primary login'
    }
    if (this.props.clickSource === 'drawer') {
      piwikEvent['name'] = 'Secondary login'
    }

    this.props.dispatch(piwikTrackPost('Primary login', piwikEvent))

    // check if need to do anything after user returns from realme
    // NOTE: actions on return managed via next param passed to realme via URL
    const { pathname, search, hash } = window.location
    const queryParams = new URLSearchParams(search)
    if (this.props.afterLoginAction) {
      queryParams.append('action', this.props.afterLoginAction)
    }

    // match standard piwik outlink delay
    window.setTimeout(() => {
      const returnURL = pathname + '?' + queryParams.toString() + hash
      window.location = `/login?next=${encodeURIComponent(returnURL)}`
    }, 200)
  }

  concertinaToggle () {
    this.setState({
      realmeHelpShown: !this.state.realmeHelpShown,
      concertinaVerb: this.state.concertinaVerb !== 'expand' ? 'expand' : 'collapse'
    })
  }

  concertinaKeyPress (event) {
    if (event.key === 'Enter') {
      this.concertinaToggle()
    }
  }


  render () {
    let realmeHelpClasses = classNames(
      'concertina',
      { 'is-expanded': this.state.realmeHelpShown }
    )
    let realmeHelpContentClasses = classNames(
      'concertina-content',
      { 'hidden': !this.state.realmeHelpShown }
    )

    return (
      <div className="primary-login">
        <a className='button realme-primary-login-button ext-link-icon' href='/login/' onClick={this.loginAction}>
          Login
        </a>
        <div>
          <p
            className={realmeHelpClasses}
            onClick={this.concertinaToggle}
            tabIndex='0'
            onKeyPress={this.concertinaKeyPress.bind(this)}
            aria-controls='realme-help'
            aria-expanded={this.state.realmeHelpShown}
          >
            What is RealMe?
            <span className='visuallyhidden'> - {this.state.concertinaVerb} this content</span>
          </p>
          <div id='realme-help' className={realmeHelpContentClasses}>
            <p>SmartStart uses RealMe to save and protect your information.  If you have a RealMe login you can use it to login to your SmartStart profile and To Do list.</p>
            <p>If you don’t have a RealMe login you can select login and create one.</p>
            <p>RealMe is a New Zealand government service that lets you use one username and password to access a wide range of services online. To find out more go to www.RealMe.govt.nz.</p>
          </div>
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  isLoggedIn: get(state, 'personalisation.isLoggedIn')
})

PrimaryLogin.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  afterLoginAction: PropTypes.string,
  dispatch: PropTypes.func,
  clickSource: PropTypes.string
}

export default connect(mapStateToProps)(PrimaryLogin)
