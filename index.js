const debounce = require('debounce')
const { api } = require('./lib/api')
const { createReport } = require('./lib/create-report')

module.exports = tape => {
  process.stdout = process.stdout || require('browser-stdout')()
  const registerTest = debounce(
    () => Promise.all(state.testsEnded).then(() => report.end()), 100
  )
  let state = {
    only: false,
    pipedToProcess: false,
    testsEnded: [],
    runOnFailure: [],
    runOnFinish: [],
    registerTest
  }
  const report = createReport(state)
  tape.createStream() // filter out all tape output
  report.pipe(process.stdout)
  return api(state, tape, report)
}
