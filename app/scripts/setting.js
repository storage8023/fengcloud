/**
 * Created by admin on 13-11-4.
 */
angular.module('gkClientSetting', ['gkClientIndex.services','ui.bootstrap'])
    .controller('settingCtrl',['$scope','$location','$rootScope','GKApi',function($scope,$location,$rootScope,GKApi){
        $rootScope.PAGE_CONFIG = {
            user : gkClientInterface.getUser()
        };
        $scope.tabs = [
            {
                name:'general',
                title:'通用',
                icon:'icon_info',
                directive:'tabGeneral'
            },
            {
                name:'account',
                title:'账号',
                icon:'icon_person',
                directive:'tabAccount'
            },
            {
                name:'device',
                title:'设备',
                icon:'icon_computer',
                directive:'tabComputer'
            },
            {
                name:'sync',
                title:'同步',
                icon:'icon_sync',
                directive:'tabSync'
            },
            {
                name:'network',
                title:'网络',
                icon:'icon_network',
                directive:'tabNetwork'
            },
            {
                name:'advance',
                title:'高级',
                icon:'icon_airplane',
                directive:'tabAdvance'
            }
        ];

        $scope.selectedTab = $scope.tabs[0];
        var search = $location.search();
        if(search.tab){
            $scope.selectedTab = Util.Array.getObjectByKeyValue($scope.tabs,'name',search.tab) || $scope.tabs[0];
        }

        $scope.selectTab = function(tab){
            $scope.selectedTab = tab;
        };

        $scope.ok = function(){
            $rootScope.$broadcast('okSetting');
        };

        $scope.cancel = function(){
            $rootScope.$broadcast('cancelSetting');
        };

    }])
    .controller('tabContentCtrl',['$scope',function($scope){
        var clientInfo = gkClientInterface.getClientInfo();
        $scope.clientInfo = clientInfo;
        var langOptions = [
            {
                value:'0',
                name:'默认'
            },
            {
                value:'1',
                name:'简体中文'
            },
            {
                value:'2',
                name:'English'
            }
        ];
        var language = gkClientInterface.getLanguage()['type'];
        var selectedLang = Util.Array.getObjectByKeyValue(langOptions,'value',language);
        /**
         * 通用设置
         * @type {Array}
         */
        $scope.generalSetting = [
            {
                type:'checkbox',
                label:'系统启动时运行够快',
                name:'auto',
                model:clientInfo['auto']==1?true:false
            },
            {
                type:'checkbox',
                label:'显示桌面通知',
                name:'prompt',
                model:clientInfo['prompt']==1?true:false
            },
            {
                type:'checkbox',
                label:'别人删除与我共享的文件时，也进入我电脑的回收站',
                name:'recycle',
                model:clientInfo['recycle']==1?true:false
            },
            {
                type:'select',
                label:'语言切换：',
                name:'language',
                options:langOptions,
                tip:'（软件下次启动时生效）',
                model:selectedLang,
                change:function(val,e){
                    var val = Util.Array.getObjectByKeyValue( $scope.generalSetting,'name','language');
                    var params = {
                        type:val.model.value
                    };
                    gkClientInterface.setChangeLanguage(params);
                }
            }
        ];

        $scope.networkSetting = [
            {
                type:'checkbox',
                label:'开启局域网内高速同步',
                name:'auto',
                model:clientInfo['local']==1?true:false
            },
            {
                type:'checkbox',
                label:'开启HTTPS安全连接',
                name:'prompt',
                model:clientInfo['https']==1?true:false
            },
            {
                type:'checkbox',
                label:'开启IE代理',
                name:'recycle',
                tip:'（软件下次启动时生效）',
                model:clientInfo['proxy']==1?true:false
            },
            ,
            {
                type:'button',
                label:'设置代理',
                click:function(){
                    gkClientInterface.setSettings();
                }

            }
        ];

        /**
         * 网络设置
         * @type {*}
         */
        $scope.configPath = clientInfo['configpath'];
        $scope.selectConfigPath = function(){
             var newPath =  gkClientInterface.selectPath({
                  path:$scope.configPath,
                  disable_root:0
              });
             if(newPath && newPath.length){
                 $scope.configPath = newPath;
             }
        };
        $scope.clearCache = function(){
            if(!confirm('确定要清空缓存？')){
                return;
            }
            gkClientInterface.setClearCache();
        };


        $scope.$on('okSetting',function(){
            var param = {
                "auto":0,
                "prompt":1,
                "local":1,
                "recycle":0,
                "configpath":$scope.configPath,
                "https":0,
                "proxy":0
            };
            var allSetting = $scope.generalSetting.concat($scope.networkSetting);
            angular.forEach(param,function(v,key){
                var obj =  Util.Array.getObjectByKeyValue(allSetting,'name',key);
                if(obj){
                    if(obj['type'] == 'checkbox'){
                        param[key] = Number(obj['model']);
                    }else{
                        param[key] = obj['model'];
                    }
                }
            });
            gkClientInterface.setClientInfo(param);
            gkClientInterface.closeWindow();
        })

        $scope.$on('cancelSetting',function(){
            gkClientInterface.closeWindow();
        })
    }])
    .filter('getOS',function(){
        return function(osName,osVersion){
            return osVersion?osVersion:'-';
        }
    })
    .filter('getDeviceName',function(){
        return function(os_name){
            return os_name?os_name:'网页版';
        }
    })
    .filter('getSyncFileName',['GKMount',function(GKMount){
        return function(webPath,mountId){
            if(webPath){
                return Util.String.baseName(webPath);
            }else{
                return GKMount.getMountById(mountId)['name'];
            }
        }
    }])
    .filter('getSyncIcon',[function(){
        return function(number,isAllSyncPaused){
            number = parseInt(number);
            if(isAllSyncPaused){
                return 'icon_pause';
            }else if(!number){
                return 'icon_sync_done';
            }else if(number > 0){
                return 'icon_syncing';
            }else{
                return 'icon_pause';
            }
        }
    }])
    .filter('getSyncState',[function(){
        return function(number,isAllSyncPaused){
            number = parseInt(number);
            if(isAllSyncPaused){
                return '暂停同步';
            }else if(!number){
                return '同步完成';
            }else{
                return number+'项正在同步';
            }
        }
    }])
/**
 * 设置-一般
 */
    .directive('tabGeneral',[function(){
        return {
            restrict: 'E',
            templateUrl:'views/tab_general_network.html',
            scope:{
                settings:'=',
                selectedTab:'='
            },
            link:function(scope){
            }
        }
    }])
/**
 * 设置-账号
 */
    .directive('tabAccount',[function(){
        return {
            restrict: 'E',
            templateUrl:'views/tab_account.html',
            link:function(){

            }
        }
    }])
/**
 * 设置-设备
 */
    .directive('tabDevice',['GKApi','GKException','$rootScope',function(GKApi,GKException,$rootScope){
        return {
            restrict: 'E',
            templateUrl:'views/tab_device.html',
            link:function(scope){
                scope.devices = [];
                GKApi.devicelist().success(function(data){
                    if(data && data.devices){
                        scope.devices = data.devices;
                    }
                })

                scope.editDeviceState = function(device,state){
                    if(state == 'del'){
                        if(!confirm('你确定要删除该设备信息？')){
                            return;
                        }
                        GKApi.delDevice(device.device_id).success(function(){
                            Util.Array.removeByValue(scope.devices,device);
                        }).error(function(request){
                                GKException.handleAjaxException(request);
                            });
                    }else{
                        var reState = state=='active'?1:0;
                        var msg = '你确定要禁用该设备?';
                        if(reState){
                            msg = '你确定要启用改设备？';
                        }
                        if(!confirm(msg)){
                            return;
                        }
                        console.log(device);
                        GKApi.toggleDevice(device.device_id,reState).success(function(){
                            device.state = reState;
                        }).error(function(request){
                                GKException.handleAjaxException(request);
                            });
                    }
                }

                scope.disableNewDevice = false;
                GKApi.userInfo().success(function(data){
                    if(data && data.settings){
                        scope.disableNewDevice = data.settings['disable_new_device']==1?true:false;
                    }

                })

                scope.toggleNewDevice = function(){
                    var state = scope.disableNewDevice?1:0;
                    if(state){
                        if(!confirm('你确定要禁止其他新的设备的登录？')){
                            scope.disableNewDevice = !scope.disableNewDevice;
                            return;
                        }
                    }else{
                        if(!confirm('你确定要允许新的设备的登录？')){
                            scope.disableNewDevice = !scope.disableNewDevice;
                            return;
                        }
                    }

                    GKApi.disableNewDevice(state).success(function(){

                    }).error(function(request){
                            scope.disableNewDevice = !scope.disableNewDevice;
                            GKException.handleAjaxException(request);
                        });
                }
            }
        }
    }])
/**
 * 设置-同步
 */
    .directive('tabSync',['GK',function(GK){
        return {
            restrict: 'E',
            templateUrl:'views/tab_sync.html',
            link:function(scope){
                scope.syncedFiles = gkClientInterface.getGetlinkPaths()['list'] || [];
                scope.syncedFiles = [
                    {"webpath":"工具 - 副本 - 副本","fullpath":'C:\\\\工具 - 副本 - 副本','mountid':10,'share':1,'local':0},
                    {"webpath":"工具 - 副本 - 副本xx","fullpath":'C:\\\\工具 - 副本 - 副本','mountid':10,'share':1,'local':0}
                ];
                scope.isAllSyncPaused = scope.clientInfo['startsync']==1?false:true;
                scope.toggleAllSync = function(){
                    if(scope.isAllSyncPaused){
                        gkClientInterface.startSync();
                    }else{
                        if(!confirm('确定要暂定所有同步？')){
                            return;
                        }
                        gkClientInterface.stopSync();
                    }
                    scope.isAllSyncPaused = !scope.isAllSyncPaused;
                }

                scope.cancelSync = function(file){
                    if(!confirm('你确定要取消“'+file.webpath+'“与'+'”'+file.fullpath+'“的同步？')){
                        return;
                    }
                    var params = {
                        webpath: file.fullpath,
                        mountid: file.mountid
                    };

                    GK.removeLinkPath(params).then(function(){
                        Util.Array.removeByValue(scope.syncedFiles,file);
                    },function(){

                    })
                }
            }
        }
    }])
/**
 * 设置-网络
 */
    .directive('tabNetwork',[function(){
        return {
            restrict: 'E',
            scope:{
                settings:'=',
                selectedTab:'='
            },
            templateUrl:'views/tab_general_network.html'
        }
    }])
/**
 * 设置-高级
 */
    .directive('tabAdvance',[function(){
        return {
            restrict: 'E',
            templateUrl: 'views/tab_advance.html'
        }
    }])
;