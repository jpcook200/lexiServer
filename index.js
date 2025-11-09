const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

const wordsRouter = require('./src/words/wordsRoutes');
const adminRouter = require('./src/admin/adminRoutes');

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

app.use('/api/words', wordsRouter);
app.use('/api/admin', adminRouter);
