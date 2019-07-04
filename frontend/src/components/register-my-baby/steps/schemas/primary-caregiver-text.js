import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { formValueSelector } from 'redux-form'
import { capitalizeWordsAll } from 'utils'
import { getSecondParentTitle  } from 'components/register-my-baby/helpers'

const renderPrimaryCaregiverText = ({ primaryCareGiver, assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, secondParentPreferedTitle, fatherKnown , capitalize }) => {
  let pcgTitle

  switch (primaryCareGiver) {
    case 'mother':
      pcgTitle = assistedHumanReproductionWomanConsented && secondParentPreferedTitle === 'mother' ? 'mother who gave birth' : 'mother'
      break;
    case 'father':
      pcgTitle = getSecondParentTitle(assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, secondParentPreferedTitle, fatherKnown)
      break;
    default:
      pcgTitle = 'primary care giver'
  }

  return capitalize ? <span>{capitalizeWordsAll(pcgTitle)}</span> : <span>{pcgTitle}</span>
}

renderPrimaryCaregiverText.propTypes = {
  primaryCareGiver: PropTypes.string,
  assistedHumanReproduction: PropTypes.string,
  assistedHumanReproductionWomanConsented: PropTypes.bool,
  assistedHumanReproductionManConsented: PropTypes.bool,
  secondParentPreferedTitle: PropTypes.string,
  fatherKnown: PropTypes.string,
  capitalize: PropTypes.bool
}

const selector = formValueSelector('registration')
const mapStateToProps = (state) => ({
  primaryCareGiver: selector(state, 'bestStart.primaryCareGiver.type'),
  assistedHumanReproduction: selector(state, 'assistedHumanReproduction'),
  assistedHumanReproductionWomanConsented: selector(state, 'assistedHumanReproductionWomanConsented'),
  assistedHumanReproductionManConsented: selector(state, 'assistedHumanReproductionManConsented'),
  fatherKnown: selector(state, 'fatherKnown'),
  secondParentPreferedTitle: selector(state, 'secondParent.preferedTitle')
})

export default connect(mapStateToProps)(renderPrimaryCaregiverText)
