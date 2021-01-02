const test = require('tape')
const proxyquire = require('proxyquire')
const mixtape = require('../')

process && process.setMaxListeners && process.setMaxListeners(Infinity)

test('can run 20 waited test cases with concurrent limit==4', async t => {
  t.plan(2)
  try {
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance, 4)
    // testInstance.createStream() // silence output
    let runs = new Set()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    let t0 = Date.now()
    let last = -1
    Array(20).fill(1).forEach((el, index) => {
      testInstance(`test ${index}`, t => {
        const fn = () => {
          runs.add(index)
          t.ok(1)
          t.comment(`${index} end ${Date.now() - t0}`)
          last = index
          t.end()
        }
        console.log(`${index} start  ${Date.now() - t0}`)
        // t.comment(`${index} start`)
        setTimeout(fn, index % 5 ? 10 : 100)
      })
    })
    await testsDone
    t.equal(last, 15, `the last index to finish was ${last}, expecting 15`)
    t.equals(runs.size, 20, 'all tests ran')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})

test('can run 10 wait-100ms test cases with concurrent limit==1', async t => {
  t.plan(2)
  try {
    const numTests = 10
    const concurrentLimit = 1
    const waitms = 100
    const tapeInstance = proxyquire('tape', {})
    const testInstance = mixtape(tapeInstance, concurrentLimit)
    // testInstance.createStream() // silence output
    let runs = new Set()
    const testsDone = new Promise(resolve => testInstance.onFinish(resolve))
    const t0 = Date.now()
    const finishTimes = Array(numTests).fill(0)
    Array(numTests).fill(1).forEach((el, index) => {
      testInstance(`test ${index}`, t => {
        const fn = () => {
          runs.add(index)
          t.ok(1)
          const finishTime = Date.now() - t0
          finishTimes[index] = finishTime
          t.comment(`${index} end ${finishTime}`)
          t.end()
        }
        console.log(`${index} start  ${Date.now() - t0}`)
        // t.comment(`${index} start  ${Date.now() - t0}`)
        setTimeout(fn, waitms)
      })
    })
    await testsDone
    t.equals(runs.size, numTests, 'all tests ran')
    let delaysOK = true
    for (let i = 1; i < numTests; i++) {
      if (finishTimes[i] - finishTimes[i - 1] - waitms < 0) {
        delaysOK = false
        t.assert(false,
          `expected delay finishTimes[${i}]-finishTimes[${i - 1}]-waitms>=0, ` +
          `actual ${finishTimes[i] - finishTimes[i - 1] - waitms}`)
      }
    }
    t.assert(delaysOK, 'measured delays indicate concurrent constraint is working')
  } catch (e) {
    t.fail(e.message)
    t.end()
  }
})
