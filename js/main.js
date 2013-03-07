;(function (_) {
  'use strict';

  angular.module('interrupt', ['ui.bootstrap.dialog', 'ngCookies'])
    .controller('interrupt', ['$scope', '$log', '$dialog', '$cookies', 'false', 'true',
      function (scope, log, dialog, cookies, sraInterrupt, piuInterrupt) {

        var sraOptions = {
          backdrop: true,
          backdropFade: true,
          dialogFade: true,
          keyboard: false,
          backdropClick: false,
          controller: 'sraUpdate',
          templateUrl: 'sra-modal.html'
        }
        var piuOptions = {
          backdrop: true,
          backdropFade: true,
          dialogFade: true,
          keyboard: false,
          backdropClick: false,
          templateUrl: 'piu-modal.html'
        }

        var sra = dialog.dialog(sraOptions);
        var piu = dialog.dialog(piuOptions);

        var cookieName = 'doNotInterrupt';
        if (_.isUndefined(cookies[cookieName])) {

          sraInterrupt.get().then(function (openSraModal) {
            if (openSraModal) {
              sra.open().then(function (result) {
                // TODO update sra with result
                // if that is successful, set cookie
                cookies[cookieName] = 'y';
              });
            }
            else {
              piuInterrupt.get().then(function (openPiuModal) {
                if(openPiuModal) {
                  piu.open();
                }
                else {
                  cookies[cookieName] = 'y';
                }
              });
            }
          });
        }

      }
    ])
    .controller('sraUpdate', ['$log', '$scope', 'dialog',
      function (log, scope, dialog) {

        scope.close = function (result) {
          dialog.close(result);
        }

      }
    ])
    .service('true', ['$q',
      function (q) {
        return {
          'get': function () {
            var deferred = q.defer();

            deferred.resolve(true);

            return deferred.promise;
          }
        }
      }
    ])
    .service('false', ['$q',
      function (q) {
        return {
          'get': function () {
            var deferred = q.defer();

            deferred.resolve(false);

            return deferred.promise;
          }
        }
      }
    ])


})(_.noConflict());
