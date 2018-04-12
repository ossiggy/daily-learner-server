const express = require('express')
const passport = require('passport')
const bodyParser = require('body-parser')
const cookieParsser = require('cookie-parser')
const router = express.Router();

const {jwtAuth} = require('../auth');

const jsonParser = bodyParser.json();

const {User} = require('./models');
const {Article} = require('../articles')

//user profile

router.get('/', jwtAuth, (req, res) => {

  User
    .find()
    .populate({
      path: 'article',
      model: 'Article',
    })  
    .exec(function(err, doc){
      res.send(doc)
    })
    .then(user => res.status(204))
})

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['username', 'password', 'email'];
  const missingField = requiredFields.find(field => !(field in req.body));

  if(missingField) {
    console.log('missing field')
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Missing field',
      location: missingField
    });
  };

  const stringFields = ['username', 'password', 'email'];
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== 'string'
  );

  if(nonStringField) {
    console.log('non string field')
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Incorrect field type: expected string',
      location: nonStringField
    });
  }

  const explicityTrimmedFields = ['username', 'password', 'email'];
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  );

  if(nonTrimmedField) {
    console.log('non trimmed field')
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Cannot start or end with space',
      location: nonTrimmedField
    });
  }

  const sizedFields = {
    username: {
      min: 5,
      max: 15
    },
    password: {
      min: 7,
      max: 72
    }
  };
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  );
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  );

  if (tooSmallField || tooLargeField){
    console.log('too large or too small')
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField]
            .min} characters long`
        : `Cannot exceed ${sizedFields[tooLargeField]
            .max} characters`,
      location: tooSmallField || tooLargeField
    });
  }

  let {username, password, email} = req.body

  return User.find({username})
    .count()
    .then(count => {
      if(count > 0) {
        console.log('user exists')
        return Promise.reject({
          code: 422,
          reason: 'ValidationError',
          message: 'Username unavailable',
          location: 'username'
        });
      }
      return User.hashPassword(password)
    })
    .then(hash => {
      return User.create({
        username,
        password: hash,
        email
      });
    })
    .then(user => {
      return res.status(201).json(user.apiRepr())
    })
    .catch(err => {
      console.log('user post error')
      if(err.reason === 'ValidationError'){
        return res.status(err.code).json(err)
      }
      res.status(500).json({code: 500, message: 'Internal server error'})
    });
});

module.exports = {router};