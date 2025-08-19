# Reelgram - Reels First Social Platform

A modern social platform focused on short-form video content (reels) with integrated messaging and video calling features.

## 🔧 Fixed Issues

### Backend Fixes:
1. **✅ Fixed User Model Inconsistencies**
   - Aligned field names (`password` vs `passwordHash`)
   - Added required `email` field
   - Added proper indexes

2. **✅ Created Missing Like Model**
   - Added `models/like.js` with proper relationships
   - Implemented unique compound index to prevent duplicate likes

3. **✅ Fixed Authentication System**
   - Created proper auth middleware in `src/middleware/auth.js`
   - Fixed JWT token handling and payload structure
   - Updated bcrypt import (using `bcryptjs` instead of `bcrypt`)

4. **✅ Fixed Route Import Paths**
   - Corrected all import paths in routes
   - Fixed model references (case sensitivity)
   - Aligned directory structure

5. **✅ Organized Server Structure**
   - Proper separation between simple `server.js` and full `src/index.js`
   - Added uploads directory handling
   - Fixed client path resolution

6. **✅ Added File Upload Support**
   - Created uploads directory structure
   - Added static file serving for uploaded content
   - Proper multer configuration for reel videos

### Frontend Improvements:
1. **✅ Added API Service Layer**
   - Created `client/api.js` for backend communication
   - Implemented authentication token management
   - Added methods for all major API endpoints

2. **✅ Enhanced Integration**
   - Added API script to HTML
   - Prepared foundation for replacing localStorage with API calls

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)

### Backend Setup
1. Navigate to server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (`.env` file):
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/reelgram
   JWT_SECRET=MySuperSecretKey123!@#
   UPLOAD_DIR=uploads
   ```

4. Start the server:
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

### Database Setup
Make sure MongoDB is running. The application will connect to the database specified in `MONGO_URI`.

### File Uploads
The server will automatically create the necessary upload directories:
- `server/uploads/reels/` - for video files

## 🌟 Features

### Core Features:
- **User Authentication** - Register/Login with JWT tokens
- **Reel Management** - Upload, view, like, and comment on short videos
- **Real-time Chat** - Direct messaging between users
- **Video Calling** - P2P video calls using WebRTC
- **User Discovery** - Suggested users and search functionality

### API Endpoints:

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Users
- `GET /api/users/suggested` - Get suggested users
- `GET /api/users/by-name?name=username` - Find user by name

#### Reels
- `GET /api/reels` - List reels (paginated)
- `POST /api/reels` - Create new reel (requires auth + file upload)
- `POST /api/reels/:id/like` - Like/unlike reel (requires auth)
- `GET /api/reels/:id/comments` - Get reel comments
- `POST /api/reels/:id/comments` - Add comment (requires auth)

#### Chat
- `GET /api/chat/:partner` - Get chat history (requires auth)

## 🔒 Authentication

The API uses JWT tokens for authentication. Include the token in requests:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📁 Project Structure

```
reelgram/
├── server/
│   ├── src/
│   │   ├── index.js          # Main server entry point
│   │   ├── socket.js         # Socket.io configuration
│   │   └── middleware/
│   │       └── auth.js       # Authentication middleware
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── User.js           # User management routes
│   │   ├── Reels.js          # Reel management routes
│   │   └── Chat.js           # Chat routes
│   ├── models/
│   │   ├── User.js           # User model
│   │   ├── reel.js           # Reel model
│   │   ├── like.js           # Like model
│   │   ├── comment.js        # Comment model
│   │   └── message.js        # Message model
│   ├── uploads/              # File uploads directory
│   ├── package.json
│   ├── .env
│   └── server.js            # Simple server (redirects to src/index.js)
└── client/
    ├── index.html           # Main HTML file
    ├── style.css            # Styles
    ├── app.js              # Main application logic
    └── api.js              # API service layer
```

## 🚀 Development

### Running in Development Mode
```bash
cd server
npm run dev
```
This uses nodemon for automatic server restarts on file changes.

### Testing the API
You can test the API endpoints using tools like:
- Postman
- curl
- Browser developer tools

### Client-Side Development
The client currently includes both localStorage-based demo functionality and API integration. You can gradually migrate features from localStorage to use the real backend API.

## 🐛 Common Issues & Solutions

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the `MONGO_URI` in `.env`

2. **File Upload Issues**
   - Check that uploads directory exists and is writable
   - Ensure proper permissions

3. **Authentication Issues**
   - Verify JWT_SECRET is set in environment
   - Check token format in API requests

4. **CORS Issues**
   - The server includes CORS middleware
   - For production, configure specific origins

## 📝 TODO / Future Improvements

1. **Client Integration**: Complete migration from localStorage to API
2. **Real-time Features**: Implement Socket.io for live chat and notifications
3. **Media Processing**: Add video processing and thumbnails
4. **Security**: Add rate limiting and input validation
5. **Testing**: Add unit and integration tests
6. **Deployment**: Add Docker configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational/demo purposes. Please check licensing requirements for production use.
