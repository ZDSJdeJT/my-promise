const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

const resolveMyPromise = (prev, cur, resolve, reject) => {
  if (prev === cur) {
    throw new TypeError("Chaining cycle detected for promise");
  }
  let then;
  if (prev instanceof MyPromise) {
    prev.then((value) => {
      resolveMyPromise(value, cur, resolve, reject);
    }, reject);
  } else if (
    prev !== null &&
    (typeof prev === "object" || typeof prev === "function")
  ) {
    try {
      then = prev.then;
    } catch (e) {
      reject(e);
      return;
    }
    if (typeof then === "function") {
      let called = false;
      try {
        then.call(
          prev,
          (value) => {
            if (called) {
              return;
            }
            called = true;
            resolveMyPromise(value, cur, resolve, reject);
          },
          (value) => {
            if (called) {
              return;
            }
            called = true;
            reject(value);
          },
        );
      } catch (e) {
        if (called) {
          return;
        }
        called = true;
        reject(e);
      }
    } else {
      resolve(prev);
    }
  } else {
    resolve(prev);
  }
};

export class MyPromise {
  #state = PENDING;

  #value;

  #onResolveCallbacks = [];
  #onRejectCallbacks = [];

  constructor(executor) {
    try {
      executor(this.resolve.bind(this), this.reject.bind(this));
    } catch (error) {
      this.reject(error);
    }
  }

  resolve(result) {
    if (this.#state === PENDING) {
      this.#state = FULFILLED;
      this.#value = result;
      this.#onResolveCallbacks.forEach((callback) => {
        callback();
      });
    }
  }

  reject(reason) {
    if (this.#state === PENDING) {
      this.#state = REJECTED;
      this.#value = reason;
      this.#onRejectCallbacks.forEach((callback) => {
        callback();
      });
    }
  }

  then(onResolve, onReject) {
    const myPromise = new MyPromise((resolve, reject) => {
      if (this.#state === FULFILLED) {
        queueMicrotask(() => {
          try {
            if (typeof onResolve === "function") {
              resolveMyPromise(
                onResolve(this.#value),
                myPromise,
                resolve,
                reject,
              );
            } else {
              resolve(this.#value);
            }
          } catch (e) {
            reject(e);
          }
        });
      } else if (this.#state === REJECTED) {
        queueMicrotask(() => {
          try {
            if (typeof onReject === "function") {
              resolveMyPromise(
                onReject(this.#value),
                myPromise,
                resolve,
                reject,
              );
            } else {
              reject(this.#value);
            }
          } catch (e) {
            reject(e);
          }
        });
      } else {
        this.#onResolveCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              if (typeof onResolve === "function") {
                resolveMyPromise(
                  onResolve(this.#value),
                  myPromise,
                  resolve,
                  reject,
                );
              } else {
                resolve(this.#value);
              }
            } catch (e) {
              reject(e);
            }
          });
        });
        this.#onRejectCallbacks.push(() => {
          queueMicrotask(() => {
            try {
              if (typeof onReject === "function") {
                resolveMyPromise(
                  onReject(this.#value),
                  myPromise,
                  resolve,
                  reject,
                );
              } else {
                reject(this.#value);
              }
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });
    return myPromise;
  }
}
