import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { formValueSelector } from 'redux-form'

const renderFatherText = ({ assistedHumanReproduction, assistedHumanReproductionWomanConsented, preferedTitle, capitalize }) => {
  if (assistedHumanReproduction === 'yes' && assistedHumanReproductionWomanConsented) {
    if (preferedTitle === 'mother') {
      return capitalize ? <span>Mother</span> : <span>mother</span>
    } else {
      return capitalize ? <span>Parent</span> : <span>parent</span>
    }
  }

  return capitalize ?
    <span>Father</span> :
    <span>father</span>
}

renderFatherText.propTypes = {
  assistedHumanReproduction: PropTypes.string,
  assistedHumanReproductionWomanConsented: PropTypes.bool,
  capitalize: PropTypes.bool
}

const selector = formValueSelector('registration')
const mapStateToProps = (state) => ({
  assistedHumanReproduction: selector(state, 'assistedHumanReproduction'),
  assistedHumanReproductionWomanConsented: selector(state, 'assistedHumanReproductionWomanConsented'),
  preferedTitle: selector(state, 'secondParent.preferedTitle')
})

export default connect(mapStateToProps)(renderFatherText)
