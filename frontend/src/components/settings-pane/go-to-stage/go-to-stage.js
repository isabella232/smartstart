import React, { Component } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import TIMELINE_NAVIGATION_DATA from 'components/timeline/timeline-navigation/navigation-data'

import './go-to-stage.scss'

export class NavPane extends Component {

  handleClick() {
      this.props.navPaneClose()
  }

  render () {
    const paneClasses = classNames(
      'settings-pane',
      'go-to-stage',
      { 'is-open': this.props.shown }
    )

    return (
      <div className={paneClasses} aria-hidden={!this.props.shown}>
        {TIMELINE_NAVIGATION_DATA.map((category, id) => {
          return (
            <div key={id}>
              <div className="category-title">{category.label}</div>

              {category.cards.map((navItem, index) => {
                return (
                  <div key={index} className="nav-item">
                    <a href={'#'+ navItem.id} onClick={this.handleClick.bind(this)}>{navItem.label}</a>
                    </div>
                ) })
              }
            </div>
          )
        })
      }
      </div>
    )
  }
}

NavPane.propTypes = {
  navPaneClose: PropTypes.func.isRequired,
  shown: PropTypes.bool.isRequired
}

export default NavPane
