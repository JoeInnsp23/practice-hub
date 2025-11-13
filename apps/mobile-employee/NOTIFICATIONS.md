# Push Notifications - Employee Hub Mobile App

## Overview

The Employee Hub mobile app supports push notifications for:
- **Approval requests** - New timesheet/leave requests awaiting approval (for managers)
- **Status updates** - Approval/rejection notifications for your requests
- **General alerts** - Important system notifications

## Features

### Notification Channels (Android)

1. **Default** - General notifications
2. **Approvals** - High-priority approval requests
3. **Updates** - Status updates for your requests

### Notification Types

- ✅ **Approved** - Your timesheet/leave was approved
- ❌ **Rejected** - Your timesheet/leave was rejected
- 🔔 **New Request** - A new request awaits your approval (managers only)

## Setup

### Development Setup

1. **Install Dependencies** (already done)
   ```bash
   pnpm add expo-notifications expo-device
   ```

2. **Physical Device Required**
   - Push notifications only work on physical devices, not simulators/emulators
   - iOS: Connect iPhone via USB or use Expo Go
   - Android: Connect Android device or use Expo Go

3. **Expo Project ID**
   - Update `src/lib/notifications.ts` with your Expo project ID:
   ```typescript
   const pushTokenData = await Notifications.getExpoPushTokenAsync({
     projectId: "your-actual-expo-project-id"
   });
   ```

### Production Setup

1. **iOS Configuration**
   - Apple Push Notification service (APNs) certificate required
   - Configure in Apple Developer Portal
   - Add to Expo project settings

2. **Android Configuration**
   - Firebase Cloud Messaging (FCM) required
   - Create Firebase project
   - Download `google-services.json` and place in app root
   - Add FCM server key to backend

3. **Backend Integration**
   - Register push tokens with backend
   - Backend should send notifications via Expo Push API
   - See: https://docs.expo.dev/push-notifications/sending-notifications/

## Usage

### Sending Local Notifications (Testing)

```typescript
import { sendLocalNotification } from "@/lib/notifications";

// Send a test notification
await sendLocalNotification(
  "Test Notification",
  "This is a test message"
);

// Send approval notification
import { sendApprovalNotification } from "@/lib/notifications";

await sendApprovalNotification(
  "timesheet",
  "John Doe",
  "37.5 hours for week ending 2025-01-17"
);

// Send status update
import { sendStatusUpdateNotification } from "@/lib/notifications";

await sendStatusUpdateNotification(
  "approved",
  "leave",
  "Your leave request for Jan 20-24 was approved"
);
```

### Handling Notification Taps

The `useNotifications` hook automatically handles navigation when users tap notifications. Update the response listener in `src/hooks/useNotifications.ts` to add custom navigation logic:

```typescript
responseListener.current = addNotificationResponseListener((response) => {
  const data = response.notification.request.content.data;

  if (data.submissionId) {
    navigation.navigate("Approvals", {
      screen: "TimesheetDetail",
      params: { submissionId: data.submissionId }
    });
  }
});
```

## Testing Notifications

### Method 1: Local Notifications

```typescript
// In any screen
import { sendLocalNotification } from "@/lib/notifications";

<Button
  title="Test Notification"
  onPress={() => {
    sendLocalNotification(
      "Test",
      "This is a test notification"
    );
  }}
/>
```

### Method 2: Expo Push Tool

1. Get your Expo push token (logged when app starts)
2. Visit https://expo.dev/notifications
3. Enter your push token
4. Send test notification

### Method 3: Backend Integration

Once backend is configured:
1. Approve/reject a timesheet or leave request
2. Backend sends push notification
3. Mobile app receives notification

## Notification Permissions

The app requests notification permissions on first launch via `registerForPushNotifications()`. Users can:
- **Allow** - Receive all notifications
- **Deny** - No notifications (can re-enable in device settings)

## Badge Counts

Badge counts show unread notifications on the app icon:

```typescript
import { setBadgeCount, getBadgeCount } from "@/lib/notifications";

// Set badge count
await setBadgeCount(5);

// Get current count
const count = await getBadgeCount();

// Clear badge
await setBadgeCount(0);
```

## Troubleshooting

### "Push notifications only work on physical devices"
- Simulators/emulators don't support push notifications
- Use a real iPhone or Android device

### Not receiving notifications
1. Check device notification settings
2. Verify app has notification permissions
3. Ensure push token was registered with backend
4. Check backend is sending notifications correctly

### Notifications not showing when app is open
- Configured via `Notifications.setNotificationHandler()`
- See `src/lib/notifications.ts`

## Future Enhancements

- [ ] Rich notifications with images/actions
- [ ] Notification preferences (enable/disable by type)
- [ ] Scheduled notifications (reminders)
- [ ] Notification history screen
- [ ] Silent notifications for data sync

## Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [FCM Setup](https://firebase.google.com/docs/cloud-messaging)
- [APNs Setup](https://developer.apple.com/documentation/usernotifications)
