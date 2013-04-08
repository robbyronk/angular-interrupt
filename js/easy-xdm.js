'use strict';

(function () {
  angular.module('easyXdm', [])
    .service('EasyXdm', ['$q', '$cacheFactory', '$log',
      function ($q, $cacheFactory, $log) {

      var schemeHostAndPort;
      //   var schemeHostAndPort = 'http://hart-a321.net.ccci.org:8680';
      //   var schemeHostAndPort = 'https://wsapi-stage.cru.org';
      //  var schemeHostAndPort = 'https://wsapi.cru.org';

      if(window.location.href.toString().indexOf('https://staffweb.cru.org') > -1){
          schemeHostAndPort = 'https://wsapi.cru.org';
          $log.log("prod WSAPI");
      }
      else  if(window.location.href.toString().indexOf('ucm-dev.ccci.org') > -1){
          schemeHostAndPort='https://wsapi-stage.cru.org';
          $log.log("stage WSAPI");
      }
      else if(window.location.href.toString().indexOf('http://localhost') > -1){
          schemeHostAndPort='http://localhost:8680';
          $log.log("local WSAPI");
      }
      else{
          schemeHostAndPort='http://hart-a321.net.ccci.org:8680';
          $log.log("test WSAPI");
      }


      var xhr;

      reloadXhr();

      /**
       * as a side effect, this re-requests (if necessary) a new ticket from CAS, since the iframe url
       * is protected by the cas filter.
       */
      function reloadXhr() {
        var corsUrl = schemeHostAndPort + '/wsapi/easyXDM/cors/';
        xhr = new easyXDM.Rpc({
          remote: corsUrl
        }, {
          remote: {
            request: {} // request is exposed by /cors/
          }
        });
      }

      var cache = $cacheFactory('EasyXdm-Cache');

      return {
        fetch: function (scope, pathAndQueryString, method, postData) {
          if(_.isUndefined(method))
            method = 'GET';

          var deferred = $q.defer();

          var url = schemeHostAndPort + pathAndQueryString;

          function handleSuccessfulResponse(response) {
            var data = response.data;
            var contentType = response.headers["Content-Type"];
            var resolution;
            if (contentType == 'plain/text')
              resolution = data;
            else {
              resolution = angular.fromJson(data);
            }
            deferred.resolve(resolution);
            cache.put(pathAndQueryString, resolution);
          }

          function handleFailedRequest(response) {
            $log.error("request to " + url + " failed.");
            var message;
            if (response) {
              $log.error(response);
              message = "Request failed; response code is " + response.status + " when calling " + url;
            }
            else {
              message = "Request failed; no response given";
            }
            var error = {
              message: message,
              response: response,
              url: url
            };

            deferred.reject(error);
          }

          function sendRequestToUrl(retryOnUnauthorized) {
            xhr.request({
              url: url,
              method: method
            }, function (response) {
              scope.$apply(function () {
                if (response.status == 200) {
                  handleSuccessfulResponse(response);
                }
                else {
                  //TODO: what to do here?
                  handleFailedRequest(response);
                }
              });
            }, function (errorPayload) {
              scope.$apply(function () {
                var response = errorPayload.data;
                if (retryOnUnauthorized && response != undefined && response.status == 401) {
                  handleNotAuthorizedResponse();
                }
                else {
                  handleFailedRequest(response);
                }
              });
            });
          }

          function handleNotAuthorizedResponse() {
            reloadXhr();

            var loggedInToCas = xhr.request({
              url: "/wsapi/rest/authentication/loggedInToCas",
              method: "GET"
            }, function (response) {
              if (response.data === "true") {
                sendRequestToUrl(false);
              }
              else {
//                alert("It appears you are not logged in to Relay.  Attempting to reload the page...");
                deferred.reject("User is not logged in");
//                window.top.location.reload();
              }
            }, function (errorPayload) {
              var message = errorPayload.message;
              var response = errorPayload.data;
              $log.error("unable to check if logged in to cas: " + message);
              $log.error(response);
              deferred.reject("Unable to check if logged in to cas; response code " + response.status);
            });
          }

          function sendPostRequestToUrl(retryOnUnauthorized, postData) {
            xhr.request({
              url: url,
              method: 'POST',
              data: postData
            }, function (response) {
              scope.$apply(function () {
                if (response.status == 200) {
                  handleSuccessfulResponse(response);
                }
                else {
                  //TODO: what to do here?
                  handleFailedRequest(response);
                }
              });
            }, function (errorPayload) {
              scope.$apply(function () {
                var response = errorPayload.data;
                if (retryOnUnauthorized && response != undefined && response.status == 401) {
                  handleNotAuthorizedResponse();
                }
                else {
                  handleFailedRequest(response);
                }
              });
            });
          }

          if (cache.get(pathAndQueryString) == undefined) {
            if (method === 'GET')
              sendRequestToUrl(true);
            else
              sendPostRequestToUrl(true, postData);
          }
          else {
            var resolution = cache.get(pathAndQueryString);
            deferred.resolve(resolution);
          }

          return deferred.promise;
        }
      };
    }]);
})();