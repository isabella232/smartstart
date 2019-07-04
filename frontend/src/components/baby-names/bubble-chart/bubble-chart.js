import './bubble-chart.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { findDOMNode } from 'react-dom'
import chart from 'components/baby-names/bubble-chart/chart'

class BubbleChart extends Component {
  constructor (props) {
    super(props)

    this.componentDidMount = this.componentDidMount.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
  }

  componentDidMount () {
    const { data, category, year, language } = this.props

    if (data && data[category] && data[category][year]) {
      let container = findDOMNode(this)
      chart.create(
        container,
        {
          'name': category + year,
          'children': data[category][year],
          'language': language
        },
        {
          'spacing': 5
        }
      )
    }
  }

  componentDidUpdate () {
    const { data, category, year, language } = this.props

    if (data && data[category] && data[category][year]) {
      chart.draw({'name': category + year, 'children': data[category][year], 'language': language})
    }
  }

  componentWillUnmount () {
    chart.destroy()
  }

  render () {
    return (
      <div className='bubble-chart-container'></div>
    )
  }
}

BubbleChart.propTypes = {
  data: PropTypes.object.isRequired,
  category: PropTypes.string.isRequired,
  year: PropTypes.string.isRequired,
}

export default BubbleChart
