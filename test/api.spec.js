const test = require('tape')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const mixtape = require('../')

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
