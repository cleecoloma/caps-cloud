'use strict';

const Chance = require('chance');
const chance = new Chance();
const { Consumer } = require('sqs-consumer');
const { SQSClient } = require('@aws-sdk/client-sqs');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' });

const sns = new AWS.SNS();

const topic = 'arn:aws:sns:us-west-2:749908888189:pickup.fifo'; //arn from aws
const queueUrl = 'https://sqs.us-west-2.amazonaws.com/749908888189/vendor';

function createPickup() {
  const payload = {
    Subject: 'Yet Another Pickup',
    Message: JSON.stringify({
      orderId: chance.guid(),
      customer: chance.name(),
      vendorUrl: 'https://sqs.us-west-2.amazonaws.com/749908888189/vendor',
    }),
    TopicArn: topic,
    MessageGroupId: chance.guid(),
    MessageDeduplicationId: chance.guid(),
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

function checkDelivered() {
  console.log('Checking if orders got delivered!');
  const app = Consumer.create({
    queueUrl,
    handleMessage: async (message) => {
      let messageBody = JSON.parse(message.Body);
      console.log('We got a delivery notification!', messageBody.Message);
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

checkDelivered();
setInterval(createPickup, 5000);