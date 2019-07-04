import React from 'react'

export const makeMandatoryAriaLabel = label =>
    `${label} (required)`

/**
 * Suffix any arbitrary string with a .visuallyhidden "required" text
 */
const makeMandatoryLabel = (label, isRawHTML) =>
  <span>
    { isRawHTML ? <span dangerouslySetInnerHTML={{ __html: label }}></span> :  <span>{label}</span> }
    <span className="visuallyhidden"> (required)</span>
  </span>

export default makeMandatoryLabel
