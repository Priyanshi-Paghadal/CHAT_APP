// server.js
const express = require('express');
const http = require('http');
require("dotenv").config();
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// SQLite database setup
const db = new sqlite3.Database('./chat.db', (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        // Create messages table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                text TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

const users = {};

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle user login
    socket.on('login', (username) => {
        users[socket.id] = username;
        console.log(`${username} logged in with ID: ${socket.id}`);
        socket.emit('loginSuccess');

        // Send chat history to the new user
        db.all('SELECT username, text FROM messages ORDER BY timestamp ASC', (err, rows) => {
            if (err) {
                console.error('Error fetching messages:', err.message);
            } else {
                rows.forEach((row) => {
                    socket.emit('chatMessage', {
                        id: socket.id, // Placeholder, history won't align as "own"
                        username: row.username,
                        text: row.text
                    });
                });
            }
        });
    });

    // Handle chat messages
    socket.on('chatMessage', (msg) => {
        const username = users[socket.id] || 'Anonymous';
        // Store message in database
        db.run('INSERT INTO messages (username, text) VALUES (?, ?)', [username, msg], (err) => {
            if (err) {
                console.error('Error saving message:', err.message);
            } else {
                // Broadcast to all clients
                io.emit('chatMessage', { id: socket.id, username, text: msg });
            }
        });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
        console.log(`${users[socket.id] || 'A user'} disconnected:`, socket.id);
        delete users[socket.id];
    });
});

server.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});

// Close database connection on server shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});