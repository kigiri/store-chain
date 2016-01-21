var test = require('tape');

// silence warnings
console.warn = function noop() {};

var chain = require('./index');

function delayedReturnValue(value) {
  return new Promise(function (resolve) {
    setTimeout(function () { resolve(value) }, 15)
  });
}

test('set, get, del and override', function(t) {
  t.plan(6);
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
      t.equal(err.message, 'oops');
      t.equal(store.delayed, 'delayed');
    })
    .get(function (store) { return delayedReturnValue(store) })
    .then(function (store) {
      t.deepEqual(Object.keys(store), [ "delayed" ]);
    });
});

test('polymorphic all', function(t) {
  t.plan(2);
  chain.all({
    a: 'kiliman',
    b: delayedReturnValue('kirikou'),
  }).then(function (store) {
    t.equal(store.a, 'kiliman');
    t.equal(store.b, 'kirikou');
  })
})