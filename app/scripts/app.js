'use strict';

angular.module('gkClientIndex', ['gkClientIndex.controllers','gkClientIndex.filters','gkClientIndex.directives','gkClientIndex.services','ngRoute','LocalStorageModule','ui.directives','ui.utils','ui.bootstrap','ngSanitize'])
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

angular.module('gkNewsApp', ['gkNewsApp.controllers','gkNewsApp.directives','gkClientIndex.services']);
angular.module('gkPersonalApp', ['gkPersonalApp.controllers','gkPersonalApp.directives','gkClientIndex.services']);
angular.module('gkSiteApp', ['gkSiteApp.controllers','gkSiteApp.directives']);
angular.module('gkviewmemberApp', ['gkviewmemberApp.controllers','gkviewmemberApp.directives']);
angular.module('gkSharingsettingsApp', ['gkSharingsettingsApp.controllers','gkSharingsettingsApp.directives']);
angular.module('gkContactApp', ['gkContactApp.controllers','gkContactApp.directives']);

