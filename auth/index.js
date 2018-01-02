const {router, jwtAuth} = require('./authRouter');
const {localStrategy, jwtStrategy} = require('./strategies');

module.exports = {router, localStrategy, jwtStrategy, jwtAuth};