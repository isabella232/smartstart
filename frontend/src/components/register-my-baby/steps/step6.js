import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector, SubmissionError } from 'redux-form'
import moment from 'moment'
import schema from './schemas/step6'
import isEmpty from 'lodash/isEmpty'
import set from 'lodash/set'
import get from 'lodash/get'
import { isBestStartEligible, MYIR_STATES } from '../best-start-utils'
import SaveAsDraft from '../save-as-draft'
import { checkMyIRAvailability, validatePcgDetails, submitMyIRReservation, changeField, resetField } from 'actions/birth-registration'
import makeFocusable from 'components/form/hoc/make-focusable'
import getFieldProps from 'components/form/get-field-props'
import Accordion from 'components/form/accordion'
import Spinner from 'components/spinner/spinner'
import Warning from 'components/form/fields/render-warning'
import validate from './validation'
import { INVALID_MESSAGE_MYIR_RESERVE } from '../validation-messages'
import { asyncValidate } from './validation/step6'
import './step6.scss'


const HAS_LOGON_MESSAGE = (
  <div>
    There is a myIR account associated with your IRD number.
    You should be able to use your existing account to manage your Best Start payments, and if you're not sure how to access your myIR account then call IR on 0800 227 770.
  </div>
)
const MYIR_UNAVAILABLE_MESSAGE = (
  <div>
    We're sorry but the option to set up a myIR account to manage your Best Start payments is unavailable at the moment. Please continue your birth registration by clicking '<strong>Next</strong>'.
  </div>
)
const MYIR_INVALID_DETAILS_WARNING = (
  <div>
    The details you provided do not match the details that
    Inland Revenue have about you. You may need to go back and check the details you provided
    in the birth registration, or call IR on 0800 227 770, or you can skip this section and continue
    with the birth registration.
  </div>
)
const MYIR_EXISTING_ACCOUNT_WARNING = (
  <div>
    There is already a myIR account associated with this IRD number.
    You should be able to use your existing account to manage your Best Start payments,
    and if you're not sure how to access your myIR account then call IR on 0800 227 770 to discuss.
    Please skip this section and continue with the birth registration by clicking Next below.
  </div>
)
const MYIR_NOCONSENT_WARNING = (
  <div>
    We cannot create a myIR account without checking your details first.
    If you would rather not set up a myIR account at this time then please skip this section and
    continue with the birth registration by clicking Next below.
  </div>
)
const MSD_CLIENT_MESSAGE = (
  <div className="informative-text">
    <p>You indicated that you receive a main benefit from Ministry of Social Development (MSD), so you will receive your Best Start payments from MSD. </p>
    <p>To manage your Best Start payments, for example to update your details if they change, you can use your MyMSD or contact MSD.</p>
    <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
  </div>
)
const WFF_CLIENT_MESSAGE = (
  <div className="informative-text">
    <p>You indicated that you are currently receiving Working for Families tax credits from Inland Revenue, so you do not need to complete this step.</p>
    <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
  </div>
)
const UNKNOWN_CLIENT_MESSAGE = (
  <div className="informative-text">
    <p>You indicated that the child’s principle caregiver is unknown, so you do not need to complete this step.</p>
    <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
  </div>
)
const OTHER_CLIENT_MESSAGE = (
  <div className="informative-text">
    <p>You indicated that the child’s principal caregiver is 'Other', so you do not need to complete this step. Inland Revenue will use the contact details you provided for the child's principal caregiver to arrange Best Start payments with them.</p>
    <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
  </div>
)
const INELIGIBLE_CLIENT_MESSAGE = (
  <div className="informative-text">
    <p>You were ineligible to apply for Best Start Payments for your child, so you do not need to complete this step.</p>
    <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
  </div>
)
const BS_NO_CLIENT_MESSAGE = (
  <div className="informative-text">
    <p>You indicated that you don't want to receive Best Start payments - are you sure?</p>
    <p>You are entitled to receive $60 a week until your baby turns one, no matter what you earn, if:</p>
    <ul>
      <li>your baby was born, or due, after 30 June 2018</li>
      <li>you’re a New Zealand resident</li>
      <li>you're over 16 years old</li>
    </ul>
    <p>If you definitely do not want to receive Best Start payments you do not need to complete this step.</p>
    <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
  </div>
)

class MyIRForm extends Component {
  constructor(props) {
    super(props)
    this.state = {}

    this.handleNext = this.handleNext.bind(this)
    this.handleToReview = this.handleToReview.bind(this)
    this.handleReserveUsername = this.handleReserveUsername.bind(this)
  }

  componentDidMount() {
    if (!isEmpty(this.props.broForm)) {
      this.formDidInitialize()
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (isEmpty(this.props.broForm) && !isEmpty(nextProps.broForm)) {
      this.formDidInitialize(nextProps)
    }

    if (this.props.detailsConsent !== nextProps.detailsConsent) {
      const { firstNames, lastName, irdNumber, dateOfBirth, detailsConsent } = nextProps
      if (detailsConsent === 'yes') {
        this.props.validatePcgDetails({
          'first-name': firstNames,
          'last-name': lastName,
          'ir-number': irdNumber,
          'date-of-birth': dateOfBirth
        })
      } else {
        this.props.resetField('myir.detailsStatus')
        this.props.resetField('myir.username')
        this.props.resetField('myir.usernameStatus')
        this.props.resetField('myir.reserveStatus')
      }
    }
  }

  formDidInitialize(props = this.props) {
    this.setPcgDetails(props)
    this.setClientType(props)
    this.props.checkMyIRAvailability()
  }

  setClientType(props) {
    const { child, mother, father, bestStart } = props.broForm
    const { primaryCareGiver: pcg } = bestStart || {}

    // decide whether to display MyIR form or not
    const isEligible = isBestStartEligible({ child, mother, father, bestStart })
    const isNewClient = bestStart.wanted === 'yes' &&
                        isEligible &&
                        pcg.type !== 'unknown' && pcg.type !== 'other' &&
                        pcg.isMSDClient !== 'yes' && pcg.isGettingWorkingForFamilies !== 'yes'
    const hasLogon = get(props, 'myir.detailsStatus') === 'has-logon'


    let clientType

    if (hasLogon) {
      clientType = MYIR_STATES.HAS_LOGON
    } else if (bestStart.wanted === 'no') {
      clientType = MYIR_STATES.BESTSTART_NO
    } else {
      if (bestStart.wanted === 'yes') {
        if (pcg.isMSDClient === 'yes') { clientType = MYIR_STATES.MSD_CLIENT }
        if (pcg.isGettingWorkingForFamilies === 'yes') { clientType = MYIR_STATES.WFF_CLIENT }
        if (!isEligible) { clientType = MYIR_STATES.INELIGIBLE}
        if (pcg.type === 'other' || pcg.type === 'unknown') { clientType = pcg.type }

        if (isNewClient) { clientType = MYIR_STATES.NEW }
      }
    }

      this.props.changeField('myir.clientType', clientType)
    // need to refresh wanted field (in case user modified answers on other tabs)
    if (clientType !== 'new') {
      this.props.changeField('myir.wanted', 'n.a.')
    }
  }

  setPcgDetails(props) {
    const pcgType = get(props, 'broForm.bestStart.primaryCareGiver.type')
    const reserveStatus = get(props, 'reserveStatus')

    const firstNames = get(props, `broForm.${pcgType}.firstNames`)
    const lastName = get(props, `broForm.${pcgType}.surname`)
    const dateOfBirth = moment(get(props, `broForm.${pcgType}.dateOfBirth`)).format('YYYY-MM-DD')
    let irdNumber = get(props, 'broForm.bestStart.primaryCareGiver.irdNumber', '')

    // for myIR service we have to prepend 8 digit IRD numbers with leading 0
    // because their API expects only 9 digit IRD numbers
    if (irdNumber.length === 8) {
      irdNumber = '0' + irdNumber
    }

    this.props.changeField('myir.firstNames', firstNames)
    this.props.changeField('myir.lastName', lastName)
    this.props.changeField('myir.dateOfBirth', dateOfBirth)
    this.props.changeField('myir.irdNumber', irdNumber)
    this.props.changeField('myir.pcgType', pcgType)

    // pull email address ONLY if field is empty
    if (!this.props.email) {
      this.props.changeField('myir.email', get(props, `broForm.${pcgType}.email`))
    }

    if (reserveStatus !== 'reserved' || props.pcgType !== pcgType) {
      // if pcg details changes, reset consent field
      if (props.firstNames !== firstNames || props.lastName !== lastName || props.dateOfBirth !== dateOfBirth || props.irdNumber !== irdNumber) {
        this.props.resetField('myir.detailsConsent')
        this.props.resetField('myir.detailsStatus')
        this.props.resetField('myir.username')
        this.props.resetField('myir.usernameStatus')
        this.props.resetField('myir.reserveStatus')
      }
    }
  }

  handleReserveUsername(values) {
    const notification = get(values, 'myir.notifyByText') === 'yes' ? 'EmailSMS' : 'Email'

    let data = {
      'ir-number': get(values, 'myir.irdNumber'),
      'first-name': get(values, 'myir.firstNames'),
      'last-name': get(values, 'myir.lastName'),
      'user-id': get(values, 'myir.username'),
      'email': get(values, 'myir.email'),
      'notification': notification
    }

    // conditionally include phone number
    if (notification === 'EmailSMS') {
      data.phone = get(values, 'myir.mobile')
    }

    return this.props.submitMyIRReservation(data).then(() => this.props.onSaveFormState())
  }

  validateOnSubmit(values) {
    const myir = get(values, 'myir') || {}

    if (myir.available && myir.wanted === 'yes' && myir.detailsConsent === 'yes' && myir.usernameStatus === 'available' && myir.reserveStatus !== 'reserved') {
      const error = set({}, 'myir.reserveStatus', INVALID_MESSAGE_MYIR_RESERVE)
      throw new SubmissionError(error)
    } else {
      return true
    }

  }

  handleNext(values) {
    if (this.validateOnSubmit(values)) {
      this.props.onNext()
    }
  }

  handleToReview(values) {
    if (this.validateOnSubmit(values)) {
      this.props.onComebackToReview()
    }
  }

  renderTabHeader() {
    return (
      <h2 className="step-heading">
        <span className="visuallyhidden">Step</span>
        <span className="step-number">6</span>Whakahaerehia nga utu utu pai<br/>
        <span className="english">Manage your Best Start payments</span>
      </h2>
    )
  }

  renderStillBirth() {
    const { clientType, reserveStatus, handleSubmit } = this.props

    return  (
      <form onSubmit={handleSubmit(this.handleNext)}>
        {this.renderTabHeader()}

        <div className="informative-text intro">
          On a previous question, you indicated your baby was stillborn.
          We offer our sincerest sympathies for your loss.
          Unfortunately you are not entitled to Best Start payments for this child.
          <p> Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before. </p>
        </div>
        <div className="form-actions bro-form-actions">
          <button type="button" className="previous" onClick={this.props.onPrevious}>Back</button>
          { this.props.isReviewing &&
            <button type="button" className="review" onClick={handleSubmit(this.handleToReview)}>Return to review</button>
          }

          {reserveStatus !== 'reserved' && clientType === 'new' && <button type="button" className="button button-link skip" onClick={this.props.onSkip}>Skip this step</button> }
          <button type="button" className="next" onClick={handleSubmit(this.handleNext)}>Next</button>
        </div>
              </form>
    )
  }

  render() {
    const { available, clientType, myIRWanted, detailsStatus, detailsConsent, username, usernameStatus,
      reserveStatus, notifyByText, termsLink, handleSubmit, submitting } = this.props

    const aliveAtBirth = get(this.props, 'broForm.child.aliveAtBirth')
    if (aliveAtBirth === 'no') {
      return this.renderStillBirth()
    }

    return (
      <div>
        {this.renderTabHeader()}
        <SaveAsDraft step={6} />


        <form onSubmit={handleSubmit(this.handleReserveUsername)}>

          { !available && MYIR_UNAVAILABLE_MESSAGE }

          { available && reserveStatus !== 'reserved' &&
            <div>
              { clientType === MYIR_STATES.HAS_LOGON && HAS_LOGON_MESSAGE}
              { clientType === MYIR_STATES.MSD_CLIENT && MSD_CLIENT_MESSAGE}
              { clientType === MYIR_STATES.WFF_CLIENT && WFF_CLIENT_MESSAGE }
              { clientType === MYIR_STATES.UNKNOWN && UNKNOWN_CLIENT_MESSAGE }
              { clientType === MYIR_STATES.OTHER && OTHER_CLIENT_MESSAGE }
              { clientType === MYIR_STATES.INELIGIBLE && INELIGIBLE_CLIENT_MESSAGE }
              { clientType === MYIR_STATES.BESTSTART_NO && BS_NO_CLIENT_MESSAGE }
            </div>
          }


          { available && clientType === 'new' && reserveStatus !== 'reserved' &&
            <div>
            <div className="informative-text intro myir">
              <div className="myir-logo">
                <img src='/assets/img/myir-logo.png' alt='myIR' />
              </div>
              <div>
                You may want to manage your Best Start payments in the future,
                for example to see your payments. Sign up for a myIR account to manage your payments online, any place, anytime.
              </div>
            </div>
            <div className="first-conditional">
              <Field {...getFieldProps(schema, 'myir.wanted')} />
              <Accordion>
                <Accordion.Toggle>
                  What is a myIR account?
                </Accordion.Toggle>
                <Accordion.Content>
                  <p>
                    myIR is a secure online service provided by Inland Revenue.
                    Having a myIR account gives you access to a range of Inland Revenue services when and where you want.
                  </p>
                  <div> With your myIR account you can: </div>
                  <ul>
                    <li>check and update your Working for Families Tax Credit details</li>
                    <li>manage your child support payments</li>
                    <li>file returns to check if you're due a tax refund</li>
                    <li>review your KiwiSaver contributions</li>
                    <li>check all of your details, including your student loan</li>
                    <li>grant myIR access to another party.</li>
                  </ul>
                  <p>If you're in business you can file returns and make payments for most of your business accounts at the same time.</p>
                </Accordion.Content>
              </Accordion>

              {/************** PCG DETAILS SECTION ***************************/}
              { myIRWanted &&
                <div className="conditional-field">
                  <div className="input-group">
                    <label>Here are the details we have for the primary caregiver - these have been copied from your previous answers</label>
                    <div className="instruction-text">
                      Only the primary caregiver can sign up for a myIR account to manage their payments.
                    </div>
                  </div>
                  <Field { ...getFieldProps(schema, 'myir.firstNames')} />
                  <Field { ...getFieldProps(schema, 'myir.lastName')} />
                  <Field { ...getFieldProps(schema, 'myir.dateOfBirth')} />
                  <Field { ...getFieldProps(schema, 'myir.irdNumber')} />
                  <Field { ...getFieldProps(schema, 'myir.email')} />
                  <Field { ...getFieldProps(schema, 'myir.detailsConsent')} />

                  {detailsStatus === 'loading' && <Spinner text={'Checking details...'} />}
                  {detailsConsent === 'no' && <Warning meta={{warning: MYIR_NOCONSENT_WARNING}} />}
                  {detailsConsent === 'yes' && detailsStatus === 'invalid' && <Warning meta={{warning: MYIR_INVALID_DETAILS_WARNING}} /> }
                  {detailsConsent === 'yes' && detailsStatus === 'has-logon' && <Warning meta={{warning: MYIR_EXISTING_ACCOUNT_WARNING}} /> }
                </div>
              }
            </div>
            {/**************** MYIR NAME VALIDATION SECTION ***************************/}
            {myIRWanted && detailsStatus === 'valid' &&
              <div>
                <div>
                  <Field  { ...getFieldProps(schema, 'myir.username')} />
                  <Field  { ...getFieldProps(schema, 'myir.usernameStatus')} />
                </div>

                <div className="first-conditional">
                  {(usernameStatus === 'available') &&

                    <div className="first-conditional">
                      {/************** MYIR USERNAME RESERVATION SECTION ***************************/}
                      <Field  { ...getFieldProps(schema, 'myir.notifyByText')} />

                      { notifyByText === 'yes' && <Field  { ...getFieldProps(schema, 'myir.mobile')} />}

                      <p>
                        {username} is the username you are about to reserve.<br />
                      By clicking the reserve button, you agreeing to the <a href={termsLink} target="_blank" rel="noreferrer noopener">terms and conditions</a>.
                    </p>

                    <button type="submit" className="reserve-myir-username" disabled={submitting}>
                      Reserve this username <br /> for my myIR account
                    </button>

                    <Field  { ...getFieldProps(schema, 'myir.reserveStatus')} />
                  </div>
                }
              </div>
            </div>
          }
          </div>
          }
          {reserveStatus === 'reserved' &&
            <div className="success">
              <p>Your myIR account has been reserved with the username {username}.</p>
              <p>You will receive an email from Inland Revenue within the next 6 days with a temporary password to complete the setup of your account.</p>
              <p>Click <strong>Next</strong> to continue with your birth registration.</p>
            </div>
          }

          <div className="form-actions bro-form-actions">
            <button type="button" className="previous" onClick={this.props.onPrevious}>Back</button>
            { this.props.isReviewing &&
              <button type="button" className="review" onClick={handleSubmit(this.handleToReview)}>Return to review</button>
            }

            {reserveStatus !== 'reserved' && clientType === 'new' && <button type="button" className="button button-link skip" onClick={this.props.onSkip}>Skip this step</button> }
            <button type="button" className="next" onClick={handleSubmit(this.handleNext)}>Next</button>
          </div>
        </form>
      </div>
    )
  }
}

MyIRForm.propTypes = {
  onSubmit: PropTypes.func, // form navigation
  onNext: PropTypes.func, // form navigation
  onPrevious: PropTypes.func, // form navigation
  onSkip: PropTypes.func, // form navigation
  isReviewing: PropTypes.bool, // form navigation
  onComebackToReview: PropTypes.func, // form navigation
  change: PropTypes.func,     // passed via reduxForm
  handleSubmit: PropTypes.func, // passed via reduxForm
  submitting: PropTypes.bool // passed via reduxForm
}

// Decorate the form component
MyIRForm = reduxForm({
  form: 'registration', // same name for all wizard's form
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
  touchOnChange: true,
  touchOnBlur: true,
  asyncValidate,
  asyncChangeFields: ['myir.username'],
  shouldAsyncValidate: ({ trigger }) => trigger !== 'submit' // don't run asyncValidation on submit
})(MyIRForm)

const selector = formValueSelector('registration')

MyIRForm = connect(
  state => ({
    initialValues: get(state, 'birthRegistration.savedRegistrationForm.data'),
    available: selector(state, 'myir.available'),
    broForm: selector(state, 'child', 'mother', 'father', 'bestStart'),
    clientType: selector(state, 'myir.clientType'),
    myIRWanted: selector(state, 'myir.wanted') === 'yes',
    firstNames: selector(state, 'myir.firstNames'),
    lastName: selector(state, 'myir.lastName'),
    dateOfBirth: selector(state, 'myir.dateOfBirth'),
    irdNumber: selector(state, 'myir.irdNumber'),
    pcgType: selector(state, 'myir.pcgType'),
    email: selector(state, 'myir.email'),
    detailsConsent: selector(state, 'myir.detailsConsent'),
    detailsStatus: selector(state, 'myir.detailsStatus'),
    username: selector(state, 'myir.username'),
    usernameStatus: selector(state, 'myir.usernameStatus'),
    notifyByText: selector(state, 'myir.notifyByText'),
    mobile: selector(state, 'myir.mobile'),
    termsLink: selector(state, 'myir.termsLink'),
    reserveStatus: selector(state, 'myir.reserveStatus')
  }),
  {
    checkMyIRAvailability,
    validatePcgDetails,
    submitMyIRReservation,
    changeField,
    resetField
  }
)(MyIRForm)

export default makeFocusable(MyIRForm)
