var _ = require('lodash');
var SailsDiskAdapter = require('sails-disk');
var Waterline = require('waterline');

class LandSailsIsland {
  constructor(endpoint, routes, actions, models) {

    var configure = () => {
      this._endpoint = endpoint;
      this.routes = routes;
      this.actions = actions;
      this.models = {};

      this.waterlineOptions = {
        adapters: {
          'sails-disk': SailsDiskAdapter,
        },
        datastores: {
          default: {
            adapter: 'sails-disk',
            //inMemoryOnly: true,
            dir: '/db.db'
          }
        },
        models: {},
        defaultModelSettings: {
          datastore: 'default',
          primaryKey: 'id',
          schema: false,
          archiveModelIdentity: false,
          attributes: {
            createdAt: {
              type: 'number',
              autoCreatedAt: true,
            },
            updatedAt: {
              type: 'number',
              autoUpdatedAt: true,
            },
            deletedAt: {
              type: 'number',
              defaultsTo: 0
            },
            deleted: {
              type: 'boolean',
              defaultsTo: false
            },
            id: {
              type: 'number',
              autoMigrations: {
                autoIncrement: true
              },
            },
          }
        }

      };

      for (var i in models) {
        models[i] = this.prepareModelAttributes(models[i]);
        this.waterlineOptions.models[i] = _.merge({
          identity: i
        }, models[i]);
      }

      console.log('Landsails Models:', this.waterlineOptions.models);
    };

    if (BrowserFS) {
      BrowserFS.configure({
        fs: "LocalStorage"
      }, function (e) {
        if (e) {
          // An error happened!
          throw e;
        }
        // Otherwise, BrowserFS is ready-to-use!
        configure();
      });
    } else
      configure();
  }

  start() {
    return new Promise((resolve, reject) => {

      Waterline.start(this.waterlineOptions, async (err, orm) => {
        if (err)
          return reject(err);

        console.log('Started Waterline');

        for (var i in this.waterlineOptions.models) {

          this.models[i] = Waterline.getModel(i, orm);

        }

        resolve(this);

      });

    });
  }

  prepareModelAttributes(model) {

    var autoMigrationsFields = [
      'unique',
      'autoIncrement',
      'autoUpdatedAt',
      'autoCreatedAt',
      'columnType'
    ];

    var validationsFields = [
      'isEmail',
      'maxLength',
      'isIn'
    ];

    if (_.isUndefined(model.attributes))
      return model;

    for (var i in model.attributes) {

      if (_.isObjectLike(model.attributes[i])) {

        if (_.isUndefined(model.attributes[i].autoMigrations))
          model.attributes[i].autoMigrations = {};

        if (_.isUndefined(model.attributes[i].validations))
          model.attributes[i].validations = {};

        for (var j in model.attributes[i]) {

          if (autoMigrationsFields.indexOf(j) !== -1) {
            model.attributes[i].autoMigrations[j] = model.attributes[i][j];
            delete model.attributes[i][j];
          }

          if (validationsFields.indexOf(j) !== -1) {
            model.attributes[i].validations[j] = model.attributes[i][j];
            delete model.attributes[i][j];
          }

        }
      }

    }

    return model;

  }

  processRoutes() {
    console.log('Routes:', this.routes);
    for (var route in this.routes) {



    }


  }
}

module.exports = LandSailsIsland;
