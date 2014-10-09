var Waterline = require('../../../lib/waterline'),
  fantastico = require('redis-fantastico'),
  assert = require('assert'),
  async = require('async')
  _ = require('lodash');

describe('Query Caches Correctly', function() {

  describe('.exec() works with cache', function() {
    var query;

    before(function(done) {

      var waterline = new Waterline();
      var Model = Waterline.Collection.extend({
        identity: 'user',
        connection: 'foo',
        attributes: {
          name: {
            type: 'string',
            defaultsTo: 'Foo Bar'
          },
          doSomething: function() {}
        }
      });

      waterline.loadCollection(Model);

      // Fixture Adapter Def
      var adapterDef = {
        find: function(con, col, criteria, cb) {
          return cb(null, [criteria]);
        }
      };

      var connections = {
        'foo': {
          adapter: 'foobar'
        }
      };

      waterline.initialize({ adapters: { foobar: adapterDef }, connections: connections }, function(err, colls) {
        if (err) return done(err);
        query = colls.collections.user;
        done();
      });
    });

    it('should query fresh if data unavailable', function(done) {
      var location = null,
          setCalled = false;

      fantastico.instance = {
        getSlave: function () {
          return {client: {
            GET: function (key, callback) {
              location = key;
              setTimeout(function () {
                callback(null, null);
              }, 0);
            }
          }}
        },
        getMaster: function () {
          return {client: {
            SETEX: function (l, t, v, callback) {
              setCalled = true;

              assert(l === location);
              assert(t === 100);
              assert(v === '[null,[{"where":null}]]');
            }
          }};
        }
      };

      // .exec() usage
      query.find()
      .cache(100)
      .exec(function(err, results) {
        assert(!err);
        assert(setCalled);

        assert(JSON.stringify(results) === '[{"where":null}]');
        done();
      });
    });

    it('should return existing data if already there', function(done) {
      var setCalled = false;

      fantastico.instance = {
        getSlave: function () {
          return {client: {
            GET: function (key, callback) {
              setTimeout(function () {
                callback(null, JSON.stringify([null, {foo: 'bar'}]));
              }, 0);
            }
          }};
        },
        getMaster: function () {
          return {client: {
            SETEX: function () {
              setCalled = true;
            }
          }};
        }
      };

      // .exec() usage
      query.find()
      .cache(100)
      .exec(function(err, results) {
        assert(!err);
        assert(!setCalled);

        assert(JSON.stringify(results) === '{"foo":"bar"}');
        done();
      });
    });

  });
});
