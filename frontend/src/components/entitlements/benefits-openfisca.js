// used for mapping benefits from data.govt datasets to openfisca variables
// some benefits would have threshold variable, it used to calculate if
// user passes threshold requirement for relevant benefits

export default [
  {
    name: 'isAccommodationSupplement',
    openfisca: 'social_security__eligible_for_accommodation_supplement',
    threshold: 'accommodation_supplement__below_income_threshold'
  },
  {
    name: 'isBestStart',
    openfisca: 'best_start__eligibility',
  },
  {
    name: 'ChildDisabilityAllowance',
    openfisca: 'social_security__eligible_for_child_disability_allowance'
  },
  {
    name: 'isChildCareSubsidy',
    openfisca: 'social_security_regulation__eligible_for_childcare_subsidy',
    threshold: 'social_security_regulation__household_income_below_childcare_subsidy_threshold'
  },
  {
    name: 'isCommunityServicesCard',
    openfisca: 'social_security__eligible_for_community_services_card',
    threshold: 'community_services_card__below_income_threshold'
  },
  {
    name: 'isHomeHelp',
    openfisca: 'home_help__eligible_for_home_help'
  },
  {
    name: 'isJobSeekerSupport',
    openfisca: 'social_security__eligible_for_jobseeker_support',
    threshold: 'jobseeker_support__below_income_threshold'
  },
  {
    name: 'isOrphansBenefit',
    openfisca: 'social_security__eligible_for_orphans_benefit'
  },
  {
    name: 'isPaidParentalLeave',
    openfisca: 'parental_leave__eligible_employee',
  },
  {
    name: 'isSoleParentSupport',
    openfisca: 'social_security__eligible_for_sole_parent_support',
    threshold: 'sole_parent_support__below_income_threshold'
  },
  {
    name: 'isStudentAllowance',
    openfisca: 'student_allowance__eligible_for_basic_grant'
  },
  {
    name: 'isSupportedLivingPayment',
    openfisca: 'social_security__eligible_for_supported_living_payment',
    threshold: 'supported_living_payment__below_income_threshold'
  },
  {
    name: 'isUnsupportedChildsBenefit',
    openfisca: 'social_security__eligible_for_unsupported_childs_benefit'
  },
  {
    name: 'isWorkingForFamiliesMinimumFamilyTaxCredit',
    openfisca: 'family_scheme__qualifies_for_minimum_family_tax_credit'
  },
  {
    name: 'isWorkingForFamiliesFamilyTaxCredit',
    openfisca: 'family_scheme__qualifies_for_family_tax_credit',
    threshold: 'family_scheme__family_tax_credit_income_under_threshold'
  },
  {
    name: 'isWorkingForFamiliesInWorkTaxCredit',
    openfisca: 'family_scheme__qualifies_for_in_work_tax_credit',
    threshold: 'family_scheme__in_work_tax_credit_income_under_threshold'
  },
  {
    name: 'isYoungParentPayment',
    openfisca: 'social_security__eligible_for_young_parent_payment',
    threshold: ['social_security__family_income_under_young_parent_payment_threshold','social_security__income_under_young_parent_payment_threshold']
  }
]
