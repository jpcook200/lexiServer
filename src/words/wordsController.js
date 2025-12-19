const pool = require('../../db.js');
const queries = require('./wordsQueries');
const { commonLanguages } = require('../../commonLanguages');
const OpenAI = require("openai");
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const difficulties = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];
const freeWPDLimit = 15;
const proLimit = 30;
const getLanguageName = (code) => {
    const lang = commonLanguages.find(l => l.code === code);
    return lang ? lang.name : null;
}

const datetimeValid = (userDatetime) => { 
    const clientDate = new Date(userDatetime);
    const serverDate = new Date();
    // Compare year, month, and day
    const sameDate = 
        clientDate.getUTCFullYear() === serverDate.getUTCFullYear() &&
        clientDate.getUTCMonth() === serverDate.getUTCMonth() &&
        clientDate.getUTCDate() === serverDate.getUTCDate();

    // Difference in milliseconds for time leeway
    const diffMs = Math.abs(serverDate.getTime() - clientDate.getTime());
    const fiveMinutes = 5 * 60 * 1000;

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
    const userPremium = req.userAccessLevel === 'pro';
    const getDemoWords = req.body.getDemoWords || false;
    console.log(getDemoWords)
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

        if (!userPremium && limit > freeWPDLimit) { 
            return res.status(403).json({ words: [], error: `Free users can only request up to ${freeWPDLimit} words per day.` });
        }

        if (limit > proLimit) { 
            return res.status(403).json({ words: [], error: `Pro users can only request up to ${proLimit} words per day.` });
        }
        
        //needs to early return in peoduxctioun
        if (localDatetime && !datetimeValid(localDatetime) && process.env.NODE_ENV === 'production') {
            return res.status(401).json({ error: "Client datetime is not valid or out of sync." });
        }
        
        let wordsResults = []
        
        //if fist day, get demoi words first
        if (getDemoWords === true || getDemoWords === 'true') {
            if (!userPremium) {
                const { rows: freeRows } = await pool.query(queries.getFreeDemoWords, [nativeLang, learningLang, difficulty, limit, parsedExcludeIds]);
                wordsResults = freeRows;
            } else {
                const { rows: premiumRows } = await pool.query(queries.getDemoWords, [nativeLang, learningLang, difficulty, limit, parsedExcludeIds]);
                wordsResults = premiumRows;
            }
        }
        //if after getting demo words, theres not enough rows, fetch normal words
        if (wordsResults.length < limit) { 
            if (!userPremium) {
                const { rows: freeRows } = await pool.query(queries.getFreeWords, [nativeLang, learningLang, difficulty, limit, parsedExcludeIds]);
                wordsResults = [...wordsResults, ...freeRows];
            } else { 
                const { rows: premiumRows } = await pool.query(queries.getWords, [nativeLang, learningLang, difficulty, limit, parsedExcludeIds]);
                wordsResults = [...wordsResults, ...premiumRows];
            }
        }
        
        let difficultyIndex = difficulties.indexOf(difficulty);
        
        //if rows returns are still not enough incerase to the next difficulty
        while (wordsResults.length < limit) { 
            if (difficultyIndex >= difficulties.length - 1) {
                return res.json({words: wordsResults, lastSet: true});
            }
            const additionalLimit = limit - wordsResults.length;
            let additionalWords = []; 
            
            difficultyIndex++;
            
            if (!userPremium) {
                const { rows: freeAdditionalRows } = await pool.query(queries.getFreeWords, [nativeLang, learningLang, difficulties[difficultyIndex], additionalLimit, parsedExcludeIds]);
                additionalWords = freeAdditionalRows;
            } else { 
                const { rows: premiumAdditionalRows } = await pool.query(queries.getWords, [nativeLang, learningLang, difficulties[difficultyIndex], additionalLimit, parsedExcludeIds]);
                additionalWords = premiumAdditionalRows;
            }
            wordsResults.push(...additionalWords);
        }
        return res.json({ words: wordsResults, lastSet: false });

    } catch (error) {
        
        console.error("Error fetching daily words:", error);
        return res.status(500).json({ error });
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

const getWordsCount = async (req, res) => {
    try {
        const langCode = req.query.langCode;
        const premium = req.query.premium === 'true';

        let query = `
            SELECT COUNT(*) AS count
            FROM words w
            JOIN translations l ON l.word_id = w.id
            WHERE l.lang_code = $1
                AND w.private = false
        `;

        // Add premium filter only when premium = false
        if (!premium) {
            query += ` AND w.premium = false`;
        }

        const { rows } = await pool.query(query, [langCode]);
        return res.json({ count: rows[0].count });

    } catch (error) {
        console.error("Error fetching words count:", error);
        return res.status(500).json({ error: "Failed to count words" });
    }
};

const getNewTranslations = async (req, res) => {
    console.log("getNewTranslations called with body:", req.body);
    const { wordIds, newNativeLang } = req.body;
    try {
        const { rows } = await pool.query(`SELECT * FROM translations WHERE lang_code = $1 AND word_id = ANY($2);`, [newNativeLang, wordIds]);

        if(rows.length === 0) {
            return res.status(404).json({ error: "No translations found for the provided word IDs and language." });
        }

        return res.json(rows);
    } catch (error) { 
        console.error("Error fetching new translations:", error);
        return res.status(500).json({ error: "Failed to fetch new translations" });
    }
}


module.exports = {
    getDailyWords,
    textToSpeech,
    getWordsCount,
    getNewTranslations
}