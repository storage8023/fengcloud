'use strict';
angular.module('LocalStorageModule').value('prefix', 'gkClientIndex');
angular.module('gkClientFrame',['gkClientIndex.directives','gkClientFrame.controllers','gkClientFrame.directives','gkClientIndex.services','LocalStorageModule','ngSanitize']);
