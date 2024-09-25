
import express from 'express';
import sendNotification from '../notifications/notification.controller.js'

const router = express.Router();

router.get('/status', (req, res) => {
  res.status(200).send('notification get');
});

router.post('/send-notification', async (req, res) => {
  const { registrationToken, title, body } = req.body;

  try {
    const response = await sendNotification(registrationToken, title, body);
    res.status(200).send(`Notification sent successfully: ${response}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error sending notification');
  }
});

export default router;
