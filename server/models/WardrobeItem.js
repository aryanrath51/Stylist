import mongoose from 'mongoose';

const wardrobeItemSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    category: { type: String },
    subCategory: { type: String },
    color: { type: String },
    pattern: { type: String, default: "Solid" }, // 🌟 NEW: Defaults to "Solid" if it's plain!
    occasion: [{ type: String }]
});

export default mongoose.model('WardrobeItem', wardrobeItemSchema);