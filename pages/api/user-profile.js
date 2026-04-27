// pages/api/user-profile.js
// GET  — fetch saved profile for the signed-in user
// POST — upsert profile (only for signed-in users, only called after first order)

import { getAuth } from '@clerk/nextjs/server';
import connectDB from '../../lib/mongodb';
import UserProfile from '../../models/UserProfile';

export default async function handler(req, res) {
    const { userId } = getAuth(req);

    // Must be signed in
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await connectDB();

    // ─── GET: return saved profile ───────────────────────────────
    if (req.method === 'GET') {
        try {
            const profile = await UserProfile.findOne({ clerkUserId: userId }).lean();
            return res.status(200).json({ success: true, profile: profile || null });
        } catch (err) {
            console.error('UserProfile GET error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    // ─── POST: create / update profile ───────────────────────────
    if (req.method === 'POST') {
        const { name, email, phone, address } = req.body || {};

        if (!name && !email && !phone && !address) {
            return res.status(400).json({ success: false, message: 'No data provided' });
        }

        try {
            const update = {};
            if (name)    update.name    = String(name).trim().slice(0, 200);
            if (email)   update.email   = String(email).trim().slice(0, 320);
            if (phone)   update.phone   = String(phone).trim().slice(0, 20);
            if (address) update.address = String(address).trim().slice(0, 1000);

            const profile = await UserProfile.findOneAndUpdate(
                { clerkUserId: userId },
                { $set: update },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );

            return res.status(200).json({ success: true, profile });
        } catch (err) {
            console.error('UserProfile POST error:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
}
