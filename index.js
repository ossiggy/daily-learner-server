'use strict';

const {router: userRouter} = require('./users');
const {router: articleRouter} = require('./articles');
const {router: authRouter, localStrategy, jwtStrategy} = require('./auth');

const express = require('express');
const passport = require('passport')
const cors = require('cors');
const morgan = require('morgan');
const {User} = require('./users');
const {Article} = require('./articles')
const {PORT, CLIENT_ORIGIN} = require('./config');
const {dbConnect} = require('./db-mongoose');

const {users, articles} = require('./dummy-data.json');

// console.log(users);

const app = express();

app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'common' : 'dev', {
        skip: (req, res) => process.env.NODE_ENV === 'test'
    })
);

app.use(
    cors({
        origin: CLIENT_ORIGIN
    })
);

passport.use(localStrategy);
passport.use(jwtStrategy);

app.use('/api/users/', userRouter);
app.use('/api/articles/', articleRouter);
app.use('/api/auth', authRouter);


function runServer(port = PORT) {
    const server = app
        .listen(port, () => {
            console.info(`App listening on port ${server.address().port}`);
        })
        .on('error', err => {
            console.error('Express failed to start');
            console.error(err);
        });
}

if (require.main === module) {
    dbConnect();
    runServer();
}

module.exports = {app};
