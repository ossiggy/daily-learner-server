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

function tearDownDb() {
  return new Promise((resolve, reject) => {
    console.warn('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject(err))
  });
}

describe('Article endpoints', () => {

  let authToken;
  let articleID;
    
  const mockArticle = {
    title: faker.lorem.word,
    content: faker.lorem.word,
    category: faker.lorem.word
  }

  function createMockUser(){
    console.info('creating mock user');
    return chai.request(app)
    .post('/api/users/')
    .send({username: 'username', password: 'password', email: 'email@email.com'})
    .then(res =>  seedArticleData(res.body.id))
    .then(() => logUserIn())
    .catch(err => console.log(err))
  }
  
  function seedArticleData(parentID) {
    console.info('seeding article data');
    return Article.create(mockArticle)
      .then(article => {
        article._parent = parentID;
        return chai.request(app)
          .post('/api/articles')
          .send(article)
          .then(res =>  articleID = res.body.id)
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

  before(() => {
    return runServer(TEST_DATABASE_URL)
  })

  afterEach(() => {
    return tearDownDb()
  })

  after(() => {
    return closeServer()
  })

  describe('GET requests', () => {

    beforeEach(() => {
      return createMockUser()
    })

    it('Should reject unauthorized requests', () => {
      return chai.request(app)
        .get('/api/articles')
        .set('Autorization', 'Bearer IamAuthorized')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
          expect(res.text).to.equal('Unauthorized')
      });

    })

    it('Should return all user articles on root request', () => {
    let _res;
    return chai.request(app)
      .get('/api/articles')
      .set('Authorization', `Bearer ${authToken}`)
      .then(res => {
        _res = res;
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

    it('Should return a specific article on GET by id', () => {
      let _res;
      return chai.request(app)
        .get(`/api/articles/${articleID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .then(res => {
          _res = res;
          expect(res.body).to.be.a('object');
          expect(res).to.be.json;
          const expectedKeys = ['_parent', 'id', 'title', 'content', 'dateCreated', 'category'];
          expect(res.body).to.have.keys(expectedKeys);
          const resArticle = res.body;
          return Article.findById(resArticle.id).exec()
        })
        .then(article => {
          const resArticle = _res.body;
          expect(resArticle._parent).to.deep.equal(`${article._parent}`);
          expect(resArticle.id).to.deep.equal(article.id);
          expect(resArticle.title).to.deep.equal(article.title);
          expect(resArticle.content).to.deep.equal(article.content);
          expect(resArticle.category).to.deep.equal(article.category);
        })
    })
  })


  describe('POST requests', () => {

    it('Should reject articles with missing fields', () => {
      return chai.request(app)
      .post('/api/articles')
      .send({title: 'title', content: 'content'})
      .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(500);
      });
    });
    
    it('Should post the article on root request', () => {
      let _res;
      Article.create(mockArticle)
        .then(article => {
          article._parent = new ObjectID;
          return chai.request(app)
          .post('/api/articles')
          .send(article)
          .then(res => {
            _res = res;
            expect(res).to.have.status(201)
            expect(res.body).to.be.a('object');
            expect(res).to.be.json;
            const expectedKeys = ['_parent', 'id', 'title', 'content', 'dateCreated', 'category'];
            expect(res.body).to.have.keys(expectedKeys);
            const resArticle = res.body;
            return Article.findById(resArticle.id).exec()
          })
          .then(article => {
            const resArticle = _res.body;
            expect(resArticle._parent).to.deep.equal(`${article._parent}`);
            expect(resArticle.id).to.deep.equal(article.id);
            expect(resArticle.title).to.deep.equal(article.title);
            expect(resArticle.content).to.deep.equal(article.content);
            expect(resArticle.category).to.deep.equal(article.category);
          })
        })
    })
  })

  describe('PUT requests', () => {

    beforeEach(function(){
      return createMockUser()
    })

    it('Should reject unauthorized requests', () => {
      return chai.request(app)
        .put(`/api/articles/${articleID}`)
        .set('Authorization', 'Bearer IamAuthorized099')
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
          expect(res.text).to.equal('Unauthorized')
        });
    })

    it('Should reject requests with wrong article id', () => {

      const falseArticle = {
        'id': '123456789',
        'title': 'New Title',
        'content': 'New Content',
        'category': 'New Category'
      }

      return chai.request(app)
      .put(`/api/articles/${articleID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(falseArticle)
      .then(() =>
        expect.fail(null, null, 'Request should not succeed'))
      .catch(err => {
        if (err instanceof chai.AssertionError) {
          throw err;
        }
        const res = err.response;
        expect(res).to.have.status(400);
        expect(res.body.message).to.equal(`Request patch id (${articleID} and request body id (123456789) must match)`)
      });
    })

    it('Should update the correct article by id', () => {
      const updatedArticle = {
        'id': articleID,
        'title': 'New Title',
        'content': 'New Content',
        'category': 'New Category'
      }
      let _res;
      return chai.request(app)
      .put(`/api/articles/${articleID}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updatedArticle)
      .then(res => {
        expect(res).to.have.status(204);
        return Article.findById(articleID).exec()
      })
      .then(article => {
        expect(article.title).to.deep.equal('New Title');
        expect(article.content).to.deep.equal('New Content');
        expect(article.category).to.deep.equal('New Category');
      })
    })
  })

  describe('DELETE requests', () => {

    beforeEach(function() {
      return createMockUser()
    })

    it('Should reject unauthorized requests', () => {
      return chai.request(app)
        .delete(`/api/articles/${articleID}`)
        .then(() =>
          expect.fail(null, null, 'Request should not succeed'))
        .catch(err => {
          if (err instanceof chai.AssertionError) {
            throw err;
          }
          const res = err.response;
          expect(res).to.have.status(401);
          expect(res.text).to.equal('Unauthorized');
        })
    })

    it('Should delete the correct article by id', () => {
      return chai.request(app)
        .delete(`/api/articles/${articleID}`)
        .set('Authorization', `Bearer ${authToken}`)
        .then(res => {
          expect(res).to.have.status(204)
        })
    })
  })
})