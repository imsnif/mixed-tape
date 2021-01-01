const { PassThrough } = require('stream')
const { createTestStream } = require('./pipeline')

module.exports = {
  api: (state, tape, report) => {
    const testConcurrent = (...args) => {
      const func = () => {
        process.nextTick(() => {
          if (!state.only) {
            state.registerTest()
            const harness = tape.createHarness()
            const { testReport, testEnded } = createTestStream(harness)
            state.testsEnded.push(testEnded.then((r) => {
              state.deregisterTest()
              return r
            }))
            report.setMaxListeners(report.getMaxListeners() + 1)
            testReport.pipe(report)
            state.incrementRunning()
            harness(...args)
          }
        })
      }
      if (!state.semaphore) { func() } else { state.semaphore.take(func) }
    }
    testConcurrent.onFinish = fn => {
      state.runOnFinish.push(fn)
    }
    testConcurrent.onFailure = fn => {
      state.runOnFailure.push(fn)
    }
    testConcurrent.only = (...args) => {
      state.only = true
      state.registerTest()
      const harness = tape.createHarness()
      const { testReport, testEnded } = createTestStream(harness)
      state.testsEnded.push(testEnded.then((r) => {
        state.deregisterTest()
        return r
      }))
      testReport.pipe(report)
      state.incrementRunning()
      harness(...args)
    }
    testConcurrent.skip = tape.skip
    testConcurrent.createStream = () => {
      state.registerTest()
      state.pipedToProcess = false
      report.unpipe(process.stdout)
      const stream = PassThrough()
      report.pipe(stream)
      state.incrementRunning()
      state.deregisterTest()
      return stream
    }
    return testConcurrent
  }
}
