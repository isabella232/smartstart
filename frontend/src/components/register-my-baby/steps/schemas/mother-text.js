import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { formValueSelector } from 'redux-form'

const renderMotherText = ({ assistedHumanReproduction, assistedHumanReproductionWomanConsented, preferedTitle, capitalize, possessive, stripApostrophe }) => {
  let title = 'mother'
  const isMotherMother = assistedHumanReproduction === 'yes' && assistedHumanReproductionWomanConsented && preferedTitle === 'mother'

  if (isMotherMother) {
    title = 'mother who gave birth'
  }

  if (capitalize) {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  if (possessive) {
    title = title + '\'s';

    // Special case requested by DIA, in some situations for mother who gave birth title
    // print it without an apostrophe
    if (stripApostrophe && isMotherMother) {
      title = title.slice(0, -2)
    }
  }


  return <span>{title}</span>
}

renderMotherText.propTypes = {
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

export default connect(mapStateToProps)(renderMotherText)
