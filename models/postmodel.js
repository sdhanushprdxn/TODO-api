const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  subject: { type: String, required: true },
  body: { type: String, required: true },
  date: { type: Date, default: Date.now() },
  status: { type: String, default: 'Completed' },
  author: [{ type: Schema.Types.ObjectId, ref: 'user' }]
});

module.exports = mongoose.model('post', postSchema);
