const express = require('express');
const controller = require('./wordsController');
const router = express.Router();
const crypto = require("crypto")

function verifyAppKey(req) {
    const clientKey = req.headers["api-key"]; // custom header
    const serverKey = process.env.SECURITY_KEY;
    console.log(clientKey)
    if (!clientKey || !serverKey) return false;

    try {
        // Timing-safe compare to avoid leak attacks
        const clientBuffer = Buffer.from(clientKey);
        const serverBuffer = Buffer.from(serverKey);

        return (
        clientBuffer.length === serverBuffer.length &&
        crypto.timingSafeEqual(clientBuffer, serverBuffer)
        );
    } catch (err) {
        return false;
    }
}

function appAuth(req, res, next) {
    if (!verifyAppKey(req)) {
        return res.status(401).json({ error: "Unauthorized app client" });
    }
  next();
}

router.post('/get-daily', appAuth, controller.getDailyWords);
router.post('/text-to-speech', appAuth , controller.textToSpeech);

module.exports = router