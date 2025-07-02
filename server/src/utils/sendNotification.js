import admin from 'firebase-admin';

const sendNotification = (token, action, payload) => {

  const message = {
        token,
        notification: {
            title: userName,
            body: textMessage,
        },
        data: {
            userId,
            userName,
            textMessage,
            profilePic
        },
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
