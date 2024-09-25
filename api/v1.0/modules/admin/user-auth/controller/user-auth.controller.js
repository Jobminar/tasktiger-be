
import People from "../model/user-auth.model.js";

const userController={

    createUser:async(req,res)=>{
        try{
     const {name,mobile,location,pincode,email,address}=req.body

     if(!name || !mobile || !location || !pincode || !email || !address){
        return res.status(400).json({message:"Required fields is missing "})
     }
     const newUser=new People({name,mobile,location,pincode,email,address})
     const savedUser=await newUser.save()
     
     res.status(201).json({message:"successfully data added",user:savedUser})

        }
        catch(err){
            res.status(500).json({err:"Internal server error",details:err})
        }
    },
  
    getAllUsers:async(req,res)=>{
        try{
          const getData=await People.find()
          res.status(200).json(getData)
        }
        catch(error){
            res.status(500).json({error:"failed to get the data",details:error})
        }
    },
    getUserById:async(req,res)=>{
        try{
            const {id}=req.params
         const getUserdata=await People.findById(id)
         if(!getUserdata){
          return res.status(404).json({message:"user not found !!"})
         }
        res.status(200).json(getUserdata)
        }
        catch(error){
            res.status(500).json({error:"Failed to get the data",details:error})
        }
    }
 
}
export default userController

