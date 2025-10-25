# SafeRoute AI - Setup Guide

## 🔧 Environment Setup

### 1. Convex Configuration

1. **Create a Convex project**:
   ```bash
   npx convex dev
   ```

2. **Set up environment variables**:
   Create `.env.local` in the project root:
   ```env
   VITE_CONVEX_URL=your_convex_url_here
   VITE_BACKEND_URL=http://localhost:5000
   ```

3. **Configure Google OAuth** (Optional):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add your domain to authorized origins
   - Set the client ID in your Convex dashboard environment variables:
     ```
     GOOGLE_CLIENT_ID=your_google_client_id
     ```

### 2. Backend Setup (Optional)

If you want to use the Python backend for enhanced route analysis:

1. **Install Python dependencies**:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Set up environment variables**:
   Create `backend/.env`:
   ```env
   VISUAL_CROSSING_API_KEY=T2B4PSFMSJPGPEDY68XPLXGGE
   ACCIDENT_DATASET_PATH=backend/dataset/accident_prediction_india.csv
   PORT=5000
   ```

3. **Run the backend**:
   ```bash
   python backend/app.py
   ```

## 🚀 Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:5173
   - Backend (if running): http://localhost:5000

## 🔐 Authentication Flow

### Without Google OAuth (Password Only)
1. Go to `/signup`
2. Fill in email and password
3. Complete profile information
4. Access dashboard

### With Google OAuth
1. Configure Google OAuth as described above
2. Users can sign in with Google
3. Profile completion is still required for personalization

## 🛠️ Troubleshooting

### Common Issues

1. **"Provider google is not configured"**:
   - Make sure `GOOGLE_CLIENT_ID` is set in Convex environment variables
   - Verify Google OAuth is properly configured

2. **"Invalid password"**:
   - Ensure you're using the correct email/password combination
   - Check if the user exists in your Convex database

3. **Backend connection issues**:
   - Verify `VITE_BACKEND_URL` is correct
   - Ensure the Python backend is running on the specified port

### Database Schema

The application uses these Convex tables:
- `userProfiles`: User information and preferences
- `routeHistory`: Saved route data with time context
- Auth tables (managed by Convex Auth)

## 📱 Features

- **Authentication**: Sign up, sign in, profile management
- **Route Planning**: Find safe routes between locations
- **Personalization**: Time-based and user-specific recommendations
- **Real-time Updates**: Live safety score adjustments
- **Route History**: Save and track previous routes

## 🔒 Security Notes

- All authentication is handled by Convex Auth
- User data is encrypted and secure
- No sensitive data is stored in local storage
- API keys should be kept secure and not committed to version control

