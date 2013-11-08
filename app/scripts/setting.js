/**
 * Created by admin on 13-11-4.
 */
angular.module('gkClientSetting', ['gkClientIndex.services','ui.bootstrap'])
    .controller('settingCtrl',['$scope','$location','$rootScope',function($scope,$location,$rootScope){
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

    }])
    .filter('getOS',function(){
        return function(osName,osVersion){
            return osName?osName+' '+osVersion:'-';
        }
    })
    .filter('getDeviceName',function(){
        return function(deviceName){
            return deviceName?deviceName:'-';
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
        return function(number){
            number = parseInt(number);
            if(!number){
                return 'icon_sync_done';
            }else if(number > 0){
                return 'icon_syncing';
            }else{
                return 'icon_pause';
            }
        }
    }])
    .filter('getSyncState',[function(){
        return function(number){
            number = parseInt(number);
            if(!number){
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
            link:function(scope){
                scope.settings = [
                    {
                        type:'checkbox',
                        label:'系统启动时运行够快',
                        name:'auto'
                    },
                    {
                        type:'checkbox',
                        label:'显示桌面通知',
                        name:'prompt'
                    },
                    {
                        type:'checkbox',
                        label:'别人删除与我共享的文件时，也进入我电脑的回收站',
                        name:'recycle'
                    },
                    ,
                    {
                        type:'select',
                        label:'语言切换：',
                        name:'language',
                        options:[
                            {
                                value:'0',
                                name:'简体中文'
                            },
                            {
                                value:'1',
                                name:'English'
                            }
                        ]
                    }
                ];
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
    .directive('tabDevice',['GKApi',function(GKApi){
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
            }
        }
    }])
/**
 * 设置-同步
 */
    .directive('tabSync',[function(){
        return {
            restrict: 'E',
            templateUrl:'views/tab_sync.html',
            link:function(scope){
                scope.syncedFiles = gkClientInterface.getGetlinkPaths()['list'] || [];
                scope.syncedFiles = [
                    {"webpath":"工具 - 副本 - 副本","fullpath":'C:\\\\工具 - 副本 - 副本','mountid':10,'share':1,'local':0},
                    {"webpath":"工具 - 副本 - 副本xx","fullpath":'C:\\\\工具 - 副本 - 副本','mountid':10,'share':1,'local':0}
                ];
            }
        }
    }])
/**
 * 设置-网络
 */
    .directive('tabNetwork',[function(){
        return {
            restrict: 'E',
            templateUrl:'views/tab_general_network.html',
            link:function(scope){
                scope.settings = [
                    {
                        type:'checkbox',
                        label:'开启局域网内高速同步',
                        name:'auto'
                    },
                    {
                        type:'checkbox',
                        label:'开启HTTPS安全连接',
                        name:'prompt'
                    },
                    {
                        type:'checkbox',
                        label:'开启IE代理',
                        name:'recycle'
                    },
                    ,
                    {
                        type:'button',
                        label:'设置代理',
                        click:function(){

                        }

                    }
                ];
            }
        }
    }])
/**
 * 设置-高级
 */
    .directive('tabAdvance',[function(){
        return {
            restrict: 'E',
            templateUrl: 'views/tab_advance.html',
            link:function(){

            }
        }
    }])
;