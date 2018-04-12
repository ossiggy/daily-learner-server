const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('mongoose-type-email');

mongoose.Promise = global.Promise;

const UserSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  email: {type: mongoose.SchemaTypes.Email, required: true},
  articles: [{type: mongoose.Schema.Types.ObjectId, ref:'Article'}]
});

UserSchema.methods.apiRepr = function() {
  return {
    id: this._id,
    username: this.username || '',
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);  
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model('User', UserSchema);

module.exports = {User}