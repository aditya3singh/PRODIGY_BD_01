const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = 3000;
const DATA_FILE = 'database.json';

// Load data from file
let database = new Map();
if (fs.existsSync(DATA_FILE)) {
    const rawData = fs.readFileSync(DATA_FILE);
    const parsedData = JSON.parse(rawData);
    database = new Map(parsedData);
}

// Save data to file
const saveDatabase = () => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(database.entries()), null, 2));
};

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Function to validate email format
const isValidEmail = (email) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);

// Routes
app.get('/', (req, res) => {
    res.render('index', { data: Array.from(database.values()), error: null });
});

app.post('/upload', (req, res) => {
    const { name, email, age } = req.body;
    if (!name || !email || !age || !isValidEmail(email)) {
        return res.render('index', { data: Array.from(database.values()), error: 'Invalid input! Ensure all fields are filled and email is valid.' });
    }
    const id = uuidv4();
    database.set(id, { id, name, email, age });
    saveDatabase();
    res.redirect('/');
});

app.get('/search', (req, res) => {
    if (!req.query.q) return res.render('search', { results: [], error: 'Search query is required' });
    const query = req.query.q.toLowerCase();
    const results = Array.from(database.values()).filter(user =>
        user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
    );
    res.render('search', { results, error: results.length ? null : 'No results found' });
});

app.get('/edit/:id', (req, res) => {
    const user = database.get(req.params.id);
    if (!user) return res.render('edit', { user: null, error: 'User not found' });
    res.render('edit', { user, error: null });
});

app.post('/update/:id', (req, res) => {
    const { name, email, age } = req.body;
    if (!database.has(req.params.id)) return res.render('edit', { user: null, error: 'User not found' });
    if (!name || !email || !age || !isValidEmail(email)) {
        return res.render('edit', { user: database.get(req.params.id), error: 'Invalid input! Ensure all fields are filled and email is valid.' });
    }
    database.set(req.params.id, { id: req.params.id, name, email, age });
    saveDatabase();
    res.redirect('/');
});

app.get('/delete/:id', (req, res) => {
    if (!database.has(req.params.id)) return res.render('search', { results: Array.from(database.values()), error: 'User not found' });
    database.delete(req.params.id);
    saveDatabase();
    res.redirect('/');
});

app.get('/read/:id', (req, res) => {
    const user = database.get(req.params.id);
    if (!user) return res.render('read', { user: null, error: 'User not found' });
    res.render('read', { user, error: null });
});

// Global Error Handling
app.use((req, res) => {
    res.status(404).render('error', { error: 'Route not found' });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
