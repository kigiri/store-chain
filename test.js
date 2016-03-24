var test = require('tape')

// silence warnings
console.warn = function noop() {}

var chain = require('./index')

function delayedReturnValue(value) {
  return new Promise(function (resolve) {
    setTimeout(function () { resolve(value) }, 15)
  })
}

test('set, get, del and override', function (t) {
  t.plan(6)
  chain()
    .then(function () { return "all good" })
    .set("test")
    .get(function (store) { t.equal(store.test, "all good") })
    .then(function () { return "should override" })
    .set("test")
    .get(function (store) { t.equal(store.test, "should override") })
    .del("test")
    .get(function (store) { t.equal(store.test, undefined) })
    .then(function() { return delayedReturnValue("delayed") })
    .set('delayed')
    .then(function () { throw new Error('oops') })
    .catch(function (err, store) {
      t.equal(err.message, 'oops')
      t.equal(store.delayed, 'delayed')
    })
    .get(function (store) { return delayedReturnValue(store) })
    .then(function (store) {
      t.deepEqual(Object.keys(store), [ "delayed" ])
    })
})

test('init chain from an object containing promises', function (t) {
  t.plan(2)
  chain({
    a: 'kiliman',
    b: delayedReturnValue('kirikou'),
  })
  .get(function (store) {
    t.equal(store.a, 'kiliman')
    t.equal(store.b, 'kirikou')
  })
})

test('init chain from a promise', function (t) {
  var noval;

  t.plan(1)
  chain(delayedReturnValue().then(function () { noval = 'solved' }))
  .then(function () { t.equal(noval, 'solved') })
})

test('polymorphic all', function (t) {
  t.plan(2)
  chain.all({
    a: 'kiliman',
    b: delayedReturnValue('kirikou'),
  }).then(function (store) {
    t.equal(store.a, 'kiliman')
    t.equal(store.b, 'kirikou')
  })
})

test('Check error transmission', function (t) {
  t.plan(1)
  chain({ msg: Promise.resolve('boom boom boom') })
    .get(function (s) { return Promise.reject(new Error(s.msg)) })
    .get(function () { t.equal('should not be called', true) })
    .catch(function (err) { t.equal(err.message, 'boom boom boom') })
})

test('empty get should return the store', function (t) {
  t.plan(1)
  chain({ a: 'lol' })
    .get()
    .then(function (s) { t.equal(s.a, 'lol') })

})

test('catch should return the value to the chain', function (t) {
  t.plan(1)

  chain()
    .then(function () { return Promise.reject(new Error("pouet")) })
    .catch(function () { return 'pouet' })
    .set('p')
    .get(function (s) { t.equal(s.p, 'pouet') })
})
