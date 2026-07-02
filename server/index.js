import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

import User from './models/User.js';
import WardrobeItem from './models/WardrobeItem.js'; 

// Temporary storage for OTPs before account creation
const otpStorage = new Map(); 

// Configure email sender (Using Gmail - you can use your own credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address in .env
        pass: process.env.EMAIL_PASS  // Your Gmail App Password in .env
    }
});

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); 

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.log("❌ MongoDB Connection Error:", err));

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const upload = multer({ storage: multer.memoryStorage() });

app.get('/', (req, res) => res.send('Aura-Stylist Server is Running!'));

// ==========================================
// 🔐 AUTHENTICATION ROUTES
// ==========================================

// 1. ROUTE: Send OTP to Email
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already in use!" });

        // Generate a random 6-digit code
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store OTP in memory for 5 minutes
        otpStorage.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

        // Send the email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: '🔑 Your Aura Stylist Verification Code',
            text: `Your verification code is: ${otp}. It will expire in 5 minutes.`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "OTP sent successfully!" });
    } catch (error) {
        console.error("OTP Error:", error);
        res.status(500).json({ error: "Failed to send verification code." });
    }
});

// 2. ROUTE: Verify OTP & Create Account
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, password, otp } = req.body;

        const record = otpStorage.get(email);
        if (!record) return res.status(400).json({ error: "Please request an OTP first." });
        if (record.expiresAt < Date.now()) {
            otpStorage.delete(email);
            return res.status(400).json({ error: "OTP has expired. Request a new one." });
        }
        if (record.otp !== otp) return res.status(400).json({ error: "Incorrect verification code!" });

        // OTP is correct! Clear it from memory and create the user
        otpStorage.delete(email);

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || "super_secret_jwt_key", { expiresIn: '7d' });
        res.status(201).json({ token, userId: newUser._id });
    } catch (error) {
        res.status(500).json({ error: "Verification failed." });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already in use!" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || "super_secret_jwt_key", { expiresIn: '7d' });
        res.status(201).json({ token, userId: newUser._id });
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).json({ error: "Failed to sign up." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "User not found!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid credentials!" });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "super_secret_jwt_key", { expiresIn: '7d' });

        res.status(200).json({ 
            token, 
            userId: user._id, 
            measurements: user.measurements,
            frontImage: user.frontImage
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ error: "Failed to log in." });
    }
});

// ==========================================
// 👕 APP FEATURE ROUTES
// ==========================================
app.post('/api/analyze-body', upload.fields([
    { name: 'front', maxCount: 1 }, { name: 'back', maxCount: 1 }, { name: 'left', maxCount: 1 }, { name: 'right', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files.front) return res.status(400).json({ error: "At least a 'front' image is required." });
        
        console.log("📸 Processing 3D analysis...");
        const imageParts = [];
        const angles = ['front', 'back', 'left', 'right'];

        for (const angle of angles) {
            if (req.files[angle]) {
                const file = req.files[angle][0];
                imageParts.push({ inlineData: { data: file.buffer.toString('base64'), mimeType: file.mimetype } });
            }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = [
            "You are a professional tailor. Analyze these images.",
            "Estimate the following details:",
            "1. Body Type (e.g., Hourglass, Athletic, Pear, Rectangle, Inverted Triangle)",
            "2. Estimated Chest measurement (in inches)",
            "3. Estimated Waist measurement (in inches)",
            "4. Estimated Hips measurement (in inches)",
            "5. Estimated Shoulder Width (in inches)",
            "",
            "Return ONLY a JSON object like this:",
            '{ "bodyType": "Athletic", "chest": 40, "waist": 32, "hips": 38, "shoulderWidth": 18 }'
        ].join('\n');

        const result = await model.generateContent([prompt, ...imageParts]);
        let cleanedJson = result.response.text().replace(new RegExp("```json", "g"), "").replace(new RegExp("```", "g"), "").trim();
        const aiMeasurements = JSON.parse(cleanedJson);

        res.status(200).json({ message: "3D analysis successful!", measurements: aiMeasurements });
    } catch (error) {
        console.error("❌ Body AI Error:", error);
        res.status(500).json({ error: "Failed to analyze images." });
    }
});

app.put('/api/user/:userId/measurements', async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.userId, { measurements: req.body.measurements });
        res.status(200).json({ message: "Measurements updated!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to update measurements." });
    }
});

app.post('/api/user/:userId/avatar', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No image file provided." });
        
        console.log("📸 Uploading permanent Avatar to Cloudinary...");
        const uploadToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ folder: "aura_avatars" }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
                stream.end(req.file.buffer);
            });
        };
        
        const cloudinaryResult = await uploadToCloudinary();
        const permanentImageUrl = cloudinaryResult.secure_url;

        await User.findByIdAndUpdate(req.params.userId, { frontImage: permanentImageUrl });
        console.log("✅ Avatar Saved!");

        res.status(200).json({ frontImage: permanentImageUrl });
    } catch (error) {
        console.error("❌ Avatar Upload Error:", error);
        res.status(500).json({ error: "Failed to upload avatar." });
    }
});

app.post('/api/upload-clothing', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No image file provided." });
        
        const uploadToCloudinary = () => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream({ folder: "aura_wardrobe" }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                });
                stream.end(req.file.buffer);
            });
        };
        
        const cloudinaryResult = await uploadToCloudinary();
        const permanentImageUrl = cloudinaryResult.secure_url;

        const base64Image = req.file.buffer.toString('base64');
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = [
  "Analyze the clothing in this image. You must evaluate the upper body and lower body separately.",
  "Return ONLY a valid JSON object exactly matching this structure. Do not add markdown or text.",
  "{",
  "  \"isRestricted\": false, // Set this to true ONLY if the image contains an undergarment, underwear, lingerie, boxer shorts, brassiere, or innerwear.",
  "  \"top\": { \"found\": true, \"category\": \"Top\", \"subCategory\": \"Mock Neck Sweater\", \"color\": \"Cream\", \"pattern\": \"Ribbed\", \"occasion\": [\"Casual\"] },",
  "  \"bottom\": { \"found\": true, \"category\": \"Bottom\", \"subCategory\": \"Jeans\", \"color\": \"Blue\", \"pattern\": \"Solid\", \"occasion\": [\"Casual\"] }",
  "}",
  "CRITICAL: If the image is explicitly an undergarment/innerwear, you MUST set \"isRestricted\": true. Otherwise, always leave it false.",
  "CRITICAL: If there is no top visible, set top.found to false. If there is no bottom visible, set bottom.found to false."
].join('\n');

        const aiResult = await model.generateContent([prompt, { inlineData: { data: base64Image, mimeType: req.file.mimetype } }]);
        const rawText = aiResult.response.text();
        
        const startIndex = rawText.indexOf('{');
        const endIndex = rawText.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1) throw new Error("AI did not return valid JSON.");
        
        const jsonString = rawText.substring(startIndex, endIndex + 1);
        const aiResponse = JSON.parse(jsonString);

        // 🛑 THE RESTRICTION GATEKEEPER
        if (aiResponse.isRestricted === true) {
            return res.status(400).json({ 
                error: "Wardrobe Restriction: Undergarments and innerwear cannot be added to your profile.",
                isRestricted: true
            });
        }

        const aiItemsArray = [];
        if (aiResponse.top && aiResponse.top.found === true) aiItemsArray.push(aiResponse.top);
        if (aiResponse.bottom && aiResponse.bottom.found === true) aiItemsArray.push(aiResponse.bottom);

        const savedItems = [];
        let skippedCount = 0;

        for (const aiTags of aiItemsArray) {
            const detectedPattern = aiTags.pattern ? aiTags.pattern.trim() : "Solid";

            const existingItem = await WardrobeItem.findOne({
                userId: req.body.userId,
                category: { $regex: new RegExp(`^${aiTags.category.trim()}$`, 'i') },
                subCategory: { $regex: new RegExp(`^${aiTags.subCategory.trim()}$`, 'i') },
                color: { $regex: new RegExp(`^${aiTags.color.trim()}$`, 'i') },
                pattern: { $regex: new RegExp(`^${detectedPattern}$`, 'i') } 
            });

            if (existingItem) {
                console.log(`⚠️ Blocked Duplicate: ${aiTags.color} ${detectedPattern} ${aiTags.subCategory}`);
                skippedCount++;
                continue; 
            }

            const newItem = new WardrobeItem({
                userId: req.body.userId, 
                imageUrl: permanentImageUrl,
                category: aiTags.category,
                subCategory: aiTags.subCategory, 
                color: aiTags.color, 
                pattern: detectedPattern,
                occasion: aiTags.occasion
            });
            const saved = await newItem.save();
            savedItems.push(saved);
        }

        res.status(200).json({ items: savedItems, savedCount: savedItems.length, skippedCount: skippedCount });
    } catch (error) {
        console.error("❌ UPLOAD CRASH DETAILS:", error);
        res.status(500).json({ error: "Failed to process clothing." });
    }
});

// ==========================================
// 🧠 AI STYLIST ROUTE (WEATHER & EMPATHY AWARE!)
// ==========================================
app.post('/api/generate-outfit', async (req, res) => {
    try {
        // 🌟 EXTRACT PREFERENCES HERE
        const { userId, occasion, location, preferences } = req.body;
        const userProfile = await User.findById(userId);
        const userWardrobe = await WardrobeItem.find({ userId: userId });

        if (userWardrobe.length < 2) {
            return res.status(400).json({ error: "Not enough clothes in wardrobe to generate multiple outfits!" });
        }

        // 🌤️ 1. FETCH LIVE WEATHER
        let weatherContext = "Weather data not available.";
        let liveWeatherDisplay = "Unknown";
        
        if (location) {
            try {
                const weatherRes = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=%C+%t`);
                if (weatherRes.ok) {
                    const weatherText = await weatherRes.text();
                    weatherContext = `The real-time weather forecast for ${location} is: ${weatherText.trim()}.`;
                    liveWeatherDisplay = weatherText.trim();
                }
            } catch (error) {
                console.log("Weather API skipped or failed.");
            }
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        // 🌤️ 2. INJECT WEATHER AND BOUNDARIES INTO THE AI PROMPT
        const prompt = [
            "You are an elite celebrity fashion stylist.",
            "Body Type: " + (userProfile?.measurements?.bodyType || "Unknown"),
            "Measurements: Chest " + (userProfile?.measurements?.chest || "Unknown") + '", Waist ' + (userProfile?.measurements?.waist || "Unknown") + '"',
            "Occasion: " + occasion + " in " + (location || 'Not specified'),
            "LIVE WEATHER FORECAST: " + weatherContext,
            // 🌟 INJECT USER BOUNDARIES HERE
            "USER STYLE BOUNDARIES & PREFERENCES: " + (preferences || "None specified. Feel free to use any appropriate items."),
            "CRITICAL INSTRUCTION: You MUST factor the live weather into your clothing choices. If it is hot, choose breathable items. If it is cold, prioritize sweaters and jackets. Mention the weather in your explanation.",
            "CRITICAL INSTRUCTION: You MUST strictly respect the USER STYLE BOUNDARIES. Do not suggest anything they are uncomfortable wearing.",
            "AVAILABLE WARDROBE (JSON):",
            JSON.stringify(userWardrobe),
            "Select a MINIMUM of 4 and a MAXIMUM of 10 different outfit combinations from the wardrobe.",
            "Return ONLY a JSON ARRAY of objects exactly like this, without any conversational text:",
            "[",
            "  {",
            '    "topId": "chosen _id",',
            '    "bottomId": "chosen _id",',
            '    "explanation": "Why this flatters their body, respects their boundaries, AND makes sense for the weather.",',
            '    "aiRating": 9.5',
            "  }",
            "]"
        ].join('\n');

        const aiResult = await model.generateContent(prompt);
        const rawText = aiResult.response.text();
        
        const startIndex = rawText.indexOf('[');
        const endIndex = rawText.lastIndexOf(']');
        
        if (startIndex === -1 || endIndex === -1) throw new Error("AI did not return a valid array.");
        
        const jsonString = rawText.substring(startIndex, endIndex + 1);
        
        res.status(200).json({ 
            suggestions: JSON.parse(jsonString),
            weatherFetched: liveWeatherDisplay 
        });
    } catch (error) {
        console.error("❌ STYLIST CRASH:", error);
        res.status(500).json({ error: "Failed to generate outfit." });
    }
});

app.get('/api/wardrobe/:userId', async (req, res) => {
    try {
        const items = await WardrobeItem.find({ userId: req.params.userId });
        res.status(200).json(items);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: "Failed to fetch wardrobe." });
    }
});

app.delete('/api/wardrobe/:id', async (req, res) => {
    try {
        await WardrobeItem.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Deleted!" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete item." });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});