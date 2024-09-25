import mongoose from "mongoose";
import Order from "../models/user.order.model.js";
import Address from "../../user-address/user-address-model/user.address.model.js";
import Coordinates from '../../../provider-panel/provider-cordinates/cordinates-model/cordinates.model.js';
import UserToken from '../../user-token/user-token-model/user.token.model.js';
import admin from '../../../_core/notifications/firebase.js'
import dotenv from "dotenv";
import Category from "../../../_core/service-categories/models/categories.model.js";
import Subcategory from '../../../_core/service-categories/models/sub.categories.model.js';
import Service from "../../../_core/service-categories/models/services.model.js";
const {ObjectId} = mongoose.Types;

dotenv.config();

const orderController = {

        createOrder: async (req, res) => {
            try {
                const { userId, addressId, categoryIds, subCategoryIds, items, paymentId } = req.body;
    
                // Validate request body
                if (!userId || !addressId || !categoryIds || !subCategoryIds || !items || !paymentId) {
                    return res.status(400).json({ message: 'Missing required fields' });
                }
    
                // Create a new order
                const order = new Order({
                    userId,
                    addressId,
                    categoryIds,
                    subCategoryIds,
                    items,
                    paymentId,
                });
    
                await order.save();
    
                // Populate the newly created order with related data
                const populatedOrder = await Order.findById(order._id)
                    .populate('userId', 'name email')
                    .populate('addressId', 'street city state pincode latitude longitude')
                    .populate({
                        path: 'items.categoryId',
                        model: Category,
                        select: 'name'
                    })
                    .populate({
                        path: 'items.subCategoryId',
                        model: Subcategory,
                        select: 'name'
                    })
                    .populate({
                        path: 'items.serviceId',
                        model: Service,
                        select: 'name serviceVariants'
                    });
    
                // Find the address associated with the order
                const address = await Address.findById(addressId);
                if (!address) {
                    return res.status(404).json({ message: 'Address not found' });
                }
    
                const { latitude, longitude } = address;

                //aggregation
                const radiusInMeters = 5000;
                const point = {
                    type: "Point",
                    coordinates: [longitude, latitude]
                };

                let categoriesIds = categoryIds.map(categoryId => new ObjectId(categoryId))
                let subCategoriesIds = subCategoryIds.map(subcategoryId => new ObjectId(subcategoryId))

                const providerTokens = await Coordinates.aggregate([
                    {
                        $geoNear: {
                            near: point,
                            distanceField: 'distance',
                            maxDistance: radiusInMeters,
                            spherical: true
                        }
                    },
                    {
                        $lookup: {
                            from: 'works',
                            localField: 'providerId',
                            foreignField: 'providerId',
                            as: 'workDetails'
                        }
                    },
                    {
                        $unwind: '$workDetails'
                    },
                    {
                        $match: {
                            "workDetails.works": {
                                "$elemMatch": {
                                    "categoryId": { "$in": categoriesIds },
                                    "subcategory": { "$in": subCategoriesIds }
                                }
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: 'providertokens',
                            localField: 'providerId',
                            foreignField: 'providerId',
                            as: 'tokens'
                        }
                    },
                    {
                        $unwind: '$tokens'
                    },
                    {
                        $match: {
                            "tokens.token" :{ "$ne" : "" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            providerId: 1,
                            token: '$tokens.token',
                            distance: 1,
                            workDetails: 1
                        }
                    }
                ]);

    
                // Fetch FCM tokens for user and matching providers
                const userToken = await UserToken.findOne({ userId });
    
                // Log user token and provider tokens
                console.log('User Token:', userToken);
                console.log('providerTokens:', providerTokens);

                // Prepare notification messages
                const userMessage = {
                    notification: {
                        title: 'Order Created',
                        body: 'Your order has been made and is looking for service providers.',
                    },
                    token: userToken ? userToken.token : "",
                    data: {
                        orderId: populatedOrder._id.toString(),
                    },
                };
    
                // Log the notification messages
                console.log('User Message:', userMessage);
    
                // Send notifications to the user
                if (userToken && userToken.token) {
                    try {
                        await admin.messaging().send(userMessage);
                        console.log("message send to user...");
                    } catch (error) {
                        console.error('Error sending notification to user:', error);
                    }
                }
    
                if(providerTokens?.length > 0){   
                    // Send notifications to matching providers
                    let promises = providerTokens?.map(async(providerToken) => {
                        return await admin.messaging().send({
                            notification: {
                                title: 'New Order!',
                                body: `New order for ${categoryIds.join(', ')} in your area. Check details.`,
                            },
                            token: providerToken.token,
                            data: {
                                order: JSON.stringify(populatedOrder),
                            },
                        })
                    })
                    await Promise.all(promises);
                    console.log("message send to provider..");
                }
    
                res.status(201).json({ message: 'Order created and notifications sent.', order: populatedOrder });
            } catch (error) {
                console.error('Error creating order:', error);
                res.status(500).json({ message: 'Internal Server Error' });
            }
        },
    
    

    getAllOrder: async (req, res) => {
        try {
            const orders = await Order.find()
                .populate('userId', 'name email')
                .populate('addressId', 'street city state pincode latitude longitude')
                .populate({
                    path: 'items.categoryId',
                    model: Category,
                    select: 'name'
                })
                .populate({
                    path: 'items.subCategoryId',
                    model: Subcategory,
                    select: 'name'
                })
                .populate({
                    path: 'items.serviceId',
                    model: Service,
                    select: 'name price'
                });

            res.status(200).json(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).json({ message: 'Internal Server Error',details:error });
        }
    },
    deleteAllOrders: async (req, res) => {
        try {
          // Delete all orders
          const result = await Order.deleteMany({});
          
          // Send the result of the deletion
          res.status(200).json({ message: 'All orders deleted successfully', result });
        } catch (error) {
          // Send an error response if something goes wrong
          res.status(500).json({ message: 'Failed to delete orders', details: error });
        }
      },
      

    deleteOrder:async(req,res) => {
        try{
         const {id}=req.params

         const order= await Order.findByIdAndDelete(id)

         if(!order){
           return res.status(404).json({message:"OrderId not found found !!"})
         }
         res.status(200).json({message:"deleted successfully"})
        }
        catch(error){
            res.status(500).json({error:"Failed to delete order"})
        }
    },
 
    getOrderByUserId:async(req,res) => {
        try{
          const {userId}=req.params

          const order=await Order.findOne({userId})
          .populate('userId','name email')
          .populate('addressId','address city pincode landmark state')
          .populate('categoryIds','name')
          .populate('subCategoryIds','name')
          .populate({
           path:'items.serviceId',
           select:'name'
        })

          if(!order){
            return res.status(400).json({message:"order id not found !!"})
          }
          res.status(200).json(order)
        }
        catch(error){
            res.status(500).json({error:"Failed to get orders data "})
        }
    }
    // getOrderByUserId: async (req, res) => {
    //     try {
    //         const { userId } = req.params;
    
    //         // Validate if userId is provided
    //         if (!userId) {
    //             return res.status(400).json({ error: 'UserId is required' });
    //         }
    
    //         // Check if the userId is a valid ObjectId
    //         let query = {};
    //         if (mongoose.isValidObjectId(userId)) {
    //             query.userId = mongoose.Types.ObjectId(userId); // Cast to ObjectId
    //         } else {
    //             return res.status(400).json({ error: 'Invalid userId format' });
    //         }
    
    //         // Query to find orders by userId
    //         const orders = await Order.find(query)
    //             .populate('userId', 'name email')  // Populate user details
    //             .populate('addressId', 'street city state pincode latitude longitude')  // Populate address details
    //             .populate({
    //                 path: 'items.categoryId',
    //                 select: 'name'
    //             })
    //             .populate({
    //                 path: 'items.subCategoryId',
    //                 select: 'name'
    //             })
    //             .populate({
    //                 path: 'items.serviceId',
    //                 select: 'name'
    //             });
    
    //         // If no orders are found, return 404
    //         if (!orders.length) {
    //             return res.status(404).json({ error: 'No orders found for this user' });
    //         }
    
    //         // Respond with the found orders
    //         return res.status(200).json(orders);
    //     } catch (error) {
    //         console.error('Error fetching orders by userId:', error);  // Log the error for better visibility
    //         return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    //     }
    // }
    
};

export default orderController;