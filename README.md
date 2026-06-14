# VR Music 🎵

A premium, modern music streaming web application designed with a sleek dark theme, glassmorphism aesthetics, PWA capabilities, and a custom logo.

## 🚀 Features

* **Sleek UI/UX**: Modern dark-mode interface utilizing Google Font's *Outfit* and glassmorphism styling.
* **Responsive Design**: Clean and responsive sidebar navigation, music player controls, and modal interfaces.
* **Authentication**: Complete user signup, login, and session persistence using JWT and cookies.
* **Music Management**: Stream tracks, create custom playlists, and add songs to playlists.
* **PWA Capable**: Custom manifest and progressive web app capabilities, with an active Service Worker for caching and fast/offline load performance.
* **Seeded Data**: Easy database seeding script for quickly setting up default YouTube music tracks.

---

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3, Vanilla JavaScript, FontAwesome Icons
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (via Mongoose)
* **PWA**: Service Worker caching, manifest configuration
* **Environment**: dotenv configuration

---

## 📂 Project Structure

```text
vr-music/
├── db/                     # Database connection settings
│   └── db.js               # MongoDB connection setup
├── public/                 # Static frontend files
│   ├── index.html          # Main HTML entrypoint
│   ├── logo.png            # Custom neon VR Music logo asset
│   ├── manifest.json       # PWA Manifest configuration
│   ├── script.js           # Client-side routing, auth, and playback logic
│   ├── style.css           # Premium glassmorphism styles
│   └── sw.js               # Service worker caching strategy (v3)
├── src/                    # Backend application source
│   ├── controllers/        # Route controllers (auth, music, playlists)
│   ├── middlewares/        # Express Middlewares (auth verification)
│   ├── models/             # Mongoose schemas (user, music, playlist, album)
│   ├── routes/             # API routing configuration
│   └── app.js              # Express app setup
├── .env                    # Environment variables (excluded from Git)
├── .gitignore              # Files ignored by Git (node_modules, .env, etc.)
├── insert_yt_song.js       # Database seeder script
├── package.json            # Node project configuration
└── server.js               # Server entry point
```

---

## 🔧 Installation & Setup

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) installed/configured.

### 2. Install Dependencies
Clone the repository and run:
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root folder of the project with the following configuration:
```env
MONGODB_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_secret_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
```

### 4. Seed default tracks
To populate the database with initial tracks, run the seeder script:
```bash
node insert_yt_song.js
```

### 5. Run the server

* **Development Mode** (with automatic restarts on file changes):
  ```bash
  npm run dev
  ```
  
* **Production Mode**:
  ```bash
  npm start
  ```

Once started, open **[http://localhost:3000](http://localhost:3000)** in your web browser.

---

## 📜 License
Licensed under the ISC License.