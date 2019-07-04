import React from 'react'
import { RegisterMyBabyLandingPage } from 'components/register-my-baby/landing-page'
import { shallow, mount, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16';

configure({ adapter: new Adapter() });

let landingPage, props, dispatchMock

beforeEach(() => {
  dispatchMock = jest.fn()
  props = {
    dispatch: dispatchMock,
    isLoggedIn: false,
    hasSavedForm: false
  }
})

describe('start application buttons', () => {
  test('it displays both buttons when user not logged in', () => {
    landingPage = shallow(
      <RegisterMyBabyLandingPage {...props} />
    )

    expect(landingPage.find('.welcome-action').length).toEqual(2)
  })

  test('it displays continue button when user have saved form', () => {
    props.isLoggedIn = true
    props.hasSavedForm = true

    landingPage = mount(
      <RegisterMyBabyLandingPage {...props} />
    )

    // https://airbnb.io/enzyme/docs/guides/migration-from-2-to-3.html#element-referential-identity-is-no-longer-preserved
    // this was breaking change in enzyme 3
    expect(landingPage.find('.welcome-action').length).toEqual(2)
    expect(landingPage.find('.welcome-action').last().text()).toEqual('Continue your saved draft')
  })

  test('it displays start new when user does not have form', () => {
    props.isLoggedIn = true
    props.hasSavedForm = false

    landingPage = mount(
      <RegisterMyBabyLandingPage {...props} isLoggedIn={true}/>
    )

    expect(landingPage.find('.welcome-action').length).toEqual(2)
    expect(landingPage.find('.welcome-action').first().text()).toEqual('Start a new birth registration')
  })

})
