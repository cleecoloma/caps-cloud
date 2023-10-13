'use strict';

// const Chance = require('chance');
// const chance = new Chance();
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
    checkMessage: async (message) => {
      let messageBody = JSON.parse(message.Body);
      console.log('WE HAVE A NEW MESSAGE!', messageBody);
      const timeoutMs = 5000;
      setTimeout(null, timeoutMs);
      postDelivered(messageBody);
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

checkPickup();

function postDelivered(payload) {
  let { orderId, customer } = payload;
  const payload = {
    Subject: 'Delivered',
    Message: `Order ${orderId} for Customer ${customer} has been delivered!`,
    // JSON.stringify({
    //   orderId,
    //   customer,
    //   vendorUrl: 'https://sqs.us-west-2.amazonaws.com/749908888189/vendor',
    // }),
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

// setInterval(postDelivered, 5000);
// postDelivered();