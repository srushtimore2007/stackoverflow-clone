// // using Twilio SendGrid's v3 Node.js Library
// // https://github.com/sendgrid/sendgrid-nodejs
// import 'dotenv/config'; // if using ES Modules (import/export)
// import sgMail from '@sendgrid/mail';
// // import dotenv from 'dotenv';
// // dotenv.config();
// // const sgMail = require('@sendgrid/mail')
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// // sgMail.setDataResidency('eu'); 
// // uncomment the above line if you are sending mail using a regional EU subuser

// // const msg = {
// //   to: 'test@example.com', // Change to your recipient
// //   from: 'test@example.com', // Change to your verified sender
// //   subject: 'Sending with SendGrid is Fun',
// //   text: 'and easy to do anywhere, even with Node.js',
// //   html: '<strong>and easy to do anywhere, even with Node.js</strong>',
// // }
// // sgMail
// //   .send(msg)
// //   .then(() => {
// //     console.log('Email sent')
// //   })
// //   .catch((error) => {
// //     console.error(error)
// //   })

// console.log('Key:', process.env.SENDGRID_API_KEY);
// console.log('Sender:', process.env.SENDGRID_SENDER_EMAIL);

import 'dotenv/config';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

console.log('Key:', process.env.SENDGRID_API_KEY);
console.log('Sender:', process.env.SENDGRID_SENDER_EMAIL);

const msg = {
  to: 'moresrushti200707@gmail.com.com',            // your real test email
  from: process.env.SENDGRID_SENDER_EMAIL, // verified sender
  subject: 'SendGrid Test Email',
  text: 'This is a test email sent from Node.js using SendGrid!',
  html: '<strong>This is a test email sent from Node.js using SendGrid!</strong>',
};

sgMail
  .send(msg)
  .then(() => console.log('✅ Email sent successfully!'))
  .catch(err => {
    console.error('❌ SendGrid Error:', err);
    if (err.response) console.error(err.response.body);
  });