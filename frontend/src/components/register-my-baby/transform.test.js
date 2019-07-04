import { transform } from './transform'
import keys from 'lodash/keys'
import moment from 'moment'

let dateNowSpy;
const dateStub = moment('2018-07-02').toDate().getTime()
describe('Form Data Transformation', () => {
  beforeAll(() => dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => dateStub))
  afterAll(() => dateNowSpy.mockRestore())

  describe('child stillBorn', () => {
    test('should convert child.aliveAtBirth to child.stillBorn', () => {
      let transformedData = transform({
        child: { aliveAtBirth: 'yes' }
      })
      expect(transformedData.child.stillBorn).toEqual(false)

      transformedData = transform({
        child: { aliveAtBirth: 'no' }
      })
      expect(transformedData.child.stillBorn).toEqual(true)
    })

    test('should remove child.aliveAtBirth', () => {
      let transformedData = transform({
        child: { aliveAtBirth: 'no' }
      })
      expect(keys(transformedData.child).indexOf('aliveAtBirth')).toEqual(-1)
    })
  })

  describe('child.birthOrderNumber & child.birthOrderTotal', () => {
    test('value is derived from child.multipleBirthOrder', () => {
      const transformedData = transform({
        child: {
          oneOfMultiple: 'yes',
          multipleBirthOrder: '1 of 2'
        }
      });

      expect(transformedData.child.birthOrderNumber).toEqual(1)
      expect(transformedData.child.birthOrderTotal).toEqual(2)
    })

    test('value is 0 when child.multipleBirthOrder is empty', () => {
      const transformedData = transform({
        child: {
          oneOfMultiple: 'yes',
          multipleBirthOrder: ''
        }
      });

      expect(transformedData.child.birthOrderNumber).toEqual(0)
      expect(transformedData.child.birthOrderTotal).toEqual(0)
    })

    test('should remove child.multipleBirthOrder property', () => {
      const transformedData = transform({
        child: {
          multipleBirthOrder: '1 of 2'
        }
      });

      expect(keys(transformedData.child).indexOf('multipleBirthOrder')).toEqual(-1)
    })
  })

  describe('formatting dates to yyyy-MM-dd', () => {
    test('format child.birthDate', () => {
      const transformedData = transform({
        child: {
          birthDate: moment('2017-06-23')
        }
      });

      expect(transformedData.child.birthDate).toEqual('2017-06-23')
    })

    test('format mother.dateOfBirth', () => {
      const transformedData = transform({
        mother: {
          dateOfBirth: moment('1989-06-23')
        }
      });

      expect(transformedData.mother.dateOfBirth).toEqual('1989-06-23')
    })

    test('format father.dateOfBirth', () => {
      const transformedData = transform({
        fatherKnown: 'yes',
        father: {
          dateOfBirth: moment('1989-06-23')
        }
      });

      expect(transformedData.father.dateOfBirth).toEqual('1989-06-23')
    })

    test('format siblings dateOfBirth', () => {
      const transformedData = transform({
        fatherKnown: 'yes',
        siblings: [
          { dateOfBirth: moment('2000-01-22') },
          { dateOfBirth: moment('2005-02-09') },
          { dateOfBirth: moment('2009-03-11') },
        ]
      });

      expect(transformedData.siblings[0].dateOfBirth).toEqual('2000-01-22')
      expect(transformedData.siblings[1].dateOfBirth).toEqual('2005-02-09')
      expect(transformedData.siblings[2].dateOfBirth).toEqual('2009-03-11')
    })

    test('format parentRelationshipDate', () => {
      const transformedData = transform({
        fatherKnown: 'yes',
        parentRelationship: 'marriage',
        parentRelationshipDate: moment('2000-06-23')
      });

      expect(transformedData.parentRelationshipDate).toEqual('2000-06-23')
    })
  })

  describe('transform ethnicGroups', () => {
    test('transform child\'s ethnicGroups', () => {
      const transformedData = transform({
        child: {
          ethnicGroups: ['nzEuropean', 'maori', 'other'],
          ethnicityDescription: 'foo'
        }
      })

      expect(transformedData.child.ethnicGroups).toEqual({
        nzEuropean: true,
        maori: true,
        samoan: false,
        cookIslandMaori: false,
        tongan: false,
        niuean: false,
        chinese: false,
        indian: false,
        other: 'foo'
      })
    })

    test('transform mother\'s ethnicGroups', () => {
      const transformedData = transform({
        mother: {
          ethnicGroups: ['maori'],
          ethnicityDescription: ''
        }
      })

      expect(transformedData.mother.ethnicGroups).toEqual({
        nzEuropean: false,
        maori: true,
        samoan: false,
        cookIslandMaori: false,
        tongan: false,
        niuean: false,
        chinese: false,
        indian: false,
        other: ''
      })
    })

    test('transform father\'s ethnicGroups', () => {
      const transformedData = transform({
        fatherKnown: 'yes',
        father: {
          ethnicGroups: ['other'],
          ethnicityDescription: 'foobar'
        }
      })

      expect(transformedData.father.ethnicGroups).toEqual({
        nzEuropean: false,
        maori: false,
        samoan: false,
        cookIslandMaori: false,
        tongan: false,
        niuean: false,
        chinese: false,
        indian: false,
        other: 'foobar'
      })
    })

    test('remove helper properties: ethnicityDescription', () => {
      const transformedData = transform({
        child: {
          ethnicGroups: ['nzEuropean', 'maori', 'other'],
          ethnicityDescription: 'foo'
        },
        mother: {
          ethnicGroups: ['maori'],
          ethnicityDescription: ''
        },
        father: {
          ethnicGroups: ['other'],
          ethnicityDescription: 'foobar'
        }
      })
      expect(keys(transformedData.child).indexOf('ethnicityDescription')).toEqual(-1)
      expect(keys(transformedData.mother).indexOf('ethnicityDescription')).toEqual(-1)
      expect(keys(transformedData.father).indexOf('ethnicityDescription')).toEqual(-1)
    })
  })

  describe('transform yes/no to boolean', () => {
    test('child.oneOfMultiple', () => {
      let transformedData = transform({
        child: { oneOfMultiple: 'yes' }
      })
      expect(transformedData.child.oneOfMultiple).toEqual(true)

      transformedData = transform({
        child: { oneOfMultiple: 'no' }
      })
      expect(transformedData.child.oneOfMultiple).toEqual(false)
    })
    test('mother.isCitizen', () => {
      let transformedData = transform({
        mother: { isCitizen: 'yes' }
      })
      expect(transformedData.mother.isCitizen).toEqual(true)

      transformedData = transform({
        mother: { isCitizen: 'no' }
      })
      expect(transformedData.mother.isCitizen).toEqual(false)
    })
    test('father.isCitizen', () => {
      let transformedData = transform({
        fatherKnown: 'yes',
        father: { isCitizen: 'yes' }
      })
      expect(transformedData.father.isCitizen).toEqual(true)

      transformedData = transform({
        fatherKnown: 'yes',
        father: { isCitizen: 'no' }
      })
      expect(transformedData.father.isCitizen).toEqual(false)
    })
    test('fatherKnown', () => {
      let transformedData = transform({ fatherKnown: 'yes' })
      expect(transformedData.fatherKnown).toEqual(true)
      transformedData = transform({ fatherKnown: 'no' })
      expect(transformedData.fatherKnown).toEqual(false)
    })
    test('ird.applyForNumber', () => {
      let transformedData = transform({ ird: { applyForNumber: 'yes' } })
      expect(transformedData.ird.applyForNumber).toEqual(true)
      transformedData = transform({ ird: { applyForNumber: 'no' } })
      expect(transformedData.ird.applyForNumber).toEqual(false)
    })
    test('ird.numberByEmail', () => {
      let transformedData = transform({ ird: { applyForNumber: 'yes', numberByEmail: 'yes' } })
      expect(transformedData.ird.numberByEmail).toEqual(true)
      transformedData = transform({ ird: { applyForNumber: 'yes', numberByEmail: 'no' } })
      expect(transformedData.ird.numberByEmail).toEqual(false)
    })
  })

  test('convert certificateOrder.courierDelivery to boolean', () => {
    let transformedData = transform({
      orderBirthCertificate: 'yes',
      certificateOrder: { courierDelivery: 'courier' }
    })
    expect(transformedData.certificateOrder.courierDelivery).toEqual(true)

    transformedData = transform({
      orderBirthCertificate: 'yes',
      certificateOrder: { courierDelivery: 'standard' }
    })
    expect(transformedData.certificateOrder.courierDelivery).toEqual(false)
  })


  describe('mother.nonCitizenSource', () => {
    test('when isPermanentResident = yes', () => {
      let transformedData = transform({ mother: { isPermanentResident: 'yes' } })
      expect(transformedData.mother.nonCitizenSource).toEqual('permanentResident')
    })
    test('when isNZRealmResident = yes', () => {
      let transformedData = transform({ mother: { isNZRealmResident: 'yes' } })
      expect(transformedData.mother.nonCitizenSource).toEqual('pacificIslandResident')
    })
    test('when isAuResidentOrCitizen = yes', () => {
      let transformedData = transform({ mother: { isAuResidentOrCitizen: 'yes' } })
      expect(transformedData.mother.nonCitizenSource).toEqual('australian')
    })
    test('when isPermanentResident & isNZRealmResident & isAuResidentOrCitizen are both "no"', () => {
      let transformedData = transform({
        mother: {
          isPermanentResident: 'no',
          isNZRealmResident: 'no',
          isAuResidentOrCitizen: 'no'
        }
      })
      expect(transformedData.mother.nonCitizenSource).toEqual('none')
    })
    test('remove helper properties: isPermanentResident/isNZRealmResident/isAuResidentOrCitizen', () => {
      let transformedData = transform({
        mother: {
          isPermanentResident: 'yes',
          isNZRealmResident: 'no',
          isAuResidentOrCitizen: 'no'
        }
      })
      expect(keys(transformedData.mother).indexOf('isPermanentResident')).toEqual(-1)
      expect(keys(transformedData.mother).indexOf('isNZRealmResident')).toEqual(-1)
      expect(keys(transformedData.mother).indexOf('isAuResidentOrCitizen')).toEqual(-1)
    })
    test('when mother is citizen, nonCitizenSource should be unset', () => {
      let transformedData = transform({
        mother: {
          isCitizen: 'yes',
          isPermanentResident: 'yes',
          isNZRealmResident: 'no',
          isAuResidentOrCitizen: 'no'
        }
      })
      expect(keys(transformedData.mother).indexOf('isPermanentResident')).toEqual(-1)
      expect(keys(transformedData.mother).indexOf('isNZRealmResident')).toEqual(-1)
      expect(keys(transformedData.mother).indexOf('isAuResidentOrCitizen')).toEqual(-1)
      expect(keys(transformedData.mother).indexOf('nonCitizenSource')).toEqual(-1)
    })
  })

  describe('Father known/HART', () => {
    test('assistedHumanReproduction & man consented', () => {
      let transformedData = transform({
        assistedHumanReproduction: 'yes',
        assistedHumanReproductionManConsented: true,
        assistedHumanReproductionWomanConsented: false,
        assistedHumanReproductionSpermDonor: false
      })

      expect(transformedData.fatherKnown).toEqual(true)
      expect(transformedData.assistedReproductionFemaleParents).toEqual(false)
    })
    test('assistedHumanReproduction & woman consented', () => {
      let transformedData = transform({
        assistedHumanReproduction: 'yes',
        assistedHumanReproductionManConsented: false,
        assistedHumanReproductionWomanConsented: true,
        assistedHumanReproductionSpermDonor: false
      })
      expect(transformedData.fatherKnown).toEqual(true)
      expect(transformedData.assistedReproductionFemaleParents).toEqual(true)
    })
    test('assistedHumanReproduction & sperm donor', () => {
      let transformedData = transform({
        assistedHumanReproduction: 'yes',
        assistedHumanReproductionManConsented: false,
        assistedHumanReproductionWomanConsented: false,
        assistedHumanReproductionSpermDonor: true
      })
      expect(transformedData.fatherKnown).toEqual(false)
      expect(transformedData.assistedReproductionFemaleParents).toEqual(false)
    })
    test('should convert fatherKnown to boolean when assistedHumanReproduction = no', () => {
      let transformedData = transform({
        assistedHumanReproduction: 'no',
        assistedHumanReproductionManConsented: false,
        assistedHumanReproductionWomanConsented: false,
        assistedHumanReproductionSpermDonor: true,
        fatherKnown: 'yes'
      })
      expect(transformedData.fatherKnown).toEqual(true)
    })

    test('remove helper properties', () => {
      let transformedData = transform({
        assistedHumanReproduction: 'yes',
        assistedHumanReproductionManConsented: false,
        assistedHumanReproductionWomanConsented: false,
        assistedHumanReproductionSpermDonor: true
      })
      expect(keys(transformedData).indexOf('assistedHumanReproduction')).toEqual(-1)
      expect(keys(transformedData).indexOf('assistedHumanReproductionManConsented')).toEqual(-1)
      expect(keys(transformedData).indexOf('assistedHumanReproductionWomanConsented')).toEqual(-1)
      expect(keys(transformedData).indexOf('assistedHumanReproductionSpermDonor')).toEqual(-1)
    })
  })

  describe('Certificate order', () => {
    test('remove helper property: certificateOrder.deliveryAddressType', () => {
      let transformedData = transform({
        orderBirthCertificate: 'yes',
        certificateOrder: {
          deliveryAddressType: 'mother'
        }
      })
      expect(keys(transformedData.certificateOrder).indexOf('deliveryAddressType')).toEqual(-1)
    })

    test('copy deliveryAddress.line2 to deliveryAddress.suburbTownPostcode', () => {
      let transformedData = transform({
        orderBirthCertificate: 'yes',
        certificateOrder: {
          deliveryAddress: {
            line1: 'street address',
            suburb: 'suburb name',
            line2: 'town postalcode'
          }
        }
      })
      expect(transformedData.certificateOrder.deliveryAddress.suburbTownPostcode).toEqual('town postalcode')
    })
    test('copy deliveryAddress.suburb to deliveryAddress.line2', () => {
      let transformedData = transform({
        orderBirthCertificate: 'yes',
        certificateOrder: {
          deliveryAddress: {
            line1: 'street address',
            suburb: 'suburb name',
            line2: 'town postalcode'
          }
        }
      })
      expect(transformedData.certificateOrder.deliveryAddress.line2).toEqual('suburb name')
    })
    test('should remove deliveryAddress.suburb property', () => {
      let transformedData = transform({
        orderBirthCertificate: 'yes',
        certificateOrder: {
          deliveryAddress: {
            line1: 'street address',
            suburb: 'suburb name',
            line2: 'town postalcode'
          }
        }
      })
      expect(keys(transformedData.certificateOrder.deliveryAddress).indexOf('suburb')).toEqual(-1)
    })
  })

  describe('Remove uneccessary fields', () => {
    test('remove parentSameAddress', () => {
      let transformedData = transform({ parentSameAddress: 'yes' })
      expect(keys(transformedData).indexOf('parentSameAddress')).toEqual(-1)
    })
    test('remove otherChildren', () => {
      let transformedData = transform({ otherChildren: 1 })
      expect(keys(transformedData).indexOf('otherChildren')).toEqual(-1)
    })
  })

  describe('Remove conditional fields', () => {
    describe('birthPlace', () => {
      test('when birthPlace.category is hospital, home and other must not be sent', () => {
        let transformedData = transform({
          birthPlace: {
            category: 'hospital',
            hospital: 'X',
            home: {
              line1: 'line1',
              line2: 'line2',
              suburb: 'suburb'
            },
            other: 'foo'
          }
        })
        expect(keys(transformedData.birthPlace).indexOf('home')).toEqual(-1)
        expect(keys(transformedData.birthPlace).indexOf('hospital')).toBeGreaterThan(-1)
        expect(keys(transformedData.birthPlace).indexOf('other')).toEqual(-1)
      })
      test('when birthPlace.category is home, hospital and other must not be sent', () => {
        let transformedData = transform({
          birthPlace: {
            category: 'home',
            hospital: 'X',
            home: {
              line1: 'line1',
              line2: 'line2',
              suburb: 'suburb'
            },
            other: 'foo'
          }
        })

        expect(keys(transformedData.birthPlace).indexOf('home')).toBeGreaterThan(-1)
        expect(keys(transformedData.birthPlace).indexOf('hospital')).toEqual(-1)
        expect(keys(transformedData.birthPlace).indexOf('other')).toEqual(-1)
      })
      test('when birthPlace.category is other, home and hospital must not be sent', () => {
        let transformedData = transform({
          birthPlace: {
            category: 'other',
            hospital: 'X',
            home: {
              line1: 'line1',
              line2: 'line2',
              suburb: 'suburb'
            },
            other: 'foo'
          }
        })

        expect(keys(transformedData.birthPlace).indexOf('home')).toEqual(-1)
        expect(keys(transformedData.birthPlace).indexOf('hospital')).toEqual(-1)
        expect(keys(transformedData.birthPlace).indexOf('other')).toBeGreaterThan(-1)
      })
    })


    describe('oneOfMultiple', () => {
      test('should not send birthOrderNumber & birthOrderTotal when not one of multiple', () => {
        let transformedData = transform({
          child: {
            oneOfMultiple: 'no',
            multipleBirthOrder: '1 of 2'
          }
        })
        expect(keys(transformedData.child).indexOf('birthOrderNumber')).toEqual(-1)
        expect(keys(transformedData.child).indexOf('birthOrderTotal')).toEqual(-1)
      })
    })

    describe('father', () => {
      test('must not send father when father is not known', () => {
        let transformedData = transform({
          fatherKnown: 'no',
          father: {
            firstNames: 'firstNames'
          }
        })
        expect(keys(transformedData).indexOf('father')).toEqual(-1)
      })
    })

    describe('parentRelationship', () => {
      test('must not send parentRelationshipDate & parentRelationshipPlace when relationship !== marriage && relationship !== civilUnion', () => {
        let transformedData = transform({
          fatherKnown: 'yes',
          parentRelationship: 'deFacto',
          parentRelationshipDate: moment('2017-06-23'),
          parentRelationshipPlace: 'foo',
        })
        expect(keys(transformedData).indexOf('parentRelationshipDate')).toEqual(-1)
        expect(keys(transformedData).indexOf('parentRelationshipPlace')).toEqual(-1)
      })
    })

    describe('certificateOrder', () => {
      test('must not send certificateOrder when not ordering a birth certificate', () => {
        let transformedData = transform({
          orderBirthCertificate: 'no',
          certificateOrder: {
            deliveryAddressType: 'mother'
          }
        })
        expect(keys(transformedData).indexOf('certificateOrder')).toEqual(-1)
      })
    })

    describe('ird', () => {
      test('must not send other ird fields when applyForNumber === no', () => {
        let transformedData = transform({
          ird: {
            applyForNumber: 'no',
            deliveryAddress: 'test',
            numberByEmail: 'yes',
            taxCreditIRDNumber: '123'
          }
        })
        expect(keys(transformedData).indexOf('deliveryAddress')).toEqual(-1)
        expect(keys(transformedData).indexOf('numberByEmail')).toEqual(-1)
        expect(keys(transformedData).indexOf('taxCreditIRDNumber')).toEqual(-1)
      })
    })

    describe('msd', () => {
      test('must not send other msd fields when msd.notify === false', () => {
        let transformedData = transform({
          msd: {
            notify: 'no',
            mothersClientNumber: '123',
            fathersClientNumber: '',
          }
        })
        expect(keys(transformedData).indexOf('mothersClientNumber')).toEqual(-1)
        expect(keys(transformedData).indexOf('fathersClientNumber')).toEqual(-1)
      })
    })

    describe('bestStart', () => {
      test('must convert bestStart.wanted to enum value "N" when wanted === "no"', () => {
        let transformedData = transform({
            bestStart: {
              wanted: 'no',
            }
        })
        expect(transformedData.bestStart.wanted).toEqual('N')
      })
      test('must convert bestStart.wanted to enum value "I" when pcg is when born and due before 1/7/18', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-05-01')
            }
        })
        expect(transformedData.bestStart.wanted).toEqual('I')
      })
      test('must convert bestStart.wanted to enum value "I" when pcg not NZ resident', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-07-02') },
            bestStart: {
              wanted: 'yes',
              primaryCareGiver: {
                isNewZealandResident: 'no'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('I')
      })
      test('must convert bestStart.wanted to enum value "I" when pcg under 16', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-06-02') },
            father: {
              dateOfBirth: moment('2005-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'father',
                isMSDClient: 'yes',
                isNewZealandResident: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('I')
      })
      test('must convert bestStart.wanted to enum value "Y" when pcg is 16', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-06-02') },
            father: {
              dateOfBirth: moment('2002-06-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'father',
                isMSDClient: 'yes',
                isNewZealandResident: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('Y')
      })
      test('must convert bestStart.wanted to enum value "I" when pcg not NZ tax resident', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-06-02') },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                isTaxResident: 'no',
                hasLivedInNZForTwelveMonths: 'no',
                taxResidentWhenBestStartStarts: 'no',
                isChildResident: 'no'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('I')
      })
      test('must only keep ineligible fields when bestStart.wanted equals "I"', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-06-02') },
            mother: {
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              },
              isNewZealandResident: 'no'
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                firstNames: 'Jane',
                surname: 'Smith',
                daytimePhone: '111111',
                homeAddress: {
                  cityTown: 'Wellington',
                  postCode: '6011',
                  streetAddress: '150 Willis Street',
                  suburb: 'Te Aro'
                },
                isMSDClient: 'no',
                isApplyingForPaidParentalLeave: 'no',
                isGettingWorkingForFamilies: 'no',
                isNewZealandResident: 'no',
                isTaxResident: 'yes',
                type: 'mother',
                hasPartner: 'yes',
                partner: {
                  firstNames: 'John',
                  surname: 'Smith',
                  irdNumber: '111111111'
                },
                isSharingCare: 'no',
                irdNumber: '11111',
                bankAccount: '1111111',
                declarationAccepted: false
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('I')
        expect(keys(transformedData.bestStart).indexOf('expectedDueDate')).toEqual(1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isNewZealandResident')).toEqual(0)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isTaxResident')).toEqual(1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('type')).toEqual(2)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('firstNames')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('surname')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('daytimePhone')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('homeAddress')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isMSDClient')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isApplyingForPaidParentalLeave')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isGettingWorkingForFamilies')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('hasPartner')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('partner')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isSharingCare')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('irdNumber')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('bankAccount')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('declarationAccepted')).toEqual(-1)
      })

      test('must convert bestStart.wanted to enum value "Y" when pcg is eligible', () => {
        let transformedData = transform({
            child: { birthDate: ('2018-07-23') },
            mother: {
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isTaxResident: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('Y')
      })
      test('must convert bestStart.wanted to enum value "Y" when pcg is msd client', () => {
        let transformedData = transform({
            child: { birthDate: ('2018-07-23') },
            mother: {
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isMSDClient: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('Y')
      })
      test('must convert bestStart.wanted to enum value "Y" when pcg is WFF', () => {
        let transformedData = transform({
            child: { birthDate: ('2018-07-23') },
            mother: {
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isGettingWorkingForFamilies: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.wanted).toEqual('Y')
      })
      test('Converts yes/no fields to booleans', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isMSDClient: 'no',
                isGettingWorkingForFamilies: 'no',
                hasPartner: 'no',
                isTaxResident: 'yes',
                isApplyingForPaidParentalLeave: 'no',
                isSharingCare: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.primaryCareGiver.isNewZealandResident).toEqual(true)
        expect(transformedData.bestStart.primaryCareGiver.isMSDClient).toEqual(false)
        expect(transformedData.bestStart.primaryCareGiver.isGettingWorkingForFamilies).toEqual(false)
        expect(transformedData.bestStart.primaryCareGiver.hasPartner).toEqual(false)
        expect(transformedData.bestStart.primaryCareGiver.isTaxResident).toEqual(true)
        expect(transformedData.bestStart.primaryCareGiver.isApplyingForPaidParentalLeave).toEqual(false)
        expect(transformedData.bestStart.primaryCareGiver.isSharingCare).toEqual(true)
      })
      test('Converts bank account to right format', () => {
        // DIA format for bank accounts is XX-XXXX-XXXXXXXX-XXXX (2-4-8-4)
        let transformedData = transform({
          child: { birthDate: moment('2018-04-23') },
          mother: {
            firstNames: 'Jane',
            surname: 'Smith',
            dateOfBirth: moment('1984-07-12'),
            homeAddress: {
              line1: '150 Willis Street',
              line2: 'Wellington 6011',
              suburb: 'Te Aro'
            }
          },
          bestStart: {
            wanted: 'yes',
            expectedDueDate: moment('2018-07-02'),
            primaryCareGiver: {
              type: 'mother',
              isNewZealandResident: 'yes',
              isTaxResident: 'yes',
              bankAccount: {
                number: ['11','3456','0089765','00']
              }
            }
          }
       })
       expect(transformedData.bestStart.primaryCareGiver.bankAccount.number).toEqual('11-3456-00089765-0000')
      })
      test('Update dates', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                isNewZealandResident: 'yes',
                isTaxResident: 'yes',
                type: 'mother'
              }
            }
        })
        expect(transformedData.bestStart.expectedDueDate).toEqual('2018-07-02')
      })
      test('Add details to PCG from parents details', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                isNewZealandResident: 'yes',
                isTaxResident: 'yes',
                type: 'mother'
              }
            }
        })
        expect(transformedData.bestStart.primaryCareGiver.firstNames).toEqual('Jane')
        expect(transformedData.bestStart.primaryCareGiver.surname).toEqual('Smith')
        expect(transformedData.bestStart.primaryCareGiver.homeAddress.streetAddress).toEqual('150 Willis Street')
        expect(transformedData.bestStart.primaryCareGiver.homeAddress.suburb).toEqual('Te Aro')
        expect(transformedData.bestStart.primaryCareGiver.homeAddress.cityTown).toEqual('Wellington')
        expect(transformedData.bestStart.primaryCareGiver.homeAddress.postCode).toEqual('6011')
      })
      test('Remove partner information when hasPartner is no', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                hasPartner: 'no',
                partner: {
                  firstNames: 'John',
                  surname: 'Smith',
                  irdNumber: '111111111'
                }
              }
            }
        })
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('partner')).toEqual(-1)
      })
      test('Remove care sharer information when isSharingCare is no', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isSharingCare: 'no',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                }
              }
            }
        })
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('careSharer')).toEqual(-1)
      })
      test('Remove form information when Best Start is not wanted', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'no',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isSharingCare: 'yes',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                }
              }
            }
        })
        expect(keys(transformedData.bestStart).indexOf('primaryCareGiver')).toEqual(-1)
        expect(keys(transformedData.bestStart).indexOf('expectedDueDate')).toEqual(-1)
      })
      test('must convert bestStart.primaryCareGiver.isTaxResident to true when child is resident', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-06-02') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              dateOfBirth: '1984-07-12',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isTaxResident: 'no',
                hasLivedInNZForTwelveMonths: 'no',
                taxResidentWhenBestStartStarts: 'no',
                isChildResident: 'yes'
              }
            },
        })
        expect(transformedData.bestStart.primaryCareGiver.isTaxResident).toEqual(true)
      })
      test('must convert bestStart.primaryCareGiver.isTaxResident to true when tax residency eligble', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-06-02') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              dateOfBirth: '1984-07-12',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isTaxResident: 'no',
                hasLivedInNZForTwelveMonths: 'yes',
                taxResidentWhenBestStartStarts: 'yes',
                isChildResident: 'no'
              }
            },
        })
        expect(transformedData.bestStart.primaryCareGiver.isTaxResident).toEqual(true)
      })
      test('Update values when PCG unknown', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'unknown',
                isSharingCare: 'yes',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                }
              }
            }
        })
        expect(transformedData.bestStart.wanted).toEqual('I')
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isSharingCare')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('careSharer')).toEqual(-1)
      })
      test('Remove form information when PCG is other', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'other',
                isNewZealandResident: 'yes',
                isTaxResident: 'yes',
                isSharingCare: 'yes',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                },
                hasPartner: 'no',
                isApplyingForPaidParentalLeave: 'yes',
                firstNames: 'Jane',
                surname: 'Smith',
                daytimePhone: '748397694'
              }
            }
        })
        expect(transformedData.bestStart.primaryCareGiver.firstNames).toEqual('Jane')
        expect(transformedData.bestStart.primaryCareGiver.surname).toEqual('Smith')
        expect(transformedData.bestStart.primaryCareGiver.daytimePhone).toEqual('748397694')
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isSharingCare')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('careSharer')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('hasPartner')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isApplyingForPaidParentalLeave')).toEqual(-1)
      })
      test('Remove form information when PCG is an MSD client', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isTaxResident: 'yes',
                isMSDClient: 'yes',
                isSharingCare: 'yes',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                },
                hasPartner: 'no',
                isApplyingForPaidParentalLeave: 'yes'
              }
            }
        })
        expect(transformedData.bestStart.primaryCareGiver.isMSDClient).toEqual(true)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isSharingCare')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('careSharer')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('hasPartner')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('isApplyingForPaidParentalLeave')).toEqual(-1)
      })
      test('Remove form information when PCG is receiving working for families', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            mother: {
              firstNames: 'Jane',
              surname: 'Smith',
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'mother',
                isNewZealandResident: 'yes',
                isTaxResident: 'yes',
                isMSDClient: 'no',
                isGettingWorkingForFamilies: 'yes',
                isSharingCare: 'no',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                },
                hasPartner: 'no',
                partner: {
                  firstNames: 'John',
                  surname: 'Smith',
                  irdNumber: '554364767'
                },
                isApplyingForPaidParentalLeave: 'yes'
              }
            }
        })
        expect(transformedData.bestStart.primaryCareGiver.isMSDClient).toEqual(false)
        expect(transformedData.bestStart.primaryCareGiver.isGettingWorkingForFamilies).toEqual(true)
        expect(transformedData.bestStart.primaryCareGiver.isSharingCare).toEqual(false)
        expect(transformedData.bestStart.primaryCareGiver.isApplyingForPaidParentalLeave).toEqual(true)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('careSharer')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('hasPartner')).toEqual(-1)
        expect(keys(transformedData.bestStart.primaryCareGiver).indexOf('partner')).toEqual(-1)
      })
      test('Updates pcg type to otherParent when father', () => {
        let transformedData = transform({
            child: { birthDate: moment('2018-04-23') },
            father: {
              firstNames: 'John',
              surname: 'Smith',
              dateOfBirth: moment('1984-07-12'),
              homeAddress: {
                line1: '150 Willis Street',
                line2: 'Wellington 6011',
                suburb: 'Te Aro'
              }
            },
            bestStart: {
              wanted: 'yes',
              expectedDueDate: moment('2018-07-02'),
              primaryCareGiver: {
                type: 'father',
                isNewZealandResident: 'yes',
                isTaxResident: 'yes',
                isSharingCare: 'yes',
                careSharer: {
                  firstNames: 'John',
                  surname: 'Smith',
                  daytimePhone: '554364767'
                },
                hasPartner: 'no',
                isApplyingForPaidParentalLeave: 'yes',
                firstNames: 'John',
                surname: 'Smith',
                daytimePhone: '748397694'
              }
            }
        })
        expect(transformedData.bestStart.primaryCareGiver.type).toEqual('otherParent')

      })
    })
  })
})
