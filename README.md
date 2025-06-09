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

## Security Notes

- The service account credentials file is automatically ignored by git
- Always use environment variables for sensitive data in production
- Keep your service account credentials secure and never share them publicly

## Development

```bash
npm install
npm start
``` 