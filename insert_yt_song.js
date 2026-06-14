require('dotenv').config();
const mongoose = require('mongoose');
const musicModel = require('./src/models/music.model');
const userModel = require('./src/models/user.model');

async function insertSongs() {
    await mongoose.connect(process.env.MONGODB_URI);
    
    let user = await userModel.findOne({ username: "YouTube System" });
    if (!user) {
        user = await userModel.findOne();
    }

    const songs = [
        { uri: "https://youtu.be/IUsNa8yhFnY?si=Kj7v4jtqDImnwbhm", title: "YouTube Track 5" },
        { uri: "https://youtu.be/ip9qEGZ7zNA?si=-eEK9PgD_3l4enZ1", title: "YouTube Track 6" },
        { uri: "https://youtu.be/kUkq_b3loYs?si=x1ELbkHucD2XHWbd", title: "YouTube Track 7" },
        { uri: "https://youtu.be/zySeiMcheV4?si=lfWCz1juLbljpwJw", title: "YouTube Track 8" }
    ];
    
    for (let song of songs) {
        let existing = await musicModel.findOne({ uri: song.uri });
        if (!existing) {
            await musicModel.create({
                uri: song.uri,
                title: song.title,
                artist: user._id,
            });
            console.log(`Song inserted successfully: ${song.title}`);
        } else {
            console.log(`Song already exists: ${song.title}`);
        }
    }
    
    await mongoose.disconnect();
}
insertSongs().catch(console.error);
