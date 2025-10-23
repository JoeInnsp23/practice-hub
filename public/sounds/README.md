# Notification Sounds

## Required Files

### notification.mp3
A short (1-2 second) notification sound for real-time notifications.

**Specifications:**
- Format: MP3
- Duration: 1-2 seconds
- Volume: Moderate (code sets volume to 0.5)
- Purpose: Alert users to urgent notifications

**Recommended Sources:**
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) (free, no attribution required)
- [Freesound](https://freesound.org/) (Creative Commons)
- Custom recording

**Usage:**
Referenced in `components/realtime-notifications.tsx:124`:
```typescript
const audio = new Audio("/sounds/notification.mp3");
audio.volume = 0.5;
audio.play();
```

**Note:** The notification system has graceful error handling. If this file is missing, the sound feature will silently fail without breaking functionality. However, for complete feature implementation, this file should be added before production deployment.
