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
console.log('type:', process.env.type);
console.log('project_id:', process.env.project_id);
console.log('client_email:', process.env.client_email);
console.log('private_key exists:', !!process.env.private_key);

// Initialize Firebase Admin with environment variables
try {
  // Check if all required environment variables are present
  const requiredEnvVars = [
    'type',
    'project_id',
    'private_key_id',
    'private_key',
    'client_email',
    'client_id'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Fix private key formatting if needed
  let privateKey = process.env.private_key;
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }
  // Replace \\n with \n if needed
  privateKey = privateKey.replace(/\\n/g, '\n');

  const serviceAccount = {
    type: process.env.type,
    project_id: process.env.project_id,
    private_key_id: process.env.private_key_id,
    private_key: privateKey,
    client_email: process.env.client_email,
    client_id: process.env.client_id,
    auth_uri: process.env.auth_uri || "https://accounts.google.com/o/oauth2/auth",
    token_uri: process.env.token_uri || "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: process.env.auth_provider_x509_cert_url || "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.client_x509_cert_url,
    universe_domain: process.env.universe_domain || "googleapis.com"
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
      project_id: process.env.project_id,
      client_email: process.env.client_email,
      private_key_exists: !!process.env.private_key,
      error: admin.apps.length === 0 ? 'Firebase initialization failed' : null
    }
  };
  console.log('Health check response:', initStatus);
  res.json(initStatus);
});

// Endpoint to send notification
app.post('/send-notification', async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin is not initialized');
    }

    const { token, title, body, data } = req.body;
    console.log('Sending notification to:', token);
    console.log('Notification data:', { title, body, data });

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: token
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send multiple notifications endpoint
app.post('/send-notifications', async (req, res) => {
  try {
    if (!admin.apps.length) {
      throw new Error('Firebase Admin is not initialized');
    }

    const { tokens, title, body, data } = req.body;
    console.log('Sending notifications to:', tokens);
    console.log('Notification data:', { title, body, data });

    const messages = tokens.map(token => ({
      notification: {
        title,
        body,
      },
      data: data || {},
      token: token
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
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Notification server running on port ${PORT}`);
}); 