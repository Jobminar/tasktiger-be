import PackageFaq from "../package-faq-model/package.faq.model.js";

const packageFaqController = {
  createFaqPackage: async (req, res) => {
    try {
      const { question, answer } = req.body;

      if ( !question || !answer) {
        return res.status(400).json({ message: "Required fileds is missing " });
      }
      const newPackage = new PackageFaq({
    
        question,
        answer
      });
      await newPackage.save();
      res.status(201).json({ message: "Successfully added faq package" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Error creating FAQ", details: error.message });
    }
  },
  getAllFaqPackage: async (req, res) => {
    try {
      const faqPackage = await PackageFaq.find();
      if (faqPackage.length === 0) {
        return res.status(404).json({ message: "data not found in mongodb" });
      }
      res.status(200).json(faqPackage);
    } catch (error) {
      res
        .status(500)
        .json({ error: "fNo FAQ packages found", details: error.message });
    }
  },
  deleteFaqPackage:async(req,res) => {
    try{
      const {id}=req.params
      const faqPackage=await  PackageFaq.findByIdAndDelete(id)
      if(!faqPackage){
        returnres.status(404).json({message:"fNo FAQ id not found !!"})
      }
      res.status(200).json({message:"Deleted successfully "})
    }
    catch(error){
        res.status(500).json({error:""})
    }
  },
  updateFaqPackage:async(req,res) => {
    try{
      const {id}=req.params
      const update=req.body
      const faqpackage=await PackageFaq.findByIdAndUpdate(id,update,{new:true,runValidators:true})
      if(!faqpackage){
        return res.status(200).json({message:"id not found in this package"})
      }
      res.status(200).json({message:"updated successfully ",faqpackage})
    }
    catch(error){
        res.status(500).json({message:"failed to update data",details:error.message})
    }
  }
};
export default packageFaqController;
