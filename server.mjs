import express from 'express';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const app = express();
app.use(express.json());

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

function readUsers() {
    try {
        const data = fs.readFileSync(usersFile, 'utf-8');
        return JSON.parse(data || '[]');
    } catch {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

// Register endpoint
app.post ('/register', (req, res) => {
    const {email, password} = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });

    const users = readUsers();

    if(users.find(u => u.email === email))
        return res.status(400).json({ error: "Email already registered"});

    const hashed = bcrypt.hashSync(password, 10);

    const newUser = { 
        id: uuid(), 
        email, 
        password: hashed,
        createAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.json({ message: "User Registered", id: newUser.id });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    const users = readUsers();
    const user = users.find(u => u.email === email);

    if (!user)
        return res.status(400).json({ error: "Invalid email or password" });

    const valid = bcrypt.compareSync(password, user.password);

    if (!valid)
        return res.status(400).json({ error: "Invalid email or password" });

    res.json({
        message: "Login successful",
        userId: user.id
    });
});

//start server
app.listen(3001, () => {
    console.log('Auth microservice running on port 3001');
});