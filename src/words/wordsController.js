const pool = require('../../db.js');
const queries = require('./wordsQueries');
const commonLanguages = require('../../commonLanguages');
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const difficulties = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

const getLanguageName = (code) => {
    const lang = commonLanguages.find(l => l.code === code);
    return lang ? lang.name : null;
}

const datetimeValid = (userDatetime) => { 
    const clientDate = new Date(localDatetime);
    const serverDate = new Date();
    // Compare year, month, and day
    const sameDate = 
        clientDate.getUTCFullYear() === serverDate.getUTCFullYear() &&
        clientDate.getUTCMonth() === serverDate.getUTCMonth() &&
        clientDate.getUTCDate() === serverDate.getUTCDate();

    // Difference in milliseconds for time leeway
    const diffMs = Math.abs(serverDate.getTime() - clientDate.getTime());
    const fiveMinutes = 5 * 60 * 1000;
    console.log(diffMs)
    console.log(sameDate)

    if (sameDate && diffMs <= fiveMinutes) {
        return true;
    } else {
        return false;
    }
};
    
const getDailyWords = async (req, res) => {
    const nativeLang = req.query.nativeLang;
    const learningLang = req.query.learningLang;
    const difficulty = req.query.difficulty;
    const limit = parseInt(req.query.limit);
    const excludeIds = req.body.excludeIds || [];
    const localDatetime = req.body.localDatetime;
    console.log(excludeIds)
    const parsedExcludeIds = excludeIds.map(id => JSON.parse(id)); 
    try {
        if(!nativeLang || !learningLang || !difficulty || !limit) {
            return res.status(400).json({ error: "Missing required query parameters." });
        }
        if(isNaN(limit) || limit <= 0) {
            return res.status(400).json({ error: "Limit must be a positive number." });
        }
        if(difficulty !== 'a1' && difficulty !== 'a2' && difficulty !== 'b1' && difficulty !== 'b2' && difficulty !== 'c1' && difficulty !== 'c2') {
            return res.status(400).json({ error: "Difficulty must be one of: a1, a2, b1, b2, c1, c2." });
        }
        if(nativeLang.length !== 2 || learningLang.length !== 2) {
            return res.status(400).json({ error: "Language codes must be 2-letter ISO codes." });
        }
        
        // //needs to early return in peoduxctioun
        // if (localDatetime && !datetimeValid(localDatetime)) {
        //     res.status(401).json({ error: "Client datetime is not valid or out of sync." });
        // }
        
        //get words from db
        const { rows } = await pool.query(queries.getWords, [nativeLang, learningLang, difficulty, limit, parsedExcludeIds]);
        
        let difficultyIndex = difficulties.indexOf(difficulty);
        
        //if rows returns are not enough
        while (rows.length < limit) { 
            if (difficultyIndex >= difficulties.length - 1) {
                return res.json({words: rows, lastSet: true});
            }
            const additionalLimit = limit - rows.length;
            difficultyIndex++;
            console.log(rows.length, limit);
            console.log("Fetching additional words with difficulty:", difficulties[difficultyIndex]);
            const { rows: additionalRows } = await pool.query(queries.getWords, [nativeLang, learningLang, difficulties[difficultyIndex], additionalLimit, parsedExcludeIds]);
            rows.push(...additionalRows);
        }

        return res.json({ words: rows, lastSet: false });

    } catch (error) {
        
        console.error("Error fetching daily words:", error);
        res.status(500).json({ error });
    }
}

const textToSpeech = async (req, res) => { 
    const { text, lang } = req.body;


    if(!text || !lang) {
        return res.status(400).json({ error: "Missing required body parameters." });
    }

    try {
        const mp3 = await openai.audio.speech.create({
            model: "gpt-4o-mini-tts",
            voice: "coral",
            input: text,
            instructions: `Speak the input in ${getLanguageName(lang) || ''} in a clear and calm way.`,
            });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        res.send(buffer);
        
    } catch (error) {
        console.error("Error with text-to-speech:", error);
        res.status(500).json({ error });

    }
};

module.exports = {
    getDailyWords,
    textToSpeech
}