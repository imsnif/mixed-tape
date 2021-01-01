const { PassThrough } = require('stream')
const { createTestStream } = require('./pipeline')

module.exports = {
  api: (state, tape, report) => {
    const testConcurrent = (...args) => {
      const func = () => {
        state.registerTest()
        process.nextTick(() => {
          if (!state.only) {
            const harness = tape.createHarness()
            const { testReport, testEnded } = createTestStream(harness)
            state.testsEnded.push(testEnded)
            report.setMaxListeners(report.getMaxListeners() + 1)
            testReport.pipe(report)
            harness(...args)
          }
        })
        if (state.semaphore) { state.semaphore.leave() }
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
      state.registerTest()
      state.only = true
      const harness = tape.createHarness()
      const { testReport, testEnded } = createTestStream(harness)
      state.testsEnded.push(testEnded)
      testReport.pipe(report)
      harness(...args)
    }
    testConcurrent.skip = tape.skip
    testConcurrent.createStream = () => {
      state.pipedToProcess = false
      report.unpipe(process.stdout)
      const stream = PassThrough()
      report.pipe(stream)
      return stream
    }
    return testConcurrent
  }
}
