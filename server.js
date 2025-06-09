const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize express app
const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin with environment variables
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    console.log('Using environment variable for Firebase credentials');
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
    console.log('Using local file for Firebase credentials');
    serviceAccount = require('./el-nor-firebase-adminsdk-fbsvc-20338f224f.json');
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Notification server is running',
    environment: process.env.NODE_ENV || 'development',
    firebaseInitialized: admin.apps.length > 0
  });
});

// Endpoint to send notification
app.post('/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    if (!admin.apps.length) {
      throw new Error('Firebase Admin is not initialized');
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Send multiple notifications endpoint
app.post('/send-notifications', async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Array of FCM tokens is required' });
    }

    if (!admin.apps.length) {
      throw new Error('Firebase Admin is not initialized');
    }

    const messages = tokens.map(token => ({
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    }));

    const response = await admin.messaging().sendAll(messages);
    console.log('Successfully sent messages:', response);
    
    res.json({ 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });
  } catch (error) {
    console.error('Error sending messages:', error);
    res.status(500).json({ 
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Notification server running on port ${PORT}`);
}); 