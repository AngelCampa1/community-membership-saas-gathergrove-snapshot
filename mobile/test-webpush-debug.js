const { webPushNotificationService } = require('./src/services/webPushNotificationService');

async function test() {
  // Check initial state
  console.log('isSupported:', webPushNotificationService.isSupported);
  console.log('swRegistration:', !!webPushNotificationService.swRegistration);
  console.log('vapidPublicKey:', !!webPushNotificationService.vapidPublicKey);
  console.log('permissionStatus:', webPushNotificationService.permissionStatus);
  
  // Try requestPermission
  try {
    const result = await webPushNotificationService.requestPermission();
    console.log('requestPermission result:', result);
  } catch (error) {
    console.log('requestPermission error:', error.message);
  }
}

test();
