const express = require('express');
const router = new express.Router();
const controller = require('./controllers/controller');

router.use('/signup', controller.signup);
router.use('/login', controller.login);

module.exports = router;
