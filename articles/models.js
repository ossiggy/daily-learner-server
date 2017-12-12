const mongoose = require('mongoose');

const ArticleSchema = mongoose.Schema({
  _parent:{type: mongoose.Schema.Types.ObjectId, ref: 'User'},
   title: {type: String, required: true},
   content: {type: String, required: true},
   dateCreated: {type: Date, required: false},
   tags: [{type: String, required: true}]
});

ArticleSchema.methods.apiRepr = function() {
  return {
    _parent: this._parent || '',
    id: this._id || '',
    title: this.title || '',
    content: this.content || '',
    dateCreated: this.dateCreated || '',
    tags: this.tags || ''
  };
};

const Article = mongoose.model('Article', ArticleSchema);

module.exports = {Article}