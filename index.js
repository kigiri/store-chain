function isFn(fn) { return typeof fn === "function"; }

function looksLikeAPromise(val) {
  return val && isFn(val.then) && isFn(val.catch);
}

function logErrorStack(err) {
  if (typeof err === "string") {
    err = new Error(err);
  }
  console.warn(err.stack);
}

function StoreChain(store, ref) {
  return {
    then: function (success, failure) {
      return StoreChain(store, ref.then(success, failure));
    },
    catch: function (failure) {
      function catcher(err) {
        if (!isFn(failure)) throw err;
        failure(err, store);
      }
      return StoreChain(store, ref.catch(catcher));
    },
    set: function (key) {
      function setter(value) { return store[key] = value }

      return StoreChain(store, ref.then(setter));
    },
    del: function (key) {
      function deleter() { delete store[key] }

      return StoreChain(store, ref.then(deleter));
    },
    get: function (success, failure) {
      function getter() { return store }

      return StoreChain(store, ref.then(getter).then(success, failure));
    },
    toPromise: function () { return ref }
  }
}

function storeChainConstructor(ref, store) {
  if (!looksLikeAPromise(ref)) {
    if (ref && isFn(ref.resolve)) {
      ref = ref.resolve();
    } else if (Promise !== undefined) {
      ref = Promise.resolve();
    } else {
      logErrorStack("Unable to find Promise library, "
        +"you must init StoreChain with a promise.\n"
        +"Use `Promise.resolve()` to create one from scratch");
    }
  }

  return StoreChain(store || {}, ref);
}

storeChainConstructor.debug = function (fn) {
  var stack = (new Error('debug')).stack.split('\n');
  var origin = stack[2].split(/\((.+)\)/)[1];
  var originMessage = 'Debug from '+ origin +'\n';

  if (!isFn(fn)) {
    if (fn === undefined) {
      if (origin) {
        fn = console.log.bind(console, originMessage);
      } else {
        fn = console.log.bind(console);
      }
    } else if (origin) {
      fn = console.log.bind(console, originMessage, fn);
    } else { 
      fn = console.log.bind(console, fn);
    }
  }
  return function (val) {
    fn(val)
    return val;
  }
}

function objectPromiseAll(obj) {
  var keys = Object.keys(obj);
  var max = keys.length;
  var work = new Array(max);
  var i = -1;

  while (++i < max) {
    work[i] = obj[keys[i]];
  }

  return Promise.all(work).then(function (result) {
    var store = {};
    i = -1;

    while (++i < max) {
      store[keys[i]] = result[i];
    }

    return store;
  })
}

storeChainConstructor.all = function polymorphicPromiseAll(collection) {
  if (!collection) {
    throw new Error('polymorphicPromiseAll need to be called with '
      +'an iterable or an object');
  }
  if (collection.constructor === Array) {
    return Promise.all(collection);
  }
  return objectPromiseAll(collection);
}

storeChainConstructor.looksLikeAPromise = looksLikeAPromise;

module.exports = storeChainConstructor;
