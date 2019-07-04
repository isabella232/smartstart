import moment from 'moment'
import get from 'lodash/get'
import set from 'lodash/set'
import has from 'lodash/has'
import keys from 'lodash/keys'
import unset from 'lodash/unset'
import cloneDeep from 'lodash/cloneDeep'
import lodashUpdate from 'lodash/update'
import invert from 'lodash/invert'
import forOwn from 'lodash/forOwn'
import { isDateEligible, isPcgEligible, isNzResident, isTaxResident, formatBankAccount } from './best-start-utils'

/**
 * STEP 1
 * [x] child.aliveAtBirth --> stillBorn
 * [x] child.multipleBirthOrder --> birthOrderNumber / birthOrderTotal
 * [x] normalize birth date to correct format
 * [x] transform child.ethnicGroups, move child.ethnicityDescription to child.ethnicGroups.other
 *
 * STEP 2
 * [x] transform mother.ethnicGroups, move ethnicityDescription to ethnicGroups.other
 * [x] normalize birth date to correct format
 * [x] convert isPermanentResident/isNZRealmResident/isAuResidentOrCitizen to `nonCitizenSource`
 *
 *
 * STEP 3
 * [x] transform father.ethnicGroups, move ethnicityDescription to ethnicGroups.other
 * [x] normalize birth date to correct format
 * [x] convert isPermanentResident/isNZRealmResident/isAuResidentOrCitizen to `nonCitizenSource`
 * [x] depends on:
 *
 *      - assistedHumanReproduction
 *      - assistedHumanReproductionManConsented
 *      - assistedHumanReproductionWomanConsented
 *      - assistedHumanReproductionSpermDonor
 *
 *      we need to set correct value for `assistedReproductionFemaleParents` & `fatherKnown`
 * [x] if mother-mother, remove secondParent field and add note to comment section
 *
 * STEP 4
 * [x] normalize siblings birthdate, parentRelationshipDate to correct format
 *
 * STEP 5
 * [x] BestStart and IRD field transformations
 * [x] convert wanted to 'Y', 'N' or 'I'
 * [x] set PCG data if applicable
 * [x] move post code to separate field
 * [x] update pcg father to otherParent
 * [x] update tax resident fields if relevant
 * [x] convert bank account to string
 *
 * STEP 6
 * [x] Unset myIR as it should not be submitted to eServer
 *
 * STEP 7
 * [x] remove certificateOrder.deliveryAddressType
 * [x] convert certificateOrder.courierDelivery to boolean
 * [x] convert certificateOrder.deliveryAddress to match spec
 *
 * "deliveryAddress": {
 *   "line1": "string",                -> `streetAddress`
 *   "line2": "string",                -> `suburb`
 *   "suburbTownPostcode": "string",   -> `${town} ${postalCode}`
 *   "countryCode": "string"
 * }
 */

export const FRONTEND_FIELD_TO_SERVER_FIELD = {
  'birthPlace.home.suburb': 'birthPlace.home.line2',
  'birthPlace.home.line2': 'birthPlace.home.line3',
  'certificateOrder.deliveryAddress.line2': 'certificateOrder.deliveryAddress.suburbTownPostcode',
  'certificateOrder.deliveryAddress.suburb': 'certificateOrder.deliveryAddress.line2',
  'child.ethnicityDescription': 'child.ethnicGroups.other',
  'mother.ethnicityDescription': 'mother.ethnicGroups.other',
  'father.ethnicityDescription': 'father.ethnicGroups.other',
  'child.aliveAtBirth': 'child.stillBorn'
}

export const FRONTEND_FIELD_TO_SERVER_FIELD_TRANSFORM = {
  'child.stillBorn':  frontendValue => frontendValue !== 'yes'
}

export const SERVER_FIELD_TO_FRONTEND_FIELD = invert(FRONTEND_FIELD_TO_SERVER_FIELD)

export const transform = data => {

    const transformedData = cloneDeep(data)

    const childMultipleBirthOrder = get(transformedData, 'child.multipleBirthOrder') || '0 of 0'
    const [birthOrderNumber, birthOrderTotal]  = childMultipleBirthOrder.split('of')
    set(transformedData, 'child.birthOrderNumber', parseInt(birthOrderNumber, 10))
    set(transformedData, 'child.birthOrderTotal', parseInt(birthOrderTotal, 10))
    unset(transformedData, 'child.multipleBirthOrder')

    update(transformedData, 'child.birthDate', formatDate)
    update(transformedData, 'mother.dateOfBirth', formatDate)
    update(transformedData, 'father.dateOfBirth', formatDate)
    update(transformedData, 'parentRelationshipDate', formatDate)
    const siblings = get(transformedData, 'siblings', [])
    siblings.forEach(sibling =>
      update(sibling, 'dateOfBirth', formatDate)
    )
    update(transformedData, 'bestStart.expectedDueDate', formatDate)

    update(transformedData, 'child.oneOfMultiple', yesNoToBoolean)
    update(transformedData, 'mother.isCitizen', yesNoToBoolean)
    update(transformedData, 'father.isCitizen', yesNoToBoolean)
    update(transformedData, 'fatherKnown', yesNoToBoolean)

    update(transformedData, 'certificateOrder.courierDelivery', value => value === 'courier')

    transformEthnicGroups(transformedData.child)
    transformEthnicGroups(transformedData.mother)
    transformEthnicGroups(transformedData.father)

    transformCitizenshipSource(transformedData.mother)
    transformCitizenshipSource(transformedData.father)

    transformHart(transformedData)

    transformFrontendFieldToServerField(transformedData)
    transformBestStart(transformedData)

    cleanup(transformedData)
    return transformedData
}

export const transformFullSubmission = (data) => {
  const transformedData = transform(data)

  transformedData.otherInformation = [
    transformedData.child.nameExplaination || '',
    transformedData.otherInformation || ''
  ].join('\n')

  return transformedData
}

const update = (object, path, updater) => {
  if (has(object, path)) {
    lodashUpdate(object, path, updater)
  }
}

const formatDate = date =>
  date ? moment(date).format('YYYY-MM-DD') : ''

const yesNoToBoolean = value =>
  value === 'yes' ? true : false

const transformEthnicGroups = (target = {}) => {
  const ethnicGroupsObj = {
    nzEuropean: false,
    maori: false,
    samoan: false,
    cookIslandMaori: false,
    tongan: false,
    niuean: false,
    chinese: false,
    indian: false
  }

  keys(ethnicGroupsObj).forEach(key =>
    ethnicGroupsObj[key] = (target.ethnicGroups || []).indexOf(key) > -1
  )

  set(target, 'ethnicGroups', ethnicGroupsObj)

  // ethnicGroups.other will be transform in transformFrontendFieldToServerField

  return target
}

const transformCitizenshipSource = (target = {}) => {
  if (target.isPermanentResident === 'yes') {
    set(target, 'nonCitizenSource', 'permanentResident')
  } else if (target.isNZRealmResident === 'yes') {
    set(target, 'nonCitizenSource', 'pacificIslandResident')
  } else if (target.isAuResidentOrCitizen === 'yes') {
    set(target, 'nonCitizenSource', 'australian')
  } else {
    set(target, 'nonCitizenSource', 'none')
  }

  unset(target, 'isPermanentResident')
  unset(target, 'isNZRealmResident')
  unset(target, 'isAuResidentOrCitizen')

  if (target.isCitizen) {
    unset(target, 'nonCitizenSource')
  }

  return target
}

const transformHart = data => {
  const assistedHumanReproduction = get(data, 'assistedHumanReproduction')
  const assistedHumanReproductionManConsented = get(data, 'assistedHumanReproductionManConsented')
  const assistedHumanReproductionWomanConsented = get(data, 'assistedHumanReproductionWomanConsented')
  const assistedHumanReproductionSpermDonor = get(data, 'assistedHumanReproductionSpermDonor')

  if (assistedHumanReproduction === 'yes') {
    if (assistedHumanReproductionManConsented || assistedHumanReproductionWomanConsented) {
      set(data, 'fatherKnown', true)
      if (assistedHumanReproductionManConsented) {
        set(data, 'assistedReproductionFemaleParents', false)
      }

      if (assistedHumanReproductionWomanConsented) {
        set(data, 'assistedReproductionFemaleParents', true)

        // prepend mother/mother in bro form notes
        if (get(data, 'secondParent.preferedTitle') === 'mother') {
          const otherInfo = get(data, 'otherInformation') || ''
          set(data, 'otherInformation', 'Mother/Mother \n'  +  otherInfo)
          unset(data, 'secondParent')
        }
      }
    } else if (assistedHumanReproductionSpermDonor) {
      set(data, 'fatherKnown', false)
      set(data, 'assistedReproductionFemaleParents', false)
    }
  }

  unset(data, 'assistedHumanReproduction')
  unset(data, 'assistedHumanReproductionManConsented')
  unset(data, 'assistedHumanReproductionWomanConsented')
  unset(data, 'assistedHumanReproductionSpermDonor')

  return data
}

const transformFrontendFieldToServerField = data => {
  const snapshot = cloneDeep(data)

  forOwn(FRONTEND_FIELD_TO_SERVER_FIELD, (serverField, frontendField) => {
    const value = get(snapshot, frontendField)
    const transformFunc = FRONTEND_FIELD_TO_SERVER_FIELD_TRANSFORM[serverField]
    if (transformFunc) {
      set(data, serverField, transformFunc(value))
    } else {
      set(data, serverField, value)
    }
    unset(data, frontendField)
  })

  return data
}


const cleanup = data => {
  const birthPlaceCategory = get(data, 'birthPlace.category')
  const oneOfMultiple = get(data, 'child.oneOfMultiple')
  const fatherKnown = get(data, 'fatherKnown')
  const orderBirthCertificate = get(data, 'orderBirthCertificate')
  const parentRelationship = get(data, 'parentRelationship')

  if (birthPlaceCategory === 'home') {
    unset(data, 'birthPlace.hospital')
    unset(data, 'birthPlace.other')
  } else if (birthPlaceCategory === 'hospital') {
    unset(data, 'birthPlace.home')
    unset(data, 'birthPlace.other')
  } else {
    unset(data, 'birthPlace.hospital')
    unset(data, 'birthPlace.home')
  }

  if (!oneOfMultiple) {
    unset(data, 'child.birthOrderNumber')
    unset(data, 'child.birthOrderTotal')
  }

  if (!fatherKnown) {
    unset(data, 'father')
    unset(data, 'parentRelationship')
    unset(data, 'parentRelationshipDate')
    unset(data, 'parentRelationshipPlace')
    unset(data, 'siblings')
  }

  if (fatherKnown && (parentRelationship !== 'marriage' && parentRelationship !== 'civilUnion')) {
    unset(data, 'parentRelationshipDate')
    unset(data, 'parentRelationshipPlace')
  }

  if (orderBirthCertificate !== 'yes') {
    unset(data, 'certificateOrder')
  }

  unset(data, 'otherChildren')
  unset(data, 'certificateOrder.deliveryAddressType')
  unset(data, 'parentSameAddress')
  unset(data, 'orderBirthCertificate')

  unset(data, 'myir')
}

const transformBestStart = data => {

  const wanted = get(data, 'bestStart.wanted')
  const birthDate = get(data, 'child.birthDate')
  const dueDate = get(data, 'bestStart.expectedDueDate')
  const pcg = get(data, 'bestStart.primaryCareGiver') || {}
  const pcgBirthDate = get(data, pcg.type + '.dateOfBirth')
  const msdClient = get(data, 'bestStart.primaryCareGiver.isMSDClient')
  const wfftc = get(data, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')
  const taxResident = get(data, 'bestStart.primaryCareGiver.isTaxResident')
  const livedInNZ = get(data, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')
  const taxResidentWhenBS = get(data, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')
  const childResident = get(data, 'bestStart.primaryCareGiver.isChildResident')
  const sharingCare = get(data, 'bestStart.primaryCareGiver.isSharingCare')
  const hasPartner = get(data, 'bestStart.primaryCareGiver.hasPartner')
  const bankAccountNumber = get(data, 'bestStart.primaryCareGiver.bankAccount.number')

  const firstName = get(data, pcg.type + '.firstNames')
  const surname = get(data, pcg.type + '.surname')
  const phone = get(data, pcg.type + '.daytimePhone')
  const street = get(data, pcg.type + '.homeAddress.line1')
  const suburb = get(data, pcg.type + '.homeAddress.suburb')
  const town =  get(data, pcg.type + '.homeAddress.line2')
  const email = get(data, pcg.type + '.email')

  // Update wanted to contain value of with 'N', 'Y' or 'I' - depending on eligibility
  if(wanted === 'no') {
    set(data, 'bestStart.wanted', 'N')
  } else {
    if (isDateEligible(birthDate, dueDate) && isPcgEligible(pcg.type, pcgBirthDate) && isNzResident(pcg) && isTaxResident(pcg)) {
      set(data, 'bestStart.wanted', 'Y')
    } else {
      set(data, 'bestStart.wanted', 'I')
    }
  }

  //format due date
  update(data, 'bestStart.expectedDueDate', formatDate)

  //Update ird booleans
  update(data, 'ird.applyForNumber', yesNoToBoolean)
  update(data, 'ird.numberByEmail', yesNoToBoolean)

  if(pcg.type === 'mother' || pcg.type === 'father') {
    let postCodeIndex = town.search(/\d{4}/)
    set(data, 'bestStart.primaryCareGiver.firstNames', firstName)
    set(data, 'bestStart.primaryCareGiver.surname', surname)
    set(data, 'bestStart.primaryCareGiver.daytimePhone', phone)
    set(data, 'bestStart.primaryCareGiver.homeAddress.streetAddress', street)
    set(data, 'bestStart.primaryCareGiver.homeAddress.suburb', suburb)
    set(data, 'bestStart.primaryCareGiver.email', email)

    // Seperate out the postcode from the line2 field and save as a seperate field
    if(postCodeIndex > -1) {
      let postCode = town.slice(postCodeIndex, postCodeIndex + 4)
      let newTown = town.replace(postCode, '').trim()
      set(data, 'bestStart.primaryCareGiver.homeAddress.postCode', postCode)
      set(data, 'bestStart.primaryCareGiver.homeAddress.cityTown', newTown)
    } else {
      set(data, 'bestStart.primaryCareGiver.homeAddress.postCode', '')
      set(data, 'bestStart.primaryCareGiver.homeAddress.cityTown', town)
    }
  }

  // Update type father to type otherParent
  if(pcg.type === 'father') {
    set(data, 'bestStart.primaryCareGiver.type', 'otherParent')
  }

  //Update tax resident field if follow up questions all equal yes
  if(taxResident === 'no' && (childResident === 'yes' || (livedInNZ === 'yes' && taxResidentWhenBS === 'yes'))) {
    set(data, 'bestStart.primaryCareGiver.isTaxResident', 'yes')
    unset(data, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')
    unset(data, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')
    unset(data, 'bestStart.primaryCareGiver.isChildResident')
  }

  update(data, 'bestStart.primaryCareGiver.isNewZealandResident', yesNoToBoolean)
  update(data, 'bestStart.primaryCareGiver.isMSDClient', yesNoToBoolean)
  update(data, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies', yesNoToBoolean)
  update(data, 'bestStart.primaryCareGiver.isSharingCare', yesNoToBoolean)
  update(data, 'bestStart.primaryCareGiver.hasPartner', yesNoToBoolean)
  update(data, 'bestStart.primaryCareGiver.isTaxResident', yesNoToBoolean)
  update(data, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave', yesNoToBoolean)

  //Update date fields
  update(data, 'bestStart.expectedDueDate', formatDate)

  //Convert bank account to string
  if(bankAccountNumber) {
    set(data, 'bestStart.primaryCareGiver.bankAccount.number', formatBankAccount(bankAccountNumber))
  }

  //Remove unneeded fields
  if(get(data, 'bestStart.wanted') === 'N') {
    unset(data, 'bestStart.primaryCareGiver')
    unset(data, 'bestStart.expectedDueDate')
  }

  if(get(data, 'bestStart.wanted') === 'I') {
    unset(data, 'bestStart.primaryCareGiver.firstNames')
    unset(data, 'bestStart.primaryCareGiver.surname')
    unset(data, 'bestStart.primaryCareGiver.daytimePhone')
    unset(data, 'bestStart.primaryCareGiver.alternativePhone')
    unset(data, 'bestStart.primaryCareGiver.email')
    unset(data, 'bestStart.primaryCareGiver.homeAddress')
    unset(data, 'bestStart.primaryCareGiver.hasPartner')
    unset(data, 'bestStart.primaryCareGiver.partner')
    unset(data, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')
    unset(data, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')
    unset(data, 'bestStart.primaryCareGiver.isMSDClient')
    unset(data, 'bestStart.primaryCareGiver.isSharingCare')
    unset(data, 'bestStart.primaryCareGiver.careSharer')
    unset(data, 'bestStart.primaryCareGiver.irdNumber')
    unset(data, 'bestStart.primaryCareGiver.bankAccount')
    unset(data, 'bestStart.primaryCareGiver.declarationAccepted')
  }

  if(get(data, 'bestStart.wanted') === 'Y') {
    if(pcg.type === 'other') {
      unset(data, 'bestStart.primaryCareGiver.hasPartner')
      unset(data, 'bestStart.primaryCareGiver.partner')
      unset(data, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')
      unset(data, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')
      unset(data, 'bestStart.primaryCareGiver.isMSDClient')
      unset(data, 'bestStart.primaryCareGiver.isNewZealandResident')
      unset(data, 'bestStart.primaryCareGiver.isTaxResident')
      unset(data, 'bestStart.primaryCareGiver.isSharingCare')
      unset(data, 'bestStart.primaryCareGiver.careSharer')
      unset(data, 'bestStart.primaryCareGiver.irdNumber')
      unset(data, 'bestStart.primaryCareGiver.bankAccount')
      unset(data, 'bestStart.primaryCareGiver.declarationAccepted')
    } else {

      if(msdClient === 'yes') {
        unset(data, 'bestStart.primaryCareGiver.hasPartner')
        unset(data, 'bestStart.primaryCareGiver.partner')
        unset(data, 'bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')
        unset(data, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')
        unset(data, 'bestStart.primaryCareGiver.isNewZealandResident')
        unset(data, 'bestStart.primaryCareGiver.isTaxResident')
        unset(data, 'bestStart.primaryCareGiver.isSharingCare')
        unset(data, 'bestStart.primaryCareGiver.careSharer')
        unset(data, 'bestStart.primaryCareGiver.irdNumber')
        unset(data, 'bestStart.primaryCareGiver.bankAccount')
        unset(data, 'bestStart.primaryCareGiver.declarationAccepted')
      }

      if(wfftc === 'yes') {
        unset(data, 'bestStart.primaryCareGiver.hasPartner')
        unset(data, 'bestStart.primaryCareGiver.partner')
        unset(data, 'bestStart.primaryCareGiver.isNewZealandResident')
        unset(data, 'bestStart.primaryCareGiver.isTaxResident')
        unset(data, 'bestStart.primaryCareGiver.bankAccount')
      }

      //Remove care sharer details
      if(sharingCare === 'no') {
        unset(data, 'bestStart.primaryCareGiver.careSharer')
      }

      //Remove partner details
      if(hasPartner === 'no') {
        unset(data, 'bestStart.primaryCareGiver.partner')
      }
    }
  }

  //Remove ird info if not needed
  if(get(data, 'ird.applyForNumber') === false) {
    unset(data, 'ird.deliveryAddress')
    unset(data, 'ird.numberByEmail')
    unset(data, 'ird.taxCreditIRDNumber')
  }

  //Remove msd info if not needed
  if(get(data, 'msd.notify') === false) {
    unset(data, 'msd.mothersClientNumber')
    unset(data, 'msd.fathersClientNumber')
  }
}
