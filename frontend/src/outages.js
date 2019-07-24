// Messages inside array will appear on smartstart website at
// specified times

// sample object below
// {
//   startDate: Date.UTC(2018, 8, 19, 12, 0, 0), // Thu 20 Sep
//   expiryDate: Date.UTC(2018, 8, 23, 5, 0, 0), // Sun 23 Sep 5pm
//   message: `The website will be down on a weekend`,
//   pages: ['main', 'bro']
// }
export default [
  {
    startDate: Date.UTC(2019, 6, 23, 22, 0, 0), // 24th July 10:00am
    expiryDate: Date.UTC(2019, 6, 28, 2, 0, 0), // 28th July 2:00pm
    message: 'The Birth Registration Service will be unavailable between 10:00 pm Saturday 27th July and 2:00 pm Sunday 28th July due to planned system maintenance. We apologise for any inconvenience this may cause.',
    pages: ['main', 'bro']
  },
  {
    startDate: Date.UTC(2019, 2, 17, 20, 0, 0),
    expiryDate: Date.UTC(2020, 2, 17, 20, 0, 0),
    message: `<a href="https://www.health.govt.nz/your-health/conditions-and-treatments/diseases-and-illnesses/measles/measles-advice-2019" target="_blank" rel="noreferrer noopener">Measles – advice for parents from the Ministry of Health.</a>`,
    pages: ['main']
  },
 ]
