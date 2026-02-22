/**
 * SHOPLX — Database Seed Script
 * Run: node seed.js
 * Populates MongoDB with 8 categories and 40 products using free Unsplash image URLs.
 */

import mongoose from "mongoose";
import slugify from "slugify";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI?.trim() ||
    "mongodb+srv://MyDatabase:DEEPAK5453@cluster0.ssreb.mongodb.net/shoplxDb?retryWrites=true&w=majority";

// ── SCHEMAS (inline, no import needed) ──────────────────────────────────────
const categorySchema = new mongoose.Schema(
    { name: String, slug: String, description: String },
    { timestamps: true }
);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);

const productSchema = new mongoose.Schema(
    {
        name: String,
        slug: String,
        description: String,
        price: Number,
        category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        quantity: Number,
        photo: { data: Buffer, contentType: String },
        photoUrl: String,
        shipping: Boolean,
    },
    { timestamps: true }
);
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

// ── CATEGORIES ───────────────────────────────────────────────────────────────
const CATEGORIES = [
    { name: "Electronics", description: "Gadgets, devices and accessories" },
    { name: "Fashion", description: "Clothing, footwear and accessories" },
    { name: "Home & Living", description: "Furniture, decor and essentials" },
    { name: "Sports", description: "Fitness gear, sportswear and more" },
    { name: "Beauty", description: "Skincare, makeup and personal care" },
    { name: "Books", description: "Fiction, non-fiction and education" },
    { name: "Toys & Games", description: "Fun for all ages" },
    { name: "Grocery", description: "Daily essentials and fresh goods" },
];

// ── PRODUCTS (40 items) ──────────────────────────────────────────────────────
const PRODUCTS = [
    // Electronics (8)
    { name: "Wireless Noise-Cancelling Headphones", catName: "Electronics", price: 4999, qty: 50, desc: "Premium over-ear headphones with 30-hour battery life, active noise cancellation and Hi-Res audio.", img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80" },
    { name: "Smart Watch Pro X", catName: "Electronics", price: 8999, qty: 30, desc: "Feature-packed smartwatch with health monitoring, GPS, AMOLED display and 7-day battery life.", img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80" },
    { name: "Portable Bluetooth Speaker", catName: "Electronics", price: 1999, qty: 80, desc: "360° immersive sound with 20W output, IPX7 waterproof rating and 12-hour playtime.", img: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&q=80" },
    { name: "4K Ultra HD Action Camera", catName: "Electronics", price: 12999, qty: 20, desc: "Shoot stunning 4K/60fps footage with EIS stabilization, waterproof up to 30m.", img: "https://images.unsplash.com/photo-1526779259212-939e64788e3c?w=600&q=80" },
    { name: "True Wireless Earbuds", catName: "Electronics", price: 2499, qty: 100, desc: "Adaptive ANC, 6mm drivers, touch controls and 36-hour total battery with charging case.", img: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80" },
    { name: "Mechanical Gaming Keyboard", catName: "Electronics", price: 3499, qty: 40, desc: "RGB backlit mechanical keyboard with Cherry MX Blue switches, anti-ghosting and media controls.", img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80" },
    { name: "Ergonomic Gaming Mouse", catName: "Electronics", price: 1799, qty: 60, desc: "16000 DPI optical sensor, 8 programmable buttons, RGB lighting and 80-hour battery life.", img: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80" },
    { name: "USB-C Hub 7-in-1", catName: "Electronics", price: 1299, qty: 75, desc: "Multi-port hub with 4K HDMI, 100W PD charging, USB 3.0, SD/microSD card reader.", img: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=600&q=80" },

    // Fashion (7)
    { name: "Premium Slim-Fit Chinos", catName: "Fashion", price: 1499, qty: 100, desc: "Stretch-cotton slim-fit chinos perfect for office and casual wear. Available in 6 colors.", img: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80" },
    { name: "Classic Leather Sneakers", catName: "Fashion", price: 2999, qty: 50, desc: "Clean minimalist leather sneakers with cushioned insole and durable rubber outsole.", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80" },
    { name: "Oversized Graphic Tee", catName: "Fashion", price: 699, qty: 200, desc: "100% organic cotton oversized tee with artistic graphic print. Relaxed fit for all-day comfort.", img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80" },
    { name: "Hooded Sweatshirt", catName: "Fashion", price: 1299, qty: 80, desc: "Heavyweight fleece hoodie with kangaroo pocket, ribbed cuffs and premium drawstring.", img: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=80" },
    { name: "Aviator Sunglasses", catName: "Fashion", price: 899, qty: 60, desc: "UV400 polarized aviator sunglasses with metal frame and spring hinges.", img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80" },
    { name: "Leather Bifold Wallet", catName: "Fashion", price: 599, qty: 120, desc: "Genuine leather slim bifold wallet with 6 card slots, ID window and RFID protection.", img: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600&q=80" },
    { name: "Summer Floral Dress", catName: "Fashion", price: 1099, qty: 70, desc: "Lightweight floral midi dress with adjustable straps and breathable fabric for summer.", img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80" },

    // Home & Living (6)
    { name: "Ceramic Pour-Over Coffee Set", catName: "Home & Living", price: 1799, qty: 35, desc: "Handcrafted ceramic pour-over dripper with matching server — perfect for specialty coffee.", img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80" },
    { name: "Scented Soy Wax Candles (Set of 3)", catName: "Home & Living", price: 799, qty: 90, desc: "Eco-friendly soy candles with cotton wicks. Lavender, Vanilla and Sandalwood fragrances.", img: "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&q=80" },
    { name: "Bamboo Cutting Board Set", catName: "Home & Living", price: 999, qty: 55, desc: "Anti-bacterial bamboo boards in 3 sizes with juice groove and non-slip rubber feet.", img: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80" },
    { name: "Geometric Concrete Planter", catName: "Home & Living", price: 649, qty: 40, desc: "Handmade geometric concrete planter — perfect for succulents and small indoor plants.", img: "https://images.unsplash.com/photo-1622547748225-3fc4abd2cca0?w=600&q=80" },
    { name: "Minimalist Desk Lamp", catName: "Home & Living", price: 2199, qty: 28, desc: "LED desk lamp with 5 brightness levels, USB-A charging port and flexible gooseneck arm.", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&q=80" },
    { name: "Linen Throw Pillow Cover (2-Pack)", catName: "Home & Living", price: 699, qty: 70, desc: "Textured linen pillow covers with fringe edge — fits standard 18×18 inch inserts.", img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=600&q=80" },

    // Sports (5)
    { name: "Yoga Mat with Straps", catName: "Sports", price: 1199, qty: 60, desc: "6mm anti-slip TPE yoga mat with alignment lines, carry strap and sweat-wicking surface.", img: "https://images.unsplash.com/photo-1601925228088-8e4c56ec5f03?w=600&q=80" },
    { name: "Adjustable Dumbbell Set", catName: "Sports", price: 5999, qty: 15, desc: "Space-saving adjustable dumbbells from 5-25 kg with quick-change dial mechanism.", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80" },
    { name: "Running Shoes Lite", catName: "Sports", price: 3499, qty: 45, desc: "Featherlight running shoes with responsive foam midsole, breathable mesh upper and reflective details.", img: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80" },
    { name: "Resistance Bands Set (5-Pack)", catName: "Sports", price: 799, qty: 100, desc: "Latex resistance bands in 5 levels from extra-light to heavy. Ideal for home workouts.", img: "https://images.unsplash.com/photo-1598289431512-b97b0917afce?w=600&q=80" },
    { name: "Stainless Steel Water Bottle 1L", catName: "Sports", price: 899, qty: 80, desc: "Double-wall insulated bottle keeps drinks cold 24h, hot 12h. BPA-free with leak-proof lid.", img: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&q=80" },

    // Beauty (4)
    { name: "Vitamin C Brightening Serum", catName: "Beauty", price: 1299, qty: 65, desc: "20% Vitamin C + hyaluronic acid serum that visibly reduces dark spots and boosts radiance.", img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80" },
    { name: "Charcoal Face Wash", catName: "Beauty", price: 399, qty: 120, desc: "Deep-cleansing charcoal face wash with salicylic acid to unclog pores and remove impurities.", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80" },
    { name: "Matte Lipstick Collection (Set of 6)", catName: "Beauty", price: 999, qty: 55, desc: "Long-lasting matte lipsticks with vitamin E. 6 curated shades from nudes to reds.", img: "https://images.unsplash.com/photo-1631214500004-d1e54b4d7b53?w=600&q=80" },
    { name: "Wooden Beard Grooming Kit", catName: "Beauty", price: 1499, qty: 30, desc: "Complete beard kit with boar bristle brush, fine-tooth comb, scissors and sandalwood oil.", img: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&q=80" },

    // Books (4)
    { name: "Atomic Habits (Paperback)", catName: "Books", price: 499, qty: 150, desc: "James Clear's #1 bestseller on building good habits and breaking bad ones. A life-changing read.", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80" },
    { name: "The Psychology of Money", catName: "Books", price: 399, qty: 120, desc: "Morgan Housel's timeless lessons on wealth, greed and happiness — a must-read finance book.", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80" },
    { name: "Deep Work (Hardcover)", catName: "Books", price: 599, qty: 80, desc: "Cal Newport's guide to achieving focus in a distracted world and producing meaningful results.", img: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&q=80" },
    { name: "The Alchemist", catName: "Books", price: 299, qty: 200, desc: "Paulo Coelho's international phenomenon — a magical story about following your dreams.", img: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=600&q=80" },

    // Toys & Games (3)
    { name: "Wooden Chess Set", catName: "Toys & Games", price: 1999, qty: 25, desc: "Handcrafted wooden chess set with weighted pieces and folding storage board.", img: "https://images.unsplash.com/photo-1586165368502-1bad197a6461?w=600&q=80" },
    { name: "LEGO Classic Creative Blocks", catName: "Toys & Games", price: 2499, qty: 40, desc: "790-piece classic LEGO brick set for imaginative building. Suitable for ages 4+.", img: "https://images.unsplash.com/photo-1618842676088-c4d48a6a7571?w=600&q=80" },
    { name: "Rubik's Cube Speed Edition", catName: "Toys & Games", price: 599, qty: 70, desc: "Smooth, fast magnet-equipped speed cube with anti-pop design for competitive solving.", img: "https://images.unsplash.com/photo-1609349093683-7dcbc3ef1a7c?w=600&q=80" },

    // Grocery (3)
    { name: "Organic Honey 500g", catName: "Grocery", price: 499, qty: 90, desc: "Raw, unfiltered organic honey sourced from Himalayan wildflowers. No additives or preservatives.", img: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80" },
    { name: "Cold Brew Coffee Pack", catName: "Grocery", price: 799, qty: 60, desc: "Premium cold brew coffee concentrate — just dilute and enjoy over ice. 10 servings per pack.", img: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80" },
    { name: "Mixed Nuts & Dry Fruits 500g", catName: "Grocery", price: 599, qty: 75, desc: "Premium mix of cashews, almonds, walnuts, raisins and pistachios. Zero additives.", img: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=600&q=80" },
];

// ── SEED FUNCTION ────────────────────────────────────────────────────────────
async function seed() {
    try {
        console.log("\n🔗  Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("✅  Connected!\n");

        // 1. Upsert categories
        console.log("📦  Inserting categories...");
        const catMap = {};
        for (const cat of CATEGORIES) {
            const slug = slugify(cat.name, { lower: true });
            const doc = await Category.findOneAndUpdate(
                { slug },
                { name: cat.name, slug, description: cat.description },
                { upsert: true, new: true }
            );
            catMap[cat.name] = doc._id;
            console.log(`   ✔  ${cat.name}`);
        }

        // 2. Upsert products
        console.log("\n🛍️   Inserting products...");
        let count = 0;
        for (const p of PRODUCTS) {
            const slug = slugify(p.name, { lower: true, strict: true });
            const catId = catMap[p.catName];
            if (!catId) { console.warn(`   ⚠  Category not found for: ${p.name}`); continue; }

            await Product.findOneAndUpdate(
                { slug },
                {
                    name: p.name,
                    slug,
                    description: p.desc,
                    price: p.price,
                    category: catId,
                    quantity: p.qty,
                    photoUrl: p.img,
                    shipping: true,
                },
                { upsert: true, new: true }
            );
            count++;
            console.log(`   ✔  [${p.catName}] ${p.name} — ₹${p.price}`);
        }

        console.log(`\n🎉  Done! Inserted/updated ${CATEGORIES.length} categories and ${count} products.\n`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("❌  Seed failed:", err.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
