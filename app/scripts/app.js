'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['gkClientIndex.controllers','gkClientIndex.filters','gkClientIndex.directives','gkClientIndex.services','ngRoute','LocalStorageModule','ui.directives','ui.utils','ui.bootstrap','ngSanitize','gkQueueApp','tags-input','LocalStorageModule','ngAnimate'])
    .config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/file', {
                templateUrl: 'views/file_browser.html',
                controller: 'fileBrowser'
            }).
            otherwise({
                redirectTo: function(){
//                    $location.search({
//                        path:'',
//                        partition:'myfile',
//                        mountid:myMount.mountid,
//                        view:'thumb'
//                    });
                    return '/file'
                }
            });
    }]);

angular.module('gkPersonalApp', ['gkPersonalApp.controllers','gkPersonalApp.directives','gkClientIndex.services']);
angular.module('gkSiteApp', ['gkSiteApp.controllers','gkSiteApp.directives','gkClientIndex.services']);
angular.module('gkQueueApp', ['gkQueueApp.controllers','ui.bootstrap']);


