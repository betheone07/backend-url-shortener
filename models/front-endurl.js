const mongoose = require('mongoose');


const frontSchema = new mongoose.Schema({
  longurl: String
});

module.exports = mongoose.model('fronturl', frontSchema);
