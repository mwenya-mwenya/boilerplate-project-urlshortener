let mongoose = require('mongoose');

let urlSchema = new mongoose.Schema({
  shorturlID: {
    type: String,
    unique: true
  },
  actualWeb: String,
  address: String,

});

module.exports = new mongoose.model('url', urlSchema);