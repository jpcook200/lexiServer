const fs = require("fs");
const pool = require("./db");
const OpenAI = require("openai");
const { z } = require("zod");
const player = require('play-sound')({});
const { getWordsArrayFromCSV } = require("./src/words/wordsHelpers");
const categories = [
        "general",
        "people/relationships",
        "daily life",
        "home",
        "travel/places",
        "education/work",
        "health/body",
        "food/drink",
        "shopping",
        "nature/animals",
        "technology",
        "entertainment/culture",
        "society/politics",
        "advanced/abstract"
  ];

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const wordSchema = z.object({
    definition: z.string().min(1),
    part_of_speech: z.string().min(1),
    difficulty: z.enum(["a1", "a2", "b1", "b2", "c1", "c2"]),
    example_sentence: z.string().min(1),
    pronunciation: z.string().optional().default(""),
    category: z.enum(categories).optional().default("general")
});



const wordsArray = getWordsArrayFromCSV("./assets/english-frequency-list.csv");

let count = 0

const addEnglishWords = async () => {
    try {
        
        await pool.query('BEGIN');
        for (const word of wordsArray) {
            const id = word.id;
            const wordResult = await pool.query(
                `SELECT id FROM words WHERE id = $1`,
                [id]
            );
            if (wordResult.rows.length > 0) {
                console.log(`Word with id ${id} already exists, skipping.`);
                count++
                continue;
            }

            const translationsResult = await pool.query(
                `SELECT * FROM translations WHERE word_id = $1 AND lang_code = $2`,
                [id, "en"]
            );
            if (translationsResult.rows.length > 0) {
                console.log(`Translation for word id ${id} in English already exists, skipping.`);
                count++
                continue;
            }
           const prompt = `
                Provide JSON describing the English word "${word.word}".
                Return strictly this JSON. Ensure that the "category" field is always one of the following options. Do NOT invent any other categories:

                ${categories}

                {
                    "definition": "<short definition>",
                    "part_of_speech": "<noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection>",
                    "difficulty": <CEFR-style levels: a1, a2, b1, b2, c1, c2>,
                    "example_sentence": "<short sentence using the word>",
                    "pronunciation": "<IPA or phonetic spelling>",
                    "category": "<one of the allowed categories above>"
                }

                IMPORTANT: The "category" field must match exactly one of the listed categories. No other values are allowed.`;

            
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });

            let data;
            try {
                data = JSON.parse(response.choices[0].message.content);
            } catch (jsonErr) {
                throw new Error("Invalid JSON returned by OpenAI");
            }
            const validated = wordSchema.parse(data);
            const { rows } = await pool.query(
                `
                INSERT INTO words (id, category)
                VALUES ($1, $2)
                ON CONFLICT (id) DO NOTHING
                RETURNING id
                `,
                [id, validated.category]
            );
            if (rows.length === 0) {
                console.log(`Word with id ${id} already exists, skipping.`);
                continue;
            }
            const wordId = rows[0].id;
            await pool.query(
                `INSERT INTO translations 
                (word_id, lang_code, word, part_of_speech, pronunciation, definition, sentence, difficulty) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    wordId,
                    "en",
                    word.word,
                    validated.part_of_speech,
                    validated.pronunciation,
                    validated.definition,
                    validated.example_sentence,
                    validated.difficulty,
                ]
            );
            
            await pool.query('COMMIT');
            console.log(`✅ Added word: ${word.word}`);
            count++
            console.log(count)
        }  
    } catch (error) {
        player.play('./assets/errorsound.mp3', function(err){
            if (err) console.error("Could not play sound:", err);
        });
        await pool.query('ROLLBACK');
        console.error("Error adding words:", error);   
    }
}

const addWordsByLanguage = async (lang) => { 
    try {
        
        for (const word of wordsArray) {
            await pool.query('BEGIN');
            const id = word.id;
            const wordResult = await pool.query(
                `SELECT id FROM words WHERE id = $1`,
                [id,]
            );
            if (wordResult.rows.length === 0) {
                console.log(`Word with id ${id} not found, skipping translation.`);
                count++
                continue;
            }

            const translationsResult = await pool.query(
                `SELECT * FROM translations WHERE word_id = $1 AND lang_code = $2`,
                [id, lang.code]
            );
            if (translationsResult.rows.length > 0) {
                console.log(`Translation for word id ${id} in ${lang.name} already exists, skipping.`);
                count++
                continue;
            }

            const prompt = `
                Provide JSON describing the English word "${word.word}" and its ${lang.name} translation.
                Check to enusre your response is correct and ensure the ${lang.name} word is present in your example sentence before sending back.
                Return strictly this JSON:
                {
                    "definition": "<short definition in ${lang.name}>",
                    "part_of_speech": "<noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection> in strictly English",
                    "difficulty": <CEFR-style levels: a1, a2, b1, b2, c1, c2>,
                    "example_sentence": "<short sentence using the word in ${lang.name}>",
                    "pronunciation": "<IPA or phonetic spelling for how its pronouced in ${lang.name}>",
                    "translation": "<single word translation in ${lang.name}>"
                    "gender": "<if applicable, provide gender for nouns: <m, f, n if none use n>"
                }`;
            
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });
            console.log(response.choices[0].message.content);
            let data;
            try {
                data = JSON.parse(response.choices[0].message.content);
            } catch (jsonErr) {
                throw new Error("Invalid JSON returned by OpenAI");
            }
            const validated = wordSchema.extend({
                translation: z.string().min(1),
                gender: z.string().nullable().optional(),
            }).parse(data);
            const { rows } = await pool.query(
                `
                SELECT id FROM words WHERE id = $1;
                `,
                [id]
            );
            if (rows.length === 0) {
                console.log(`Word with id ${id} not found`);
                continue;
            }
            const wordId = rows[0].id;
            await pool.query(
                `INSERT INTO translations 
                (word_id, lang_code, word, part_of_speech, pronunciation, definition, sentence, difficulty, gender) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    wordId,
                    lang.code,
                    validated.translation,
                    validated.part_of_speech,
                    validated.pronunciation,
                    validated.definition,
                    validated.example_sentence,
                    validated.difficulty,
                    validated.gender
                ]
            );
            
            await pool.query('COMMIT');
            console.log(`✅ Added word: ${word.word} in ${lang.name}`);
            count++
            console.log(count)
        }  
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error fetching words by language:", error);
    }
};


// addWordsByLanguage(commonLanguages[2]);

addEnglishWords()