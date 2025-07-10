import admin from 'firebase-admin';

const sendNotification = (token, action, payload) => {

  const message = {
        token,
        notification: {
            title: payload.title,
            body: payload.message,
            imageUrl: payload.imageUrl || undefined,
        },
        data: payload,
        android: {
            priority: 'high',
        },
        apns: {
            headers: {
                'apns-priority': '5',
            },
        },
    };

  admin.messaging().send(message)
    .then((response) => {
      console.log('Successfully sent notification:', response);
    })
    .catch((error) => {
      console.log('Error sending notification:', error);
    });
};

export { sendNotification }
