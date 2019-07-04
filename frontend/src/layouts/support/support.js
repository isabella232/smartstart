import '../plain-layout-page.scss'
import './support.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Header from 'layouts/header/header'
import Footer from 'layouts/footer/footer'
import Supplementary from 'components/supplementary/supplementary'
import DiscretionDrawer from 'components/discretion-drawer/discretion-drawer'
import SharingPane from 'components/sharing-pane/sharing-pane'

class SupportPage extends Component {
  render () {
    const { isLoggedIn, authError, supplementary } = this.props

    return (
      <div className='site-container-wrapper support-page'>
        <div className='site-container'>
          <Header isLoggedIn={isLoggedIn} authError={authError} />
          <SharingPane calledFrom="Need support?" />

          <DiscretionDrawer />

          <div className='support-header'>
            <div className='support-header-inner'>
              <h2>
                Ina hiahia tautoko koe<br />
              <span className='english'>When you need support</span>
              </h2>
            </div>
          </div>

          <div id='content' className='plain-layout-page full-width'>
            <div className='page-content'>
              <Supplementary cards={supplementary} />
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

SupportPage.propTypes = {
  isLoggedIn: PropTypes.bool,
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  supplementary: PropTypes.array,
  dispatch: PropTypes.func
}

export default connect(mapStateToProps)(SupportPage)
