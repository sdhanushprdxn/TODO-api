const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const Joi = require('@hapi/joi');
const saltRounds = 10;
const userModel = require('../models/usermodel');
const post = require('../models/postmodel');
mongoose.set('useFindAndModify', false);
const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth();
const day = currentDate.getDate();
dotenv.config();

module.exports = {
  //create a new user
  signup: (req, res) => {
    //validation schema using happi joi
    const validateSchema = Joi.object({
      name: Joi.string()
        .min(3)
        .required(),
      email: Joi.string()
        .min(6)
        .required()
        .email(),
      password: Joi.string()
        .min(6)
        .required(),
      city: Joi.string()
        .min(3)
        .required(),
      contact: Joi.number()
        .min(10)
        .required()
    });
    // validate request data
    const { error } = validateSchema.validate({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      city: req.body.city,
      contact: req.body.contact
    });
    if (error)
      return res.status(400).json({ result: error.details[0].message });

    userModel
      .findOne({ email: req.body.email })
      .exec()
      .then(user => {
        if (user) {
          res.status(409).json({
            message: 'User already exits',
            suggestion: 'Try with different emailId'
          });
        } else {
          //hash the password
          bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
            if (err) {
              return res.status(500).json({ error: err });
            } else {
              let user = new userModel({
                name: req.body.name,
                email: req.body.email,
                password: hash,
                city: req.body.city,
                contact: req.body.contact
              });
              //save to database
              user
                .save()
                .then(result => {
                  res.json({
                    status: 'successfully Signed Up',
                    username: result.name
                  });
                })
                .catch(err => {
                  res.status(500).json({ success: false, result: `${err}` });
                });
            }
          });
        }
      })
      .catch(err => {
        res.status(500).json({ success: false, result: `${err}` });
      });
  },
  //user login
  login: (req, res) => {
    userModel
      .findOne({ email: req.body.email })
      .exec()
      .then(user => {
        if (user) {
          bcrypt.compare(req.body.password, user.password, (err, feed) => {
            if (feed) {
              //creating token for sucessful login
              const token = jwt.sign(
                {
                  email: user.email,
                  userId: user._id
                },
                process.env.ACCESS_SECRET_KEY,
                {
                  expiresIn: '1h'
                }
              );
              return res.header('auth-token', token).json({
                status: 'Logged In',
                message: `Welcome ${user.name}`
              });
            }
            if (err) {
              return res.status(500).json({ message: err });
            }
          });
        } else {
          return res.status(404).send({
            status: 'login failed',
            message: 'invalid user password combination'
          });
        }
      })
      .catch(err => {
        res.status(500).json({ success: false, result: `${err}` });
      });
  },
  //get all notes
  notes: async (req, res) => {
    try {
      const notes = await post.find(
        {
          author: new mongoose.mongo.ObjectID(req.user.userId)
        },
        { author: 0, _id: 0, __v: 0 }
      );
      if (notes.length < 1) return res.send({ message: 'no notes found' });
      res.send(notes);
    } catch (err) {
      res.status(500).send(err);
    }
  },

  //create note
  create: async (req, res) => {
    try {
      //validation schema using happi joi
      const validatePostSchema = Joi.object({
        subject: Joi.string()
          .min(3)
          .required(),
        body: Joi.string()
          .min(10)
          .required(),
        date: Joi.date()
          .min(`${year}-${month + 1}-${day}`)
          .iso(),
        status: Joi.string().min(4)
      });
      const { error } = await validatePostSchema.validate({
        subject: req.body.subject,
        body: req.body.body,
        date: req.body.date,
        status: req.body.status
      });
      if (error)
        return res.status(400).json({ result: error.details[0].message });

      const doc = await post.find({
        author: new mongoose.mongo.ObjectID(req.user.userId)
      });
      let match = doc.filter(doc => doc.subject === req.body.subject);
      if (match.length > 0)
        return res.status(404).send({
          status: 'Note already exists',
          subject: doc.subject,
          body: doc.body
        });
      const note = new post({
        subject: req.body.subject,
        body: req.body.body,
        date: req.body.date,
        status: req.body.status,
        author: new mongoose.mongo.ObjectID(req.user.userId)
      });
      await note.save();
      res.status(201).send({ result: 'Note posted' });
    } catch (err) {
      res.status(500).send(err);
    }
  },
  delete: (req, res) => {
    post
      .findOneAndDelete({
        $and: [
          { author: new mongoose.mongo.ObjectID(req.user.userId) },
          { subject: req.params.postsubject }
        ]
      })
      .then(query => {
        if (query)
          return res.send({
            status: 'success',
            message: `${req.params.postsubject} deleted`
          });

        res.send({ status: 'Note not found' });
      })
      .catch(err => {
        res.status(500).send({ error: err });
      });
  },
  update: async (req, res) => {
    try {
      //validation schema using happi joi
      const validatePostSchema = Joi.object({
        subject: Joi.string()
          .min(3)
          .required(),
        date: Joi.date()
          .min(`${year}-${month + 1}-${day}`)
          .iso()
          .required(),
        status: Joi.string()
          .min(4)
          .required()
      });
      const { error } = await validatePostSchema.validate({
        subject: req.body.subject,
        date: req.body.date,
        status: req.body.status
      });
      if (error)
        return res.status(400).json({ result: error.details[0].message });

      const updateNote = await post.findOneAndUpdate(
        {
          $and: [
            { author: new mongoose.mongo.ObjectID(req.user.userId) },
            { subject: req.body.subject }
          ]
        },
        { $set: { date: req.body.date, status: req.body.status } },
        { new: true }
      );
      if (updateNote) return res.status(201).send({ status: 'updated' });
      res
        .status(400)
        .send({ message: `canot update, "${req.body.subject}" not found` });
    } catch (err) {
      res.status(500).send(err);
    }
  }
};
