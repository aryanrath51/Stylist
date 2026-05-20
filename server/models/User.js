import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    frontImage: { type: String, default: "" }, // 🌟 NEW: To store the Cloudinary URL!
    measurements: {
        bodyType: { type: String, default: "" },
        chest: { type: Number, default: 0 },
        waist: { type: Number, default: 0 },
        hips: { type: Number, default: 0 },
        shoulderWidth: { type: Number, default: 0 }
    }
});

export default mongoose.model('User', userSchema);