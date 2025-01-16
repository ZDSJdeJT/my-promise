import { MyPromise } from "./my-promise";

MyPromise.deferred = () => {
  const result = Object.create(null);
  result.promise = new MyPromise((resolve, reject) => {
    result.resolve = resolve;
    result.reject = reject;
  });
  return result;
};

export default MyPromise;
