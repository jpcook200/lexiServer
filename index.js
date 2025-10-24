const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const wordsRouter = require('./src/words/wordsRoutes');

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

app.use('/api/words', wordsRouter);