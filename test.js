var test = require('tape');

// silence warnings
console.warn = function noop() {};

var chain = require('./index');

var restrictedKeys = require('./restricted-keys');

test('set, get, del and override', function(t) {
  t.plan(4);
  chain()
    .set("test", function () { return "all good" })
    .get.test(function (value) { t.equal(value, "all good") })
    .set("test", function () { return "should not override" })
    .get.test(function (value) { t.equal(value, "all good") })
    .del("test")
    .set("test", function () { return "overrided" })
    .get.test(function (value) { t.equal(value, "overrided") })
    .get(function (store) { t.equal(store.test, "overrided") });
});

test('prevent override restricted keys', function (t) {
  t.plan(restrictedKeys.length);

  restrictedKeys.forEach(function testRestrictedKey(key) {
    var ref = chain()
      .set(key, function () { return "pouet" })
      .then(function newValue(now) { t.notEqual(ref.get[key], "pouet") });
  })
})
