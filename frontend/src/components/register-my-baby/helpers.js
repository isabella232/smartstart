export const getSecondParentTitle = (assistedHumanReproductionWomanConsented, assistedHumanReproductionManConsented, secondParentPreferedTitle, fatherKnown) => {
  if (assistedHumanReproductionWomanConsented) {
    return secondParentPreferedTitle === 'mother' ? 'mother' : 'parent'
  } else {
    return fatherKnown === 'yes' || assistedHumanReproductionManConsented ? 'father' : 'other parent'
  }
}

export const translateToMaori = text => {
  switch (text) {
    case 'mother':
      return 'whaea'
    case 'father':
    case 'parent':
      return 'matua'
    case 'other parent':
      return 'tētahi atu matua'
    default:
      return null
  }
}
