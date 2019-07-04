import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import classNames from 'classnames'
import { throttle } from 'throttle-debounce'
import { toggleSettings, OPEN_PROFILE, CLOSE_PROFILE, OPEN_TODO, CLOSE_TODO, OPEN_NAV, CLOSE_NAV, CLOSE_ALL_DRAWERS } from 'actions/timeline'
import { piwikTrackPost } from 'actions/application'
import MyProfile from 'components/settings-pane/my-profile/my-profile'
import TodoList from 'components/settings-pane/todo-list/todo-list'
import NavPane from 'components/settings-pane/go-to-stage/go-to-stage'
import onClickOutside from "react-onclickoutside";

import './settings-pane.scss'
import './button-set.scss' // used in both child components

class SettingsPane extends Component {
  constructor (props) {
    super(props)

    this.state = {
      fixedControls: false,
      scrollFunction: throttle(300, this.checkIfShouldBeFixed).bind(this)
    }

    this.navPaneClose = this.navPaneClose.bind(this)
    this.profilePaneClose = this.profilePaneClose.bind(this)
    this.todoPaneClose = this.todoPaneClose.bind(this)
    this.checkIfShouldBeFixed = this.checkIfShouldBeFixed.bind(this)
    this.handleClickOutside = this.handleClickOutside.bind(this)
  }

  componentDidMount () {
    window.addEventListener('scroll', this.state.scrollFunction)
    window.setTimeout(this.checkIfShouldBeFixed, 500) // check if we should display before scroll happens
    document.addEventListener('mousedown', this.handleClickOutside)
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.state.scrollFunction)
    document.removeEventListener('mousedown', this.handleClickOutside)
  }

  handleClickOutside(event) {
    if (this.settingsElement && !this.settingsElement.contains(event.target)) {
      this.closePane()
    }
  }

  closePane() {
      this.props.dispatch(toggleSettings(CLOSE_ALL_DRAWERS))
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

  navPaneToggle () {
    // if opening, close the other pane
    if (this.props.navPaneOpen === false) {
      this.props.dispatch(toggleSettings(OPEN_NAV))

      // tracking
      let piwikEvent = {
        'category': 'Drawer',
        'action': 'Opened',
        'name': 'Go to stage'
      }

      this.props.dispatch(piwikTrackPost('Drawer', piwikEvent))
    } else {
      this.props.dispatch(toggleSettings(CLOSE_NAV))
    }
  }

  profilePaneToggle () {
    // if opening, close the other pane
    if (this.props.profilePaneOpen === false) {
      this.props.dispatch(toggleSettings(OPEN_PROFILE))

      // tracking
      let piwikEvent = {
        'category': 'Drawer',
        'action': 'Opened',
        'name': 'Your profile'
      }

      this.props.dispatch(piwikTrackPost('Drawer', piwikEvent))
    } else {
      this.props.dispatch(toggleSettings(CLOSE_PROFILE))
    }
  }

  todoPaneToggle () {
    // if opening, close the other pane
    if (this.props.todoPaneOpen === false) {
      this.props.dispatch(toggleSettings(OPEN_TODO))

      // tracking
      let piwikEvent = {
        'category': 'Drawer',
        'action': 'Opened',
        'name': 'To Do list'
      }

      this.props.dispatch(piwikTrackPost('Drawer', piwikEvent))
    } else {
      this.props.dispatch(toggleSettings(CLOSE_TODO))
    }
  }

  navPaneClose () {
    this.props.dispatch(toggleSettings(CLOSE_NAV))
  }

  profilePaneClose () {
    this.props.dispatch(toggleSettings(CLOSE_PROFILE))
  }

  todoPaneClose () {
    this.props.dispatch(toggleSettings(CLOSE_TODO))
  }

  render () {
    let paneWrapperClasses = classNames(
      'settings-pane-wrapper',
      { 'is-fixed': this.state.fixedControls }
    )
    let triggersWrapperClasses = classNames(
      'settings-triggers',
      { 'pane-open': this.props.profilePaneOpen || this.props.todoPaneOpen || this.props.navPaneOpen }
    )
    let triggerNavClasses = classNames(
      'settings-trigger',
      'settings-trigger-go-to-stage',
      { 'is-open': this.props.navPaneOpen }
    )
    let triggerProfileClasses = classNames(
      'settings-trigger',
      'settings-trigger-my-profile',
      { 'is-open': this.props.profilePaneOpen }
    )
    let triggerTodoClasses = classNames(
      'settings-trigger',
      'settings-trigger-todo-list',
      { 'is-open': this.props.todoPaneOpen }
    )

    return (
      <div className='settings' ref={(ref) => { this.settingsElement = ref }} role='form'>
        <div className={paneWrapperClasses}>
          <div className={triggersWrapperClasses}>
            <button
              className={triggerNavClasses}
              aria-controls='go-to-stage'
              aria-expanded={this.props.navPaneOpen}
              onClick={this.navPaneToggle.bind(this)}
            >Go to stage</button>
            <button
              className={triggerProfileClasses}
              aria-controls='my-profile'
              aria-expanded={this.props.profilePaneOpen}
              onClick={this.profilePaneToggle.bind(this)}
            >Your profile</button>
            <button
              className={triggerTodoClasses}
              aria-controls='todo-list'
              aria-expanded={this.props.todoPaneOpen}
              onClick={this.todoPaneToggle.bind(this)}
            >To Do list</button>
          </div>
          <br />
          <NavPane shown={this.props.navPaneOpen} navPaneClose={this.navPaneClose} />
          <MyProfile shown={this.props.profilePaneOpen} profilePaneClose={this.profilePaneClose} />
          <TodoList shown={this.props.todoPaneOpen} todoPaneClose={this.todoPaneClose} />
        </div>
      </div>
    )
  }
}

function mapStateToProps (state) {
  const {
    timeline
  } = state
  const {
    navPaneOpen,
    profilePaneOpen,
    todoPaneOpen
  } = timeline || {
    navPaneOpen: false,
    profilePaneOpen: false,
    todoPaneOpen: false
  }

  return {
    navPaneOpen,
    profilePaneOpen,
    todoPaneOpen
  }
}

SettingsPane.propTypes = {
  navPaneOpen: PropTypes.bool.isRequired,
  profilePaneOpen: PropTypes.bool.isRequired,
  todoPaneOpen: PropTypes.bool.isRequired,
  dispatch: PropTypes.func
}


export default connect(mapStateToProps)(onClickOutside(SettingsPane))
