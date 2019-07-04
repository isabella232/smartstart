import deepMap from 'deep-map'
import get from 'lodash/get'
import set from 'lodash/set'
import moment from 'moment'
import BENEFITS_MAPPING from './benefits-openfisca'

// Openfisca requires us to submit an object with 3 entities: persons, families, titled_properties
// Every person in a family should be created as a separate object with it's own properties under persons category
// They also should be present in families ( which describes relations in a family ) and titled_properties (not used in financial help)

// 1. convert all the yes/no answers to booleans
// 2. transform financial help form structure to openfisca format
// 3. set only variables that exist on openfisca schema


const transform = (data, schema, thresholds, areaCode) => {
  let body = {}
  const currentPeriod = {
    year: moment().format('YYYY'),
    month: moment().format('YYYY-MM'),
    day: moment().startOf('month').format('YYYY-MM-DD'), // currently OF formulas require 1st day of month
  }

  data = deepMap(data, value => transformType(value))

  const { applicant, child } = data
  // SET APPLICANT VARIABLES
  addPerson(body, 'applicant')

  // personal
  set(body, 'persons.applicant.age', { [currentPeriod.day]: applicant.age })
  setField(schema, body, 'persons.applicant', 'is_citizen_or_resident', applicant.isNZResident)
  setField(schema, body, 'persons.applicant', 'social_security__is_ordinarily_resident_in_new_zealand', applicant.normallyLivesInNZ)

  // partner
  const hasPartner = applicant.relationshipStatus === 'notsingle'
  setField(schema, body, 'persons.applicant', 'has_a_partner', hasPartner)
  setField(schema, body, 'persons.applicant', 'student_allowance__is_married_or_partnered', hasPartner)
  setField(schema, body, 'persons.applicant', 'is_married_or_in_a_civil_union_or_de_facto_relationship', hasPartner)
  setField(schema, body, 'persons.applicant', 'is_adequately_supported_by_partner', !applicant.isInadequatelySupportedByPartner)

  // occupacy
  setField(schema, body, 'persons.applicant', 'social_security__has_severely_restricted_capacity_for_work', applicant.hasSeriousDisability)
  setField(schema, body, 'persons.applicant', 'parental_leave__applied_for_leave_or_stopped_working', applicant.isStoppingWorkToCareForChild)
  setField(schema, body, 'persons.applicant', 'student_allowance__is_enrolled_fulltime', applicant.isStudyingFullTime)
  setField(schema, body, 'persons.applicant', 'social_security__is_fulltime_student', applicant.isStudyingFullTime)

  // children
  setField(schema, body, 'persons.applicant', 'social_security__is_principal_carer_for_one_year_from_application_date', applicant.isPrincipalCarerForOneYearFromApplicationDate)
  setField(schema, body, 'persons.applicant', 'has_dependent_child', applicant.isPrincipalCarer || applicant.isParent)
  setField(schema, body, 'persons.applicant', 'social_security__has_dependant_child', applicant.isPrincipalCarer)
  setField(schema, body, 'persons.applicant', 'social_security__is_the_parent_of_dependent_child', applicant.isParent)
  setField(schema, body, 'persons.applicant', 'is_a_parent', applicant.isParent)
  setField(schema, body, 'persons.applicant', 'student_allowance__has_a_supported_child', applicant.isPrincipalCarer)

  // other
  setField(schema, body, 'persons.applicant', 'has_community_services_card', applicant.holdsCommunityServicesCard)
  setField(schema, body, 'persons.applicant', 'social_security__has_accomodation_costs', applicant.hasAccommodationCosts)
  setField(schema, body, 'persons.applicant', 'student_allowance__partner_or_person_receiving_certain_allowances', applicant.receivesIncomeTestedBenefit)
  set(body, 'persons.applicant.social_security__received_income_tested_benefit', { [currentPeriod.year]: applicant.receivesIncomeTestedBenefit })


  // SET ASSUMPTIONS: APPLICANT
  // personal
  const dob = moment().startOf('month').subtract(applicant.age, 'year').format('YYYY-MM-DD')
  setField(schema, body, 'persons.applicant', 'date_of_birth', dob)
  setField(schema, body, 'persons.applicant', 'number_of_years_lived_in_nz', applicant.normallyLivesInNZ ? 99 : 0)
  setField(schema, body, 'persons.applicant', 'is_nz_citizen', applicant.isNZResident)
  setField(schema, body, 'persons.applicant', 'is_resident', applicant.isNZResident)

  // partner
  if (!hasPartner) {
    setField(schema, body, 'persons.applicant', 'social_security__single_young_person_in_exceptional_circumstances', true)
  }

  // children
  setField(schema, body, 'persons.applicant', 'parental_leave__is_primary_carer', applicant.gaveBirthToThisChild)

  if (applicant.numberOfChildren >= 3) {
    setField(schema, body, 'persons.applicant', 'home_help__had_multiple_birth', applicant.needsDomesticSupport)
  }

  // occupacy
  setField(schema, body, 'persons.applicant', 'jobseeker_support__is_prepared_for_employment', applicant.employmentStatus !== 'full-time')
  setField(schema, body, 'persons.applicant', 'income_tax__residence', applicant.normallyLivesInNZ)
  setField(schema, body, 'persons.applicant', 'accommodation_supplement__below_cash_threshold', true)
  setField(schema, body, 'persons.applicant', 'parental_leave__threshold_tests', applicant.meetsPaidParentalLeaveEmployedRequirements ? 6 : 0)
  setField(schema, body, 'persons.applicant', 'hours_per_week_employed', applicant.worksWeeklyHours)

  if (applicant.numberOfChildren > 0 && child && child.hasSeriousDisability && applicant.isPrincipalCarer) {
    setField(schema, body, 'persons.applicant', 'social_security__is_required_to_give_fulltime_care', true)
  }

  if (applicant.workOrStudy === 'study' || applicant.workOrStudy === 'both') {
    setField(schema, body, 'persons.applicant', 'student_allowance__is_secondary_student', true)
    setField(schema, body, 'persons.applicant', 'student_allowance__is_tertiary_student', true)
  }

  if (applicant.isStudyingFullTime) {
    setField(schema, body, 'persons.applicant', 'student_allowance__meets_attendance_and_performance_requirements', true)
  }

  // other
  setField(schema, body, 'persons.applicant', 'eligible_for_social_housing', applicant.hasSocialHousing)

  // SET PARTNER VARIABLES
  if (hasPartner) {
    addPerson(body, 'partner')
    setField(schema, body, 'persons.partner', 'hours_per_week_employed', get(data, 'partner.worksWeeklyHours') || 0)
  }

  // SET CHILDREN VARIABLES
  const ages = get(data.children, 'ages') ? [...data.children.ages] : []

  if (applicant.gaveBirthToThisChild) {
    addPerson(body, 'child_0')
    setField(schema, body, 'persons.child_0', 'due_date_of_birth', moment().startOf('month').format('YYYY-MM-DD'))
    set(body, 'persons.child_0.age', { [currentPeriod.day]: 0 })
  }

  // create child objects (e.g. child_1, child_2, child_3, etc...)
  for (let index=1; index <= applicant.numberOfChildren; index++) {
    addPerson(body, `child_${index}`)

    // because we don't ask about age of each child,
    // we are going to allocate selected ages to all of them
    let age = ages.length > 1 ? ages.pop() : ages[0]

    // adjust age if user has children 5-13 and is under 6
    if (age === 13 && get(data, 'child.constantCareUnderSix')) {
      age = 5
    }

    // child
    set(body, `persons.child_${index}.age`, { [currentPeriod.day]: age })
    setField(schema, body, `persons.child_${index}`, 'date_of_birth', moment().subtract(age, 'years').startOf('month').format('YYYY-MM-DD'))
    setField(schema, body, `persons.child_${index}`, 'is_citizen_or_resident', applicant.isNZResident)
    setField(schema, body, `persons.child_${index}`, 'is_resident', applicant.isNZResident)
    setField(schema, body, `persons.child_${index}`, 'is_nz_citizen', applicant.isNZResident)
    setField(schema, body, `persons.child_${index}`, 'social_security__is_a_child', true)
    setField(schema, body, `persons.child_${index}`, 'social_security__is_dependent_child', true)
    setField(schema, body, `persons.child_${index}`, 'is_dependent_child', true)

    // parents
    const noParentReasons = get(data, 'children.birthParents')

    if (noParentReasons) {
      const meetUnsupportedChildCriteria = noParentReasons.includes('family-breakdown') || noParentReasons.includes('in-prison')
      setField(schema, body, `persons.child_${index}`, 'social_security__parents_unable_to_provide_sufficient_care', meetUnsupportedChildCriteria)

      // assumption _blank
      const meetOrphanParentCriteria = noParentReasons.includes('not-found') || noParentReasons.includes('died')
      setField(schema, body, `persons.child_${index}`, 'social_security__is_orphaned', meetOrphanParentCriteria)
    }
  }

  // ASSUMPTIONS: CHILDREN
  const children = get(body, 'families.family.children') || []
  children.forEach(childKey => {
    const child = get(body, 'persons.' + childKey) || {}


    if (child.age[currentPeriod.day] < 5) {
      setField(schema, body, 'persons.' + childKey, 'is_attending_school', false)

      if (get(data, 'child.attendsECE')) {
        setField(schema, body, 'persons.' + childKey, 'early_childcare_hours_participation_per_week', get(data, 'child.weeklyECEHours' ) ? 3 : 0)
      }
    }

    if (child.age[currentPeriod.day] === 5) {
      setField(schema, body, 'persons.' + childKey, 'will_be_enrolled_in_school', true)
    }

    if (get(data, 'child.hasSeriousDisability')) {
      setField(schema, body, 'persons.' + childKey, 'social_security__child_with_serious_disability', true)
      setField(schema, body, 'persons.' + childKey, 'social_security__medical_certification_months', 12)

      const childRequiresCare = !!get(data, 'child.requiresConstantCareAndAttention')
      if (childRequiresCare) {
        setField(schema, body, 'persons.' + childKey, 'social_security__requires_constant_care_and_attention', childRequiresCare)
      }
    }
  })

  // SET FAMILY VARIABLES
  if (applicant.isPrincipalCarer || applicant.gaveBirthToThisChild) {
    // move applicant from parents to PCG
    set(body, 'families.family.principal_caregiver', ['applicant'])

    const parents = get(body, 'families.family.parents')
    set(body, 'families.family.parents', parents.filter(p => p !== 'applicant'))
  }

  // because this calculation is not done in openfisca we're doing in on FE
  const sufficientCare = !!applicant.allChildrenInTheirFullTimeCare || !!applicant.isPrincipalCarerForProportion || !!applicant.gaveBirthToThisChild

  // we are assuming that if all family has dependent children if have children under 16 or
  // has children 16-18 that are financially dependent
  const childrenAges = get(data.children, 'ages') || []
  const hasDependentChildren = applicant.gaveBirthToThisChild ||
    ( applicant.numberOfChildren > 0 && (childrenAges.filter(a => a < 16).length > 0  || !get(data, 'children.financiallyIndependant')) )

  setField(schema, body, 'families.family', 'family_scheme__has_dependent_children', hasDependentChildren && sufficientCare)

  const combinedIncome = getCombinedIncome(applicant, data.income)
  BENEFITS_MAPPING.forEach(benefit => {
    // SET THRESHOLDS
    if (benefit.threshold) {
      const threshold = getThresholdAmount(benefit.name, { thresholds, areaCode, applicant }) || { 'IncomeThreshold': 0 }

      if (benefit.threshold instanceof Array) {
        benefit.threshold.forEach(thresholdField => {
          setField(schema, body, 'persons.applicant', thresholdField, combinedIncome < threshold['IncomeThreshold'])
        })
      } else {
        // exception
        if (benefit.threshold === 'social_security_regulation__household_income_below_childcare_subsidy_threshold') {
          setField(schema, body, 'families.family', benefit.threshold, combinedIncome < threshold['IncomeThreshold'])
        } else {
          setField(schema, body, 'persons.applicant', benefit.threshold, combinedIncome < threshold['IncomeThreshold'])
        }
      }
    }

    // SET BENEFIT QUESTIONS
    if (showBenefit(benefit.name, applicant)) {
      setField(schema, body, 'persons.applicant', benefit.openfisca, null)
    }
  })

  return body
}

const transformType = (value) => {
  if (value === 'true') {
    return true
  } else if (value === 'false') {
    return false
  } else if (!isNaN(parseInt(value, 10))) {
    return parseInt(value, 10)
  }
  return value
}

const annualIncome = (incomeAndFrequency) => {
  if (!incomeAndFrequency) return 0

  let income = incomeAndFrequency[0]
  let frequency = incomeAndFrequency[1]

  switch (frequency) {
    case 'weekly':
      return income * 52
    case 'fortnightly':
      return income * 26
    case 'monthly':
      return income * 12
    case 'annually':
      return income
    default:
      return 0
  }
}

const getCombinedIncome = (applicant, income) => {
  let combinedIncome = 0
  if (income && applicant) {
    if (applicant.relationshipStatus === 'single' || applicant.isInadequatelySupportedByPartner) {
      combinedIncome = annualIncome(income.applicant)
    } else {
      // if they have a partner it's required to provide their income
      combinedIncome = annualIncome(income.applicant) + annualIncome(income.spouse)
    }
  }

  return combinedIncome
}

// helper function to set value to transformed object
// granularity: MONTH , because most of the fields (with few exceptions)
// need to be specified as month
const setField = (schema, body, object, key, value) => {
  // only set a field if it exists in openfisca schema
  // otherwise openfisca will respond with error
  if (schema.includes(key)) {
    set(body, object + '.' + key, { [moment().format('YYYY-MM')]: value })
  }
}

const addPerson = (body, person) => {
  // there are 3 entities: persons, families, titled_properties
  // a person should exist in all three

  // add to persons
  set(body, 'persons.' + person, {})

  // add to families
  let type
  if (person === 'applicant') {
    // by default assigning to parents
    // later on can be changed to principal caregiver
    type = 'parents'
  } else if (person === 'partner') {
    type = 'partners'
  } else if (person.includes('child')) {
    type = 'children'
  } else {
    type = 'others'
  }

  const group = get(body, 'families.family.' + type) || []
  set(body, 'families.family.' + type, [...group, person])

  // add person to household
  const residents = get(body, 'titled_properties.household.others') || []
  set(body, 'titled_properties.household.others', [...residents, person])
}

const getThresholdAmount = (benefit, { thresholds, areaCode, applicant }) => {
  return thresholds.find(t => {
    // when comparison should be same or more, number would have + next to it
    // e.g. 1+ for one or more children
    const childrenReq = t['NumberOfChildren'].slice(-1) === '+' ?
      parseInt(t['NumberOfChildren'].slice(0, -1), 10) <= applicant.numberOfChildren :
      parseInt(t['NumberOfChildren']) === applicant.numberOfChildren

    const relationshipReq = t['RelationshipType'] === applicant.relationshipStatus

    switch(benefit) {
      case 'isCommunityServicesCard':
      case 'isJobSeekerSupport':
      case 'isSoleParentSupport':
      case 'isWorkingForFamiliesMinimumFamilyTaxCredit':
        return t.id === benefit
      case 'isChildCareSubsidy':
      case 'isWorkingForFamiliesFamilyTaxCredit':
      case 'isWorkingForFamiliesInWorkTaxCredit':
        return t.id === benefit && childrenReq
      case 'isSupportedLivingPayment':
      case 'isYoungParentPayment':
        return t.id === benefit && relationshipReq && childrenReq
      case 'isAccommodationSupplement':
        if (areaCode) {
          return t.id === benefit && t['Area'] == areaCode && relationshipReq && childrenReq
        } else {
          return false
        }
      default:
        return false
    }
  })
}

const showBenefit = (benefit, applicant) => {
  switch (benefit) {
    case 'isJobSeekerSupport':
      return applicant.age >= 20 || applicant.numberOfChildren === 0
    default:
      return true
  }
}

export default transform
