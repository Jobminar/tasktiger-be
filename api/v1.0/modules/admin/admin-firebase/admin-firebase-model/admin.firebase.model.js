const Order = require('../models/Order');
const ProviderDetails = require('../models/ProviderDetails');
const Address =require('../../../users/user-address/user-address-model/user.address.modely')
const Cordinates = require('../models/Cordinates');
const User = require('../models/User'); // Assuming you have a User model
const { getDistanceFromLatLonInKm } = require('../utils/distance');
const admin = require('../firebaseAdmin');

exports.createOrder = async (req, res) => {
  try {
    const { userId, addressId, paymentId, categoryIds, subCategoryIds, schedule, items } = req.body;

    // Create a new order
    const order = new Order({ userId, addressId, paymentId, categoryIds, subCategoryIds, schedule, items});
    await order.save();

    // Find the address associated with the order
    const address = await Address.findById(addressId);
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }

    // Extract address details
    const { latitude, longitude, pincode } = address;

    // Find provider details and coordinates
    const providers = await ProviderDetails.find({ pincode });
    const coordinates = await Cordinates.find({ userId: { $in: providers.map(p => p.userId) } });

    // Filter providers based on working radius
    const matchingProviders = providers.filter(provider => {
      const providerCoordinates = coordinates.find(c => c.userId.toString() === provider.userId.toString());
      if (providerCoordinates) {
        const distance = getDistanceFromLatLonInKm(
          latitude,
          longitude,
          providerCoordinates.coordinates[0],
          providerCoordinates.coordinates[1]
        );
        return distance <= provider.radius;
      }
      return false;
    });

    // Send notifications to matching providers
    for (const provider of matchingProviders) {
      const message = {
        notification: {
          title: 'New Order!',
          body: New order for ${categoryIds.join(', ')} in your area. Check details.,
        },
        token: provider.fcmToken, // Assuming you have a field for FCM token in provider schema
        data: {
          orderId: order._id.toString(), // Include order ID for reference
        },
      };

      try {
        await admin.messaging().send(message);
        console.log('Notification sent to provider:', provider.providerName);
      } catch (error) {
        console.error('Error sending notification to provider:', provider.providerName, error);
      }
    }

    // Send notification to the user who created the order
    const user = await User.findById(userId);
    if (user && user.fcmToken) {
      const userMessage = {
        notification: {
          title: 'Order Created Successfully',
          body: Your order has been created successfully. We are processing it now.,
        },
        token: user.fcmToken,
        data: {
          orderId: order._id.toString(),
        },
      };

      try {
        await admin.messaging().send(userMessage);
        console.log('Notification sent to user:', user.name);
      } catch (error) {
        console.error('Error sending notification to user:', user.name, error);
      }
    }

    res.status(201).json({ message: 'Order created and notifications sent.' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};