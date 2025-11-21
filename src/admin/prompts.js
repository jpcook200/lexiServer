const { categories } = require('../../commonLanguages');

function getPromptByLanguage(langCode, wordText, languageName) {
    const promptTemplates = {
        "en": `
        Provide JSON describing the English word "${wordText}".
        Return strictly this JSON. Ensure that the "category" field is always one of the following options. Do NOT invent any other categories:
        ${categories}
    {
        "definition": "<definition of the word in ${languageName}>",
        "part_of_speech": "<part of speech - STRICTLY in English either noun, verb, adjective, adverb, pronoun, preposition, conjunction, or interjection, determiner, exclamation, particle, expression>",
        "gender": "<gender of the word STRICTLY male, female or neutral>",
        "difficulty": "< STRICTLY EFR difficulty level in lowercase: a1, a2, b1, b2, c1, or c2>",
        "example_sentence": "<an example sentence in ${languageName} strictly including the ${languageName} word ${wordText}>"
        "phonetic_IPA": "<Phonetic pronunciation of the word in STRICTLY IPA format>"
        "category": "<one of the allowed categories above>"
    }
        IMPORTANT: The "category" field must match exactly one of the listed categories. No other values are allowed.`,
        
        "fr": `
    Fournissez un objet JSON avec les champs suivants pour le mot "${wordText}" en ${languageName} :

    {
        "definition": "<définition du mot en ${languageName}>",
        "part_of_speech": "<partie du discours - STRICTEMENT en anglais : noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<genre du mot, DOIT être strictement male, female ou neutral>",
        "difficulty: "<niveau de difficulté du mot : A1, A2, B1, B2, C1, C2>",
        "example_sentence": "<une phrase d'exemple en ${languageName} incluant strictement le mot ${wordText} en ${languageName}>",
        "phonetic_IPA": "<Prononciation phonétique du mot en FORMAT IPA STRICTEMENT>"
    }
    Assurez-vous que les informations soient exactes et pertinentes pour la langue ${languageName}, sauf pour phonetic_IPA qui doit être en format IPA STRICT et part_of_speech qui doit être en anglais.
`,
        "de": `
    Geben Sie ein JSON-Objekt mit den folgenden Feldern für das Wort "${wordText}" in ${languageName} an:

    {
        "definition": "<Definition des Wortes in ${languageName}>",
        "part_of_speech": "<Wortart - AUSSCHLIESSLICH auf Englisch: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<Genus des Wortes, MUSS strikt male, female oder neutral sein>",
        "difficulty": "<AUSSCHLIESSLICH CEFR-Schwierigkeitsgrad in Kleinbuchstaben: a1, a2, b1, b2, c1 oder c2>",
        "example_sentence": "<ein Beispielsatz in ${languageName}, der das ${languageName}-Wort ${wordText} AUSSCHLIESSLICH enthält>",
        "phonetic_IPA": "<Phonetische Aussprache des Wortes im AUSSCHLIESSLICHEN IPA-FORMAT>"
    }
    Stellen Sie sicher, dass die Informationen genau und relevant für die Sprache ${languageName} sind, mit Ausnahme von phonetic_IPA, das im AUSSCHLIESSLICHEN IPA-Format vorliegen muss, und part_of_speech, das auf Englisch sein muss.
`,
        "es": `
    Proporcione un objeto JSON con los siguientes campos para la palabra "${wordText}" en ${languageName}: 
    { 
        "definition": "<definición de la palabra en ${languageName}>",
        "part_of_speech": "<parte del discurso - ESTRICTAMENTE en inglés: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<género de la palabra, DEBE ser estrictamente male, female o neutral>",
        "difficulty": "<nivel de dificultad ESTRICTAMENTE CEFR en minúsculas: a1, a2, b1, b2, c1 o c2>",
        "example_sentence": "<una oración de ejemplo en ${languageName} que incluya ESTRICTAMENTE la palabra ${wordText} en ${languageName}>",
        "phonetic_IPA": "<pronunciación fonética de la palabra en FORMATO IPA ESTRICTAMENTE>"
    }
    Asegúrese de que la información sea precisa y relevante para el idioma ${languageName}, excepto phonetic_IPA que debe estar en formato IPA ESTRICTO y part_of_speech que debe estar en inglés.
`,
        "it": `
    Fornisci un oggetto JSON con i seguenti campi per la parola "${wordText}" in ${languageName}:   
    {   
        "definition": "<definizione della parola in ${languageName}>",  
        "part_of_speech": "<parte del discorso - STRETTAMENTE in inglese: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<genere della parola, DEVE essere rigorosamente male, female o neutral>",
        "difficulty": "<livello di difficoltà STRETTAMENTE CEFR in minuscolo: a1, a2, b1, b2, c1 o c2>",    
        "example_sentence": "<una frase di esempio in ${languageName} che includa STRETTAMENTE la parola ${wordText} in ${languageName}>",
        "phonetic_IPA": "<pronuncia fonetica della parola in FORMATO IPA STRETTAMENTE>"
    }   
    Assicurati che le informazioni siano accurate e pertinenti per la lingua ${languageName}, ad eccezione di phonetic_IPA che deve essere in formato IPA STRETTO e part_of_speech che deve essere in inglese.
`,
        "pt": `
    Forneça um objeto JSON com os seguintes campos para a palavra "${wordText}" em ${languageName}:   
    {
        "definition": "<definição da palavra em ${languageName}>",
        "part_of_speech": "<parte do discurso - ESTRITAMENTE em inglês: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<gênero da palavra, DEVE ser estritamente male, female ou neutral>",
        "difficulty": "<nível de dificuldade ESTRITAMENTE CEFR em minúsculas: a1, a2, b1, b2, c1 ou c2>",
        "example_sentence": "<uma frase de exemplo em ${languageName} que inclua ESTRITAMENTE a palavra ${wordText} em ${languageName}>",
        "phonetic_IPA": "<pronúncia fonética da palavra em FORMATO IPA ESTRITAMENTE>"
    }
    Certifique-se de que as informações sejam precisas e relevantes para o idioma ${languageName}, exceto phonetic_IPA que deve estar em formato IPA ESTRITO e part_of_speech que deve estar em inglês.
`,
        "ru": `
    Предоставьте JSON-объект со следующими полями для слова "${wordText}" на ${languageName}:   
    {
        "definition": "<определение слова на ${languageName}>",
        "part_of_speech": "<часть речи - СТРОГО на английском: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<род слова, ДОЛЖЕН быть строго male, female или neutral>",
        "difficulty": "<уровень сложности СТРОГО CEFR в нижнем регистре: a1, a2, b1, b2, c1 или c2>",
        "example_sentence": "<пример предложения на ${languageName}, строго включающий слово ${wordText} на ${languageName}>",
        "phonetic_IPA": "<фонетическое произношение слова в СТРОГОМ IPA-ФОРМАТЕ>"
    }
    Убедитесь, что информация точна и актуальна для языка ${languageName}, за исключением phonetic_IPA, который должен быть в СТРОГОМ IPA-формате, и part_of_speech, который должен быть на английском языке.
`,
        "ja": `
    "${wordText}"という単語について、${languageName}で以下のフィールドを含むJSONオブジェクトを提供してください:   
    {   
        "definition": "<${languageName}での単語の定義>",
        "part_of_speech": "<品詞 - 英語でSTRICTLY: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<単語の性別は、厳密に male、"female、または neutral でなければなりません>",
        "difficulty": "<CEFRスタイルの難易度レベルを小文字でSTRICTLY: a1, a2, b1, b2, c1, または c2>",
        "example_sentence": "<${languageName}での例文で、${languageName}の単語${wordText}をSTRICTLYに含む>",
        "phonetic_IPA": "<単語の発音をSTRICTLYなIPA形式で>"
    }   
    ${languageName}に関する情報が正確で関連性があることを確認してください。ただし、phonetic_IPAはSTRICTLYなIPA形式で、part_of_speechは英語である必要があります。
`,
        "zh": `
    为"${wordText}"一词提供一个包含以下字段的JSON对象，语言为${languageName}：   
    {   
        "definition": "<${languageName}中该词的定义>",
        "part_of_speech": "<词性 - 严格使用英语：noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": "<词的性别必须严格为 male、female 或 neutral>",
        "difficulty": "<CEFR风格的难度等级，严格使用小写字母：a1, a2, b1, b2, c1或c2>",
        "example_sentence": "<${languageName}中的例句，严格包含${languageName}单词${wordText}>",
        "phonetic_IPA": "<该词的发音，严格使用IPA格式>"
    }   
    确保信息准确且与${languageName}语言相关，但phonetic_IPA必须为严格的IPA格式，part_of_speech必须为英语。
`,
        "hi": `
    "${wordText}" शब्द के लिए ${languageName} में निम्नलिखित फ़ील्ड वाले JSON ऑब्जेक्ट प्रदान करें:   
    {
        "definition": "<${languageName} में शब्द की परिभाषा>",
        "part_of_speech": "<भाग - STRICTLY अंग्रेजी में: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
        "gender": <शब्द का लिंग, सख्ती से male, female या neutral ही होना चाहिए>,
        "difficulty": "<CEFR-शैली के स्तर को छोटे अक्षरों में STRICTLY: a1, a2, b1, b2, c1 या c2>",
        "example_sentence": "<${languageName} में एक उदाहरण वाक्य जो STRICTLY ${languageName} शब्द ${wordText} शामिल करता है>",
        "phonetic_IPA": "<शब्द का उच्चारण STRICTLY IPA प्रारूप में>"
    }   
    सुनिश्चित करें कि जानकारी ${languageName} भाषा के लिए सटीक और प्रासंगिक हो, सिवाय phonetic_IPA के जो STRICTLY IPA प्रारूप में होना चाहिए और part_of_speech जो अंग्रेजी में होना चाहिए।
`
    };

    return promptTemplates[langCode] || promptTemplates["en"];
}

module.exports = { getPromptByLanguage };