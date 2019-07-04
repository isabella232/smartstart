import React from 'react'
import { PrimaryLogin } from 'components/primary-login/primary-login'
import Adapter from 'enzyme-adapter-react-16'
import { shallow, configure } from 'enzyme'

let primaryLogin, props

configure({ adapter: new Adapter() });

beforeEach(() => {
  props = {
    isLoggedIn: false,
    afterLoginAction: null,
    dispatch: jest.fn()
  }
})

describe('RealMe help text', () => {
  beforeEach(() => {
    primaryLogin = shallow(
      <PrimaryLogin {...props} />
    )
  })

  test('it displays closed RealMe help accordion on init', () => {
    expect(primaryLogin.find('.concertina').text()).toEqual('What is RealMe? - expand this content')
  })

  test('it opens RealMe help accordion on click', () => {
    primaryLogin.find('.concertina').simulate('click')

    expect(primaryLogin.find('.concertina').text()).toEqual('What is RealMe? - collapse this content')
  })

  test('it closes RealMe help accordion on click', () => {
    primaryLogin.setState({ concertinaVerb: 'collapse', realmeHelpShown: true })

    primaryLogin.find('.concertina').simulate('click')

    expect(primaryLogin.find('.concertina').text()).toEqual('What is RealMe? - expand this content')
  })

})
