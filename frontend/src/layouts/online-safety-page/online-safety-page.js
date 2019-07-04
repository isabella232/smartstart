import '../plain-layout-page.scss'

import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import Header from 'layouts/header/header'
import Footer from 'layouts/footer/footer'
import DiscretionDrawer from 'components/discretion-drawer/discretion-drawer'
import SharingPane from 'components/sharing-pane/sharing-pane'

class OnlineSafetyPage extends Component {
  render () {
    const { isLoggedIn, authError } = this.props

    return (
      <div className="site-container-wrapper">
        <div className="site-container">
          <Header isLoggedIn={isLoggedIn} authError={authError} />
          <SharingPane calledFrom="Online Safety" />

          <DiscretionDrawer />

          <div id="content" className="plain-layout-page">
            <div className="page-content">
              <div className="online-safety-wrapper">
                <h2>
                  Marutau tuihono <br/>
                  <span className="english">Online safety</span>
                </h2>
                <div className="divider" />
                <div>
                  <p>The internet is part of our daily life and has changed the way we live our lives. However, email and the internet may not be a safe way to communicate if you are worried about your safety.</p>
                  <p>Computers and smartphones can store a lot of data about what you look at online, who you communicate with, your physical location and movements and your personal information.</p>
                  <p>There are many ways for people to monitor your computer use and find out information about you. But there are also some simple things you can do to increase your safety and privacy when you're using the internet.</p>

                  <h5>Clear your browser history</h5>
                  <p>Every time you visit a web page your internet browser stores files related to your browsing session. If someone gets access to your browser after an online session, they can easily see what you have been looking at online.</p>
                  <p>While you can clear your <a href="https://support.google.com/websearch/answer/465?hl=en" target="_blank" rel="noreferrer noopener">browser history</a> through your computer's settings, It's impossible to delete or clear all the 'footprints' of your computer or online activities.</p>
                  <p>It's also important to remember that if someone is monitoring your online activity it might be dangerous to clear your browser history if that is something that you don't normally do.</p>

                  <h5>Hide your tracks as you surf</h5>
                  <p>Some web browsers let you hide your tracks as you surf. Internet Explorer, Microsoft Edge, Firefox, Chrome and Safari all have private browsing modes that hide your web surfing history and eliminate the need to delete history data to preserve your privacy. This also prevents suspicion about why all the browsing history data have been cleared. Below are the names of the private browsing features:</p>
                  <ul>
                    <li>Internet Explorer and Microsoft Edge: “InPrivate Browsing”</li>
                    <li>Firefox and Safari: “Private Browsing”</li>
                    <li>Chrome: “Incognito mode”</li>
                  </ul>

                  <h5>Online safety and security tips</h5>
                  <p><a href="https://www.netsafe.org.nz/" target="_blank" rel="noreferrer noopener">Netsafe</a> has a number of suggestions for using online technologies safely and securely.</p>
                  <p><strong>Google yourself: </strong>See if your private contact information can be found online. Go to Google, enter your name and hit enter. Do the same on Google images.</p>
                  <p><strong>Secure your computer: </strong>Install and regularly update anti-spyware and anti-virus software. Activate your firewall and secure your wireless (Wi-Fi) network.</p>
                  <p><strong>Use a safer computer: </strong>Try and use a safer computer (one at a public library, community centre) when looking for help, a new place to live etc. Consider opening a private email address on a safe computer.</p>
                  <p><strong>Change passwords and pin numbers: </strong>Change passwords for any protected accounts, have different passwords for different accounts, strengthen password security by combining numbers, letters and special characters, always log off after use.</p>
                  <p><strong>Mobile phones and apps: </strong>Mobile phones and some apps can track your exact location in real time. Turn off any location based features, including tagging, GPS and Bluetooth.</p>
                  <p><strong>Facebook: </strong>Update your privacy settings, limit what you share, do not post updates/photos that include location based information.</p>
                  <p><strong>Talk to your kids: </strong>Tell your children not to post any identifying information online, turn off any location based services on their mobile phones, set younger teens’ social media profiles to private.</p>
                  <p>Ultimately, trust your instincts. If you suspect the abusive person knows too much, it is possible that your phone, computer, email or other activities are being monitored.</p>
                  <br/>
                  <p>Last modified: 26th July 2016</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }
}

OnlineSafetyPage.propTypes = {
  isLoggedIn: PropTypes.bool,
  authError: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string
  ]),
}

export default connect(() => ({}))(OnlineSafetyPage)
