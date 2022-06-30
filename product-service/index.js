const express = require('express');
const consola = require('consola');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib')

const Product = require('./Product');
const isAuthenticated = require('../isAuthenticated');

const app = express();
const PORT = process.env.PORT_ONE || 8080;

var channel, connection, order;

mongoose.connect('mongodb://localhost/micro-ecom-product-service', {
  useNewUrlParser:true,
  useUnifiedTopology: true
}, () => {
  consola.success({message: `Product-Service connected to DB`, badge: true});
});

app.use(express.json())

async function connect(params) {
  const amqpServer = "amqps://nztaiger:Lun5OT9tHUlr2ZizcqsiTN_0bJ06qLgR@cow.rmq2.cloudamqp.com/nztaiger";

  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();

  await channel.assertQueue('PRODUCT');
}

connect();

//create a new product
app.post('/product/', isAuthenticated, async (req, res) => {
  const { name, desc, price } = req.body
  const newProduct = new Product({
    name,
    desc,
    price
  })
  newProduct.save();
  return res.json({type: true, message: 'successfuly', data: newProduct});
});

app.post('/product/buy', isAuthenticated, async (req, res) => {
  const { ids } = req.body;

  const products = await Product.find({ _id: { $in: ids }});

  channel.sendToQueue('ORDER', Buffer.from(JSON.stringify({
    products,
    userEmail: req.user.email
  })));

  channel.consume('PRODUCT', (data) => {
    order = JSON.parse(data.content)
    channel.ack(data); 
    console.log('Consuming PRODUCT Queue, ', order)
  });

  return res.json({type: true, message: 'successful', data: order})
})

app.listen(PORT, () => {
  consola.success({message: `Product-Service at working on ${PORT}`, badge: true});
});