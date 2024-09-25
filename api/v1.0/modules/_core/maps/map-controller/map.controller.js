import { getGeocode } from '../map-model/map.model.js';

const getGeocodeController = async (req, res) => {
  // Check both req.body and req.query for the address parameter
  const address = req.body.address || req.query.address;

  if (!address) {
    return res.status(400).json({ error: "Address parameter is required" });
  }

  try {
    const data = await getGeocode(address);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export default getGeocodeController;
