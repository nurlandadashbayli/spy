# 🕵️ Multiplayer Spy Game

A simple, real-time multiplayer spy game where players try to figure out who the spy is among them!

## 🎮 How to Play

1. Players join the game with their names
2. When everyone is ready, the host starts the game
3. Each player is assigned a role:
   - **Most players** get random animal names (🦊 Fox, 🐻 Bear, etc.)
   - **One player** becomes the 🕵️ SPY
4. Players discuss and try to figure out who the spy is!

## 🚀 Setup Instructions

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the setup wizard
3. Once created, click on the web icon (`</>`) to add a web app
4. Copy the Firebase configuration object

### 2. Enable Realtime Database

1. In your Firebase project, go to **Build** → **Realtime Database**
2. Click "Create Database"
3. Choose your location
4. Start in **Test mode** (we'll secure it later)
5. Click "Enable"

### 3. Configure the Game

1. Open `game.js`
2. Replace the `firebaseConfig` object (lines 3-10) with your Firebase configuration:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

### 4. Secure Your Database (Important!)

After testing, update your Firebase Realtime Database rules:

1. Go to **Realtime Database** → **Rules** tab
2. Replace with these rules:

```json
{
  "rules": {
    "game": {
      "room": {
        ".read": true,
        ".write": true,
        "players": {
          "$playerId": {
            ".validate": "newData.hasChildren(['name', 'joinedAt'])"
          }
        }
      }
    }
  }
}
```

### 5. Test Locally

```bash
# Navigate to the project folder

# Start a local server
npx -y http-server -p 8080
```

Open `http://localhost:8080` in multiple browser tabs to test!

## 📦 Deploy to GitHub Pages

### Method 1: Using GitHub Web Interface

1. Create a new repository on GitHub
2. Upload all files (`index.html`, `style.css`, `game.js`, `README.md`)
3. Go to **Settings** → **Pages**
4. Under "Source", select your branch (usually `main`)
5. Choose root folder (`/`)
6. Click "Save"
7. Your game will be available at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### Method 2: Using Git Command Line

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Spy Game"

# Add remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/spy-game.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Then enable GitHub Pages in repository settings.

## 🎯 Features

- ✅ Real-time multiplayer synchronization
- ✅ Single room for all players
- ✅ Random role assignment (1 spy, others get animal names)
- ✅ Beautiful, modern UI with dark mode
- ✅ Responsive design for mobile and desktop
- ✅ Smooth animations and transitions
- ✅ Game restart functionality

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript (ES6 Modules)
- **Backend**: Firebase Realtime Database
- **Hosting**: GitHub Pages
- **Design**: Custom CSS with glassmorphism and gradients

## 📝 Notes

- The game uses Firebase's free tier (sufficient for small groups)
- Players must have internet connection
- All players see their role privately
- The game automatically cleans up when players leave

## 🐛 Troubleshooting

**"Failed to join game" error:**
- Check that Firebase configuration is correct
- Verify Realtime Database is enabled
- Check browser console for detailed error messages

**Players not syncing:**
- Ensure all players are accessing the same URL
- Check Firebase Database rules allow read/write
- Verify internet connection

**Game doesn't start:**
- Need at least 2 players to start
- Make sure all players have unique names

## 📄 License

Free to use and modify!

Enjoy your spy game! 🕵️🎮
