'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const {TEST_DATABASE_URL} = require('../config');
const {dbConnect, dbDisconnect} = require('../db-mongoose');
const {app, runServer} = require('../index');

process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const expect = chai.expect;
const should = chai.should;

chai.use(chaiHttp);

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err))
  });
}

before(function() {
    return runServer(TEST_DATABASE_URL);
});

after(function() {
    return dbDisconnect();
});

describe('Daily Learner', function() {
    it('should be properly setup', function() {
        expect(true).to.be.true;
    });
    it('Should return user their articles on get', function () {
      let _res;
      return chai.request(app)
        .get('/users/')
        .then(function(res){
          res.should.have.status(204);
          res.should.be.json;
          res.body.forEach(function(article){
            const expectedKeys = ['_parent', '_id', 'title', 'dateCreated', 'content', 'category']
            article.should.include.keys(expectedKeys);
            article.title.should.be.a('string');
          })
        })
    })
});
