const { Transform } = require('stream')
const {
  headerLine,
  stringifySummary,
  updateTestCount,
  updateSummary,
  isTestEnded,
  shouldSkipLine
} = require('./tap-output')

const initReport = () => ({ ok: true, count: 0, pass: 0, fail: 0 })

module.exports = {
  createTestStream: harness => {
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
  },
  createReport: state => new Transform({
    transform (chunk, encoding, callback) {
      const lines = chunk.toString().split('\n')
      this.state = this.state || initReport()
      const {
        state,
        report
      } = lines.reduce(({ state, report, ended }, line) => {
        const shouldEnd = ended || isTestEnded(line)
        if (shouldEnd || shouldSkipLine(line)) {
          return { state, report, ended: shouldEnd }
        }
        const updatedState = updateSummary(line, state)
        const formattedLine = updateTestCount(line, updatedState.count)
        report.push(formattedLine + '\n')
        return { state: updatedState, report }
      }, { state: this.state, report: [], ended: false })
      this.state = state
      if (!this.headerSent) {
        this.push(headerLine + '\n')
        this.headerSent = true
      }
      report.forEach(line => this.push(line))
      callback()
    },
    flush () {
      this.state = this.state || initReport()
      const summary = stringifySummary(this.state)
      summary.forEach(line => this.push(line))
      state.runOnFinish.forEach(cb => cb())
      if (this.state.fail > 0) {
        state.runOnFailure.forEach(cb => cb())
        state.pipedToProcess && process && process.exit(1)
      }
    }
  })
}
