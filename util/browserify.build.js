const browserify = require('browserify')
const babelify = require('babelify')

browserify()
  .transform(babelify)
  .plugin('proxyquire-universal')
  .require(require.resolve('../test/all.spec.js'), { entry: true })
  .bundle()
  .pipe(process.stdout)
