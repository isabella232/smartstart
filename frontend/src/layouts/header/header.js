import './header.scss'

import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { Link, IndexLink } from 'react-router'
import { connect } from 'react-redux'
import { withRouter } from "react-router";
import LoginButton from 'components/login-button/login-button'
import LogoutButton from 'components/logout-button/logout-button'
import classNames from 'classnames'
import { piwikTrackPost } from 'actions/application'

class Header extends Component {
  constructor (props) {
    super(props)

    this.state = {
      authErrorShown: false,
      authErrorMessage: '',
      authErrorIsFromIDP: false,
      menuShown: false
    }

    this.clearMessage = this.clearMessage.bind(this)
    this.setAuthErrorMessage = this.setAuthErrorMessage.bind(this)
    this.setSystemAlert = this.setSystemAlert.bind(this)
    this.menuToggle = this.menuToggle.bind(this)
    this.trackNeedSupportClick = this.trackNeedSupportClick.bind(this)
  }

  UNSAFE_componentWillMount () {
    // prioritise auth errors
    if (this.props.authError) {
      this.setAuthErrorMessage(this.props.authError)

    } else if (this.props.systemAlert) {
      this.setSystemAlert(this.props.systemAlert)
    }
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    // prioritise auth errors
    if (nextProps.authError) {
      this.setAuthErrorMessage(nextProps.authError)

    } else if (this.props.systemAlert) {
      this.setSystemAlert(this.props.systemAlert)
    }
  }

  setSystemAlert(message) {
    this.setState({
      authErrorShown: true,
      authErrorIsFromIDP: false,
      authErrorMessage: message
    })
  }

  setAuthErrorMessage (code) {
    let message = ''
    let isIDP = false

    switch (code) {
      case 'AuthnFailed':
        message = 'You have chosen to leave RealMe.'
        isIDP = true
        break
      case 'Timeout':
        message = 'Your RealMe session has expired due to inactivity.'
        isIDP = true
        break
      case 'InternalError':
        message = 'RealMe was unable to process your request due to a RealMe internal error. Please try again. If the problem persists, please contact RealMe Help Desk on 0800 664 774.'
        isIDP = true
        break
      case 'RequestUnsupported':
      case 'UnsupportedBinding':
      case 'NoPassive':
      case 'RequestDenied':
        message = `RealMe reported a serious application error with the message ${code}. Please try again later. If the problem persists, please contact RealMe Help Desk on 0800 664 774.`
        isIDP = true
        break
      case 'local-timeout':
        message = 'Sorry, SmartStart is unable to save your change because your login session has expired.  Please log in again to save your change.'
        window.scrollTo(0, 0)
        break
      default:
        message = 'RealMe was unable to log you in. Please try again. If the problem persists, contact RealMe Help Desk on 0800 664 774.'
        isIDP = true
    }

    this.setState({
      authErrorShown: true,
      authErrorMessage: message,
      authErrorIsFromIDP: isIDP
    })
  }

  clearMessage (event) {
    event.preventDefault()
    this.setState({
      authErrorShown: false
    })
  }

  menuToggle (event) {
    event.preventDefault()
    this.setState({
      menuShown: !this.state.menuShown
    })
  }

  trackNeedSupportClick (e) {
    e.preventDefault()
    let piwikEvent = {
      'category': 'Navigation',
      'action': 'Click link',
      'name': 'Need Support? page'
    }
    // track the event
    this.props.dispatch(piwikTrackPost('Navigation', piwikEvent))
    this.props.router.push('/support')
  }

  render () {
    const { isLoggedIn } = this.props
    const { menuShown, authErrorMessage } = this.state
    const messageClasses = classNames(
      'page-header-error',
      { 'hidden': !this.state.authErrorShown },
      { 'realme-error': this.state.authErrorIsFromIDP },
      { 'light': authErrorMessage.includes('href=') } // change error color to light for better accessability
    )
    const loginClasses = classNames(
      'auth-controls',
      { 'hidden': isLoggedIn }
    )
    const logoutClasses = classNames(
      'auth-controls',
      { 'hidden': !isLoggedIn }
    )
    const menuClasses = classNames(
      'main-nav',
      { 'mobile-menu-shown': menuShown }
    )
    const menuToggleClasses = classNames(
      'nav-menu-button',
      { 'mobile-menu-shown': menuShown }
    )
    const pageHeaderClasses = classNames(
      'page-header',
      { 'mobile-menu-shown': menuShown }
    )

    return (
      <header className={pageHeaderClasses}>
        <div className='page-header-inner'>
          <div className='logo-and-menu-button'>
            <button className={menuToggleClasses} onClick={this.menuToggle} aria-hidden='true'>Menu</button>
            <h1>
              <img src='/assets/img/smartstart-logo-print.svg' alt='logo - parent cradling child' />
              <IndexLink to={'/'}>SmartStart</IndexLink>
            </h1>
          </div>
          <div className={loginClasses}>
            <LoginButton />
          </div>
          <div className={logoutClasses}>
            <LogoutButton />
          </div>
        </div>
        <nav className={menuClasses} data-test='main-navigation' role='navigation' aria-hidden='true'>
          <div className='page-header-inner'>
            <IndexLink to={'/'} activeClassName='active' className="home">
              <span className="home-text">Home</span>
              <span className="home-icon"></span>
            </IndexLink>
            <Link to={'/register-my-baby'} activeClassName='active'>Register your baby</Link>
            <Link to={'/services-near-me'} activeClassName='active'>Services near me</Link>
            <Link to={'/financial-help'} activeClassName='active'>Financial help</Link>
            <Link to={'/news/baby-names'} activeClassName='active'>Top baby names</Link>
            <Link to={'/support'} activeClassName='active' onClick={this.trackNeedSupportClick}>Need support?</Link>
          </div>
        </nav>
        <nav className='visuallyhidden' role='navigation'>
          <div className='page-header-inner'>
            <IndexLink to={'/'} activeClassName='active'>Home</IndexLink>
            <Link to={'/register-my-baby'} activeClassName='active'>Register your baby</Link>
            <Link to={'/services-near-me'} activeClassName='active'>Services near me</Link>
            <Link to={'/financial-help'} activeClassName='active'>Financial help</Link>
            <Link to={'/news/baby-names'} activeClassName='active'>Top baby names</Link>
            <Link to={'/support'} activeClassName='active'  onClick={this.trackNeedSupportClick}>Need support?</Link>
          </div>
        </nav>
        <div className={messageClasses}>
          <div className='page-header-inner'>
            <p dangerouslySetInnerHTML={{ __html: this.state.authErrorMessage}}></p>
            <a className='page-header-error-close' href='#' onClick={this.clearMessage}><span className='visuallyhidden'>Close message</span></a>
          </div>
        </div>
      </header>
    )
  }
}

Header.propTypes = {
  isLoggedIn: PropTypes.bool.isRequired,
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  systemAlert: PropTypes.string,
  dispatch: PropTypes.func.isRequired
}

export default connect(() => ({}))(withRouter(Header))
