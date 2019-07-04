import '../plain-layout-page.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Header from 'layouts/header/header'
import Footer from 'layouts/footer/footer'
import SharingPane from 'components/sharing-pane/sharing-pane'

import './entitlements.scss'

class EntitlementsPage extends Component {
  render () {
    const { isLoggedIn, authError } = this.props

    return (
      <div className='site-container-wrapper'>
        <div className='site-container'>
          <Header isLoggedIn={isLoggedIn} authError={authError} />
          <SharingPane calledFrom="Financial help" />
          <div className='entitlements-header'>
            <div className='entitlements-header-inner'>
              <h2>
                Tirohia ngā āwhina ā-pūtea ka taea<br />
                <span className='english'>See what financial help is available</span>
              </h2>
            </div>
          </div>
          <div id='content' className='plain-layout-page full-width entitlements-page'>
            <div className='page-content'>
              { this.props.children }
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

EntitlementsPage.propTypes = {
  children: PropTypes.object.isRequired,
  isLoggedIn: PropTypes.bool,
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  dispatch: PropTypes.func
}

export default connect(mapStateToProps)(EntitlementsPage)
