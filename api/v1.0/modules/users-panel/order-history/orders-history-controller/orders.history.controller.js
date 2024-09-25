import OrdersHistory from "../orders-history-models/orders.history.model.js";
import Order from "../../../users-panel/user-cart/models/user.order.model.js";
import ProviderDetails from "../../../provider-panel/../provider-panel/provider-deatils/model/provider.details.model.js";
import UserToken from "../../user-token/user-token-model/user.token.model.js";
import ProviderToken from "../../../provider-panel/provider-token/provider-token-model/provider.token.model.js";
import admin from "../../../_core/notifications/firebase.js";


import AWS from "aws-sdk";
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single('image');

// Function to upload image to S3
const uploadImageToS3 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const imageKey = `order-history/${uuidv4()}${fileExtension}`;

  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: file.buffer,
    ACL: 'public-read',
    ContentType: file.mimetype,
  };

  const uploadResult = await s3.upload(s3Params).promise();
  return uploadResult.Key;
};

// Function to delete image from S3
const deleteImageFromS3 = async (imageKey) => {
  const s3Params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
  };

  await s3.deleteObject(s3Params).promise();
};


const ordersHistoryController = {


   acceptOrder : async (req, res) => {
    try {
        const { orderId, providerId } = req.body;

        if (!orderId || !providerId) {
            return res
                .status(400)
                .json({ message: "Order ID and Provider ID are required" });
        }

        // Generate a 4-digit OTP and set an expiry time of 1 hour
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Fetch the order details
        const order = await Order.findById(orderId)
            .populate("userId", "name email");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Extract userId from the order
        const userId = order.userId._id;

        // Create a new order history record with status "Accepted" and OTP
        const newOrderHistory = new OrdersHistory({
            userId,
            orderId,
            providerId,
            status: "Accepted",
            otp,
            otpExpiry, // Add expiry time for OTP
        });

        await newOrderHistory.save();

        // Fetch provider details
        const provider = await ProviderDetails.findOne({ userId: providerId });

        if (!provider) {
            return res.status(404).json({ message: "Provider not found" });
        }

        // Fetch all providers related to this order
        const providers = await ProviderDetails.find({
            pincode: order.addressId.pincode,
        });
        const providerTokens = await ProviderToken.find({
            providerId: { $in: providers.map((p) => p.userId) },
        });

        // Fetch user and provider tokens
        const userToken = await UserToken.findOne({ userId: order.userId });
        const acceptingProviderToken = await ProviderToken.findOne({
            providerId,
        });

        // Prepare notifications
        if (userToken) {
            const userMessage = {
                notification: {
                    title: "Order Accepted",
                    body: "Your order has been accepted. The provider is on the way.",
                },
                token: userToken.token,
                data: {
                    orderHistoryId: newOrderHistory._id.toString(),
                    providerDetails: JSON.stringify({
                        name: provider.providerName,
                        phone: provider.phone,
                    }),
                    otp: otp.toString(), // Send OTP in notification
                },
            };
            try {
                await admin.messaging().send(userMessage);
                // console.log("Notification sent to user:", userToken.token);
            } catch (error) {
                console.error("Error sending notification to user:", error);
            }
        }

        if (acceptingProviderToken) {
            const providerMessage = {
                notification: {
                    title: "Order Accepted",
                    body: "You have accepted the order and are ready to go.",
                },
                token: acceptingProviderToken.token,
                data: {
                    orderId: order._id.toString(),
                },
            };
            try {
                await admin.messaging().send(providerMessage);
                // console.log(
                //     "Notification sent to accepting provider:",
                //     acceptingProviderToken.token
                // );
            } catch (error) {
                console.error(
                    "Error sending notification to accepting provider:",
                    error
                );
            }
        }

        // Notify other matched providers
        const otherProviderTokens = providerTokens.filter(
            (pt) => pt.providerId.toString() !== providerId.toString()
        );
        for (const token of otherProviderTokens) {
            const otherProviderMessage = {
                notification: {
                    title: "Order Allocation Update",
                    body: "This order has been allocated to another provider. No more providers are needed.",
                },
                token: token.token,
                data: {
                    orderId: order._id.toString(),
                },
            };
            try {
                await admin.messaging().send(otherProviderMessage);
                // console.log("Notification sent to other providers:", token.token);
            } catch (error) {
                console.error(
                    "Error sending notification to other providers:",
                    error
                );
            }
        }

        res.status(200).json({message: "Order status updated and notifications sent",
                orderHistoryId: newOrderHistory._id,
                status: newOrderHistory.status
            });
    
    } catch (error) {
        console.error("Error accepting order:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
},

  verifyStartOrder: async (req, res) => {
    try {
      const { orderHistoryId, otp } = req.body;

      console.log("Order History ID:", orderHistoryId);
      console.log("OTP:", otp);

      // Fetch the order history entry
      const orderHistory = await OrdersHistory.findOne({
        _id: orderHistoryId,
        otp,
      });
      console.log("Order History:", orderHistory);

      if (!orderHistory) {
        return res
          .status(404)
          .json({ message: "Invalid OTP or order history not found" });
      }

      // Check if the OTP has expired
      if (new Date() > orderHistory.otpExpiry) {
        return res.status(400).json({ message: "OTP has expired" });
      }

      // Fetch the order
      const order = await Order.findById(orderHistory.orderId);
      console.log("Order:", order);

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (orderHistory.status !== "Accepted") {
        return res
          .status(400)
          .json({
            message: "Order status is not in a valid state for this operation",
          });
      }

      // Update the order history to 'InProgress'
      orderHistory.status = "InProgress";
      await orderHistory.save();

      res
        .status(200)
        .json({
          message:
            'OTP verified successfully and order status updated  ',
            status: orderHistory.status
        });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },


   beforeWorkUploadImage : async (req, res) => {
      // Handle the file upload
      upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error uploading file.', error: err.message });
      }
  
      const { providerId, orderId, userId } = req.body;
  
      // Validate required fields
      if (!providerId || !orderId || !userId) {
        return res.status(400).json({
          message: 'Missing required fields: providerId, orderId, userId',
        });
      }
  
      try {
        // Create a new OrdersHistory entry
        const newOrdersHistory = new OrdersHistory({
          providerId,
          orderId,
          userId,
          image: req.file.filename, // Assuming the image field stores the filename
          // Add any other fields you need to populate
        });
  
        await newOrdersHistory.save();
  
        // Return success response
        res.status(201).json({
          message: 'Image uploaded and OrdersHistory created successfully.',
          data: newOrdersHistory
        });
      } catch (error) {
        res.status(500).json({ message: 'Error while creating order.', error: error.message });
      }
    })
},

afterWorkUploadImage: async (req, res) => {
    upload(req, res, async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error uploading file.', error: err.message });
      }

      const { providerId, orderId, userId, orderHistoryId } = req.body;

      if (!providerId || !orderId || !userId || !orderHistoryId) {
        return res.status(400).json({ message: 'Missing required fields: providerId, orderId, userId, or orderHistoryId' });
      }

      try {
        const orderHistory = await OrdersHistory.findById(orderHistoryId);
        if (!orderHistory) {
          return res.status(404).json({ message: 'Order history not found' });
        }

        // Upload image to S3
        const imageKey = await uploadImageToS3(req.file);

        // Save image URL to order history
        orderHistory.image = imageKey;
        await orderHistory.save();

        res.status(200).json({
          message: 'Image uploaded and order history updated successfully',
          data: orderHistory
        });
      } catch (error) {
        res.status(500).json({ message: 'Error updating order history.', error: error.message });
      }
    });
  },
  orderCompletedGenerate: async (req, res) => {
    try {
        const { orderHistoryId, providerId } = req.body;

        // Validate required fields
        if (!orderHistoryId || !providerId) {
            return res.status(400).json({
                message: "Order History ID and Provider ID are required",
            });
        }

        // Find the order history entry
        const orderHistory = await OrdersHistory.findOne({
            _id: orderHistoryId,
            providerId,
        });

        if (!orderHistory) {
            return res.status(404).json({ message: "Order history not found" });
        }

        // Generate OTP (for simplicity, let's use a random 6-digit number)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set OTP and expiration time (e.g., 10 minutes from now)
        orderHistory.otp = otp;
        orderHistory.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await orderHistory.save();

        res.status(200).json({ message: "OTP generated successfully", otp });
    } catch (error) {
        console.error("Error generating OTP:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
},

completeOrderVerify: async (req, res) => {
    try {
        const { orderHistoryId, providerId, otp } = req.body;

        // Validate required fields
        if (!orderHistoryId || !providerId || !otp) {
            return res.status(400).json({
                message: "Order History ID, Provider ID, and OTP are required",
            });
        }

        // Find the order history entry
        const orderHistory = await OrdersHistory.findOne({
            _id: orderHistoryId,
            providerId,
        });

        if (!orderHistory) {
            return res.status(404).json({ message: "Order history not found" });
        }

        // Check if OTP has expired
        if (new Date() > orderHistory.otpExpiresAt) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // Verify OTP
        if (orderHistory.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // Update order status to 'Completed'
        orderHistory.status = "Completed";
        orderHistory.otp = undefined; // Clear OTP after successful verification
        orderHistory.otpExpiresAt = undefined; // Clear OTP expiration time
        await orderHistory.save();

        res.status(200).json({
            message: "Order completed successfully",
            status: orderHistory.status
        });
    } catch (error) {
        console.error("Error completing order:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
},


  payOrder: async (req, res) => {
    try {
      const { orderHistoryId, providerId } = req.body;

      if (!orderHistoryId || !providerId) {
        return res
          .status(400)
          .json({ message: "Order History ID and Provider ID are required" });
      }

      const orderHistory = await OrdersHistory.findOne({
        _id: orderHistoryId,
        providerId,
      });

      if (!orderHistory) {
        return res.status(404).json({ message: "Order history not found" });
      }

      orderHistory.status = "Paid";
      await orderHistory.save();

      res.status(200).json({ message: "Order payment confirmed" });
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  cancelOrder: async (req, res) => {
    try {
      const { orderHistoryId, providerId, reason } = req.body;

      if (!orderHistoryId || !providerId) {
        return res
          .status(400)
          .json({ message: "Order History ID and Provider ID are required" });
      }

      const orderHistory = await OrdersHistory.findOne({
        _id: orderHistoryId,
        providerId,
      });

      if (!orderHistory) {
        return res.status(404).json({ message: "Order history not found" });
      }

      orderHistory.status = "Cancelled";
      orderHistory.reason = reason;
      await orderHistory.save();

      res
        .status(200)
        .json({ message: 'Order cancelled successfully  ',status:orderHistory.status });
    } catch (error) {
      console.error("Error cancelling order:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },


getOrdersHistoryByProviderId: async (req, res) => {
    try {
        const { providerId } = req.params;

        if (!providerId) {
            return res.status(400).json({ message: "Provider ID is required" });
        }

        const history = await OrdersHistory.find({ providerId })
            .populate({
                path: 'orderId',
                select: 'userId addressId paymentId categoryIds subCategoryIds status items',
                populate: [
                    {
                        path: 'items.serviceId',
                        select: 'name serviceVariants',
                        populate: {
                            path: 'serviceVariants',
                            select: 'variantName price serviceTime metric min max'
                        }
                    },
                    {
                        path: 'items.categoryId',
                        select: 'name',
                    },
                    {
                        path: 'items.subCategoryId',
                        select: 'name',
                    },
                    {
                        path: 'categoryIds',
                        select: 'name',
                    },
                    {
                        path: 'subCategoryIds',
                        select: 'name',
                    },
                    {
                        path: 'addressId',
                        select: 'latitude longitude pincode addressLine1 addressLine2 city state country username mobileNumber',
                    }
                ]
            })
            .exec();

        if (!history.length) {
            return res.status(404).json({ message: "No order history found for this provider" });
        }

        const formattedHistory = history.map(historyItem => ({
            _id: historyItem._id,
            providerId: historyItem.providerId,
            reason: historyItem.reason,
            status: historyItem.status,
            otp: historyItem.otp,
            otpExpiry: historyItem.otpExpiry,
            orderId: {
                _id: historyItem.orderId._id,
                userId: historyItem.orderId.userId,
                addressId: historyItem.orderId.addressId,
                paymentId: historyItem.orderId.paymentId,
                categoryIds: historyItem.orderId.categoryIds,
                subCategoryIds: historyItem.orderId.subCategoryIds,
                status: historyItem.orderId.status,
                items: historyItem.orderId.items,
            }
        }));

        res.status(200).json(formattedHistory);
    } catch (error) {
        console.error("Error retrieving order history:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
},

getOrderHistoryByUserId: async (req, res) => {
    try {
        const { userId } = req.params;

        // Validate userId
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        // Fetch all orders related to the user
        const orders = await Order.find({ userId });

        // Extract all order IDs
        const orderIds = orders.map(order => order._id);

        // Fetch order histories by orderIds
        const orderHistories = await OrdersHistory.find({ orderId: { $in: orderIds } })
            .populate({
                path: 'orderId',
                populate: {
                    path: 'items.serviceId',
                    model: 'Service'
                }
            });

        if (!orderHistories.length) {
            return res.status(404).json({ message: "No order histories found" });
        }

        // Extract all provider IDs from order histories
        const providerIds = orderHistories.map(history => history.providerId);

        // Fetch provider details separately
        const providerDetails = await ProviderDetails.find({ providerId: { $in: providerIds } });

        // Map provider details by userId for easy access
        const providerDetailsMap = providerDetails.reduce((map, provider) => {
            map[provider.providerId] = provider;
            return map;
        }, {});

        // Format order histories with provider details
        const formattedOrderHistories = orderHistories.map(history => {
            const providerDetail = providerDetailsMap[history.providerId];

            return {
                _id: history._id,
                orderId: history.orderId,
                status: history.status,
                otp: history.otp,
                otpExpiry: history.otpExpiry,
                provider: providerDetail ? {
                    providerName: providerDetail.providerName,
                    image: providerDetail.image,
                    age: providerDetail.age,
                    pincode: providerDetail.pincode,
                    radius: providerDetail.radius,
                    gender: providerDetail.gender,
                    address: providerDetail.address,
                    phone: providerDetail.phone
                } : null
            };
        });

        // Return the populated order histories
        res.status(200).json(formattedOrderHistories);
    } catch (error) {
        console.error("Error fetching order histories:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
},


getAllHistory: async (req, res) => {
    try {
        const { id } = req.params;
        const orderHistories = await OrdersHistory.find({id })
            .populate({
                path: 'orderId',
                populate: {
                    path: 'items.serviceId', 
                    model: 'Service' 
                }
            })
            .populate({
                path: 'userId', // Assuming providerId is the correct reference
                model: 'ProviderDetails',
                select: 'providerName image age pincode radius gender address phone' // Select specific fields to include
            });

        if (!orderHistories || orderHistories.length === 0) {
            return res.status(404).json({ message: "No order histories found" });
        }

        res.status(200).json(orderHistories);
    } catch (error) {
        console.error("Error fetching order histories:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


};

export default ordersHistoryController;
