import React, { Component } from 'react'
import PropTypes from 'prop-types'
import './spinner.scss'

class Spinner extends Component {
  render () {
    const { text = 'Loading content' } = this.props
    return (
      <p className='spinner' data-test='spinner'>{text}</p>
    )
  }
}

Spinner.propTypes = {
  text: PropTypes.string
}

export default Spinner
