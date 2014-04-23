'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientIndex', ['gettext','angular-contextMenu','treeControl','GKCommon','pasvaz.bindonce','gkClientIndex.controllers', 'gkClientIndex.filters', 'gkClientIndex.directives', 'gkClientIndex.services', 'LocalStorageModule', 'ui.directives', 'ui.utils', 'ui.bootstrap','ngSanitize', 'LocalStorageModule','gkDragDrop'])
    .run(function (gettextCatalog) {
        gettextCatalog.debug = true;
        gettextCatalog.currentLanguage = 'en_US';
    }).config(['$sceDelegateProvider',function ($sceDelegateProvider) {
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
    }]);
;








