import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Field } from 'redux-form'
import Accordion from 'components/form/accordion'
import getFieldProps from 'components/form/get-field-props'
import PrimaryCaregiverText from 'components/register-my-baby/steps/schemas/primary-caregiver-text'


class SharingCareQuestions extends Component {

  render() {
    const { schema, bstcShareCustody, bstcHasPartner, wfftcForm } = this.props

    return (
      <div className="first-conditional">
        <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isSharingCare')} />
        <Accordion>
          <Accordion.Toggle>
            What does shared care mean?
          </Accordion.Toggle>
          <Accordion.Content>
            <p>Shared care is when the care of the child is divided between people
              in different households for at least a third of the time. In a shared
              care situation there will be more than one principal caregiver eligible
              for Best Start payments.</p>
          </Accordion.Content>
        </Accordion>

        { bstcShareCustody === 'yes' &&
          <div className="conditional-field">
            <div className="instruction-text">
              Please provide the contact details of the person that care is shared with so that
              Inland Revenue have this information if they need it to process your Best Start application.
            </div>
            <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.careSharer.firstNames')} />
            <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.careSharer.surname')} />
            <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.careSharer.daytimePhone')} />
          </div>
        }

        { !wfftcForm && bstcShareCustody &&
          <div className="first-conditional">
            <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.hasPartner')} />

            { bstcHasPartner === 'yes' &&
              <div className="conditional-field">
                <div className="instruction-text">
                  Please provide the name and IRD number of the partner as Inland Revenue need
                  information about the household to process this Best Start application.
                </div>
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.partner.firstNames')} />
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.partner.surname')} />
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.partner.irdNumber')} />
              </div>
            }
          </div>
        }

        { (wfftcForm || bstcHasPartner) &&
          <div className="first-conditional">
            { (wfftcForm || bstcHasPartner === 'yes') &&
               <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')}
                 label={<span>Is the <PrimaryCaregiverText /> or their partner taking paid parental leave for this child?</span>} />
             }

             { (!wfftcForm && bstcHasPartner === 'no') &&
               <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')}
                 label={<span>Is the <PrimaryCaregiverText /> taking paid parental leave for this child?</span>} />
             }

            <Accordion>
              <Accordion.Toggle>
                Why is paid parental leave information needed?
              </Accordion.Toggle>
              <Accordion.Content>
                <p>Best Start payments will start when paid parental leave finishes.</p>
              </Accordion.Content>
            </Accordion>
          </div>
        }
      </div>
    )
  }
}

SharingCareQuestions.propTypes = {
  schema: PropTypes.object,
  bstcShareCustody: PropTypes.string,
  bstcHasPartner: PropTypes.string,
  wfftcForm: PropTypes.bool
}

export default SharingCareQuestions;
