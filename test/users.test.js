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

describe('User endpoint', () => {

  function createMockUser(){
    console.info('creating mock user');
    return chai.request(app)
    .post('/api/users/')
    .send({username: 'username', password: 'password', email: 'email@email.com'})
    .catch(err => console.log(err))
  }

  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(() => {
    return createMockUser()
  })

  afterEach(() => {
    return tearDownDb()
  })

  after(() => {
      return closeServer();
  });

    it('Should add a new user on POST', () => {
      return chai.request(app)
        .post('/api/users/')
        .send({username: 'newuser', password: 'password', email: 'newemail@email.com'})
        .then(res => {
          expect(res.status).to.equal(201);
          const expectedKeys = ['id', 'username']
          expect(res.body).to.include.keys(expectedKeys)
          })
    })

    it('Should reject a new user with missing fields', () => {
      return chai.request(app)
        .post('/api/users')
        .send({username: 'newuser', email: 'newemail@email.com'})
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Missing field')
        });
    });

    it('Should reject a new user with a non string field', () => {
      return chai.request(app)
        .post('/api/users')
        .send({username: 123456, password:'password', email: 'newemail@email.com'})
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Incorrect field type: expected string')
        });
    });

    it('Should reject a new user with a non trimmed field', () => {
      return chai.request(app)
        .post('/api/users')
        .send({username: ' newuser', password:'password', email: 'newemail@email.com'})
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Cannot start or end with space')
        });
    });

    it('Should reject a new user with incorrect size fields', () => {
      return chai.request(app)
        .post('/api/users')
        .send({username: 'new', password:'password', email: 'newemail@email.com'})
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(422);
          expect(res.body.message).to.equal('Must be at least 5 characters long')
        });
    });

    it('Should reject a new user with existing username', () => {
      return chai.request(app)
      .post('/api/users/')
      .send({username: 'username', password: 'password', email: 'email@email.com'})
      .then(() =>
      expect.fail(null, null, 'Request should not succeed'))
      .catch(err => {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(422);
        expect(res.body.message).to.equal('Username unavailable')
      })
    })
});