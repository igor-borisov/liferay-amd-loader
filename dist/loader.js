/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.2.1
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof self === 'undefined' && typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }
    function lib$es6$promise$then$$then(onFulfillment, onRejection) {
      var parent = this;

      var child = new this.constructor(lib$es6$promise$$internal$$noop);

      if (child[lib$es6$promise$$internal$$PROMISE_ID] === undefined) {
        lib$es6$promise$$internal$$makePromise(child);
      }

      var state = parent._state;

      if (state) {
        var callback = arguments[state - 1];
        lib$es6$promise$asap$$asap(function(){
          lib$es6$promise$$internal$$invokeCallback(state, child, callback, parent._result);
        });
      } else {
        lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
      }

      return child;
    }
    var lib$es6$promise$then$$default = lib$es6$promise$then$$then;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    var lib$es6$promise$$internal$$PROMISE_ID = Math.random().toString(36).substring(16);

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable, then) {
      if (maybeThenable.constructor === promise.constructor &&
          then === lib$es6$promise$then$$default &&
          constructor.resolve === lib$es6$promise$promise$resolve$$default) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value, lib$es6$promise$$internal$$getThen(value));
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    var lib$es6$promise$$internal$$id = 0;
    function lib$es6$promise$$internal$$nextId() {
      return lib$es6$promise$$internal$$id++;
    }

    function lib$es6$promise$$internal$$makePromise(promise) {
      promise[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$id++;
      promise._state = undefined;
      promise._result = undefined;
      promise._subscribers = [];
    }

    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      if (!lib$es6$promise$utils$$isArray(entries)) {
        return new Constructor(function(resolve, reject) {
          reject(new TypeError('You must pass an array to race.'));
        });
      } else {
        return new Constructor(function(resolve, reject) {
          var length = entries.length;
          for (var i = 0; i < length; i++) {
            Constructor.resolve(entries[i]).then(resolve, reject);
          }
        });
      }
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;


    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this[lib$es6$promise$$internal$$PROMISE_ID] = lib$es6$promise$$internal$$nextId();
      this._result = this._state = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        typeof resolver !== 'function' && lib$es6$promise$promise$$needsResolver();
        this instanceof lib$es6$promise$promise$$Promise ? lib$es6$promise$$internal$$initializePromise(this, resolver) : lib$es6$promise$promise$$needsNew();
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: lib$es6$promise$then$$default,

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;
    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      this._instanceConstructor = Constructor;
      this.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!this.promise[lib$es6$promise$$internal$$PROMISE_ID]) {
        lib$es6$promise$$internal$$makePromise(this.promise);
      }

      if (lib$es6$promise$utils$$isArray(input)) {
        this._input     = input;
        this.length     = input.length;
        this._remaining = input.length;

        this._result = new Array(this.length);

        if (this.length === 0) {
          lib$es6$promise$$internal$$fulfill(this.promise, this._result);
        } else {
          this.length = this.length || 0;
          this._enumerate();
          if (this._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(this.promise, this._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(this.promise, lib$es6$promise$enumerator$$validationError());
      }
    }

    function lib$es6$promise$enumerator$$validationError() {
      return new Error('Array Methods must be provided an Array');
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var length  = this.length;
      var input   = this._input;

      for (var i = 0; this._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        this._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var c = this._instanceConstructor;
      var resolve = c.resolve;

      if (resolve === lib$es6$promise$promise$resolve$$default) {
        var then = lib$es6$promise$$internal$$getThen(entry);

        if (then === lib$es6$promise$then$$default &&
            entry._state !== lib$es6$promise$$internal$$PENDING) {
          this._settledAt(entry._state, i, entry._result);
        } else if (typeof then !== 'function') {
          this._remaining--;
          this._result[i] = entry;
        } else if (c === lib$es6$promise$promise$$default) {
          var promise = new c(lib$es6$promise$$internal$$noop);
          lib$es6$promise$$internal$$handleMaybeThenable(promise, entry, then);
          this._willSettleAt(promise, i);
        } else {
          this._willSettleAt(new c(function(resolve) { resolve(entry); }), i);
        }
      } else {
        this._willSettleAt(resolve(entry), i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var promise = this.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        this._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          this._result[i] = value;
        }
      }

      if (this._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, this._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);



(function() {
	var global = {};

	global.__CONFIG__ = window.__CONFIG__;

	(function (global, factory) {
    'use strict';

    var built = factory(global);

    /* istanbul ignore else */
    if (typeof module === 'object' && module) {
        module.exports = built;
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    global.EventEmitter = built;
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function (global) {

    'use strict';

/**
 * Creates an instance of EventEmitter class.
 *
 * @constructor
 */

function EventEmitter() {
    this._events = {};
}

EventEmitter.prototype = {
    constructor: EventEmitter,

    /**
     * Adds event listener to an event.
     *
     * @param {string} event The name of the event.
     * @param {Function} callback Callback method to be invoked when event is being emitted.
     */
    on: function (event, callback) {
        var listeners = this._events[event] = this._events[event] || [];

        listeners.push(callback);
    },

    /**
     * Removes an event from the list of event listeners to some event.
     *
     * @param {string} event The name of the event.
     * @param {function} callback Callback method to be removed from the list of listeners.
     */
    off: function (event, callback) {
        var listeners = this._events[event];

        if (listeners) {
            var callbackIndex = listeners.indexOf(callback);

            if (callbackIndex > -1) {
                listeners.splice(callbackIndex, 1);
            } else {
                void 0;
            }
        } else {
            void 0;
        }
    },

    /**
     * Emits an event. The function calls all registered listeners in the order they have been added. The provided args
     * param will be passed to each listener of the event.
     *
     * @param {string} event The name of the event.
     * @param {object} args Object, which will be passed to the listener as only argument.
     */
    emit: function (event, args) {
        var listeners = this._events[event];

        if (listeners) {
            // Slicing is needed to prevent the following situation:
            // A listener is being invoked. During its execution, it may
            // remove itself from the list. In this case, for loop will
            // be damaged, since i will be out of sync.
            listeners = listeners.slice(0);

            for (var i = 0; i < listeners.length; i++) {
                var listener = listeners[i];

                listener.call(listener, args);
            }
        } else {
            void 0;
        }
    }
};

    return EventEmitter;
}));
(function (global, factory) {
    'use strict';

    var built = factory(global);

    /* istanbul ignore else */
    if (typeof module === 'object' && module) {
        module.exports = built;
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    global.ConfigParser = built;
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function (global) {

    'use strict';

/**
 * Creates an instance of ConfigurationParser class.
 *
 * @constructor
 * @param {object=} - The configuration object to be parsed.
 */

function ConfigParser(config) {
    this._config = {};
    this._modules = {};
    this._conditionalModules = {};

    this._parseConfig(config);
}

ConfigParser.prototype = {
    constructor: ConfigParser,

    /**
     * Adds a module to the configuration.
     *
     * @param {object} module The module which should be added to the configuration. Should have the following
     *     properties:
     *     <ul>
     *         <strong>Obligatory properties</strong>:
     *         <li>name (String) The name of the module</li>
     *         <li>dependencies (Array) The modules from which it depends</li>
     *     </ul>
     *
     *     <strong>Optional properties:</strong>
     *     The same as those which config parameter of {@link Loader#define} method accepts.
     * @return {Object} The added module
     */
    addModule: function (module) {
        // Module might be added via configuration or when it arrives from the server.
        // If it arrives from the server, it will have already a definition. In this case,
        // we will overwrite the existing properties with those, provided from the module definition.
        // Otherwise, we will just add it to the map.
        var moduleDefinition = this._modules[module.name];

        if (moduleDefinition) {
            for (var key in module) {
                if (Object.prototype.hasOwnProperty.call(module, key)) {
                    moduleDefinition[key] = module[key];
                }
            }
        } else {
            this._modules[module.name] = module;
        }

        this._registerConditionalModule(module);

        return this._modules[module.name];
    },

    /**
     * Returns the current configuration.
     *
     * @return {object} The current configuration.
     */
    getConfig: function () {
        return this._config;
    },

    /**
     * Returns map with all currently registered conditional modules and their triggers.
     *
     * @return {object} Map with all currently registered conditional modules.
     */
    getConditionalModules: function () {
        return this._conditionalModules;
    },

    /**
     * Returns map with all currently registered modules.
     *
     * @return {object} Map with all currently registered modules.
     */
    getModules: function () {
        return this._modules;
    },

    /**
     * Maps module names to their aliases. Example:
     * __CONFIG__.maps = {
     *      liferay: 'liferay@1.0.0'
     * }
     *
     * When someone does require('liferay/html/js/ac.es',...),
     * if the module 'liferay/html/js/ac.es' is not defined,
     * then a corresponding alias will be searched. If found, the name will be replaced,
     * so it will look like user did require('liferay@1.0.0/html/js/ac.es',...).
     *
     * @protected
     * @param {array|string} module The module which have to be mapped or array of modules.
     * @return {array|string} The mapped module or array of mapped modules.
     */
    mapModule: function(module) {
        if (!this._config.maps) {
            return module;
        }

        var modules;

        if (Array.isArray(module)) {
            modules = module;
        } else {
            modules = [module];
        }

        for (var i = 0; i < modules.length; i++) {
            var tmpModule = modules[i];

            var found = false;

            for (var alias in this._config.maps) {
                /* istanbul ignore else */
                if (Object.prototype.hasOwnProperty.call(this._config.maps, alias)) {
                    if (tmpModule === alias || tmpModule.indexOf(alias + '/') === 0) {
                        tmpModule = this._config.maps[alias] + tmpModule.substring(alias.length);
                        modules[i] = tmpModule;

                        found = true;
                        break;
                    }
                }
            }

            /* istanbul ignore else */
            if(!found && typeof this._config.maps['*'] === 'function') {
                modules[i] = this._config.maps['*'](tmpModule);
            }
        }

        return Array.isArray(module) ? modules : modules[0];
    },

    /**
     * Parses configuration object.
     *
     * @protected
     * @param {object} config Configuration object to be parsed.
     * @return {object} The created configuration
     */
    _parseConfig: function (config) {
        for (var key in config) { /* istanbul ignore else */
            if (Object.prototype.hasOwnProperty.call(config, key)) {
                if (key === 'modules') {
                    this._parseModules(config[key]);
                } else {
                    this._config[key] = config[key];
                }
            }
        }

        return this._config;
    },

    /**
     * Parses a provided modules configuration.
     *
     * @protected
     * @param {object} modules Map of modules to be parsed.
     * @return {object} Map of parsed modules.
     */
    _parseModules: function (modules) {
        for (var key in modules) { /* istanbul ignore else */
            if (Object.prototype.hasOwnProperty.call(modules, key)) {
                var module = modules[key];

                module.name = key;

                this.addModule(module);
            }
        }

        return this._modules;
    },

    /**
     * Registers conditional module to the configuration.
     *
     * @protected
     * @param {object} module Module object
     */
    _registerConditionalModule: function (module) {
        // Create HashMap of all modules, which have conditional modules, as an Array.
        if (module.condition) {
            var existingModules = this._conditionalModules[module.condition.trigger];

            if (!existingModules) {
                this._conditionalModules[module.condition.trigger] = existingModules = [];
            }

            existingModules.push(module.name);
        }
    }
};

    return ConfigParser;
}));
(function (global, factory) {
    'use strict';

    var built = factory(global);

    /* istanbul ignore else */
    if (typeof module === 'object' && module) {
        module.exports = built;
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    global.DependencyBuilder = built;
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function (global) {

    'use strict';

var hasOwnProperty = Object.prototype.hasOwnProperty;

/**
 * Creates an instance of DependencyBuilder class.
 *
 * @constructor
 * @param {object} - instance of {@link ConfigParser} object.
 */

function DependencyBuilder(configParser) {
    this._configParser = configParser;
    this._pathResolver = new global.PathResolver();

    this._result = [];
}

DependencyBuilder.prototype = {
    constructor: DependencyBuilder,

    /**
     * Resolves modules dependencies.
     *
     * @param {array} modules List of modules which dependencies should be resolved.
     * @return {array} List of module names, representing module dependencies. Module name itself is being returned too.
     */
    resolveDependencies: function (modules) {
        // Copy the passed modules to a resolving modules queue.
        // Modules may be added there during the process of resolving.
        this._queue = modules.slice(0);

        var result;

        try {
            this._resolveDependencies();

            // Reorder the modules list so the modules without dependencies will
            // be moved upfront
            result = this._result.reverse().slice(0);
        }
        finally {
            this._cleanup();
        }

        return result;
    },

    /**
     * Clears the used resources during the process of resolving dependencies.
     *
     * @protected
     */
    _cleanup: function () {
        var modules = this._configParser.getModules();

        // Set to false all temporary markers which were set during the process of
        // dependencies resolving.
        for (var key in modules) { /* istanbul ignore else */
            if (hasOwnProperty.call(modules, key)) {
                var module = modules[key];

                module.conditionalMark = false;
                module.mark = false;
                module.tmpMark = false;
            }
        }

        this._queue.length = 0;
        this._result.length = 0;
    },

    /**
     * Processes conditional modules. If a module has conditional module as dependency, this module will be added to
     * the list of modules, which dependencies should be resolved.
     *
     * @protected
     * @param {object} module Module, which will be checked for conditional modules as dependencies.
     */
    _processConditionalModules: function (module) {
        var conditionalModules = this._configParser.getConditionalModules()[module.name];

        // If the current module has conditional modules as dependencies,
        // add them to the list (queue) of modules, which have to be resolved.
        if (conditionalModules && !module.conditionalMark) {
            var modules = this._configParser.getModules();

            for (var i = 0; i < conditionalModules.length; i++) {
                var conditionalModule = modules[conditionalModules[i]];

                if (this._queue.indexOf(conditionalModule.name) === -1 && this._testConditionalModule(conditionalModule.condition.test)) {

                    this._queue.push(conditionalModule.name);
                }
            }

            module.conditionalMark = true;
        }
    },

    /**
     * Processes all modules in the {@link DependencyBuilder#_queue} and resolves their dependencies.
     * If the module is not registered to the configuration, it will be automatically added there with no
     * dependencies. The function implements a standard
     * [topological sorting based on depth-first search]{@link http://en.wikipedia.org/wiki/Topological_sorting}.
     *
     * @protected
     */
    _resolveDependencies: function () {
        // Process all modules in the queue.
        // Note: modules may be added to the queue during the process of evaluating.
        var modules = this._configParser.getModules();

        for (var i = 0; i < this._queue.length; i++) {
            var module = modules[this._queue[i]];

            // If not registered, add the module on the fly with no dependencies.
            // Note: the module name (this._queue[i]) is expected to be already mapped.
            if (!module) {
                module = this._configParser.addModule({
                    name: this._queue[i],
                    dependencies: []
                });
            }

            if (!module.mark) {
                this._visit(module);
            }
        }
    },

    /**
     * Executes the test function of an conditional module and adds it to the list of module dependencies if the
     * function returns true.
     *
     * @param {function|string} testFunction The function which have to be executed. May be Function object or string.
     * @return {boolean} The result of the execution of the test function.
     */
    _testConditionalModule: function (testFunction) {
        if (typeof testFunction === 'function') {
            return testFunction();
        } else {
            return eval('false || ' + testFunction)();
        }
    },

    /**
     * Visits a module during the process of resolving dependencies. The function will throw exception in case of
     * circular dependencies among modules. If a dependency is not registered, it will be added to the configuration
     * as a module without dependencies.
     *
     * @protected
     * @param {object} module The module which have to be visited.
     */
    _visit: function(module) {
        // Directed Acyclic Graph is supported only, throw exception if there are circular dependencies.
        if (module.tmpMark) {
            throw new Error('Error processing module: ' + module.name + '. ' + 'The provided configuration is not Directed Acyclic Graph.');
        }

        // Check if this module has conditional modules and add them to the queue if so.
        this._processConditionalModules(module);

        if (!module.mark) {
            module.tmpMark = true;

            var modules = this._configParser.getModules();

            for (var i = 0; i < module.dependencies.length; i++) {
                var dependencyName = module.dependencies[i];

                if (dependencyName === 'exports' || dependencyName === 'module') {
                    continue;
                }

                // Resolve relative path and map the dependency to its alias
                dependencyName = this._pathResolver.resolvePath(module.name, dependencyName);

                // A module may have many dependencies so we should map them.
                var mappedDependencyName = this._configParser.mapModule(dependencyName);
                var moduleDependency = modules[mappedDependencyName];

                // Register on the fly all unregistered in the configuration dependencies as modules without dependencies.
                if (!moduleDependency) {
                    moduleDependency = this._configParser.addModule({
                        name: mappedDependencyName,
                        dependencies: []
                    });
                }

                this._visit(moduleDependency);
            }

            module.mark = true;

            module.tmpMark = false;

            this._result.unshift(module.name);
        }
    },

    /**
     * @property {array} _queue List of modules, which dependencies should be resolved. Initially, it is copy of
     * the array of modules, passed for resolving; during the process more modules may be added to the queue. For
     * example, these might be conditional modules.
     *
     * @protected
     * @memberof! DependencyBuilder#
     * @default []
     */
    _queue: []
};

    return DependencyBuilder;
}));
(function (global, factory) {
    'use strict';

    var built = factory(global);

    /* istanbul ignore else */
    if (typeof module === 'object' && module) {
        module.exports = built;
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    global.URLBuilder = built;
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function (global) {

    'use strict';

// External protocols regex, supports:
// "http", "https", "//" and "www."
var REGEX_EXTERNAL_PROTOCOLS = /^https?:\/\/|\/\/|www\./;


/**
 * Creates an instance of URLBuilder class.
 *
 * @constructor
 * @param {object} - instance of {@link ConfigParser} object.
 */
function URLBuilder(configParser) {
    this._configParser = configParser;
}

URLBuilder.prototype = {
    constructor: URLBuilder,

    /**
     * Returns a list of URLs from provided list of modules.
     *
     * @param {array} modules List of modules for which URLs should be created.
     * @return {array} List of URLs.
     */
    build: function (modules) {
        var bufferAbsoluteURL = [];
        var bufferRelativeURL = [];
        var modulesAbsoluteURL = [];
        var modulesRelativeURL = [];
        var result = [];

        var config = this._configParser.getConfig();

        var basePath = config.basePath || '';
        var registeredModules = this._configParser.getModules();

        /* istanbul ignore else */
        if (basePath.length && basePath.charAt(basePath.length - 1) !== '/') {
            basePath += '/';
        }

        for (var i = 0; i < modules.length; i++) {
            var module = registeredModules[modules[i]];

            // If module has fullPath, individual URL have to be created.
            if (module.fullPath) {
                result.push({
                    modules: [module.name],
                    url: this._getURLWithParams(module.fullPath)
                });

            } else {
                var path = this._getModulePath(module);
                var absolutePath = path.indexOf('/') === 0;

                // If the URL starts with external protocol, individual URL shall be created.
                if (REGEX_EXTERNAL_PROTOCOLS.test(path)) {
                    result.push({
                        modules: [module.name],
                        url: this._getURLWithParams(path)
                    });

                // If combine is disabled, or the module is an anonymous one,
                // create an individual URL based on the config URL and module's path.
                // If the module's path starts with "/", do not include basePath in the URL.
                } else if (!config.combine || module.anonymous) {
                    result.push({
                        modules: [module.name],
                        url: this._getURLWithParams(config.url + (absolutePath ? '' : basePath) + path)
                    });

                } else {
                    // If combine is true, this is not an anonymous module and the module does not have full path.
                    // The module will be collected in a buffer to be loaded among with other modules from combo loader.
                    // The path will be stored in different buffer depending on the fact if it is absolute URL or not.
                    if (absolutePath) {
                        bufferAbsoluteURL.push(path);
                        modulesAbsoluteURL.push(module.name);
                    } else {
                        bufferRelativeURL.push(path);
                        modulesRelativeURL.push(module.name);
                    }
                }
            }

            module.requested = true;
        }

        // Add to the result all modules, which have to be combined.
        if (bufferRelativeURL.length) {
            result = result.concat(
                this._generateBufferURLs(
                    modulesRelativeURL,
                    bufferRelativeURL,
                    {
                        basePath: basePath,
                        url: config.url,
                        urlMaxLength: config.urlMaxLength
                    }
                )
            );
            bufferRelativeURL.length = 0;
        }

        if (bufferAbsoluteURL.length) {
            result = result.concat(
                this._generateBufferURLs(
                    modulesAbsoluteURL,
                    bufferAbsoluteURL,
                    {
                        url: config.url,
                        urlMaxLength: config.urlMaxLength
                    }
                )
            );
            bufferAbsoluteURL.length = 0;
        }

        return result;
    },

    /**
     * Generate the appropriate set of URLs based on the list of
     * required modules and the maximum allowed URL length
     *
     * @param {Array<String>} modules Array of module names
     * @param {Array<String>} urls Array of module URLs
     * @param {Object} config Configuration object containing URL, basePath and urlMaxLength
     * @return {Array<Object>} Resulting array of {modules, url} objects
     */
    _generateBufferURLs: function(modules, urls, config) {
        var i;
        var basePath = config.basePath || '';
        var result = [];
        var urlMaxLength = config.urlMaxLength || 2000;

        var urlResult = {
            modules: [modules[0]],
            url: config.url + basePath + urls[0]
        };

        for (i = 1; i < urls.length; i++) {
            var module = modules[i];
            var path = urls[i];

            if ((urlResult.url.length + basePath.length + path.length + 1) < urlMaxLength) {
                urlResult.modules.push(module);
                urlResult.url += '&' + basePath + path;
            } else {
                result.push(urlResult);

                urlResult = {
                    modules: [module],
                    url: config.url + basePath + path
                };
            }
        }

        urlResult.url = this._getURLWithParams(urlResult.url);

        result.push(urlResult);

        return result;
    },

    /**
     * Returns the path for a module. If module has property path, it will be returned directly. Otherwise,
     * the name of module will be used and extension .js will be added to module name if omitted.
     *
     * @protected
     * @param {object} module The module which path should be returned.
     * @return {string} Module path.
     */
    _getModulePath: function (module) {
        var path = module.path || module.name;

        var paths = this._configParser.getConfig().paths || {};

        var found = false;
        Object.keys(paths).forEach(function(item) {
            /* istanbul ignore else */
            if (path === item || path.indexOf(item + '/') === 0) {
                path = paths[item] + path.substring(item.length);
            }
        });

        /* istanbul ignore else */
        if(!found && typeof paths['*'] === 'function') {
            path = paths['*'](path);
        }

        if (!REGEX_EXTERNAL_PROTOCOLS.test(path) && path.indexOf('.js') !== path.length - 3) {
            path += '.js';
        }

        return path;
    },

    /**
     * Returns an url with parameters defined in config.defaultURLParams. If
     * config.defaultURLParams is not defined or is an empty map, the url will
     * be returned unmodified.
     *
     * @protected
     * @param {string} url The url to be returned with parameters.
     * @return {string} url The url with parameters.
     */
    _getURLWithParams: function(url) {
        var config = this._configParser.getConfig();

        var defaultURLParams = config.defaultURLParams || {};

        var keys = Object.keys(defaultURLParams);

        if (!keys.length) {
            return url;
        }

        var queryString = keys.map(function(key) {
            return key + '=' + defaultURLParams[key];
        }).join('&');

        return url + (url.indexOf('?') > -1 ? '&' : '?') + queryString;
    }
};

    return URLBuilder;
}));
(function (global, factory) {
    'use strict';

    var built = factory(global);

    /* istanbul ignore else */
    if (typeof module === 'object' && module) {
        module.exports = built;
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    global.PathResolver = built;
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function (global) {

    'use strict';

/**
 * Creates an instance of PathResolver class.
 *
 * @constructor
 */
function PathResolver() {}

PathResolver.prototype = {
    constructor: PathResolver,

    /**
     * Resolves the path of module.
     *
     * @param {string} root Root path which will be used as reference to resolve the path of the dependency.
     * @param {string} dependency The dependency path, which have to be resolved.
     * @return {string} The resolved dependency path.
     */
    resolvePath: function(root, dependency) {
        if (dependency === 'exports' || dependency === 'module' ||
            !(dependency.indexOf('.') === 0 || dependency.indexOf('..') === 0)) {

            return dependency;
        }

        // Split module directories
        var moduleParts = root.split('/');
        // Remove module name
        moduleParts.splice(-1, 1);

        // Split dependency directories
        var dependencyParts = dependency.split('/');
        // Extract dependecy name
        var dependencyName = dependencyParts.splice(-1, 1);

        for (var i = 0; i < dependencyParts.length; i++) {
            var dependencyPart = dependencyParts[i];

            if (dependencyPart === '.') {
                continue;

            } else if (dependencyPart === '..') {
                if (moduleParts.length) {
                    moduleParts.splice(-1, 1);
                }
                else {
                    moduleParts = moduleParts.concat(dependencyParts.slice(i));

                    break;
                }

            } else {
                moduleParts.push(dependencyPart);
            }
        }

        moduleParts.push(dependencyName);

        return moduleParts.join('/');
    }
};

    return PathResolver;
}));
(function (global, factory) {
    'use strict';

    var built = factory(global);

    /* istanbul ignore else */
    if (typeof module === 'object' && module) {
        module.exports = built;
    }

    /* istanbul ignore next */
    if (typeof define === 'function' && define.amd) {
        define(factory);
    }

    /* jshint newcap:false */
    global.Loader = new built();
    global.require = global.Loader.require.bind(global.Loader);
    global.define = global.Loader.define.bind(global.Loader);
    global.define.amd = {};
}(typeof global !== 'undefined' ? global : /* istanbul ignore next */ this, function (global) {

    'use strict';

/**
 * Creates an instance of Loader class.
 *
 * @namespace Loader
 * @extends EventEmitter
 * @constructor
 */

function Loader(config) {
    Loader.superclass.constructor.apply(this, arguments);

    this._config = config || global.__CONFIG__;

    this._modulesMap = {};
}

Loader.prototype = Object.create(global.EventEmitter.prototype);
Loader.prototype.constructor = Loader;
Loader.superclass = global.EventEmitter.prototype;

var LoaderProtoMethods = {
    /**
     * Adds a module to the configuration. See {@link ConfigParser#addModule} for more details.
     *
     * @memberof! Loader#
     * @param {Object} module The module which should be added to the configuration. See {@link ConfigParser#addModule} for more details.
     * @return {Object} Returns the added module to the configuration.
     */
    addModule: function(module) {
        return this._getConfigParser().addModule(module);
    },

    /**
     * Defines a module in the system and fires {@link Loader#event:moduleRegister} event with the registered module as param.
     *
     * @memberof! Loader#
     * @param {string} name The name of the module.
     * @param {array} dependencies List of module dependencies.
     * @param {function} implementation The implementation of the module.
     * @param {object=} config Object configuration:
     * <ul>
     *         <strong>Optional properties</strong>:
     *         <li>path (String) - Explicitly set path of the module. If omitted, module name will be used as path</li>
     *         <li>condition (Object) Object which represents if the module should be added automatically after another
     *             module.
     *         It should have the following properties:</li>
     *             <ul>
     *                 <li>trigger - the module, which should trigger the loading of the current module</li>
     *                 <li>test - function, which should return true if module should be loaded</li>
     *             </ul>
     *          <li>exports - If the module does not expose a "define" function, then you can specify an "exports" property.
     *              The value of this property should be a string, which represents the value, which this module exports to
     *              the global namespace. For example: exports: '_'. This will mean the module exports an underscore to the
     *              global namespace. In this way you can load legacy modules.
     *          </li>
     *     </ul>
     */
    define: function(name, dependencies, implementation, config) {
        var self = this;

        void 0;

        config = config || {};

        var passedArgsCount = arguments.length;

        config.anonymous = false;

        if (passedArgsCount < 2) {
            void 0;
            implementation = arguments[0];
            dependencies = ['module', 'exports'];
            config.anonymous = true;
        } else if (passedArgsCount === 2) {
            if (typeof name === 'string') {
                void 0;
                // there are two parameters, but the first one is not an array with dependencies,
                // this is a module name
                dependencies = ['module', 'exports'];
                implementation = arguments[1];
            } else {
                void 0;
                dependencies = arguments[0];
                implementation = arguments[1];
                config.anonymous = true;
            }
        }

        if (config.anonymous) {
            // Postpone module's registration till the next scriptLoaded event
            var onScriptLoaded = function(loadedModules) {
                self.off('scriptLoaded', onScriptLoaded);

                if (loadedModules.length !== 1) {
                    self._reportMismatchedAnonymousModules(implementation.toString());
                } else {
                    var moduleName = loadedModules[0];
                    var module = self.getModules()[moduleName];

                    if (module && module.pendingImplementation) {
                        self._reportMismatchedAnonymousModules(implementation.toString());
                    }

                    self._define(moduleName, dependencies, implementation, config);
                }
            };

            self.on('scriptLoaded', onScriptLoaded);
        } else {
            // This is not an anonymous module, go directly to module's registration flow
            this._define(name, dependencies, implementation, config);
        }
    },

    /**
     * Returns list of currently registered conditional modules.
     *
     * @memberof! Loader#
     * @return {array} List of currently registered conditional modules.
     */
    getConditionalModules: function() {
        return this._getConfigParser().getConditionalModules();
    },

    /**
     * Returns list of currently registered modules.
     *
     * @memberof! Loader#
     * @return {array} List of currently registered modules.
     */
    getModules: function() {
        return this._getConfigParser().getModules();
    },

    /**
     * Requires list of modules. If a module is not yet registered, it will be ignored and its implementation
     * in the provided success callback will be left undefined.<br>
     *
     * @memberof! Loader#
     * @param {array|string[]} modules Modules can be specified as an array of strings or provided as
     *     multiple string parameters.
     * @param {function} success Callback, which will be invoked in case of success. The provided parameters will
     *     be implementations of all required modules.
     * @param {function} failure Callback, which will be invoked in case of failure. One parameter with
     *     information about the error will be provided.
     */
    require: function() {
        var self = this;

        void 0;

        var failureCallback;
        var i;
        var modules;
        var successCallback;

        // Modules can be specified by as an array, or just as parameters to the function
        // We do not slice or leak arguments to not cause V8 performance penalties
        // TODO: This could be extracted as an inline function (hint)
        if (Array.isArray(arguments[0])) {
            modules = arguments[0];
            successCallback = typeof arguments[1] === 'function' ? arguments[1] : null;
            failureCallback = typeof arguments[2] === 'function' ? arguments[2] : null;

        } else {
            modules = [];

            for (i = 0; i < arguments.length; ++i) {
                if (typeof arguments[i] === 'string') {
                    modules[i] = arguments[i];

                /* istanbul ignore else */
                } else if (typeof arguments[i] === 'function') {
                    successCallback = arguments[i];
                    failureCallback = typeof arguments[++i] === 'function' ? arguments[i] : /* istanbul ignore next */ null;

                    break;
                }
            }
        }

        void 0;

        var configParser = self._getConfigParser();

        // Map the required modules so we start with clean idea what the hell we should load.
        var mappedModules = configParser.mapModule(modules);

        void 0;

        var rejectTimeout;

        new Promise(function(resolve, reject) {
            // Resolve the dependencies of the requested modules,
            // then load them and resolve the Promise
            self._resolveDependencies(mappedModules).then(function(dependencies) {
                void 0;

                var config = configParser.getConfig();

                // Establish a load timeout and reject the Promise in case of Error
                if (config.waitTimeout !== 0) {
                    rejectTimeout = setTimeout(function() {
                        var registeredModules = configParser.getModules();

                        var error = new Error('Load timeout for modules: ' + modules);
                        error.dependecies = dependencies;
                        error.mappedModules = mappedModules;
                        error.missingDependencies = dependencies.filter(function(dep) {
                            return !registeredModules[dep].implementation;
                        });
                        error.modules = modules;

                        void 0;
                        reject(error);
                    }, config.waitTimeout || 7000);
                }

                // Load the dependencies, then resolve the Promise
                self._loadModules(dependencies).then(resolve, reject);
            }, reject);
        }).then(function(loadedModules) {
            void 0;
            clearTimeout(rejectTimeout);

            /* istanbul ignore else */
            if (successCallback) {
                var moduleImplementations = self._getModuleImplementations(mappedModules);
                successCallback.apply(successCallback, moduleImplementations);
            }
        }, function(error) {
            void 0;
            clearTimeout(rejectTimeout);

            /* istanbul ignore else */
            if (failureCallback) {
                failureCallback.call(failureCallback, error);
            }
        });
    },

    /**
     * Creates Promise for module. It will be resolved as soon as module is being loaded from server.
     *
     * @memberof! Loader#
     * @protected
     * @param {string} moduleName The name of module for which Promise should be created.
     * @return {Promise} Promise, which will be resolved as soon as the requested module is being loaded.
     */
    _createModulePromise: function(moduleName) {
        var self = this;

        return new Promise(function(resolve, reject) {
            var registeredModules = self._getConfigParser().getModules();

            // Check if this is a module, which exports something
            // If so, check if the exported value is available
            var module = registeredModules[moduleName];

            if (module.exports) {
                var exportedValue = self._getValueGlobalNS(module.exports);

                if (!!exportedValue) {
                    resolve(exportedValue);
                } else {
                    var onScriptLoaded = function(loadedModules) {
                        if (loadedModules.indexOf(moduleName) >= 0) {
                            self.off('scriptLoaded', onScriptLoaded);

                            var exportedValue = self._getValueGlobalNS(module.exports);

                            if (!!exportedValue) {
                                resolve(exportedValue);
                            } else {
                                reject(new Error('Module ' + moduleName + ' does not export the specified value: ' + module.exports));
                            }
                        }
                    };

                    self.on('scriptLoaded', onScriptLoaded);
                }
            } else {
                var onModuleRegister = function(registeredModuleName) {
                    if (registeredModuleName === moduleName) {
                        self.off('moduleRegister', onModuleRegister);

                        // Overwrite the promise entry in the modules map with a simple `true` value.
                        // Hopefully GC will remove this promise from the memory.
                        self._modulesMap[moduleName] = true;

                        resolve(moduleName);
                    }
                };

                self.on('moduleRegister', onModuleRegister);
            }
        });
    },

    /**
     * Defines a module in the system and fires {@link Loader#event:moduleRegister} event with the registered module as param.
     * Called internally by {@link Loader#define} method once it normalizes the passed arguments.
     *
     * @memberof! Loader#
     * @protected
     * @param {string} name The name of the module.
     * @param {array} dependencies List of module dependencies.
     * @param {function} implementation The implementation of the module.
     * @param {object=} config See {@link Loader:define} for more details.
     */
    _define: function(name, dependencies, implementation, config) {
        // Create a new module by merging the provided config with the passed name,
        // dependencies and implementation.
        var module = config || {};
        var configParser = this._getConfigParser();

        var pathResolver = this._getPathResolver();

        // Resolve the path according to the parent module. Example:
        // define('metal/src/component/component', ['../array/array']) will become:
        // define('metal/src/component/component', ['metal/src/array/array'])
        dependencies = dependencies.map(function(dependency) {
            return pathResolver.resolvePath(name, dependency);
        });

        module.name = name;
        module.dependencies = dependencies;
        module.pendingImplementation = implementation;

        configParser.addModule(module);

        if (!this._modulesMap[module.name]) {
            this._modulesMap[module.name] = true;
        }

        this.emit('moduleRegister', name);
    },

    /**
     * Returns instance of {@link ConfigParser} class.
     *
     * @memberof! Loader#
     * @protected
     * @return {ConfigParser} Instance of {@link ConfigParser} class.
     */
    _getConfigParser: function() { /* istanbul ignore else */
        if (!this._configParser) {
            this._configParser = new global.ConfigParser(this._config);
        }

        return this._configParser;
    },

    /**
     * Returns instance of {@link DependencyBuilder} class.
     *
     * @memberof! Loader#
     * @protected
     * @return {DependencyBuilder} Instance of {@link DependencyBuilder} class.
     */
    _getDependencyBuilder: function() {
        if (!this._dependencyBuilder) {
            this._dependencyBuilder = new global.DependencyBuilder(this._getConfigParser());
        }

        return this._dependencyBuilder;
    },

    /**
     * Retrieves a value from the global namespace.
     *
     * @memberof! Loader#
     * @protected
     * @param {String} exports The key which should be used to retrieve the value.
     * @return {Any} The retrieved value.
     */
    _getValueGlobalNS: function(exports) {
        return (0, eval)('this')[exports];
    },

    /**
     * Returns an array of all missing dependencies of the passed modules.
     * A missing dependency is a dependency, which does not have pending implementation yet.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} moduleNames List of module names to be checked for missing dependencies.
     * @return {Array<string>} A list with all missing dependencies.
     */
    _getMissingDepenencies: function(moduleNames) {
        var configParser = this._getConfigParser();
        var registeredModules = configParser.getModules();

        var missingDependencies = Object.create(null);

        for (var i = 0; i < moduleNames.length; i++) {
            var module = registeredModules[moduleNames[i]];

            var mappedDependencies = configParser.mapModule(module.dependencies);

            for (var j = 0; j < mappedDependencies.length; j++) {
                var dependency = mappedDependencies[j];

                var dependencyModule = registeredModules[dependency];

                if (dependency !== 'exports' && dependency !== 'module' && (!dependencyModule || !dependencyModule.pendingImplementation)) {
                    missingDependencies[dependency] = 1;
                }
            }
        }

        return Object.keys(missingDependencies);
    },

    /**
     * Retrieves module implementations to an array.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} requiredModules Lit of modules, which implementations will be added to an array.
     * @return {array} List of modules implementations.
     */
    _getModuleImplementations: function(requiredModules) {
        var moduleImplementations = [];

        var modules = this._getConfigParser().getModules();

        for (var i = 0; i < requiredModules.length; i++) {
            var requiredModule = modules[requiredModules[i]];

            moduleImplementations.push(requiredModule ? requiredModule.implementation : undefined);
        }

        return moduleImplementations;
    },

    /**
     * Returns an instance of {@link PathResolver} class.
     *
     * @memberof! Loader#
     * @protected
     * @return {PathResolver} Instance of {@link PathResolver} class.
     */
    _getPathResolver: function() {
        if (!this._pathResolver) {
            this._pathResolver = new global.PathResolver();
        }

        return this._pathResolver;
    },

    /**
     * Returns instance of {@link URLBuilder} class.
     *
     * @memberof! Loader#
     * @protected
     * @return {URLBuilder} Instance of {@link URLBuilder} class.
     */
    _getURLBuilder: function() { /* istanbul ignore else */
        if (!this._urlBuilder) {
            this._urlBuilder = new global.URLBuilder(this._getConfigParser());
        }

        return this._urlBuilder;
    },

    /**
     * Filters a list of modules and returns only these which don't have any of the provided list
     * of properties.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} modules List of modules which which have to be filtered.
     * @return {array} List of modules matching the specified filter.
     */
    _filterModulesByProperty: function(moduleNames, property) {
        var properties = property;

        if (typeof property === 'string') {
            properties = [property];
        }

        var missingModules = [];

        var registeredModules = this._getConfigParser().getModules();

        for (var i = 0; i < moduleNames.length; i++) {
            var moduleName = moduleNames[i];

            var registeredModule = registeredModules[moduleNames[i]];

            if (!registeredModule) {
                missingModules.push(moduleName);
                continue;
            }

            // We exclude "exports" and "module" modules, which are part of AMD spec.
            if (registeredModule === 'exports' || registeredModule === 'module') {
                continue;
            }

            for (var found = 0, j = 0; j < properties.length; j++) {
                if (registeredModule[properties[j]]) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                missingModules.push(moduleName);
            }
        }

        return missingModules;
    },

    /**
     * Loads list of modules.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} modules List of modules to be loaded.
     * @return {Promise} Promise, which will be resolved as soon as all module a being loaded.
     */
    _loadModules: function(moduleNames) {
        var self = this;

        return new Promise(function(resolve, reject) {
            // Get all modules without pending implementation or not yet requested
            var modulesForLoading = self._filterModulesByProperty(moduleNames, ['requested', 'pendingImplementation']);

            if (modulesForLoading.length) {
                // If there are modules, which have to be loaded, construct their URLs
                var modulesURL = self._getURLBuilder().build(modulesForLoading);

                var pendingScripts = [];

                // Create promises for each of the scripts, which should be loaded
                for (var i = 0; i < modulesURL.length; i++) {
                    pendingScripts.push(self._loadScript(modulesURL[i]));
                }

                // Wait for resolving all script Promises
                // As soon as that happens, wait for each module to define itself

                void 0;
                Promise.all(pendingScripts).then(function(loadedScripts) {
                        return self._waitForModules(moduleNames);
                    })
                    // As soon as all scripts were loaded and all dependencies have been resolved,
                    // resolve the main Promise
                    .then(function(loadedModules) {
                        resolve(loadedModules);
                    })
                    // If any script fails to load or other error happens,
                    // reject the main Promise
                    .catch(function(error) {
                        reject(error);
                    });
            } else {
                // If there are no any missing modules, just wait for modules dependencies
                // to be resolved and then resolve the main promise
                self._waitForModules(moduleNames).then(function(loadedModules) {
                        resolve(loadedModules);
                    })
                    // If some error happens, for example if some module implementation
                    // throws error, reject the main Promise
                    .catch(function(error) {
                        reject(error);
                    });
            }
        });
    },

    /**
     * Loads a &ltscript&gt element on the page.
     *
     * @memberof! Loader#
     * @protected
     * @param {object} modulesURL An Object with two properties:
     * - modules - List of the modules which should be loaded
     * - url - The URL from which the modules should be loaded
     * @return {Promise} Promise which will be resolved as soon as the script is being loaded.
     */
    _loadScript: function(modulesURL) {
        var self = this;

        return new Promise(function(resolve, reject) {
            var script = document.createElement('script');

            script.src = modulesURL.url;

            // On ready state change is needed for IE < 9, not sure if that is needed anymore,
            // it depends which browsers will we support at the end
            script.onload = script.onreadystatechange = function() { /* istanbul ignore else */
                if (!this.readyState || /* istanbul ignore next */ this.readyState === 'complete' || /* istanbul ignore next */ this.readyState === 'load') {

                    script.onload = script.onreadystatechange = null;

                    resolve(script);

                    self.emit('scriptLoaded', modulesURL.modules);
                }
            };

            // If some script fails to load, reject the main Promise
            script.onerror = function() {
                document.head.removeChild(script);

                reject(script);
            };

            document.head.appendChild(script);
        });
    },

    /**
     * Resolves modules dependencies.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} modules List of modules which dependencies should be resolved.
     * @return {Promise} Promise which will be resolved as soon as all dependencies are being resolved.
     */
    _resolveDependencies: function(modules) {
        var self = this;

        return new Promise(function(resolve, reject) {
            try {
                var dependencies = self._getDependencyBuilder().resolveDependencies(modules);

                resolve(dependencies);
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Reports a mismatched anonymous module error. Depending on the value of the configuration property
     * `__CONFIG__.reportMismatchedAnonymousModules`, this method will throw an error, use the console[level]
     * method to log the message or silently ignore it.
     *
     * @memberof! Loader#
     * @protected
     * @param {string} msg Additional information to log with the error.
     */
    _reportMismatchedAnonymousModules: function(msg) {
        var errorMessage = 'Mismatched anonymous define() module: ' + msg;
        var reportLevel = this._config.reportMismatchedAnonymousModules;

        if (!reportLevel || reportLevel === 'exception') {
            throw new Error(errorMessage);
        } else if (console && console[reportLevel]) {
            // Call console's method by using the `call` function
            // to prevent stripDebug to remove the statement in production
            console[reportLevel].call(console, errorMessage);
        }
    },

    /**
     * Invokes the implementation method of list of modules passing the implementations of its dependencies.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} modules List of modules to which implementation should be set.
     */
    _setModuleImplementation: function(modules) {
        var registeredModules = this._getConfigParser().getModules();

        for (var i = 0; i < modules.length; i++) {
            var module = modules[i];

            if (module.implementation) {
                continue;
            } else if (module.exports) {
                module.pendingImplementation = module.implementation = this._getValueGlobalNS(module.exports);
                continue;
            }

            var dependencyImplementations = [];

            // Leave exports implementation undefined by default
            var exportsImpl;
            var configParser = this._getConfigParser();

            for (var j = 0; j < module.dependencies.length; j++) {
                var dependency = module.dependencies[j];

                // If the current dependency of this module is 'exports',
                // create an empty object and pass it as implementation of
                // 'exports' module
                if (dependency === 'exports') {
                    exportsImpl = {};

                    dependencyImplementations.push(exportsImpl);
                } else if (dependency === 'module') {
                    exportsImpl = { exports: {} };

                    dependencyImplementations.push(exportsImpl);
                } else {
                    // otherwise set as value the implementation of the registered module
                    var dependencyModule = registeredModules[configParser.mapModule(dependency)];

                    var impl = dependencyModule.implementation;

                    dependencyImplementations.push(impl);
                }
            }

            var result;

            if (typeof module.pendingImplementation === 'function') {
                result = module.pendingImplementation.apply(module.pendingImplementation, dependencyImplementations);
            } else {
                result = module.pendingImplementation;
            }

            // Store as implementation either the returned value from the function's invocation,
            // or one of these:
            // 1. If the passed object has 'exports' property (in case of 'module' dependency), get this one.
            // 2. Otherwise, get the passed object itself (in case of 'exports' dependency)
            //
            // The final implementation of this module may be undefined if there is no
            // returned value, or the object does not have 'exports' or 'module' dependency.
            if (result) {
                module.implementation = result;
            } else if (exportsImpl) {
                module.implementation = exportsImpl.exports || exportsImpl;
            }
        }
    },

    /**
     * Resolves a Promise as soon as all module dependencies are being resolved or it has implementation already.
     *
     * @memberof! Loader#
     * @protected
     * @param {Object} module The module for which this function should wait.
     * @return {Promise}
     */
    _waitForModule: function(moduleName) {
        var self = this;

        // Check if there is already a promise for this module.
        // If there is not - create one and store it to module promises map.
        var modulePromise = self._modulesMap[moduleName];

        if (!modulePromise) {
            modulePromise = self._createModulePromise(moduleName);

            self._modulesMap[moduleName] = modulePromise;
        }

        return modulePromise;
    },

    /**
     * Resolves a Promise as soon as all dependencies of all provided modules are being resolved and modules have
     * implementations.
     *
     * @memberof! Loader#
     * @protected
     * @param {array} modules List of modules for which implementations this function should wait.
     * @return {Promise}
     */
    _waitForModules: function(moduleNames) {
        var self = this;

        return new Promise(function(resolve, reject) {
            var modulesPromises = [];

            for (var i = 0; i < moduleNames.length; i++) {
                modulesPromises.push(self._waitForModule(moduleNames[i]));
            }

            // Wait until all modules were loaded and their Promises resolved
            Promise.all(modulesPromises).then(function(uselessPromises) {
                // The modules were loaded. However, we have to check their dependencies
                // one more time, because some dependencies might have not been registered in the configuration.
                // In this case we have to load them too, otherwise we won't be able to properly
                // get the implementation from the module.
                var registeredModules = self._getConfigParser().getModules();

                var defineModules = function() {
                    var definedModules = [];

                    for (var i = 0; i < moduleNames.length; i++) {
                        definedModules.push(registeredModules[moduleNames[i]]);
                    }

                    self._setModuleImplementation(definedModules);

                    resolve(definedModules);
                };

                var missingDependencies = self._getMissingDepenencies(moduleNames);

                if (missingDependencies.length) {
                    void 0;
                    self.require(missingDependencies, defineModules, reject);
                } else {
                    defineModules();
                }
            }, reject);
        });
    }

    /**
     * Indicates that a module has been registered.
     *
     * @event Loader#moduleRegister
     * @param {Object} module - The registered module.
     */
};

Object.keys(LoaderProtoMethods).forEach(function(key) {
    Loader.prototype[key] = LoaderProtoMethods[key];
});


    return Loader;
}));

	window.Loader = global.Loader;
    window.require = global.require;
    window.define = global.define;
}());