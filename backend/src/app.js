const express = require('express');
const cookieParser=require('cookie-parser');
const cors = require('cors');
const authRoutes=require('./routes/auth.routes');
const musicRoutes=require('./routes/music.routes');
const playlistRoutes=require('./routes/playlist.routes');
const app=express();

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
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
