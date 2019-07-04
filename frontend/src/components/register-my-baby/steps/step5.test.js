import React from 'react'
import Step5Connected from 'components/register-my-baby/steps/step5'
import { mount, configure } from 'enzyme'
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Adapter from 'enzyme-adapter-react-16';
import { Provider } from 'react-redux'

configure({ adapter: new Adapter() });

const mockStore = configureStore([thunk]);
let mountedComponent, props


props = {
  dispatch: jest.fn(),
  initialValues: {
    isLoggedIn: true,
    maxStep: 6
  },
  onSubmit: jest.fn(),
  onPrevious: jest.fn(),
  isReviewing: false,
  onComebackToReview: jest.fn(),
  handleSubmit: jest.fn(),
  submitting: false,
  pristine: true
}

// NOTE: we are testing connected tab component
// to test, we are mocking certain store state and verify if
// correct fields are displayed on a form
// TODO: It could be a good idea to reuse store state, rather than initiate it
// from scratch all the time

describe('bestStart application', () => {
  describe('best start main logic', () => {
    test('it should ask if applicant want bestStart', () => {
      const store = mockStore({ form: { registration: { values: { } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.wanted').length).toBe(2)
    })
    test('it should display bestStart accordion', () => {
      const store = mockStore({ form: { registration: { values: { } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.findWhere(n => n.name() === 'Accordion').length).toBe(1)
    })
    test('it should show IRD/MSD questions if best start not wanted', () => {
      const store = mockStore({ form: { registration: { values: { bestStart: { wanted: 'no' } } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.applyForNumber').length).toBe(2)
      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.notify').length).toBe(2)
    })
    test('it should ask for PCG type if bestStart wanted', () => {
      const store = mockStore({ form: { registration: { values: { bestStart: { wanted: 'yes' } } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.type').length).toBe(2)
    })
    describe('expected due date', () => {
      test('it should display EDD if birthday before 1 July', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: { wanted: 'yes' },
          child: { birthDate: '2018-06-30' }
        } } } })
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.expectedDueDate').length).toBe(2)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.expectedDueDateWarning').length).toBe(2)
      })
      test('it should hide EDD if birthday after 1st of July', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: { wanted: 'yes' },
          child: { birthDate: '2018-07-01' }
        } } } })
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.expectedDueDate').length).toBe(0)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.expectedDueDateWarning').length).toBe(0)
      })
    })

    describe('PCG question', () => {
      test('it should display 4 options', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: { wanted: 'yes' },
          child: { birthDate: '2018-06-30' }
        } } } })
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        const optionNodes = mountedComponent.findWhere(n => n.name() === 'input' && n.prop('name').includes('primaryCareGiver.type'))
        expect(optionNodes.length).toBe(4)
        expect(optionNodes.find('[value="mother"]').length).toBe(1)
        expect(optionNodes.find('[value="father"]').length).toBe(1)
        expect(optionNodes.find('[value="other"]').length).toBe(1)
        expect(optionNodes.find('[value="unknown"]').length).toBe(1)
      })
      test('it should hide father when father is unknown', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: { wanted: 'yes' },
          child: { birthDate: '2018-06-30' },
          fatherKnown: 'no'
        } } } })
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        const optionNodes = mountedComponent.findWhere(n => n.name() === 'input' && n.prop('name').includes('primaryCareGiver.type'))
        expect(optionNodes.find('[value="father"]').length).toBe(0)
      })
      test('it should display contact fields when other', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: { wanted: 'yes', primaryCareGiver: { type: 'other'} },
          child: { birthDate: '2018-06-30' }
        } } } })
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.firstNames').length).toBe(2)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.surname').length).toBe(2)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.daytimePhone').length).toBe(2)

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.applyForNumber').length).toBe(2)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.notify').length).toBe(2)
      })
    })

    describe('msd questions', () => {
      test('it should ask if msd client', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: { wanted: 'yes', primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes'} },
          child: { birthDate: '2018-06-30' }
          } } },
          birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
        } )
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.isMSDClient').length).toBe(2)
      })
      test('it should display msd questions if msd client', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: {
            wanted: 'yes',
            primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'yes'}
          },
          child: { birthDate: '2018-06-30' }
          } } },
          birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
        } )
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.notify').length).toBe(2)
      })
      test('it should ask if is getting WFF when not MSD client', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: {
            wanted: 'yes',
            primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no' }
          },
          child: { birthDate: '2018-06-30' }
          } } },
          birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
        } )
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.isGettingWorkingForFamilies').length).toBe(2)
      })
    })

    describe('working for families clients', () => {
      test('it should ask WFF questions if is getting WFF', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: {
            wanted: 'yes',
            primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'yes' }
          },
          child: { birthDate: '2018-06-30' }
          } } },
          birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
        } )
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.irdNumber').length).toBe(2)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.deliveryAddress').length).toBe(2)
        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.declarationAccepted').length).toBe(2)
      })
      test('it should sharing care questions should have WFF prop passed in', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: {
            wanted: 'yes',
            primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'yes' }
          },
          child: { birthDate: '2018-06-30' }
          } } },
          birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
        } )
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      const sharingCareComponent = mountedComponent.findWhere(n => n.name() === 'SharingCareQuestions')
        expect(sharingCareComponent.prop('wfftcForm')).toBe(true)
      })
      test('it should show apply for IRD if applicant not an WFF client', () => {
        const store = mockStore({ form: { registration: { values: {
          bestStart: {
            wanted: 'yes',
            primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
              isTaxResident: 'no', isChildResident: 'no', hasLivedInNZForTwelveMonths: 'no', taxResidentWhenBestStartStarts: 'no'
            }
          },
          child: { birthDate: '2018-06-30' }
        } } } })
        mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

        expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.applyForNumber').length).toBe(2)
      })
    })

    test('it should show apply for IRD if applicant MSD client', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'yes' }
        },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.applyForNumber').length).toBe(2)
    })
  })

  describe('notify MSD questions correctly', () => {
    test('it should ask msd number question if mcd client', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: { type: 'mother', isNewZealandResident: 'no' }
        },
        msd: { notify: true },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.notify').length).toBe(2)
      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.mothersClientNumber').length).toBe(2)
      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.fathersClientNumber').length).toBe(2)
    })
  })

  describe('apply for IRD number questions', () => {
    test('it should display delivery address with instructions when MSD client', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'yes' }
        },
        ird: { applyForNumber: 'yes' },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      const deliveryQuestion = mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.deliveryAddress')
      expect(deliveryQuestion.length).toBe(2)
      expect(deliveryQuestion.find('.instruction-text').length).toBe(1)
    })
    test('it should display delivery address without instructions when not applying for Best Start', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: { wanted: 'no' },
        ird: { applyForNumber: 'yes' },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      const deliveryQuestion = mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.deliveryAddress')
      expect(deliveryQuestion.length).toBe(2)
      expect(deliveryQuestion.find('.instruction-text').length).toBe(0)
    })
    test('it should display delivery address if client is not eligible for best start but applies for number', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: { wanted: 'yes', primaryCareGiver: { type: 'unknown' }},
        ird: { applyForNumber: 'yes' },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      const deliveryQuestion = mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.deliveryAddress')
      expect(deliveryQuestion.length).toBe(2)
      expect(deliveryQuestion.find('.instruction-text').length).toBe(0)
    })
    test('it should display number by email if delivery address selected', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: { wanted: 'no' },
        ird: { applyForNumber: 'yes', deliveryAddress: 'Test' },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.numberByEmail').length).toBe(2)
    })
    test('it should display info alert if applicant answers yes to email option', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: { wanted: 'no' },
        ird: { applyForNumber: 'yes', deliveryAddress: 'Test', numberByEmail: 'yes' },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.numberByEmail').length).toBe(2)
    })
    test('it should display tax credit question', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'yes' }
        },
        ird: { applyForNumber: 'yes' },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.taxCreditIRDNumber').length).toBe(2)
    })
    test('it should display msd questions if haven\'t answer msd question yes', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: { wanted: 'no' },
        ird: { applyForNumber: 'yes' },
        child: { birthDate: '2018-06-30' }
      } } } })
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'msd.notify').length).toBe(2)
    })
  })

  describe('should render best start new client questions', () => {
    test('it should ask IRD number', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes'
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.irdNumber').length).toBe(2)
    })
    test('it should ask bank account details', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes'
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name').includes('bestStart.primaryCareGiver.bankAccount')).length).toBe(8)
    })
    test('it should ask credit union ref if client ticked related checkbox', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes',
            bankAccount: { creditUnion: true }
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name').includes('creditUnionReferenceNumber')).length).toBe(2)
    })
    test('it should display lump sum alert if payment frequency B', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes',
            bankAccount: { paymentFrequency: 'B' }
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('.lump-sum-alert').length).toBe(1)
    })
    test('it should ask IRD delivery question', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes',
            bankAccount: { paymentFrequency: 'B' }
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.deliveryAddress').length).toBe(2)
    })
    test('it should ask ird by email question if delivery address provided', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes',
          }
        },
        ird: { deliveryAddress: 'Test' },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'ird.numberByEmail').length).toBe(2)
    })
    test('it should display declaration checkbox', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no',
            isTaxResident: 'yes', isSharingCare: 'yes', hasPartner: 'yes', isApplyingForPaidParentalLeave: 'yes',
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.declarationAccepted').length).toBe(2)
    })
  })

  describe('display tax residency questions', () => {
    test('it should ask tax residency question', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: { type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no', isGettingWorkingForFamilies: 'no' }
        },
        child: { birthDate: '2018-06-30' },
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.isTaxResident').length).toBe(2)
    })
    test('it should display warning if not tax resident', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'no', isTaxResident: 'no'
          }
        },
        child: { birthDate: '2018-06-30' },
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.taxResidentWarning').length).toBe(2)
    })
    test('it should ask about child residency if not tax resident', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'no', isTaxResident: 'no' }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.isChildResident').length).toBe(2)
    })
    test('it should ask alternative tax residency questions if neither applicant or child are tax residents ', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'no', isTaxResident: 'no', isChildResident: 'no'
          }
        },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.hasLivedInNZForTwelveMonths').length).toBe(2)
      expect(mountedComponent.find('Field').filterWhere(n => n.prop('name') === 'bestStart.primaryCareGiver.taxResidentWhenBestStartStarts').length).toBe(2)
    })
    test('it should ask sharing care questions if tax resident', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'no', isTaxResident: 'yes'
          }
        },
        ird: { deliveryAddress: 'test' },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.findWhere(n => n.name() === 'SharingCareQuestions').length).toBe(1)
    })
    test('it should ask sharing care questions if child is tax resident', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'no', isTaxResident: 'no', isChildResident: 'yes'
          }
        },
        ird: { deliveryAddress: 'test' },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.findWhere(n => n.name() === 'SharingCareQuestions').length).toBe(1)
    })
    test('it should ask sharing care questions if tax resident', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'yes', isTaxResident: 'no', isChildResident: 'no',
            bstcLivedInNZ: 'yes', bstxTaxResidentWhenStarts: 'yes'
          }
        },
        ird: { deliveryAddress: 'test' },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.findWhere(n => n.name() === 'SharingCareQuestions').length).toBe(1)
    })
    test('it should don\'t ask sharing care questions if not tax resident', () => {
      const store = mockStore({ form: { registration: { values: {
        bestStart: {
          wanted: 'yes',
          primaryCareGiver: {
            type: 'mother', isNewZealandResident: 'yes', isMSDClient: 'no',
            isGettingWorkingForFamilies: 'yes', isTaxResident: 'no', isChildResident: 'no',
            bstcLivedInNZ: 'yes', bstxTaxResidentWhenStarts: 'no'
          }
        },
        ird: { deliveryAddress: 'test' },
        child: { birthDate: '2018-06-30' }
        } } },
        birthRegistration: { savedRegistrationForm: { data: { mother: { dateOfBirth: '2000-06-30'}}}}
      } )
      mountedComponent = mount( <Provider store={store}><Step5Connected {...props} /></Provider> )

      expect(mountedComponent.findWhere(n => n.name() === 'SharingCareQuestions').length).toBe(1)
    })
  })
})
