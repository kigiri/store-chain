function isFn(fn) { return typeof fn === "function"; }

function looksLikeAPromise(val) {
  return val && isFn(val.then) && isFn(val.catch);
}

var restrictedKeys = require('./restricted-keys');

function logErrorStack(err) {
  if (typeof err === "string") {
    err = new Error(err);
  }
  console.warn(err.stack);
}

function storeChainFactory(ref, q) {
  var store = {};
  var $ = {};
  var storedError;

  function getter(key) {
    return function storeChainGetter(fn) {
      return $.then(function () { fn(store[key]) });
    };
  }

  $.toPromise = function toPromise() { return ref };

  $.then = function storeChainThen(fn) {
    ref = ref.then(fn);
    return $;
  };

  $.catch = function storeChainCatch(fn) {
    ref = ref.catch(fn);
    return $;
  };

  $.fail = function storeChainFail(msg) {
    return $.catch(function errorHandler(err) {
      console.warn(msg);
      logErrorStack(err);
    });
  };

  $.get = function defaultStoreChainGetter(fn) {
    return $.then(function () { fn(store) });
  };

  $.del = function storeChainDel(key) {
    if (restrictedKeys.indexOf(key) < 0) {
      store[key] = undefined;
      $.get[key] = undefined;
    }
    return $;
  };

  $.set = function storeChainSetter(key, passed) {
    if ($.get[key] !== undefined) {
      logErrorStack((restrictedKeys.indexOf(key) > -1)
        ? 'key: '+ key +' is part of the function restricted keys,'
          +' pick an alternative name'
        : 'key: '+ key +' is already set,'
          +' you must explicitly delete it with `.del("'+ key +'")`'
          +' before you can override it');
      return $;
    }
    ref = ref.then(passed);
    $.get[key] = getter(key);
    return $.then(function prepareGetter(value) { return store[key] = value });
  };

  if (!looksLikeAPromise(ref)) {
    if (Promise !== undefined) {
      ref = Promise.resolve();
    } else {
      logErrorStack("Unable to find Promise library, "
        +"you must init StoreChain with a promise.\n"
        +"Use `Promise.resolve()` to create one from scratch");
    }
  }

  return $;
}

module.exports = storeChainFactory;