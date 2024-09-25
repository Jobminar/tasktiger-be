
import Tier from '../tier-model/tier.model.js';

const tierController = {

    createTier: async (req, res) => {
        try {
            const { tierName, locationIds } = req.body;

            // Validate the input
            if (!tierName || !Array.isArray(locationIds)) {
                return res.status(400).json({ error: "Invalid input" });
            }

          
            const newTier = new Tier({
                tierName,
                locationIds
            });

            
            const savedTier = await newTier.save();

            // Respond with the saved Tier
            res.status(201).json(savedTier);
        } catch (error) {
            console.error(error);  // Log error for debugging
            res.status(500).json({ error: "Failed to create tier",err:error });
        }
    },

    
    getAllTier: async (req, res) => {
        try {
            // Populate the locationIds field with full Location documents
            const tiers = await Tier.find().populate({
                path: 'locationIds',
                model: 'Location',  
            });
    
            if (tiers.length === 0) {
                return res.status(404).json({ message: "No tier data found!" });
            }
    
            res.status(200).json(tiers);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to get data", err: error });
        }
    },
    

   

    deleteTier:async(req,res) => {
      try{
        const {id}=req.params

       const tier=await Tier.findByIdAndDelete(id)
       if(!tier){
         return res.status(404).json({message:"tier id not found !!"})
       }
       res.status(200).json({message:"tier deleted successfully"})
      }
      catch(error){
        res.status(500).json({error:"Failed to deleted !!",err:error})
      }
    },
   
    updateTier: async (req, res) => {
        try {
            const { id } = req.params;
            const { tierName, locationIds } = req.body;

            // Validate the input
            if (!tierName || !Array.isArray(locationIds)) {
                return res.status(400).json({ error: "Invalid input" });
            }

            // Find the tier and update it
            const updatedTier = await Tier.findByIdAndUpdate(
                id,
                { tierName, locationIds },
                { new: true, runValidators: true } // Return the updated document and run schema validation
            );

            if (!updatedTier) {
                return res.status(404).json({ message: "Tier ID not found!" });
            }

            res.status(200).json(updatedTier);
        } catch (error) {
            console.error(error);  // Log error for debugging
            res.status(500).json({ error: "Failed to update tier", err: error });
        }
    }

};

export default tierController;
