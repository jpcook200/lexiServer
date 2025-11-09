const fs = require("fs");
const commonLanguages = require("../../commonLanguages");

function getWordsArrayFromCSV(filePath) {
  const data = fs.readFileSync(filePath, "utf8");
  return data
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map((word, index) => ({
      id: index + 1,
      word
    }));
}

const getLanguageName = (code) => {
  const lang = commonLanguages.find(l => l.code === code);
  return lang ? lang.name : '';
};


module.exports = {
    getWordsArrayFromCSV,
    getLanguageName,
};