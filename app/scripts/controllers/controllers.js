'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('initClient', ['$rootScope', 'GKNews', '$scope', 'GKMount', '$location', 'GKFile', 'GKPartition', 'GKModal', 'GKApi' ,function ($rootScope, GKNews, $scope, GKMount, $location, GKFile, GKPartition, GKModal, GKApi) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: {},
            mount: {},
            filter: '',
            networkConnected: 1
        };
        /**
         * 页面载入时请求消息
         */
        GKNews.requestNews();

        /**
         * 监听消息的通知
         */
        $scope.$on('UpdateMessage', function (e, data) {
            GKNews.appendNews(data);
        })

        /**
         * 监听打开消息的通知
         */
        $scope.$on('ShowMessage', function (e, data) {
            if (!$rootScope.showNews) {
                GKModal.news(GKNews, GKApi);
            }
        })

        /**
         * 监听打开消息的通知
         */
        $scope.$on('ShowFind', function (e, data) {
            if (!$rootScope.showFind) {
                GKModal.nearBy();
            }
        })

        $scope.$on('teamSecurity',function($event,orgId){
            if(!orgId){
               return;
            }
            GKModal.teamManage(orgId);
        })

        $scope.$on('expandSpace',function($event,orgId){
            if(!orgId){
                return;
            }
            var url = gkClientInterface.getUrl({
                sso: 1,
                url: '/pay/order?org_id='+orgId
            });
            gkClientInterface.openUrl(url);
        })

        $scope.$on('addMember',function($event,orgId){
            if(!orgId){
                return;
            }
            GKModal.teamMember(orgId);

        })

        $scope.$on('viewSubscriber',function($event,orgId){
            if(!orgId){
                return;
            }
            GKModal.teamSubscribe(orgId);

        })

        $scope.$on('qr',function($event,orgId){
            if(!orgId){
                return;
            }
            GKModal.teamQr(orgId);
        })

        $scope.$on('UserInfo',function(event,param){
            $scope.$apply(function(){
                $rootScope.PAGE_CONFIG.user = param;
            });
        })

        /**
         * 监听路径的改变
         */
        $scope.$on('$locationChangeSuccess', function ($s, $current) {
            var param = $location.search();
            var extend = {
                filter: param.filter || '',
                partition: param.partition,
                view: param.view
            };
            if ([GKPartition.myFile, GKPartition.teamFile, GKPartition.subscribeFile].indexOf(param.partition) >= 0) {
                extend.file = GKFile.getFileInfo(param.mountid, param.path);
                extend.mount = GKMount.getMountById(param.mountid)
            } else {
                extend.file = {};
                extend.mount = {};
            }
            angular.extend($rootScope.PAGE_CONFIG, extend);
        })

        $scope.$on('LinkStatus', function ($event, param) {
            $scope.$apply(function () {
                $rootScope.PAGE_CONFIG.networkConnected = param.link;
            });
        })

    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', 'GKSmartFolder', 'GKMount', 'GKFilter', 'GKPartition', 'GKModal', 'GK', 'GKFileList', 'GKFileOpt','GKSideTree','GKApi','$q',function ($scope, $location, GKPath, GKFile, $rootScope, GKSmartFolder, GKMount, GKFilter, GKPartition, GKModal, GK, GKFileList, GKFileOpt,GKSideTree,GKApi,$q) {
        $scope.GKPartition = GKPartition;
        var orgMount = GKMount.getOrgMounts(),//云库的空间
            subscribeMount = GKMount.getSubscribeMounts(); //订阅的云库

        /**
         * 云库的文件
         */

        $scope.orgTreeList = GKFile.dealTreeData(orgMount, GKPartition.teamFile);

        /**
         * 订阅的文件
         * @type {*}
         */
        $scope.orgSubscribeList = GKFile.dealTreeData(subscribeMount, GKPartition.subscribeFile);

        /**
         * 初始选中
         * @type {*}
         */
        $scope.selectedBranch = null;
        $scope.initSelectedBranch = $scope.orgTreeList[0];
        var unSelectAllBranch = function () {
            if ($scope.selectedBranch) {
                $scope.selectedBranch.selected = false;
                $scope.selectedBranch = null;
            }
        };

        var selectBreanch = function (branch, partition, isListFile) {
            if (!angular.equals($scope.selectedBranch, branch)) {
                branch.selected = true;
                $scope.selectedBranch = branch;
                if (isListFile) {
                    $scope.handleSelect(branch, partition);
                }
            }
        };

        /**
         * 智能文件夹
         * @type {*}
         */
        var smartFolders = GKSmartFolder.getFolders();
        $scope.smartTreeList = GKFile.dealTreeData(smartFolders, GKPartition.smartFolder);

        $scope.$on('RemoveMagicObject', function ($event, param) {
            $scope.$apply(function(){
                var code = param.condition;
                GKSmartFolder.removeSmartFolderByCode(code);
                GKSideTree.removeSmartNode($scope.smartTreeList,code);
            })
        })

        $scope.$on('AddMagicObject', function ($event, param) {
           $scope.$apply(function(){
               var name = param.name,
                   code = param.condition;
               var node = GKSmartFolder.addSmartFolder(name, code);
               GKSideTree.addSmartNode($scope.smartTreeList,node);
           })
        })

        $scope.$on('editSmartFolder', function ($event, name, code) {
            GKSmartFolder.editSmartFolder(name, code);
            GKSideTree.editSmartNode($scope.smartTreeList,code,name);
        })

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleSelect = function (branch, partition) {
            var pararm = {
                view: 'list',
                partition: partition
            };
            if (partition == GKPartition.myFile || partition == GKPartition.teamFile || partition == GKPartition.subscribeFile) {
                pararm['path'] = branch.data.fullpath;
                pararm['mountid'] = branch.data.mount_id;
                pararm['filter'] = branch.data.filter || '';
            } else if (partition == GKPartition.smartFolder) {
                pararm['filter'] = branch.data.filter;
            } else {
                return;
            }
            $location.search(pararm);

        };

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if(branch.expanded){
                GKFile.getChildNode(branch).then(function(children){
                    branch.children = children;
                });
            }else{

            }
        };


        $scope.handleAdd = function (partition) {
           if (partition == GKPartition.teamFile) {
                var createTeamDialog = GKModal.createTeam();
            } else if (partition == GKPartition.subscribeFile) {
                var nearbyDialog = GKModal.nearBy();
                nearbyDialog.result.then(function (orgId) {
                    gkClientInterface.notice({type: 'getOrg', 'org_id': Number(orgId)}, function (param) {
                        if (param) {
                            $scope.$apply(function () {
                                var newOrg = param;
                                if (!GKMount.checkMountExsit(newOrg['mountid'])) {
                                    newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], GKPartition.subscribeFile)[0];
                                    if (newOrg) {
                                        $scope.orgSubscribeList.push(newOrg);
                                        unSelectAllBranch();
                                        selectBreanch(newOrg, GKPartition.subscribeFile, true);
                                        nearbyDialog.dismiss('cancel');
                                    }
                                }
                            });
                        }

                    })
                })
            }
        };

        $scope.handleDrop = function (branch) {
            var selectedFile = GKFileList.getSelectedFile();
            var file = branch.data;
            var toFullpath = file.fullpath,
                toMountId = file.mount_id,
                fromFullpathes = [],
                fromMountId = $rootScope.PAGE_CONFIG.mount.mount_id;
            angular.forEach(selectedFile, function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });
            var actName = '移动';
            if (file.mount_id != $rootScope.PAGE_CONFIG.mount.mount_id) {
                actName = '复制';
            }
            var toName = '';
            if (toFullpath) {
                toName = Util.String.baseName(toFullpath);
            } else {
                toName = GKMount.getMountById(toMountId)['name'];
            }
            var msg = '你确定要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? '等' + fromFullpathes.length + '文件或文件夹' : '') + ' ' + actName + '到 ' + toName + ' 吗？';
            if (!confirm(msg)) {
                return;
            }
            if (file.mount_id == $rootScope.PAGE_CONFIG.mount.mount_id) {
                GKFileOpt.move(toFullpath, toMountId, fromFullpathes, fromMountId);
            } else {
                GKFileOpt.copy(toFullpath, toMountId, fromFullpathes, fromMountId);
            }
        };

        /**
         * 取消订阅
         */
        $scope.$on('unSubscribeTeam', function ($event, orgId) {
            GKMount.removeOrgSubscribeList($scope,orgId);
            selectBreanch($scope.orgTreeList[0], GKPartition.myFile, true);
        })

        $scope.$on('$routeChangeSuccess', function ($event, $current, $prev) {
            var param = $current.params;
            var branch;
           if (param.partition == GKPartition.teamFile) {
                angular.forEach($scope.orgTreeList, function (value) {
                    if (value.data.mount_id == param.mountid) {
                        branch = value;
                        return false;
                    }
                })
            } else if (param.partition == GKPartition.subscribeFile) {
                angular.forEach($scope.orgSubscribeList, function (value) {
                    if (value.data.mount_id == param.mountid) {
                        branch = value;
                        return false;
                    }
                })
            }
            /**
             * 如果当前的路径分区与选择的节点分区不同，则需要手动unselect已选择的节点
             */
            if (branch && $scope.selectedBranch && branch.data.partition != $scope.selectedBranch.data.partition) {
                unSelectAllBranch();
                selectBreanch(branch, param.partition);
            }
        })

        /**
         * 监控增加云库的回调
         */
        $scope.$on('AddOrgObject', function (event, param) {
            if (!param) {
                return;
            }
            $scope.$apply(function () {
                var newOrg = param;
                if (GKMount.checkMountExsit(newOrg.mountid)) {
                    return;
                }
                var partition = GKPartition.teamFile;
                if (newOrg['type'] == 3) {
                    partition = GKPartition.subscribeFile;
                }
                newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], partition)[0];
                if (partition == GKPartition.teamFile) {
                    $scope.orgTreeList.push(newOrg);
                } else {
                    $scope.orgSubscribeList.push(newOrg);
                }
            });
        })

        //更新云库
        $scope.$on('updateTeam', function (event, param) {
            if (!param) {
                return;
            }
            $scope.$apply(function () {
                var orgId = param.orgId;
                var mount = GKMount.getMountByOrgId(orgId);
                if(!mount){
                    return;
                }
                var newMount =  GKMount.editMount(mount['mount_id'],param);
                if(!newMount){
                    return;
                }
                var list = $scope.orgTreeList;
                if (mount['type'] == 3) {
                    list = $scope.orgSubscribeList;
                }
                GKSideTree.editNode(list, mount['mount_id'], '', param);

            });
        })

        /**
         * 监控删除云库的回调
         */
        $scope.$on('RemoveOrgObject', function (event, param) {
            $scope.$apply(function () {
                if (!param) {
                    return;
                }
                var mountid = param.mountid;
                var mount = GKMount.getMountById(mountid);
                if (!mount) {
                    return;
                }
                var partition = GKPartition.teamFile;
                if (mount['type'] == 3) {
                    partition = GKPartition.subscribeFile;
                }
                if(partition == GKPartition.teamFile){
                    GKMount.removeTeamList($scope,mount.org_id);
                }else{
                    GKMount.removeOrgSubscribeList($scope,mount.org_id);
                }
            });
        })


        /**
         * 创建云库成功
         */
        $scope.$on('createOrgSuccess',function(event,newOrg){
            if (GKMount.checkMountExsit(newOrg.mountid)) {
                return;
            }
            newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], GKPartition.teamFile)[0];
            $scope.orgTreeList.push(newOrg);
            unSelectAllBranch();
            selectBreanch(newOrg, GKPartition.teamFile, true);
        })

        $scope.$on('editFileSuccess',function(event,opt,mountId,fullpath){
            var fullpathArr = !angular.isArray(fullpath)?[fullpath]:fullpath;
            angular.forEach(fullpathArr,function(path){
                switch (opt){
                    case 'del':
                        GKSideTree.removeNode($scope.orgTreeList,mountId,path);
                        break;
                    case 'sync':
                        GKSideTree.editNode($scope.orgTreeList,mountId,path,{
                            sync:1
                        });
                        break;
                    case 'unsync':
                        GKSideTree.editNode($scope.orgTreeList,mountId,path,{
                            sync:0
                        });
                        break;
                    case 'create':
                        var node = GKSideTree.findNode($scope.orgTreeList,mountId,path);
                        /**
                         * 已展开的node才刷新数据
                         */
                        if(node.expanded){
                            $scope.handleExpand(node);
                        }
                        break;
                    case 'set_open':
                        var node = GKSideTree.findNode($scope.orgTreeList,mountId,path);
                        /**
                         * 已展开的node才刷新数据
                         */
                        if(node){
                            node.data.open=1;
                            node.iconNodeCollapse =node.iconNodeExpand= 'icon_teamfolder';
                        }
                        break;

                }
            })

        });

    }])
    .controller('fileBrowser', ['$interval','GKDialog', '$scope', '$routeParams', '$filter', 'GKPath', 'GK', 'GKException', 'GKOpt', '$rootScope', '$q', 'GKFileList', 'GKPartition', 'GKFileOpt','$timeout','GKFile','GKSearch', function ($interval,GKDialog, $scope, $routeParams, $filter, GKPath, GK, GKException, GKOpt, $rootScope, $q, GKFileList, GKPartition, GKFileOpt,$timeout,GKFile,GKSearch) {

        /**
         * 打开时会有一次空跳转
         */
        if (!$routeParams.partition) return;

        /**
         * 分析路径获取参数
         * @type {*}
         */
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.partition = $routeParams.partition || GKPartition.teamFile; //当前的分区
        $scope.view = $routeParams ? $routeParams.view || 'list' : 'list'; //当前的视图模式
        $scope.filter = $routeParams.filter || ''; //当前的筛选 [search|trash]
        $scope.selectedpath = $routeParams.selectedpath || ''; //当前目录已选中的文件的路径，允许多选，用|分割
        $scope.fileData = []; //文件列表的数据
        $scope.selectedFile = []; //当前目录已选中的文件数据
        $scope.mountId = Number($routeParams.mountid || $rootScope.PAGE_CONFIG.mount.mount_id);
        $scope.keyword = $routeParams.keyword || '';
        $scope.errorMsg = '';
        $scope.order = '+filename'; //当前的排序
        if( $scope.partition == GKPartition.smartFolder && $scope.filter=='recent'){
            $scope.order = '-last_edit_time'; //当前的排序
        }
        $scope.allOpts = null;
        $scope.rightOpts = [];
        $scope.showHint = false;
        if ($rootScope.PAGE_CONFIG.file.syncpath) {
            $scope.showHint = true;
        }
        $scope.totalCount = 0;
        $scope.shiftLastIndex = 0; //shift键盘的起始点
        var intervalPromise;
        $scope.test = function(){
            if (!intervalPromise) {
                var count = 0;
                intervalPromise = $interval(function () {
                    count++;
                    if ($scope.selectedFile.length) {
                        GKFileList.unSelectAll($scope);
                    } else {
                       GKFileList.select($scope,0);
                    }
                }, 300);
            } else {
                $interval.cancel(intervalPromise);
                intervalPromise = null;
            }
        }

        GKFileList.refreahData($scope);

        var getOpenWithMenu = function(mountId,file,allOpts){
            allOpts['open_with']['items'] = {};
            var ext = '.'+file.ext;
            var re = gkClientInterface.getOpenWithMenu({
                'ext':ext
            });
            if(!re){
                return;
            }
            var list = re['list'];
            if(!list || !list.length){
                return;
            }
            var subMenu = {};
            angular.forEach(list,function(value,key){
                var item = {
                    name:value['name'],
                    callback:function(){
                        gkClientInterface.open({
                            webpath:file.fullpath,
                            mountid:mountId,
                            openpath:value.openpath
                        });
                    }
                }
                subMenu['open_with_'+key] = item;
            })
            allOpts['open_with']['items'] = subMenu;
        };

        var excludeOpts = ['open_with','view_property','order_by', 'paste', 'copy', 'cut'],
            excludeRightOpts = [], //右键要排除的操作
            optKeys,
            topOptKeys,
            excludeRightOpts
            ; // 顶部要排除的操作

        var setOpts = function () {
            $scope.allOpts = GKOpt.getAllOpts($scope);
            var isSearch = $scope.keyword.length ? true : false;
            optKeys = GKOpt.getOpts($scope.PAGE_CONFIG.file, $scope.selectedFile, $scope.partition, $scope.filter, $scope.PAGE_CONFIG.mount,isSearch);
            $scope.opts = null;
            $scope.opts = [];
            $scope.rightOpts =null;
            $scope.rightOpts = {};
            topOptKeys = [];

            /**
             * 如果选择了文件，那么把currentOpts中的“同步”，“取消同步” 去掉
             */
            if ($scope.selectedFile.length) {
                var currentOpts = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, false, $scope.partition, $scope.filter, $scope.PAGE_CONFIG.mount,isSearch);
                angular.forEach(['sync', 'unsync'], function (value) {
                    var index = currentOpts.indexOf(value);
                    if (index >= 0) {
                        currentOpts.splice(index, 1);
                    }
                })

                /**
                 * 如果是订阅的文件就不用合并当前的操作和选中的操作
                 */
                if ($scope.partition == GKPartition.subscribeFile) {
                    topOptKeys = optKeys;
                } else {
                    var re = currentOpts.concat(optKeys);
                    topOptKeys =jQuery.unique(jQuery.unique(re));
                }
                if($scope.selectedFile.length==1 && $scope.selectedFile[0].dir==0){
                    getOpenWithMenu(GKFileList.getOptFileMountId($scope.selectedFile[0]),$scope.selectedFile[0],$scope.allOpts);
                }
            } else {
                topOptKeys = optKeys;
            }

            /**
             * 扩展操作的值
             */
            var extendOpt = function (opt, key, isRightOpt) {
                var extendParam = {};
                if (!isRightOpt) {
                    extendParam['key'] = key;
                }
                return angular.extend(opt, extendParam);
            }

            /**
             * 检测subopt是否允许
             */
            var checkSubOpt = function(optKeys,subOpts){
                var cloneOpt  = angular.extend({},subOpts);
                angular.forEach(cloneOpt,function(value,key){
                    if(optKeys.indexOf(key)<0){
                        delete cloneOpt[key];
                    }
                });
                return cloneOpt;
            };

            angular.forEach(topOptKeys, function (value) {
                if (excludeOpts.indexOf(value) < 0) {
                    var opt = $scope.allOpts[value];
                    if (opt) {
                        if(opt.items){
                            var subItems = checkSubOpt(topOptKeys,opt.items);
                            if(jQuery.isEmptyObject(subItems)){
                                return;
                            }else{
                                opt.items = subItems;
                            }
                        }
                        var item = extendOpt(opt, value, false);
                        $scope.opts.push(item);
                    }

                }
            });


            /**
             * 右键的操作
             */
            angular.forEach(optKeys, function (value) {
                if (excludeRightOpts.indexOf(value) < 0) {
                    var opt = $scope.allOpts[value];
                    if (opt) {
                        if(value=='open_with' && jQuery.isEmptyObject(opt.items)){
                            return;
                        }
                        if(value!='open_with'&&!!opt.items && jQuery.isEmptyObject(checkSubOpt(optKeys,opt.items))){
                            return;
                        }
                        var item = extendOpt(opt, value, true);
                        $scope.rightOpts[value] = item;
                    }
                }
            });
            $scope.allOpts = null;
        }

        $scope.triggleOptByShortCut = function(shortcut){
            var opt = GKOpt.getOptByShortCut($scope.rightOpts,shortcut);
            if(opt){
                opt['callback']();
            }
        };

        /**
         * 改变视图
         */
        $scope.changeView = function (view) {
            GKFileList.changeView(view);

        };

        /**
         * 操作
         * @type {Array}
         */
        $scope.$watch('selectedFile',  function(newValue,oldValue){
            if (!newValue || newValue === oldValue) {
                return;
            }
           setOpts();
        }, true);

        $scope.$watch('rightOpts',function(){
                jQuery.contextMenu('destroy', '.file_list .list_body');
                /**
                 * 设置右键菜单
                 */
                jQuery.contextMenu({
                    selector: '.file_list .list_body',
                    reposition: false,
                    zIndex: 99,
                    animation: {
                        show: "show",
                        hide: "hide"
                    },
                    items: $scope.rightOpts
                });
        })

        $scope.$watch('selectedpath', function (newValue, oldValue) {
            if (!newValue ) {
                return;
            }
            GKFileList.unSelectAll($scope);
                angular.forEach(newValue.split('|'), function (value) {
                    GKFileList.selectByPath($scope, value);
            });
        })

        $scope.$watch('PAGE_CONFIG.file',  setOpts, true);
        $scope.$watch('keyword',  setOpts, true);
        $scope.$watch('order', function (newValue) {
            if (!$scope.rightOpts || !$scope.rightOpts['order_by']) {
                return;
            }
            angular.forEach($scope.rightOpts['order_by']['items'], function (value, key) {
                if (key == 'order_by_' + $scope.order.slice(1)) {
                    value['className'] = 'current';
                } else {
                    value['className'] = '';
                }
            });

            if(!newValue){
                return;
            }
            var order = newValue;
            if(newValue.indexOf('filename')>=0){
                var desc = newValue.indexOf('-')?'-':'+';
                order = [desc+'dir',newValue];
            }
            $scope.fileData = $filter('orderBy')($scope.fileData, order);
            GKFileList.reIndex($scope.fileData);
        })

        /**
         * 取消收藏
         */
        $scope.$on('unFav', function ($event) {
            GKFileList.removeAllSelectFile($scope);
        })

        $scope.$on('UpdateWebpath', function (event, param) {
            $scope.$apply(function () {
                var upPath = Util.String.dirName(param.webpath);
                if (upPath == $scope.PAGE_CONFIG.file.fullpath) {
                    GKFileList.refreahData($scope);
                }
            });
        })

        /**
         * 监听对文件的操作事件,同步文件列表和左侧的树
         */
        $scope.$on('editFileSuccess',function(event,opt,mountId,fullpath,extraParam){
                if(!$rootScope.PAGE_CONFIG.mount || $rootScope.PAGE_CONFIG.mount.mount_id != mountId){
                    return;
                }
               var fullpathArr = !angular.isArray(fullpath)?[fullpath]:fullpath;
               if(!fullpathArr.length) {
                   return;
               }
               var forEachFullpath = function(callback){
                   angular.forEach(fullpathArr,function(path){
                        if(angular.isFunction(callback)){
                            callback(path);
                        }
                   })
               };

                if($rootScope.PAGE_CONFIG.file && fullpathArr[0] === $rootScope.PAGE_CONFIG.file.fullpath){
                    switch(opt){
                        case 'sync':
                            forEachFullpath(function(fullpath){
                                $rootScope.PAGE_CONFIG.file.syncpath = fullpath;
                            });
                            break;
                        case 'unsync':
                            forEachFullpath(function(fullpath){
                                $rootScope.PAGE_CONFIG.file.syncpath = '';
                            });
                            break;
                        case 'del':
                            forEachFullpath(function(fullpath){
                                GKPath.gotoFile(mountId,Util.String.dirName(fullpath));
                            });
                            break;
                        case 'create':
                            GKFileList.refreahData($scope,extraParam.fullpath);
                            break;
                    }
                }else{
                    var forEachFile = function(callback){
                        forEachFullpath(function(path){
                            angular.forEach($scope.fileData,function(value){
                                if(value.fullpath === path && angular.isFunction(callback)){
                                    callback(value);
                                }
                            });
                            })

                    };
                    switch(opt){
                        case 'sync':
                            forEachFile(function(value){
                                value.sync = 1;
                            })
                            break;
                        case 'unsync':
                            forEachFile(function(value){
                                value.sync = 0;
                            })
                            break;
                        case 'del':
                            GKFileList.removeAllSelectFile($scope);
                            forEachFile(function(value){
                                GKFileList.remove($scope,value);
                            })
                            break;
                        case 'set_open':
                            forEachFile(function(value){
                                value.open = extraParam.open;
                            })
                            break;

                    }

                }
        })

        $scope.$on('clearTrashSuccess',function(event,mountId){
            if($scope.mountId != mountId || $scope.filter != 'trash'){
                return;
            }
            GKFileList.refreahData($scope);
        })

        $scope.renameFileSubmit = function(filename,file){
            if(!GKFile.checkFilename(filename)){
                return;
            }
            var mountId = GKFileList.getOptFileMountId(file);
            if (filename === file.filename) {
                file.rename = false;
            } else {
                var upPath = Util.String.dirName(file.fullpath);
                var newpath  = upPath +(upPath?'/':'') + filename;
                GK.rename({
                    oldpath: file.fullpath,
                    newpath: newpath,
                    mountid: mountId
                }).then(function () {
                        file.fullpath = newpath;
                        file.filename = filename;
                        file.ext = Util.String.getExt(filename);
                        file.rename = false;
                    }, function (error) {
                        file.rename = false;
                        GKException.handleClientException(error);
                    });
            }
        };

        $scope.createFileNameSubmit = function(filename){
            if(!GKFile.checkFilename(filename)){
                return;
            }
            var webpath = $scope.path ? $scope.path + '/' + filename : filename;
            var params = {
                webpath: webpath,
                dir: 1,
                mountid: $scope.mountId
            };
            GK.createFolder(params).then(function () {
                $scope.createNewFolder = false;
                $rootScope.$broadcast('editFileSuccess','create',$scope.mountId,$scope.path,{fullpath:webpath})
            }, function (error) {
                GKException.handleClientException(error);
            });
        }

        /**
         * 处理点击
         * @param $event
         * @param index
         */
        $scope.handleClick = function ($event, index) {
            var file = $scope.fileData[index];
            if ($event.ctrlKey || $event.metaKey) {
                if (file.selected) {
                    GKFileList.unSelect($scope, index);
                } else {
                    GKFileList.select($scope, index, true);
                }
            } else if ($event.shiftKey) {
                var lastIndex = $scope.shiftLastIndex;
                GKFileList.unSelectAll($scope)
                if (index > lastIndex) {
                    for (var i = lastIndex; i <= index; i++) {
                        GKFileList.select($scope, i, true);
                    }
                } else if (index < lastIndex) {
                    for (var i = index; i <= lastIndex; i++) {
                        GKFileList.select($scope, i, true);
                    }
                }

            } else {
                GKFileList.select($scope, index);
            }
            if (!$event.shiftKey) {
                $scope.shiftLastIndex = index;
            }
        };

        /**
         * 双击文件
         * @param $event
         * @param file
         */
        $scope.handleDblClick = function (file) {
            /**
             * 文件夹
             */
            if ($scope.filter == 'trash') {
                return;
            }
            if (file.dir == 1) {
                GKPath.gotoFile(GKFileList.getOptFileMountId(file), file.fullpath);
            } else {
                if (!$scope.PAGE_CONFIG.networkConnected && !file.cache) {
                    return;
                }
                GK.open({
                    mountid: GKFileList.getOptFileMountId(file),
                    webpath: file.fullpath
                });
            }
        };

        /**
         * 右键文件
         * @param $event
         * @param file
         */
        $scope.handleRightClick = function ($event) {
            var jqTarget = jQuery($event.target);
            var fileItem = jqTarget.hasClass('file_item') ? jqTarget : jqTarget.parents('.file_item');
            if (fileItem.size()) {
                var index = fileItem.index();
                if (!$scope.fileData[index].selected) {
                    GKFileList.select($scope, index);
                }
            } else {
                GKFileList.unSelectAll($scope);
            }
        };

        /**
         * 设置order
         * @param order
         */
        $scope.setOrder = function (order) {
            GKFileList.setOrder($scope,order);
        };

        /**
         * 监听mousedown事件
         * @param event
         */
        $scope.handleMouseDown = function (event) {
            var $target = jQuery(event.target);
            if (!$target.hasClass('file_item') && !$target.parents('.file_item').size()) {
                GKFileList.unSelectAll($scope);
            }
            /**
             * 为了修复框选组件的bug
             */
//            $timeout(function(){
//                document.activeElement.blur();
//            },0)
        };

        /**drag drop **/
        $scope.getHelper = function () {
            var selectFileName = $scope.fileData[$scope.shiftLastIndex].filename;
            var len = $scope.selectedFile.length;
            var moreInfo = len > 1 ? ' 等' + len + '个文件或文件夹' : '';
            return '<div class="helper">' + selectFileName + moreInfo + '</div>';
        };

        $scope.dragBegin = function (event, ui, index) {
            var file = $scope.fileData[index];
            if (!file) {
                return;
            }
            if (!file.selected) {
                GKFileList.select($scope, index);
            }
            angular.forEach($scope.selectedFile, function (value) {
                value.disableDrop = true;
            });
        };

        $scope.dragEnd = function (event, ui, index) {
            angular.forEach($scope.selectedFile, function (value) {
                value.disableDrop = false;
            });
        };

        $scope.handleOver = function (event, ui, file) {
            file.hover = true;
        };

        $scope.handleOut = function (event, ui, file) {
            file.hover = false;
        };

        $scope.handleDrop = function (event, ui, file) {
            var toMountId = $scope.mountId,
                toFullpath = file.fullpath,
                fromMountId = $scope.mountId,
                fromFullpathes = [];

            angular.forEach($scope.selectedFile, function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });
            var msg = '你确定要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? '等' + fromFullpathes.length + '文件或文件夹' : '') + ' 移动到 ' + Util.String.baseName(toFullpath) + ' 吗？';
            if (!confirm(msg)) {
                file.hover = false;
                return;
            }

            GKFileOpt.move(toFullpath, toMountId, fromFullpathes, fromMountId).then(function () {
                GKFileList.refreahData($scope);
            }, function () {

            });
        };

        $scope.handleSysDrop = function ($event) {
            var dragFiles = gkClientInterface.getDragFiles();
            if ($scope.partition == GKPartition.subscribeFile) {
                alert('不能在当前路径添加文件');
                return;
            }
            var params = {
                parent: $scope.path,
                type: 'save',
                list: dragFiles.list,
                mountid: $scope.mountId
            };
            GK.addFile(params).then(function () {
                GKFileList.refreahData($scope);
            }, function (error) {
                GKException.handleClientException(error);
            })
        };

        $scope.goToLocal = function () {
            gkClientInterface.open({
                mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                webpath: $rootScope.PAGE_CONFIG.file.fullpath
            });
        };

        $scope.showSyncSetting = function () {
            GKDialog.openSetting('sync');
        }

        $scope.handleScrollLoad = function () {
            if($scope.partition != GKPartition.subscribeFile){
                return;
            }
            var start = $scope.fileData.length;
            if(start>=$scope.totalCount) return;
            GKFileList.getFileData($scope,start).then(function(list){
                $scope.fileData =  $scope.fileData.concat(list);
            })
        }

        /**
         * ctrlV结束
         */
        $scope.$on('ctrlVEnd', function (event, newFileData) {
            $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
        });

        $scope.$on('LinkStatus', function () {
            $scope.$apply(function () {
                var selectPath = [];
                angular.forEach($scope.selectedFile, function (value) {
                    selectPath.push(value.fullpath);
                })
                GKFileList.refreahData($scope,selectPath.join('|'));
            });
        })

        /**
         * 监听侧边栏的搜索
         */
        $scope.$on('invokeSearch', function ($event) {
            GKFileList.refreahData($scope);
        })

        $scope.$on('searchSmartFolder', function (event, keyword) {
            if (!keyword) {
                return;
            }
            var fileList = $filter('filter')($scope.fileData, {filename: keyword});
            $scope.keyword = keyword;
            if (!fileList || !fileList.length) {
                $scope.errorMsg = '未找到相关搜索结果';
            } else {
                $scope.fileData = fileList;
            }
            GKSearch.setSearchState('end');
        })

        $scope.$on('cancelSearchSmartFolder', function (event, keyword) {
             $scope.keyword = '';
             GKFileList.refreahData($scope);
        })

        $scope.$on('$destroy',function(){
            jQuery.contextMenu('destroy', '.file_list .list_body');

        })

    }])
    .controller('header', ['$scope', 'GKPath', '$location', '$filter', 'GKHistory', 'GKApi', '$rootScope', '$document', '$compile', '$timeout', 'GKDialog', 'GKFind', 'GKModal','GKPartition','GKGuiders','localStorageService',function ($scope, GKPath, $location, $filter, GKHistory, GKApi, $rootScope, $document, $compile, $timeout, GKDialog, GKFind,GKModal,GKPartition,GKGuiders,localStorageService) {
        $scope.canBack = false;
        $scope.canForward = false;

        /**
         * 判断前进后退按钮的状态
         * @type {*}
         */
        $scope.$on('$routeChangeSuccess', function () {
            $scope.breads = GKPath.getBread();
            $scope.canBack = GKHistory.canBack();
            $scope.canForward = GKHistory.canForward();
            $scope.path = $rootScope.PAGE_CONFIG.file.fullpath || '';
        });

        $scope.$on('editSmartFolder', function ($event, name, code,filter) {
           angular.forEach($scope.breads,function(value){
               if(value.filter == filter){
                   value.name = name;
               }
           });
        })

        /**
         * 前进 后退
         * @param forward
         */
        $scope.handleNav = function (forward) {
            if (!forward) {
                GKHistory.back();
            } else {
                GKHistory.forward();
            }
        };

        $scope.items = [
            {
                item: "创建云库",
                menuclick: function () {
                    var createTeamDialog = GKModal.createTeam();

                }
            },
            {
                item: "设置",
                menuclick: function () {
                    GKDialog.openSetting();
                }
            },
            {
                item: "传输队列",
                menuclick: function () {
                    GKDialog.openTransfer();
                }
            },
            {
                item: "帮助",
                menuclick: function () {
                    var url = gkClientInterface.getUrl({
                        sso: 1,
                        url: '/help'
                    });
                    gkClientInterface.openUrl(url);
                }
            },
            {
                item: "关于",
                menuclick: function () {
                    var url = gkClientInterface.getUrl({
                        sso: 1,
                        url: '/about'
                    });
                    gkClientInterface.openUrl(url);
                }
            },
            {
                item: "退出",
                menuclick: function () {
                    gkClientInterface.quit();
                }
            }
        ];

        $scope.showGuider = function(){
            GKGuiders.show('guide_1');
            if(!localStorageService.get('guiders_shown')){
                localStorageService.add('guiders_shown',true)
            }
        }

        if(!localStorageService.get('guiders_shown')){
            $timeout(function(){
                $scope.showGuider();
                return null;
            },200)
        }
    }])
    .controller('rightSidebar',['$scope','GKFile', 'GKOpen', 'GKFilter', 'RestFile', '$rootScope', 'GKApi', '$http', '$location', 'GKSearch', 'GKFileList', 'GKPartition', 'GKModal', 'GKMount','GKSmartFolder',function($scope,GKFile, GKOpen, GKFilter, RestFile, $rootScope, GKApi, $http, $location, GKSearch, GKFileList, GKPartition, GKModal, GKMount,GKSmartFolder){

        $scope.GKPartition = GKPartition;
        /**
         * 监听已选择的文件
         */
        $scope.shareMembers = []; //共享参与人
        $scope.remarks = []; //讨论
        $scope.histories = []; //历史
        $scope.remindMembers = [];//可@的成员列表
        $scope.localFile = null;
        $scope.sidebar = 'nofile';

        $scope.$watch('[selectedFile,path]', function (newValue, oldValue) {
            if (!newValue[0] || !newValue[0].length) { //未选中文件
                $scope.localFile = $rootScope.PAGE_CONFIG.file;
            } else if (newValue[0].length == 1) { //选中了一个文件
                $scope.localFile = newValue[0][0];
            } else { //多选
                $scope.localFile = null;
            }

        }, true);

        $scope.$watch('[partition,selectedFile,filter,localFile,keyword]', function (newValue, oldValue) {
            var selected = newValue[1] || [];
            if (selected.length > 1) {
                $scope.sidebar = 'multifile';
            } else if (selected.length == 1 || (newValue[3] && newValue[3].fullpath)) {
                $scope.sidebar = 'singlefile';
            } else {
                $scope.sidebar = 'nofile';
                if($scope.keyword){
                    $scope.sidbarData = {
                        title:'搜索结果',
                        tip: '',
                        icon: 'search'
                    }
                }
                else{
                if (!$scope.filter) {
                    if ($rootScope.PAGE_CONFIG.mount && $rootScope.PAGE_CONFIG.mount.mount_id) {
                        var title = $scope.PAGE_CONFIG.mount ? $scope.PAGE_CONFIG.mount.name : '';
                        $scope.sidbarData = {
                            title: $scope.PAGE_CONFIG.mount ? $scope.PAGE_CONFIG.mount.name : '',
                            tip: '将文稿，照片，视频等文件保存在我的文件夹里，文件将自动备份到云端。可以使用手机，平板来访问它们，使设备之间无缝，无线连接',
                            photo: "",
                            attrHtml: '',
                            menus: []
                        };

                        $scope.sidbarData.photo = $rootScope.PAGE_CONFIG.mount.logo;
                        $scope.sidbarData.tip = $rootScope.PAGE_CONFIG.mount.org_description || '';

                        $scope.sidbarData.menus = [
                            {
                                text: '库资料',
                                icon: 'icon_info',
                                name: 'visit_website',
                                click: function () {
                                    GKModal.teamOverview($rootScope.PAGE_CONFIG.mount.org_id);
                                }
                            },
                            {
                                text: '库名片',
                                icon: 'icon_teamcard',
                                name: 'team_card',
                                click: function () {
                                    GKModal.teamCard($rootScope.PAGE_CONFIG.mount.org_id);
                                }
                            },
                        ];

                        if ($scope.partition == GKPartition.teamFile) {
                            $scope.sidbarData.atrrHtml = '成员 ' + $rootScope.PAGE_CONFIG.mount.member_count + ',订阅 ' + $rootScope.PAGE_CONFIG.mount.subscriber_count + '人';
                            if (GKMount.isMember($rootScope.PAGE_CONFIG.mount)) {
                                $scope.sidbarData.menus.push({
                                    text: '库成员',
                                    icon: 'icon_team',
                                    name: 'member_group',
                                    click: function () {
                                        GKModal.teamMember($rootScope.PAGE_CONFIG.mount.org_id);
                                    }
                                });
                                $scope.sidbarData.menus.push({
                                    text: '库订阅者',
                                    icon: 'icon_pin',
                                    name: 'subscriber',
                                    click: function () {
                                        GKModal.teamSubscribe($rootScope.PAGE_CONFIG.mount.org_id);
                                    }
                                });
                            }
                            if (GKMount.isAdmin($rootScope.PAGE_CONFIG.mount)) {
                                $scope.sidbarData.menus.push({
                                    text: '库安全设置',
                                    icon: 'icon_manage',
                                    name: 'manage_team',
                                    click: function () {
                                        GKModal.teamManage($rootScope.PAGE_CONFIG.mount.org_id);
                                    }
                                })
                            }
                            if (GKMount.isSuperAdmin($rootScope.PAGE_CONFIG.mount)) {
                                $scope.sidbarData.menus.push({
                                    text: '库升级',
                                    icon: 'icon_team_upgrade',
                                    name: 'team_upgrade',
                                    click: function () {
                                        var url = gkClientInterface.getUrl({
                                            sso:1,
                                            url:'/pay/order?org_id='+orgId
                                        })
                                        gkClientInterface.openUrl(url);
                                    }
                                })
                            }
                        }
                    }

                } else {
                    if($scope.filter=='trash'){
                        $scope.sidbarData = {
                            title:'回收站',
                            tip: '',
                            icon: $scope.filter
                        }
                    }else{
                        var type = GKFilter.getFilterType($scope.filter);
                        var smartFolder = GKSmartFolder.getFolderByCode(type);
                        $scope.sidbarData = {
                            title:smartFolder?smartFolder['name']:'',
                            tip: GKFilter.getFilterTip($scope.filter),
                            icon: $scope.filter
                        };
                    }

                }
                }
            }
        }, true);

        $scope.$on('editSmartFolder', function ($event, name, code,filter) {
            if($scope.filter == filter){
                $scope.sidbarData.title = name;
            }
        })

        $scope.headClick = function () {
            $scope.sidbarData.menus[0].click();
        };

    }])
;



