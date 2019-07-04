import './logout-button.scss'

import React, { Component } from 'react'
import PropTypes, { instanceOf } from 'prop-types'
import { connect } from 'react-redux'
import { withCookies, Cookies } from 'react-cookie'

class LogoutButton extends Component {
  constructor (props) {
    super(props)

    this.logoutAction = this.logoutAction.bind(this)
  }

  logoutAction(event) {
    event.preventDefault()
    // clear the savedValues cookie

    this.props.cookies.remove('savedValues', { path: '/' })

    window.location = '/logout/'
  }

  render () {
    return (
      <a href='/logout/' onClick={this.logoutAction} className='logout' data-test='logout'>
        Logout
      </a>
    )
  }
}

function mapStateToProps () {
  return {}
}

LogoutButton.propTypes = {
  cookies: instanceOf(Cookies).isRequired,
  dispatch: PropTypes.func
}

export default connect(mapStateToProps)(withCookies(LogoutButton))
