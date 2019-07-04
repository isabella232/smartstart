import React from 'react'
import PropTypes from 'prop-types'
import renderError from './render-error'
import renderWarning from './render-warning'

const renderReviewValidation = ({ meta: { error, warning } }) => {
  return <div>
    { renderError({ meta: { touched: true, error } }) }
    { renderWarning({ meta: { error, warning } }) }
  </div>
}

renderReviewValidation.propTypes = {
  meta: PropTypes.object
}

export default renderReviewValidation
