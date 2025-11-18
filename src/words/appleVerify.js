const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

const privateKeyPath = path.join(__dirname, '../../SubscriptionKey_9JMNVZ2L2A.p8');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

const keyId = process.env.IAP_KEY_ID;
const issuerId = process.env.ISSUER_ID;
const bundleId = process.env.APP_BUNDLE_ID;

function generateAppleJWT() {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: issuerId,
        iat: now,
        exp: now + 20 * 60,
        aud: "appstoreconnect-v1",
        bid: bundleId
    };

    const token = jwt.sign(payload, privateKey, {
        algorithm: 'ES256',
        keyid: keyId,
    });

    return token;
}

module.exports = {
  generateAppleJWT,
};
