import React from 'react'
import { Link } from 'react-router'
import FatherText from './steps/schemas/father-text'
import MotherText from './steps/schemas/mother-text'
import PrimaryCaregiverText from './steps/schemas/primary-caregiver-text'


export const REQUIRE_AT_LEAST_ONE = 'You have to select at least one of the above.'
export const REQUIRE_EXPLAINATION = 'Please provide an explanation.'
export const INVALID_DATE_MESSAGE = 'The selected date is not valid, please try again.'
export const INVALID_NUMBER_MESSAGE = 'This is not a valid number, please try again.'
export const WARNING_CITIZENSHIP = 'Note - If both parents of the child being registered are not New Zealand citizens or entitled under the Immigration Act 2009 to be in New Zealand indefinitely or entitled to reside indefinitely in the Cook Islands, Niue or Tokelau, the child is not a New Zealand citizen by birth.'

export const REQUIRE_MESSAGE = 'This is a required field, please provide an answer.'
export const REQUIRE_MESSAGE_STREET = 'This is a required field, please enter a street address.'
export const REQUIRE_MESSAGE_POSTCODE = 'This is a required field, please enter a town or city and a postcode.'
export const REQUIRE_MESSAGE_CHILD_NAME = 'This is a required field, please provide an answer. If you want your child to have a single name enter a dash (-) in the given names field.'
export const REQUIRE_IRD_ADDRESS = 'This is a required field, please choose an address to post your child\'s IRD number to.'
export const REQUIRE_AT_LEAST_ONE_MSD = 'Please provide the MSD client number for at least one parent.'
export const REQUIRE_EMAIL_ADDRESS = 'Please supply an email address.'
export const REQUIRE_DECLARATION = 'You must agree to the declaration above.'

export const INVALID_EMAIL_MESSAGE = 'This is not a valid email address, please re-enter the email address.'
export const INVALID_IRD_MESSAGE = 'Please enter a valid IRD number.'
export const INVALID_MSD_MESSAGE = 'Please enter a valid MSD client number.'

export const REQUIRE_MESSAGE_MYIR_USERNAME = 'You have not successfully selected your myIR username. Click the check if available button to select your preferred username. If you would rather not set up a myIR account at this time then please skip this section and continue with the birth registration.'
export const INVALID_MESSAGE_MYIR_RESERVE = 'You have not successfully reserved your myIR username. Click the reserve button to reserve your preferred username. If you would rather not set up a myIR account at this time then please skip this section and continue with the birth registration.'
export const NO_LONGER_AVAILABLE_MESSAGE_MYIR_RESERVE = `We're sorry that myIR username is no longer available. Please try entering a different myIR username above and then check the availability - or you can skip this section by clicking the link below and continue with the birth registration.`
export const IN_USE_MESSAGE_MYIR_USERNAME = `We're sorry that myIR username is already in use. Please try entering a different myIR username and then check the availability`

export const WARNING_PCG_CITIZENSHIP = <span>
  You indicated previously that the <PrimaryCaregiverText /> is not a New Zealand resident. In order to receive Best Start you need to be the principal caregiver and New Zealand resident. If you think you may still be eligible for Best Start please call Inland Revenue on 0800227773 to discuss your situation.
</span>

export const WARNING_PCG_UNKNOWN = <span>
  <p>To apply for Best Start payments we need to know who the principal caregiver is as Best Start payments can only be paid to this person. The principal caregiver will need to contact Inland Revenue when they are ready to apply.</p>
</span>

export const WARNING_PCG_UNDERAGE = <span>
  <p>To apply for Best Start payments the principal caregiver needs to be at least 16 years of age. As the principal caregiver is under 16 years of age they are unable to receive Best Start payments. Contact Inland Revenue on 0800227773 to discuss your situation.</p>
</span>

export const INELIGIBLE_DUE_DATE = <span>
  <p>Thank you.</p>
  <p>As Best Start payments are only available for children born or expected on or
    after 1 July 2018 you don’t qualify for Best Start. You may however qualify for
    other financial help <Link to="/financial-help" target="_blank">
    https://smartstart.services.govt.nz/financial-help </Link></p>
</span>

export const INVALID_BANK_ACCOUNT = 'Please enter a valid bank account number.'
export const INVALID_BANK_ACCOUNT_FORMAT = 'The bank account may only contain numbers.'
export const INVALID_BANK_ACCOUNT_BRANCH = 'The branch number must be 4 numbers.'
export const INVALID_BANK_ACCOUNT_NUMBER = 'The account number must be at least 6 numbers.'
export const INVALID_BANK_ACCOUNT_SUFFIX = 'The account suffix must be at least 2 numbers.'
export const INVALID_BANK_ACCOUNT_BANK_NUMBER = 'The bank number must be 2 numbers.'

export const FUTURE_DATE_MESSAGE = 'This date is in the future, please provide a valid date.'
export const INVALID_CHAR_MESSAGE = 'Some punctuation or special characters cannot be accepted - please remove any {invalid_matches} from your answer.'

export const MIN_AGE_MESSAGE = 'Parent\'s age cannot be less than {min_age} years, please check the date entered.'
export const MAX_AGE_MESSAGE = 'Parent\'s age cannot be greater than {max_age} years, please check the date entered.'
export const MIN_10_AGE_MOTHER_MESSAGE = 'Mother\'s age cannot be less than 10 years when the child was born, please check the date entered.'
export const MIN_10_AGE_FATHER_MESSAGE = <span>
  <FatherText capitalize />'s age cannot be less than 10 years when the child was born, please check the date entered.
</span>
export const MAX_100_AGE_MESSAGE = 'Parent\'s age cannot be greater than 100 years, please check the date entered.'
export const MIN_16_AGE_RELATIONSHIP_DATE_MESSAGE = 'Date of event must be at least sixteen years after parent\'s dates of birth.'

export const WARNING_NAME_CONTAINS_RANK = 'The name may include an official title or rank. If you wish your child to have this name you should include your reasons in the box below.'
export const WARNING_NAME_CONTAINS_OFFENSIVE = 'The name may be undesirable in the public interest as it might cause offence to a reasonable person. The name may not be accepted for registration as it is. A Registrar will review the name(s). If you wish your child to have this name you should include your reasons in the box below.'
export const WARNING_PARENT_SURNAME_MATCH = <span>
  Both parents have the same surname. If the mother is using a married name please provide your birth names.
  Return to Mother's <Link to={'/register-my-baby/mother-details?focus=mother.surname'}>name</Link>.
</span>

export const DUPLICATE_APPLICATION_MESSAGE = <span>
  It looks like you may have already submitted an application for this child. Please call us on <a href="tel:0800225252">0800 225 252</a> to discuss it further.
</span>

export const REQUIRE_MOTHER_EMAIL_IRD = <span>
  You have not supplied <MotherText possessive /> email address, please add one to the contact details on
  &nbsp;<Link to={'/register-my-baby/mother-details?focus=mother.email'}>this step <span className="visuallyhidden">on the Mother details page.</span></Link>
</span>

export const REQUIRE_FATHER_EMAIL_IRD = <span>
  You have not supplied <FatherText />'s email address, please add one to the contact details on
  &nbsp;<Link to={'/register-my-baby/other-parent-details?focus=father.email'}>this step <span className="visuallyhidden">on the <FatherText /> details page.</span></Link>
</span>

export const REQUIRE_BIRTH_CERTIFICATE_ORDER = <span>
  You have indicated that you want us to send your IR number to your birth certificate order address. Please change your address choice for your child's IR
  number <Link to={'/register-my-baby/other-services?focus=ird.deliveryAddress'}>here <span className="visuallyhidden">on the Other Services page</span></Link>.
</span>

const EMPTY = ''

export const TAX_RESIDENT_WARNING = <span>
  You have indicated that the principal caregiver is not a tax resident and therefore doesn't qualify for Best Start payments. You may, however, qualify for other financial help <Link to={'/financial-help'}>https://smartstart.services.govt.nz/financial-help</Link>
</span>

export const frontendMessageByErrorCode = {
  'wdatet_parent_young': { message: MIN_10_AGE_MOTHER_MESSAGE, type: 'error' }, // parent relationship marriage date
  '10010': { message: EMPTY, type: 'warning' }, // title case
  '10025': { message: EMPTY, type: 'error' },

  'ethnic:child.ethnicGroups': { message: REQUIRE_MESSAGE, type: 'error' },
  'ethnic:mother.ethnicGroups': { message: REQUIRE_MESSAGE, type: 'error' },
  'ethnic:father.ethnicGroups': { message: REQUIRE_MESSAGE, type: 'error' },
  'ird_fathers_email': { message: REQUIRE_FATHER_EMAIL_IRD, type: 'error' },
  'ird_mothers_email': { message: REQUIRE_MOTHER_EMAIL_IRD, type: 'error' },
  'msd_invalid:msd.mothersClientNumber': { message: INVALID_MSD_MESSAGE, type: 'error' },
  'msd_invalid:msd.fathersClientNumber': { message: INVALID_MSD_MESSAGE, type: 'error' },
  'msd_mandatory:msd.mothersClientNumber': { message: REQUIRE_AT_LEAST_ONE_MSD, type: 'error' },
  'msd_mandatory:msd.fathersClientNumber': { message: REQUIRE_AT_LEAST_ONE_MSD, type: 'error' },
  '10001': { message: REQUIRE_MESSAGE, type: 'error' },
  '10002': { message: REQUIRE_MESSAGE, type: 'error' },
  '10003': { message: INVALID_CHAR_MESSAGE, type: 'error' },
  '10004': { message: INVALID_CHAR_MESSAGE, type: 'error' },
  '10066': { message: INVALID_CHAR_MESSAGE, type: 'error' },
  '10015': { message: FUTURE_DATE_MESSAGE, type: 'error' },

  'name_contains_rank:child.firstNames': { message: WARNING_NAME_CONTAINS_RANK, type: 'warning' },
  'name_contains_rank:child.surname': { message: WARNING_NAME_CONTAINS_RANK, type: 'warning' },
  'obscene_name:child.firstNames': { message: WARNING_NAME_CONTAINS_OFFENSIVE, type: 'warning' },
  'obscene_name:child.surname': { message: WARNING_NAME_CONTAINS_OFFENSIVE, type: 'warning' },
  'surname_match:mother.surname': { message: WARNING_PARENT_SURNAME_MATCH, type: 'warning' },
  'surname_match:father.surname': { message: WARNING_PARENT_SURNAME_MATCH, type: 'warning' },
  'mdob_young:mother.dateOfBirth': { message: MIN_10_AGE_MOTHER_MESSAGE, type: 'error' },
  'fdob_young:father.dateOfBirth': { message: MIN_10_AGE_FATHER_MESSAGE, type: 'error' },
  '10014:mother.dateOfBirth': { message: MAX_100_AGE_MESSAGE, type: 'error' },
  '10014:father.dateOfBirth': { message: MAX_100_AGE_MESSAGE, type: 'error' }
}
