'use strict';

angular.module('gkClientIndex', ['gkClientIndex.controllers','gkClientIndex.filters','gkClientIndex.directives','gkClientIndex.services','ngRoute','LocalStorageModule','ui.directives','ui.utils','ui.bootstrap','ngSanitize','gkNewsApp','gkNewsApp.directives','gkNewsApp.controllers','gkSharingsettingsApp','gkSharingsettingsApp.directives'])
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
angular.module('gkSiteApp', ['gkSiteApp.controllers','gkSiteApp.directives','gkSharingsettingsApp.directives']);
//angular.module('gkviewmemberApp', ['gkviewmemberApp.controllers','gkviewmemberApp.directives','gkClientIndex.services']);
angular.module('gkSharingsettingsApp', ['gkSharingsettingsApp.controllers','gkSharingsettingsApp.directives','gkClientIndex.services','gkContactApp']);
angular.module('gkContactApp', ['gkContactApp.controllers','gkContactApp.directives','gkClientIndex.services']);

