'use strict';

const ExtraFilters = require('./extra-filters');
const {resolveAsyncFunction} = require('./utils');
const _ = require('lodash');

module.exports = class Boot {

  static apply(server) {
    // Atualiza todos as Models com os filtros extras e a altera a documentação do explorer
    server.models().forEach(Model => {
      // Sobescreve a função da lista.
      const override = Model.find;
      Model.find = function() {
        // Converte o objeto em array
        const args = [].slice.apply(arguments);
        const callback = (_.isFunction(_.last(args))) ? args.pop() : undefined;
        return resolveAsyncFunction(async (args, options) => {
          // Faz a consulta com o método padrão
          let data = await override.apply(Model, [args, options]);
          // Se tiver um filtro
          if (data) {
            // Executa filtros extras sobre o dado interceptado
            const extra = new ExtraFilters(Model);
            if (_.isArray(data)) {
              data = extra.apply(data, args);
            } else {
              data = extra.apply([data], args);
              data = data.shift();
            }
          }
          return data;
        }, args, callback);
      };
    });
  }
} 