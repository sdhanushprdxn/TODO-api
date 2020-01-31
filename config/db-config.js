const mongoose = require('mongoose');

// Conecting to Database
const connect = mongoose
  .connect('mongodb://localhost/TODO', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connected to database...'))
  .catch(err => console.error(err));

module.exports = connect;
