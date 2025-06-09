require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const path = require('path');

// Initialize express app
const app = express();
app.use(express.json());
app.use(cors());

// Debug environment variables
console.log('Environment Variables Check:');
console.log('FIREBASE_TYPE:', process.env.FIREBASE_TYPE);
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

// Initialize Firebase Admin with environment variables
try {
  // Check if all required environment variables are present
  const requiredEnvVars = [
    'FIREBASE_TYPE',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID',
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Fix private key formatting if needed
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // Replace \\n with \n if needed
  privateKey = privateKey.replace(/\\n/g, '\n');

  const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN || "googleapis.com"
  };

  console.log('Service Account Config:', {
    ...serviceAccount,
    private_key: serviceAccount.private_key ? 'PRESENT' : 'MISSING'
  });

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  console.error('Error details:', error.stack);
}

// Health check endpoint
app.get('/', (req, res) => {
  const initStatus = {
    status: 'ok',
    message: 'Notification server is running',
    environment: process.env.NODE_ENV || 'development',
    firebaseInitialized: admin.apps.length > 0,
    config: {
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key_exists: !!process.env.FIREBASE_PRIVATE_KEY
    }
  };
  console.log('Health check response:', initStatus);
  res.json(initStatus);
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