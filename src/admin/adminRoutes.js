const express = require('express');
const controller = require('./adminController');

const router = express.Router();

router.post('/get-filtered-words', controller.getFilteredWords);
router.post('/add-translations', controller.translateWordsToLanguage);
router.post('/add-translations-metadata', controller.addWordsMetaData);
router.post('/delete-language-translations', controller.deleteTranslationsForLanguage);
router.get('/get-word/:id/:langCode', controller.getWordById);
router.put('/update-translation/:id/:langCode', controller.editTranslation);
router.put('/toggle-private', controller.togglePrivate);
router.put('/toggle-premium', controller.togglePremium);
router.post('/add-english-words', controller.addEnglishWords);
router.put('/edit-pronunciations', controller.editPronunciations);


module.exports = router;