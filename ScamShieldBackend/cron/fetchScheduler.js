const cron = require("node-cron");
const { fetchLatestScams } = require("../services/scraperService");

// Run immediately on server boot
fetchLatestScams().catch(console.error);

// Schedule to run every 1 hour (0 * * * *)
// We use every 30 mins for faster development validation (*/30 * * * *)
cron.schedule("*/30 * * * *", async () => {
  console.log("Cron Job Triggered: Fetching latest scam alerts...");
  try {
    await fetchLatestScams();
  } catch (error) {
    console.error("Failed to run scheduled fetch job", error);
  }
});

console.log("Scam data fetch scheduler initialized. Job will run every 30 minutes.");
