// notificationController.js

import admin from '../notifications/firebase.js';

const sendNotification = async (registrationToken, title, body) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: registrationToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response); // Log the response
    return response; // Return the response
  } catch (error) {
    console.error('Error sending message:', error);
    throw error; // Re-throw the error to be caught by the route handler
  }
};

export default sendNotification;
