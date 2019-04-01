// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/5.9.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/5.9.2/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'messagingSenderId': 'AAAA-I6kuqY:APA91bFEhJ_ssm2HwrwKvH78Brwvol9IPLySd2kwaEb-_iJ2SSf5H5slX9JSrNp8-HRRW76aZZevlyV72M6_aqw_-C1r5bBNes3XO5JMXYYgNLLchpnisilnRzi2aNz3VPc8maYI3bpM'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
