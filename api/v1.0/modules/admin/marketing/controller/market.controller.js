import Market from "../model/market.model.js";

const marketController = {
    createMarket: async (req, res) => {
        try {
            const { type, location, ageGroup, gender, message } = req.body;

            if (!type || !location || !ageGroup || !gender || !message) {
                return res.status(400).json({ message: "All fields are required." });
            }

            const newMarket = new Market({ type, location, ageGroup, gender, message });
            await newMarket.save();

            res.status(201).json({ message: "Market created successfully", market: newMarket });
        } catch (error) {
            res.status(500).json({ message: "Error creating market", error: error.message });
        }
    },

    getAllMarkets: async (req, res) => {
        try {
            const markets = await Market.find();
            res.status(200).json(markets);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving markets", error: error.message });
        }
    },
     getMarketById : async (req, res) => {
        try {
            const { id } = req.params;
            const getIdData = await Market.findById(id);
            
            if (!getIdData) {
                return res.status(404).json({ error: "Market not found" });
            }
    
            res.status(200).json(getIdData);
        } catch (err) {
            console.error(err); // Log the error for debugging
            res.status(500).json({ error: "Failed to get market by ID" });
    }
     }
};

export default marketController;
