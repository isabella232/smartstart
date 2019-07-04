import React from 'react'
import PropTypes from 'prop-types'
import renderError, { hasError } from './render-error'
import renderWarning from './render-warning'

const renderField = ({ input, label, ariaLabel, placeholder, instructionText, disabled, type, meta: { touched, error, warning, form } }) => (
  <div className={`input-group ${hasError({ touched, error }) ? 'has-error' : ''}`}>
    { label && <label htmlFor={`${form}-${input.name}`}>{label}</label> }
    { instructionText && <div className="instruction-text">{instructionText}</div> }
    <div>
      <input
        id={`${form}-${input.name}`}
        {...input}
        placeholder={placeholder}
        type={type}
        autoComplete='block-autoComplete'
        aria-label={ariaLabel ? ariaLabel : null}
        aria-describedby={`${form}-${input.name}-desc`}
        onKeyDown={e => {if (e.which === 13) e.preventDefault()}}
        onWheel={e => {if (`${form}-${input.name}` === document.activeElement.id) e.preventDefault() }}
        disabled={disabled}
      />
      <div id={`${form}-${input.name}-desc`}>
        { renderError({ meta: { touched, error } }) }
        { renderWarning({ meta: { error, warning } }) }
      </div>
    </div>
  </div>
)

renderField.propTypes = {
  input: PropTypes.object,
  label: PropTypes.node,
  ariaLabel: PropTypes.string,
  instructionText: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element
  ]),
  placeholder: PropTypes.string,
  type: PropTypes.string,
  meta: PropTypes.object,
}

export default renderField
