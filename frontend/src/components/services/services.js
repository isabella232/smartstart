import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { orderByDistance, convertDistance, getDistance } from 'geolib'
import classNames from 'classnames'
import { browserHistory } from 'react-router'
import { StickyContainer, Sticky } from 'react-sticky'
import scriptLoader from 'react-async-script-loader'
import { fetchServicesDirectory, fetchProviders } from 'actions/services'
import LocationAutosuggest from 'components/location-autosuggest/location-autosuggest'
import ResultMap from 'components/services/map'
import Provider from 'components/services/provider'
import Spinner from 'components/spinner/spinner'
import { stringToFloat } from 'utils'

import './services.scss'

const RESULTS_LIMIT = 50

class Services extends Component {
  constructor (props) {
    super(props)

    this.state = {
      category: '',
      listView: true,
      locationText: '',
      location: { latitude: null, longitude: null },
      mapCenter: { lat: -41.295378, lng: 174.778684 },
      mapZoom: 5,
      results: [],
      loading: false,
      googleLibAvailable: false,
      displayType: ''
    }

    this.setLocationFromStore = this.setLocationFromStore.bind(this)
    this.onLocationSelect = this.onLocationSelect.bind(this)
    this.onLocationTextChange = this.onLocationTextChange.bind(this)
    this.onNoLocationSelect = this.onNoLocationSelect.bind(this)
    this.onCategorySelect = this.onCategorySelect.bind(this)
    this.showOnMap = this.showOnMap.bind(this)
    this.changeTabAndShowOnMap = this.changeTabAndShowOnMap.bind(this)
    this.clickListTab = this.clickListTab.bind(this)
    this.clickMapTab = this.clickMapTab.bind(this)
    this.clearLocation = this.clearLocation.bind(this)
    this.fetchProviders = this.fetchProviders.bind(this)
    this.setDisplayType = this.setDisplayType.bind(this)
  }

  componentDidMount () {
    const { isScriptLoaded, isScriptLoadSucceed, category, personalisationValues } = this.props

    if (isScriptLoaded && isScriptLoadSucceed) {
      this.setState({ googleLibAvailable: true })
    }

    if (category) {
      this.onCategorySelect(category)
    }

    if (this.state.category === '') {
      this.setState({ loading: false })
    }

    if (personalisationValues.settings && personalisationValues.settings.loc) {
      this.setLocationFromStore(personalisationValues.settings)
    }

    this.props.dispatch(fetchServicesDirectory())
  }

  componentDidUpdate (prevProps, prevState) {
    if (this.props.isScriptLoaded && !prevProps.isScriptLoaded) { // script load finished
      if (this.props.isScriptLoadSucceed) {
        this.setState({ googleLibAvailable: true })
      }
    }

    // set default location if it's been updated in user prefs
    if (this.props.personalisationValues.settings && this.props.personalisationValues.settings.loc) {
      // compare props
        if (this.props.personalisationValues.settings.loc !== prevProps.personalisationValues.settings.loc) {
          this.setLocationFromStore(this.props.personalisationValues.settings)
        }
    }

    // display loading spinner if category is set and location has been changed
    if (this.state.category !== '') {
      const { latitude, longitude } = this.state.location
      // compare state
      if ((latitude !== prevState.location.latitude) && (longitude !== prevState.location.longitude)) {
        this.setState({ loading: true })
      }
    }

    // hack to force google maps to redraw because we start with it hidden
    try {
      window.dispatchEvent(new Event('resize'))
    } catch(error) {
      // the above doesn't work in IE11, but it doesn't seem to need it because
      // resetBoundsOnResize in the map options resolves the issue for IE
      // so just eat the error silently
    }
  }

  setLocationFromStore (settings) {
    if (settings.loc && !this.state.location.text) {
      this.setState({
        location: { latitude: stringToFloat(settings.lat), longitude: stringToFloat(settings.lng), text: settings.loc },
        locationText: settings.loc
      }, () => {
        this.showOnMap(this.state.location)
      })
    }
  }

  onCategorySelect (category) {
    // check if category is passed in from event or from componentDidMount or route
    if (typeof category === 'object') { // from using the select
      category = category.target.value
    }
    this.setState({ category: category })

    // only do the dispatch if the category is set, i.e. not '' the blank value
    if (category !== '') {
      this.setState({ loading: true })
      this.fetchProviders(category)
      .then(() => {
        this.setDisplayType()
        this.computeDistances()
        browserHistory.replace(`/services-near-me/${category}`)
      })
    } else {
      browserHistory.replace(`/services-near-me`)
    }
  }

  fetchProviders (category) {
    return this.props.dispatch(fetchProviders(category))
  }

  setDisplayType () {
    let directoryObject
    if (this.props.directory) {
      directoryObject = this.props.directory.find( directory => {
        return (directory.id == this.state.category)
      })
      if (directoryObject) {
        this.setState({ displayType: directoryObject.type })
      }
    }
  }

  onLocationSelect (locationDetail) {
    if (locationDetail) {
      this.setState({
        location: {
          latitude: locationDetail.geometry.location.lat(),
          longitude: locationDetail.geometry.location.lng(),
          text: locationDetail.formatted_address
        }
      }, () => {
        this.setDisplayType()
        // we need to re-calculate distances
        this.computeDistances(this.props.providers)
      })
    }
  }

  onLocationTextChange (event, { newValue }) {
    this.setState({
      locationText: newValue
    })
  }

  onNoLocationSelect () {
    // when clicking away from the control, blank it if a proper location hasn't
    // yet been selected, or return to last selected value
    if (!this.state.location.text) {
      this.setState({
        locationText: '',
        location: { latitude: null, longitude: null, text: '' }
      })
    } else {
      this.setState({
        locationText: this.state.location.text
      })
    }
  }

  clearLocation () {
    this.setState({
      locationText: '',
      location: { latitude: null, longitude: null }
    })
  }

  showOnMap (location) {
    if (location.latitude && location.longitude) {
      this.setState({
        mapCenter: {
          lat: location.latitude,
          lng: location.longitude
        },
        mapZoom: 13
      })
    }
  }

  changeTabAndShowOnMap (location) {
    // we need a separate function for use by the list so the normal showOnMap
    // (which gets called from a lot of places) doesn't do the tab switch
    if (location.latitude && location.longitude) {
      // reset the mobile view to map
      this.setState({
        listView: false
      }, () => {
        // it's very important to wait until the map is visible before trying
        // to center it - otherwise the centering won't work properly
        this.setState({
          mapCenter: {
            lat: location.latitude,
            lng: location.longitude
          },
          mapZoom: 13
        })
      })
    }
  }

  computeDistances () {
    const { location } = this.state

    if (!location.latitude || !location.longitude) {
      this.setState({ results: [] })
      return
    }

    if (this.state.category !== '') {
      let providerList = this.props.providers

      if (this.state.category === 'primary-schools') {
        //Correspondence School needs to appear at the bottom of any Primary School search, regardless of lat/long
        // Pull out Correspondence School from providers list (to be added to result list later)
        providerList = this.props.providers.filter(provider => !provider.type.startsWith('Correspondence School'))
      }

      let providersOrderedByDistance = orderByDistance(location, providerList)
      // add 'distance' to each provider
      providersOrderedByDistance.forEach( provider => {
        let distance = getDistance(location, { latitude: provider.latitude, longitude: provider.longitude})
        provider.distance = convertDistance(distance, 'km')
      })

      let results = providersOrderedByDistance.slice(0, RESULTS_LIMIT)
      if (this.state.category === 'primary-schools') {
        //add correspondenceSchool to end of results list
        let correspondenceSchool = this.props.providers.find(provider => provider.type.startsWith('Correspondence School'))
        if (correspondenceSchool) {
          results = [...results, correspondenceSchool]
        }
      }

      this.setState({
        results: results,
        loading: false
      }, () => {
        this.showOnMap(this.state.location)
      })
    }
  }

  clickListTab () {
    this.setState({
      listView: true
    })
  }

  clickMapTab () {
    this.setState({
      listView: false
    })
  }

  render () {
    const { directoryError, directory, providerError } = this.props
    const { category, listView, location, locationText, mapCenter, mapZoom, results, loading, googleLibAvailable, displayType } = this.state

    const loadErrorClasses = classNames(
      'load-error',
      { 'hidden': !directoryError || !providerError }
    )
    const resultsWrapperClasses = classNames({ 'hidden': directoryError || providerError })
    const resultsClasses = classNames(
      'results',
      { 'hidden': !(category !== '' && location.latitude && location.longitude && results.length && !loading) }
    )
    const selectMoreInfoClasses = classNames(
      'select-more-info',
      { 'hidden': !!(category !== '' && location.latitude && location.longitude) }
    )
    const locationClearClasses = classNames(
      'inline-clear-field',
      { 'hidden': locationText === ''}
    )
    const listViewClasses = classNames(
      'provider-list',
      { 'inactive': !listView }
    )
    const mapViewClasses = classNames(
      'map-container',
      { 'inactive': listView }
    )
    const listTabClasses = classNames({ 'active': listView })
    const mapTabClasses = classNames({ 'active': !listView })

    return (
      <div>
        <div className='services-controls clearfix'>
          <div className='services-category'>
            <label data-test='services-category' htmlFor='services-category-field'>
              Category:
            </label>
            <select value={category} onChange={this.onCategorySelect} id='services-category-field'>
              <option value=''>Please select a category</option>
              {directory.map(category => {
                return (<option value={category.id} key={category.id}>{category.name}</option>)
              })}
            </select>
          </div>

          {googleLibAvailable && <div className='services-location'>
            <label data-test='services-location' htmlFor='services-location-field'>
              Location:
            </label>
            <LocationAutosuggest
              id='services-location-field'
              onPlaceSelect={this.onLocationSelect}
              onNoSelection={this.onNoLocationSelect}
              inputProps={{
                value: locationText,
                onChange: this.onLocationTextChange,
                autoComplete: 'off',
                placeholder: 'Start typing an address'
              }}
            />
            <button onClick={this.clearLocation} className={locationClearClasses}>
              <span className='visuallyhidden'>Clear location</span>
            </button>
          </div>}
        </div>

        <div className={loadErrorClasses}><h3>Unable to load</h3><p>Please try again shortly.</p></div>
        <div className={resultsWrapperClasses}>
          {loading && category && location.latitude && location.longitude && <Spinner />}

          <div className={resultsClasses}>
            <h3>Closest results near you</h3>

            <div className='map-list-tabs' aria-hidden='true'>
              <button onClick={this.clickListTab} className={listTabClasses} data-test='services-list-tab'>List view</button>
              <button onClick={this.clickMapTab} className={mapTabClasses} data-test='services-map-tab'>Map view</button>
            </div>

            <div className='results-layout'>
              <div className={listViewClasses} data-test='services-list'>
                {results.length && results.map((provider, index) => {
                  return <Provider key={'provider' + index} provider={provider} recenterMap={this.changeTabAndShowOnMap} displayType={displayType} />
                })}
              </div>

              {googleLibAvailable && <StickyContainer className='map-container-wrapper'>
                <Sticky>
                  {
                    ({ style }) => {
                      return (
                        <div style={style} className={mapViewClasses} aria-hidden='true' data-test='services-map'>
                          <ResultMap center={mapCenter} zoom={mapZoom} markers={results} showList={this.clickListTab} />
                        </div>
                      )
                    }
                  }
                </Sticky>
              </StickyContainer>}
            </div>
          </div>

          <div className={selectMoreInfoClasses} data-test='services-no-results'>
            <h3>No results</h3>
            <p>
              Please
              <span className={category ? 'hidden' : ''}>
                &nbsp;select a service category
                <span className={(location.latitude && location.longitude) ? 'hidden' : ''}> and</span>
              </span>
              <span className={(location.latitude && location.longitude) ? 'hidden' : ''}> enter an address</span>
              .
            </p>
          </div>
        </div>

      </div>
    )
  }
}

function mapStateToProps (state) {
  const {
    services,
    personalisation
  } = state
  const {
    directory,
    directoryError,
    providers,
    providerError
  } = services || {
    directory: [],
    directoryError: false,
    providers: [],
    providerError: false,
  }
  const {
    personalisationValues
  } = personalisation || {
    personalisationValues: {}
  }

  return {
    directory,
    directoryError,
    providers,
    providerError,
    personalisationValues
  }
}

Services.propTypes = {
  dispatch: PropTypes.func.isRequired,
  directory: PropTypes.array.isRequired,
  directoryError: PropTypes.bool.isRequired,
  providers: PropTypes.array,
  providerError: PropTypes.bool,
  category: PropTypes.string,
  personalisationValues: PropTypes.object,
  isScriptLoaded: PropTypes.bool,
  isScriptLoadSucceed: PropTypes.bool
}

export default scriptLoader(
  `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places&v=3.35`
)(connect(mapStateToProps)(Services))
