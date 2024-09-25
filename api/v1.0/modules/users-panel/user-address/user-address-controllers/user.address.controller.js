import Address from "../user-address-model/user.address.model.js";

const userAddressController = {
  createAddress: async (req, res) => {
    try {
      const {
        userId,
        username,
        bookingType,
        mobileNumber,
        address,
        city,
        pincode,
        landmark,
        state,
        latitude,
        longitude,
      } = req.body;
      if (
        !userId ||
        !username ||
        !bookingType ||
        !mobileNumber ||
        !address ||
        !city ||
        !pincode ||
        !landmark ||
        !state ||
        !latitude ||
        !longitude
      ) {
        return res
          .status(400)
          .json({ message: "Required fields for missing !!" });
      }
      const newAddress = new Address({
        userId,
        username,
        bookingType,
        mobileNumber,
        address,
        city,
        pincode,
        landmark,
        state,
        latitude,
        longitude,
      });

      await newAddress.save();

      res.status(201).json({ message: "Address successfully added" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: "Internal server error", err: error });
    }
  },
  getAllAddress: async (req, res) => {
    try {
      const address = await Address.find();
      res.status(200).json(address);
    } catch (error) {
      res.status(500).json({ error: "Failed to get data" });
    }
  },

  updateAddress:async(req,res)=>{
    try{
    const {id}=req.params
    const update=req.body
    const address=await Address.findByIdAndUpdate(id,update,{new:true,runValidators:true})
    if(!address){
      res.status(404).json({message:"address not found !!"})
    }
    await address.save()
    res.status(201).json({message:"update successfully data"})
    }
    catch(error){
      res.status(500).json({error:'failed to update',details:error})
    }
  },
  
 getUserById:async(req,res)=>{
   
  try{
    const {userId}=req.params
    const address=await Address.find({userId})
    if(!address){
      return res.status(404).json({message:"address not found !!"})
    }
  res.status(200).json(address)
  }
  catch(error){
    res.status(500).json({error:'Failed to get data'})
  }

 },

 deleteAllAddress: async (req, res) => {
  try {
    await Address.deleteMany({});
    res.status(200).json({ message: "All addresses deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete all addresses", error: error.message });
  }
},
 
deleteAddress: async (req, res) => {
  try {
    const { id } = req.params;

    const address = await Address.findByIdAndDelete(id);

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully", address: address._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete address" });
  }
}, 

deleteAddressByUserId: async (req, res) => {
  try {
    const { userId } = req.params;

    const address = await Address.findOneAndDelete({ userId });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully", address: address._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete address" });
  }
},

};
export default userAddressController;
