const express = require('express');
const path = require('path');
const processor = require('./timetable_processor');

const app = express();
const frontendDir = path.join(__dirname, 'frontend');

// Reverse proxy will be used
app.set('trust proxy', true);

// Serve static files from the 'frontend' directory
app.use(express.static(frontendDir));

// Route for GET /data
app.get('/data', (req, res) => {
    let year = req.query.year || new Date().getFullYear();

    processor.getStudiesData(year, (err, data) => {
        if (err) {
            res.status(500).send('Error fetching data');
        } else {
            res.json(data);
        }
    });
});

// Route for GET /subjectData
app.get('/subjectData', (req, res) => {
    const subjectsParam = req.query.subjects || '[]';
    const year = req.query.year || new Date().getFullYear();

    let subjectLinks;
    try {
        subjectLinks = JSON.parse(subjectsParam);
    } catch (e) {
        res.status(400).json({ error: 'Invalid subjects parameter' });
        return;
    }

    // Map subject links to subjects
    const subjects = subjectLinks.map(link => ({ link }));

    processor.getSubjectData(subjects, year, (err, data) => {
        if (err) {
            res.status(500).json({ error: 'Error fetching subject data' });
        } else {
            res.json(data);
        }
    });
});

// Fallback to index.html for SPA support
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(8080, () => {
    console.log('Server is listening on port 8080');
});
