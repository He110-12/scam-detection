require("dotenv").config();
const mongoose = require("mongoose");
const ScamAlert = require("./models/ScamAlert");

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
];

const seedOlderHistoricalData = async () => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/scamshield");
    await ScamAlert.deleteMany({ publishedAt: { $lt: new Date("2015-01-01") } });
  
    console.log("Backfilling older years 2005-2014...");
    const currentYear = new Date().getFullYear();
    let historicalInserts = 0;
    
    const sampleCategories = ["phishing", "banking fraud", "investment scam", "upi scam", "digital arrest", "job fraud", "online scam"];
    const sampleThreats = ["medium", "high", "low"];
  
    for (let year = currentYear - 20; year < currentYear - 10; year++) {
      for (const state of INDIAN_STATES) { 
        const numIncidents = Math.floor(Math.random() * 3) + 2;
        for(let i = 0; i < numIncidents; i++) {
          const historicDate = new Date(`${year}-0${Math.floor(Math.random() * 8) + 1}-${Math.floor(Math.random()*20)+10}T10:00:00Z`);
          const cat = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
          const threat = sampleThreats[Math.floor(Math.random() * sampleThreats.length)];
          
          const imageMap = {
             "phishing": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&auto=format&fit=crop",
             "banking fraud": "https://images.unsplash.com/photo-1550565118-3d1432d2182c?w=500&auto=format&fit=crop",
             "investment scam": "https://images.unsplash.com/photo-1611974714131-77884ff80ba2?w=500&auto=format&fit=crop",
             "upi scam": "https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=500&auto=format&fit=crop",
             "digital arrest": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&auto=format&fit=crop",
             "job fraud": "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=500&auto=format&fit=crop",
             "online scam": "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=500&auto=format&fit=crop"
          };

          const titleVariance = `[Archive ${year}] Major ${cat.toUpperCase()} incident reported in ${state}`;
          
          await ScamAlert.create({
            title: titleVariance + ` #${Math.floor(Math.random()*10000)}`,
            description: `Historical Archive from ${year}. Authorities in ${state} reported significant financial losses regarding this ${cat} method. Citizens were warned to stay vigilant.`,
            url: `https://archive.scamshield.local/${year}/${state.replace(/ /g, "")}/${Math.random()}`,
            source: "Historical Police Records",
            publishedAt: historicDate,
            state: state,
            category: cat,
            threat_level: threat,
            image: imageMap[cat] || "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&auto=format&fit=crop"
          });
          historicalInserts++;
        }
      }
    }
    console.log(`Successfully backfilled ${historicalInserts} old historical records.`);
    process.exit(0);
};

seedOlderHistoricalData();
