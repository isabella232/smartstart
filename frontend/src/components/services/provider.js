import React, { Component } from 'react'
import PropTypes from 'prop-types'
import nl2br from 'react-nl2br'
import ReadMore from 'components/services/read-more'

import './provider.scss'

class Provider extends Component {
  constructor (props) {
    super(props)

    this.setLocation = this.setLocation.bind(this)
  }

  isServiceIndentical (provName, serviceName) {
    if (provName === serviceName) {
      return 'Our Services'
    }
    return serviceName
  }

  setLocation (event) {
    event.preventDefault()
    const newLocation = {
      latitude: parseFloat(this.props.provider.latitude),
      longitude: parseFloat(this.props.provider.longitude)
    }
    this.props.recenterMap(newLocation)
  }

  render () {
    const { provider, displayType } = this.props

    let subsidyHours = provider.subsidy_20_hrs ? 'Yes' : 'No'

    const dataTypes = {
      EARLY_EDUCATION: 'EARLY_EDUCATION',
      SCHOOLS: 'SCHOOLS'
    }

    // Primary Schools and ECE have unique display fields and styles
    // below vairables allow for customization based on category
    let providerType
    if (displayType === dataTypes.SCHOOLS ||  displayType === dataTypes.EARLY_EDUCATION) {
      providerType = <p className="provider-type"><strong>Type:&nbsp;</strong><span>{provider.type}</span></p>
    }

    let providerHours
    if (displayType === dataTypes.EARLY_EDUCATION) {
      providerHours = <p><strong>Offers 20 hours ECE:</strong> { subsidyHours } </p>
    }

    let providerDescription
    if (provider.description.toLowerCase() !== 'not applicable') {
      if (displayType === dataTypes.SCHOOLS) {
        providerDescription = <div className="school-description"><ReadMore text={provider.description} /></div>
      } else if (displayType === dataTypes.EARLY_EDUCATION) {
        providerDescription =
        <div className="ece-description">
          <strong>Additional information: </strong>
          <ReadMore text={provider.description} />
        </div>
      } else {
        providerDescription = <ReadMore text={provider.description} />
      }
    }

    let enrolledNumber
    if (displayType === dataTypes.SCHOOLS || displayType === dataTypes.EARLY_EDUCATION) {
      enrolledNumber = <p><strong>Number of children enrolled:</strong> {provider.total_enrolled}</p>
    }

    return (
      <div id={provider.id} className='provider' key={provider.id}>
        <div className="provider-hero">
          <h4>{provider.name}</h4>
          {provider.distance &&
            <p className='location'>
              {provider.address} ({Number(provider.distance).toFixed(1)} km away) <span aria-hidden='true' className='show-on-map'><a href='#map' onClick={this.setLocation}>show on map</a></span>
            </p>
          }
        </div>

        {providerType}
        {providerHours}
        {providerDescription}
        {enrolledNumber}

        {provider.services && provider.services.length > 0 && provider.services.map(service => {
          return (
            <div key={`${service.id}`}>
              <h5>{this.isServiceIndentical(provider.name, service.name)}</h5>
              <ReadMore key={service.id} text={service.detail} />
            </div>
          )
        })}

        <div className='details'>
          {provider.website &&
            <p className='details-website'>
              <span className='details-title'>Website:</span>
              <a href={provider.website} target='_blank' rel='noopener noreferrer'>{provider.website}</a>
            </p>
          }
          {provider.phone &&
            <p className='details-phone'>
              <span className='details-title'>Phone:</span>
              <a href={'tel:' + provider.phone}>{provider.phone}</a>
            </p>
          }
          {provider.email &&
            <p className='details-email'>
              <span className='details-title'>Email:</span>
              <a href={'mailto:' + provider.email}>{provider.email}</a>
            </p>
          }
          {provider.contact_availability &&
            <p className='details-contact'>
              <span className='details-title'>Opening hours:</span>
              {nl2br(provider.contact_availability)}
            </p>
          }
        </div>
      </div>
    )
  }
}

Provider.propTypes = {
  provider: PropTypes.object.isRequired,
  recenterMap: PropTypes.func.isRequired,
  displayType: PropTypes.string
}

export default Provider
