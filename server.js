const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize express app
const app = express();
app.use(express.json());
app.use(cors());

// Initialize Firebase Admin
const serviceAccount = require('./el-nor-firebase-adminsdk-fbsvc-20338f224f.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Endpoint to send notification
app.post('/send-notification', async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    const message = {
      token: token,
      notification: {
        title: title,
        body: body
      },
      data: data || {},
      android: {
        priority: 'high',
        notification: {
          channelId: 'default_channel',
          priority: 'HIGH'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            'content-available': 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent message:', response);
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 