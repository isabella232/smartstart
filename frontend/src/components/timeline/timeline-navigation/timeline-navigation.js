import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import TIMELINE_NAVIGATION_DATA from './navigation-data'
import './timeline-navigation.scss'

export class TimelineNavigation extends Component {

  getNavItems() {
    return TIMELINE_NAVIGATION_DATA
  }

  render () {
    const { phases, currentPhase, floatingState } = this.props
    const navigation = this.getNavItems(phases)
    let timelineClasses = classNames(
      'timeline-navigation',
      {'is-fixed': floatingState === 'sticky'},
      {'end-reached': floatingState === 'end'},
      {'top': floatingState === 'top'}
    )

    return (
      <div className={timelineClasses}>
        <ul>
          {navigation.map((category, id) => {
            return (
              <li key={`nav-phase-${id}`} className="nav-phase-category">
                <a href={"#" + category.id} className="nav-phase-title">
                  <span> {category.label} </span>
                </a>
                <ul>
                  {category.cards.map((navItem, id) => {
                    let itemClasses = classNames(
                      'nav-phase-item',
                      { 'active': currentPhase === navItem.id }
                    )

                    return (
                      <li key={id} className={itemClasses}>
                        <a href={"#" + navItem.id}>
                          <span> {navItem.label} </span>
                          <span className="nav-phase-dot"></span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </li>
            )
          })}
          <li className="back-to-top">
            <a href="#app">
              <span>Back to top</span>
            </a>
          </li>
        </ul>
      </div>
    )
  }
}


TimelineNavigation.propTypes = {
  phases: PropTypes.array,
  currentPhase: PropTypes.number,
  floatingState: PropTypes.string
}

export default TimelineNavigation
