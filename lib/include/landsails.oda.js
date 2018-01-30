var _ = require('lodash');

class LandSailsODA {

  constructor(options) {
    this.options = _.merge({
      transformer: function (oda) {

        if (oda.a == 'update') {
          if (oda.d[0].deleted) {
            oda.a = 'delete';
            oda.d = {
              id: oda.d[0].id
            };
          }
        }

        return oda;
      }
    }, options);

    this.patchMethods = [
      'find',
      'create',
      'findOne',
      'update',
      'delete',
      'addToCollection',
      'removeFromCollection'
    ];

    this.terminalMethods = [
      'fetch',
      'exec',
      'addToCollection',
      'removeFromCollection'
    ];

    this.changes = [];
  }


  intercept(propName) {
    if (this.patchMethods.indexOf(propName) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  interceptTerminal(propName) {
    if (this.terminalMethods.indexOf(propName) !== -1) {
      return true;
    } else {
      return false;
    }
  }

  resolveModelName(model) {

    for (var i in model.waterline.collections) {
      if (model.waterline.collections[i] === model)
        return i;
    }

    return false;
  }

  runHooks(oda) {

    if (this.options.transformer) {
      oda = this.options.transformer(oda);
    }

    return oda;
  }

  track(model) {
    var that = this;
    var oda = {
      o: '',
      d: {},
      a: ''
    }

    oda.o = this.resolveModelName(model);

    if (!oda.o) {
      throw new Error('ODA could not resolve model name');
      return;
    }

    function proxyModel(model) {
      return new Proxy(model, {
        get: (target, prop, recv) => {
          return function () {
            if (that.intercept(prop)) {
              console.log('intercept', prop);
              oda.a = prop;
              oda.d = _.values(arguments);
            }

            if (that.interceptTerminal(prop)) {
              console.log('interceptTerminal', prop);

              if (_.isFunction(target[prop])) {
                // This is a function, so it's assumed it will return a promise.

                console.log('interceptTerminal is function', prop);

                var r = target[prop].apply(target, arguments);

                r.then((data) => {

                  if (data)
                    oda.d = data;

                  oda = that.runHooks(oda);
                  that.changes.push(oda);
                  console.log('proxy complete', oda);


                }).catch((err) => {
                  throw new Error(err);
                  return;
                });

                return r;

              } else {
                console.log('interceptTerminal is not a function', prop);
                return target[prop];
              }

            } else {
              console.log('continuing', prop);
              if (_.isFunction(target[prop])) {
                console.log('recursing', prop);

                return proxyModel(target[prop].apply(target, arguments));

              } else {
                console.log('ending', prop);
                return target[prop];
              }

            }

          };


        }
      });
    }

    return proxyModel(model);

  }

  detach() {

    console.log('detach');
    var r = _.cloneDeep(this.changes);

    this.changes = [];

    return r;
  }

}

module.exports = LandSailsODA;
