const { categories } = require('../../commonLanguages');

function getPromptByLanguage(langCode, wordText, languageName, englishDefinition, englishSentence) {
    const promptTemplates = {
        en: `Provide JSON describing the English word "${wordText}".
            Return strictly this JSON. Ensure that the "category" field is always one of the following options. Do NOT invent any other categories: ${categories}
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
        
        fr: `Fournissez un objet JSON avec les champs suivants pour le mot « ${wordText} » en français. 
            Le mot provient d’une entrée anglaise avec la définition suivante : « ${englishDefinition} ».  
            La définition en français doit transmettre exactement le même sens que cette définition anglaise.  
            La phrase d'exemple doit également refléter fidèlement ce sens.
            {
                "definition": "<définition du mot en français, en utilisant la définition anglaise seulement comme contexte pour le sens, et non pour une traduction mot à mot : ${englishDefinition}>",
                "part_of_speech": "<partie du discours — STRICTEMENT en anglais : noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<genre du mot — DOIT être strictement male, female ou neutral>",
                "difficulty": "<niveau de difficulté du mot : A1, A2, B1, B2, C1, C2>",
                "example_sentence": <"Veuillez fournir la traduction directe de la phrase anglaise suivante : « ${englishSentence} ». La traduction doit être entièrement en français, inclure naturellement le mot « ${wordText} » et refléter fidèlement le sens donné par la définition anglaise : ${englishDefinition}.">
                "phonetic_IPA": "<prononciation phonétique du mot en FORMAT IPA STRICT>"
            }
            Assurez-vous que :
            - toutes les informations sont exactes et pertinentes pour la langue française,
            - la définition et la phrase d’exemple correspondent fidèlement à la définition anglaise,
            - phonetic_IPA est au format IPA STRICT,
            - part_of_speech est STRICTEMENT en anglais.`,
        
        de: `Geben Sie ein JSON-Objekt mit den folgenden Feldern für das Wort „${wordText}“ auf Deutsch aus. 
            Das Wort stammt aus einem englischen Eintrag mit der folgenden Definition: „${englishDefinition}“.  
            Die Definition auf Deutsch muss genau die gleiche Bedeutung wie die englische Definition wiedergeben.  
            Der Beispielsatz soll ebenfalls diese Bedeutung genau widerspiegeln.

            {
                "definition": "<Definition des Wortes auf Deutsch, wobei die englische Definition nur als Kontext für die Bedeutung dient und nicht als wortwörtliche Übersetzung: ${englishDefinition}>",
                "part_of_speech": "<Wortart — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<Genus des Wortes — MUSS strikt male, female oder neutral sein>",
                "difficulty": "<Schwierigkeitsgrad des Wortes: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<Bitte geben Sie die direkte Übersetzung des folgenden englischen Satzes: «${englishSentence}». Die Übersetzung muss vollständig auf Deutsch sein, das Wort «${wordText}» natürlich enthalten und die Bedeutung der englischen Definition exakt widerspiegeln: ${englishDefinition}>",
                "phonetic_IPA": "<Phonetische Aussprache des Wortes im STRICT IPA-FORMAT>"
            }

            Stellen Sie sicher, dass:
            - alle Informationen korrekt und für die deutsche Sprache relevant sind,
            - die Definition und der Beispielsatz exakt der englischen Definition entsprechen,
            - phonetic_IPA im strikten IPA-Format ist,
            - part_of_speech STRICTLY auf Englisch angegeben ist.`,
        
        it: `Fornisci un oggetto JSON con i seguenti campi per la parola «${wordText}» in italiano.  
            La parola proviene da una voce inglese con la seguente definizione: «${englishDefinition}».  
            La definizione in italiano deve trasmettere esattamente lo stesso significato della definizione inglese.  
            La frase di esempio deve riflettere fedelmente questo significato.

            {
                "definition": "<Definizione della parola in italiano, usando la definizione inglese solo come contesto per il significato e non come traduzione letterale: ${englishDefinition}>",
                "part_of_speech": "<Parte del discorso — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<Genere della parola — DEVE essere strettamente male, female o neutral>",
                "difficulty": "<Livello di difficoltà della parola: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<Fornisci la traduzione diretta della seguente frase inglese: «${englishSentence}». La traduzione deve essere completamente in italiano, includere naturalmente la parola «${wordText}» e riflettere fedelmente il significato della definizione inglese: ${englishDefinition}>",
                "phonetic_IPA": "<Pronuncia fonetica della parola in STRICT IPA FORMAT>"
            }

            Assicurati che:
            - tutte le informazioni siano corrette e rilevanti per la lingua italiana,
            - la definizione e la frase di esempio corrispondano fedelmente alla definizione inglese,
            - phonetic_IPA sia nel formato IPA STRICT,
            - part_of_speech sia STRICTLY in English.`,
        
        pt: `Forneça um objeto JSON com os seguintes campos para a palavra «${wordText}» em português.  
            A palavra vem de uma entrada em inglês com a seguinte definição: «${englishDefinition}».  
            A definição em português deve transmitir exatamente o mesmo sentido da definição em inglês.  
            A frase de exemplo também deve refletir fielmente esse sentido.

            {
                "definition": "<Definição da palavra em português, usando a definição em inglês apenas como contexto para o significado e não como tradução literal: ${englishDefinition}>",
                "part_of_speech": "<Parte do discurso — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<Gênero da palavra — DEVE ser estritamente male, female ou neutral>",
                "difficulty": "<Nível de dificuldade da palavra: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<Forneça a tradução direta da seguinte frase em inglês: «${englishSentence}». A tradução deve ser totalmente em português, incluir naturalmente a palavra «${wordText}» e refletir fielmente o sentido dado pela definição em inglês: ${englishDefinition}>",
                "phonetic_IPA": "<Pronúncia fonética da palavra em STRICT IPA FORMAT>"
            }

            Certifique-se de que:
            - todas as informações sejam corretas e relevantes para o idioma português,
            - a definição e a frase de exemplo correspondam fielmente à definição em inglês,
            - phonetic_IPA esteja no formato IPA STRICT,
            - part_of_speech seja STRICTLY in English.`,
        
        ru: `Предоставьте JSON-объект со следующими полями для слова «${wordText}» на русском языке.  
            Слово происходит из английского слова с определением: «${englishDefinition}».  
            Определение на русском должно точно передавать смысл этого английского определения.  
            Пример предложения также должен точно отражать этот смысл.

            {
                "definition": "<Определение слова на русском языке, используя английское определение только как контекст для смысла, а не как дословный перевод: ${englishDefinition}>",
                "part_of_speech": "<Часть речи — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<Род слова — ДОЛЖЕН быть строго male, female или neutral>",
                "difficulty": "<Уровень сложности слова: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<Предоставьте прямой перевод следующего английского предложения: «${englishSentence}». Перевод должен быть полностью на русском, естественно включать слово «${wordText}» и точно отражать смысл, указанный в английском определении: ${englishDefinition}>",
                "phonetic_IPA": "<Фонетическое произношение слова в STRICT IPA FORMAT>"
            }

            Убедитесь, что:
            - вся информация точная и релевантная для русского языка,
            - определение и пример предложения точно соответствуют английскому определению,
            - phonetic_IPA в формате STRICT IPA,
            - part_of_speech строго на английском.`,
        
        ja: `以下のJSONオブジェクトを「${wordText}」という単語のために作成してください。  
            この単語は、次の英語の定義に由来します：「${englishDefinition}」。  
            日本語の定義は、この英語の定義の意味を正確に伝える必要があります。  
            例文も、この意味を正確に反映する必要があります。

            {
                "definition": "<単語の日本語での定義。英語の定義は意味の文脈としてのみ使用し、直訳は行わない: ${englishDefinition}>",
                "part_of_speech": "<品詞 — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<単語の性別 — MUST be strictly male, female, or neutral>",
                "difficulty": "<単語の難易度: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<次の英語の文を直接翻訳してください: «${englishSentence}». 翻訳は完全に日本語で行い、自然に「${wordText}」を含め、英語の定義で示された意味を正確に反映すること: ${englishDefinition}>",
                "phonetic_IPA": "<単語の発音をSTRICT IPA FORMATで記述>"
            }

            以下を確認してください：
            - すべての情報は正確で日本語として妥当であること、
            - 定義と例文は英語の定義と正確に一致すること、
            - phonetic_IPAはSTRICT IPA形式であること、
            - part_of_speechは必ず英語であること。`,
        
        zh: `请为单词「${wordText}」提供一个JSON对象。  
            该单词来自以下英文定义：「${englishDefinition}」。  
            中文定义必须准确传达该英文定义的意义。  
            例句也必须忠实反映该意义。

            {
                "definition": "<单词的中文定义，仅以英文定义作为意义参考，不做逐字翻译: ${englishDefinition}>",
                "part_of_speech": "<词性 — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<单词的性别 — MUST be strictly male, female, or neutral>",
                "difficulty": "<单词难度等级: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<请直接翻译以下英文句子: «${englishSentence}». 翻译必须完全为中文，自然包含「${wordText}」，并忠实反映英文定义的意义: ${englishDefinition}>",
                "phonetic_IPA": "<单词的发音，STRICT IPA FORMAT>"
            }

            请确保：
            - 所有信息都是准确且符合中文语言习惯的，
            - 定义和例句忠实于英文定义，
            - phonetic_IPA严格使用IPA格式，
            -part_of_speech必须为英文。`,
        
        hi: `कृपया शब्द "${wordText}" के लिए एक JSON ऑब्जेक्ट प्रदान करें।  
            यह शब्द निम्नलिखित अंग्रेज़ी परिभाषा से लिया गया है: "${englishDefinition}"।  
            हिंदी में परिभाषा को इस अंग्रेज़ी परिभाषा का सही अर्थ स्पष्ट रूप से व्यक्त करना चाहिए।  
            उदाहरण वाक्य भी इस अर्थ को सटीक रूप से प्रतिबिंबित करना चाहिए।

            {
                "definition": "<शब्द की हिंदी परिभाषा, केवल अंग्रेज़ी परिभाषा को संदर्भ के रूप में इस्तेमाल करें, शब्दशः अनुवाद न करें: ${englishDefinition}>",
                "part_of_speech": "<शब्द का भाग — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<शब्द का लिंग — MUST be strictly male, female, or neutral>",
                "difficulty": "<शब्द की कठिनाई स्तर: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<कृपया निम्नलिखित अंग्रेज़ी वाक्य का सीधे हिंदी में अनुवाद करें: «${englishSentence}». अनुवाद पूरी तरह से हिंदी में होना चाहिए, स्वाभाविक रूप से '${wordText}' शब्द शामिल होना चाहिए, और अंग्रेज़ी परिभाषा के अर्थ को सटीक रूप से प्रतिबिंबित करना चाहिए: ${englishDefinition}>",
                "phonetic_IPA": "<शब्द का उच्चारण, STRICT IPA FORMAT>"
            }

            कृपया सुनिश्चित करें कि:
            - सभी जानकारी हिंदी भाषा के अनुरूप और सटीक हो,
            - परिभाषा और उदाहरण वाक्य अंग्रेज़ी परिभाषा के अनुसार सटीक हों,
            - phonetic_IPA STRICT IPA फ़ॉर्मेट में हो,
            - part_of_speech अंग्रेज़ी में ही हो।`,
        
        es: `Por favor, proporcione un objeto JSON para la palabra "${wordText}" en español.  
            La palabra proviene de la siguiente definición en inglés: "${englishDefinition}".  
            La definición en español debe transmitir exactamente el mismo significado que esta definición en inglés.  
            La oración de ejemplo también debe reflejar fielmente este significado.

            {
                "definition": "<definición de la palabra en español, usando solo la definición en inglés como contexto para el significado, no como traducción literal: ${englishDefinition}>",
                "part_of_speech": "<parte del discurso — STRICTLY in English: noun, verb, adjective, adverb, pronoun, preposition, conjunction, interjection, determiner, exclamation, particle, expression>",
                "gender": "<género de la palabra — DEBE ser estrictamente male, female o neutral>",
                "difficulty": "<nivel de dificultad de la palabra: A1, A2, B1, B2, C1, C2>",
                "example_sentence": "<Por favor, proporcione la traducción directa de la siguiente frase en inglés: «${englishSentence}». La traducción debe estar completamente en español, incluir naturalmente la palabra '${wordText}' y reflejar fielmente el significado dado por la definición en inglés: ${englishDefinition}>",
                "phonetic_IPA": "<pronunciación de la palabra en FORMATO IPA STRICTO>"
            }

            Asegúrese de que:
            - toda la información sea precisa y relevante para el español,
            - la definición y la frase de ejemplo correspondan fielmente a la definición en inglés,
            - phonetic_IPA esté en FORMATO IPA STRICTO,
            - part_of_speech esté estrictamente en inglés.`
    };

    return promptTemplates[langCode] || promptTemplates["en"];
}

module.exports = { getPromptByLanguage };