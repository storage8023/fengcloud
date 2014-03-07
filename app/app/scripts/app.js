'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['treeControl','GKCommon','jmdobry.angular-cache','pasvaz.bindonce','gkClientIndex.controllers', 'gkClientIndex.filters', 'gkClientIndex.directives', 'gkClientIndex.services', 'LocalStorageModule', 'ui.directives', 'ui.utils', 'ui.bootstrap','ngSanitize', 'LocalStorageModule','gkDragDrop'])
    .config(['$sceDelegateProvider',function ($sceDelegateProvider) {
        var siteDomain = gkClientInterface.getSiteDomain();
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'http://127.0.0.1/**',
            'http://localhost/**',
            'http://*.goukuai.cn/**',
            'https://*.goukuai.cn/**',
            'http://*.gokuai.cn/**',
            'https://*.gokuai.cn/**',
            'http://*.gokuai.com/**',
            'https://*.gokuai.com/**',
            'http://*.yunku.cn/**',
            'https://*.yunku.cn/**'
        ]);
    }])
;








