[![Build Status](https://travis-ci.org/imsnif/mix-tape.svg?branch=master)](https://travis-ci.org/imsnif/synp) [![Coverage Status](https://coveralls.io/repos/github/imsnif/mix-tape/badge.svg?branch=master)](https://coveralls.io/github/imsnif/synp?branch=master) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

# mix-tape
A drop in replacement for [tape](https://github.com/substack/tape) that runs tests concurrently in node and the browser (using [browserify](https://github.com/browserify/browserify)).

### install
`npm install --save-dev mix-tape tape` /
`yarn add -D mix-tape tape`
### usage
```javascript
const tape = require('tape')
const mixtape = require('mix-tape')
const test = mixtape(tape)

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

Note that if you'd like to split your tests into separate files, `mix-tape` should be created and exported in just one place, eg:
```javascript
// test-runner.js
const tape = require('tape')
const mixtape = require('mix-tape')
module.exports = mixtape(tape)

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
### how does it work?
`mix-tape` runs tests asynchronously on one thread. It saves lots of time for tests that rely on IO (eg. e2e tests). It can definitely run synchronous tests, but one will likely not see a big performance boost there.

Under the hood, it uses `tape`'s `createHarness` method for every test it runs, piping their results (once the test has run) to a stream that reports them in real time, strips out their summaries and prints out a merged summary in the end.

It intentionally does not hijack `console.log`s. For this reason, those might appear before the test's assertions. This is done because it was deemed this is a less surprising behaviour to the developer, given the other options.

### api support
[x] test()
[x] test.only()
[x] test.skip()
[x] test.onFinish()
[x] test.onFailure()
[x] test.createStream()
[ ] test.createHarness() - `tape` itself does not support recursive `createHarness` calls, so implementing this is not trivial. If this is a thing for you, please open an issue or better yet, a PR.

These methods work as expected. For full documentation, please see: [tape](https://github.com/substack/tape).

### use with care
While the prospect of running tests concurrently might be an appealing one (often reducing the run time of the test suite to not much more than the longest test), there are some serious caveats and dangers:

Tests will inevitably share some sort of state. Even if there are proper isolation methods in place, at the very least they will share hardware resources.

In a lot of cases this is not an issue, but be wary when using this method. With reduced speed come unknown variables.

### contributing
Please do!

### license
MIT
