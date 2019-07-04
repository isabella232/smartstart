import 'index.scss'

import React from 'react'
import PropTypes from 'prop-types'
import { Router, Route, IndexRoute, IndexRedirect, browserHistory } from 'react-router'
import { Provider } from 'react-redux'
import Spinner from 'components/spinner/spinner'
import Loadable from 'react-loadable'

// Sync routes
import Container from 'containers/container'
import Main from 'layouts/main/main'
import MetadataPage from 'layouts/metadata-page/metadata-page'
import FeaturePage from 'layouts/feature-page/feature-page'
import BirthRegistrationPage from 'layouts/birth-registration-page/birth-registration-page'
import ServicesPage from 'layouts/services/services'
import SupportPage from 'layouts/support/support'
import EntitlementsPage from 'layouts/entitlements/entitlements'
import EntitlementsLandingPage from 'components/entitlements/landing-page'
import EntitlementsQuestions from 'components/entitlements/questions-index'
import EntitlementsResults from 'components/entitlements/results'
import RegisterMyBabyLandingPage from 'components/register-my-baby/landing-page'
import OnlineSafetyPage from 'layouts/online-safety-page/online-safety-page'
import RegisterMyBaby from 'components/register-my-baby'
import RegisterMyBabyConfirmation from 'components/register-my-baby/confirmation-page-no-birth-certificate-order'
import RegisterMyBabyConfirmationPaymentSuccess from 'components/register-my-baby/confirmation-page-payment-success'
import RegisterMyBabyConfirmationPaymentOutstanding from 'components/register-my-baby/confirmation-page-payment-outstanding'
import RegisterMyBabyConfirmationPaymentRetry from 'components/register-my-baby/confirmation-page-payment-retry'
import { routerScrollHandler } from 'utils'

// Async routes
const BabyNamesLoader = () => <div className="baby-names-loader"><Spinner /></div>
const BabyNames = Loadable({ loader: () => import(/* webpackChunkName: "baby-names" */'components/baby-names/baby-names'), loading: BabyNamesLoader  })

// mapping for routes for metadata pages
// the value is the tag on the card from the content api used to create the association
export const routeTagMapping = {
  'copyright-and-attribution': 'boac_presentation::copyright',
  'your-privacy': 'boac_presentation::privacy',
  'contact-us': 'boac_presentation::contact'
}
let metadataRoutes = []

for (var route in routeTagMapping) {
  metadataRoutes.push(<Route key={route} path={route} component={MetadataPage} />)
}

// NOTE: please remember to update sitemap.xml in root directory
const Root = (props) => (
  <Provider store={props.store}>
    <Router history={browserHistory} onUpdate={routerScrollHandler}>
      <Route path='/' component={Container}>
        <IndexRoute component={Main} />
        <Route path='register-my-baby' component={BirthRegistrationPage}>
          <IndexRoute component={RegisterMyBabyLandingPage} />
          <Route path='confirmation' component={RegisterMyBabyConfirmation} />
          <Route path='confirmation-payment-success' component={RegisterMyBabyConfirmationPaymentSuccess} />
          <Route path='confirmation-payment-outstanding' component={RegisterMyBabyConfirmationPaymentOutstanding} />
          <Route path='confirmation-payment-retry' component={RegisterMyBabyConfirmationPaymentRetry} />
          <Route path=':stepName' component={RegisterMyBaby} />
        </Route>
        <Route path='news' component={FeaturePage}>
          <IndexRedirect to="/news/baby-names" />
          <Route path='baby-names' component={BabyNames} />
          <Route path='*' component={BabyNames} />
        </Route>
        <Route path='services-near-me(/:category)' component={ServicesPage} />
        <Route path='support' component={SupportPage} />
        <Route path='online-safety' component={OnlineSafetyPage} />
        <Route path='financial-help' component={EntitlementsPage}>
          <IndexRoute component={EntitlementsLandingPage} />
          <Route path='questions(/:stepName)' component={EntitlementsQuestions} />
          <Route path='results' component={EntitlementsResults} />
        </Route>
        {metadataRoutes}
        <Route path='*' component={Main} />
      </Route>
    </Router>
  </Provider>
)

Root.propTypes = {
  store: PropTypes.object
}

export default Root
