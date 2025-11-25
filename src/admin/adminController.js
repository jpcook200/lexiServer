const pool = require("../../db");;
const queries = require("./adminQueries");
const OpenAI = require("openai");
const { z } = require("zod");
const { getWordsArrayFromCSV, getLanguageName } = require("../words/wordsHelpers");
const { promptsByLanguage, getPromptByLanguage } = require("./prompts");
const player = require('play-sound')({});
const { categories } = require("../../commonLanguages")

const model = "openai"

const client =
  model === "openai"
    ? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    : new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: "https://api.deepseek.com",
      });

const getFilteredWords = async (req, res) => { 
    const { searchTerm, language, category, difficulty, partOfSpeech, limit, pageNo, sortBy = 'word', visibility = null, accessLevel = null } = req.body;
    const offset = (pageNo - 1) * limit;
    const parsedVisibility = visibility === '' ? null : visibility;
    const parsedAccessLevel = accessLevel === '' ? null : accessLevel;
    const parsedCategory = category === '' ? null : category;

    try { 
        const wordsResult = await pool.query(queries.getFilteredWords, [
            searchTerm,
            language || null,
            difficulty || null,
            partOfSpeech || null,
            limit,
            offset,
            sortBy,
            parsedAccessLevel,
            parsedVisibility,
            parsedCategory
        ]); 

        console.log(wordsResult.rows[0])

        return res.status(200).json({ words: wordsResult.rows, count: wordsResult.rows[0]?.total_count || 0 });

    } catch (error) {
        console.error("Error fetching filtered words:", error);
        res.status(500).json({ error });
    }
}

const wordSchema = z.object({
  definition: z.string(),
  part_of_speech: z.enum([
    "noun",
    "verb",
    "adjective",
    "adverb",
    "pronoun",
    "preposition",
    "conjunction",
    "interjection",
    "determiner",
    "exclamation",
    "particle",
    "expression"
  ]),
  gender: z.enum([
        "male",
        "female",
        "neutral"
    ]),

  difficulty: z.string()
    .transform(val => val.toLowerCase())
    .refine(val => ["a1","a2","b1","b2","c1","c2"].includes(val), {
      message: "Invalid CEFR difficulty level"
    }),
    example_sentence: z.string(),
    phonetic_IPA: z.string().min(1),
    
});


const translationSchema = z.object({
    translation: z.string().min(1),
});

const translateWordsToLanguage = async (req, res) => { 
    const { languageCode, lowerIndex, upperIndex, all } = req.body;
    const languageName = getLanguageName(languageCode);
    try {
        if(!languageCode || !languageName) {
            return res.status(400).json({ error: "Invalid language code." });
        }

        const { rows: words } = await pool.query(
            `SELECT 
                w.id,
                t.word,
                t.definition
            FROM words w
            LEFT JOIN translations t 
                ON w.id = t.word_id 
                AND t.lang_code = $1
            WHERE t.word IS NOT NULL
            ORDER BY w.id ASC`,
            ['en']
        );

        const wordsArray = words.map(wordRow => { 
            return { id: wordRow.id, word: wordRow.word, definition: wordRow.definition };
        })
        const wordsToProcess =
            upperIndex === 0 && lowerIndex > 0
                ? words.slice(lowerIndex - 1)   // from lowerIndex to the end
                : all
                ? words
                    : words.slice(lowerIndex - 1, upperIndex);
        
        let count = 0
        for (const word of wordsToProcess) {
            await pool.query('BEGIN');
            const id = word.id;
            const englishDefinition = word.definition;

            const wordResult = await pool.query(
                `SELECT id FROM words WHERE id = $1`,
                [id]
            );

            if (wordResult.rows.length === 0) {
                console.log(`Word with id ${id} not found, skipping translation.`);
                count++
                continue;
            }

            const translationsResult = await pool.query(
                `SELECT * FROM translations WHERE word_id = $1 AND lang_code = $2`,
                [id, languageCode]
            );

            if (translationsResult.rows.length > 0) {
                console.log(`Translation for word id ${id} in ${languageName} already exists, skipping.`);
                count++
                continue;
            }

            const prompt = `
                Provide a JSON object that contains only the translation of the English word "${word.word}" into ${languageName}. Ensure the translation amtches the context of the following definition: "${englishDefinition}". 
                    Return strictly this JSON format and nothing else:

                    {
                        "translation": "<single word translation in ${languageName}>"
                    }

                    Ensure the translation is accurate and represents the most common meaning of the English word.
                    `;
            
            const response = await client.chat.completions.create({
                model: model === "openai" ? "gpt-4o-mini" : "deepseek-chat",
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
            
            const validated = translationSchema.parse(data);
            
            const { rows } = await pool.query(
                `SELECT id FROM words WHERE id = $1;`, [id]);
            
            if (rows.length === 0) {
                console.log(`Word with id ${id} not found`);
                continue;
            }
            const wordId = rows[0].id;
            
            await pool.query(
                `INSERT INTO translations 
                (word_id, lang_code, word) 
                VALUES ($1, $2, $3)`,
                [
                    wordId,
                    languageCode,
                    validated.translation
                ]
            );
            
            await pool.query('COMMIT');
            console.log(`✅ Added word: ${word.word} in ${languageName}`);
            count++
            console.log(count)
        }
        player.play('./assets/complete.mp3', function(err){
            if (err) console.error("Could not play sound:", err);
        });
        res.status(200).json({ message: "Translations added successfully.", count });
    } catch (error) {
        player.play('./assets/errorsound.mp3', function(err){
            if (err) console.error("Could not play sound:", err);
        });
        await pool.query('ROLLBACK');
        console.error("Error translating words:", error);
        res.status(500).json({ error });
    }
}

const addWordsMetaData = async (req, res) => {
    const { languageCode, lowerIndex, upperIndex, all } = req.body;
    const languageName = getLanguageName(languageCode);
    try {
        if(!languageCode || !languageName) {
            return res.status(400).json({ error: "Invalid language code." });
        }
        const { rows: words } = await pool.query(
            `SELECT 
                w.id,
                t.word,
                te.definition AS english_definition,
                te.sentence AS english_sentence
            FROM words w
            LEFT JOIN translations t 
                ON w.id = t.word_id 
                AND t.lang_code = $1
            LEFT JOIN translations te
                ON w.id = te.word_id
                AND te.lang_code = 'en'
            WHERE t.word IS NOT NULL
            ORDER BY w.id ASC;`,
            [languageCode]
        );

       const wordsToProcess =
            upperIndex === 0 && lowerIndex > 0
                ? words.slice(lowerIndex - 1)   // from lowerIndex to the end
                : all
                ? words
                : words.slice(lowerIndex - 1, upperIndex);

        let count = 0

        console.log("words to process: ", wordsToProcess)
        
        for (const wordRow of wordsToProcess) {
            await pool.query('BEGIN');

            const id = wordRow.id;
            
            const metaDataExists = await pool.query(
                `SELECT * FROM translations 
                WHERE word_id = $1 AND lang_code = $2
                AND part_of_speech IS NOT NULL
                AND definition IS NOT NULL
                AND sentence IS NOT NULL
                AND pronunciation IS NOT NULL
                AND difficulty IS NOT NULL
                AND gender IS NOT NULL`,
                [id, languageCode]
            );

            if (metaDataExists.rows.length > 0) {
                console.log(`Metadata for word id ${id} in ${languageName} already exists, skipping.`);
                count++
                continue;
            }

            const wordText = wordRow.word;
            const englishDefinition = wordRow.english_definition;
            const englishSentence = wordRow.english_sentence;
            console.log("English definition:", englishDefinition);
            console.log("English sentence:", englishSentence);
            const prompt = getPromptByLanguage(languageCode, wordText, languageName, englishDefinition, englishSentence);

            const response = await client.chat.completions.create({
                model: model === "openai" ? "gpt-4o-mini" : "deepseek-chat",
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

            const validated = wordSchema.parse(data);

            await pool.query(
                `UPDATE translations 
                SET part_of_speech = $1,
                    pronunciation = $2,
                    definition = $3,
                    sentence = $4,
                    difficulty = $5,
                    gender = $6
                WHERE word_id = $7 AND lang_code = $8`,
                [
                    validated.part_of_speech,
                    validated.phonetic_IPA,
                    validated.definition,
                    validated.example_sentence,
                    validated.difficulty.toLowerCase(),
                    validated.gender[0],
                    id,
                    languageCode
                ]
            );

            await pool.query('COMMIT');
            console.log(`✅ Updated word: ${wordText} with metadata`);
            count++
            console.log(count)
        }

        player.play('./assets/complete.mp3', function(err){
            if (err) console.error("Could not play sound:", err);
        });
        
        return res.status(200).json({ message: "Word metadata added successfully.", count });
        
    } catch (error) {
        player.play('./assets/errorsound.mp3', function (err) {
            if (err) console.error("Could not play sound:", err);
        }
        );
        await pool.query('ROLLBACK');
        console.error("Error fetching words by language:", error);
        return res.status(500).json({ error });
    }
}

const deleteTranslationsForLanguage = async (req, res) => { 
    const { languageCode } = req.body;
    try {
        await pool.query(
            `DELETE FROM translations WHERE lang_code = $1`,
            [languageCode]
        );
        res.status(200).json({ message: `Translations for language code ${languageCode} deleted successfully.` });
    } catch (error) {
        console.error("Error deleting translations:", error);
        res.status(500).json({ error });
    }
}

const getWordById = async (req, res) => {
    const wordId = req.params.id;
    const langCode = req.params.langCode || 'en';
    try {
        const { rows } = await pool.query(
            queries.getWordById, [langCode, wordId]);
        if (rows.length === 0) {
            return res.status(404).json(null);
        }
        res.status(200).json(rows[0]);
    } catch (error) {
        console.error("Error fetching word by ID:", error);
        res.status(500).json({ error });
    }
}

const editTranslation = async (req, res) => {
    const wordId = req.params.id;
    const langCode = req.params.langCode;
    const { word, definition, part_of_speech, pronunciation, sentence, difficulty, category, gender } = req.body;
    console.log(gender)
    try {
        await pool.query("BEGIN")
        await pool.query(
            queries.editTranslation,
            [
                word,
                definition,
                part_of_speech,
                pronunciation,
                sentence,
                difficulty,
                gender,
                wordId,
                langCode
            ]
        );

        await pool.query(queries.editCategory,
            [
                category,
                wordId
            ]
        );

        await pool.query("COMMIT")
        
        return res.status(200).json({ message: "Translation updated successfully." });
        
    } catch (error) {
        await pool.query("ROLLBACK")
        console.error("Error editing translation:", error);
        res.status(500).json({ error });
    }
};

const togglePrivate = async (req, res) => { 
    try {
        const { wordId } = req.body;
        await pool.query(
            `UPDATE words SET private = NOT private WHERE id = $1`,
            [wordId]
        );
        res.status(200).json({ message: "Word visibility updated successfully." });
        
    } catch (error) {
        console.error("Error toggling word visibility:", error);
        res.status(500).json({ error });
    }
}

const togglePremium = async (req, res) => { 
    try {
        const { wordId } = req.body;
        await pool.query(
            `UPDATE words SET premium = NOT premium WHERE id = $1`,
            [wordId]
        );
        console.log("Toggled premium for word ID:", wordId);
        res.status(200).json({ message: "Word visibility updated successfully." });
        
    } catch (error) {
        console.error("Error toggling word visibility:", error);
        res.status(500).json({ error });
    }
}

const addEnglishWords = async (req, res) => { 
    const { wordsCSV } = req.body
    let count = 0
    try { 
        if (!wordsCSV || wordsCSV.length === 0) {
            return res.status(400).json({ error: "No words provided." });
        }
        
        const wordsArray = wordsCSV.split(',')
        
        for (word of wordsArray) { 
            const formattedWord = word.trim().toLowerCase();
            await pool.query('BEGIN');

            const translationsResult = await pool.query(
                `SELECT * FROM translations WHERE word = $1 AND lang_code = $2`,
                [formattedWord, "en"]
            );
            
            if (translationsResult.rows.length > 0) {
                console.log(`Translation for word ${formattedWord} in English already exists, skipping.`);
                count++
                continue;
            }

            const prompt = getPromptByLanguage("en", formattedWord, "English");

            const response = await client.chat.completions.create({
                model: model === "openai" ? "gpt-4o-mini" : "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
                response_format: { type: "json_object" },
            });

            let data;

            try {
                data = JSON.parse(response.choices[0].message.content);
            } catch (jsonErr) {
                throw new Error("Invalid JSON returned by OpenAI");
            }

            console.log("Word data:", data);

            const extendedSchema = wordSchema.extend({
                category: z.enum(categories)
            });
            const validated = extendedSchema.parse(data);
            const { rows } = await pool.query(
                `
                    INSERT INTO words (category, private, premium)
                    VALUES ($1, $2, $3)
                    RETURNING id
                `,
                [validated.category, true, true]
            );

            const wordId = rows[0].id;
            await pool.query(
                `INSERT INTO translations 
                (word_id, lang_code, word, part_of_speech, pronunciation, definition, sentence, difficulty, gender) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [
                    wordId,
                    "en",
                    formattedWord,
                    validated.part_of_speech,
                    validated.phonetic_IPA,
                    validated.definition,
                    validated.example_sentence,
                    validated.difficulty,
                    "neutral"
                ]
            );
            
            await pool.query('COMMIT');
            console.log(`✅ Added word: ${formattedWord}`);
            count++
            console.log(count)
            
        }
        return res.status(200).json({ message: "English words added successfully.", count });
    } catch (error) {
        console.error("Error adding English words:", error);
        return res.status(500).json({ error });
    }
}

module.exports = {
    getFilteredWords,
    translateWordsToLanguage,
    addWordsMetaData,
    deleteTranslationsForLanguage,
    getWordById,
    editTranslation,
    togglePremium,
    togglePrivate,
    addEnglishWords,
};