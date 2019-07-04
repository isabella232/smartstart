import React, { Component } from 'react'
import PropTypes from 'prop-types'
import renderError, { hasError } from './render-error'
import renderWarning from './render-warning'
import { makeMandatoryAriaLabel } from 'components/form/hoc/make-mandatory-label'

class BankAccountField extends Component {
  constructor (props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.handleBlur = this.handleBlur.bind(this)

    this.state = {
      bankCode: '',
      branchCode: '',
      body: '',
      suffix: ''
    }
  }

  UNSAFE_componentWillMount() {
    const { value } = this.props

    if (value) {
      this.parseAccount(value)
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.value && nextProps.value !== this.props.value) {
      this.parseAccount(nextProps.value)
    }
  }

  parseAccount(value) {
    this.setState({
      bankCode: value[0],
      branchCode: value[1],
      body: value[2],
      suffix: value[3]
    })
  }

  getAccountDetails() {
    const { bankCode, branchCode, body, suffix } = this.state

    return [bankCode, branchCode, body, suffix]
  }

  handleChange(e) {
    const length = e.target.maxLength;
    const next = e.target.nextSibling;
    const name = e.target.name;
    this.setState({ [name]: e.target.value }, () => {
      this.props.onChange(this.getAccountDetails())
      if(this.state[name].length === length && next) {
        next.focus();
      }
    })
  }

  /**
   * Only trigger blur event when user focus outside the bank account
   * This will help redux-form to mark the field as `touched` correctly
  */
  handleBlur(e) {
    if (
      !e.relatedTarget ||
      (
        e.relatedTarget !== this.bankCodeInput &&
        e.relatedTarget !== this.branchCodeInput &&
        e.relatedTarget !== this.bodyInput &&
        e.relatedTarget !== this.suffixInput
      )
    ) {
      this.props.onBlur(this.getAccountDetails())
    }
  }

  render () {
    const { ariaDescribedBy } = this.props;
    const {
      bankCode,
      branchCode,
      body,
      suffix
    } = this.state

    return (
        <div>
          <fieldset className="bank-account-input">
            <input
              value={bankCode || ''}
              type="text"
              name="bankCode"
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              ref={bankCodeInput => this.bankCodeInput = bankCodeInput}
              aria-describedby={ariaDescribedBy}
              aria-label={makeMandatoryAriaLabel('Enter bank code')}
              maxLength="2"
            />
            <input
              value={branchCode || ''}
              type="text"
              name="branchCode"
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              ref={branchCodeInput => this.branchCodeInput = branchCodeInput}
              aria-describedby={ariaDescribedBy}
              aria-label={makeMandatoryAriaLabel('Enter branch code')}
              maxLength="4"
            />
            <input
              value={body || ''}
              type="text"
              name="body"
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              ref={bodyInput => this.bodyInput = bodyInput}
              aria-describedby={ariaDescribedBy}
              aria-label={makeMandatoryAriaLabel('Enter body of bank account')}
              maxLength="7"
            />
            <input
              value={suffix || ''}
              type="text"
              name="suffix"
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              ref={suffixInput => this.suffixInput = suffixInput}
              aria-describedby={ariaDescribedBy}
              aria-label={makeMandatoryAriaLabel('Enter suffix of bank account')}
              maxLength="3"
            />
          </fieldset>
        </div>
    )
  }
}

BankAccountField.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
  ariaDescribedBy: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func
}


const renderBankAccount = ({ input, label, instructionText, meta: { touched, error, warning, form } }) => (

  <fieldset>
    <legend>{label}</legend>
    { instructionText && <div className="instruction-text">{instructionText}</div> }
    <div className={`input-group ${hasError({ touched, error }) ? 'has-error' : ''}`}>
      <div>
        <BankAccountField
          value={input.value || null}
          onChange={input.onChange}
          onBlur={input.onBlur}
          ariaDescribedBy={`${form}-${input.name}-desc`}
        />
        <div id={`${form}-${input.name}-desc`}>
          { renderError({ meta: { touched, error } }) }
          { renderWarning({ meta: { error, warning } }) }
        </div>
      </div>
    </div>
  </fieldset>
)

renderBankAccount.propTypes = {
  input: PropTypes.object,
  label: PropTypes.node,
  instructionText: PropTypes.string,
  meta: PropTypes.object
}

export default renderBankAccount
