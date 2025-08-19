# Reelgram - GitHub Installation Guide

This guide will help you set up Reelgram from GitHub.

## 🚀 Quick Start

Follow these steps to get Reelgram running on your machine:

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/reelgram.git
cd reelgram
```

### 2. Set up the backend

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file from template
cp .env.example .env
```

### 3. Configure your environment

Edit the `.env` file with your specific settings:
- Set a strong `JWT_SECRET`
- Configure your MongoDB connection (`MONGO_URI`)
- Set up email settings if needed

### 4. Create required directories

```bash
# Create uploads directory structure
mkdir -p uploads/reels
```

### 5. Start MongoDB

Make sure MongoDB is running on your system:

```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# In that case, update your MONGO_URI in .env
```

### 6. Start the server

```bash
# Development mode with auto-reload
npm run dev

# OR Production mode
npm start
```

### 7. Access the application

Open your browser and navigate to: `http://localhost:3000`

## 🔍 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Make sure MongoDB is running
   - Verify your connection string in `.env`
   - Check for network issues if using MongoDB Atlas

2. **Port Already in Use**
   - Change the PORT in `.env`
   - Check what's using port 3000: `lsof -i :3000`

3. **Missing Uploads Directory**
   - Ensure you've created the required directories
   - Check permissions: `chmod -R 755 uploads`

4. **JWT Token Issues**
   - Ensure you've set a strong, unique JWT_SECRET

## 📦 Deployment Options

### ☁️ Render.com (Free Tier Available)
1. Create a new Web Service
2. Connect your GitHub repo
3. Set build command: `cd server && npm install`
4. Set start command: `cd server && npm start`
5. Add environment variables from your `.env` file

### ☁️ Railway.app
1. Create a new project
2. Connect your GitHub repo
3. Add MongoDB as a plugin or use MongoDB Atlas
4. Set ROOT_DIRECTORY to `/server`
5. Add environment variables from your `.env` file

### ☁️ Heroku
1. Create a new app
2. Connect your GitHub repo
3. Set buildpack to Node.js
4. Add MongoDB addon or use MongoDB Atlas
5. Configure environment variables in settings

## 📱 Mobile Access

To access the app from mobile devices on your local network:

1. Find your computer's local IP address:
   ```bash
   # On macOS/Linux
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. Update your `.env` file:
   ```
   BASE_URL=http://YOUR_LOCAL_IP:3000
   FRONTEND_URL=http://YOUR_LOCAL_IP:3000
   ```

3. Restart the server and access from your mobile device using:
   `http://YOUR_LOCAL_IP:3000`
