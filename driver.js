'use strict';

const Chance = require('chance');
const chance = new Chance();
const { Consumer } = require('sqs-consumer');
const { SQSClient } = require('@aws-sdk/client-sqs');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const sns = new AWS.SNS();

const topic = 'arn:aws:sns:us-west-2:749908888189:delivered';
const queueUrl =
  'https://sqs.us-west-2.amazonaws.com/749908888189/packages.fifo';

function checkPickup() {
  const app = Consumer.create({
    queueUrl,
    handleMessage: async (message) => {
      let messageBody = JSON.parse(message.Body);
      console.log('We have a pickup notification!', messageBody.Message);
      setInterval(postDelivered(messageBody), 5000);
    },
    sqs: new SQSClient({
      region: 'us-west-2',
    }),
  });

  app.on('error', (e) => {
    console.log('ERROR OCCURRED IN QUEUE', e);
  });

  app.start();
}

function postDelivered(load) {
  console.log("Posting delivery notification!")
  let { orderId, customer } = JSON.parse(load.Message);
  const payload = {
    Subject: 'Delivered',
    Message: `Order ${orderId} for Customer ${customer} has been delivered!`,
    TopicArn: topic,
  };

  sns
    .publish(payload)
    .promise() // method for using promise syntax
    .then((data) => {
      console.log(data);
    })
    .catch((e) => {
      console.error('SOMETHING WENT WRONG', e);
    });
}

checkPickup();