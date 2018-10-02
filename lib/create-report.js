const { Transform } = require('stream')

const headerLine = 'TAP version 13'

const stringifyState = state => {
  return [
    `\n1..${state.count}\n`,
    `# tests ${state.count}\n`,
    `# pass ${state.pass}\n`,
    state.fail > 0
      ? `# fail ${state.fail}\n`
      : `\n# ok\n`
  ]
}

const formatLine = (line, count) => {
  if (/^(not )?ok\b/.test(line)) {
    return line.replace(/ok \d+/, `ok ${count}`)
  } else {
    return line
  }
}

const updateState = (line, prevState) => {
  return Object.assign({}, prevState, {
    count: /^(not )?ok\b/.test(line) ? prevState.count + 1 : prevState.count,
    fail: /^not/.test(line) ? prevState.fail + 1 : prevState.fail,
    pass: /^ok/.test(line) ? prevState.pass + 1 : prevState.pass
  })
}

const isTestEnded = line => {
  return /^\d/.test(line)
}

const shouldSkipLine = line => {
  return (/^TAP/.test(line) || line.length === 0)
}

const initState = () => ({ ok: true, count: 0, pass: 0, fail: 0 })

module.exports = {
  createReport: state => new Transform({
    transform (chunk, encoding, callback) {
      const lines = chunk.toString().split('\n')
      this.state = this.state || initState()
      const { state, report } = lines.reduce(({state, report, ended}, line) => {
        const shouldEnd = ended || isTestEnded(line)
        if (shouldEnd || shouldSkipLine(line)) {
          return {state, report, ended: shouldEnd}
        }
        const updatedState = updateState(line, state)
        const formattedLine = formatLine(line, updatedState.count)
        report.push(formattedLine + '\n')
        return {state: updatedState, report}
      }, {state: this.state, report: [], ended: false})
      this.state = state
      if (!this.headerSent) {
        this.push(headerLine + '\n')
        this.headerSent = true
      }
      report.forEach(line => this.push(line))
      callback()
    },
    flush () {
      this.state = this.state || initState()
      const summary = stringifyState(this.state)
      summary.forEach(line => this.push(line))
      state.runOnFinish.forEach(cb => cb())
      if (this.state.fail > 0) {
        state.runOnFailure.forEach(cb => cb())
        state.pipedToProcess && process && process.exit(1)
      }
    }
  })
}
