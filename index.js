const { Transform, PassThrough } = require('stream')
const Parser = require('tap-parser')

module.exports = (tape) => {
  let only = false
  let pipedToProcess = false
  let streamsEnded = []
  let onFailureCbs = []
  const tapeStream = tape.createStream() // filter out all tape output
  const summarizeTests = new Transform({
    transform (chunk, encoding, callback) {
      const p = new Parser()
      const headerLine = 'TAP version 13'
      let ended = false
      p.on('complete', results => {
        this.state = this.state || {plan: {}}
        this.state = Object.assign({}, this.state, {
          ok: (this.state.ok === undefined ? true : this.state.ok) && results.ok,
          count: (this.state.count || 0) + results.count,
          pass: (this.state.pass || 0) + results.count,
          fail: (this.state.fail || 0) + results.fail,
          bailout: this.state.bailout || results.bailout,
          todo: (this.state.todo || 0) + results.todo,
          skip: (this.state.skip || 0) + results.skip,
          failures: (this.state.failures || []).concat(results.failures),
          plan: Object.assign({}, this.state.plan, {
            start: this.state.plan.start || results.plan.start,
            end: this.state.plan.end === undefined
              ? results.plan.end
              : this.state.plan.end + results.count
              // this assumes the TAP input is valid (start + count = end)
          })
        })
      })
      p.on('line', line => {
        if (/^\d/.test(line)) {
          ended = true
        }
        if (/^TAP/.test(line.toString()) && !this.headerSent) {
          this.push(headerLine + '\n')
          this.headerSent = true
        } else if (!ended && !/^TAP/.test(line.toString())) {
          if (/^(not )?ok\b/.test(line)) {
            this.assertionNum = this.assertionNum || 0
            this.assertionNum += 1
            const incremented = line.replace(/ok \d+/, `ok ${this.assertionNum}`)
            this.push(incremented)
          } else {
            this.push(line)
          }
        }
      })
      p.write(chunk)
      p.end()
      callback()
    },
    flush () {
      if (!(this.state && this.state.plan)) return // TODO: why is this happening?
      const summary = [
        `\n${this.state.plan.start}..${this.state.plan.end}`,
        `# tests ${this.state.count}`,
        `# pass ${this.state.pass}`
      ]
      summary.forEach(line => this.push(line + '\n'))
      if (this.state.ok) {
        this.push(`\n# ok\n`)
      } else {
        onFailureCbs.forEach(cb => cb())
        this.push(`# fail ${this.state.fail}\n`)
        pipedToProcess && process && process.exit(1)
      }
    }
  })
  summarizeTests.pipe(process.stdout)
  process.nextTick(() => Promise.all(streamsEnded).then(() => summarizeTests.end()))
  const testConcurrent = function () { // TODO: rename to parallel?
    const harness = tape.createHarness()
    const stream = harness.createStream()
    let testOutput = ''
    const streamEnded = new Promise(resolve => {
      stream.on('end', () => {
        summarizeTests.write(testOutput)
        resolve()
      })
    })
    streamsEnded.push(streamEnded)
    stream.on('data', (data) => {
      testOutput += data
    })
    process.nextTick(() => {
      if (!only) {
        harness.apply(this, arguments)
      }
    })
  }
  testConcurrent.onFinish = async fn => {
    // TODO: same as onFailure implementation
    await new Promise(resolve => process.nextTick(resolve))
    await Promise.all(streamsEnded)
    await fn()
  }

  testConcurrent.onFailure = async fn => {
    onFailureCbs.push(fn)
  }

  testConcurrent.only = (...args) => {
    only = true
    // TODO: merge with concurrent above
    const harness = tape.createHarness()
    const stream = harness.createStream()
    let testOutput = ''
    const streamEnded = new Promise(resolve => {
      stream.on('end', () => {
        summarizeTests.write(testOutput)
        resolve()
      })
    })
    streamsEnded.push(streamEnded)
    stream.on('data', (data) => {
      testOutput += data
    })
    return harness(...args)
  }

  testConcurrent.skip = tape.skip
  testConcurrent.createStream = () => {
    pipedToProcess = false
    summarizeTests.unpipe(process.stdout)
    const stream = PassThrough()
    summarizeTests.pipe(stream)
    return stream
  }

  return testConcurrent
}
