# Notification Server

This server handles Firebase Cloud Messaging (FCM) notifications for the El Nor application.

## Setup

1. Create a Firebase service account:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `el-nor-firebase-adminsdk-[hash].json` in the root directory

2. Environment Setup:
   - Copy the service account JSON file to the root directory
   - The file should follow the structure shown in `service-account-template.json`
   - **IMPORTANT**: Never commit the actual service account JSON file to version control

## Deployment to Render

1. Create a new Web Service on Render:
   - Sign up/Login to [Render](https://render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Choose the repository and branch

2. Configure the Web Service:
   - Name: `el-nor-notification-server` (or your preferred name)
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Select the appropriate instance type (Free tier is fine for testing)

3. Add Environment Variables:
   - Click on "Environment" tab
   - Add the following environment variables:
     - `FIREBASE_SERVICE_ACCOUNT`: Paste the entire content of your Firebase service account JSON file
     - `PORT`: `3000` (or your preferred port)

4. Deploy:
   - Click "Create Web Service"
   - Wait for the deployment to complete
   - Your service will be available at `https://your-service-name.onrender.com`

5. Update Your Flutter App:
   - Replace the local server URL with your Render service URL in `lib/features/admin/services/admin_notification_service.dart`

## Security Notes

- The service account credentials file is automatically ignored by git
- Always use environment variables for sensitive data in production
- Keep your service account credentials secure and never share them publicly

## Development

```bash
npm install
npm start
```

## Testing the Server

Test your deployment with:

```bash
curl -X POST https://your-service-name.onrender.com/send-notification \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_FCM_TOKEN",
    "title": "Test Notification",
    "body": "This is a test notification",
    "data": {}
  }'
``` 