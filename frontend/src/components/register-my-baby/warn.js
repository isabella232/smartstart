import get from 'lodash/get'
import set from 'lodash/set'
import trim from 'lodash/trim'
import moment from 'moment'
import {
  WARNING_CITIZENSHIP,
  WARNING_PCG_CITIZENSHIP,
  WARNING_PARENT_SURNAME_MATCH,
  INELIGIBLE_DUE_DATE,
  WARNING_PCG_UNKNOWN,
  WARNING_PCG_UNDERAGE,
  TAX_RESIDENT_WARNING
} from './validation-messages'

import { BS_ELIGIBLE_DATE, isDateEligible } from './best-start-utils'

const motherWarn = (values) => {
  const warnings = {}

  const isPermanentResident = get(values, 'mother.isPermanentResident')
  const isNZRealmResident = get(values, 'mother.isNZRealmResident')
  const isAuResidentOrCitizen = get(values, 'mother.isAuResidentOrCitizen')

  if (
    isPermanentResident === 'no' &&
    isNZRealmResident === 'no' &&
    isAuResidentOrCitizen === 'no'
  ) {
    set(warnings, 'mother.citizenshipWarning', WARNING_CITIZENSHIP)
  }

  return warnings;
}

const primaryCareGiverWarn = (values) => {
  const warnings = {}
  const pcg = get(values, 'bestStart.primaryCareGiver.type')
  let isCitizen
  let isPermanentResident
  let isNZRealmResident
  let isAuResidentOrCitizen

  /*
    Only show PCG resident error if there is a valid due date
  */
  if (checkDate(values)) {
    if(pcg === 'mother') {
      isCitizen = get(values, 'mother.isCitizen')
      isPermanentResident = get(values, 'mother.isPermanentResident')
      isNZRealmResident = get(values, 'mother.isNZRealmResident')
      isAuResidentOrCitizen = get(values, 'mother.isAuResidentOrCitizen')
    } else if (pcg === 'father') {
      isCitizen = get(values, 'father.isCitizen')
      isPermanentResident = get(values, 'father.isPermanentResident')
      isNZRealmResident = get(values, 'father.isNZRealmResident')
      isAuResidentOrCitizen = get(values, 'father.isAuResidentOrCitizen')
    }

    if (
      isCitizen === 'no' &&
      isPermanentResident === 'no' &&
      isNZRealmResident === 'no' &&
      isAuResidentOrCitizen === 'no'
    ) {
      set(warnings, 'bestStart.primaryCareGiverWarning', WARNING_PCG_CITIZENSHIP)
      set(values, 'bestStart.primaryCareGiver.isNewZealandResident', 'no')
    } else {
      set(values, 'bestStart.primaryCareGiver.isNewZealandResident', 'yes')
    }
  }

  return warnings;
}

const primaryCareGiverUnknownWarn = (values) => {
  const warnings = {}
  const pcg = get(values, 'bestStart.primaryCareGiver.type')

  /*
    Only show PCG unknown error if there is a valid due date
  */
  if (checkDate(values)) {
    if (pcg === 'unknown') {
      set(warnings, 'bestStart.primaryCareGiverUnknownWarning', WARNING_PCG_UNKNOWN)
    }
  }

  return warnings;
}

const primaryCareGiverUnderSixteenWarn = (values) => {
  const warnings = {}
  const pcg = get(values, 'bestStart.primaryCareGiver.type')

  /*
    Only show PCG UNDER 16 error if there is a valid due date
  */
  if (checkDate(values)) {
    if (pcg === 'mother' || pcg === 'father') {
      const birthday = get(values, pcg + '.dateOfBirth')
      const age = moment().diff(birthday, 'years')
      if(age < 16){
        set(warnings, 'bestStart.primaryCareGiverUnderSixteenWarning', WARNING_PCG_UNDERAGE)
      }
    }
  }

  return warnings;
}

const bstcExpectedBirthWarn = (values) => {
  const warnings = {}

  const expectedDueDate = get(values, 'bestStart.expectedDueDate')

  if (expectedDueDate && moment(expectedDueDate).isBefore(BS_ELIGIBLE_DATE)) {
    set(warnings, 'bestStart.expectedDueDateWarning', INELIGIBLE_DUE_DATE)
  }

  return warnings
}

const fatherWarn = (values) => {
  const warnings = {}

  const fatherSurname = trim(get(values, 'father.surname'))
  const motherSurname = trim(get(values, 'mother.surname'))
  const motherSurnameAtBirth = trim(get(values, 'mother.surnameAtBirth'))
  const isPermanentResident = get(values, 'father.isPermanentResident')
  const isNZRealmResident = get(values, 'father.isNZRealmResident')
  const isAuResidentOrCitizen = get(values, 'father.isAuResidentOrCitizen')

  if (fatherSurname && fatherSurname === motherSurname && !motherSurnameAtBirth) {
    set(warnings, 'father.surname', WARNING_PARENT_SURNAME_MATCH)
  }

  if (
    isPermanentResident === 'no' &&
    isNZRealmResident === 'no' &&
    isAuResidentOrCitizen === 'no'
  ) {
    set(warnings, 'father.citizenshipWarning', WARNING_CITIZENSHIP)
  }

  return warnings
}

const taxResidentWarn = (values) => {
  const warnings = {}

  const taxResident = get(values, 'bestStart.primaryCareGiver.isTaxResident')
  const livedInNZ = get(values, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')
  const taxResidentWhenBS = get(values, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')
  const childResident = get(values, 'bestStart.primaryCareGiver.isChildResident')

  if(
    taxResident === 'no' &&
    childResident === 'no' &&
    (livedInNZ && taxResidentWhenBS) &&
    (livedInNZ === 'no' ||
    taxResidentWhenBS === 'no')
  ) {
    set(warnings, 'bestStart.primaryCareGiver.taxResidentWarning', TAX_RESIDENT_WARNING)
  }
  return warnings
}

const checkDate = (values) => {
  const birthDate = get(values, 'child.birthDate')
  const expectedDueDate = get(values, 'bestStart.expectedDueDate')

  return isDateEligible(birthDate, expectedDueDate)
}

const warn = (values) => {
  const motherWarnings = motherWarn(values)
  const fatherWarnings = fatherWarn(values)
  const bstcExpectedBirthWarnings = bstcExpectedBirthWarn(values)
  const primaryCareGiverWarnings = primaryCareGiverWarn(values)
  const primaryCareGiverUnknownWarnings = primaryCareGiverUnknownWarn(values)
  const primaryCareGiverUnderSixteenWarnings = primaryCareGiverUnderSixteenWarn(values)
  const taxResidentWarnings = taxResidentWarn(values)

  return {
    ...motherWarnings,
    ...fatherWarnings,
    ...bstcExpectedBirthWarnings,
    ...primaryCareGiverWarnings,
    ...primaryCareGiverUnknownWarnings,
    ...primaryCareGiverUnderSixteenWarnings,
    ...taxResidentWarnings
  }
}

export default warn
