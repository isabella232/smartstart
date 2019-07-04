import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import get from 'lodash/get'
import moment from 'moment'
import { Link } from 'react-router'
import { piwikTrackPost } from 'actions/application'
import { fetchMetadata, postToReasoner } from 'actions/entitlements'
import Spinner from 'components/spinner/spinner'
import Accordion from 'components/form/accordion'
import Benefit from 'components/entitlements/benefit'
import BENEFITS_MAPPING from 'components/entitlements/benefits-openfisca'
import './results.scss'

class EntitlementsResults extends Component {
  constructor (props) {
    super(props)

    this.state = {
      permitted: [],
      forbidden: [],
      maybe: []
    }

    this.retry = this.retry.bind(this)
    this.assessBenefits = this.assessBenefits.bind(this)
    this.changeAnswers = this.changeAnswers.bind(this)
    this.changeAnswersNoData = this.changeAnswersNoData.bind(this)
  }

  componentDidMount () {
    this.props.fetchMetadata()
  }

  componentWillReceiveProps (nextProps) {
    // set permitted, forbidden and may be benefits in state
    const { eligibility, metadata } = nextProps
    if (eligibility && Object.keys(eligibility).length && metadata && metadata.length) {
      this.assessBenefits(eligibility, metadata)
    }
  }

  retry () {
    this.props.postToReasoner(this.props.eligibilityRequest)
  }

  changeAnswers () {
    const piwikEvent = {
      'category': 'Financial help',
      'action': 'Results page - click back',
      'name': 'Change my answers'
    }
    this.props.piwikTrackPost('Financial help', piwikEvent)
  }

  changeAnswersNoData () {
    const piwikEvent = {
      'category': 'Financial help',
      'action': 'Results page - click back (no data)',
      'name': 'Change my answers (no data)'
    }
    this.props.piwikTrackPost('Financial help', piwikEvent)
  }

  assessBenefits (data, metadata) {
    let newPermitted = []
    let newForbidden = []
    let newMaybe = []

    BENEFITS_MAPPING.forEach(benefit => {
      const currentPeriod = moment().format('YYYY-MM')
      const eligibility = get(data, 'persons.applicant.' + benefit.openfisca)
      const isEligible = eligibility ? eligibility[currentPeriod] : null

      if (isEligible === true) {
        newPermitted.push(metadata.find(b => b.id === benefit.name))
      } else if (isEligible === false) {
        newForbidden.push(metadata.find(b => b.id === benefit.name))
      } else {
        // some benefits doesn't need to show at all
      }
    })

    // hide benefits based other benefit result
    if (newPermitted.find(b => b.id === 'isOrphansBenefit') || newPermitted.find(b => b.id === 'isUnsupportedChildsBenefit')) {
      newPermitted = newPermitted.filter(b => b.id !== 'isWorkingForFamiliesMinimumFamilyTaxCredit')
      newForbidden = newForbidden.filter(b => b.id !== 'isWorkingForFamiliesMinimumFamilyTaxCredit')

      newPermitted = newPermitted.filter(b => b.id !== 'isWorkingForFamiliesFamilyTaxCredit')
      newForbidden = newForbidden.filter(b => b.id !== 'isWorkingForFamiliesFamilyTaxCredit')

      newPermitted = newPermitted.filter(b => b.id !== 'isYoungParentPayment')
      newForbidden = newForbidden.filter(b => b.id !== 'isYoungParentPayment')
    }

    if (newPermitted.find(b => b.id === 'isStudentAllowance')) {
      newPermitted = newPermitted.filter(b => b.id !== 'isWorkingForFamiliesInWorkTaxCredit')
      newForbidden = newForbidden.filter(b => b.id !== 'isWorkingForFamiliesInWorkTaxCredit')
    }

    this.setState({
      permitted: newPermitted,
      forbidden: newForbidden,
      maybe: newMaybe
    })
  }

  render () {
    const { fetchingEligibility, eligibilityRequest, eligibility, fetchingMetadata } = this.props
    const { permitted, forbidden, maybe } = this.state

    if (fetchingEligibility || fetchingMetadata) {
      return <Spinner text='Please wait ...'/>
    }

    if ((!eligibility || Object.keys(eligibility).length === 0) && Object.keys(eligibilityRequest).length > 0) {
      // no results and we do have question data - unable to connect to entitlements api endpoint
      return <div className='unavailable-notice'>
        <h3>Sorry!</h3>
        <p>
          The financial help tool is currently unavailable. Right now we’re working on getting back online as soon as possible.
          Thank you for your patience - please <Link to={'/financial-help/results'} onClick={this.retry}>try again</Link> shortly.
        </p>
      </div>
    }

    if (Object.keys(eligibilityRequest).length === 0) {
      // no question data - user refreshed or directly came to this page
      return <div className='unavailable-notice entitlements-results'>
        <h3>It looks like you haven’t answered any questions yet&hellip;</h3>
        <p>If you refreshed this page or bookmarked it from a previous session your answers and results will have disappeared, as we don’t save any of your information for privacy reasons.</p>
        <p>If you want to see what you might be eligible for, <Link to={'/financial-help/questions'}>please answer these questions</Link>.</p>

        <div className='form eligibility'>
          <Link to={'/financial-help/questions'} onClick={this.changeAnswersNoData} role="button" className="button change-answers">Answer questions</Link>
        </div>
      </div>
    }

    return (
      <div className='entitlements-results'>
        {(permitted.length > 0 || maybe.length > 0) && <div>
          <p>The results provided are only an indication of what benefits and payments you may be eligible for. They are based on the information you entered and could differ from what you’re actually eligible for.</p>

          <p>A decision about your eligibility will only be made when you apply and give more detailed information about your circumstances. Using this planning tool is not an application.</p>
        </div>
        }

        {permitted.length > 0 &&
          <h3 className='section-heading'>
             Ākene pea, e māraurau ana koe ki te<br />
            <span className='english'>You’re probably eligible for</span>
          </h3>
        }
        {permitted.map((benefit, index) =>
          <Benefit key={'permitted-' + index} metadata={benefit} />
        )}

        {maybe.length > 0 &&
          <h3 className='section-heading'>
             E māraurau ana pea koe ki te<br />
            <span className='english'>You’re possibly eligible for</span>
          </h3>
        }
        {maybe.map((benefit, index) =>
          <Benefit key={'maybe-' + index} id={benefit.name} metadata={benefit} />
        )}

        {(permitted.length === 0 && maybe.length === 0) &&
          <div className='all-forbidden form eligibility'>
            <h3>It doesn’t look like you’re eligible&hellip;</h3>
            <p>
              Based on your answers, it looks like you’re probably not eligible for any of the benefits and payments included in this tool. You can <Link to={'/financial-help/questions'} onClick={this.changeAnswers}>change your answers</Link> if they don’t reflect your current situation or if your situation changes.
            </p>
            <div className="expandable-group">
              <Accordion>
                <Accordion.Toggle>
                Do you and your children need urgent financial help?
                </Accordion.Toggle>
                <Accordion.Content>
                  <p>You can apply for the emergency benefit if you need urgent financial help and aren’t currently receiving any other benefits from Work and Income. The emergency benefit is calculated based on your circumstances.</p>
                  <p>You’ll need to call Work and Income to discuss your circumstances with them.</p>
                  <p>Work and Income freephone: <a href='tel:0800559009'>0800 559 009</a></p>
                  <h5>For other urgent help:</h5>
                  <p>Foodbank New Zealand help families in need by providing food parcels and other services. </p>
                  <p><a href='https://www.foodbank.co.nz/foodbanks' target='_blank' rel='noopener noreferrer'>Find a foodbank near you</a></p>
                  <p>Citizens Advice Bureau has trained volunteers that will provide you with free and confidential information and guidance on where you can get urgent help in your local area.</p>
                  <p>Citizens Advice Bureau freephone: <a href='tel:0800367222'>0800 367 222</a></p>
                  <p><a href='http://www.cab.org.nz/acabnearyou/Pages/home.aspx'  target='_blank' rel='noopener noreferrer'>Find a Citizens Advice Bureau near you</a></p>
                </Accordion.Content>
              </Accordion>
              <Accordion>
                <Accordion.Toggle>
                Am I eligible for any other benefits and payments?
                </Accordion.Toggle>
                <Accordion.Content>
                  <p>This tool only covers 17 benefits and payments - there are other benefits and payments that you may be eligible for.</p>

                  <p>You can use Work and Income’s ‘Check what you might get’ tool to see if you’re eligible for any other financial help.</p>
                  <p><a href='https://www.workandincome.govt.nz/online-services/eligibility/index.html' target='_blank' rel='noopener noreferrer'>Check what you might get</a></p>
                </Accordion.Content>
              </Accordion>
            </div>
          </div>
        }

        {forbidden.length > 0 &&
          <div>
            <h3 className='section-heading'>
               Kāore pea iana koe e māraurau ana ki te<br />
              <span className='english'>You’re probably not eligible for</span>
            </h3>
            <ul>
              {forbidden.map((benefit, index) => {
                if (benefit && benefit.name && benefit.moreInformationLink) {
                  return (
                    <li key={'forbidden-' + index}>
                      <a href={benefit.moreInformationLink} target='_blank' rel='noopener noreferrer'>{benefit.name}</a>
                    </li>
                  )
                }
              })}
            </ul>
          </div>
        }

        <div className='form eligibility'>
          <Link to={'/financial-help/questions'} onClick={this.changeAnswers} role="button" className="button change-answers">Change my answers</Link>
        </div>

      </div>
    )
  }
}

EntitlementsResults.propTypes = {
  fetchingEligibility: PropTypes.bool,
  eligibility: PropTypes.object,
  eligibilityRequest: PropTypes.object,
  fetchingMetadata: PropTypes.bool,
  metadata: PropTypes.array,
  fetchMetadata: PropTypes.func,
  postToReasoner: PropTypes.func,
  piwikTrackPost: PropTypes.func
}

const mapStateToProps = (state) => ({
  fetchingEligibility: get(state, 'entitlements.fetchingEligibility'),
  eligibility: get(state, 'entitlements.eligibility'),
  eligibilityRequest: get(state, 'entitlements.eligibilityRequest'),
  fetchingMetadata: get(state, 'entitlements.fetchingMetadata'),
  metadata: get(state, 'entitlements.metadata')
})

export default connect(
  mapStateToProps,
  {
    fetchMetadata,
    postToReasoner,
    piwikTrackPost
  }
)(EntitlementsResults)
