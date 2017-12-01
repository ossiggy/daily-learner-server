const mongoose = require('mongoose');

const ArticleSchema = mongoose.Schema({
  _parent:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   title: {type: Number, required: true},
   content: {type: Number, required: true},
   dateCreated: {type: Date, required: true},
   tags: [{type: String, required: true}]
});

const Post = mongoose.model('Article', ArticleSchema);

module.exports = {Article}