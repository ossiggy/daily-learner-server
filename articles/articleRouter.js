'use strict';

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const cookieParser = require('cookie-parser');

const {jwtAuth} = require('../auth');

const router = express.Router();
const {Article} = require('./models');
const {User} = require('../users');

mongoose.Promise=global.Promise;

router.get('/', jwtAuth, (req, res) => {
  Article
    .find({_parent: req.user.id})
    .exec(function(err){
      if(err) return 'error';
    })
    .then(articles => {
      res.json(articles.map(article => article.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went wrong'});
    });
});

router.get('/:id', jwtAuth, (req, res) => {
  if(!Article) { 
    res.status(404).json({error: 'Article not found'});
  }
  else{
    Article.findById(req.params.id)
      .exec(function(err){
        if(err) return "error";
      })
      .then(
        article => res.json(article.apiRepr()))
      .catch(err => {
        console.error(err);
        res.status(500).json({error: 'something went wrong'})
      });
  }
});

router.post('/', jsonParser, (req, res) => {
  const requiredFields = ['title', 'content', 'category'];
  for(let i=0; i<requiredFields.length; i++){
    const field = requiredFields[i];
    if(!(field in req.body)){
      const message = `Missing \`${field}\` in request body`;
      console.log(field);
      console.error(message);
    }
  }
  const {title, content, category, _parent} = req.body;
  
  Article
    .create({
      _parent,
      title,
      content,
      category
    })
    .then(article => res.status(201).json(article.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({message: 'Internal server er;ror'});
    });   
});

router.put('/:id', jwtAuth, jsonParser, (req, res) => {
  if(!(req.params.id === req.body.id)){
    const message = (
      `Request patch id (${req.params.id} and request body id (${req.body.id}) must match)`);
    console.error(message);
    res.status(400).json({message: message});
  }

  const toUpdate = {};
  const updateableFields = ['title', 'content', 'category'];

  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field];
    }
  });

  Article
    .findOneAndUpdate({_id:req.params.id}, {$set: toUpdate}, {new: true})
    .exec()
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Internal server error'}));
});

router.delete('/:id', jwtAuth, (req, res) => {
  Article
    .findByIdAndRemove(req.params.id)
    .exec()
    .then(post => res.status(204).end())
    .catch(err => res.status(500).json({message: 'Inernal server error'}));
});

module.exports = {router};