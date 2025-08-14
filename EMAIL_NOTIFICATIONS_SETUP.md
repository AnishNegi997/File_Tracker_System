# Email Notifications Setup Guide

## Overview

The File Tracking System now includes comprehensive email notifications that will automatically send emails to users when files are forwarded, received, completed, or released. This ensures all stakeholders are kept informed about file movements and status changes.

## Features

### Email Notifications Include:
1. **File Forwarded** - When a file is forwarded to another user/department
2. **File Released** - When an admin releases a file to an employee
3. **File Received** - When an employee receives a distributed file
4. **File Completed** - When a file is marked as completed

### Email Content Includes:
- File code and title
- Priority level with color coding
- Department information
- Deadline (if applicable)
- Sender and recipient details
- Timestamps
- Remarks/notes
- Action required messages

## Setup Instructions

### 1. Email Configuration

Update your `backend/config.env` file with your email settings:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ENABLE_EMAIL_NOTIFICATIONS=true
```

### 2. Gmail Setup (Recommended)

If using Gmail, follow these steps:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
   - Use this password in `SMTP_PASS`

### 3. Other Email Providers

For other providers, update the configuration:

```env
# Outlook/Hotmail
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587

# Yahoo
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587

# Custom SMTP
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
```

## Testing Email Setup

### 1. Test Email Connection

Make a GET request to test the email connection:

```bash
curl -X GET http://localhost:5000/api/email/test-connection \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Send Test Email

Send a test email to verify the setup:

```bash
curl -X POST http://localhost:5000/api/email/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "template": "fileForwarded",
    "data": {
      "fileCode": "THDC-F-2024-0001",
      "fileTitle": "Test File",
      "priority": "Urgent",
      "department": "IT",
      "sentBy": "John Doe",
      "recipientName": "Jane Smith",
      "sentThrough": "Email",
      "sentAt": "2024-01-15T10:30:00Z",
      "remarks": "Please review this test file"
    }
  }'
```

## Email Templates

### 1. File Forwarded Template
- **Trigger**: When a file is forwarded to another user/department
- **Recipients**: Department admin or intended recipient
- **Content**: File details, priority, deadline, sender info, remarks

### 2. File Released Template
- **Trigger**: When an admin releases a file to an employee
- **Recipients**: Employee who receives the file
- **Content**: File details, release information, action required

### 3. File Received Template
- **Trigger**: When an employee marks a file as received
- **Recipients**: Admin who distributed the file
- **Content**: Confirmation of file receipt, timestamp

### 4. File Completed Template
- **Trigger**: When a file is marked as completed
- **Recipients**: Admin and original sender
- **Content**: Completion details, remarks, final status

## Email Workflow

### Complete Email Flow:

1. **User forwards file** → Email sent to department admin
2. **Admin distributes file** → Email sent to employee
3. **Employee receives file** → Email sent to admin (confirmation)
4. **Employee completes file** → Email sent to admin and original sender

### Example Workflow:

```
John (IT) forwards file to HR
    ↓
Email sent to HR Admin
    ↓
HR Admin distributes to Jane (HR Employee)
    ↓
Email sent to Jane
    ↓
Jane receives the file
    ↓
Email sent to HR Admin (confirmation)
    ↓
Jane completes the file
    ↓
Email sent to HR Admin and John (original sender)
```

## Configuration Options

### Enable/Disable Notifications

```env
# Enable all email notifications
ENABLE_EMAIL_NOTIFICATIONS=true

# Disable email notifications
ENABLE_EMAIL_NOTIFICATIONS=false
```

### Custom Email Templates

You can customize email templates by modifying `backend/utils/emailService.js`:

```javascript
const emailTemplates = {
  fileForwarded: (data) => ({
    subject: `📤 File Forwarded: ${data.fileCode} - ${data.fileTitle}`,
    html: `Your custom HTML template here...`
  }),
  // ... other templates
};
```

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Check SMTP credentials
   - Ensure 2FA is enabled for Gmail
   - Verify app password is correct

2. **Connection Timeout**
   - Check SMTP host and port
   - Verify firewall settings
   - Test with different email provider

3. **Emails Not Sending**
   - Check `ENABLE_EMAIL_NOTIFICATIONS` setting
   - Verify user email addresses in database
   - Check server logs for errors

### Debug Commands:

```bash
# Test email connection
curl http://localhost:5000/api/email/test-connection

# Check server logs
tail -f backend/logs/app.log

# Verify environment variables
echo $SMTP_HOST
echo $SMTP_USER
echo $ENABLE_EMAIL_NOTIFICATIONS
```

## Security Considerations

1. **App Passwords**: Use app passwords instead of regular passwords
2. **Environment Variables**: Never commit email credentials to version control
3. **Rate Limiting**: Email sending is subject to SMTP provider limits
4. **Error Handling**: Email failures don't break the main application flow

## Best Practices

1. **Test Thoroughly**: Always test email setup before production
2. **Monitor Logs**: Check email sending logs regularly
3. **Backup Configuration**: Keep email settings in secure environment files
4. **User Communication**: Inform users about email notifications
5. **Template Updates**: Review and update email templates as needed

## API Endpoints

### Email Testing Endpoints:

- `GET /api/email/test-connection` - Test email server connection
- `POST /api/email/test` - Send test email

### Automatic Email Triggers:

- File forwarding → Automatic email to recipient
- File release → Automatic email to employee
- File reception → Automatic email to admin
- File completion → Automatic email to stakeholders

## Support

If you encounter issues with email notifications:

1. Check the troubleshooting section above
2. Verify your email provider settings
3. Test with the provided test endpoints
4. Review server logs for detailed error messages
5. Ensure all environment variables are properly set

## Example Email Output

Here's what users will receive:

```
Subject: 📤 File Forwarded: THDC-F-2024-0001 - Purchase Request

[Professional HTML email with:]
- File details table
- Priority badge (color-coded)
- Sender/recipient information
- Timestamps
- Action required message
- System branding
```

The emails are professionally formatted with responsive design and clear call-to-action messages.
