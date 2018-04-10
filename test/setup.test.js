'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');
const {ObjectID} = require('mongodb');
const {TEST_DATABASE_URL} = require('../config');
const {dbConnect, dbDisconnect} = require('../db-mongoose');
const {app, runServer, closeServer} = require('../index');

const {Article} = require('../articles');
const {User} = require('../users');

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

const mockUser={
  username: 'username',
  password: 'password',
  email: 'email@email.com'
}

let UserId;

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

describe('Daily Learner', function() {

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
          const expectedKeys = ['id', 'username', 'firstName', 'lastName']
          expect(res.body).to.include.keys(expectedKeys)
          })
    })
});
