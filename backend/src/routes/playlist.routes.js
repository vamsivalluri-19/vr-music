const express = require('express');
const playlistController = require("../controllers/playlist.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware.authUser, playlistController.createPlaylist);
router.get("/", authMiddleware.authUser, playlistController.getUserPlaylists);
router.post("/add", authMiddleware.authUser, playlistController.addSongToPlaylist);

module.exports = router;
