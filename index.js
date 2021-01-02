const { api } = require('./lib/api')
const { createReport } = require('./lib/pipeline')
const semaphoreFactory = require('semaphore')

module.exports = (tape, concurrentLimit = 0) => {
  process.stdout = process.stdout || require('browser-stdout')()
  const registerTest = () => {
    state.numTotal++
    state.numPending++
  }
  const deregisterTest = () => {
    if (state.semaphore) state.semaphore.leave()
    // give any waiting task a chance to start by calling setTimeout(*,0)
    setTimeout(() => {
      state.numPending--
      state.numRunning--
      if (state.numPending === 0) {
        Promise.all(state.testsEnded)
          .then(() => {
            if (state.numPending === 0 && !state.reportEndAlreadyCalled) {
              state.reportEndAlreadyCalled = true
              report.end()
            }
          })
      }
    }, 0)
  }
  const incrementRunning = () => { state.numRunning++ }
  let state = {
    reportEndAlreadyCalled: false,
    numRunning: 0, // diagnostic use only
    numTotal: 0, // diagnostic use only
    numPending: 0,
    semaphore: (concurrentLimit > 0) ? semaphoreFactory(concurrentLimit) : null,
    concurrentLimit: concurrentLimit, // 0 => infinity, no limit
    only: false,
    pipedToProcess: false,
    testsEnded: [],
    runOnFailure: [],
    runOnFinish: [],
    registerTest,
    deregisterTest,
    incrementRunning // diagnostic use only
  }
  const report = createReport(state)
  tape.createStream() // filter out all tape output
  report.pipe(process.stdout)
  return api(state, tape, report)
}
