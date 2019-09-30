// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyBo-tvO7ivUmnP-1X6T0_AG_eCYiXntq7w',
    projectId: 'aau-help',
    messagingSenderId: '9179952640',
    appId: '1:9179952640:web:d61aa7a7e86e1db1a54ae5'
  },
  api: 'https://api.help.antonchristensen.net'
  // api: 'http://192.168.0.51:7999'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
