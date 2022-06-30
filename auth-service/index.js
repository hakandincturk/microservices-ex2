const express = require('express');
const consola = require('consola');
const mongoose = require('mongoose');
const User = require('./User');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT_ONE || 7070;

mongoose.connect('mongodb://localhost/micro-ecom-auth-service', {
  useNewUrlParser:true,
  useUnifiedTopology: true
}, () => {
  consola.success({message: `Auth-Service connected to DB`, badge: true});
});

app.use(express.json())

//register
app.post("/auth/", async (req, res) => {
  const { email, password, name } = req.body;

  const userExist = await User.findOne({ email });
  if(userExist) return res.status(401).json({type: false, message: 'user already exist.'});

  const newUser = new User({
    name,
    email,
    password
  });

  newUser.save();
  return res.json({type: true, message: 'succesfull', data: newUser});
});

//login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({email, password});
  if(!user) return res.status(401).json({type: false, message: 'email or password wrongg.'});

  const payload = {
    email,
    name: user.name
  }

  jwt.sign(payload, 'secret', (err, token) => {
    if(err) consola.error({message: `jwt error 1: ${err.message}`, badge: true})
    else {
      return res.json({type: true, message: 'successful', token: token});
    }
  });
});

app.listen(PORT, () => {
  consola.success({message: `Auth-Service at working on ${PORT}`, badge: true});
});