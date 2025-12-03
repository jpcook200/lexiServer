const getWords = `
SELECT
    w.id,
    n.word AS native_word,
    l.word AS learning_word,
    l.pronunciation AS learning_pronunciation,
    n.pronunciation AS native_pronunciation,
    n.part_of_speech,
    n.definition AS native_definition,
    l.definition AS learning_definition,
    l.difficulty AS learning_difficulty,
    l.sentence AS learning_sentence,
    n.sentence AS native_sentence,
    l.gender AS learning_gender,
    l.lang_code AS learn_lang,
    n.lang_code AS native_lang
FROM words w
JOIN translations n ON n.word_id = w.id AND n.lang_code = $1
JOIN translations l ON l.word_id = w.id AND l.lang_code = $2
WHERE l.difficulty = $3
    AND w.private = false
    AND w.id NOT IN (SELECT UNNEST($5::int[])) 
ORDER BY RANDOM()
LIMIT $4;
`;

const getFreeWords = `
SELECT
    w.id,
    n.word AS native_word,
    l.word AS learning_word,
    l.pronunciation AS learning_pronunciation,
    n.pronunciation AS native_pronunciation,
    n.part_of_speech,
    n.definition AS native_definition,
    l.definition AS learning_definition,
    l.difficulty AS learning_difficulty,
    l.sentence AS learning_sentence,
    n.sentence AS native_sentence,
    l.gender AS learning_gender,
    l.lang_code AS learn_lang,
    n.lang_code AS native_lang
FROM words w
JOIN translations n ON n.word_id = w.id AND n.lang_code = $1
JOIN translations l ON l.word_id = w.id AND l.lang_code = $2
WHERE l.difficulty = $3
    AND w.id NOT IN (SELECT UNNEST($5::int[]))
    AND w.premium = false
    AND w.private = false
ORDER BY RANDOM()
LIMIT $4;
`;

const getFreeDemoWords = `
SELECT
    w.id,
    n.word AS native_word,
    l.word AS learning_word,
    l.pronunciation AS learning_pronunciation,
    n.pronunciation AS native_pronunciation,
    n.part_of_speech,
    n.definition AS native_definition,
    l.definition AS learning_definition,
    l.difficulty AS learning_difficulty,
    l.sentence AS learning_sentence,
    n.sentence AS native_sentence,
    l.gender AS learning_gender,
    l.lang_code AS learn_lang,
    n.lang_code AS native_lang
FROM words w
JOIN translations n ON n.word_id = w.id AND n.lang_code = $1
JOIN translations l ON l.word_id = w.id AND l.lang_code = $2
WHERE l.difficulty = $3
    AND w.id NOT IN (SELECT UNNEST($5::int[]))
    AND w.premium = false
    AND w.private = false
    AND w.demo = true
ORDER BY RANDOM()
LIMIT $4;
`;


const getDemoWords = `
SELECT
    w.id,
    n.word AS native_word,
    l.word AS learning_word,
    l.pronunciation AS learning_pronunciation,
    n.pronunciation AS native_pronunciation,
    n.part_of_speech,
    n.definition AS native_definition,
    l.definition AS learning_definition,
    l.difficulty AS learning_difficulty,
    l.sentence AS learning_sentence,
    n.sentence AS native_sentence,
    l.gender AS learning_gender,
    l.lang_code AS learn_lang,
    n.lang_code AS native_lang
FROM words w
JOIN translations n ON n.word_id = w.id AND n.lang_code = $1
JOIN translations l ON l.word_id = w.id AND l.lang_code = $2
WHERE l.difficulty = $3
    AND w.demo = true
    AND w.private = false
    AND w.id NOT IN (SELECT UNNEST($5::int[]))
ORDER BY RANDOM()
LIMIT $4;
`;




module.exports = {
    getWords,
    getFreeWords,
    getFreeDemoWords,
    getDemoWords
}

