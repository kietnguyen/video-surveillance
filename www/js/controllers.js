angular.module('videoSurveillance.controllers', [])

.run(function($http) {
  $http.defaults.headers.common.Authorization = 'Basic ' +
    'aW9uaWNfb3BlcmF0b3I6aW9uaWM=';
})

.controller('AppCtrl', function($rootScope, $scope) {

  // With the new view caching in Ionic, Controllers are only called
  // when they are recreated or on app start, instead of every page change.
  // To listen for when this page is active (for example, to refresh data),
  // listen for the $ionicView.enter event:
  //$scope.$on('$ionicView.enter', function(e) {
  //});

  $scope.cameras = [{
    'id': '1',
    'name': 'IPN6702HD-6211',
    'location': 'Front Entrance',
    'ip': '172.88.81.99',
    'rtsp_port': '16554',
    'auth': 'Basic aW9uaWNfb3BlcmF0b3I6aW9uaWM='
  }];
})

.controller('LoginCtrl', function($rootScope, $scope, $state, $http,
  ionicMaterialInk, ionicMaterialMotion, Endpoint) {

  $scope.inputError = false;

  if ($rootScope.authenticated) {
    $state.go("app.cameras");
  }

  $scope.login = function(email, password) {
    $http.post(
      Endpoint.web + '/auth/local', {
        email: email,
        password: password
      }
    ).then(function(res) {
      console.log('LoginCtrl:: login: SUCCESS:', res);

      $rootScope.authenticated = true;
      $rootScope.user = res.data.name;
      $state.go("app.cameras");
    }, function(err) {
      console.log('LoginCtrl:: login: ERROR:', err);
      $scope.inputError = true;
    });
  };

  $scope.register = function(email, password) {
    console.log('LoginCtrl:: register:', email, password);

    // TODO: Richer error messages
    // See: https://scotch.io/tutorials/angularjs-form-validation-with-ngmessages
    if (!email || !password) {
      $scope.inputError = true;
      return;
    }

    $http.post(
      Endpoint.web + '/api/users', {
        name: email.split('@')[0],
        email: email,
        password: password
      }
    ).then(function(res) {
      console.log('LoginCtrl:: register: SUCCESS:', res);

      $scope.login(email, password);
    }, function(err) {
      console.log('LoginCtrl:: register: ERROR:', err);
      // https://scotch.io/tutorials/angularjs-form-validation-with-ngmessages
    });
  };

  // TODO: Google+ authentication
  $scope.googlePlusAuth = function() {};

  // TODO: Facebook authentication
  $scope.facebookAuth = function() {};

  // TODO: Twitter authentication
  $scope.twitterAuth = function() {};

  ionicMaterialInk.displayEffect();
  ionicMaterialMotion.ripple();
})

.controller('BrowserCtrl', function($scope) {

})

.controller('CamerasCtrl', function($scope, $state, $http,
  ionicMaterialInk, ionicMaterialMotion, Endpoint) {

  $scope.cameras.forEach(function(camera) {
    // get snapshot
    $http.get(Endpoint.camera + '/nvc-cgi/viewer/snapshot.fcgi', {
        responseType: 'blob'
      })
      .then(function(res) {
        //console.log(res);

        // Q: http://stackoverflow.com/questions/16775729/angular-js-request-in-order-to-get-an-image
        // Ref: https://developer.mozilla.org/en-US/docs/Web/API/FileReader
        camera.status = true;

        fileReader = new FileReader();
        fileReader.onload = function() {
          camera.snapshot = fileReader.result;
        };
        fileReader.readAsDataURL(res.data);
      }, function(err) {
        console.error('ERR: getSnapshot::', err);
        camera.status = false;
      });
  });

  // view live stream
  $scope.viewStream = function(camera) {
    window.open(
      ['rtsp://', camera.ip, ':', camera.rtsp_port, '/ufirststream'].join(''),
      '_system'
    );
  };

  // view history
  $scope.viewHistory = function(camera) {
    window.location.href = '#/app/cameras/' + camera.id + '/search';
  };

  $scope.recordStream = function() {
    console.log('CamerasCtrl:: recordStream:');

    $state.go('app.stream');
  };

  ionicMaterialInk.displayEffect();
  ionicMaterialMotion.ripple();
})

.controller('CameraCtrl', function($scope, $stateParams, $http,
  $ionicModal, EventSearchService, Endpoint) {

  var camera;
  // retrieve camera object
  for (var i = 0, len = $scope.cameras.length; i < len; i++) {
    if ($scope.cameras[i].id === $stateParams.cameraId) {
      camera = $scope.camera = $scope.cameras[i];
      break;
    }
  }

  $scope.dateRangeList = [{
    text: '1 Hour',
    value: 1
  }, {
    text: '4 Hours',
    value: 4
  }, {
    text: '24 Hours',
    value: 24
  }, {
    text: '7 Days',
    value: 168
  }, {
    text: '15 Days',
    value: 360
  }, {
    text: 'All',
    value: 'all'
  }];

  $scope.filters = {
    dateRange: 'all',
    eventTypes: [{
        text: 'Motion',
        value: 'md',
        checked: true
      },
      //{text: 'Sensor', value: 'di', checked: true},
      //{text: 'Active Alarm', value: 'do', checked: true},
      {
        text: 'VCA',
        value: 'vca',
        checked: true
      }, {
        text: 'Network Loss',
        value: 'netloss',
        checked: true
      }
    ]
  };

  // get events
  EventSearchService.getAllSearchRecords($scope.filters)
    .then(function(searchRecords) {
      //console.log('searchRecords', searchRecords);
      $scope.events = searchRecords.events;
    });

  // view event stream
  $scope.viewEvent = function(recordId) {
    window.open(
      ['rtsp://', camera.ip, ':', camera.rtsp_port,
        '/recordingid=', recordId
      ].join(''),
      '_system');
  };

  $scope.toggleDetail = function(event) {
    if ($scope.isEventDetailShown(event)) {
      $scope.shownDetail = null;
    } else {
      $scope.shownDetail = event;
    }
  };
  $scope.isEventDetailShown = function(event) {
    return $scope.shownDetail === event;
  };

  // setup modal
  $ionicModal.fromTemplateUrl('templates/search-filter.html', {
    scope: $scope,
    animation: 'slide-in-down'
  }).then(function(modal) {
    $scope.modal = modal;
  });

  $scope.openFilterModal = function() {
    $scope.modal.show();
  };

  $scope.closeFilterModal = function() {
    $scope.modal.hide();
  };

  $scope.searchByFilter = function() {
    $scope.modal.hide();

    // get events
    EventSearchService.getAllSearchRecords($scope.filters)
      .then(function(searchRecords) {
        console.log('searchRecords', searchRecords);

        $scope.events = searchRecords.events;
      });
  };

  //Cleanup the modal when we're done with it!
  $scope.$on('$destroy', function() {
    $scope.modal.remove();
  });

  // Execute action on hide modal
  $scope.$on('modal.hidden', function() {});

  // Execute action on remove modal
  $scope.$on('modal.removed', function() {});
});
