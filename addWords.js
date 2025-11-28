const fs = require("fs");
const pool = require("./db");
const OpenAI = require("openai");
const { z } = require("zod");
const player = require('play-sound')({});
const { getWordsArrayFromCSV } = require("./src/words/wordsHelpers");


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});



const prompts = (word, sentence, langCode) => {
    const prompts = {
        en: `You are a linguistic assistant. Given the english word: ${word} in the context of the sentence "${sentence}" return the **phonetic pronunciation of the word in the context of that definition**, strictly using the **International Phonetic Alphabet (IPA)**.

            **Requirements:**
            1. Output must be a **JSON object** with the following structure:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. Only include the **phonetic transcription** in the "phonetic_ipa" field — no explanations, comments, or additional text.
            3. Ensure the IPA transcription is **accurate** for the given meaning of the word.
            4. Do not transliterate or use approximate spelling — it must strictly follow IPA symbols.`,

        fr: `Vous êtes un assistant linguistique. Étant donné le mot français : ${word} dans le contexte de la phrase "${sentence}", retournez la **prononciation phonétique du mot dans le contexte de cette définition**, en utilisant strictement **l'Alphabet Phonétique International (API)**.

            **Exigences :**
            1. La sortie doit être un **objet JSON** avec la structure suivante :
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. Incluez uniquement la **transcription phonétique** dans le champ "phonetic_ipa" — pas d'explications, commentaires ou texte supplémentaire.
            3. Assurez-vous que la transcription IPA est **exacte** pour le sens donné du mot.
            4. Ne pas translittérer ou utiliser une orthographe approximative — elle doit suivre strictement les symboles IPA.`,

        es: `Eres un asistente lingüístico. Dada la palabra en español: ${word} en el contexto de la frase "${sentence}", devuelve la **pronunciación fonética de la palabra en el contexto de esa definición**, utilizando estrictamente el **Alfabeto Fonético Internacional (AFI)**.

            **Requisitos:**
            1. La salida debe ser un **objeto JSON** con la siguiente estructura:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. Incluya únicamente la **transcripción fonética** en el campo "phonetic_ipa" — sin explicaciones, comentarios o texto adicional.
            3. Asegúrese de que la transcripción IPA sea **precisa** para el significado dado de la palabra.
            4. No translitere ni use ortografía aproximada — debe seguir estrictamente los símbolos IPA.`,

        de: `Sie sind ein linguistischer Assistent. Gegeben das deutsche Wort: ${word} im Kontext des Satzes "${sentence}", geben Sie die **phonetische Aussprache des Wortes im Kontext dieser Definition** zurück, strikt unter Verwendung des **Internationalen Phonetischen Alphabets (IPA)**.

            **Anforderungen:**
            1. Die Ausgabe muss ein **JSON-Objekt** mit der folgenden Struktur sein:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. Geben Sie nur die **phonetische Transkription** im Feld "phonetic_ipa" an — keine Erklärungen, Kommentare oder zusätzlichen Text.
            3. Stellen Sie sicher, dass die IPA-Transkription **genau** für die gegebene Bedeutung des Wortes ist.
            4. Nicht transliterieren oder approximative Schreibweisen verwenden — sie muss strikt den IPA-Symbolen folgen.`,

        it: `Sei un assistente linguistico. Data la parola italiana: ${word} nel contesto della frase "${sentence}", restituisci la **pronuncia fonetica della parola nel contesto di quella definizione**, usando rigorosamente **l'Alfabeto Fonetico Internazionale (IPA)**.

            **Requisiti:**
            1. L'output deve essere un **oggetto JSON** con la seguente struttura:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. Includi solo la **trascrizione fonetica** nel campo "phonetic_ipa" — niente spiegazioni, commenti o testo aggiuntivo.
            3. Assicurati che la trascrizione IPA sia **accurata** per il significato dato della parola.
            4. Non translitterare o usare ortografia approssimativa — deve seguire rigorosamente i simboli IPA.`,
        
        ja: `あなたは言語学アシスタントです。与えられた日本語の単語：${word} を文脈 "${sentence}" 内で使用した場合の**発音記号（IPA）での音声表記**を返してください。

            **要件:**
            1. 出力は次の構造の**JSONオブジェクト**であること：
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. "phonetic_ipa" フィールドに**音声記号のみ**を含めること — 説明、コメント、追加テキストは不要。
            3. 与えられた意味に対して IPA の表記が**正確**であること。
            4. 文字を音訳したり近似表記を使わず、IPA 記号に厳密に従うこと。`,

        zh: `你是语言学助手。给定中文单词：${word}，在句子 "${sentence}" 的语境中返回该单词的**国际音标（IPA）发音**。

            **要求:**
            1. 输出必须是以下结构的**JSON对象**：
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. 仅在 "phonetic_ipa" 字段中包含**音标** — 不要添加解释、评论或其他文本。
            3. 确保 IPA 音标对于给定词义是**准确的**。
            4. 不要使用音译或近似拼写 — 必须严格遵循 IPA 符号。`,

        ru: `Вы являетесь лингвистическим помощником. Данное русское слово: ${word} в контексте предложения "${sentence}". Верните **фонетическое произношение слова в контексте данного определения**, строго используя **Международный фонетический алфавит (IPA)**.

            **Требования:**
            1. Вывод должен быть **JSON-объектом** со следующей структурой:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. В поле "phonetic_ipa" включайте только **фонетическую транскрипцию** — никаких объяснений, комментариев или дополнительного текста.
            3. Убедитесь, что IPA транскрипция **точная** для данного значения слова.
            4. Не транслитерируйте и не используйте приближенное написание — строго используйте IPA символы.`,

        pt: `Você é um assistente linguístico. Dada a palavra em português: ${word} no contexto da frase "${sentence}", retorne a **pronúncia fonética da palavra no contexto dessa definição**, usando estritamente o **Alfabeto Fonético Internacional (IPA)**.

            **Requisitos:**
            1. A saída deve ser um **objeto JSON** com a seguinte estrutura:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. Inclua apenas a **transcrição fonética** no campo "phonetic_ipa" — sem explicações, comentários ou texto adicional.
            3. Garanta que a transcrição IPA seja **precisa** para o significado dado da palavra.
            4. Não translitere ou use escrita aproximada — deve seguir estritamente os símbolos IPA.`,
        
        hi: `आप एक भाषावैज्ञानिक सहायक हैं। दिए गए हिंदी शब्द: ${word} को वाक्य "${sentence}" के संदर्भ में लेते हुए, उस शब्द का **ध्वन्यात्मक उच्चारण (IPA)** लौटाएँ।

            **आवश्यकताएँ:**
            1. आउटपुट एक **JSON ऑब्जेक्ट** होना चाहिए, संरचना इस प्रकार:
            {
                "phonetic_IPA": "<IPA_pronunciation>"
            }
            2. "phonetic_ipa" फ़ील्ड में केवल **ध्वन्यात्मक लिप्यंतरण** शामिल करें — कोई व्याख्या, टिप्पणी या अतिरिक्त पाठ नहीं।
            3. दिए गए अर्थ के लिए IPA लिप्यंतरण **सटीक** होना चाहिए।
            4. लिप्यंतरण या अनुमानित वर्तनी का उपयोग न करें — IPA प्रतीकों का सख्ती से पालन करें।`
    };


    return prompts[langCode];
}


// const wordsArray = getWordsArrayFromCSV("./assets/english-frequency-list.csv");

// let count = 0

// const addEnglishWords = async () => {
//     try {
        
//         await pool.query('BEGIN');
//         for (const word of wordsArray) {
//             const id = word.id;
//             const wordResult = await pool.query(
//                 `SELECT id FROM words WHERE id = $1`,
//                 [id]
//             );
//             if (wordResult.rows.length > 0) {
//                 console.log(`Word with id ${id} already exists, skipping.`);
//                 count++
//                 continue;
//             }

//             const translationsResult = await pool.query(
//                 `SELECT * FROM translations WHERE word_id = $1 AND lang_code = $2`,
//                 [id, "en"]
//             );
            
//             if (translationsResult.rows.length > 0) {
//                 console.log(`Translation for word id ${id} in English already exists, skipping.`);
//                 count++
//                 continue;
//             }
//            const prompt = `
//                 Provide JSON describing the English word "${word.word}".
//                 Return strictly this JSON. Ensure that the "category" field is always one of the following options. Do NOT invent any other categories:

//                 ${categories}

//                 {
//                     "definition": "<short definition>",
//                     "part_of_speech": "<noun|verb|adjective|adverb|pronoun|preposition|conjunction|interjection>",
//                     "difficulty": <CEFR-style levels: a1, a2, b1, b2, c1, c2>,
//                     "example_sentence": "<short sentence using the word>",
//                     "phonetic_IPA": "<IPA or phonetic spelling>",
//                     "category": "<one of the allowed categories above>"
//                 }

//                 IMPORTANT: The "category" field must match exactly one of the listed categories. No other values are allowed.`;

            
//             const response = await openai.chat.completions.create({
//                 model: "gpt-4o-mini",
//                 messages: [{ role: "user", content: prompt }],
//                 response_format: { type: "json_object" },
//             });

//             let data;
//             try {
//                 data = JSON.parse(response.choices[0].message.content);
//             } catch (jsonErr) {
//                 throw new Error("Invalid JSON returned by OpenAI");
//             }
//             const validated = wordSchema.parse(data);
//             const { rows } = await pool.query(
//                 `
//                 INSERT INTO words (id, category)
//                 VALUES ($1, $2)
//                 ON CONFLICT (id) DO NOTHING
//                 RETURNING id
//                 `,
//                 [id, validated.category]
//             );
//             if (rows.length === 0) {
//                 console.log(`Word with id ${id} already exists, skipping.`);
//                 continue;
//             }
//             const wordId = rows[0].id;
//             await pool.query(
//                 `INSERT INTO translations 
//                 (word_id, lang_code, word, part_of_speech, pronunciation, definition, sentence, difficulty) 
//                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
//                 [
//                     wordId,
//                     "en",
//                     word.word,
//                     validated.part_of_speech,
//                     validated.phonetic_IPA,
//                     validated.definition,
//                     validated.example_sentence,
//                     validated.difficulty,
//                 ]
//             );
            
//             await pool.query('COMMIT');
//             console.log(`✅ Added word: ${word.word}`);
//             count++
//             console.log(count)
//         }  
//     } catch (error) {
//         player.play('./assets/errorsound.mp3', function(err){
//             if (err) console.error("Could not play sound:", err);
//         });
//         await pool.query('ROLLBACK');
//         console.error("Error adding words:", error);   
//     }
// }

const redoPronunciations = async (lang) => {
    let count = 0
    try {
        const { rows } = await pool.query(`
            SELECT 
                w.id,
                t.word AS word,
                t.definition AS definition
            FROM words w
            LEFT JOIN translations t
                ON w.id = t.word_id
                AND t.lang_code = $1
                order by id`,
            [lang]);
        
        for (const row of rows) {
            const wordId = row.id;
            const word = row.word;
            const definition = row.definition;

            if (!word || !definition) {
                console.log(`Skipping word ID ${wordId} due to missing word or definition.`);
                continue;
            }

            const prompt = prompts(word, definition, lang);

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

            await pool.query(
                `
                UPDATE translations
                    SET pronunciation = $1
                WHERE word_id = $2 AND lang_code = $3
                `,
                [validated.phonetic_IPA, wordId, lang]
            );
            count ++
            console.log(`✅ Updated pronunciation for word ID ${wordId}: ${word} -> ${validated.phonetic_IPA}`);
            console.log(count)
        }

            
    }
    catch (e) { 
        console.error("Error redoing pronunciations:", e);
    }
}

redoPronunciations("en");