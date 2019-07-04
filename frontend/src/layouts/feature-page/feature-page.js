import './feature-page.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Header from 'layouts/header/header'
import Footer from 'layouts/footer/footer'
import SharingPane from 'components/sharing-pane/sharing-pane'

// NOTE: feature page currently used just by baby names and piwik event records this as baby BabyNames
// if more pages used by this components, logic (and tracking logic) has to be reviewed and potentially refactored
class FeaturePage extends Component {
  componentDidMount () {
    if (!this.props.children) {
      window.location = '/'
    }
  }

  render () {
    const { isLoggedIn, authError } = this.props

    return (
      <div className='site-container-wrapper feature-page'>
        <div className='site-container'>
          <Header isLoggedIn={isLoggedIn} authError={authError} />
          <SharingPane calledFrom="Top baby names" />
          <div id='content'>
            { this.props.children }
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

FeaturePage.propTypes = {
  isLoggedIn: PropTypes.bool,
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
  children: PropTypes.object.isRequired,
  dispatch: PropTypes.func
}

export default connect(mapStateToProps)(FeaturePage)
