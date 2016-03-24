function isFn(fn) { return typeof fn === "function"; }

function looksLikeAPromise(val) {
  return val && isFn(val.then) && isFn(val.catch);
}

function StoreChain(store, ref) {
  return {
    then: function (success, failure) {
      return StoreChain(store, ref.then(success, failure));
    },
    catch: function (failure) {
      function catcher(err) {
        if (!isFn(failure)) throw err;
        return failure(err, store);
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
      if (!isFn(success)) {
        success = function getStore() { return store }
      }

      function getter() { return success(store) }

      return StoreChain(store, ref.then(getter, failure));
    },
    toPromise: function () { return ref }
  }
}

function constructLocalStore(source) {
  var target = {};
  return StoreChain(target, objectPromiseAll(source, target));
}

function storeChainConstructor(ref) {
  if (!ref) {
    return StoreChain({}, Promise.resolve());
  }
  if (looksLikeAPromise(ref)) {
    return StoreChain({}, ref);
  }
  if (isFn(ref) && isFn(ref.resolve)) {
    return StoreChain({}, ref.resolve());
  }
  return constructLocalStore(ref);
}

function objectPromiseAll(obj, store) {
  store || (store = {})
  var keys = Object.keys(obj);
  var max = keys.length;
  var work = new Array(max);
  var i = -1;

  while (++i < max) {
    work[i] = obj[keys[i]];
  }

  return Promise.all(work).then(function (result) {
    i = -1;

    while (++i < max) {
      store[keys[i]] = result[i];
    }
    return store;
  })
}

function polymorphicPromiseAll(collection) {
  if (!collection) {
    throw new Error('polymorphicPromiseAll need to be called with '
      +'an iterable or an object');
  }
  if (collection.constructor === Array) {
    return Promise.all(collection);
  }
  return objectPromiseAll(collection);
}

storeChainConstructor.debug = function promiseDebug(fn) {
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

storeChainConstructor.all = objectPromiseAll
storeChainConstructor.looksLikeAPromise = looksLikeAPromise;

module.exports = storeChainConstructor;
