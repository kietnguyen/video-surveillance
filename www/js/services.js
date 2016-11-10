angular.module('videoSurveillance.services', [])

.run(function($http) {
  // Ref: https://docs.angularjs.org/api/ng/service/$http
  // Q: http://stackoverflow.com/questions/11876777/set-http-header-for-one-request
  $http.defaults.headers.common.Authorization = 'Basic ' +
    'aW9uaWNfb3BlcmF0b3I6aW9uaWM=';
})

.service('EventSearchService', function($q, $http, Endpoint) {
  function buildQueryString(filters) {
    console.log('buildQueryString:: filters:', filters);

    var queryString = [
      Endpoint.camera,
      '/nvc-cgi/operator/adrdownload.cgi?action=FindRecording',
      '&KeepAliveTime=3600'
    ];

    if (!filters) {
      return;
    }

    if (filters.eventTypes) {
      // Type
      var eventTypes = filters.eventTypes
        .filter(function(eventType) {
          return eventType.checked;
        })
        .map(function(eventType) {
          return eventType.value;
        })
        .join();

      queryString.push('&Type=', eventTypes);


      // Date Range
      if (filters.dateRange && filters.dataRange !== 'all') {
        var eventStartTime = moment
          .unix(Date.now() / 1000 - filters.dateRange * 3600)
          .format('YYYYMMDDHHmmss');
        var eventEndTime = moment().format('YYYYMMDDHHmmss');

        queryString.push('&StartRuleTime=', eventStartTime,
          '&EndRuleTime=', eventEndTime);
      }
    }

    return queryString.join('');
  }

  function getSearchResult(filters) {
    // Example syntax:
    // /nvc-cgi/operator/adrdownload.cgi?action=FindRecording
    //      &Type=md,di,do,recurrence,schedule,vca,netloss,manual
    //      &StartRuleTime=yyyymmddhhmmss&EndRuleTime=yyyymmddhhmmss
    //      &KeepAliveTime=3600

    var queryString = buildQueryString(filters);
    //console.log(queryString);

    var deferred = $q.defer();
    $http.get(queryString).then(function(res) {
      //console.log(res);

      var searchResult = xml2json.parser(res.data);
      //console.log('searchResult', searchResult);

      deferred.resolve({
        count: searchResult.recordingresult.recordingcount,
        token: searchResult.recordingresult.searchtoken
      });
    }, function(err) {
      console.error('ERR: EventSearchService:: getSearchResult::', err);
    });

    return deferred.promise;
  }

  function getSearchRecords(searchResult, position) {
    // Example syntax:
    // /nvc-cgi/operator/adrdownload.cgi?action=GetRecordingSearchResults
    //    &MaxResult=20&Position=1&SearchToken=346164306

    //console.log(searchResult);

    var deferred = $q.defer();
    $http.get([
        Endpoint.camera,
        '/nvc-cgi/operator/adrdownload.cgi?action=GetRecordingSearchResults',
        '&MaxResult=20&Position=', position,
        '&SearchToken=', searchResult.token
      ].join(''))
      .then(function(res) {
        //console.log(res);

        var recordResults = xml2json.parser(res.data);
        //console.log('recordResults', recordResults);

        deferred.resolve({
          events: recordResults.recordingresult.recordinglist.recording
        });
      }, function(err) {
        console.error('ERR: EventSearchService:: getSearchRecords::', err);
      });

    return deferred.promise;
  }

  // TODO: lazy-loading
  function getAllSearchRecords(filters) {
    //console.log(filters);

    var deferred = $q.defer();

    getSearchResult(filters).then(function(searchResult) {
      console.log('searchResult', searchResult);

      if (searchResult.count === 0) {
        deferred.resolve({
          events: []
        });

      } else {
        var promises = [];
        for (var i = 0, numPages = Math.floor(searchResult.count / 20); i <= numPages; i++) {
          promises.push(getSearchRecords(searchResult, i * 20 + 1));
        }

        $q.all(promises).then(function(searchRecordsArr) {
          console.log('searchRecordsArr', searchRecordsArr);

          var allSearchRecords =
            searchRecordsArr.reduce(function(previousValue, currentValue) {
              if (previousValue.length === 0)
                return currentValue.events;

              return previousValue.concat(currentValue.events);
            }, []);

          if (allSearchRecords.length > 1) {
            allSearchRecords = allSearchRecords.sort(function(event1, event2) {
              return new Date(event2.ruletime) - new Date(event1.ruletime);
            });
          }

          deferred.resolve({
            events: allSearchRecords
          });
        }, function(err) {
          console.error('ERR: EventSearchService:: getAllSearchRecords::', err);
        });
      }
    });

    return deferred.promise;
  }

  return {
    getSearchResult: getSearchResult,
    getSearchRecords: getSearchRecords,
    getAllSearchRecords: getAllSearchRecords
  };
});
