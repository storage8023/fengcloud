/**
 * Created by admin on 13-11-4.
 */
angular.module('gkClientSetting', ['gkClientIndex.services','gkClientIndex.directives','ui.bootstrap'])
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
                icon:'icon16x16 icon_sync',
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
                icon:'icon_plane',
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


        $scope.$on('LinkStatus', function ($event,param) {
            $scope.$apply(function(){
                $rootScope.PAGE_CONFIG.networkConnected = param.link;
            });
        })
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

        $scope.setting = {
            auto:clientInfo['auto']==1?true:false,
            prompt:clientInfo['prompt']==1?true:false,
            recycle:clientInfo['recycle']==1?true:false,
            local:clientInfo['local']==1?true:false,
            https:clientInfo['https']==1?true:false,
            proxy:clientInfo['proxy']==1?true:false,
            configpath:clientInfo['configpath']
        };
        /**
         * 通用设置
         * @type {Array}
         */
        $scope.generalSetting = [
            {
                type:'checkbox',
                label:'系统启动时运行够快',
                name:'auto',
                model:$scope.setting['auto']
            },
            {
                type:'checkbox',
                label:'显示桌面通知',
                name:'prompt',
                model:$scope.setting['prompt']
            },
            {
                type:'checkbox',
                label:'别人删除与我共享的文件时，也进入我电脑的回收站',
                name:'recycle',
                model:$scope.setting['recycle']
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
                        type:Number(val.model.value)
                    };
                    gkClientInterface.setChangeLanguage(params);
                }
            }
        ];

        /**
         * 网络设置
         * @type {*}
         */
        $scope.networkSetting = [
            {
                type:'checkbox',
                label:'开启局域网内高速同步',
                name:'local',
                model:$scope.setting['local']
            },
            {
                type:'checkbox',
                label:'开启HTTPS安全连接',
                name:'https',
                model:$scope.setting['https']
            },
            {
                type:'checkbox',
                label:'开启IE代理',
                name:'proxy',
                tip:'（软件下次启动时生效）',
                model:$scope.setting['proxy']
            },
            {
                type:'button',
                label:'设置代理',
                dependon:2,
                click:function(){
                    gkClientInterface.setSettings();
                }

            }
        ];

        $scope.selectConfigPath = function(){
             var newPath =  gkClientInterface.selectPath({
                  path:$scope.setting['configpath'],
                  disable_root:0
              });
             if(newPath && newPath.length){
                 $scope.setting['configpath'] = newPath;
             }
        };

        $scope.clearCache = function(){
            if(!confirm('确定要清空缓存？')){
                return;
            }
            gkClientInterface.setClearCache();
        };

        $scope.$watch('[networkSetting,generalSetting,setting.configpath]',function(newValue,oldValue){
            if(angular.equals(newValue,oldValue)){
                return;
            }
            var allSetting = $scope.generalSetting.concat($scope.networkSetting);
            var setting = {};
            angular.forEach($scope.setting,function(v,key){
                var obj =  Util.Array.getObjectByKeyValue(allSetting,'name',key);
                if(obj){
                    if(obj['type'] == 'checkbox'){
                        setting[key] = Number(obj['model']);
                    }else{
                        setting[key] = obj['model'];
                    }
                }
            });
            setting.configpath = $scope.setting.configpath;
            gkClientInterface.setClientInfo(setting);
        },true);

    }])
    .filter('getOS',function(){
        return function(osName,osVersion){
            return osVersion?osVersion:'-';
        }
    })
    .filter('getDeviceName',function(){
        return function(device_name){
            return device_name?device_name:'-';
        }
    })
    .filter('getDeviceStateIcon',function(){
        return function(state,isCurrentDevice){
           if(isCurrentDevice){
               return 'glyphicon-device-current';
           }
            if(state==0){
                return 'glyphicon-device-disable';
            }else{
                return 'glyphicon-device-active';
            }
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
                return 'glyphicon-sync-pause';
            }else if(!number){
                return 'glyphicon-device-active';
            }else if(number > 0){
                return 'glyphicon-device-current';
            }else{
                return 'glyphicon-sync-pause';
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
    .directive('tabAccount',['$rootScope','GKMount','GKException',function($rootScope,GKMount,GKException){
        return {
            restrict: 'E',
            templateUrl:'views/tab_account.html',
            link:function($scope){
                var user = $rootScope.PAGE_CONFIG.user;
                var device = gkClientInterface.getComputerInfo()['name'];
                var myMount = GKMount.getMyMount();
                $scope.attrs = [
                    {
                        icon:'icon_envelope',
                        name:'mail',
                        text:user.member_email?'<'+user.member_email+'>':'无'
                    },
                    {
                        icon:'icon_computer',
                        name:'mail',
                        text:'当前使用设备：'+(device?device:'')
                    }
                ];

                $scope.logOut = function(){
                    gkClientInterface.logOff();
                };

                $scope.accountSetting = function(){
                    var url = gkClientInterface.getUrl({
                        url:'/my',
                        sso:1
                    });
                    gkClientInterface.openUrl(url);
                };

                $scope.uploading = false;
                $scope.setPhoto = function(){
                    var path = gkClientInterface.selectPhotoPath();
                    if(!path){
                        return;
                    }
                    $scope.uploading = true
                    gkClientInterface.setUserInfo({
                        path:path
                    },function(re){
                        $scope.$apply(function(){
                            $scope.uploading = false;
                            if(re.error==0){
                                $rootScope.PAGE_CONFIG.user = gkClientInterface.getUser();
                                alert('上传成功');
                            }else{
                                GKException.handleClientException(re);
                            }
                        })
                    });
                };

                $scope.newName = $rootScope.PAGE_CONFIG.user.member_name;
                $scope.editName = false;
                $scope.handleBlur = function(newName){
                    if(!newName){
                        alert('用户名不能为空');
                        return;
                    }
                    if(newName.length<2){
                        alert('用户名的长度必须在2到16之间');
                        return;
                    }
                    if(newName.length>16){
                        alert('用户名的长度必须在2到16之间');
                        return;
                    }
                    if(!Util.Validation.isRegName(newName)){
                        alert('用户名的只能包含中文、英文、数字、下划线');
                        return;
                    }

                    if(newName === $rootScope.PAGE_CONFIG.user.member_name){
                        $scope.editName = false;
                        return;
                    }
                    gkClientInterface.setUserInfo({
                        name:newName
                    },function(re){
                        $scope.$apply(function(){
                            $scope.editName = false;
                            if(re.error==0){
                                $rootScope.PAGE_CONFIG.user.member_name=newName;
                            }else{
                                GKException.handleClientException(re);
                            }
                        })
                    });
                }

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
            link:function($scope){
                $scope.devices = [];
                $scope.errorMsg = '';
                GKApi.devicelist().success(function(data){
                    $scope.$apply(function(){
                        if(data && data.devices){
                            $scope.devices = data.devices;
                        }
                    });

                }).error(function(request){
                        $scope.$apply(function(){
                        $scope.errorMsg = GKException.getAjaxErrorMsg(request);
                    })
                 })

                $scope.editDeviceState = function(device,state){
                    if(state == 'del'){
                        if(!confirm('你确定要删除该设备信息？')){
                            return;
                        }
                        GKApi.delDevice(device.device_id).success(function(){
                            $scope.$apply(function(){
                                Util.Array.removeByValue($scope.devices,device);
                            });

                        }).error(function(request){
                                GKException.handleAjaxException(request);
                            });
                    }else{
                        var reState = state=='active'?1:0;
                        var msg = '你确定要禁用该设备?';
                        if(reState){
                            msg = '你确定要激活该设备？';
                        }
                        if(!confirm(msg)){
                            return;
                        }
                        GKApi.toggleDevice(device.device_id,reState).success(function(){
                            $scope.$apply(function(){
                                device.state = reState;
                            });

                        }).error(function(request){
                                GKException.handleAjaxException(request);
                            });
                    }
                }

                $scope.disableNewDevice = false;
                GKApi.userInfo().success(function(data){
                    $scope.$apply(function(){
                        if(data && data.settings && data.settings['disable_new_device']){
                            $scope.disableNewDevice = data.settings['disable_new_device']==1?true:false;
                        }
                    });
                })

                $scope.toggleNewDevice = function(){
                    var state = $scope.disableNewDevice?0:1;
                    if(state){
                        if(!confirm('你确定要禁止其他新的设备的登录？')){
                            return;
                        }
                    }else{
                        if(!confirm('你确定要允许新的设备的登录？')){
                            return;
                        }
                    }

                    GKApi.disableNewDevice(state).success(function(){
                        $scope.$apply(function(){
                            $scope.disableNewDevice = !$scope.disableNewDevice;
                        })

                    }).error(function(request){
                            $scope.$apply(function(){
                                GKException.handleAjaxException(request);
                            })
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
                scope.syncedFiles = gkClientInterface.getLinkPath()['list'] || [];
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
                        webpath: file.webpath,
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