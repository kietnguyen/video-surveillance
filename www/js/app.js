// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('videoSurveillance', ['ionic',
  'ionic.service.core', 'ionic.service.push',
  'ngCordova',
  'videoSurveillance.services', 'videoSurveillance.controllers',
  'ionic-material', 'ionMdInput'
])

// http://blog.ionic.io/handling-cors-issues-in-ionic/
// TODO: consolidate ApiEndpoint
.constant('Endpoint', {
  camera: 'http://localhost:8100/api',
  //camera: 'http://172.88.81.99:16080',
  web: 'http://localhost:8100/web'
  //web: 'http://192.168.1.2:9000'
})

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory
    // bar above the keyboard for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }

    // push notification
    var push = new Ionic.Push({
      'debug': true,
      'onNotification': function(notification) {
        console.log(notification);
        var payload = push.getPayload(notification);

        navigator.notification.alert(notification.text);
        navigator.vibrate(300);
      },
      'onRegister': function(data) {
        console.log(data.token);
      },
      'onError': function(err) {
        console.log(err);
      },
      // See "Push notification payload details":
      //    https://github.com/phonegap/phonegap-plugin-push/blob/master/docs/PAYLOAD.md
      'pluginConfig': {
        'ios': {
          'alert': true,
          'badge': true,
          'sound': true
        },
        'android': {
          'iconColor': '#343434'
        }
      }
    });

    push.register(function(token) {
      console.log(token.token);
    });
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  })

  .state('app', {
    url: '/app',
    abstract: true,
    templateUrl: 'templates/menu.html',
    controller: 'AppCtrl'
  })

  .state('app.stream', {
    url: '/stream',
    views: {
      'menuContent': {
        templateUrl: 'templates/stream.html',
        controller: 'StreamCtrl'
      }
    }
  })

  .state('app.browse', {
    url: '/browse',
    views: {
      'menuContent': {
        templateUrl: 'templates/browse.html',
        controller: 'BrowserCtrl'
      }
    }
  })

  .state('app.cameras', {
    url: '/cameras',
    views: {
      'menuContent': {
        templateUrl: 'templates/cameras.html',
        controller: 'CamerasCtrl'
      }
    }
  })

  .state('app.camera', {
    url: '/cameras/:cameraId/search',
    views: {
      'menuContent': {
        templateUrl: 'templates/camera.html',
        controller: 'CameraCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});
