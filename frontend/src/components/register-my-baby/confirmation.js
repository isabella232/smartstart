import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import find from 'lodash/find'
import get from 'lodash/get'
import Accordion from 'components/form/accordion'
import { rememberBroData, fetchBroData } from 'actions/birth-registration'
import { initialRegistrationFormState } from 'store/reducers/birth-registration'
import {
  products as productOptions,
  courierDeliveryPrice
} from './options'
import Spinner from 'components/spinner/spinner'
import { MYIR_STATES } from './best-start-utils'
import './confirmation.scss'

export class Confirmation extends Component {
  UNSAFE_componentWillMount() {
    this.props.fetchBroData()
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { fetchingSavedUserData, confirmationData } = nextProps

    if (!fetchingSavedUserData) {
      if (!confirmationData  || !confirmationData.applicationReferenceNumber) {
        // redirect if not fetching and no data
        // either user not allowed to see this page or error occured file fetching

        window.location = '/'
      }
    }
  }

  componentWillUnmount() {
    // clear user session data
    this.props.rememberBroData(initialRegistrationFormState)
  }

  render() {
    const { paymentSuccess, fetchingSavedUserData, confirmationData } = this.props

    // initial form state is not empty
    if (fetchingSavedUserData || !confirmationData.applicationReferenceNumber) {
      return <Spinner text="Retrieving application ..."/>
    }

    const { applicationReferenceNumber, stillBorn, productCode, courierDelivery, quantity } = confirmationData

    const product = productCode ? find(productOptions, { value: productCode }) : null
    const deliveryPrice = courierDelivery ? courierDeliveryPrice : 0
    const totalPrice = (product && quantity) ? (product.price * quantity + deliveryPrice) : 0

    const buyBirthCertificate = <div>
                                  <p>
                                    If you have already registered your baby, you are still able to order a birth certificate or extra certificates. You can do this by requesting an order over the phone, online, by post or in person.
                                    <br/>
                                    It costs:
                                  </p>
                                  <ul>
                                    <li>$33 for a standard birth certificate</li>
                                    <li>$35 for a decorative birth certificate, or</li>
                                    <li>$55 for a pack that includes both a standard and a decorative birth certificate.</li>
                                  </ul>
                                  <p>
                                    <a href="https://www.govt.nz/browse/nz-passports-and-citizenship/proving-and-protecting-your-identity/get-a-birth-certificate/#how-to-apply"  target="_blank" rel="noreferrer noopener">Get a birth certificate </a>
                                  </p>
                                </div>

    const stillBornNotification = (
      <div className="instruction">
        Thank you for registering your baby.
        Please accept our sincerest sympathies for the loss of your precious baby.
      </div>
    )

    const brNotification = (
      <div className="success">
        <h3> Birth Registration </h3>
        <p>You've successfully submitted a registration of birth for your child. If we have any questions we will contact you.</p>
      </div>
    )

    // Birth Certificates notifications
    const productNotification = product && !paymentSuccess ?
        <div className="warning">
          <h3> Birth Certificate Order </h3>
          <p>Your Birth Certificate order failed, probably because your payment failed.</p>
        </div>
        :
        <div className="success">
          <h3> Birth Certificate Order </h3>
          <p>You have successfully ordered your birth certificate(s).</p>
        </div>

    // BestStart Notifications
    let bsNotification

    switch (confirmationData.bestStart) {
      case 'I':
        bsNotification = (
          <div className="warning">
            <h3> Best Start Payments </h3>
            <p> You were ineligible to apply for Best Start payments for your child.<br/>
            Please contact IR to discuss getting Best Start payments.</p>
          </div>
        )
        break;
      case 'Y':
        bsNotification = (
          <div className="success">
            <h3> Best Start Payments </h3>
            <p> You have successfully applied for Best Start payments for your child.</p>
          </div>
        )
        break;
      case 'N':
        bsNotification = (
          <div className="warning">
            <h3> Best Start Payments </h3>
            <p> You have not applied for Best Start payment for your child. </p>
          </div>
        )
        break;
      default:
        // don't display notification if it's not one of those 3 values
    }

    // MyIR
    let myirNotification
    const { status, username } = confirmationData.myIR || {}

      switch (status) {
        case MYIR_STATES.SUCCESS:
          myirNotification = (
            <div className="success">
              <h3> Manage your Best Start payments </h3>
              <p>You've successfully reserved a myIR account with the username {username}</p>
            </div>
          )
          break;
        case MYIR_STATES.BESTSTART_NO:
          myirNotification = (
            <div className="info">
              <h3> Manage your Best Start payments </h3>
              <p>You indicated that you did not want to receive Best Start payments.</p>
            </div>
          )
          break;
        case MYIR_STATES.UNAVAILABLE:
          myirNotification = (
            <div className="info">
              <h3> Manage your Best Start payments </h3>
              <p>
                You may want to manage your Best Start payments in the future, for example to update your details.
                <a href="https://www.ird.govt.nz/online-services/myir-secure-online-services.html"  target='_blank' rel='noopener noreferrer'>Sign up for a myIR account</a>
                to manage your payments online, any place, anytime.
              </p>
            </div>
          )
          break;
        case MYIR_STATES.WFF_CLIENT:
          myirNotification = (
            <div className="success">
              <h3> Manage your Best Start payments </h3>
              <p>
                You indicated that you are currently receiving Working for Families Tax Credits from Inland Revenue.
                You can use your myIR account to manage your Best Start payments online. If you don't have a myIR account,
                visit <a href="https://www.ird.govt.nz/online-services/myir-secure-online-services.html"  target='_blank' rel='noopener noreferrer'>myIR Secure Online Services</a> to create one.
              </p>
            </div>
          )
          break;
        case MYIR_STATES.UNKNOWN:
        case MYIR_STATES.OTHER:
        case MYIR_STATES.INELIGIBLE:
        case MYIR_STATES.MSD_CLIENT:
        case MYIR_STATES.HAS_LOGON:
        default:
      }

    return <div className="form-confirmation non-retry">
      <h2 className="step-heading">
        <span className="step-number"></span>
        Te haamauraa <br/>
        <span className="english">Confirmation</span>
      </h2>

      { stillBorn ?
        <div>
          { stillBornNotification }
          { product && productNotification }
        </div>
        :
        <div className="form">
          { brNotification }
          { product && productNotification }
          { bsNotification }
          { myirNotification }
        </div>
      }

      {confirmationData.confirmationEmailAddress && (
        <p className="informative-text">A confirmation email has been sent to <strong>{confirmationData.confirmationEmailAddress}</strong></p>
      )}

      <div className="informative-text">
        Your reference number is: <strong>{applicationReferenceNumber}</strong>
        { !stillBorn ?
          <div>
            <p>If you have applied for Best Start the application has now been sent
            to Inland Revenue (or MSD if applicable).  You do not need to do anything else.
            Inland Revenue or MSD may contact you to discuss your application. Inland Revenue
            or MSD will notify you once your application has been processed.  This may take up to 15 working days.
            Go to the Inland Revenue website (<a href="https://www.ird.govt.nz" target="_blank" rel="noreferrer noopener">www.ird.govt.nz</a>)
            if you wish to register for Inland Revenues secure online services.</p>
          </div> :
          null
        }
          </div>

      { product &&
        <div className="order-summary">
          <label>Order summary</label>
          <ul>
            <li>
              <span>{quantity} x {product.label} {product.subLabel && <em> - {product.subLabel}</em>}</span>
              <span>${(quantity * product.price).toFixed(2)}</span>
            </li>
            <li>
              <span>Shipping</span>
              <span>{ deliveryPrice ? `$${deliveryPrice.toFixed(2)}` :  'FREE'}</span>
            </li>
            { paymentSuccess ?
              <li>
                <strong>Total</strong>
                <strong>${ totalPrice.toFixed(2) }</strong>
              </li> :
              <li className="fail-payment">
                <strong>Payment declined</strong>
              </li>
            }
          </ul>
        </div>
      }

      <div className="expandable-group primary">
        <Accordion>
          <Accordion.Toggle>
            Birth registration questions?
          </Accordion.Toggle>
          <Accordion.Content>
            <p>
              If you want to contact us about your baby's registration you can email <a href="mailto:bdm.nz@dia.govt.nz">bdm.nz@dia.govt.nz</a> or call free on <a href="tel:0800225252">0800 225 252</a> (NZ only).
            </p>
          </Accordion.Content>
        </Accordion>

        { stillBorn &&
          <Accordion>
            <Accordion.Toggle>
              Need additional support?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>If you've lost your baby and need support, there are several organisations you can contact:</p>
              <ul>
                <li><a href="http://www.sands.org.nz" target="_blank" rel="noreferrer noopener">Sands New Zealand</a></li>
                <li><a href="https://www.miscarriagesupport.org.nz" target="_blank" rel="noreferrer noopener">Miscarriage Support</a></li>
                <li><a href="http://skylight.org.nz" target="_blank" rel="noreferrer noopener">Skylight</a></li>
              </ul>
            </Accordion.Content>
          </Accordion>
        }

        { !stillBorn &&
          <Accordion>
            <Accordion.Toggle>
              Inland Revenue or Best Start questions?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>If you have applied to Inland Revenue for Best Start payments for your baby Inland Revenue will contact you if they have any questions.</p>
              <p>If you have any questions please go to <a href="http://www.ird.govt.nz/news-updates/families-package-bill.html" target="_blank" rel="noreferrer noopener">http://www.ird.govt.nz/news-updates/families-package-bill.html</a>.</p>
              <p>If you have applied for an IRD number for your child, you should receive the number within 15 working days.</p>
              <p>If you have any questions please go to <a href="http://www.ird.govt.nz/how-to/irdnumbers" target="_blank" rel="noreferrer noopener">http://www.ird.govt.nz/how-to/irdnumbers</a>.</p>
            </Accordion.Content>
          </Accordion>
        }

        { !stillBorn &&
          <Accordion>
            <Accordion.Toggle>
              Ministry of Social Development/benefit questions?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>
                If you have any questions regarding benefits and services you may be entitled to, contact MSD <a href="https://www.workandincome.govt.nz" target="_blank" rel="noreferrer noopener">https://www.workandincome.govt.nz</a>.
              </p>
            </Accordion.Content>
          </Accordion>
        }

        { (((stillBorn && product) || !stillBorn) && paymentSuccess) &&
          <Accordion>
            <Accordion.Toggle>
              { product ?
                <span>How do I buy an extra birth certificate?</span>:
                <span>How do I buy a birth certificate?</span>
              }
            </Accordion.Toggle>
            <Accordion.Content>
              { buyBirthCertificate }
            </Accordion.Content>
          </Accordion>
        }
      </div>

        { !stillBorn &&
          <div className="more-services">
            <img src='/assets/img/illustrations/illustration-6.svg' />
            <div className="more-services-content">
              <p>
                <strong>Do you know what services are available for parents in your area?</strong>
                <br/>
                <a href="https://smartstart.services.govt.nz/services-near-me" target="_blank" rel="noreferrer noopener">Find services near me</a>
              </p>
              <p>
                <strong>Do you know what financial services may be available to you?</strong>
                <br/>
                <a href="https://smartstart.services.govt.nz/financial-help" target="_blank" rel="noreferrer noopener">See what financial help is available</a>
              </p>
            </div>
          </div>
        }

      <div className="print">
        <button type="button" onClick={() => window.print()}>Print</button>
      </div>
    </div>
  }
}

Confirmation.propTypes = {
  paymentSuccess: PropTypes.bool,
  fetchBroData: PropTypes.func.isRequired,
  fetchingSavedUserData: PropTypes.bool.isRequired,
  confirmationData: PropTypes.object.isRequired,
  rememberBroData: PropTypes.func.isRequired
}
const mapStateToProps = state => ({
  fetchingSavedUserData: get(state, 'birthRegistration.fetchingSavedUserData'),
  confirmationData: get(state, 'birthRegistration.savedRegistrationForm.confirmationData') || {}
})
export default connect(mapStateToProps, { rememberBroData, fetchBroData } )(Confirmation)
