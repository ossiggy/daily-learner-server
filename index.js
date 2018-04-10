'use strict';

const {router: userRouter} = require('./users');
const {router: articleRouter} = require('./articles');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');
const mongoose = require('mongoose');
const express = require('express');
const passport = require('passport')
const cors = require('cors');
const morgan = require('morgan');
const {User} = require('./users');
const {Article} = require('./articles')
const {PORT, CLIENT_ORIGIN, DATABASE_URL} = require('./config');
const {dbConnect} = require('./db-mongoose');

const {users, articles} = require('./dummy-data.json');

const app = express();

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);
app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'common :method :res[headers] :req[headers]' : 'dev', {
        skip: (req, res) => process.env.NODE_ENV === 'test'
    })
);


passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', userRouter);
app.use('/api/articles/', articleRouter);
app.use('/api/auth', authRouter);

let server;

function runServer(databaseUrl=DATABASE_URL, port=PORT) {
  
    return new Promise((resolve, reject) => {
      mongoose.connect(databaseUrl, {useMongoClient: true}, err =>{
        
        if (err) {
          return reject(err);
        }
        server = app.listen(port, () => {
          console.log(`Your app is listening on port ${port}`);
          resolve();
        })
          .on('error', err => {
            mongoose.disconnect();
            reject(err);
          });
      });
    });
  }


function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if(err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
    dbConnect();
    runServer();
}

module.exports = {app, runServer};
