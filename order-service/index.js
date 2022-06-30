const express = require('express');
const consola = require('consola');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib')

const Order = require('./Order');
const isAuthenticated = require('../isAuthenticated');

const app = express();
const PORT = process.env.PORT_ONE || 9090;
const RABBIT_MQ = process.env.RABBITMQ;

var channel, connection;

mongoose.connect('mongodb://localhost/micro-ecom-order-service', {
  useNewUrlParser:true,
  useUnifiedTopology: true
}, () => {
  consola.success({message: `Order-Service connected to DB`, badge: true});
});

app.use(express.json())

async function connect(params) {
  const amqpServer = RABBIT_MQ;

  connection = await amqp.connect(amqpServer);
  channel = await connection.createChannel();

  await channel.assertQueue('ORDER');
}

function createOrder(products, userEmail) {
  let total = 0;
  for (let t = 0; t < products.length; t++) {
    total += products[t].price;    
  }

  const newOrder = new Order({
    products,
    user: userEmail,
    total_price: total
  })
  newOrder.save();
  return newOrder;
}

connect().then(() => {
  channel.consume('ORDER', data => {
    const { products, userEmail } = JSON.parse(data.content);
    const newOrder = createOrder(products, userEmail);
    channel.ack(data); 
    channel.sendToQueue('PRODUCT', Buffer.from(JSON.stringify({newOrder})));

    console.log("Consuming ORDER Queue: ", newOrder)
  });
});


app.listen(PORT, () => {
  consola.success({message: `Order-Service at working on ${PORT}`, badge: true});
});