const express = require('express');
const router = new express.Router();
const controller = require('../controllers/controller');
const verify = require('../util/tokenVerify');

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/notes', verify, controller.notes);
router.post('/create', verify, controller.create);
router.put('/update', verify, controller.update);
router.delete('/delete/:postsubject', verify, controller.delete);

module.exports = router;
