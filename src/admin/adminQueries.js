const getFilteredWords = `
    SELECT
        t.id, 
        t.word,
        t.word_id,
        t.definition,
        t.lang_code,
        t.part_of_speech,
        t.difficulty,
        t.sentence,
        t.pronunciation,
        w.category,
        w.premium,
        w.private,
        en_t.word AS english_word,
        en_t.definition AS english_definition,
        COUNT(*) OVER() AS total_count
    FROM translations t
    JOIN words w ON t.word_id = w.id
    LEFT JOIN translations en_t 
        ON en_t.word_id = t.word_id 
       AND en_t.lang_code = 'en'
    WHERE ($1::text IS NULL OR LOWER(t.word) LIKE LOWER(CONCAT('%', $1::text, '%')))
      AND ($2::text IS NULL OR t.lang_code = $2::text)
      AND ($3::text IS NULL OR t.difficulty = $3::text)
      AND ($4::text IS NULL OR t.part_of_speech = $4::text)
      AND (
          $8::text IS NULL 
          OR ($8 = 'premium' AND w.premium = TRUE)
          OR ($8 = 'free' AND w.premium = FALSE)
      )
      AND (
          $9::text IS NULL
          OR ($9 = 'private' AND w.private = TRUE)
          OR ($9 = 'public' AND w.private = FALSE)
      )
      AND ($10::text IS NULL OR w.category = $10::text)
    ORDER BY
        CASE WHEN $7 = 'difficulty' THEN t.difficulty END ASC,
        CASE WHEN $7 = 'word' THEN t.word END ASC,
        CASE WHEN $7 = 'lang' THEN t.lang_code END ASC,
        CASE WHEN $7 = 'word_id' THEN t.word_id END ASC,
        CASE WHEN $7 = 'length' THEN LENGTH(t.word) END ASC,
        t.word ASC -- fallback
    LIMIT $5
    OFFSET $6;
`;


const getWordById = `
    SELECT 
        w.id AS word_id,
        w.category,
        t.word,
        t.lang_code,
        t.definition,
        t.part_of_speech,
        t.pronunciation,
        t.sentence,
        t.difficulty
    FROM words w
    JOIN translations t
        ON w.id = t.word_id
    WHERE t.lang_code = $1 AND w.id = $2;
    `

const editTranslation = `
    UPDATE translations
    SET word = $1,
        definition = $2,
        part_of_speech = $3,
        pronunciation = $4,
        sentence = $5,
        difficulty = $6
    WHERE word_id = $7 AND lang_code = $8
    RETURNING *;    
`

const editCategory = `
    UPDATE words
    SET category = $1
    WHERE id = $2
    RETURNING *;
`

module.exports = {
    getFilteredWords,
    getWordById,
    editTranslation,
    editCategory
};