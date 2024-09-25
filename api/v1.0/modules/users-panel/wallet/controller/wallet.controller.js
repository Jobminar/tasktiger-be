// walletController.js
import Wallet from '../model/wallet.model.js';

const walletController = {

    createWallet: async (req, res) => {
        const { userId, balance } = req.body;
    
        try {
            // Check if wallet already exists for the user
            const existingWallet = await Wallet.findOne({ userId: userId });
            if (existingWallet) {
                return res.status(400).json({ error: 'Wallet already exists for this user' });
            }
    
            // Create a new wallet
            const newWallet = new Wallet({
                userId: userId,
                balance: balance || 0 // Set default balance to 0 if not provided
            });
    
            // Save the new wallet to the database
            await newWallet.save();
    
            res.status(201).json({ message: 'Wallet created successfully', wallet: newWallet });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },    
    
    getBalance: async (req, res) => {
        const userId = req.params.userId;
        try {
            const wallet = await Wallet.findOne({ userId: userId }).populate('userId');
            if (wallet) {
                res.json({ userId: wallet.userId._id, balance: wallet.balance });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    updateBalance: async (req, res) => {
        const userId = req.params.userId;
        const { amount } = req.body;

        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        try {
            let wallet = await Wallet.findOne({ userId: userId });
            if (!wallet) {
                wallet = new Wallet({ userId: userId });
            }
            wallet.balance += amount;
            await wallet.save();
            res.json({ userId: wallet.userId, balance: wallet.balance });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },
   
};

export default walletController;
