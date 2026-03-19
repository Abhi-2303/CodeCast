const express = require('express');
const app = express();
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

app.use(express.json());

const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const ACTIONS = require('./src/actions/Actions');

const server = http.createServer(app);

// 1. ADDED CORS CONFIGURATION HERE
const io = new Server(server, {
    cors: {
        origin: "*", // In production, change "*" to your actual domain name!
        methods: ["GET", "POST"],
    },
});

app.use(express.static('build'));

const userSocketMap = {};

function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
        }
    );
}

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, cursor }) => {
        socket.in(roomId).emit(ACTIONS.CURSOR_CHANGE, {
            socketId: socket.id,
            cursor,
            username: userSocketMap[socket.id],
        });
    });

    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        // socket.leave() is handled automatically by socket.io on disconnect
    });
});

// Serve response in production (Test route)
app.get('/test', (req, res) => {
    const htmlContent = '<h1>Welcome to the code editor server</h1>';
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
});

// Local Code Execution Endpoint
app.options('/api/execute', (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.sendStatus(200);
});

app.post('/api/execute', (req, res) => {
    // Set CORS headers for this POST endpoint explicitly
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    const { code, language } = req.body;
    
    const languageConfig = {
        python: { ext: 'py', command: 'python' },
        javascript: { ext: 'js', command: 'node' },
        c: { ext: 'c', command: 'gcc' },
        cpp: { ext: 'cpp', command: 'g++' },
        php: { ext: 'php', command: 'php' },
        // Add more languages here if you need!
    };

    const config = languageConfig[language];
    if (!config) {
        return res.status(400).json({ output: `Language '${language}' is not supported locally.` });
    }

    const id = uuidv4();
    const tempFile = `temp_${id}.${config.ext}`;
    const outExeName = os.platform() === 'win32' ? `out_${id}.exe` : `./out_${id}`;
    const outFileName = os.platform() === 'win32' ? `out_${id}.exe` : `out_${id}`;
    
    let execCommand = '';
    if (language === 'c' || language === 'cpp') {
        execCommand = `${config.command} ${tempFile} -o ${outFileName} && ${outExeName}`;
    } else {
        execCommand = `${config.command} ${tempFile}`;
    }

    fs.writeFile(tempFile, code, (err) => {
        if (err) return res.status(500).json({ output: 'Error writing temporary file on server.' });
        
        exec(execCommand, { timeout: 10000 }, (execErr, stdout, stderr) => {
            // Cleanup files
            try {
                if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
                if ((language === 'c' || language === 'cpp') && fs.existsSync(outFileName)) {
                    fs.unlinkSync(outFileName);
                }
            } catch (e) {
                console.error("Cleanup error:", e);
            }

            if (execErr) {
                // Execution failed (syntax error, compile error, or timeout)
                return res.status(200).json({ output: stderr || execErr.message });
            }
            res.status(200).json({ output: stdout || stderr });
        });
    });
});

// 2. MOVED CATCH-ALL ROUTE TO THE BOTTOM
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.SERVER_PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));