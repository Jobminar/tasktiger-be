import ProviderWatched from '../provider-watched-model/provider.watched.model.js'

const createOrUpdateWatchStatus = async (req, res) => {
  try {
    const { providerId, isWatched } = req.body;

    // Ensure providerId and isWatched are provided
    if (!providerId || isWatched === undefined) {
      return res.status(400).json({ message: 'ProviderId and isWatched are required' });
    }

    // Update or create the watch status
    const update = { isWatched };

    const options = {
      upsert: true,
      new: true,
      runValidators: true,
    };

    const updatedStatus = await ProviderWatched.findOneAndUpdate(
      { providerId },
      update,
      options
    );

    if (updatedStatus.isWatched) {
      res.status(200).json({ message: 'Watched video provider' });
    } else {
      res.status(200).json({ message: 'Did not watch video provider' });
    }

  } catch (error) {
    console.error('Error creating or updating video watch status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getWatchedProviderById=async(req,res)=>{
    try{
      const {providerId}=req.params
      const watched=await ProviderWatched.findOne({providerId})

      if(!watched){
        return res.status(404).json({message:"providerId not found !!"})
      }
      res.status(200).json(watched)
    }
    catch(error){
        res.status(500).json({error:"Failed to get data"})
    }
}

export default   {createOrUpdateWatchStatus,getWatchedProviderById}