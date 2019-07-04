import './baby-names.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { IndexLink } from 'react-router'
import classNames from 'classnames'
import BubbleChart from 'components/baby-names/bubble-chart/bubble-chart'
import nameData from 'components/baby-names/baby-name-data'
import nameDataMaori from 'components/baby-names/baby-name-data-maori'
import { piwikTrackPost } from 'actions/application'

class BabyNames extends Component {
  constructor (props) {
    super(props)

    this.state = {
      data: nameData,
      category: 'girls',
      year: '2017',
      language: 'english'
    }

    this.setCategory = this.setCategory.bind(this)
    this.setLanguage = this.setLanguage.bind(this)
    this.setYear = this.setYear.bind(this)
    this.categorySelected = this.categorySelected.bind(this)
    this.setParams = this.setParams.bind(this)
    this.applyMaoriSettings = this.applyMaoriSettings.bind(this)
  }

  componentDidMount () {
    if (window.location.pathname === '/news/baby-names-maori') {
      this.setLanguage('maori')
    }
  }

  setCategory (value) {
    this.setState({
      category: value
    })
  }

  setLanguage (value) {
    this.setState({
      language: value,
      data: value === 'maori' ? nameDataMaori : nameData,
    }, this.applyMaoriSettings)

    const piwikEvent = {
      'category': 'Top baby names',
      'action': 'Click tab',
      'name': value === 'maori' ? 'Top Māori Names' : 'Top Names'
    }

    this.props.dispatch(piwikTrackPost('Top baby names', piwikEvent))

  }

  applyMaoriSettings () {
    this.setYear()
    this.setParams()
  }

  setYear () {
    this.setState({
      year: this.yearPicker.value
    })
  }

  categorySelected (value) {
    return this.state.category === value ? 'selected' : ''
  }

  languageSelected (value) {
    return this.state.language === value ? 'selected' : ''
  }

  setParams () {
    let params = this.state.language === 'maori' ? '-maori' : ''
    // pushState() takes three parameters: a state object, a title describing state, and a URL. https://developer.mozilla.org/en-US/docs/Web/API/History_API#Example_of_pushState()_method
    window.history.pushState('', 'Change Page Language', `/news/baby-names${params}`);
  }

  render () {
    let yearOptions = []

    for (let year in this.state.data[this.state.category]) {
      yearOptions.unshift(<option key={year} value={year}>{year}</option>)
    }

    let maoriContentClasses = classNames(
      'feature-page-content',
      { 'hidden': this.state.language !== 'maori' }
    )
    let englishContentClasses = classNames(
      'feature-page-content',
      { 'hidden': this.state.language !== 'english' }
    )
    let headerClasses = classNames (
      'baby-names-header-title',
      { 'maori-header': this.state.language === 'maori' },
      { 'english-header': this.state.language === 'english' }
    )

    return (
      <div>
        <div className='baby-names-header'>
          <h2 className={headerClasses}><span className='visuallyhidden'>New Zealand baby names 2017</span></h2>
          <div className='baby-names-toggle'>
            <button onClick={() => this.setLanguage('maori')} className={this.languageSelected('maori')}>Top Māori Names</button>
            <button onClick={() => this.setLanguage('english')} className={this.languageSelected('english')}>Top Names</button>
          </div>

          <div className='feature-page-content gender-selection'>
            <span className='visuallyhidden'>Select boys or girls names</span>
            <div className='bubble-chart-category'>
              <button onClick={() => this.setCategory('girls')} className={this.categorySelected('girls')}>
                {this.state.language === 'maori' ? 'Kōtiro' : 'Girls' }
              </button>
              <button onClick={() => this.setCategory('boys')} className={this.categorySelected('boys')}>
                {this.state.language === 'maori' ? 'Tama' : 'Boys' }
              </button>
            </div>
            <div>
              <label>
                <span className='visuallyhidden'>Select which year to see the top 10 for</span>
                <select ref={(ref) => { this.yearPicker = ref }} className='bubble-chart-year' onChange={this.setYear}>
                  {yearOptions}
                </select>
              </label>
            </div>
          </div>

          <div className='feature-page-content bubble-chart-container-wrapper'>
            <BubbleChart data={this.state.data} category={this.state.category} year={this.state.year} />
          </div>
        </div>
        <div className={englishContentClasses}>
          <h3>Top Names</h3>
          <h4 className='introtext'>The top baby names of 2018 have been released with Charlotte and Oliver topping the list.</h4>

          <p>Charlotte and Oliver remain New Zealand’s most popular baby names, taking the top spots once again for 2018. Mia and Nikau are the most loved Māori names, overseas and here in New Zealand.</p>

          <p>Charlotte and Oliver have both been ranked highly for the past few years, with Charlotte in second in 2016, and Oliver remaining number one since 2013.
            Oliver’s female counterpart, Olivia, has been in close competition with Charlotte since 2011, with the two swapping first and second place many times since then.
            Jack and Isla were following close behind this year.</p>

          <p>The top Māori baby names were calculated and researched in partnership with the Te Taura Whiri i te Reo Māori, the Māori Language Commission. Nikau has topped the list for the last few years, while Mia is new to the top 10.</p>

          <p>Registering your baby is free, and it’s an important step for all parents. Registration gives children their legal identity and the rights, responsibilities and access to support services associated with being a New Zealander.</p>

          <blockquote>The top 100 names make up only a small proportion of all names given to babies, with over 18,000 unique first names registered for children born in 2018.</blockquote>
        </div>

        <div className={maoriContentClasses}>
          <h3>Top Names</h3>
          <h4 className='introtext'>The top baby names of 2018 have been released with Charlotte and Oliver topping the list.</h4>

          <p>Charlotte and Oliver remain New Zealand’s most popular baby names, taking the top spots once again for 2018. Mia and Nikau are the most loved Māori names, overseas and here in New Zealand.</p>

          <p>Charlotte and Oliver have both been ranked highly for the past few years, with Charlotte in second in 2016, and Oliver remaining number one since 2013.
            Oliver’s female counterpart, Olivia, has been in close competition with Charlotte since 2011, with the two swapping first and second place many times since then.
            Jack and Isla were following close behind this year.</p>

          <p>The top Māori baby names were calculated and researched in partnership with the Te Taura Whiri i te Reo Māori, the Māori Language Commission. Nikau has topped the list for the last few years, while Mia is new to the top 10.</p>

          <p>Registering your baby is free, and it’s an important step for all parents. Registration gives children their legal identity and the rights, responsibilities and access to support services associated with being a New Zealander.</p>

          <blockquote>The top 100 names make up only a small proportion of all names given to babies, with over 18,000 unique first names registered for children born in 2018.</blockquote>
        </div>

        <div className='feature-page-content'>
          <p>Having a baby can be a busy time for new and expectant parents, and it can be hard to keep track of everything you need to do - that’s where SmartStart can help.</p>

          <p><IndexLink to={'/'}>Find step-by-step information and use services on SmartStart</IndexLink></p>

          <h5>Top baby names</h5>
          <ul>
            <li><a href='/assets/files/Top-100-girls-names.pdf'>Top 100 girls’ names (pdf 58kb)</a></li>
            <li><a href='/assets/files/Top-100-boys-names.pdf'>Top 100 boys’ names (pdf 57kb)</a></li>
            <li><a href='/assets/files/Top-100-girls-and-boys-names-since-1954.xlsx'>Top 100 girls’ and boys’ names since 1954 (xlsx 268kb)</a></li>
            <li><a href='https://catalogue.data.govt.nz/dataset/top-baby-names-of-all-time' target="_blank" rel="noreferrer noopener">Top names since records began in 1848</a></li>
          </ul>
        </div>
      </div>
    )
  }
}

BabyNames.propTypes = {
  dispatch: PropTypes.func
}

export default connect(() => ({}))(BabyNames)
