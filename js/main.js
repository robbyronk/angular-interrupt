;(function (_) {
  'use strict';

  angular.module('interrupt', ['ngCookies', 'ngResource', '$strap.directives', 'easyXdm'])
    .controller('piuInterrupt', ['$cookies', '$resource', '$scope', 'false',
      function(cookies, resource, scope, interrupt){

        var cookieName = 'piuInterrupt';

        if(_.isUndefined(cookies[cookieName])){

          console.log('cookie was not set');

          interrupt.fetch(scope).then(function(result) {
            if(_.isBoolean(result)) {
              if(result){

                console.log('resource was true, showing modal');

                // modal.show() is sometimes ready after the partial has been loaded,
                // thus we need to wait for it to load
                var runShowWhenReady = function() {
                  if(_.isUndefined(scope.show))
                    setTimeout(runShowWhenReady, 1000);
                  else
                    scope.show();
                }
                runShowWhenReady();
              } else {
                console.log('resource was false, setting cookie');
                cookies[cookieName] = 'yes';
              }
            } else {
              console.log('Bad result from server. We should log this on a server somewhere.');
            }
          });
        } else {
          console.log('cookie was set, not doing anything');
        }
      }])
    .service('interrupt', ['EasyXdm',
      function(easyXdm) {
        return {
          fetch: function (scope) {
            return easyXdm.fetch(scope, '/wsapi/rest/staffwebinterruptrequired?popuptype=piu');
          }
        }
      }])
    .service('true', function() {
      return {
        fetch: function () {
          return {
            then: function(callback) {
              callback(true);
            }
          }
        }
      }
    })
    .service('false', function() {
      return {
        fetch: function () {
          return {
            then: function(callback) {
              callback(false);
            }
          }
        }
      }
    })
})(_.noConflict());