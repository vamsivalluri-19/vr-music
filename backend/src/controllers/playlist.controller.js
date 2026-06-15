const playlistModel = require("../models/playlist.model");
const musicModel = require("../models/music.model");

async function createPlaylist(req, res) {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Playlist name is required" });

    try {
        const playlist = await playlistModel.create({
            name,
            creator: req.user.id,
            musics: []
        });
        res.status(201).json({ message: "Playlist created successfully", playlist });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function getUserPlaylists(req, res) {
    try {
        const playlists = await playlistModel.find({ creator: req.user.id }).populate({
            path: 'musics',
            populate: { path: 'artist', select: 'username email' }
        });
        res.status(200).json({ message: "Playlists fetched", playlists });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function addSongToPlaylist(req, res) {
    const { playlistId, musicId } = req.body;

    try {
        const playlist = await playlistModel.findOne({ _id: playlistId, creator: req.user.id });
        if (!playlist) return res.status(404).json({ message: "Playlist not found or unauthorized" });

        if (playlist.musics.includes(musicId)) {
            return res.status(400).json({ message: "Song already in playlist" });
        }

        playlist.musics.push(musicId);
        await playlist.save();
        res.status(200).json({ message: "Song added to playlist", playlist });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

module.exports = { createPlaylist, getUserPlaylists, addSongToPlaylist };
