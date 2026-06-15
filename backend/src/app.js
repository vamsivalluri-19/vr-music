const express = require('express');
const cookieParser=require('cookie-parser');
const cors = require('cors');
const authRoutes=require('./routes/auth.routes');
const musicRoutes=require('./routes/music.routes');
const playlistRoutes=require('./routes/playlist.routes');
const app=express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlist', playlistRoutes);

const path = require('path');
app.use(express.static(path.join(__dirname, '../../frontend')));

module.exports=app;
