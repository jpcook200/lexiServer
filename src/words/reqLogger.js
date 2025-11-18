const pool = require('../../db'); // Adjust path as needed

const requestLogger = (req, res, next) => { 
    const start = Date.now();

    // Capture request data now
    const logEntry = {
        method: req.method,
        path: req.originalUrl,
        timestamp: new Date().toISOString(),
        status: null,
        success: null,
        response_time_ms: null,
        error_message: null,  // new field
    };

    // Wrap res.json to intercept what is sent
    const originalJson = res.json;
    res.json = function (body) {
        // Capture error message if it exists
        if (body && body.error) {
            logEntry.error_message = body.error;
        }
        return originalJson.call(this, body);
    };

    res.on("finish", async () => {
        logEntry.status = res.statusCode;
        logEntry.success = res.statusCode >= 200 && res.statusCode < 300;
        logEntry.response_time_ms = Date.now() - start;

        // Save to DB
        try {
            await pool.query(
                `INSERT INTO api_logs 
                    (installation_id, method, path, timestamp, status, success, response_time_ms, error_message)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [
                    req.headers["installation-id"], // or however you get installationId
                    logEntry.method,
                    logEntry.path,
                    logEntry.timestamp,
                    logEntry.status,
                    logEntry.success,
                    logEntry.response_time_ms,
                    logEntry.error_message
                ]
            );
        } catch (e) {
            console.error("Failed to log API call:", e);
        }
    });

    next();
};

module.exports = requestLogger;
