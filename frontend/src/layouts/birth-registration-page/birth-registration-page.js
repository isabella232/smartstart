import '../plain-layout-page.scss'
import './birth-registration-page.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { withRouter } from 'react-router'
import Header from 'layouts/header/header'
import Footer from 'layouts/footer/footer'
import { checkOutages } from 'utils'
import SharingPane from 'components/sharing-pane/sharing-pane'

class BirthRegistrationPage extends Component {
  render() {
    const { isLoggedIn, authError, params } = this.props

    const isBroForm = params && Object.keys(params).includes('stepName');

    return (
      <div className='site-container-wrapper birth-registration-page'>
        <div className='site-container'>
          <Header isLoggedIn={isLoggedIn} authError={authError} systemAlert={checkOutages('bro')} />
          {!isBroForm && <SharingPane calledFrom="RegisterMyBaby" />}
          <div id='content' className="plain-layout-page">
            <div className="page-content">
              {this.props.children}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}

function mapStateToProps() {
  return {}
}

BirthRegistrationPage.propTypes = {
  isLoggedIn: PropTypes.bool,
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  children: PropTypes.object.isRequired,
  dispatch: PropTypes.func
}

export default withRouter(connect(mapStateToProps)(BirthRegistrationPage))
