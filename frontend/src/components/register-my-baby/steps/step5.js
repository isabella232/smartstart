import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Field, reduxForm, formValueSelector, change } from 'redux-form'
import get from 'lodash/get'
import moment from 'moment'
import makeFocusable from 'components/form/hoc/make-focusable'
import makeMandatoryLabel from 'components/form/hoc/make-mandatory-label'
import Accordion from 'components/form/accordion'
import PrimaryCaregiverText from 'components/register-my-baby/steps/schemas/primary-caregiver-text'
import SaveAsDraft from '../save-as-draft'
import {
  getIrdDeliveryAddresses,
  getPCGOptions
} from '../options'
import validate from './validation'
import warn from '../warn'
import schema from './schemas/step5'
import getFieldProps from 'components/form/get-field-props'
import SharingCareQuestions from '../sharing-care-questions'
import { BS_ELIGIBLE_DATE, isDateEligible, isPcgEligible } from '../best-start-utils'

class IrdMsdSharingForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      bstcDueDateEligible: false,
      bstcPCGEligible: false
    }
    this.onDueDateChange = this.onDueDateChange.bind(this)
    this.onPCGChange = this.onPCGChange.bind(this)
    this.onMSDClientChange = this.onMSDClientChange.bind(this)
    this.renderStillBirth = this.renderStillBirth.bind(this)
  }

  onDueDateChange(e, newVal) {
    this.checkDueDateEligibility(newVal)
  }

  onPCGChange(e, newVal) {
    this.checkPCGEligibility(newVal)
  }

  // NOTE Unlike the rest of the form, we want to clear any existing MSD data that might
  // have been entered if the value of MSD Client is changed to no
  onMSDClientChange(e, newVal) {
    if (newVal === 'no') {
      this.props.dispatch(change('registration', 'msd.notify', false))
      this.props.dispatch(change('registration', 'msd.mothersClientNumber', null))
      this.props.dispatch(change('registration', 'msd.fathersClientNumber', null))
    }
  }

  componentDidMount() {
    this.checkDueDateEligibility(this.props.dueDate)
    this.checkPCGEligibility(this.props.bstcPrimaryCaregiver)
  }

  // NOTE this method is depricated in future react and needs to be changed
  // after we update to react 16
  UNSAFE_componentWillReceiveProps(nextProps) {
    // formValueSelector returns undefined on a first render
    // we get value after component rendered and need to recheck eligibility again

    if (this.props.dueDate !== nextProps.dueDate) {
      this.checkDueDateEligibility(nextProps.dueDate)
    }

    if (this.props.bstcPrimaryCaregiver !== nextProps.bstcPrimaryCaregiver) {
      this.checkPCGEligibility(nextProps.bstcPrimaryCaregiver)
    }
  }

  checkDueDateEligibility(dueDate){
    const birthDate = get(this.props.initialValues, 'child.birthDate')

    this.setState({
      bstcDueDateEligible: isDateEligible(birthDate, dueDate)
    })
  }

  checkPCGEligibility(pcgType) {
    const pcgBirthday = new Date(get(this.props.initialValues, pcgType + '.dateOfBirth'))

    this.setState({
      bstcPCGEligible: isPcgEligible(pcgType, pcgBirthday)
    })
  }

  renderTabHeader() {
    return (
      <h2 className="step-heading">
        <span className="visuallyhidden">Step</span>
        <span className="step-number">5</span>
        He ratonga mā kōrua ko tō pēpi <br/>
        <span className="english">Services for you and your baby</span>
      </h2>
    )
  }

  renderStillBirth() {
    const { handleSubmit, onSubmit, onPrevious, onComebackToReview, submitting, isReviewing } = this.props

    return  (
      <form onSubmit={handleSubmit(onSubmit)}>
        {this.renderTabHeader()}

        <div className="informative-text intro">
          On a previous question, you indicated your baby was stillborn.
          We offer our sincerest sympathies for your loss.
          Unfortunately you are not entitled to Best Start payments for this child.
          <p>Just select <strong>Next</strong> to continue on or <strong>Back</strong> if you wish to change anything on the step before.</p>
        </div>
        <div className="form-actions bro-form-actions">
          <button type="button" className="previous" onClick={onPrevious}>Back</button>
          <div>
            { isReviewing &&
              <button type="button" className="review" onClick={handleSubmit(onComebackToReview)}>Return to review</button>
            }
            <button type="submit" className="next" disabled={submitting}>Next</button>
          </div>
        </div>
      </form>
    )
  }

  render() {
    const {
      applyForBSTC, dueDate, birthDate, bstcPrimaryCaregiver, bstcFirstName, bstcSurname, bstcPhone,
      bstcMSD, bstcTaxCredit, bstcNZResident, bstcTaxResident, bstcLivedInNZ, bstxTaxResidentWhenStarts,
      bstcChildResident, bstcShareCustody, bstcHasPartner, bstcPpl, creditUnion, applyForNumber, deliveryAddress,
      numberByEmail, msdNotify, fatherKnown,  handleSubmit,submitting, assistedHumanReproduction, assistedHumanReproductionManConsented,
      assistedHumanReproductionSpermDonor, assistedHumanReproductionWomanConsented, paymentFrequency, aliveAtBirth, secondParentPreferedTitle
    } = this.props
    const hideFatherOption = fatherKnown === 'no' || (assistedHumanReproduction === 'yes' && assistedHumanReproductionSpermDonor)
    const isOtherParent = assistedHumanReproduction === 'yes' && assistedHumanReproductionWomanConsented
    const irdDeliveryAddresses = getIrdDeliveryAddresses(isOtherParent, secondParentPreferedTitle)
    let pcgOptions = getPCGOptions(assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, fatherKnown, secondParentPreferedTitle)

    /*
     * Eligibilty rules:
     * 1) Principal Care Give can not be other or unknown
     * 2) Child must be born on or after July 1 2018 OR;
     * 3) Child must have an expected due date on or after July 1 2018
     * 4) Principal Care Giver must be a New Zealand resident
     * 5) Principal Care Giver must be 16 or older
     * 6) Principal Care Giver or Child must be a New Zealand tax resident OR;
     * 7) Principal Care Giver must have lived in NZ continuously for 12 months at any time AND;
     * 8) Principal Care Giver must by in NZ and a tax resident when best start starts AND;
     * 9) Both 7 and 8 MUST be answered
    */
    const bestStartNotEligble = (applyForBSTC === 'yes' &&
                                 ((bstcPrimaryCaregiver === 'other' || bstcPrimaryCaregiver === 'unknown') ||
                                 (dueDate && !this.state.bstcDueDateEligible ||
                                 bstcNZResident === 'no' || !this.state.bstcPCGEligible ||
                                 (bstcTaxResident === 'no' && bstcChildResident === 'no' &&
                                 (bstcLivedInNZ && bstxTaxResidentWhenStarts) &&
                                 (bstcLivedInNZ === 'no' || bstxTaxResidentWhenStarts === 'no')))))

    const deliveryAddresses = hideFatherOption ?
      irdDeliveryAddresses.filter(opt => opt.value !== 'fathersAddress') :
      irdDeliveryAddresses

    if (hideFatherOption) {
      pcgOptions = pcgOptions.filter(opt => opt.value !== 'father')
    }

    if (aliveAtBirth === 'no') {
      return this.renderStillBirth()
    }

    return (
      <div>
        {this.renderTabHeader()}
        <SaveAsDraft step={5} />

        <div className="informative-text intro">
          <p>If you want to, you can use this section to share your child's birth with government agencies so you can get payments and services for you and your baby.</p>
        </div>
        <form onSubmit={handleSubmit(this.props.onSubmit)}>
          <h4>Apply for Best Start payments</h4>
          <div className="informative-text">
            <p>If you're a New Zealand resident you can get Best Start payments until your baby turns one, no matter what you earn.</p>
            <p>Best Start is a government payment of $60 a week for each child born on or after 1 July 2018.</p>
            <p>You can apply now, but your Best Start payments usually won't start until paid parental leave finishes.</p>
          </div>

          <Field {...getFieldProps(schema, 'bestStart.wanted')} />

          <Accordion>
            <Accordion.Toggle>
              More about Best Start payments?
            </Accordion.Toggle>
            <Accordion.Content>
              <p>Best Start payments are part of the Working for Families tax credits.</p>
              <p>Receiving Best Start payments won’t affect any other payments or benefits you get.</p>
              <p>When your baby turns one, Best Start payments become income-tested. You may continue to get payments depending on your family's income.</p>
              <div>
                If your family's income is:
                <ul>
                  <li>under $79,000 a year before tax, you will continue to get $60 a week until your child turns 3</li>
                  <li>between $79,000 and $93,857 a year before tax, you may continue to get payments at a reduced amount until your child turns 3</li>
                  <li>over $93,857 a year before tax, you will stop getting payments for your child after they turn 1.</li>
                </ul>
              </div>
            </Accordion.Content>
          </Accordion>

          { applyForBSTC === 'yes' &&
            <div className="first-conditional">
            { moment(birthDate).isBefore(BS_ELIGIBLE_DATE) &&
              <div className="first-conditional">
                <Field {...getFieldProps(schema, 'bestStart.expectedDueDate')} onChange={this.onDueDateChange} />
                <Field {...getFieldProps(schema, 'bestStart.expectedDueDateWarning')} />
                <Accordion>
                  <Accordion.Toggle>
                    Why do you need to know the expected due date?
                  </Accordion.Toggle>
                  <Accordion.Content>
                    <p>The Best Start payment is for children born or expected on or after 1 July 2018.</p>
                    <p>To determine your eligibility please provide the child's expected due date.</p>
                  </Accordion.Content>
                </Accordion>
              </div>
            }

            { this.state.bstcDueDateEligible &&
              <div className="first-conditional">
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.type')} options={pcgOptions} onChange={this.onPCGChange} />
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiverWarning')} />
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiverUnknownWarning')} />
                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiverUnderSixteenWarning')} />
                <Accordion>
                  <Accordion.Toggle>
                    What is a principal caregiver?
                  </Accordion.Toggle>
                  <Accordion.Content>
                    <p>A principal caregiver must be at least 16 years old and is
                      the person responsible for the day to day care of the child on
                      a permanent basis.  Someone caring for a child on a temporary basis,
                      such as in a child care centre, is not a principal caregiver.</p>
                  </Accordion.Content>
                </Accordion>

                { this.state.bstcDueDateEligible &&
                  bstcPrimaryCaregiver === 'other' &&
                  <div className="first-conditional">
                    <div className="instruction-text">Please provide the contact details of the child's principal caregiver</div>
                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.firstNames')} />
                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.surname')} />
                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.daytimePhone')} />
                    {bstcFirstName && bstcSurname && bstcPhone &&
                      <div className="first-conditional">
                        <div className="informative-text">
                          Thank you, Inland Revenue will call the principal caregiver to discuss Best Start payments.
                        </div>
                      </div>
                    }
                  </div>
                }

                { (this.state.bstcDueDateEligible  &&
                  this.state.bstcPCGEligible &&
                  bstcNZResident === 'yes') &&
                  (bstcPrimaryCaregiver === 'mother' || bstcPrimaryCaregiver === 'father') &&
                  <div className="first-conditional">
                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isMSDClient')} onChange={this.onMSDClientChange} />

                    {bstcMSD === 'yes' &&
                      <div className="conditional-field">
                        <div className="instruction-text">
                          If the <PrimaryCaregiverText /> is an existing MSD client, you should notify MSD of the child's birth to arrange Best Start payments and to see how the new baby may affect their benefits and services.
                        </div>
                        <Field {...getFieldProps(schema, 'msd.notify')} />
                        <Accordion>
                          <Accordion.Toggle>
                            How does MSD use the birth information about my child?
                          </Accordion.Toggle>
                          <Accordion.Content>
                            <p>The Ministry of Social Development (MSD) will use the birth of child information
                              that you agreed to provide to MSD to determine eligibility to payments and or services.
                              MSD may need to contact you and/or ask for further verification to help them determine this.
                              The Ministry of Social Development includes Work and Income, MSD Housing Assessment,
                              Senior Services, StudyLink and other service lines. The legislation administered by the
                              MSD allows them to check the information that you provide. This may happen when you apply
                              for assistance and at any time after that.</p>
                          </Accordion.Content>
                        </Accordion>
                        { msdNotify === true &&
                          <div className="conditional-field">
                            <div className="info">
                              The Ministry of Social Development (MSD) will use the birth of child information that
                              you agreed to provide to MSD to determine eligibility to payments and or services.
                              MSD may need to contact you and / or ask for further verification to help them determine this.
                              The Ministry of Social Development includes Work and Income, MSD Housing Assessment,
                              Senior Services, StudyLink and other service lines. The legislation administered by the MSD
                              allows them to check the information that you provide. This may happen when you apply for
                              assistance and at any time after that.
                            </div>
                            <Field {...getFieldProps(schema, 'msd.mothersClientNumber')} />
                            <Field {...getFieldProps(schema, 'msd.fathersClientNumber')} />
                          </div>
                        }
                      </div>
                    }

                    {bstcMSD === 'no' &&
                      <div className="first-conditional">
                        <div className="info">
                          If the principal caregiver only receives supplementary payments from MSD (like the accommodation
                          supplement or childcare subsidy), they should notify MSD of the birth of this child to ensure
                          MSD are aware of the birth.
                        </div>
                        <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')} />

                        { bstcTaxCredit === 'yes' &&
                            <div className="conditional-field">
                              <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.irdNumber')} />
                              <Field {...getFieldProps(schema, 'ird.deliveryAddress')} options={deliveryAddresses} />
                                { deliveryAddress &&
                                  <div className="first-conditional">
                                    <Field {...getFieldProps(schema, 'ird.numberByEmail')} />
                                    { numberByEmail === 'yes' &&
                                      <span className="info">
                                        By selecting <strong>Yes</strong> you agree to receive your child's IRD number by email.
                                        Inland Revenue will take all reasonable steps to reduce any risk of unauthorised access
                                        or release of confidential information. If you don’t provide consent, your child's IRD
                                        number will be mailed to the postal address you have provided.
                                      </span>
                                    }
                                  </div>
                                }
                              <SharingCareQuestions
                                schema={schema}
                                wfftcForm={true}
                                {...this.props}
                              />
                              <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.declarationAccepted')}
                                label="I consent for Inland Revenue to use this information to start Best Start payments and create an IRD number for this child."/>
                            </div>
                        }

                      { bstcTaxCredit === 'no' &&
                          <div className="first-conditional">
                            <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isTaxResident')} />
                            { bstcTaxResident === 'no' &&
                              <div className="conditional-field">
                                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.isChildResident')} />
                                { bstcChildResident === 'no' &&
                                  <div className="first-conditional">
                                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')} />
                                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')} />
                                    <Accordion>
                                      <Accordion.Toggle>
                                        What does it mean to be a tax resident?
                                      </Accordion.Toggle>
                                      <Accordion.Content>
                                        <p>You are a tax resident in New Zealand if you: </p>
                                        <ul>
                                          <li>are in New Zealand for more than 183 days in any 12-month period and haven't become a non-resident, or</li>
                                          <li>have a 'permanent place of abode' in New Zealand, or</li>
                                          <li>are away from New Zealand in the service of the New Zealand government.</li>
                                        </ul>
                                      </Accordion.Content>
                                    </Accordion>
                                  </div>
                                }
                                <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.taxResidentWarning')} />
                              </div>
                            }
                            { ((bstcTaxResident === 'yes' || bstcChildResident === 'yes') ||
                              (bstcLivedInNZ === 'yes' && bstxTaxResidentWhenStarts === 'yes')) &&
                              <SharingCareQuestions
                                schema={schema}
                                wfftcForm={false}
                                {...this.props}
                              />
                            }
                          </div>
                        }
                    </div>
                  }
                  </div>
                }
              </div>
            }

              { !bestStartNotEligble && bstcMSD === 'no' && bstcTaxCredit === 'no' &&
                (bstcTaxResident === 'yes' || (bstcTaxResident === 'no' && (bstcChildResident === 'yes' ||
                (bstcLivedInNZ === 'yes' && bstxTaxResidentWhenStarts === 'yes')))) &&
                bstcShareCustody && bstcHasPartner && bstcPpl &&
                <div className="first-conditional">
                  <p>Thank you. To begin your Best Start payments, we need the following details:</p>
                  <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.irdNumber')} label="IRD number of the principal caregiver" />
                  <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.bankAccount.name')} />
                  <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.bankAccount.number')} />
                  <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.bankAccount.creditUnion')} />

                  { creditUnion &&
                    <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.bankAccount.creditUnionReferenceNumber')} />
                  }

                  <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.bankAccount.paymentFrequency')} />
                  { paymentFrequency === 'B' &&
                      <div className="info lump-sum-alert">Note that the lump sum Best Start payment is made to the principal
                        caregiver after the end of the financial year, which is 31 March each year.</div>
                  }
                  <Accordion>
                    <Accordion.Toggle>
                      Best Start payment amount
                    </Accordion.Toggle>
                    <Accordion.Content>
                      <p>You can choose to have your Best Start payments:</p>
                      <ul>
                        <li>Weekly - up to $60 per week</li>
                        <li>Fortnightly - up to $120 per fortnight</li>
                        <li>Yearly (lump sum) – up to $3,120 (paid after the end of the tax year)</li>
                      </ul>
                    </Accordion.Content>
                  </Accordion>
                  <Field {...getFieldProps(schema, 'ird.deliveryAddress')} options={deliveryAddresses} />

                  { deliveryAddress &&
                    <Field {...getFieldProps(schema, 'ird.numberByEmail')} />
                  }

                  { numberByEmail === 'yes' &&
                    <span className="info">
                      By selecting <strong>Yes</strong> you agree to receive your child's
                      IRD number by email. Inland Revenue will take all reasonable steps
                      to reduce any risk of unauthorised access or release of confidential
                      information. If you don’t provide consent, your child's IRD number will
                      be mailed to the postal address you have provided.
                    </span>
                  }

                  <Field {...getFieldProps(schema, 'bestStart.primaryCareGiver.declarationAccepted')}
                    label={makeMandatoryLabel(<span>
                      I/We confirm that:
                      <ul>
                        <li>To the best of my/our knowledge the information supplied is true and correct, and</li>
                        <li>understand you may disclose my personal information to my spouse or partner and their information to me, and</li>
                        <li>consent to DIA sharing information that I have provided as part of my applications for an IRD number for my child, and for Best Start payment, with IR, and</li>
                        <li>consent to IR using the information provided to determine eligibility to other payments, update my records, and contact me as required. </li>
                      </ul>
                    </span>)} />
                </div>
              }
            </div>
          }

          { (applyForBSTC === 'no' ||
            bestStartNotEligble ||
            bstcMSD === 'yes') &&
            <div className="first-conditional">
            <h4>Apply for an IRD number for your child</h4>
            <div className="informative-text">
              The easiest way to apply for an IRD number is using this birth registration form. It is free to apply for an IRD number and it saves you having to get another set of forms to apply for it later. If you apply for one now, you should receive it within 15 working days of submitting a correct and complete birth registration form. The IRD number will arrive separately to the birth certificate (if you're ordering one).
            </div>

              <div className="expandable-group secondary">
                <Accordion>
                  <Accordion.Toggle>
                    Who is eligible to apply for an IRD number for their child?
                  </Accordion.Toggle>
                  <Accordion.Content>
                    <p>If one of the parents:</p>
                    <ul>
                      <li>is a NZ or Australian citizen; or</li>
                      <li>has NZ or Australian permanent residency; or</li>
                      <li>is a resident of the Cook Islands, Tokelau, or Niue.</li>
                    </ul>
                    <p>then the easiest way for you to get an IRD number for your child is by using this birth registration form.  It doesn’t cost anything  to apply for an IRD number and it saves you having to get another set of forms to apply for it later.</p>
                  </Accordion.Content>
                </Accordion>

                <Accordion>
                  <Accordion.Toggle>
                    Why should I apply for an IRD number for my child?
                  </Accordion.Toggle>
                  <Accordion.Content>
                    <p>You will need an IRD number for your child if you wish to open a bank account or Kiwisaver in their name, or if you are applying for Working for Families Tax Credits.</p>
                    <p>If you have already applied for Working for Families tax credits (WfFTC) for your child, make sure you include your IRD number below. Inland Revenue needs this to give you the payments. When your child is given an IRD number, Inland Revenue will add it to your WfFTC registration details for you.</p>
                    <p>If you apply for your child's IRD number, Births, Deaths and Marriages will provide Birth Registration information to Inland Revenue so that they can create your child’s IRD number and help protect it from misuse.</p>
                    <p>For more information:</p>
                    <ul>
                      <li>on how this information is used and protected go to <a href="https://www.ird.govt.nz/privacy" target="_blank" rel="noreferrer noopener">www.ird.govt.nz/privacy</a></li>
                      <li>about applying for an IRD number go to: <a href="https://www.ird.govt.nz" target="_blank" rel="noreferrer noopener">www.ird.govt.nz</a> (search keyword "IRD number")</li>
                      <li>phone Inland Revenue on <strong>0800 775 247</strong> - keyword "newborn IRD number"</li>
                    </ul>
                  </Accordion.Content>
                </Accordion>
              </div>

              <Field {...getFieldProps(schema, 'ird.applyForNumber')} />

              { applyForNumber === 'yes' &&
                <div className="conditional-field">

                  { bstcMSD === 'yes' && !bestStartNotEligble &&
                    <Field {...getFieldProps(schema, 'ird.deliveryAddress')} options={deliveryAddresses} />
                  }
                  { (applyForBSTC === 'no' ||
                    bestStartNotEligble) &&
                    <Field {...getFieldProps(schema, 'ird.deliveryAddress')} options={deliveryAddresses} instructionText="" />
                  }
                  {
                    deliveryAddress &&
                    <Field {...getFieldProps(schema, 'ird.numberByEmail')} />
                  }

                  {
                    numberByEmail === 'yes' &&
                    <span className="info">
                      By selecting <strong>Yes</strong> you agree to receive your child's IRD number by email. Inland Revenue will take all reasonable steps to reduce any risk of unauthorised access or release of confidential information. If you don’t provide consent, your IRD number will be mailed to the postal address you have provided.
                    </span>
                  }

                  <Field {...getFieldProps(schema, 'ird.taxCreditIRDNumber')} />
                </div>
              }

              { bstcMSD !== 'yes' &&
                <div>
                  <h4>Notify the Ministry of Social Development (MSD) of the birth</h4>
                  <div className="informative-text">
                    If you're an existing MSD client, you should notify MSD to see how your new baby may affect your benefits and services.
                  </div>

                  <div className="expandable-group secondary">
                    <Accordion>
                      <Accordion.Toggle>
                        Why should I let MSD know about the birth of my child?
                      </Accordion.Toggle>
                      <Accordion.Content>
                        <p>Birth, Deaths and Marriages (BDM) can notify MSD for you when the birth is registered, if you want us to.</p>
                        <p>If you do this, you don't need to provide a birth certificate to MSD, and may not need to visit an MSD office.</p>
                        <p>For more information about the information you provide and your privacy see:</p>
                        <ul>
                          <li><a href="https://smartstart.services.govt.nz/your-privacy" target="_blank" rel="noreferrer noopener">Birth Registration - Privacy</a></li>
                          <li><a href="https://www.workandincome.govt.nz/about-this-site/privacy-disclaimer-and-copyright-information.html" target="_blank" rel="noreferrer noopener">Work and Income- Privacy</a></li>
                        </ul>
                      </Accordion.Content>
                    </Accordion>
                  </div>

                  <Field {...getFieldProps(schema, 'msd.notify')} />

                  { msdNotify &&
                    <div className="conditional-field">
                      <div className="info">
                        The Ministry of Social Development (MSD) will use the birth of child information that you agreed to provide to MSD to determine eligibility to payments and or services. MSD may need to contact you and / or ask for further verification to help them determine this. The Ministry of Social Development includes Work and Income, MSD Housing Assessment, Senior Services, StudyLink and other service lines. The legislation administered by the MSD allows them to check the information that you provide. This may happen when you apply for assistance and at any time after that.
                      </div>
                      <Field {...getFieldProps(schema, 'msd.mothersClientNumber')} />
                      <Field {...getFieldProps(schema, 'msd.fathersClientNumber')} />
                    </div>
                  }
                </div>
              }
          </div>
        }

          <div className="form-actions bro-form-actions">
            { this.props.isReviewing ?
              <button type="button" className="previous" onClick={handleSubmit(this.props.onPrevious)}>Back</button>:
              <button type="button" className="previous" onClick={this.props.onPrevious}>Back</button>
            }
            { this.props.isReviewing &&
              <button type="button" className="review" onClick={handleSubmit(this.props.onComebackToReview)}>Return to review</button>
            }
            <button type="submit" className="next" disabled={submitting}>Next</button>
          </div>
        </form>
      </div>
    )
  }
}

IrdMsdSharingForm.propTypes = {
  initialValues: PropTypes.object,
  applyForBSTC: PropTypes.string,
  applyForNumber: PropTypes.string,
  birthDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  dueDate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  bstcPrimaryCaregiver:  PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  bstcFirstName: PropTypes.string,
  bstcSurname: PropTypes.string,
  bstcPhone: PropTypes.string,
  bstcMSD: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcTaxCredit: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcNZResident: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcTaxResident: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcLivedInNZ: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstxTaxResidentWhenStarts: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcChildResident: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcShareCustody: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool
  ]),
  bstcHasPartner: PropTypes.string,
  bstcPpl: PropTypes.string,
  creditUnion: PropTypes.bool,
  deliveryAddress: PropTypes.string,
  numberByEmail: PropTypes.string,
  msdNotify: PropTypes.bool,
  fatherKnown: PropTypes.string,
  paymentFrequency: PropTypes.string,
  assistedHumanReproduction: PropTypes.string,
  assistedHumanReproductionSpermDonor: PropTypes.bool,
  assistedHumanReproductionWomanConsented: PropTypes.bool,
  secondParentPreferedTitle: PropTypes.string,
  onSubmit: PropTypes.func,
  onPrevious: PropTypes.func,
  isReviewing: PropTypes.bool,
  onComebackToReview: PropTypes.func,
  handleSubmit: PropTypes.func,
  submitting: PropTypes.bool,
  pristine: PropTypes.bool,
  dispatch: PropTypes.func,
}

IrdMsdSharingForm = reduxForm({
  form: 'registration',
  destroyOnUnmount: false,
  forceUnregisterOnUnmount: true,
  validate,
  warn
})(IrdMsdSharingForm)


const selector = formValueSelector('registration')

IrdMsdSharingForm = connect(
  state => ({
    initialValues: get(state, 'birthRegistration.savedRegistrationForm.data'),
    applyForBSTC: selector(state, 'bestStart.wanted'),
    birthDate: selector(state, 'child.birthDate'),
    dueDate:  selector(state, 'bestStart.expectedDueDate'),
    bstcPrimaryCaregiver: selector(state, 'bestStart.primaryCareGiver.type'),
    bstcFirstName: selector(state, 'bestStart.primaryCareGiver.firstNames'),
    bstcSurname: selector(state, 'bestStart.primaryCareGiver.surname'),
    bstcPhone: selector(state, 'bestStart.primaryCareGiver.daytimePhone'),
    bstcMSD: selector(state, 'bestStart.primaryCareGiver.isMSDClient'),
    bstcTaxCredit: selector(state, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies'),
    bstcNZResident: selector(state, 'bestStart.primaryCareGiver.isNewZealandResident'),
    bstcTaxResident: selector(state, 'bestStart.primaryCareGiver.isTaxResident'),
    bstcLivedInNZ: selector(state, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths'),
    bstxTaxResidentWhenStarts: selector(state, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts'),
    bstcChildResident: selector(state, 'bestStart.primaryCareGiver.isChildResident'),
    bstcShareCustody: selector(state, 'bestStart.primaryCareGiver.isSharingCare'),
    bstcHasPartner: selector(state, 'bestStart.primaryCareGiver.hasPartner'),
    bstcPpl: selector(state, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave'),
    creditUnion: selector(state, 'bestStart.primaryCareGiver.bankAccount.creditUnion'),
    applyForNumber: selector(state, 'ird.applyForNumber'),
    deliveryAddress: selector(state, 'ird.deliveryAddress'),
    numberByEmail: selector(state, 'ird.numberByEmail'),
    msdNotify: selector(state, 'msd.notify'),
    fatherKnown: selector(state, 'fatherKnown'),
    aliveAtBirth: selector(state, 'child.aliveAtBirth'),
    paymentFrequency: selector(state, 'bestStart.primaryCareGiver.bankAccount.paymentFrequency'),
    assistedHumanReproduction: selector(state, 'assistedHumanReproduction'),
    assistedHumanReproductionSpermDonor: selector(state, 'assistedHumanReproductionSpermDonor'),
    assistedHumanReproductionManConsented: selector(state, 'assistedHumanReproductionManConsented'),
    assistedHumanReproductionWomanConsented: selector(state, 'assistedHumanReproductionWomanConsented'),
    secondParentPreferedTitle: selector(state, 'secondParent.preferedTitle'),
  }))(IrdMsdSharingForm)

export default makeFocusable(IrdMsdSharingForm)
