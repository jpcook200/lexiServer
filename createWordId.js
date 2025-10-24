const fs = require("fs");

// read the CSV file
const data = fs.readFileSync("./assets/english-frequency-list.csv", "utf8");

// split lines or commas
const words = data
  .split(/[\r\n,]+/)  // split by newlines or commas
  .map(w => w.trim())
  .filter(Boolean);    // remove empty entries

// add incremental IDs
const result = ["id,word", ...words.map((word, i) => `${i + 1},${word}`)].join("\n");

// write back to a new CSV
fs.writeFileSync("words_with_ids.csv", result, "utf8");

console.log("✅ Created words_with_ids.csv");
