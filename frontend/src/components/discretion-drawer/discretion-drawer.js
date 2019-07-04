import React, { Component } from 'react'
import { Link } from 'react-router'
import classNames from 'classnames'
import { throttle } from 'throttle-debounce'
import PropTypes from 'prop-types'
import { piwikTrackPost } from 'actions/application'
import { connect } from 'react-redux'

import './discretion-drawer.scss'

const ESCAPE_URL = 'https://stuff.co.nz'

class DiscretionDrawer extends Component {
  constructor (props) {
    super(props)

    this.state = {
      paneOpen: false,
      fixedControls: false,
      scrollFunction: throttle(300, this.checkIfShouldBeFixed).bind(this)
    }

    this.checkIfShouldBeFixed = this.checkIfShouldBeFixed.bind(this)
  }

  componentDidMount () {
    window.addEventListener('scroll', this.state.scrollFunction)
    window.setTimeout(this.checkIfShouldBeFixed, 500) // check if we should display before scroll happens
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.state.scrollFunction)
  }

  checkIfShouldBeFixed () {
    // guard so only runs if settings pane is present
    if (this.settingsElement) {
      const settingsPosition = this.settingsElement.getBoundingClientRect().top

      if (!this.state.fixedControls && settingsPosition < 0) {
        this.setState({
          fixedControls: true
        })
      } else if (this.state.fixedControls && settingsPosition >= 0) {
        this.setState({
          fixedControls: false
        })
      }
    }
  }

  onMouseEnterHandler() {
    this.setState({ paneOpen: true })
  }

  onMouseLeaveHandler() {
    this.setState({ paneOpen: false })
  }

  handleExit(e) {
    // we're replacing, to hide current location for discretion service
    e.preventDefault()
    window.location.replace(ESCAPE_URL)

    // track the event
    const piwikEvent = {
      'category': 'Quick exit drawer',
      'action': 'Click link',
      'name': 'Quick exit'
    }

    this.props.dispatch(piwikTrackPost('Quick exit drawer', piwikEvent))
  }

  trackOnlineSafetyClick() {
    const piwikEvent = {
      'category': 'Quick exit drawer',
      'action': 'Click link',
      'name': 'Online safety'
    }

    this.props.dispatch(piwikTrackPost('Online safety', piwikEvent))
  }

  render () {
    const { paneOpen, fixedControls } = this.state

    return (
      <div
        className='settings'
        ref={(ref) => { this.settingsElement = ref }}
        onMouseEnter={this.onMouseEnterHandler.bind(this)}
        onMouseLeave={this.onMouseLeaveHandler.bind(this)}
        >
        <div className={classNames('settings-pane-wrapper', { 'is-fixed': fixedControls })}>
          <div className={classNames('settings-triggers', { 'pane-open': paneOpen })}>
            <a
              href={ESCAPE_URL}
              target='_blank'
              rel='noopener noreferrer'
              onClick={this.handleExit.bind(this)}
              className={classNames('settings-trigger', 'settings-trigger-quick-exit', { 'is-open': paneOpen } )}
              aria-controls='quick-exit'
              aria-expanded={this.state.paneOpen}
            >Quick exit</a>
          </div>
          <br />
          <div className={classNames('settings-pane', 'settings-pane-need-help', {'is-open': paneOpen})}>
            <p>Click above to <strong>quickly exit</strong> to another website.</p>
            <p>If you need to hide your visit, <Link to="/online-safety" rel="noopener noreferrer" onClick={this.trackOnlineSafetyClick.bind(this)}>follow the advice here.</Link></p>
          </div>
        </div>
      </div>
    )
  }
}

DiscretionDrawer.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect(() => ({}))(DiscretionDrawer)
