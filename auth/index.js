'use strict';
const {authRouter} = require('./router');
const {localStrategy, jwtStrategy} = require('./strategies');

module.exports = {authRouter, localStrategy, jwtStrategy};