let mongoose = require('mongoose');

let urlSchema = new mongoose.Schema({
  shorturlID: String, 
  actualWeb: String,
  address:String,

});

module.exports = new mongoose.model('url', urlSchema);