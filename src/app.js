const express = require('express');
const cookieParser=require('cookie-parser');
const authRoutes=require('./routes/auth.routes');
const musicRoutes=require('./routes/music.routes');
const playlistRoutes=require('./routes/playlist.routes');
const app=express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/playlist', playlistRoutes);

const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));

module.exports=app;
