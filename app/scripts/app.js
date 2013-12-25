'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['jmdobry.angular-cache','pasvaz.bindonce','gkClientIndex.controllers', 'gkClientIndex.filters', 'gkClientIndex.directives', 'gkClientIndex.services', 'LocalStorageModule', 'ui.directives', 'ui.utils', 'ui.bootstrap', 'ngSanitize', 'LocalStorageModule'])
    .config(['$sceDelegateProvider',function ($sceDelegateProvider) {
        var siteDomain = gkClientInterface.getSiteDomain();
        console.log(siteDomain);
        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
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








