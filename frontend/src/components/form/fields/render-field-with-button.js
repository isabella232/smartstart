import React from 'react'
import PropTypes from 'prop-types'
import renderError, { hasError } from './render-error'
import renderWarning from './render-warning'
import './render-field-with-button.scss'

class renderFieldWithButton extends React.Component {
    constructor(props) {
      super(props)

      this.state = {
        newValue: props.input.value
      }
    }

    handleChange(e) {
      this.setState({ newValue: e.target.value })
    }

    render() {
      const { input: { name, onChange }, label, ariaLabel, placeholder, instructionText, type, maxLength,
      buttonLabel, meta: { touched, error, warning, form } } = this.props
      return (
        <div className={`input-group ${hasError({ touched, error }) ? 'has-error' : ''}`}>
          { label && <label htmlFor={`${form}-${name}`}>{label}</label> }
          { instructionText && <div className="instruction-text">{instructionText}</div> }
          <div>
            <div className="field-wrapper">
              <input
                id={`${form}-${name}`}
                placeholder={placeholder}
                type={type}
                autoComplete='block-autoComplete'
                aria-label={ariaLabel ? ariaLabel : null}
                aria-describedby={`${form}-${name}-desc`}
                onKeyDown={e => {if (e.which === 13) e.preventDefault()}}
                onWheel={e => {if (`${form}-${name}` === document.activeElement.id) e.preventDefault() }}
                style={{ flex: 1 }}
                value={this.state.newValue}
                onChange={this.handleChange.bind(this)}
                maxLength={maxLength}
                />
              <button
                id={`${form}-${name}-trigger`}
                type="button"
                onClick={() => {
                   // NOTE: not sure why it has to be async in order to trigger async validation
                   // need to review it at later stage
                   setTimeout(() => onChange(this.state.newValue), 0)
                }}>{buttonLabel}</button>
            </div>
            <div id={`${form}-${name}-desc`}>
              { renderError({ meta: { touched, error } }) }
              { renderWarning({ meta: { error, warning } }) }
            </div>
          </div>
        </div>
      )
    }
}

renderFieldWithButton.propTypes = {
  input: PropTypes.object,
  label: PropTypes.node,
  ariaLabel: PropTypes.string,
  instructionText: PropTypes.string,
  placeholder: PropTypes.string,
  type: PropTypes.string,
  buttonLabel: PropTypes.string,
  maxLength: PropTypes.number,
  meta: PropTypes.object,
}

export default renderFieldWithButton
