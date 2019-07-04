import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { getFormValues } from 'redux-form'
import URLSearchParams from 'url-search-params'
import { TransitionGroup, CSSTransition } from 'react-transition-group'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import scriptLoader from 'react-async-script-loader'
import invert from 'lodash/invert'
import get from 'lodash/get'
import { animateScroll } from 'react-scroll'
import FormWizardProgress from './progress'
import Step1 from './steps/step1'
import Step2 from './steps/step2'
import Step3 from './steps/step3'
import Step4 from './steps/step4'
import Step5 from './steps/step5'
import Step6 from './steps/step6'
import Step7 from './steps/step7'
import Review from './steps/review/index'
import Spinner from 'components/spinner/spinner'
import scrollToFirstError from 'components/form/scroll-to-first-error'
import { fullSubmit } from './submit'
import { piwikTrackPost } from 'actions/application'
import {
  fetchBirthFacilities, fetchCountries, rememberBroData,
  fetchBroData, checkMyIRAvailability, changeField
} from 'actions/birth-registration'
import { initialRegistrationFormState } from 'store/reducers/birth-registration'

const stepByStepName =  MYIR_ENABLED ?
  ({
    'child-details': 1,
    'mother-details': 2,
    'other-parent-details': 3,
    'parents-relationship': 4,
    'other-services': 5,
    'manage-best-start-payments': 6,
    'buy-birth-certificates': 7,
    'review': 8
  }) :
  ({
    'child-details': 1,
    'mother-details': 2,
    'other-parent-details': 3,
    'parents-relationship': 4,
    'other-services': 5,
    'buy-birth-certificates': 6,
    'review': 7
  })

const stepNameByStep = invert(stepByStepName)

class RegisterMyBabyForm extends Component {
  constructor(props) {
    super(props)
    this.nextStep = this.nextStep.bind(this)
    this.previousStep = this.previousStep.bind(this)
    this.skipStep = this.skipStep.bind(this)
    this.goToReviewStep = this.goToReviewStep.bind(this)
    this.handleSubmitFail = this.handleSubmitFail.bind(this)
    this.handleFieldReviewEdit = this.handleFieldReviewEdit.bind(this)
    this.submit = this.submit.bind(this)
    this.goToStep = this.goToStep.bind(this)
    this.retry = this.retry.bind(this)
    this.saveFormState = this.saveFormState.bind(this)
    this.state = {
      step: 1,
      stepName: 'child-details',
      isReviewing: false,
      isRedirecting: false
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchBirthFacilities()
    this.props.fetchCountries()
    this.props.fetchBroData()

    if (MYIR_ENABLED) {
      // define if users will be able to reserve MyIR on step 6
      // it won't be option to retry
      this.props.checkMyIRAvailability()
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const nextStepName = get(nextProps, 'params.stepName')
    const currentStepName = get(this.state, 'stepName')
    const step = stepByStepName[nextStepName]
    // match open tab to url
    if (step && nextStepName && nextStepName !== currentStepName) {
      this.setState({ step, stepName: nextStepName })
    }
  }

  componentDidMount() {
    const { params } = this.props
    const { stepName } = params

    if (!stepByStepName[stepName]) {
      this.goToStep(1, true)
    }

    animateScroll.scrollToTop({ duration: 300 })
  }

  componentDidUpdate(prevProps) {
    const { savedUserData, fetchingSavedUserData } = this.props
    const { confirmationData, step: maxStep } = savedUserData

    if (prevProps.fetchingSavedUserData && !fetchingSavedUserData) {
      if (confirmationData) {
        // if we have confirmation data saved
        // the form has been submitted already and should be refreshed
        this.props.rememberBroData(initialRegistrationFormState)
        this.goToStep(1, true)
      }

      // when saved data arrives check if user progressed as far as desired step
      if (maxStep) {
        this.goToStep(maxStep, true)
      }

      animateScroll.scrollToTop({ duration: 300 })
    }
  }

  nextStep() {
    this.props.piwikTrackPost('Register My Baby', {
      'category': 'RegisterMyBaby',
      'action': 'Click next',
      'name': this.state.stepName
    })

    let nextStep = this.state.step + 1
    // exceptions
    // 1. still born
    const isStillBorn = get(this.props, 'formState.child.aliveAtBirth') === 'no'
    if (this.state.step === 4 && isStillBorn) {
      this.skipBestStart()
      nextStep = MYIR_ENABLED ? 7 : 6
    }

    this.goToStep(nextStep)
    this.setState({
      animationClass: 'next'
    })
  }

  previousStep() {
    this.props.piwikTrackPost('Register My Baby', {
      'category': 'RegisterMyBaby',
      'action': 'Click back',
      'name': this.state.stepName
    })
    this.goToStep(this.state.step - 1)
    this.setState({
      animationClass: 'previous'
    })
  }

  skipStep() {
    this.props.piwikTrackPost('Register My Baby', {
      'category': 'RegisterMyBaby',
      'action': 'Click skip this step',
      'name': this.state.stepName
    })
    switch(this.state.step) {
      case 6:
        this.props.changeField('myir.wanted', 'no')
        break;
      default:
    }

    this.goToStep(this.state.step + 1)
    this.setState({ animationClass: 'next' })
  }

  goToReviewStep() {
    if (this.state.isReviewing) {
      this.goToStep(8)
    }
  }

  goToStep(step, replace = false, focus = '') {
    const { formState, savedUserData, rememberBroData } = this.props
    const { step: maxStep } = savedUserData
    const stepName = stepNameByStep[step]

    const currentStep = this.state.step
    if (stepName) {
      if (currentStep === 8 && step !== currentStep) {
        this.setState({
          isReviewing: true
        })
      }

      let url = `/register-my-baby/${stepName}`

      if (focus) {
        url += `?focus=${focus}`
      }

      if (replace) {
        this.props.router['replace'](url)
      } else {
        this.props.router['push'](url)

        // save step if we navigating to the new tab for the first time
        const stepToSave = maxStep && maxStep > step ? maxStep : step

        return rememberBroData({ step: stepToSave, data: formState })

      }
    }
  }

  handleSubmitFail() {
    this.props.piwikTrackPost('Register My Baby', {
      'category': 'RegisterMyBaby',
      'action': 'Click next (errors)',
      'name': this.state.stepName
    })
    window.setTimeout(scrollToFirstError, 200)
  }

  handleFieldReviewEdit(section, fieldName) {
    this.goToStep(stepByStepName[section], false, fieldName)
  }

  submit() {
    const { rememberBroData, formState } = this.props

    return fullSubmit(formState)
      .then(({ submittedData, result }) => {
        // set myir status
        let myIRStatus

        if (MYIR_ENABLED) {
          if (get(formState, 'myir.reserveStatus') === 'reserved') {
            myIRStatus = 'success'
          } else if (!get(formState, 'myir.available')) {
            myIRStatus = 'unavailable'
          } else {
            myIRStatus = get(formState, 'myir.clientType')
          }
        }

      if (submittedData.certificateOrder) {
        if (result.response && result.response.paymentURL) {
          const productCode = get(submittedData, 'certificateOrder.productCode')
          const quantity = get(submittedData, 'certificateOrder.quantity')
          const courierDelivery = get(submittedData, 'certificateOrder.courierDelivery')
          const stillBorn = get(submittedData, 'child.stillBorn')
          const bestStart = get(submittedData, 'bestStart.wanted')

          return rememberBroData({
            confirmationData: {
              applicationReferenceNumber: result.response.applicationReferenceNumber,
              stillBorn,
              productCode,
              quantity,
              courierDelivery,
              bestStart,
              myIR: {
                username: get(formState, 'myir.username'),
                status: myIRStatus
              }
            }
          })
          .then(() => {
            this.setState({ isRedirecting: true })
            window.location = result.response.paymentURL
          })
        }
      }

      return rememberBroData({
        confirmationData: {
          applicationReferenceNumber: result.response.applicationReferenceNumber,
          stillBorn: get(submittedData, 'child.stillBorn'),
          bestStart: get(submittedData, 'bestStart.wanted'),
          myIR: {
            username: get(formState, 'myir.username'),
            status: myIRStatus
          }
        }
      })
      .then(() => {
        this.setState({ isRedirecting: true })
        window.location = '/register-my-baby/confirmation'
      })
    })
  }

  retry() {
    this.props.fetchBirthFacilities()
    this.props.fetchCountries()
    this.props.fetchBroData()
  }

  saveFormState() {
    const { formState, rememberBroData, savedUserData } = this.props
    rememberBroData({ step: savedUserData.step, data: formState })
  }

  skipBestStart() {
    this.props.changeField('bestStart.wanted', 'no')
    this.props.changeField('ird.applyForNumber', 'no')
    if (MYIR_ENABLED) {
      this.props.changeField('myir.wanted', 'no')
    }
  }

  render() {
    const { step, isReviewing, isRedirecting, animationClass = '' } = this.state
    const {
        birthFacilities, countries, checkingMyIRAvailability,
        fetchingBirthFacilities, fetchingCountries, fetchingSavedUserData
    } = this.props

    const searchParams = new URLSearchParams(this.props.location.search)
    const autoFocusField = searchParams.get('focus')

    if (fetchingBirthFacilities || fetchingCountries || fetchingSavedUserData || checkingMyIRAvailability) {
      return <Spinner text="Please wait ..."/>
    }

    if(!birthFacilities || !birthFacilities.length || !countries || !countries.length) {
      return <div className="unavailable-notice">
        <h2>Sorry!</h2>
        <div className="informative-text">
          Birth registration online is currently unavailable. Right now we're working on getting back online as soon as possible. Thank you for your patience - please <Link to={'/register-my-baby/child-details'} onClick={this.retry}>try again</Link> shortly.
        </div>
      </div>
    }

    return (
      <div className='form'>
        <FormWizardProgress
          currentStep={step}
          isReviewing={isReviewing}
          onFailNavigationAttemp={() => window.setTimeout(scrollToFirstError, 200)}
          onNavigateToStep={this.goToStep}
        />

        {MYIR_ENABLED ?
        <TransitionGroup className={`slider-animation-container ${animationClass}`}>
          {step === 1 && <CSSTransition key={1} timeout={3000} classNames="slide"><Step1 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep}                                onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 2 && <CSSTransition key={2} timeout={600} classNames="slide"><Step2 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 3 && <CSSTransition key={3} timeout={600} classNames="slide"><Step3 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 4 && <CSSTransition key={4} timeout={600} classNames="slide"><Step4 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 5 && <CSSTransition key={5} timeout={600} classNames="slide"><Step5 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 6 && <CSSTransition key={6} timeout={600} classNames="slide"><Step6 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSaveFormState={this.saveFormState} onNext={this.nextStep}  onSubmitFail={this.handleSubmitFail} onSkip={this.skipStep} /></CSSTransition>}
          {step === 7 && <CSSTransition key={7} timeout={600} classNames="slide"><Step7 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 8 && <CSSTransition key={8} timeout={600} classNames="slide"><Review onPrevious={this.previousStep} onSubmit={this.submit} onSubmitFail={this.handleSubmitFail} onFieldEdit={this.handleFieldReviewEdit} isRedirecting={isRedirecting} /></CSSTransition>}
        </TransitionGroup>
        :
        <TransitionGroup className="slider-animation-container">
          {step === 1 && <CSSTransition key={1} timeout={600} classNames="slide"><Step1 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep}                                onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 2 && <CSSTransition key={2} timeout={600} classNames="slide"><Step2 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 3 && <CSSTransition key={3} timeout={600} classNames="slide"><Step3 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 4 && <CSSTransition key={4} timeout={600} classNames="slide"><Step4 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 5 && <CSSTransition key={5} timeout={600} classNames="slide"><Step5 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 6 && <CSSTransition key={6} timeout={600} classNames="slide"><Step7 autoFocusField={autoFocusField} isReviewing={isReviewing} onComebackToReview={this.goToReviewStep} onPrevious={this.previousStep} onSubmit={this.nextStep} onSubmitFail={this.handleSubmitFail} /></CSSTransition>}
          {step === 7 && <CSSTransition key={7} timeout={600} classNames="slide"><Review onPrevious={this.previousStep} onSubmit={this.submit} onSubmitFail={this.handleSubmitFail} onFieldEdit={this.handleFieldReviewEdit} isRedirecting={isRedirecting} /></CSSTransition>}
        </TransitionGroup>
        }

      </div>
    )
  }
}

RegisterMyBabyForm.propTypes = {
  params: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  router: PropTypes.object.isRequired,
  birthFacilities: PropTypes.array,
  countries: PropTypes.array,
  fetchBirthFacilities: PropTypes.func,
  fetchCountries: PropTypes.func,
  fetchBroData: PropTypes.func,
  rememberBroData: PropTypes.func,
  checkMyIRAvailability: PropTypes.func,
  checkingMyIRAvailability: PropTypes.bool,
  isMyIRAvailable: PropTypes.bool,
  fetchingBirthFacilities: PropTypes.bool,
  fetchingSavedUserData: PropTypes.bool,
  fetchingCountries: PropTypes.bool,
  formState: PropTypes.object,
  savedUserData: PropTypes.object,
  piwikTrackPost: PropTypes.func,
  changeField: PropTypes.func,
  dispatch: PropTypes.func
}

const mapStateToProps = (state) => ({
  savedUserData: get(state, 'birthRegistration.savedRegistrationForm') || {},
  fetchingBirthFacilities: get(state, 'birthRegistration.fetchingBirthFacilities'),
  fetchingSavedUserData: get(state, 'birthRegistration.fetchingSavedUserData'),
  checkingMyIRAvailability: get(state, 'birthRegistration.checkMyIRAvailability'),
  isMyIRAvailable: get(state, 'birthRegistration.isMyIRAvailable'),
  fetchingCountries: get(state, 'birthRegistration.fetchingCountries'),
  birthFacilities: get(state, 'birthRegistration.birthFacilities'),
  countries: get(state, 'birthRegistration.countries'),
  formState: getFormValues('registration')(state)
})

RegisterMyBabyForm = connect(
  mapStateToProps,
  {
    fetchBirthFacilities,
    fetchCountries,
    fetchBroData,
    checkMyIRAvailability,
    rememberBroData,
    piwikTrackPost,
    changeField
  }
)(RegisterMyBabyForm)

export default scriptLoader(
  `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&v=3.35`
)(RegisterMyBabyForm)
