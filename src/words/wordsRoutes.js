const express = require('express');
const controller = require('./wordsController');
const router = express.Router();

router.post('/get-daily', controller.getDailyWords);
router.post('/text-to-speech', controller.textToSpeech);

module.exports = router