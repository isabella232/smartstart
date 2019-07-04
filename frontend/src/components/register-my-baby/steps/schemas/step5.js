import React from 'react'
import makeMandatoryLabel from 'components/form/hoc/make-mandatory-label'
import renderField from 'components/form/fields/render-field'
import renderSelect from 'components/form/fields/render-select'
import renderCheckbox from 'components/form/fields/render-checkbox'
import renderRadioGroup from 'components/form/fields/render-radio-group'
import renderDatepicker from 'components/form/fields/render-datepicker'
import renderWarning from 'components/form/fields/render-warning'
import renderBankAccount from 'components/form/fields/render-bank-account'
import FatherText from './father-text'
import MotherText from './mother-text'
import PrimaryCaregiverText from './primary-caregiver-text'
import {
  yesNo as yesNoOptions,
  paymentFrequency as paymentFrequencyOptions
} from '../../options'
import { requiredWithMessage } from 'components/form/validators'
import { required, validIrd, validMsd, validFutureDate, requiredTrue, requiredTrueMSD, validPhoneNumber, validBankAccount, validAlpha } from '../../validate'
import { maximum, maxLength } from 'components/form/normalizers'
import {
  REQUIRE_MESSAGE,
  REQUIRE_IRD_ADDRESS
} from '../../validation-messages'

const fields = {
  'bestStart.wanted': {
    name: 'bestStart.wanted',
    component: renderRadioGroup,
    label: makeMandatoryLabel("Do you want to apply for Best Start now?"),
    options: yesNoOptions,
    validate: [required],
  },
  'bestStart.expectedDueDate': {
    name: 'bestStart.expectedDueDate',
    component: renderDatepicker,
    label: makeMandatoryLabel("What was the child's expected due date?"),
    validate: [required, validFutureDate],
  },
  'bestStart.expectedDueDateWarning': {
    name: 'bestStart.expectedDueDateWarning',
    component: renderWarning,
  },
  'bestStart.primaryCareGiver.type': {
    name: 'bestStart.primaryCareGiver.type',
    component: renderRadioGroup,
    options: [],
    label: makeMandatoryLabel("Who is the child’s principal caregiver?"),
    instructionText: "Best Start payments are made to the principal caregiver of the child you are registering",
    validate: [required],
  },
  'bestStart.primaryCareGiverWarning': {
    name: 'bestStart.primaryCareGiverWarning',
    component: renderWarning,
  },
  'bestStart.primaryCareGiverUnknownWarning': {
    name: 'bestStart.primaryCareGiverUnknownWarning',
    component: renderWarning,
  },
  'bestStart.primaryCareGiverUnderSixteenWarning': {
    name: 'bestStart.primaryCareGiverUnderSixteenWarning',
    component: renderWarning,
  },
  'bestStart.primaryCareGiver.firstNames': {
    name: 'bestStart.primaryCareGiver.firstNames',
    component: renderField,
    type: "text",
    label: "First name",
    placeholder: "Aroha",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.surname': {
    name: 'bestStart.primaryCareGiver.surname',
    component: renderField,
    type: "text",
    label: "Surname",
    placeholder: "Smith",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.daytimePhone': {
    name: 'bestStart.primaryCareGiver.daytimePhone',
    component: renderField,
    type: "text",
    label: "Daytime contact number",
    instructionText: "Please include the area code or suffix, but don't use brackets or spaces",
    placeholder: "e.g. 041234567",
    validate: [required, validPhoneNumber],
    normalize: maxLength(20),
  },
  'bestStart.primaryCareGiver.isMSDClient': {
    name: 'bestStart.primaryCareGiver.isMSDClient',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Does the <PrimaryCaregiverText /> receive a benefit from Ministry of Social Development (MSD)?</span>),
    instructionText: "If you only receive supplementary payments such as child care or accommodation supplements from MSD, please select no.",
    options: yesNoOptions,
    validate: [required],
  },
  'bestStart.primaryCareGiver.isNewZealandResident': {
    name: 'bestStart.primaryCareGiver.isNewZealandResident',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Is the <PrimaryCaregiverText /> a New Zealand resident?</span>),
    options: yesNoOptions,
  },
  'bestStart.primaryCareGiver.isTaxResident': {
    name: 'bestStart.primaryCareGiver.isTaxResident',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Does the <PrimaryCaregiverText /> normally live in New Zealand?</span>),
    options: yesNoOptions,
    validate: [required]
  },
  'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths': {
    name: 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Has the <PrimaryCaregiverText /> lived in New Zealand continuously for at least a 12 months at any time?</span>),
    options: yesNoOptions,
    validate: [required]
  },
  'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts': {
    name: 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Will the <PrimaryCaregiverText /> be in New Zealand and a tax resident when receiving Best Start payments?</span>),
    options: yesNoOptions,
    validate: [required]
  },
  'bestStart.primaryCareGiver.isChildResident': {
    name: 'bestStart.primaryCareGiver.isChildResident',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Will the child be resident and living in New Zealand when the principal caregiver is receiving Best Start payments?</span>),
    options: yesNoOptions,
    validate: [required]
  },
  'bestStart.primaryCareGiver.taxResidentWarning': {
    name: 'bestStart.primaryCareGiver.taxResidentWarning',
    component: renderWarning,
  },
  'bestStart.primaryCareGiver.isGettingWorkingForFamilies': {
    name: 'bestStart.primaryCareGiver.isGettingWorkingForFamilies',
    component: renderRadioGroup,
    label:  makeMandatoryLabel(<span>Does the <PrimaryCaregiverText /> currently receive Working for Families tax credits from Inland Revenue?</span>),
    options: yesNoOptions,
    validate: [required],
  },
  'bestStart.primaryCareGiver.isSharingCare': {
    name: 'bestStart.primaryCareGiver.isSharingCare',
    component: renderRadioGroup,
    label: makeMandatoryLabel("Does this child live with someone in a different household for more than two days a week (shared care)?"),
    options: yesNoOptions,
    validate: [required],
  },
  'bestStart.primaryCareGiver.careSharer.firstNames': {
    name: 'bestStart.primaryCareGiver.careSharer.firstNames',
    component: renderField,
    type: "text",
    label: "First name",
    placeholder: "Aroha",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.careSharer.surname': {
    name: 'bestStart.primaryCareGiver.careSharer.surname',
    component: renderField,
    type: "text",
    label: "Surname",
    placeholder: "Smith",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.careSharer.daytimePhone': {
    name: 'bestStart.primaryCareGiver.careSharer.daytimePhone',
    component: renderField,
    type: "text",
    label: "Daytime contact number",
    instructionText: "Please include the area code or suffix, but don't use brackets or spaces",
    placeholder: "e.g. 041234567",
    validate: [validPhoneNumber, required],
    normalize: maxLength(20),
  },
  'bestStart.primaryCareGiver.hasPartner': {
    name: 'bestStart.primaryCareGiver.hasPartner',
    component: renderRadioGroup,
    label: makeMandatoryLabel(<span>Does the <PrimaryCaregiverText /> currently have a spouse or partner living with them?</span>),
    options: yesNoOptions,
    validate: [required]
  },
  'bestStart.primaryCareGiver.partner.firstNames': {
    name: 'bestStart.primaryCareGiver.partner.firstNames',
    component: renderField,
    type: "text",
    label: "First name",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.partner.surname': {
    name: 'bestStart.primaryCareGiver.partner.surname',
    component: renderField,
    type: "text",
    label: "Surname",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.partner.irdNumber': {
    name: 'bestStart.primaryCareGiver.partner.irdNumber',
    component: renderField,
    type: "text",
    label: "Partner's IRD number",
    validate: [required, validIrd],
    normalize: maximum(999999999),
  },
  'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave': {
    name: 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave',
    component: renderRadioGroup,
    label:  makeMandatoryLabel(<span>Is the <PrimaryCaregiverText /> or their spouse or partner intending to apply for Paid Parental Leave for this child, if you haven’t already done so?</span>),
    options: yesNoOptions,
    validate: [required],
  },
  'bestStart.primaryCareGiver.irdNumber': {
    name: 'bestStart.primaryCareGiver.irdNumber',
    component: renderField,
    type: "text",
    label: makeMandatoryLabel("Enter the principal caregiver's IRD number so your new child can be added to the existing Working for Families tax credit record."),
    validate: [required, validIrd],
    normalize: maximum(999999999),
  },
  'bestStart.primaryCareGiver.bankAccount.name': {
    name: 'bestStart.primaryCareGiver.bankAccount.name',
    component: renderField,
    type: "text",
    label: makeMandatoryLabel("Principal caregiver bank account holder name "),
    instructionText: "This must be in the principal caregiver’s name or held jointly with their spouse or partner.",
    validate: [required, validAlpha],
    normalize: maxLength(75),
  },
  'bestStart.primaryCareGiver.bankAccount.number': {
    name: 'bestStart.primaryCareGiver.bankAccount.number',
    component: renderBankAccount,
    type: 'number',
    label: makeMandatoryLabel("Bank account number you want the Best Start payments to be made into"),
    validate: [validBankAccount],
  },
  'bestStart.primaryCareGiver.bankAccount.creditUnion': {
    name: 'bestStart.primaryCareGiver.bankAccount.creditUnion',
    component: renderCheckbox,
    label: "This is a Credit Union account",
  },
  'bestStart.primaryCareGiver.bankAccount.creditUnionReferenceNumber': {
    name: 'bestStart.primaryCareGiver.bankAccount.creditUnionReferenceNumber',
    component: renderField,
    type: "text",
    label: makeMandatoryLabel("Please enter the Credit Union reference"),
    validate: [validPhoneNumber, required],
    normalize: maxLength(10),
  },
  'bestStart.primaryCareGiver.bankAccount.paymentFrequency': {
    name: "bestStart.primaryCareGiver.bankAccount.paymentFrequency",
    component: renderSelect,
    options: paymentFrequencyOptions,
    label: makeMandatoryLabel("Choose how often you want the Best Start payments to be made?"),
    validate: [requiredWithMessage(REQUIRE_MESSAGE)],
  },
  'bestStart.primaryCareGiver.declarationAccepted': {
    name: "bestStart.primaryCareGiver.declarationAccepted",
    component: renderCheckbox,
    validate: [requiredTrue],
  },
  'ird.applyForNumber': {
    name: "ird.applyForNumber",
    component: renderRadioGroup,
    label: makeMandatoryLabel("Do you wish to apply for an IRD number for your child?"),
    options: yesNoOptions,
    validate: [required],
  },
  'ird.deliveryAddress': {
    name: "ird.deliveryAddress",
    component: renderSelect,
    options: [],
    label: makeMandatoryLabel("Please choose an address IR should post your child's IRD number to."),
    instructionText: "In order to receive Best Start payments Inland Revenue need to issue an IRD number for your child",
    validate: [requiredWithMessage(REQUIRE_IRD_ADDRESS)],
  },
  'ird.numberByEmail': {
    name: "ird.numberByEmail",
    component: renderRadioGroup,
    label: makeMandatoryLabel("Do you also wish to receive your child's IRD number by email?"),
    options: yesNoOptions,
    validate: [required],
  },
  'ird.taxCreditIRDNumber': {
    name: "ird.taxCreditIRDNumber",
    component: renderField,
    type: "text",
    instructionText: "This will allow Inland Revenue to add the child's IRD number to your Working for Families details.",
    label: "If you have applied for Working for Families Tax Credits for this child please provide your IRD number.",
    validate: [validIrd],
    normalize: maximum(999999999),
  },
  'msd.notify': {
    name: "msd.notify",
    label: "I give permission for Births, Deaths and Marriages to notify the Ministry of Social Development of the birth of my child.",
    component: renderCheckbox,
    validate: [requiredTrueMSD]
  },
  'msd.mothersClientNumber': {
    name: "msd.mothersClientNumber",
    component: renderField,
    type: "text",
    label: <span>MSD client number of <MotherText /></span>,
    instructionText: "Please provide the MSD client number for at least one parent",
    validate: [validMsd],
    normalize: maximum(999999999),
  },
  'msd.fathersClientNumber': {
    name: "msd.fathersClientNumber",
    component: renderField,
    type: "text",
    label: <span>MSD client number of <FatherText /></span>,
    instructionText: "Please provide the MSD client number for at least one parent",
    validate: [validMsd],
    normalize: maximum(999999999),
  }
}

export default fields
