[![Build Status](https://travis-ci.org/imsnif/mixed-tape.svg?branch=master)](https://travis-ci.org/imsnif/mixed-tape) [![Coverage Status](https://coveralls.io/repos/github/imsnif/mixed-tape/badge.svg?branch=master)](https://coveralls.io/github/imsnif/mixed-tape?branch=master) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# mixed-tape
A drop in replacement for [tape](https://github.com/substack/tape) that runs tests concurrently in node and the browser (using [browserify](https://github.com/browserify/browserify)).

### install
`npm install --save-dev mixed-tape tape` /

`yarn add -D mixed-tape tape`

### usage
```javascript
const tape = require('tape')
const mixedTape = require('mixed-tape')
const test = mixedTape(tape)

test('first test', t => {
  setTimeout(() => {
    t.equals(1, 1, 'why not?')
    t.end()
  }, 1000)
})

test('second test', t => {
  setTimeout(() => {
    t.ok(true, 'I will never fail')
    t.end()
  }, 1000)
})

// tests will run in ~1 second instead of ~2
```

Note that if you'd like to split your tests into separate files, `mixed-tape` should be created and exported in just one place, eg:
```javascript
// test-runner.js
const tape = require('tape')
const mixedTape = require('mixed-tape')
module.exports = mixedTape(tape)

// test-file-1.spec.js
const test = require('./test-runner')

test('my first test', t => {
  // ...
})

// test-file-2.spec.js
const test = require('./test-runner')

test('my second test', t => {
  // ...
})
```
It is also possible to place a limit on the number of concurrent tasks:
```javascript
const fspr = require('fs').promises
const tape = require('tape')
const mixedTape = require('mixed-tape')
const concurrentLimit = 3
const test = mixedTape(tape,concurrentLimit)
function snooze(t){return new Promise((r)=>{setTimeout(()=>{r()},t)})}
Array(12).forEach(async(_,i)=>{
  test('test#'+i, t => {
      const content=Promise.any([
        fspr.readFile('./WarAndPeace.pdf'),
        snooze(1000)]);
      t.equals(content,"involves Russia",`#${i} speed reading OK`)
      t.end()
  })
})
// tests will run in ~4 second instead of ~12,
// but no more than 3 copies of WarAndPeace in memory at once.
```


### how does it work?
`mixed-tape` runs tests asynchronously on one thread. It saves lots of time for tests that rely on IO (eg. e2e tests). It can definitely run synchronous tests, but one will likely not see a big performance boost there.

Under the hood, it uses `tape`'s `createHarness` method for every test it runs, piping their results (once the test has run) to a stream that reports them in real time, strips out their summaries and prints out a merged summary in the end.

It intentionally does not hijack `console.log`s. For this reason, those might appear before the test's assertions. This is done because it was deemed this is a less surprising behaviour to the developer, given the other options.

### api support
- [x] test()

- [x] test.only()

- [x] test.skip()

- [x] test.onFinish()

- [x] test.onFailure()

- [x] test.createStream()

- [ ] test.createHarness() - `tape` itself does not support recursive `createHarness` calls, so implementing this is not trivial. If this is a thing for you, please open an issue or better yet, a PR.

These methods work as expected. For full documentation, please see: [tape](https://github.com/substack/tape).

### use with care
While the prospect of running tests concurrently might be an appealing one (often reducing the run time of the test suite to not much more than the longest test), there are some serious caveats and dangers:

Tests will inevitably share some sort of state. Even if there are proper isolation methods in place, at the very least they will share hardware resources.

In a lot of cases this is not an issue, but be wary when using this method. With reduced speed come unknown variables.

### optimal number of concurrent tasks

When tests are pending on IO leaving spare CPU cycles unused, then a higher number of concurrent tests can take advanage of those cycles.

However, more concurrent tests will result in more memory usage, and if swap or total memory are insufficient then performance will drop - even freeze.

### contributing
Please do!

### license
MIT
