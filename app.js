const express = require('express');
const bodyParser = require('body-parser');
const routers = require('./routes/routes');
const app = express();

//Middlewares to read the body sent as request
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//routes middleware
app.use('/api/user', routers);

app.listen('3030', () => {
  console.log('Listening at port 3030');
});
