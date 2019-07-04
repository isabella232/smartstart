import React from 'react'
import PropTypes from 'prop-types'
import get from 'lodash/get'
import { MYIR_STATES } from '../../best-start-utils'

const renderStep6Review = ({ formState, onEdit }) => {
    const myirState = get(formState, 'myir') || {}

    const { reserveStatus, clientType, available, username, wanted, detailsConsent, detailsStatus } = myirState

    let message

    if (reserveStatus === 'reserved') {
      message = (
        <div>
          <p>Your myIR account has been reserved with the username {username}</p>
          <p>You will receive an email from Inland Revenue within the next 6 days with a temporary password to complete the setup of your account</p>
        </div>
      )
    } else if (!available) {
      message = <p>We're sorry but the option to set up a myIR account to manage your Best Start payments is currently unavailable, so you do not need to complete this step.</p>
    } else if (detailsStatus === 'has-logon') {
      message = <p>There is a myIR account associated with your IRD number. You should be able to use your existing account to manage your Best Start payments, and if you're not sure how to access your myIR account then call IR on 0800 227 770.</p>
    } else if (wanted === 'no' || detailsConsent === 'no') {
      message = (
        <p>
          You indicated that you don't want to reserve a myIR username, so you do not need to complete this step.<br />
          If you wish to get a myIR account later, visit <a href="https://www.ird.govt.nz/online-services/myir-secure-online-services.html" target="_blank" rel="noreferrer noopener"> myIR Secure Online Services </a>
          to create one.
        </p>
      )
    } else {
      switch (clientType) {
        case MYIR_STATES.MSD_CLIENT:
          message = (
            <div>
              <p> You indicated that you receive a main benefit from Ministry of Social Development (MSD),
                so you will receive your Best Start payments from MSD.</p>
              <p>To manage your Best Start payments, for example to update your details if they change, you can use your MyMSD or contact MSD.</p>
            </div>
          )
          break
        case MYIR_STATES.WFF_CLIENT:
          message = <p> You indicated that you are currently receiving Working for Families tax credits from Inland Revenue, so you do not need to complete this step. </p>
          break;
        case MYIR_STATES.UNKNOWN:
          message = <p> You indicated that the child’s principal caregiver is unknown, so you do not need to complete this step. </p>
          break;
        case MYIR_STATES.OTHER:
          message = <p> You indicated that the child’s principal caregiver is 'Other', so you do not need to complete this step.</p>
          break;
        case MYIR_STATES.INELIGIBLE:
          message = <p> You were ineligible to apply for Best Start Payments for your child, so you do not need to complete this step </p>
          break;
        case MYIR_STATES.BESTSTART_NO:
          message = <p>You indicated that you don't want to receive Best Start payments, so you do not need to complete this step</p>
          break;
        default:
      }
    }

    const isStillBorn = get(formState, 'child.aliveAtBirth') === 'no'
    if (isStillBorn) {
      return (
        <div className="review-section">
          <div className="section-heading">
            <h3>
              Whakahaere i ō utu ki Ngā Utunga Best Start <br/>
            <span className="subtitle">Manage your Best Start payments</span>
            </h3>
            <button type="button" onClick={() => onEdit('manage-best-start-payments')} className="section-edit-btn">Edit</button>
          </div>
          <div>
            You indicated that your child was stillborn.
            We offer our sincerest sympathies for your loss.
            Unfortunately you are not entitled to Best Start payments for this child.
          </div>
        </div>
      )
    }

    return (
      <div className="review-section">
        <div className="section-heading border-bottom">
          <h3>
            Whakahaere i ō utu ki Ngā Utunga Best Start <br/>
          <span className="subtitle">Manage your Best Start payments</span>
          </h3>

          {clientType === MYIR_STATES.BESTSTART_NO && <button type="button" onClick={() => onEdit('other-services')} className="section-edit-btn">Edit</button> }
          { (wanted === 'no' || detailsConsent === 'no') && <button type="button" onClick={() => onEdit('manage-best-start-payments')} className="section-edit-btn">Edit</button> }
        </div>
        {message}
      </div>
    )
}

renderStep6Review.propTypes = {
  formState: PropTypes.object,
  onEdit: PropTypes.func
}

export default renderStep6Review
