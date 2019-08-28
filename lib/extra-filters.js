'use strict';

const _ = require('lodash');

class ExtraFilters {

  constructor(model) {
    this._model = model;
  }

  /**
   * @param {Array} data
   * @param {Object} filter
   */
  apply(data, filter) {
    if (!filter) return data;
    return _.filter(data, item => this._isValid(item, filter));
  }

  /**
   * @param {Object} include
   * @returns {Array}
   * @private
   */
  _toArrayInclude(include) {
    const validObject = include => (!include.relation) ? null : include;
    if (!include) return [];
    if (_.isString(include)) return [{relation: include}];
    if (_.isArray(include)) {
      return _.compact(_.map(include, item => {
        if (_.isString(item)) return {relation: include};
        return validObject(item);
      }));
    } else {
      return _.compact([validObject(include)]);
    }
  }

  /**
   * @param {Object} data
   * @param {Object} filter
   * @returns {boolean}
   * @private
   */
  _isValid(data, filter) {
    if (!filter) return true;
    const includes = this._toArrayInclude(filter.include);
    _.each(includes, include => {
      const relationData = _.get(data, `__data${include.relation}`);
      if (!_.isEmpty(relationData)) {
        if (_.isArray(relationData)) {
          const result = this.apply(data.__data[include.relation], include.scope);
          data.__cachedRelations[include.relation] = result;
          data.__data[include.relation] = result;
        } else {
          const isValid = this._isValid(data.__data[include.relation], include.scope);
          if (!isValid) {
            data.__cachedRelations = _.omit(data.__cachedRelations, [include.relation]);
            data.__data = _.omit(data.__data, [include.relation]);
          }
        }
      }
    });
    if (!this._hasFilter(data.__data, filter, includes)) return false;
    if (!this._notHasFilter(data.__data, filter, includes)) return false;
    if (!this._isEmptyFilter(data.__data, filter, includes)) return false;
    if (!this._isNotEmptyFilter(data.__data, filter, includes)) return false;

    return true;
  }

  /**
   * @param {Object} data
   * @param {Object} filter
   * @param {Array} includes
   * @returns {boolean}
   * @private
   */
  _hasFilter(data, filter, includes) {
    if (!filter.has) return true;
    if (_.isString(filter.has)) filter.has = [filter.has];
    if (!_.isArray(filter.has)) return true;
    return _.every(filter.has, field => {
      if (!this._isRelationWithoutInclude(field, includes)) {
        if (!_.has(data, field)) return false;
      }
      return true;
    });
  }

  /**
   * @param {Object} data
   * @param {Object} filter
   * @param {Array} includes
   * @returns {boolean}
   * @private
   */
  _notHasFilter(data, filter, includes) {
    if (!filter.notHas) return true;
    if (_.isString(filter.notHas)) filter.notHas = [filter.notHas];
    if (!_.isArray(filter.notHas)) return true;
    return _.every(filter.notHas, field => {
      if (!this._isRelationWithoutInclude(field, includes)) {
        if (_.has(data, field)) return false;
      }
      return true;
    });
  }

  /**
   * @param {Object} data
   * @param {Object} filter
   * @param {Array} includes
   * @returns {boolean}
   * @private
   */
  _isEmptyFilter(data, filter, includes) {
    if (!filter.isEmpty) return true;
    if (_.isString(filter.isEmpty)) filter.isEmpty = [filter.isEmpty];
    if (!_.isArray(filter.isEmpty)) return true;
    return _.every(filter.isEmpty, field => {
      if (!this._isRelationWithoutInclude(field, includes)) {
        if (!_.isEmpty(data[field])) return false;
      }
      return true;
    });
  };

  /**
   * @param {Object} data
   * @param {Object} filter
   * @param {Array} includes
   * @returns {boolean}
   * @private
   */
  _isNotEmptyFilter(data, filter, includes) {
    if (!filter.isNotEmpty) return true;
    if (_.isString(filter.isNotEmpty)) filter.isNotEmpty = [filter.isNotEmpty];
    if (!_.isArray(filter.isNotEmpty)) return true;
    return _.every(filter.isNotEmpty, field => {
      if (!this._isRelationWithoutInclude(field, includes)) {
        if (_.isEmpty(data[field])) return false;
      }
      return true;
    });
  }

  /**
   * @param {String} field
   * @param {Array} includes
   * @private
   */
  _isRelationWithoutInclude(field, includes) {
    if (!_.includes(Object.keys(this._model.settings.relations), field)) return false;
    const includesRelationsNames = _.map(includes, include => include.relation);
    return (!_.includes(includesRelationsNames, field));
  }
};

Object.defineProperty(ExtraFilters, 'NAMES', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: ['has', 'notHas', 'isEmpty', 'isNotEmpty'],
});

module.exports = ExtraFilters;
