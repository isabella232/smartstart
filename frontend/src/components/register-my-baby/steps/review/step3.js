import React from 'react'
import PropTypes from 'prop-types'
import { Field } from 'redux-form'
import renderFieldReview from 'components/form/fields/render-review-field'
import renderSubFieldReview from 'components/form/fields/render-review-subfield'
import renderReviewValidation from 'components/form/fields/render-review-validation'
import { formatAddress, formatDate } from './utils'
import renderWarning from 'components/form/fields/render-warning'
import { renderEthnicGroupsValue } from './step1'
import {
  yesNo,
  yesNoNotSure,
  citizenshipSources,
  getOptionDisplay,
  secondParentTitleOptions
} from '../../options'
import schema from '../schemas/step3'
import getFieldReviewProps from './get-field-review-props'
import { getSecondParentTitle, translateToMaori } from '../../helpers'
import { capitalizeWordsAll } from 'utils'

const renderStep3Review = ({ formState, onEdit }) => {
    const { assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, secondParent, fatherKnown, father } = formState || {}
    const { isCitizen, citizenshipSource } = father || {};
    const { preferedTitle } = secondParent || {}
    const secondParentTitle = getSecondParentTitle(assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, preferedTitle, fatherKnown)

    return <div className="review-section">
      <div className="section-heading">
        <h3>
          <span className="maori">{capitalizeWordsAll(translateToMaori(secondParentTitle))}</span> <br/>
          <span className="subtitle">{capitalizeWordsAll(secondParentTitle)}</span>
        </h3>
        <button type="button" onClick={() => onEdit('other-parent-details')} className="section-edit-btn">Edit</button>
      </div>

      <Field
        {...getFieldReviewProps(schema, 'assistedHumanReproduction')}
        component={renderFieldReview}
        valueRenderer={getOptionDisplay(yesNo)}
        section="other-parent-details"
        onEdit={onEdit}
      />

      { formState.assistedHumanReproduction === 'yes' &&
        <div className="review-subfields">
          <Field
            {...getFieldReviewProps(schema, 'assistedHumanReproductionManConsented')}
            component={renderSubFieldReview}
            valueRenderer={value => value ? 'Yes' : 'No'}
            section="other-parent-details"
          />
          <Field
            {...getFieldReviewProps(schema, 'assistedHumanReproductionWomanConsented')}
            component={renderSubFieldReview}
            valueRenderer={value => value ? 'Yes' : 'No'}
            section="other-parent-details"
          />
        { formState.assistedHumanReproductionWomanConsented &&
          <Field
            {...getFieldReviewProps(schema, 'secondParent.preferedTitle')}
            component={renderFieldReview}
            valueRenderer={getOptionDisplay(secondParentTitleOptions)}
            section="other-parent-details"
            onEdit={onEdit}
          />
        }
          <Field
            {...getFieldReviewProps(schema, 'assistedHumanReproductionSpermDonor')}
            component={renderSubFieldReview}
            valueRenderer={value => value ? 'Yes' : 'No'}
            section="other-parent-details"
          />
        </div>
      }

      { formState.assistedHumanReproduction === 'no' &&
        <Field
          {...getFieldReviewProps(schema, 'fatherKnown')}
          component={renderFieldReview}
          valueRenderer={getOptionDisplay(yesNo)}
          section="other-parent-details"
          onEdit={onEdit}
        />
      }

      {
        (
          (
            formState.assistedHumanReproduction === 'no' &&
            formState.fatherKnown === 'yes'
          ) ||
          (
            formState.assistedHumanReproduction === 'yes' &&
            (formState.assistedHumanReproductionManConsented || formState.assistedHumanReproductionWomanConsented)
          )
        ) &&
        <div>
          <Field
            {...getFieldReviewProps(schema, 'father.firstNames')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.surname')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.firstNamesAtBirth')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.surnameAtBirth')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.occupation')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.dateOfBirth')}
            component={renderFieldReview}
            valueRenderer={formatDate}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.placeOfBirth')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.countryOfBirth')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.homeAddress.line1')}
            component={renderFieldReview}
            valueRenderer={() => formatAddress(formState.father.homeAddress)}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field name="father.homeAddress.suburb" component={renderReviewValidation} />
          <Field name="father.homeAddress.line2" component={renderReviewValidation} />
          <Field
            {...getFieldReviewProps(schema, 'father.maoriDescendant')}
            component={renderFieldReview}
            valueRenderer={getOptionDisplay(yesNoNotSure)}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.ethnicGroups')}
            component={renderFieldReview}
            valueRenderer={renderEthnicGroupsValue(formState, 'father')}
            section="other-parent-details"
            onEdit={onEdit}
          />
          <Field
            {...getFieldReviewProps(schema, 'father.isCitizen')}
            component={renderFieldReview}
            valueRenderer={getOptionDisplay(yesNo)}
            section="other-parent-details"
            onEdit={onEdit}
          />
          { isCitizen === 'no' &&
            <div className="review-subfields">
              <Field
                {...getFieldReviewProps(schema, 'father.isPermanentResident')}
                component={renderSubFieldReview}
                valueRenderer={getOptionDisplay(yesNo)}
                section="other-parent-details"
              />
              <Field
                {...getFieldReviewProps(schema, 'father.isNZRealmResident')}
                component={renderSubFieldReview}
                valueRenderer={getOptionDisplay(yesNo)}
                section="other-parent-details"
              />
              <Field
                {...getFieldReviewProps(schema, 'father.isAuResidentOrCitizen')}
                component={renderSubFieldReview}
                valueRenderer={getOptionDisplay(yesNo)}
                section="other-parent-details"
              />
              <Field
                {...getFieldReviewProps(schema, 'father.nonCitizenDocNumber')}
                component={renderSubFieldReview}
                section="other-parent-details"
              />
            </div>
          }

          { isCitizen === 'yes' &&
            <div className="review-subfields">
              <Field
                {...getFieldReviewProps(schema, 'father.citizenshipSource')}
                component={renderSubFieldReview}
                valueRenderer={getOptionDisplay(citizenshipSources)}
                section="other-parent-details"
              />
              { (citizenshipSource === 'bornInNiue' ||
                 citizenshipSource === 'bornInCookIslands' ||
                 citizenshipSource === 'bornInTokelau') &&
                <Field
                  {...getFieldReviewProps(schema, 'father.citizenshipPassportNumber')}
                  component={renderSubFieldReview}
                  section="other-parent-details"
                />
              }
            </div>
          }

          <Field
            name="father.citizenshipWarning"
            component={renderWarning}
          />

          <Field
            {...getFieldReviewProps(schema, 'father.daytimePhone')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />

          <Field
            {...getFieldReviewProps(schema, 'father.alternativePhone')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />

          <Field
            {...getFieldReviewProps(schema, 'father.email')}
            component={renderFieldReview}
            section="other-parent-details"
            onEdit={onEdit}
          />
        </div>
      }
    </div>
}

renderStep3Review.propTypes = {
  formState: PropTypes.object,
  onEdit: PropTypes.func
}

export default renderStep3Review
