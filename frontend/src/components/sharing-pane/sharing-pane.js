import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { piwikOutlinkTrack } from 'actions/piwik'
import { piwikTrackPost } from 'actions/application'
import './sharing-pane.scss'

const URLS = {
  facebook: 'https://www.facebook.com/sharer/sharer.php?u=',
  twitter: 'https://twitter.com/intent/tweet?text=',
  email: 'mailto:?subject=Found%20this%20on%20SmartStart&body=',
  survey: 'https://www.getfeedback.com/r/vMkmjW5j'
}

class SharingPane extends Component {
  constructor (props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
    this.registerPiwikEvent = this.registerPiwikEvent.bind(this)
  }

  registerPiwikEvent(sharingOption) {
    const piwikEvent = {
      category: this.props.calledFrom,
      action: 'Click link',
      name: `Shares to ${sharingOption}`
    }
    // track the event
    this.props.dispatch(piwikTrackPost(this.props.calledFrom, piwikEvent))

    // match standard piwik outlink delay
    window.setTimeout(() => {
      window.location.href = URLS[sharingOption] + window.location.href
    }, 200)
  }

  handleClick(e, sharingOption) {
    switch(sharingOption) {
      case 'facebook':
      case 'twitter':
      case 'email':
        e.preventDefault()
        this.registerPiwikEvent(sharingOption)
        break;
      default:
        piwikOutlinkTrack(e, this.props.dispatch)

    }
  }

  getSharingUrl(service) {
    switch (service) {
      case 'survey':
        return URLS[service]
      case 'facebook':
      case 'twitter':
      case 'email':
      default:
        return URLS[service] + window.location.href
    }
  }

  render () {
    return (
      <div className="sharing-wrapper">
        <div className='social-media-wrapper'>
          <a onClick={e => this.handleClick(e, 'facebook')} href={this.getSharingUrl('facebook')} title='Share on Facebook' className='media-button facebook'></a>
          <a onClick={e => this.handleClick(e, 'twitter')} href={this.getSharingUrl('twitter')} title='Share on Twitter' className='media-button twitter'></a>
          <a onClick={e => this.handleClick(e, 'email')} href={this.getSharingUrl('email')} title='Share via email' className='media-button email'></a>
        </div>
        <a onClick={e => this.handleClick(e, 'survey')} href={URLS['survey']} className='feedback-button' title='Give us feedback'>
          <span className='feedback-short'>Feedback</span>
          <span className='feedback-long'>Give us your feedback</span>
        </a>
      </div>
    )
  }
}

SharingPane.propTypes = {
  calledFrom: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired
}

export default connect(() => ({}))(SharingPane)
