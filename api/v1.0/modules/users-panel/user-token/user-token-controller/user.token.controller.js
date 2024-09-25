import UserToken from "../user-token-model/user.token.model.js";

const tokenController = {
  // Create or Update Token
  createOrUpdateToken: async (req, res) => {
    try {
      const { userId, token } = req.body;

      // Validate required fields
      if (!userId || !token) {
        return res.status(400).json({ message: "Required fields are missing: userId, token" });
      }

      // Prepare the data to be updated
      const updateData = { token };

      // Find user token by userId and update, or create new record if it doesn't exist
      const updatedToken = await UserToken.findOneAndUpdate(
        { userId },   // Filter by userId
        updateData,   // Update token value
        { new: true, upsert: true, setDefaultsOnInsert: true } // Options: create if not found, return updated doc
      );

      // Send success response
      res.status(200).json({ message: "Token successfully created or updated", token: updatedToken });
    } catch (error) {
      // Error handling
      console.error("Error creating or updating token:", error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  },

  // Get All Tokens
  getAllTokens: async (req, res) => {
    try {
      // Fetch all tokens from the database
      const tokens = await UserToken.find().populate('userId','phone name');
      
      // Send the tokens in response
      res.status(200).json(tokens);
    } catch (error) {
      // Error handling
      console.error("Error fetching tokens:", error);
      res.status(500).json({ error: "Failed to fetch tokens", details: error.message });
    }
  },
  deleteAllUserTokens:async(req,res) => {
    try{
     const result=await UserToken.deleteMany({})

     if(!result){
       return res.status(404).json({message:"token not found !!"})
     }
     res.status(200).json({message:"Deleted successfully",result})
    }
    catch(error){
      res.status(500).json({error:"Failed to delete",deatils:error})
    }
  }
};

export default tokenController;
