module.exports = {
  headerLine: 'TAP version 13',
  stringifySummary: state => {
    return [
      `\n1..${state.count}\n`,
      `# tests ${state.count}\n`,
      `# pass ${state.pass}\n`,
      state.fail > 0
        ? `# fail ${state.fail}\n`
        : `\n# ok\n`
    ]
  },
  updateTestCount: (line, count) => {
    if (/^(not )?ok\b/.test(line)) {
      return line.replace(/ok \d+/, `ok ${count}`)
    } else {
      return line
    }
  },
  updateSummary: (line, prevState) => {
    return Object.assign({}, prevState, {
      count: /^(not )?ok\b/.test(line) ? prevState.count + 1 : prevState.count,
      fail: /^not/.test(line) ? prevState.fail + 1 : prevState.fail,
      pass: /^ok/.test(line) ? prevState.pass + 1 : prevState.pass
    })
  },
  isTestEnded: line => {
    return /^\d/.test(line)
  },
  shouldSkipLine: line => {
    return (/^TAP/.test(line) || line.length === 0)
  }
}
