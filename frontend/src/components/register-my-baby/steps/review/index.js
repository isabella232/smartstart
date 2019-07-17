import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import {
  Field, reduxForm, getFormValues, getFormSyncErrors,
  getFormSubmitErrors, getFormSyncWarnings, SubmissionError
} from 'redux-form'
import get from 'lodash/get'
import renderStep1Review from './step1'
import renderStep2Review from './step2'
import renderStep3Review from './step3'
import renderStep4Review from './step4'
import renderStep5Review from './step5'
import renderStep6Review from './step6'
import renderStep7Review from './step7'
import renderTextarea from 'components/form/fields/render-textarea'
import renderCheckbox from 'components/form/fields/render-checkbox'
import renderRadioGroup from 'components/form/fields/render-radio-group'
import renderField from 'components/form/fields/render-field'
import renderError from 'components/form/fields/render-error'
import { yesNo as yesNoOptions } from '../../options'
import { required, email } from '../../validate'
import {
  REQUIRE_DECLARATION
} from '../../validation-messages'
import Spinner from 'components/spinner/spinner'
import { maxLength } from 'components/form/normalizers'
import { fetchCountries } from 'actions/birth-registration'
import { validCharRelax } from '../../validate'
import { validateOnly } from '../../submit'
import './review.scss'

class Review extends Component {
  constructor(props) {
    super(props)
    this.state = {
      validating: true,
      genericError: null,
      connectionError: null
    }
    this.retryConnection = this.retryConnection.bind(this)
    this.onValidate = this.onValidate.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentDidMount() {
    if (this.props.initialized) {
      this.props.handleSubmit(this.onValidate)();
    }
  }

  componentDidUpdate(prevProps) {
    // revalidate form when we receive data from the backend
    if (!prevProps.initialized && this.props.initialized) {
      this.props.handleSubmit(this.onValidate)();
    }

    if (this.props.onSubmitFail) {
      this.focusOnFirstError()
    }
  }

  // most review fields don't have input fields
  // and require users to click edit button to navigate
  // that's why we had to use this solution
  focusOnFirstError() {
    // const fieldErrorNode = document.querySelector('.review-field .error, .review-subfield .error, .general-error')

    // scroll if form has field errors
    const fieldErrorNode = document.querySelector('.review-field .error, .review-subfield .error')
    if (fieldErrorNode) {
      const reviewFieldNode = get(fieldErrorNode, 'parentNode.parentNode')

      if (reviewFieldNode) {
        reviewFieldNode.scrollIntoView({ behavior: 'smooth', 'inline': 'nearest' })
      }
    } else {
      // scroll if form has generic errors
      const genericErrorNode = document.querySelector('.generic-error')
      if (genericErrorNode) {
        genericErrorNode.scrollIntoView({ behavior: 'smooth', 'inline': 'nearest' })
      }
    }
  }

  retryConnection() {
    this.props.handleSubmit(this.onValidate)();
  }

  onValidate() {
    return validateOnly(this.props.formState)
      .then(() => {
        this.setState({
          validating: false,
          genericError: null,
          connectionError: null
        })
      })
      .catch((err) => {
        this.setState({
          validating: false,
          genericError: err.errors._error,
          connectionError: err.errors._connection_error
        })

        throw err
      })
  }

  onSubmit() {
    if (!this.props.formState.declarationMade) {
      throw new SubmissionError({
        declarationMade: REQUIRE_DECLARATION
      });
    }

    return this.props.onSubmit();
  }

  render() {
    const {
      countries, formState, submitErrors, syncWarnings, isRedirecting,
      handleSubmit, submitting, error, onPrevious, onFieldEdit
    } = this.props

    const { genericError, connectionError } = this.state

    if (connectionError) {
      return <div className="unavailable-notice">
        <h2>Sorry!</h2>
        <div className="informative-text">
          It looks like we are unable to connect right now. We're working on getting back online as soon as possible. Wait a couple of minutes and <Link to={'/register-my-baby/review'} onClick={this.retryConnection}>retry</Link> the connection.
        </div>
      </div>
    }

    let declarationText = 'We, as the parents named on this notification, jointly submit this true and correct notification of the birth of our child for registration we both understand that it is an offence to provide false information – that every person who commits such an offence is liable on conviction to imprisonment for a term not exceeding 5 years.'

    if (
      formState.fatherKnown === 'no' ||
      (formState.assistedHumanReproduction === 'yes' && formState.assistedHumanReproductionSpermDonor)
    ) {
      declarationText = 'I, as the parent named on this notification, submit this true and correct notification of the birth of my child for registration and I understand that it is an offence to provide false information – that every person who commits such an offence is liable on conviction to imprisonment for a term not exceeding 5 years.'
    }

    return (
      <div id="step-review">
        <h2 className="step-heading">
          <span className="visuallyhidden">Step</span>
          <span className="step-number">{MYIR_ENABLED ? 8 : 7}</span>
          Arotake <br />
          <span className="english">Review</span>
        </h2>
        <div className="instruction">
          Before you send the baby's details in to us for registration, take a minute to check that all the details you've put in are correct.
        </div>
        <div className="informative-text intro">
          Clicking the 'Register this birth' button at the bottom of this page will send the information through to the Registry of Births, Deaths and Marriages for registration.<br /><br />
          Check the information you're sending carefully. The Registry may make enquiries to be sure that the details provided are correct, and you may have to provide further information.
        </div>
        {(this.state.validating || submitting || isRedirecting) ?
          <Spinner text="Checking your application ..." /> :
          <form onSubmit={handleSubmit(this.onSubmit)}>
            {(error || genericError) &&
              <div className="general-error">
                {renderError({ meta: { touched: true, error: error || genericError } })}
              </div>
            }

            {renderStep1Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit })}
            {renderStep2Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit })}
            {renderStep3Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit })}
            {renderStep4Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit })}
            {renderStep5Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit })}
            {MYIR_ENABLED && renderStep6Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit })}
            {renderStep7Review({ formState, submitErrors, warnings: syncWarnings, onEdit: onFieldEdit, countries })}


            <div>
              <Field
                name="confirmationEmail"
                type="text"
                label="Do you want to be emailed a confirmation of your birth registration submission?"
                component={renderRadioGroup}
                validate={[required]}
                options={yesNoOptions}
              />
            </div>

            {formState.confirmationEmail === 'yes' && (
              <div className="conditional-field">
                <div className="instruction-text">
                  Please provide an email address we can send the confirmation to.
                </div>
                <Field
                  name="confirmationEmailAddress"
                  type="text"
                  label="Email"
                  validate={[required, email]}
                  component={renderField}
                />
              </div>
            )}
            <Field
              name="declarationMade"
              label={declarationText}
              component={renderCheckbox}
            />

            <Field
              label="Any other information you want to advise us of? (600 characters)"
              name="otherInformation"
              component={renderTextarea}
              validate={[validCharRelax]}
              normalize={maxLength(600)}
            />

            {error &&
              <div className="general-error">
                {renderError({ meta: { touched: true, error } })}
              </div>
            }

            <div className="form-actions bro-form-actions">
              <button type="button" className="previous" onClick={onPrevious}>Back</button>
              <button type="submit" className="next" disabled={submitting}>Register this birth</button>
            </div>
          </form>
        }
      </div>
    )
  }
}

Review.propTypes = {
  countries: PropTypes.array,
  formState: PropTypes.object.isRequired,
  syncErrors: PropTypes.object,
  submitErrors: PropTypes.object,
  syncWarnings: PropTypes.object,
  handleSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  isRedirecting: PropTypes.bool,
  error: PropTypes.string,
  onSubmit: PropTypes.func,
  onValidate: PropTypes.func,
  onPrevious: PropTypes.func,
  onFieldEdit: PropTypes.func,
  dispatch: PropTypes.func,

  isValidating: PropTypes.bool,
  fetchCountries: PropTypes.func
}

Review = reduxForm({
  form: 'registration',
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true
})(Review)

Review = connect(
  state => ({
    initialValues: get(state, 'birthRegistration.savedRegistrationForm.data'),
    formState: getFormValues('registration')(state) || {},
    syncErrors: getFormSyncErrors('registration')(state),
    submitErrors: getFormSubmitErrors('registration')(state),
    syncWarnings: getFormSyncWarnings('registration')(state),
    isValidating: get(state, 'birthRegistration.isValidating'),
    countries: get(state, 'birthRegistration.countries')
  }),
  {
    fetchCountries
  }
)(Review)

export default Review
