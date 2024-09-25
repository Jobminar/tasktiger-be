// notificationModel.js

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('ProviderNotification', notificationSchema);

export default Notification;
