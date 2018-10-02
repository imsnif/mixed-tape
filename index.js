const { api } = require('./lib/api')
const { createReport } = require('./lib/create-report')

module.exports = tape => {
  let state = {
    only: false,
    pipedToProcess: false,
    testsEnded: [],
    runOnFailure: [],
    runOnFinish: []
  }
  const report = createReport(state)
  tape.createStream() // filter out all tape output
  report.pipe(process.stdout)
  process.nextTick(
    () => Promise.all(state.testsEnded).then(() => report.end())
    // this will break if tests are created asynchronously
  )
  return api(state, tape, report)
}
