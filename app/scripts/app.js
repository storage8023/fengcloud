'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['gkClientIndex.controllers', 'gkClientIndex.filters', 'gkClientIndex.directives', 'gkClientIndex.services', 'ngRoute', 'LocalStorageModule', 'ui.directives', 'ui.utils', 'ui.bootstrap', 'ngSanitize', 'tags-input', 'LocalStorageModule', 'ngAnimate'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/file', {
                templateUrl: 'views/file_browser.html',
                controller: 'fileBrowser'
            }).
            otherwise({
                redirectTo: function () {
//                    $location.search({
//                        path:'',
//                        partition:'myfile',
//                        mountid:myMount.mountid,
//                        view:'thumb'
//                    });
                    return '/file'
                }
            });
    }])
    .config(['$sceDelegateProvider',function ($sceDelegateProvider) {
        var siteDomain = gkClientInterface.getSiteDomain();
        console.log(siteDomain);
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            siteDomain+'/**'
        ]);
    }]);






