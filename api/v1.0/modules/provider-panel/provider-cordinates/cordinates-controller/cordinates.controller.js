
import Cordinates from "../cordinates-model/cordinates.model.js";

const cordinatesController={

    createCordinates:async(req,res)=>{
        try{
          const {providerId,longitude,latitude}=req.body
          if(!providerId || !longitude ||!latitude){
            return res.status(404).json({message:"Required fields is missing !!!"})
           }
          const newCordinates=new Cordinates({
            providerId,
            location:{
              type: "Point",
              coordinates: [longitude, latitude]
            }
          })
          await newCordinates.save()
          res.status(201).json({message:"Successfully address data added"})
        }
        catch(error){
            res.status(500).json({error:"internal server error",error:error})
        }
    },
        getAllCordinates:async(req,res)=>{
            try{
            const cordinates=await Cordinates.find()
            res.status(200).json(cordinates)
            }
            catch(error){
                res.status(500).json({error:"failed to get cordinates",error:error})
            }
        },
        getProviderById:async(req,res)=>{
            try{
             const { providerId }= req.params
             const cordinates=await Cordinates.find({providerId})
             res.status(200).json(cordinates)
            }
            catch(error){
                res.status(500).json({error:"failed to get data"})
            }
        },
        deleteCordinates: async (req, res) => {
            try {
              const { id } = req.params;
              const cordinates = await Cordinates.findByIdAndDelete(id);
        
              if (!cordinates) {
                return res.status(404).json({ message: "Coordinates not found" });
              }
        
              res.status(200).json({ message: "Successfully deleted", cordinates:cordinates._id });
            } catch (error) {
              res.status(500).json({ message: "Failed to delete coordinates", error: error.message });
            }
          },
}
export default cordinatesController