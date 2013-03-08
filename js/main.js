;(function () {
  'use strict';

  angular.module('interrupt', ['ui.bootstrap.dialog', 'ngCookies', 'ngResource', 'easyXdm'])
    .controller('interrupt', ['$scope', '$log', '$dialog', '$cookies', 'sraInterrupt', 'piuInterrupt', 'sraUpdate',
      function (scope, log, dialog, cookies, sraInterrupt, piuInterrupt, sraUpdate) {

        var sraOptions = {
          backdrop: true,
          backdropFade: true,
          dialogFade: true,
          keyboard: false,
          backdropClick: false,
          controller: 'modal',
          templateUrl: 'sra-modal.html'
        }
        var piuOptions = {
          backdrop: true,
          backdropFade: true,
          dialogFade: true,
          keyboard: false,
          backdropClick: false,
          controller: 'modal',
          templateUrl: 'piu-modal.html'
        }

        var sra = dialog.dialog(sraOptions);
        var piu = dialog.dialog(piuOptions);

        var cookieName = 'doNotInterrupt';
        if (_.isUndefined(cookies[cookieName])) {

          sraInterrupt.get(scope).then(function (openSraModal) {
            if (openSraModal) {
              sra.open().then(function (result) {
                sraUpdate.save(scope, result).then(function(successResponse){
                  cookies[cookieName] = 'y';
                })
              });
            }
            else {
              piuInterrupt.get(scope).then(function (openPiuModal) {
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
    .controller('modal', ['$log', '$scope', 'dialog',
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
    .service('piuInterrupt', ['EasyXdm',
      function (easyXdm) {
        return {
          'get': function (scope) {
            return easyXdm.fetch(scope, '/wsapi/rest/staffwebinterruptrequired?popuptype=piu');
          }
        }
      }
    ])
    .service('sraInterrupt', ['EasyXdm',
      function (easyXdm) {
        return {
          'get': function (scope) {
            return easyXdm.fetch(scope, '/wsapi/rest/staffwebinterruptrequired?popuptype=sra');
          }
        }
      }
    ])
    .service('sraUpdate', ['EasyXdm',
      function (easyXdm) {
        return {
          'save': function (scope, result) {
            return easyXdm.fetch(scope, '/wsapi/rest/staffwebinterruptrequired/sraupdate', 'POST', result);
          }
        }
      }
    ])


})();
