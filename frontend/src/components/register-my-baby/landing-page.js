import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Link } from 'react-router'
import get from 'lodash/get'
import Accordion from 'components/form/accordion'
import { piwikTrackPost } from 'actions/application'
import { fetchBroData } from 'actions/birth-registration'

import './landing-page.scss'

export class RegisterMyBabyLandingPage extends Component {
  constructor(props) {
    super(props)

    this.getStartedClick = this.getStartedClick.bind(this)
    this.continueDraftClick = this.continueDraftClick.bind(this)
    this.loginAction = this.loginAction.bind(this)
  }

  UNSAFE_componentWillMount() {
    this.props.dispatch(fetchBroData())
  }

  getStartedClick() {
    const piwikEvent = {
      'category': 'RegisterMyBaby',
      'action': 'Click next',
      'name': 'Get started'
    }
    this.props.dispatch(piwikTrackPost('Register My Baby', piwikEvent))
  }

  continueDraftClick() {
    const piwikEvent = {
      'category': 'RegisterMyBaby',
      'action': 'Click next',
      'name': 'Continue draft'
    }
    this.props.dispatch(piwikTrackPost('Register My Baby', piwikEvent))
  }

  loginAction(event) {
    event.preventDefault()
    const piwikEvent = {
      'category': 'Login',
      'action': 'Click',
      'name': 'BRO Form login'
    }

    // track the event
    this.props.dispatch(piwikTrackPost('BRO Form login', piwikEvent))

    // match standard piwik outlink delay
    window.setTimeout(() => {
      window.location = `/login?next=${encodeURIComponent('/register-my-baby/child-details')}`
    }, 200)
  }

  render() {
    const { isLoggedIn, hasSavedForm } = this.props

    return (
      <div className="landing-page form">
        <h2>
          Te Whakamōhio i te Whānautanga mō te Rēhita <br/>
          <span className="english">Notification of Birth for Registration</span>
        </h2>
        <div className="divider" />
        <div className="informative-text">
          Every birth in New Zealand must be registered by law. It's free to register
          your baby, but there's a charge if you want to order a birth certificate.
          You must fill in all the questions in this form (unless the question says it's optional).
        </div>
        <div className="informative-text">
          You can also use this form to apply for Best Start payments (sometimes
          known as the Best Start tax credit or BSTC). See the help text at the
          bottom of this page for more detail about what Best Start payments are.
        </div>

        <h5>Before you get started, check you have everything you need for birth registration:</h5>
        <ul>
          <li>name and birth information for the child that's being registered</li>
          <li>name, birth, occupation, and citizenship information of both parents (if applicable)</li>
          <li>delivery address details for the birth certificate (if you choose to order one)</li>
          <li>credit card details to pay for the birth certificate (if you choose to order one)</li>
        </ul>
        <h5>and what you need for the Best Start application:</h5>
        <ul>
          <li>IRD number of the principal caregiver and partner (if applicable)</li>
          <li>bank account details - if you are not an existing Working for Families Tax Credit or Ministry of Social Development (MSD) customer</li>
          <li>MSD client number (if an MSD customer)</li>
        </ul>

        <h5>Take care with this form - it's against the law to give false information, and you may need to pay to correct mistakes.</h5>
        <h5>This form will take approximately 10 minutes to complete.</h5>
        <h5>Ready to get started?</h5>

        {
          isLoggedIn && hasSavedForm &&
          <Link to={'/register-my-baby/child-details'} role="button" className="welcome-action" onClick={this.continueDraftClick}>Continue your saved draft</Link>
        }

        {
          isLoggedIn && !hasSavedForm &&
          <Link to={'/register-my-baby/child-details'} role="button" className="welcome-action" onClick={this.getStartedClick}>Start a new birth registration</Link>
        }

        {
          !isLoggedIn &&
          <div className="form-actions-wrapper">
            <Link to={'/register-my-baby/child-details'} role="button" className="welcome-action" onClick={this.getStartedClick}>Start a new birth registration</Link>
            <div>or</div>
            <a href='/login/' onClick={this.loginAction} className='welcome-action'>Continue your saved draft</a>
          </div>
        }


        <div className="expandable-group primary">
          <Accordion>
            <Accordion.Toggle>
              What if both parents can’t complete this form?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>Both parents have to complete the birth registration together, unless one of them is:</p>

              <ul>
                <li>dead</li>
                <li>missing</li>
                <li>of unsound mind</li>
                <li>unable to complete the form because of a medical condition</li>
                <li>overseas and has no delivery address or contact details</li>
                <li>a danger to you or your child</li>
              </ul>

              <p>If the other parent is unknown, you can still register the birth online. If the other parent is known but cannot complete the form because of one of the above reasons, you'll need to use a paper form and post it in to Births, Deaths and Marriages.</p>
            </Accordion.Content>
          </Accordion>

          <Accordion>
            <Accordion.Toggle>
              What are Best Start payments?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>Best Start is a government payment of $60 a week for each child born on or after 1 July 2018.</p>
              <p>If you're a New Zealand resident you can get Best Start payments until your baby turns one, no matter what you earn.</p>
              <p>You can apply now, when you're registering your baby's birth, but your Best Start payments usually won't start until paid parental leave finishes.</p>
              <p>Receiving Best Start payments won’t affect any other payments or benefits you get.</p>
              <p>When your baby turns one, Best Start payments become income-tested. You may continue to get payments depending on your family's income.</p>
              <p>If your family's income is:</p>
              <ul>
                <li>under $79,000 a year before tax, you will continue to get $60 a week until your child turns 3</li>
                <li>between $79,000 and $93,857 a year before tax, you may continue to get payments at a reduced amount until your child turns 3</li>
                <li>over $93,857 a year before tax, you will stop getting payments for your child after they turn 1.</li>
              </ul>
              <p>Best Start payments are part of the Working for Families tax credits.</p>
              <p>If you are a new or returning resident, and currently have a temporary tax exemption on foreign sourced income, you will need to choose between receiving Best Start payments or retaining your temporary tax exemption.</p>
              <p>If you have questions regarding this please contact Inland Revenue.</p>
            </Accordion.Content>
          </Accordion>

          <Accordion>
            <Accordion.Toggle>
              Can I apply for an IRD number for my child?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>You can apply for an IRD number for your baby in this form, if one of the parents:</p>
              <ul>
                <li>is a New Zealand or Australian citizen, or</li>
                <li>has permanent residency, or</li>
                <li>is a resident of the Cook Islands, Tokelau or Niue.</li>
              </ul>
              <p>You don't need to order a birth certificate to apply for an IRD number.
                <b> If you choose to apply for Best Start then an IRD number will
                be issued for your child as part of the application process.</b></p>
            </Accordion.Content>
          </Accordion>

          <Accordion>
            <Accordion.Toggle>
              Can I let MSD know I’ve had a baby?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>If you're an existing Ministry of Social Development (MSD) client you can also use this form to notify MSD of the birth of your baby. They can determine how your new baby might change your benefits and services. </p>
              <p>You don't need to order a birth certificate to notify MSD.</p>
            </Accordion.Content>
          </Accordion>
        </div>

      </div>
    )
  }
}

RegisterMyBabyLandingPage.propTypes = {
  hasSavedForm: PropTypes.bool.isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  dispatch: PropTypes.func
}

const mapStateToProps = state => ({
  isLoggedIn: get(state, 'personalisation.isLoggedIn') || false,
  hasSavedForm: get(state, 'birthRegistration.savedRegistrationForm.step') > 0
})

export default connect(mapStateToProps)(RegisterMyBabyLandingPage)
