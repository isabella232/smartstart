import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router'
import { piwikTrackPost } from 'actions/application'
import { connect } from 'react-redux'

import './footer.scss'

class Footer extends Component {
  constructor (props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick() {
    let piwikEvent = {
      'category': 'Footer',
      'action': 'Click link',
      'name': 'Online safety'
    }
    // track the event
    this.props.dispatch(piwikTrackPost('Footer', piwikEvent))
  }

  render () {
    return (
      <footer id='bottom' className='page-footer'>
        <span className='page-footer-curve' />
        <div className='page-footer-inner-wrap'>
          <div className='page-footer-inner'>
            <ul role='contentinfo'>
              <li><Link to={'/online-safety/'} onClick={this.handleClick}>Online safety</Link></li>
              <li><Link to={'/contact-us/'}>Contact us</Link></li>
              <li><Link to={'/your-privacy/'}>Your privacy</Link></li>
              <li><Link to={'/copyright-and-attribution/'}>Copyright and attribution</Link></li>
            </ul>
            <p className='nz-govt'>
              <a href='https://www.govt.nz/'><img src='/assets/img/nz-govt-logo-black.svg' alt='New Zealand Government' /><span className='visuallyhidden focusable'>New Zealand Government</span></a>
            </p>
          </div>
        </div>
      </footer>
    )
  }
}

Footer.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect(() => ({}))(Footer)
