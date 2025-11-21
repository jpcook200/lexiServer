const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const app = express();
const PORT = process.env.PORT || 3000;
const requestLogger = require('./src/words/reqLogger');

const wordsRouter = require('./src/words/wordsRoutes');
const adminRouter = require('./src/admin/adminRoutes');

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Too many requests, please try again later.',
  },
});

app.set('trust proxy', 1);

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

app.use('/api/words', limiter, requestLogger, wordsRouter);
app.use('/api/admin', adminRouter);

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


