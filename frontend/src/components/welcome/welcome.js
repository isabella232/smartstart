import './welcome.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { toggleSettings, OPEN_PROFILE, CLOSE_PROFILE, OPEN_TODO, CLOSE_TODO } from 'actions/timeline'
import { piwikTrackPost } from 'actions/application'

class Welcome extends Component {
  constructor (props) {
    super(props)

    this.profileClick = this.profileClick.bind(this)
    this.todoClick = this.todoClick.bind(this)
    this.registerClick = this.registerClick.bind(this)
    this.trackJumpToTimlineClick = this.trackJumpToTimlineClick.bind(this)
  }

  profileClick (event) {
    event.preventDefault()
    this.props.dispatch(toggleSettings(OPEN_PROFILE))
    this.props.dispatch(toggleSettings(CLOSE_TODO))

    let piwikEvent = {
      'category': 'Welcome',
      'action': 'Click button',
      'name': 'Add your due date'
    }
    // track the event
    this.props.dispatch(piwikTrackPost('Welcome', piwikEvent))
  }

  todoClick (event) {
    event.preventDefault()
    this.props.dispatch(toggleSettings(OPEN_TODO))
    this.props.dispatch(toggleSettings(CLOSE_PROFILE))

    let piwikEvent = {
      'category': 'Welcome',
      'action': 'Click button',
      'name': 'Check your To Do list'
    }
    // track the event
    this.props.dispatch(piwikTrackPost('Welcome', piwikEvent))
  }

  registerClick () {
    let piwikEvent = {
      'category': 'Welcome',
      'action': 'Click button',
      'name': 'Register birth online'
    }
    // track the event
    this.props.dispatch(piwikTrackPost('Welcome', piwikEvent))
  }

  trackJumpToTimlineClick () {
    let piwikEvent = {
      'category': 'Welcome',
      'action': 'Click icon',
      'name': 'Jump to content'
    }
    // track the event
    this.props.dispatch(piwikTrackPost('Welcome', piwikEvent))
  }

  render () {
    return (
      <div className='welcome' role='banner'>
        <div className='welcome-pane-wrapper'>

          <div className='welcome-intro'>
            <h2>Nau mai ki SmartStart<br /><span className='english'>Welcome to SmartStart</span></h2>
            <p>Providing step-by-step information and support to help you access the right services for you and your baby.</p>
          </div>

          <div className="scroll-to-timeline">
            <a href="#timeline" onClick={this.trackJumpToTimlineClick}>
              <span className='visuallyhidden'>Jump to timeline</span>
            </a>
          </div>
        </div>
        <div className="spacer"></div>
      </div>
    )
  }
}

const mapStateToProps = state => ({
  personalisationValues: state.personalisation.personalisationValues || {}
})

Welcome.propTypes = {
  personalisationValues: PropTypes.object,
  dispatch: PropTypes.func
}

export default connect(mapStateToProps)(Welcome)
