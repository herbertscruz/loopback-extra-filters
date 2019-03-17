/**
   * Resolve a função assícrona como promesa ou função com callback.
   *
   * @param {AsyncFunction} asyncFunction
   * @param {Array} args
   * @param {Function=} callback
   * @returns {null|Promise}
   */
  function resolveAsyncFunction(asyncFunction, args, callback) {
    if (!callback) return asyncFunction(...args);
    const result = asyncFunction(...args);
    result.then(data => callback(null, data));
    result.catch(callback);
  }

  module.exports = {
    resolveAsyncFunction,
  };