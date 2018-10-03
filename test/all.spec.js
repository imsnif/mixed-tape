const test = require('tape') // TODO: use self
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const mixtape = require('../')

process && process.setMaxListeners && process.setMaxListeners(Infinity)
// this is only relevant to the testing environment
// because we're using "vanilla" tape for the tests
//
// mixtape is not used to test itself in order to make debugging easier

test('tests run concurrently', async t => {
  t.plan(1)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(second.calledBefore(first), 'shorter test ended first')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('all tests run concurrently when one fails', async t => {
  t.plan(1)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    testInstance('third test', t => {
      t.fail('foo')
      t.end()
    })
    await testsDone
    t.ok(second.calledBefore(first), 'shorter test ended first')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('tests provide proper TAP output on success', async t => {
  t.plan(9)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const output = testInstance.createStream()
    const expected = [
      'TAP version 13\n',
      '# second test\n',
      'ok 1 two two two\n',
      '# first test\n',
      'ok 2 one one one\n',
      '\n1..2\n',
      '# tests 2\n',
      '# pass 2\n',
      '\n# ok\n'
    ]
    output.on('data', function (data) {
      this.index = this.index || 0
      t.equals(
        data.toString(),
        expected[this.index],
        `output number ${this.index} formatted properly`
      )
      this.index++
    })
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.equals(1, 1, 'one one one')
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.equals(2, 2, 'two two two')
        t.end()
      }, 500)
    })
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('respects only test', async t => {
  t.plan(2)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.end()
      }, 1000)
    })
    testInstance.only('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(second.calledOnce, 'only test ran')
    t.ok(first.notCalled, 'non-only test did not run')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('respects skip test', async t => {
  t.plan(2)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.createStream() // silence output
    testInstance.skip('first test', t => {
      setTimeout(() => {
        first()
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(second.calledOnce, 'normal test ran')
    t.ok(first.notCalled, 'skipped test did not run')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('respects onFinish', async t => {
  t.plan(3)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const third = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.onFinish(third)
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(third.calledOnce, 'onFinish hook ran')
    t.ok(third.calledAfter(first), 'onFinish ran at the end (after first test)')
    t.ok(
      third.calledAfter(second), 'onFinish ran at the end (after second test)'
    )
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('respects onFinish with failed test', async t => {
  t.plan(3)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const third = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.onFinish(third)
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.fail('foo')
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(third.calledOnce, 'onFinish hook ran')
    t.ok(third.calledAfter(first), 'onFinish ran at the end (after first test)')
    t.ok(
      third.calledAfter(second), 'onFinish ran at the end (after second test)'
    )
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('respects onFailure', async t => {
  t.plan(3)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const third = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.onFailure(third)
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.fail('foo')
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(third.calledOnce, 'onFailure hook ran')
    t.ok(
      third.calledAfter(first), 'onFailure ran at the end (after first test)'
    )
    t.ok(
      third.calledAfter(second), 'onFailure ran at the end (after second test)'
    )
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('onFailure not run on success', async t => {
  t.plan(1)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    const first = sinon.spy()
    const second = sinon.spy()
    const third = sinon.spy()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    testInstance.onFailure(third)
    testInstance.createStream() // silence output
    testInstance('first test', t => {
      setTimeout(() => {
        first()
        t.ok(1)
        t.end()
      }, 1000)
    })
    testInstance('second test', t => {
      setTimeout(() => {
        second()
        t.end()
      }, 500)
    })
    await testsDone
    t.ok(third.notCalled, 'onFailure hook did not run')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('noop with no tests', t => {
  t.plan(1)
  try {
    const tapeInstance = proxyquire('tape', {})
    mixtape(tapeInstance)
    t.pass('did not throw')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('can run 100 test cases', async t => {
  t.plan(1)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance)
    testInstance.createStream() // silence output
    let runs = new Set()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    Array(100).fill(1).forEach((el, index) => {
      testInstance(`test ${index}`, t => {
        runs.add(index)
        t.ok(1)
        t.end()
      })
    })
    await testsDone
    t.equals(runs.size, 100, 'all tests ran')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

// TODO: rest of API
