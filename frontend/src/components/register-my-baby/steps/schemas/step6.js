import makeMandatoryLabel from 'components/form/hoc/make-mandatory-label'
import renderRadioGroup from 'components/form/fields/render-radio-group'
import renderField from 'components/form/fields/render-field'
import renderError from 'components/form/fields/render-error'
import renderFieldWithButton from 'components/form/fields/render-field-with-button'
import { requiredWithMessage } from 'components/form/validators'
import { REQUIRE_MESSAGE_MYIR_USERNAME } from '../../validation-messages'
import {
  yesNo as yesNoOptions
} from '../../options'
import { maxLength } from 'components/form/normalizers'
import {
  required,
  email,
  validPhoneNumber
} from '../../validate'

const fields = {
  'myir.wanted': {
    name: 'myir.wanted',
    component: renderRadioGroup,
    label: makeMandatoryLabel("Do you want to sign up for a myIR account now?"),
    options: yesNoOptions,
    validate: [required]
  },
  'myir.firstNames': {
    name: 'myir.firstNames',
    component: renderField,
    type: 'text',
    label: makeMandatoryLabel('First names'),
    disabled: true
  },
  'myir.lastName': {
    name: 'myir.lastName',
    component: renderField,
    type: 'text',
    label: makeMandatoryLabel('Surname'),
    disabled: true
  },
  'myir.dateOfBirth': {
    name: 'myir.dateOfBirth',
    component: renderField,
    type: 'text',
    label: makeMandatoryLabel('Date of birth'),
    disabled: true
  },
  'myir.irdNumber': {
    name: 'myir.irdNumber',
    component: renderField,
    type: 'text',
    label: makeMandatoryLabel('IRD number'),
    disabled: true
  },
  'myir.email': {
    name: "myir.email",
    component: renderField,
    type: "email",
    label: "Your email address",
    validate: [email, required],
    normalize: maxLength(60)
  },
  'myir.detailsConsent': {
    name: 'myir.detailsConsent',
    component: renderRadioGroup,
    label: makeMandatoryLabel(`
      Do you, the primary caregiver, consent for us to check the above details with
      Inland Revenue to make sure we have the right details to set up your myIR account?`
    ),
    options: yesNoOptions,
    validate: [required]
  },
  'myir.username': {
    name: 'myir.username',
    component: renderFieldWithButton,
    type: 'search',
    label: makeMandatoryLabel(`Great, now choose a username for your account`),
    validate: [requiredWithMessage(REQUIRE_MESSAGE_MYIR_USERNAME)],
    buttonLabel: 'Check if available',
    placeholder: 'e.g. parent@mail.com',
    maxLength: 254
  },
  'myir.usernameStatus': {
    name: 'myir.usernameStatus',
    component: renderError
  },
  'myir.notifyByText': {
    name: 'myir.notifyByText',
    component: renderRadioGroup,
    label: makeMandatoryLabel(`Success! Would you like to receive text notifications from your myIR account` ),
    options: yesNoOptions,
    validate: [required]
  },
  'myir.mobile': {
    name: "myir.mobile",
    component: renderField,
    type: "text",
    label: "Your mobile number",
    instructionText: "This must be a New Zealand mobile number",
    placeholder: "e.g. 021 234 5678",
    validate: [validPhoneNumber, required],
    normalize: maxLength(20)
  },
  'myir.reserveStatus': {
    name: 'myir.reserveStatus',
    component: renderError
  },
}

export default fields
