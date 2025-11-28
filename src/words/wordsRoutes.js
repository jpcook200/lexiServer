const express = require('express');
const controller = require('./wordsController');
const router = express.Router();
const crypto = require("crypto")
const { generateAppleJWT } = require('./appleVerify')

const appStoreSharedSecret = process.env.APP_STORE_SHARED_SECRET;

function verifyAppKey(req) {
    const clientKey = req.headers["api-key"]; // custom header
    const serverKey = process.env.SECURITY_KEY;
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

const validateSubscription = async (req, res, next) => { 
    const appleURL = process.env.NODE_ENV === 'production'
        ? 'https://api.storekit.itunes.apple.com/inApps/v1/subscriptions/'
        : 'https://api.storekit-sandbox.itunes.apple.com/inApps/v1/subscriptions/';
    const transactionId = req.headers["transaction-id"];
    console.log('Transaction ID:', transactionId);
    if (!transactionId) {
      req.userAccessLevel = 'free';
      return next();
    
    }
    const jwtToken = generateAppleJWT();
    console.log('Generated JWT Token:', jwtToken);
    const response = await fetch(`${appleURL}${transactionId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json'
        }
    })
    console.log(response)
    const data = await response.json();
    console.log('Apple subscription data:', data);
    if (data.data) { 
        req.userAccessLevel = 'pro';
    } else {
        req.userAccessLevel = 'free';
    }
    next()
}

router.post('/get-daily', appAuth, validateSubscription, controller.getDailyWords);
router.post('/text-to-speech', appAuth, controller.textToSpeech);
router.get('/get-count', appAuth, controller.getWordsCount);
router.post('/get-new-translations', appAuth, controller.getNewTranslations);

module.exports = router