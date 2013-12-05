'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['gkClientIndex.controllers', 'gkClientIndex.filters', 'gkClientIndex.directives', 'gkClientIndex.services', 'ngRoute', 'LocalStorageModule', 'ui.directives', 'ui.utils', 'ui.bootstrap', 'ngSanitize', 'tags-input', 'LocalStorageModule'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/file', {
                templateUrl: 'views/file_browser.html',
                controller: 'fileBrowser'
            }).
            otherwise({
                redirectTo: function () {
                    return '/file'
                }
            });
    }])
    .config(['$sceDelegateProvider',function ($sceDelegateProvider) {
        var siteDomain = gkClientInterface.getSiteDomain();
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            siteDomain+'/**'
        ]);
    }])
;






