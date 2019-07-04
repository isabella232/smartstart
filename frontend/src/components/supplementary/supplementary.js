import './supplementary.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import SupplementaryCard from 'components/card/supplementary-card/supplementary-card'

class Supplementary extends Component {
  render () {
    return (
      <div className='supplementary' data-test='supplementary'>
        <p>If you’re in need of support or guidance there are many different organisations and free helplines that are here to help you. Click on any of the below topics to find more information.</p>

        {this.props.cards.map((card) => {
          if (!card.elements) { card.elements = [] } // a card can be empty
          return <SupplementaryCard key={card.id} id={card.id} title={card.label} elements={card.elements} />
        })}
      </div>
    )
  }
}

Supplementary.propTypes = {
  cards: PropTypes.array.isRequired
}

export default Supplementary
