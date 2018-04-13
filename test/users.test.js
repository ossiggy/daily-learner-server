'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const {TEST_DATABASE_URL} = require('../config');
const {dbConnect, dbDisconnect} = require('../db-mongoose');
const {app, runServer, closeServer} = require('../index');

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

describe('User endpoint', function() {

  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  afterEach(function(){
    return tearDownDb()
  })

  after(function() {
      return closeServer();
  });

    it('Should add a new user on POST', function () {
      return chai.request(app)
        .post('/api/users/')
        .send({username: 'username', password: 'password', email: 'email@email.com'})
        .then(function(res){
          expect(res.status).to.equal(201);
          const expectedKeys = ['id', 'username']
          expect(res.body).to.include.keys(expectedKeys)
          })
    })
});