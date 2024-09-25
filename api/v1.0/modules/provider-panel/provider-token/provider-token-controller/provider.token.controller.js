import ProviderToken from "../provider-token-model/provider.token.model.js";

const providerTokenController = {

    // Create or Update Provider Token
    createOrUpdateProviderToken: async (req, res) => {
        try {
            const { providerId, token } = req.body;

            // Validate required fields
            if (!providerId || !token) {
                return res.status(400).json({ message: "providerId and token are required" });
            }

            // Find and update the token if providerId exists, otherwise create a new record
            const updatedToken = await ProviderToken.findOneAndUpdate(
                { providerId },
                { token },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            res.status(201).json({ 
                message: "Provider token successfully saved or updated", 
                data: updatedToken 
            });
        } catch (error) {
            console.error('Error creating or updating provider token:', error);
            res.status(500).json({ 
                message: 'Internal server error', 
                details: error.message 
            });
        }
    },

    // Get all Provider Tokens
    getAllProviderTokens: async (req, res) => {
        try {
            const tokens = await ProviderToken.find().populate('providerId');
            res.status(200).json(tokens);
        } catch (error) {
            console.error('Error fetching provider tokens:', error);
            res.status(500).json({ 
                message: "Failed to fetch provider tokens", 
                details: error.message 
            });
        }
    },

    // Get Token by Provider ID
    getProviderTokenById: async (req, res) => {
        try {
            const { providerId } = req.params;

            const token = await ProviderToken.findOne({ providerId });
            if (!token) {
                return res.status(404).json({ message: "Provider token not found" });
            }

            res.status(200).json(token);
        } catch (error) {
            console.error('Error fetching provider token:', error);
            res.status(500).json({ 
                message: "Failed to get provider token", 
                details: error.message 
            });
        }
    },

    deleteAllProviderTokens:async(req,res) => {
        try{
          const result=await ProviderToken.deleteMany({})

          if(result.deletedCount>0){
        res.status(200).json({message:"deleted successfully ",result})
          }
          else {
            return res.status(404).json({ message: "No tokens found to delete" })
        }
        }
       
        catch(error){
            res.status(500).json({error:"Failed to delete",details:error})
        }
    },
 
    // Delete Provider Token
    deleteProviderToken: async (req, res) => {
        try {
            const { providerId } = req.params;

            const deletedToken = await ProviderToken.findOneAndDelete({ providerId });
            if (!deletedToken) {
                return res.status(404).json({ message: "Provider token not found" });
            }

            res.status(200).json({ message: "Provider token deleted successfully" });
        } catch (error) {
            console.error('Error deleting provider token:', error);
            res.status(500).json({ 
                message: "Failed to delete provider token", 
                details: error.message 
            });
        }
    }
};

export default providerTokenController;
