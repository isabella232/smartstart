import './timeline.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { findDOMNode } from 'react-dom'
import { throttle } from 'throttle-debounce'
import Phase from 'components/timeline/phase/phase'
import TimelineNavigation from 'components/timeline/timeline-navigation/timeline-navigation'

class Timeline extends Component {
  constructor (props) {
    super(props)

    this.phaseRefs = new Map()

    this.state = {
      phaseScrollFunction: throttle(300, this.handleScroll).bind(this),
      sidebarState: 'top',
      currentPhase: 1,
    }

    this.handleScroll = this.handleScroll.bind(this)
  }

  componentDidMount () {
    window.addEventListener('scroll', this.state.phaseScrollFunction)
    window.setTimeout(this.handleScroll, 500) // check if we should display before scroll happens
  }

  componentWillUnmount () {
    window.removeEventListener('scroll', this.state.phaseScrollFunction)
  }

  handleScroll (e) {
      const sidebarElement = findDOMNode(this.sidebarElement) //eslint-disable-line react/no-find-dom-node
      const sidebarTopOffset = 160 // matching css prop
      const sidebarHeight = sidebarElement.getBoundingClientRect().height
      const timelineStart = this.timelineElement.offsetTop
      const timelineEnd = this.timelineElement.getBoundingClientRect().height + timelineStart
      const { phases } = this.props || []
      let highestSectionReached = phases[0] ? phases[0].id : 1;
      let currentScrollPos = window.pageYOffset

      // set the number to the right section
      Array.from(this.phaseRefs.values())
        .filter(phase => phase !== null)
        .some((phase) => {
          let phaseTop = findDOMNode(phase).getBoundingClientRect().top + currentScrollPos // eslint-disable-line react/no-find-dom-node

          if (currentScrollPos >= phaseTop) {
            highestSectionReached = phase.props.id
          }
        })
      this.setState({
        currentPhase: highestSectionReached
      })

      // set sidebar floating classes
      if (currentScrollPos - sidebarTopOffset < timelineStart) {
        this.setState({ sidebarState: 'top' })
      } else if (currentScrollPos + sidebarTopOffset + sidebarHeight > timelineEnd ) {
        this.setState({ sidebarState: 'end' })
      } else {
        this.setState({ sidebarState: 'sticky' })
      }

    // remove anchor if user scrolled to top of the page (checking scroll event)
    if (e && e.type === 'scroll') {
      let scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop;
      if (scrollTop === 0) {
        window.history.replaceState("", document.title, window.location.pathname + window.location.search);
      }
    }
  }

  render () {
    const { phases } = this.props
    const { currentPhase, sidebarState } = this.state

    return (
      <div id='timeline' className='timeline' data-test='timeline' ref={(ref) => { this.timelineElement = ref }}>
        <TimelineNavigation currentPhase={currentPhase} phases={phases} floatingState={sidebarState} ref={(ref) => { this.sidebarElement = ref }} />
        {phases.map((phase, index) => {
          if (!phase.elements) { phase.elements = [] } // a phase can be empty
          if (!phase.maoriLabel) { phase.maoriLabel = '' } // cope with missing maoriLabel
          return <Phase
            key={phase.id}
            id={phase.id}
            title={phase.label}
            maoriTitle={phase.maoriLabel}
            cards={phase.elements}
            number={index + 1}
            ref={(ref) => { this.phaseRefs.set(index, ref) }} />
        })}
      </div>
    )
  }
}

Timeline.propTypes = {
  phases: PropTypes.array.isRequired
}

export default Timeline
