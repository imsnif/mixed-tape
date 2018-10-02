const { Transform, PassThrough } = require('stream')

const createTestStream = harness => {
  let endStream = null
  const testEnded = new Promise(resolve => {
    endStream = resolve
  })
  const stream = harness.createStream()
  const testReport = new Transform({
    transform (chunk, encoding, callback) {
      this.buffer = this.buffer || ''
      this.buffer += chunk
      callback()
    },
    flush () {
      this.push(this.buffer)
      endStream()
    }
  })
  stream.pipe(testReport)
  return { testReport, testEnded }
}

module.exports = {
  api: (state, tape, report) => {
    const testConcurrent = (...args) => {
      const harness = tape.createHarness()
      const { testReport, testEnded } = createTestStream(harness)
      state.testsEnded.push(testEnded)
      report.setMaxListeners(report.getMaxListeners() + 1)
      testReport.pipe(report)
      process.nextTick(() => {
        if (!state.only) {
          harness(...args)
        }
      })
    }
    testConcurrent.onFinish = fn => {
      state.runOnFinish.push(fn)
    }
    testConcurrent.onFailure = fn => {
      state.runOnFailure.push(fn)
    }
    testConcurrent.only = (...args) => {
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
