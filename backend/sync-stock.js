require("dotenv").config();
const mongoose = require("mongoose");
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not found"); process.exit(1); }
mongoose.connect(MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const agg = await db.collection("stockitems").aggregate([
    { "$match": { "status": "available", "variantId": { "$ne": null } } },
    { "$group": { "_id": "$variantId", "count": { "$sum": 1 } } }
  ]).toArray();
  console.log("Variants with stock:", JSON.stringify(agg));
  const products = db.collection("products");
  let updated = 0;
  for (const v of agg) {
    const r = await products.updateOne(
      { "variants._id": v._id },
      { "$set": { "variants.$.stock": v.count } }
    );
    console.log("variantId=" + v._id + " -> stock=" + v.count + " modified=" + r.modifiedCount);
    if (r.modifiedCount > 0) updated++;
  }
  console.log("SYNC DONE - " + updated + " variants updated");
  await mongoose.disconnect();
  process.exit(0);
}).catch(e => { console.error("ERROR:", e.message); process.exit(1); });
