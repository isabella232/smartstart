import get from 'lodash/get'
import set from 'lodash/set'
import moment from 'moment'
import check from 'components/form/get-validation'
import schema from '../schemas/step5'
import {
  REQUIRE_MOTHER_EMAIL_IRD,
  REQUIRE_FATHER_EMAIL_IRD,
  REQUIRE_AT_LEAST_ONE_MSD
} from '../../validation-messages'

import { BS_ELIGIBLE_DATE, isDateEligible } from '../../best-start-utils'

const validate = (values) => {
  const errors = {}

  const bestStartWanted = get(values, 'bestStart.wanted')
  const birthDate = get(values, 'child.birthDate')
  const dueDate = get(values, 'bestStart.expectedDueDate')
  const primaryCareGiver = get(values, 'bestStart.primaryCareGiver.type')
  const pcgBirthDate = get(values, primaryCareGiver + '.dateOfBirth')
  const age = moment().diff(pcgBirthDate, 'years')
  const msd = get(values, 'bestStart.primaryCareGiver.isMSDClient')
  const msdNotify = get(values, 'msd.notify')
  const motherMsd = get(values, 'msd.mothersClientNumber')
  const fatherMsd = get(values, 'msd.fathersClientNumber')
  const workingForFamilies = get(values, 'bestStart.primaryCareGiver.isGettingWorkingForFamilies')
  const nzResident = get(values, 'bestStart.primaryCareGiver.isNewZealandResident')
  const taxResident = get(values, 'bestStart.primaryCareGiver.isTaxResident')
  const childResident = get(values, 'bestStart.primaryCareGiver.isChildResident')
  const hasLivedInNZForTwelveMonths = get(values, 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')
  const taxResidentWhenBestStartStarts = get(values, 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')
  const hasPartner = get(values, 'bestStart.primaryCareGiver.hasPartner')
  const sharingCare = get(values, 'bestStart.primaryCareGiver.isSharingCare')
  const creditUnion = get(values, 'bestStart.primaryCareGiver.bankAccount.creditUnion')
  const declaration = get(values, 'bestStart.primaryCareGiver.declarationAccepted')
  const irdApplyForNumber = get(values, 'ird.applyForNumber')
  const irdNumberDeliveryAddress = get(values, 'ird.deliveryAddress')
  const irdNumberByEmail = get(values, 'ird.numberByEmail')
  const bestStartNotEligble = (bestStartWanted === 'yes' &&
                               (primaryCareGiver === 'other' || primaryCareGiver === 'unknown') ||
                               ((primaryCareGiver === 'mother' || primaryCareGiver === 'father') && age < 16) ||
                               (!isDateEligible(birthDate, dueDate)) ||
                                nzResident === 'no')

  check('bestStart.wanted')(schema, values, errors)

  if(bestStartWanted === 'yes' && moment(birthDate).isBefore(BS_ELIGIBLE_DATE)) {
    check('bestStart.expectedDueDate')(schema, values, errors)
  }

  if (bestStartWanted === 'yes' && isDateEligible(birthDate, dueDate)) {
    check('bestStart.primaryCareGiver.type')(schema, values, errors)

    if (primaryCareGiver === 'other') {
      check('bestStart.primaryCareGiver.firstNames')(schema, values, errors)
      check('bestStart.primaryCareGiver.surname')(schema, values, errors)
      check('bestStart.primaryCareGiver.daytimePhone')(schema, values, errors)
    }

    if (primaryCareGiver === 'mother' || primaryCareGiver === 'father') {
      if(age >= 16) {
        if (nzResident === 'yes') {
          check('bestStart.primaryCareGiver.isMSDClient')(schema, values, errors)
          if (msd === 'yes') {
             check('msd.notify')(schema, values, errors)
             if(msdNotify === true){
               check('msd.mothersClientNumber')(schema, values, errors)
               check('msd.fathersClientNumber')(schema, values, errors)
               if (!motherMsd && !fatherMsd) {
                 set(errors, 'msd.fathersClientNumber', REQUIRE_AT_LEAST_ONE_MSD)
               }
               check('ird.applyForNumber')(schema, values, errors)
             }
           }
          if (msd === 'no') {
            check('bestStart.primaryCareGiver.isGettingWorkingForFamilies')(schema, values, errors)

            if (workingForFamilies === 'yes') {
              check('bestStart.primaryCareGiver.irdNumber')(schema, values, errors)
              check('ird.deliveryAddress')(schema, values, errors)
              check('bestStart.primaryCareGiver.isSharingCare')(schema, values, errors)
              if(sharingCare === 'yes') {
                check('bestStart.primaryCareGiver.careSharer.firstNames')(schema, values, errors)
                check('bestStart.primaryCareGiver.careSharer.surname')(schema, values, errors)
                check('bestStart.primaryCareGiver.careSharer.daytimePhone')(schema, values, errors)
              }
              check('bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')(schema, values, errors)
              check('bestStart.primaryCareGiver.declarationAccepted')(schema, values, errors)
              // As per client request, we need to send ird.applyForNumber field, but in certain flows we
              // dont ask this question, so have to programmatically set the value once user has accepted
              // the best start declaration
              if(declaration) {
                set(values, 'ird.applyForNumber', 'yes')
              }
            }

            if (workingForFamilies === 'no') {
              check('bestStart.primaryCareGiver.isTaxResident')(schema, values, errors)
              if(taxResident === 'no') {
                check('bestStart.primaryCareGiver.isChildResident')(schema, values, errors)
                if(childResident === 'no') {
                  check('bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths')(schema, values, errors)
                  check('bestStart.primaryCareGiver.taxResidentWhenBestStartStarts')(schema, values, errors)
                }
              }
              if ((taxResident === 'yes' || childResident === 'yes') ||
              (hasLivedInNZForTwelveMonths === 'yes' && taxResidentWhenBestStartStarts === 'yes')) {
                check('bestStart.primaryCareGiver.isSharingCare')(schema, values, errors)
                if(sharingCare === 'yes') {
                  check('bestStart.primaryCareGiver.careSharer.firstNames')(schema, values, errors)
                  check('bestStart.primaryCareGiver.careSharer.surname')(schema, values, errors)
                  check('bestStart.primaryCareGiver.careSharer.daytimePhone')(schema, values, errors)
                }
                check('bestStart.primaryCareGiver.hasPartner')(schema, values, errors)
                if(hasPartner === 'yes') {
                  check('bestStart.primaryCareGiver.partner.firstNames')(schema, values, errors)
                  check('bestStart.primaryCareGiver.partner.surname')(schema, values, errors)
                  check('bestStart.primaryCareGiver.partner.irdNumber')(schema, values, errors)
                }
                check('bestStart.primaryCareGiver.isApplyingForPaidParentalLeave')(schema, values, errors)
                check('bestStart.primaryCareGiver.irdNumber')(schema, values, errors)
                check('bestStart.primaryCareGiver.bankAccount.name')(schema, values, errors)
                check('bestStart.primaryCareGiver.bankAccount.number')(schema, values, errors)
                if(creditUnion) {
                  check('bestStart.primaryCareGiver.bankAccount.creditUnionReferenceNumber')(schema, values, errors)
                }
                check('bestStart.primaryCareGiver.bankAccount.paymentFrequency')(schema, values, errors)
                check('bestStart.primaryCareGiver.declarationAccepted')(schema, values, errors)
                // As per client request, we need to send ird.applyForNumber field, but in certain flows we
                // dont ask this question, so have to programmatically set the value once user has accepted
                // the best start declaration
                if(declaration) {
                  set(values, 'ird.applyForNumber', 'yes')
                }
              }
            }
          }
        }
      }
    }
  }

  if(bestStartWanted === 'no' || bestStartNotEligble) {
    check('ird.applyForNumber')(schema, values, errors)
  }

  if (irdApplyForNumber === 'yes') {
    check('ird.deliveryAddress')(schema, values, errors)
    check('ird.numberByEmail')(schema, values, errors)
    if(!declaration) {
      check('ird.taxCreditIRDNumber')(schema, values, errors)
    }
  }

  if (
    irdApplyForNumber === 'yes' &&
    irdNumberByEmail === 'yes' &&
    (
      irdNumberDeliveryAddress === 'mothersAddress' ||
      irdNumberDeliveryAddress === 'fathersAddress'
    )
  ) {
    if (irdNumberDeliveryAddress === 'mothersAddress') {
      const motherEmail = get(values, 'mother.email')
      if (!motherEmail) {
        set(errors, 'ird.numberByEmail', REQUIRE_MOTHER_EMAIL_IRD)
      }
    } else if (irdNumberDeliveryAddress === 'fathersAddress') {
      const fatherEmail = get(values, 'father.email')
      if (!fatherEmail) {
        set(errors, 'ird.numberByEmail', REQUIRE_FATHER_EMAIL_IRD)
      }
    }
  }

  const notifyMsd = get(values, 'msd.notify')

  if (notifyMsd) {
    check('msd.mothersClientNumber')(schema, values, errors)
    check('msd.fathersClientNumber')(schema, values, errors)

    if (!motherMsd && !fatherMsd) {
      set(errors, 'msd.fathersClientNumber', REQUIRE_AT_LEAST_ONE_MSD)
    }
  }

  return errors
}

export default validate
