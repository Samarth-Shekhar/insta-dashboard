const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  mediaId: {
    type: String,
    required: true
  },
  hashtag: {
    type: String
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for now to avoid breaking existing data
  }
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
