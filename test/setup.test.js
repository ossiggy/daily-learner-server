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

process.env.NODE_ENV = 'test';

// Clear the console before each run
process.stdout.write('\x1Bc\n');

const expect = chai.expect;
const should = chai.should;

chai.use(chaiHttp);

let authToken;


function createMockUser(){
  console.info('creating mock user');
  return chai.request(app)
  .post('/api/users/')
  .send({username: 'username', password: 'password', email: 'email@email.com'})
  .then(res => seedArticleData(res.body.id))
  .then(() => logUserIn())
  .catch(err => console.log(err))
}

function seedArticleData(parentID) {
  console.info('seeding article data');
  const mockArticle = {
    title: faker.lorem.word,
    content: faker.lorem.word,
    category: faker.lorem.word
  }
  return Article.create(mockArticle)
    .then(article => {
      article._parent = parentID;
      return chai.request(app)
        .post('/api/articles')
        .send(article)
        .then(res => console.log(res.body._parent))
        .catch(err => console.log(err))
    })
  .catch(err => console.log(err)) 
};

function logUserIn(){
  console.info('logging in');
  return chai.request(app)
    .post('/api/auth/login')
    .send({username: 'username', password: 'password'})
    .then(res => authToken = res.body.authToken)
    .catch(err => console.log(err))
}

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err))
  });
}

describe('Article endpoints', () => {

  before(function(){
    return runServer(TEST_DATABASE_URL)
  })

  beforeEach(function(){
    return createMockUser()
  })

  afterEach(function(){
    return tearDownDb()
  })

  after(function(){
    return closeServer()
  })

  describe('GET endpoint', () => {
    it('Should return all user articles on root request', () => {
    let _res;
    return chai.request(app)
      .get('/api/articles')
      .set('Authorization', `Bearer ${authToken}`)
      .then(function(res){
        _res = res;
        console.log(res.body)
        expect(res.body).to.be.a('array');
        expect(res).to.be.json;
        const expectedKeys = ['_parent', 'id', 'title', 'content', 'dateCreated', 'category'];
        expect(res.body[0]).to.have.keys(expectedKeys);
        const resArticle = res.body[0];
        return Article.findById(resArticle.id).exec()
      })
      .then(article => {
        const resArticle = _res.body[0];
        expect(resArticle._parent).to.deep.equal(`${article._parent}`);
        expect(resArticle.id).to.deep.equal(article.id);
        expect(resArticle.title).to.deep.equal(article.title);
        expect(resArticle.content).to.deep.equal(article.content);
        expect(resArticle.category).to.deep.equal(article.category);
      })
    })
  })


})