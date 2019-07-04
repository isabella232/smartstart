import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'redux-form'
import moment from 'moment'
import get from 'lodash/get'
import renderFieldReview from 'components/form/fields/render-review-field'
import {
  yesNo,
  getIrdDeliveryAddresses,
  getPCGOptions,
  getOptionDisplay,
  paymentFrequency
} from '../../options'
import { formatDate, formatBankAccount } from './utils'
import schema from '../schemas/step5'
import getFieldReviewProps from './get-field-review-props'
import PrimaryCaregiverText from 'components/register-my-baby/steps/schemas/primary-caregiver-text'
import { isDateEligible } from 'components/register-my-baby/best-start-utils'

const renderStep5Review = ({ formState, onEdit }) => {
  const birthDate = formState.child.birthDate
  const expectedDueDate = formState.bestStart.expectedDueDate
  const motherBirthDate = formState.mother.dateOfBirth
  const fatherBirthDate = formState.father ? formState.father.dateOfBirth : null
  const isOtherParent = formState.assistedHumanReproduction === 'yes' && formState.assistedHumanReproductionWomanConsented
  const preferedTitle = formState.secondParent ? formState.secondParent.preferedTitle : null
  const irdDeliveryAddresses = getIrdDeliveryAddresses(isOtherParent, preferedTitle)
  const { assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, fatherKnown } = formState
  const pcgOptions = getPCGOptions(assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, fatherKnown, preferedTitle)

  const bestStartNotEligble = (formState.bestStart.wanted === 'yes' &&
                              (!isDateEligible(birthDate, expectedDueDate) || (formState.bestStart.primaryCareGiver &&
                              (formState.bestStart.primaryCareGiver.type === 'mother' && moment().diff(motherBirthDate, 'years') < 16) ||
                              (formState.bestStart.primaryCareGiver.type === 'father' && moment().diff(fatherBirthDate, 'years') < 16) ||
                              (formState.bestStart.primaryCareGiver.isNewZealandResident === 'no' ||
                              (formState.bestStart.primaryCareGiver.type === 'other' || formState.bestStart.primaryCareGiver.type === 'unknown') ||
                              (formState.bestStart.primaryCareGiver.isTaxResident === 'no' && formState.bestStart.primaryCareGiver.isChildResident === 'no' &&
                              (formState.bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths === 'no' ||
                              formState.bestStart.primaryCareGiver.taxResidentWhenBestStartStarts === 'no'))))))


  const isStillBorn = get(formState, 'child.aliveAtBirth') === 'no'
  if (isStillBorn) {
    return (
      <div className="review-section">
        <div className="section-heading">
          <h3>
            He ratonga mā kōrua ko tō pēpi <br/>
            <span className="subtitle">Services for you and your baby</span>
          </h3>
          <button type="button" onClick={() => onEdit('other-services')} className="section-edit-btn">Edit</button>
        </div>
        <div>
          You indicated that your child was stillborn.
          We offer our sincerest sympathies for your loss.
          Unfortunately you are not entitled to Best Start payments for this child.
        </div>
      </div>
    )

  }

  return <div className="review-section">
    <div className="section-heading">
      <h3>
        He ratonga mā kōrua ko tō pēpi <br/>
        <span className="subtitle">Services for you and your baby</span>
      </h3>
      <button type="button" onClick={() => onEdit('other-services')} className="section-edit-btn">Edit</button>
    </div>

    <h4>Best Start Payment</h4>
    { formState.bestStart.wanted === 'yes' &&
      <div>
        {formState.bestStart.primaryCareGiver && formState.bestStart.primaryCareGiver.type === 'unknown' &&
          <div className="review-field">
            <div className="warning">
              <span>Principal caregiver is not known - apply at a later date</span>
            </div>
          </div>
        }

        { formState.bestStart.primaryCareGiver && formState.bestStart.primaryCareGiver.type === 'other' &&
          <div className="review-field">
            <div className="warning">
              <span>Inland Revenue will call the principal caregiver to discuss applying for Best Start.</span>
            </div>
          </div>
        }

        { !isDateEligible(birthDate, expectedDueDate) &&
          <div className="review-field">
            <div className="warning">
              <span>Estimated due date of child before 1 July 2018 - not eligible for Best Start</span>
            </div>
          </div>
        }

        { formState.bestStart.primaryCareGiver && formState.bestStart.primaryCareGiver.isNewZealandResident === 'no' &&
          formState.bestStart.primaryCareGiver.type !== 'unknown' &&
          <div className="review-field">
            <div className="warning">
              <span>Principal caregiver is not NZ resident - not eligible for Best Start</span>
            </div>
          </div>
        }

        { formState.bestStart.primaryCareGiver &&
          ((formState.bestStart.primaryCareGiver.type === 'mother' && moment().diff(motherBirthDate, 'years') < 16) ||
          (formState.bestStart.primaryCareGiver.type === 'father' && moment().diff(fatherBirthDate, 'years') < 16)) &&
          <div className="review-field">
            <div className="warning">
              <span>Principal caregiver is under 16 years of age - not eligible for Best Start</span>
            </div>
          </div>
        }

        { formState.bestStart.primaryCareGiver &&
          formState.bestStart.primaryCareGiver.isTaxResident === 'no' && formState.bestStart.primaryCareGiver.isChildResident === 'no' &&
          (formState.bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths === 'no' || formState.bestStart.primaryCareGiver.taxResidentWhenBestStartStarts === 'no') &&
          formState.bestStart.primaryCareGiver.type !== 'unknown' &&
          <div className="review-field">
            <div className="warning">
              <span>Applicant and/or child not a tax resident - not eligible for Best Start</span>
            </div>
          </div>
        }

        { formState.bestStart.primaryCareGiver && formState.bestStart.primaryCareGiver.type === 'other' &&
          <div>
            <Field
              {...getFieldReviewProps(schema, 'bestStart.wanted')}
              component={renderFieldReview}
              valueRenderer={getOptionDisplay(yesNo)}
              section="other-services"
              onEdit={onEdit}
            />

            <Field
              {...getFieldReviewProps(schema, 'bestStart.expectedDueDate')}
              component={renderFieldReview}
              valueRenderer={formatDate}
              section="other-services"
              onEdit={onEdit}
            />

            <Field
              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.type')}
              component={renderFieldReview}
              valueRenderer={getOptionDisplay(pcgOptions)}
              section="other-services"
              onEdit={onEdit}
            />

            <Field
              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.firstNames')}
              component={renderFieldReview}
              section="other-services"
              onEdit={onEdit}
            />

            <Field
              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.surname')}
              component={renderFieldReview}
              section="other-services"
              onEdit={onEdit}
            />

            <Field
              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.daytimePhone')}
              component={renderFieldReview}
              section="other-services"
              onEdit={onEdit}
            />
          </div>
        }

        { !bestStartNotEligble &&
          <div>
            <Field
              {...getFieldReviewProps(schema, 'bestStart.wanted')}
              component={renderFieldReview}
              valueRenderer={getOptionDisplay(yesNo)}
              section="other-services"
              onEdit={onEdit}
            />

            { formState.bestStart.expectedDueDate &&
              <div>
                <Field
                  {...getFieldReviewProps(schema, 'bestStart.expectedDueDate')}
                  component={renderFieldReview}
                  valueRenderer={formatDate}
                  section="other-services"
                  onEdit={onEdit}
                />
              </div>
            }

            <Field
              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.type')}
              component={renderFieldReview}
              valueRenderer={getOptionDisplay(pcgOptions)}
              section="other-services"
              onEdit={onEdit}
            />

            <Field
              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isMSDClient')}
              component={renderFieldReview}
              valueRenderer={getOptionDisplay(yesNo)}
              section="other-services"
              onEdit={onEdit}
            />

            { formState.bestStart.primaryCareGiver.isMSDClient === 'yes' &&
              <div className="review-subfields">
                <Field
                  {...getFieldReviewProps(schema, 'msd.notify')}
                  component={renderFieldReview}
                  valueRenderer={value => value ? 'Yes' : 'No'}
                  section="other-services"
                  onEdit={onEdit}
                />
                { formState.msd.notify === true &&
                  <div className="review-subfields">
                    <Field
                      {...getFieldReviewProps(schema, 'msd.mothersClientNumber')}
                      component={renderFieldReview}
                      section="other-services"
                      onEdit={onEdit}
                    />
                    <Field
                      {...getFieldReviewProps(schema, 'msd.fathersClientNumber')}
                      component={renderFieldReview}
                      section="other-services"
                      onEdit={onEdit}
                    />
                  </div>
                }
              </div>
            }

            { formState.bestStart.primaryCareGiver.isMSDClient === 'no' &&
              <div>
                <Field
                  {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')}
                  component={renderFieldReview}
                  valueRenderer={getOptionDisplay(yesNo)}
                  section="other-services"
                  onEdit={onEdit}
                />

                { formState.bestStart.primaryCareGiver.isGettingWorkingForFamilies === 'yes' &&
                  <div className="review-subfields">
                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.irdNumber')}
                      component={renderFieldReview}
                      section="other-services"
                      onEdit={onEdit}
                    />

                    <Field
                      {...getFieldReviewProps(schema, 'ird.deliveryAddress')}
                      component={renderFieldReview}
                      valueRenderer={getOptionDisplay(irdDeliveryAddresses)}
                      section="other-services"
                      onEdit={onEdit}
                    />

                    {
                      formState.ird.deliveryAddress &&
                      <Field
                        {...getFieldReviewProps(schema, 'ird.numberByEmail')}
                        component={renderFieldReview}
                        valueRenderer={getOptionDisplay(yesNo)}
                        section="other-services"
                        onEdit={onEdit}
                      />
                    }

                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isSharingCare')}
                      component={renderFieldReview}
                      valueRenderer={getOptionDisplay(yesNo)}
                      section="other-services"
                      onEdit={onEdit}
                    />

                    { formState.bestStart.primaryCareGiver.isSharingCare === 'yes' &&
                      <div className="review-subfields">
                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.careSharer.firstNames')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.careSharer.surname')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.careSharer.daytimePhone')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />
                      </div>
                    }

                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')}
                      component={renderFieldReview}
                      valueRenderer={getOptionDisplay(yesNo)}
                      section="other-services"
                      onEdit={onEdit}
                      label={<span>Is the <PrimaryCaregiverText /> or their partner taking paid parental leave for this child?</span>}
                    />

                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.declarationAccepted')}
                      label="I consent for Inland Revenue to use this information to start Best Start payments and create an IRD number for this child."
                      component={renderFieldReview}
                      valueRenderer={value => value ? 'Yes' : 'No'}
                      section="other-services"
                      onEdit={onEdit}
                    />
                  </div>
                }

                { formState.bestStart.primaryCareGiver.isGettingWorkingForFamilies === 'no' &&
                  <div>
                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isTaxResident')}
                      component={renderFieldReview}
                      valueRenderer={getOptionDisplay(yesNo)}
                      section="other-services"
                      onEdit={onEdit}
                    />

                    { formState.bestStart.primaryCareGiver.isTaxResident === 'no' &&
                      <div className="review-subfields">
                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isChildResident')}
                          component={renderFieldReview}
                          valueRenderer={getOptionDisplay(yesNo)}
                          section="other-services"
                          onEdit={onEdit}
                        />
                        { formState.bestStart.primaryCareGiver.isChildResident === 'no' &&
                          <div className="review-subfields">
                            <Field
                              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')}
                              component={renderFieldReview}
                              valueRenderer={getOptionDisplay(yesNo)}
                              section="other-services"
                              onEdit={onEdit}
                            />
                            <Field
                              {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')}
                              component={renderFieldReview}
                              valueRenderer={getOptionDisplay(yesNo)}
                              section="other-services"
                              onEdit={onEdit}
                            />
                          </div>
                        }
                      </div>
                    }

                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isSharingCare')}
                      component={renderFieldReview}
                      valueRenderer={getOptionDisplay(yesNo)}
                      section="other-services"
                      onEdit={onEdit}
                    />

                    { formState.bestStart.primaryCareGiver.isSharingCare === 'yes' &&
                      <div className="review-subfields">
                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.careSharer.firstNames')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.careSharer.surname')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.careSharer.daytimePhone')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />
                      </div>
                    }

                    <Field
                      {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.hasPartner')}
                      component={renderFieldReview}
                      valueRenderer={getOptionDisplay(yesNo)}
                      section="other-services"
                      onEdit={onEdit}
                    />

                    { formState.bestStart.primaryCareGiver.hasPartner === 'yes' &&
                      <div className="review-subfields">
                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.partner.firstNames')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.partner.surname')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.partner.irdNumber')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />
                      </div>
                    }

                    { formState.bestStart.primaryCareGiver.hasPartner === 'yes' &&
                      <Field
                        {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')}
                        component={renderFieldReview}
                        valueRenderer={getOptionDisplay(yesNo)}
                        section="other-services"
                        onEdit={onEdit}
                        label={<span>Is the <PrimaryCaregiverText /> or their partner taking paid parental leave for this child?</span>}
                      />
                    }

                    { formState.bestStart.primaryCareGiver.hasPartner === 'no' &&
                      <Field
                        {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')}
                        component={renderFieldReview}
                        valueRenderer={getOptionDisplay(yesNo)}
                        section="other-services"
                        onEdit={onEdit}
                        label={<span>Is the <PrimaryCaregiverText /> taking paid parental leave for this child?</span>}
                      />
                    }

                    { formState.bestStart.primaryCareGiver.isMSDClient === 'no' &&
                      !bestStartNotEligble &&
                      <div>

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.irdNumber')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.bankAccount.name')}
                          component={renderFieldReview}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.bankAccount.number')}
                          component={renderFieldReview}
                          valueRenderer={formatBankAccount}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        { formState.bestStart.primaryCareGiver.bankAccount.creditUnion &&
                          <Field
                            {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.bankAccount.creditUnionReferenceNumber')}
                            component={renderFieldReview}
                            section="other-services"
                            onEdit={onEdit}
                          />

                        }

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.bankAccount.paymentFrequency')}
                          component={renderFieldReview}
                          valueRenderer={getOptionDisplay(paymentFrequency)}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        <Field
                          {...getFieldReviewProps(schema, 'ird.deliveryAddress')}
                          component={renderFieldReview}
                          valueRenderer={getOptionDisplay(irdDeliveryAddresses)}
                          section="other-services"
                          onEdit={onEdit}
                        />

                        {
                          formState.ird.deliveryAddress &&
                          <Field
                            {...getFieldReviewProps(schema, 'ird.numberByEmail')}
                            component={renderFieldReview}
                            valueRenderer={getOptionDisplay(yesNo)}
                            section="other-services"
                            onEdit={onEdit}
                          />
                        }

                        <Field
                          {...getFieldReviewProps(schema, 'bestStart.primaryCareGiver.declarationAccepted')}
                          component={renderFieldReview}
                          valueRenderer={value => value ? 'Yes' : 'No'}
                          section="other-services"
                          onEdit={onEdit}
                          label={<span>
                            I/We confirm that:
                            <ul>
                              <li>To the best of my/our knowledge the information supplied is true and correct, and</li>
                              <li>understand you may disclose my personal information to my spouse or partner and their information to me, and</li>
                              <li>consent to DIA sharing information that I have provided as part of my applications for an IRD number for my child, and for Best Start payment, with IR, and</li>
                              <li>consent to IR using the information provided to determine eligibility to other payments, update my records, and contact me as required. </li>
                            </ul>
                          </span>}
                        />
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }


    { (formState.bestStart.wanted === 'no' || bestStartNotEligble || formState.bestStart.primaryCareGiver.isMSDClient === 'yes') &&
      <div>

        { formState.bestStart.wanted === 'no' &&
          <Field
            {...getFieldReviewProps(schema, 'bestStart.wanted')}
            component={renderFieldReview}
            valueRenderer={getOptionDisplay(yesNo)}
            section="other-services"
            onEdit={onEdit}
          />
        }

        <h4>Apply for an IRD number for your child</h4>
        <Field
          {...getFieldReviewProps(schema, 'ird.applyForNumber')}
          component={renderFieldReview}
          valueRenderer={getOptionDisplay(yesNo)}
          section="other-services"
          onEdit={onEdit}
        />

        { formState.ird.applyForNumber === 'yes' &&
          <div>
            <Field
              {...getFieldReviewProps(schema, 'ird.deliveryAddress')}
              component={renderFieldReview}
              valueRenderer={getOptionDisplay(irdDeliveryAddresses)}
              section="other-services"
              onEdit={onEdit}
            />

            {
              formState.ird.deliveryAddress &&
              <Field
                {...getFieldReviewProps(schema, 'ird.numberByEmail')}
                component={renderFieldReview}
                valueRenderer={getOptionDisplay(yesNo)}
                section="other-services"
                onEdit={onEdit}
              />
            }

            <Field
              {...getFieldReviewProps(schema, 'ird.taxCreditIRDNumber')}
              component={renderFieldReview}
              section="other-services"
              onEdit={onEdit}
            />
          </div>
        }
      </div>
    }

    { (formState.bestStart.wanted === 'no' || bestStartNotEligble) &&
      <div>
        <h4>Notify the Ministry of Social Development (MSD) of the birth</h4>

        <Field
          {...getFieldReviewProps(schema, 'msd.notify')}
          component={renderFieldReview}
          valueRenderer={value => value ? 'Yes' : 'No'}
          section="other-services"
          onEdit={onEdit}
        />

        { formState.msd && formState.msd.notify &&
          <div>
            <Field
              {...getFieldReviewProps(schema, 'msd.mothersClientNumber')}
              component={renderFieldReview}
              section="other-services"
              onEdit={onEdit}
            />
            <Field
              {...getFieldReviewProps(schema, 'msd.fathersClientNumber')}
              component={renderFieldReview}
              section="other-services"
              onEdit={onEdit}
            />
          </div>
        }
      </div>
    }
  </div>
}

renderStep5Review.propTypes = {
  formState: PropTypes.object,
  onEdit: PropTypes.func
}

export default renderStep5Review
