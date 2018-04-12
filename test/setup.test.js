'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const mongoose = require('mongoose');
const faker = require('faker');
const {ObjectID} = require('mongodb');
const {TEST_DATABASE_URL, JWT_EXPIRY, JWT_SECRET} = require('../config');
const {dbConnect, dbDisconnect} = require('../db-mongoose');
const {app, runServer, closeServer} = require('../index');

const {Article} = require('../articles');
const {User} = require('../users');
const {jwtAuth} = require('../auth');

process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const expect = chai.expect;
const should = chai.should;

chai.use(chaiHttp);

const mockArticle = {
  title: faker.lorem.word,
  content: faker.lorem.word,
  dateCreated: faker.date.past,
  category: faker.lorem.word
}

function seedUserData() {
  console.info('seeding user data')
  return User.create(mockUser)
}

function seedArticleData() {
  console.info('seeding article data')
}

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

    it('should be properly setup', function() {
        expect(true).to.be.true;
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

describe('Auth endpoints', function() {
  const username = 'exampleUser';
  const password = 'examplePass';
  const email = 'email@email.com';
  let _id;

  before(function() {
      return runServer();
  });

  after(function() {
      return closeServer();
  });

  beforeEach(function() {
      return User.hashPassword(password).then(password =>
          User.create({
              username,
              password,
              email
          })
      ).then((user) => _id = user.id);
  });

  afterEach(function() {
      return User.remove({});
  });

  describe('/api/auth/login', function() {
      it('Should reject requests with no credentials', function() {
          return chai
              .request(app)
              .post('/api/auth/login')
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(400);
              });
      });
      it('Should reject requests with incorrect usernames', function() {
          return chai
              .request(app)
              .post('/api/auth/login')
              .auth('wrongUsername', password)
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(400);
              });
      });
      it('Should reject requests with incorrect passwords', function() {
          return chai
              .request(app)
              .post('/api/auth/login')
              .auth(username, 'wrongPassword')
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(400);
              });
      });
      it('Should return a valid auth token', function() {
          return chai
              .request(app)
              .post('/api/auth/login')
              .send({username, password})
              .then(res => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('object');
                  const token = res.body.authToken;
                  expect(token).to.be.a('string');
                  const payload = jwt.verify(token, JWT_SECRET, {
                      algorithm: ['HS256']
                  });
                  expect(payload.user).to.contain({
                      username
                  });
                  expect(payload.user.id).to.equal(_id);
              });
      });
  });

  describe('/api/auth/refresh', function() {
      it('Should reject requests with no credentials', function() {
          return chai
              .request(app)
              .post('/api/auth/refresh')
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(401);
              });
      });
      it('Should reject requests with an invalid token', function() {
          const token = jwt.sign(
              {
                  username,
                  email
              },
              'wrongSecret',
              {
                  algorithm: 'HS256',
                  expiresIn: '7d'
              }
          );

          return chai
              .request(app)
              .post('/api/auth/refresh')
              .set('Authorization', `Bearer ${token}`)
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(401);
              });
      });
      it('Should reject requests with an expired token', function() {
          const token = jwt.sign(
              {
                  user: {
                      username,
                      email
                  },
                  exp: Math.floor(Date.now() / 1000) - 10 // Expired ten seconds ago
              },
              JWT_SECRET,
              {
                  algorithm: 'HS256',
                  subject: username
              }
          );

          return chai
              .request(app)
              .post('/api/auth/refresh')
              .set('authorization', `Bearer ${token}`)
              .then(() =>
                  expect.fail(null, null, 'Request should not succeed')
              )
              .catch(err => {
                  if (err instanceof chai.AssertionError) {
                      throw err;
                  }

                  const res = err.response;
                  expect(res).to.have.status(401);
              });
      });
      it('Should return a valid auth token with a newer expiry date', function() {
          const token = jwt.sign(
              {
                  user: {
                      username,
                      email
                  }
              },
              JWT_SECRET,
              {
                  algorithm: 'HS256',
                  subject: username,
                  expiresIn: '7d'
              }
          );
          const decoded = jwt.decode(token);

          return chai
              .request(app)
              .post('/api/auth/refresh')
              .set('authorization', `Bearer ${token}`)
              .then(res => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.be.an('object');
                  const token = res.body.authToken;
                  expect(token).to.be.a('string');
                  const payload = jwt.verify(token, JWT_SECRET, {
                      algorithm: ['HS256']
                  });
                  expect(payload.user).to.deep.equal({
                      username,
                      email
                  });
                  expect(payload.exp).to.be.at.least(decoded.exp);
              });
      });
  });
});
