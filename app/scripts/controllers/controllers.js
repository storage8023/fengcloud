'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('initClient', ['$rootScope', 'GKNews', '$scope', 'GKMount', '$location', 'GKFile', 'GKPartition', 'GKModal', 'GKApi', function ($rootScope, GKNews, $scope, GKMount, $location, GKFile, GKPartition, GKModal, GKApi) {
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

        $scope.$on('teamSecurity',function(){
            if(!$rootScope.PAGE_CONFIG.mount || !$rootScope.PAGE_CONFIG.mount.org_id){
                GKModal.teamManage($rootScope.PAGE_CONFIG.mount.org_id);
            }
        })

        $scope.$on('expandSpace',function(){
            if(!$rootScope.PAGE_CONFIG.mount || !$rootScope.PAGE_CONFIG.mount.org_id){
                return;
            }
            var url = gkClientInterface.getUrl({
                sso: 1,
                url: '/help'
            });
            gkClientInterface.openUrl(url);
        })

        $scope.$on('addMember',function(){
            if(!$rootScope.PAGE_CONFIG.mount || !$rootScope.PAGE_CONFIG.mount.org_id){
               return;
            }
            GKModal.teamMember($rootScope.PAGE_CONFIG.mount.org_id);

        })

        $scope.$on('viewSubscriber',function(){
            if(!$rootScope.PAGE_CONFIG.mount || !$rootScope.PAGE_CONFIG.mount.org_id){
               return;
            }
            GKModal.teamSubscribe($rootScope.PAGE_CONFIG.mount.org_id);

        })

        $scope.$on('qr',function(){
            if(!$rootScope.PAGE_CONFIG.mount || !$rootScope.PAGE_CONFIG.mount.org_id){
               return;
            }
            GKModal.teamQr($rootScope.PAGE_CONFIG.mount.org_id);
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

        $rootScope.CompletedEvent = function () { console.log("Completed Event called"); };

        $rootScope.ExitEvent = function () { console.log("Exit Event called");};

        $rootScope.ChangeEvent = function () { console.log("Change Event called"); };

        $rootScope.BeforeChangeEvent = function () { console.log("Before Change Event called"); };

        $rootScope.IntroOptions = {
            steps:[
            ],
            showStepNumbers: false,
            exitOnOverlayClick: true,
            exitOnEsc:true,
            nextLabel: '<strong>NEXT!</strong>',
            prevLabel: '<span style="color:green">Previous</span>',
            skipLabel: 'Exit',
            doneLabel: 'Thanks'
        };

    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', 'GKSmartFolder', 'GKMount', 'GKFilter', 'GKPartition', 'GKModal', 'GK', 'GKFileList', 'GKFileOpt','GKSideTree','GKApi','$q',function ($scope, $location, GKPath, GKFile, $rootScope, GKSmartFolder, GKMount, GKFilter, GKPartition, GKModal, GK, GKFileList, GKFileOpt,GKSideTree,GKApi,$q) {
        $scope.GKPartition = GKPartition;
        var orgMount = GKMount.getOrgMounts(),//云库的空间
            subscribeMount = GKMount.getSubscribeMounts(); //订阅的云库
        /**
         * 个人的文件
         * @type {*}
         */

        var getTrashNode = function (mount_id,partition) {
            var node = {
                label: GKFilter.getFilterName('trash'),
                isParent: false,
                dropAble: false,
                data: {
                    fullpath: '',
                    filter: 'trash',
                    mount_id: mount_id,
                    partition:partition
                },
                iconNodeExpand: 'icon_trash',
                iconNodeCollapse: 'icon_trash'
            };
            return node;
        };


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
            //unSelectAllBranch();
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
                if (pararm['filter'] == 'search') {
                    pararm['keyword'] = branch.data.condition;
                }
            } else {
                return;
            }
            $location.search(pararm);

        };

        var getFileList = function(mountId,fullpath,source){
            var deferred = $q.defer(),list;
            if(source == 'api'){
                GKApi.list(mountId,fullpath,0,1000,1).success(function(data){
                   list = GKFile.dealFileList(data['list'],'api');
                    deferred.resolve(list);
                });
            }else{
                list = GKFile.getFileList(mountId, fullpath, 1);
                deferred.resolve(list);
            }
            return deferred.promise;
        }

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if (branch.expanded) {
                if(branch.data.filter != 'trash'){
                    var source = 'client';
                    if(branch.data.partition == GKPartition.subscribeFile){
                        source = 'api';
                    }
                    getFileList(branch.data.mount_id, branch.data.fullpath,source).then(function(list){
                        branch.children = GKFile.dealTreeData(list, branch.data.partition, branch.data.mount_id);
                        if (!branch.children)  branch.children = [];
                        /**
                         * 添加回收站
                         */
                        if (!branch.data.fullpath && !branch.data.filter && branch.data.type != 3) {
                            var trashNode = getTrashNode(branch.data.mount_id,branch.data.partition);
                            branch.children.push(trashNode);
                        }
                    })
                }

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
            var msg = '你确定要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? '等' + fromFullpathes.length + '文件' : '') + ' ' + actName + '到 ' + toName + ' 吗？';
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

        $scope.$on('$locationChangeSuccess', function ($s, $current, $prev) {
            var param = $location.search();
            var branch;
            if (param.partition == GKPartition.myFile) {
                branch = $scope.orgTreeList[0];
            } else if (param.partition == GKPartition.teamFile) {
                angular.forEach($scope.orgTreeList, function (value) {
                    if (value.data.mount_id == param.mountid) {
                        branch = value;
                        return false;
                    }
                })
            } else if (param.partition == GKPartition.subscribeFile) {
                angular.forEach($scope.orgSubscribeList, function (value) {
                    if (value.data.mount_id == param.mount_id) {
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
    .controller('fileBrowser', ['GKDialog', 'GKOpen', '$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException', 'GKFile', 'GKCilpboard', 'GKOpt', '$rootScope', '$modal', 'GKApi', '$q', 'GKSearch', 'RestFile', 'GKFileList', 'GKPartition', 'GKFileOpt', 'GKModal', 'GKFilter', function (GKDialog, GKOpen, $scope, $routeParams, $location, $filter, GKPath, GK, GKException, GKFile, GKCilpboard, GKOpt, $rootScope, $modal, GKApi, $q, GKSearch, RestFile, GKFileList, GKPartition, GKFileOpt, GKModal, GKFilter) {

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
        $scope.order = '+file_name'; //当前的排序
        $scope.filter = $routeParams.filter || ''; //当前的筛选 [search|trash]
        $scope.selectedpath = $routeParams.selectedpath || ''; //当前目录已选中的文件的路径，允许多选，用|分割
        $scope.fileData = []; //文件列表的数据
        $scope.selectedFile = []; //当前目录已选中的文件数据
        $scope.mountId = Number($routeParams.mountid || $rootScope.PAGE_CONFIG.mount.mount_id);
        $scope.keyword = $routeParams.keyword || '';
        $scope.errorMsg = '';
        var totalCount = 0;

        //console.log(12);

        /**
         * 文件列表数据
         */
        var getFileData = function (start) {
            start = angular.isDefined(start)?start:0;
            var fileList,
                source = 'client',
                deferred = $q.defer();
            $scope.errorMsg = '';
            /**
             * 我的文件和云库文件夹
             */
            if ($scope.partition == GKPartition.myFile || $scope.partition == GKPartition.teamFile || $scope.partition == GKPartition.subscribeFile) {
                /**
                 * 回收站
                 */
                if ($scope.filter == 'trash') {
                    source = 'api';
                    RestFile.recycle($scope.mountId, '').success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        })
                    /**
                     * 搜索
                     */
                } else if ($scope.filter == 'search') {
                    source = 'api';
                    GKSearch.setSearchState('loading');
                    var condition = GKSearch.getCondition();
                    GKApi.searchFile(condition, $scope.mountId).success(function (data) {
                        GKSearch.setSearchState('end');
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function (request) {
                            GKSearch.setSearchState('end');
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });

                }else if($scope.partition == GKPartition.subscribeFile){
                    source = 'api';
                    GKApi.list($scope.mountId,$scope.path,start,400).success(function(data){
                        fileList = data['list'];
                        totalCount =  data['count'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));

                    }).error(function(request){
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });
                    /**
                     * 获取文件列表
                     */
                } else {
                    var re = gkClientInterface.getFileList({
                        webpath: $scope.path,
                        mountid: $scope.mountId
                    });
                    fileList = re['list'];
                    deferred.resolve(GKFile.dealFileList(fileList, source));
                }

            } else {
                source = 'api';
                /**
                 * 我接收的文件
                 */
                if ($scope.filter == 'inbox') {
                    GKApi.inboxFileList($scope.filter).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });

                    /**
                     * 加星标的文件
                     */
                } else if (['star', 'diamond', 'moon', 'triangle', 'flower', 'heart'].indexOf($scope.filter) >= 0) {
                    var type = GKFilter.getFilterType($scope.filter);

                    GKApi.starFileList(type).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });


                    /**
                     * 最近访问的文件
                     */
                } else if ($scope.filter == 'recent') {
                    GKApi.recentFileList($scope.filter).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });
                } else {
                    /**
                     * 智能文件夹
                     */
                    GKApi.smartFolderList($scope.keyword).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function (request) {
                            deferred.reject(GKException.getAjaxErrorMsg(request));
                        });
                }
            }
            return deferred.promise;
        };


        /**
         * 刷新列表数据
         */
        var refreahData = function (selectPath) {
            getFileData().then(function (newFileData) {
                $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                //console.log($scope.fileData);
                if (selectPath) {
                    $scope.selectedpath = selectPath;
                }
                if ((!$scope.fileData || !$scope.fileData.length)) {
                    $scope.errorMsg = '该文件夹为空';
                }
            }, function (errorMsg) {
                $scope.errorMsg = errorMsg;
            })
        };

        $scope.$on('LinkStatus', function () {
            $scope.$apply(function () {
                var selectPath = [];
                angular.forEach($scope.selectedFile, function (value) {
                    selectPath.push(value.fullpath);
                })
                refreahData(selectPath.join('|'));
            });
        })

        /**
         * 监听侧边栏的搜索
         */
        $scope.$on('invokeSearch', function ($event) {
            refreahData();
        })

        refreahData();

        /**
         * 设置同步状态
         */
        var toggleSync = function (isSync) {
            var params,
                setParentFile = true,
                file;
            if ($scope.selectedFile && $scope.selectedFile.length == 1) {
                setParentFile = false;
                file = $scope.selectedFile[0];
            } else {
                file = $rootScope.PAGE_CONFIG.file;
            }
            if (isSync) { //取消同步
                if (!confirm('确定取消同步"' + file.filename + '" 吗？取消后，两个文件夹将来发生的变化不会相互同步。')) {
                    return;
                }
                params = {
                    webpath: file.fullpath,
                    mountid: $rootScope.PAGE_CONFIG.mount.mount_id
                }
                GK.removeLinkPath(params).then(function () {
                    $rootScope.$broadcast('editFileSuccess','unsync',GKFileList.getOptFileMountId($scope, $rootScope),file.fullpath)
                });

            } else {
               GKModal.sync($rootScope.PAGE_CONFIG.mount.mount_id,file.fullpath);
            }
        };


        /**
         * 改变视图
         */
        $scope.changeView = function (view) {
            $scope.view = view;
        };

        /**
         *  设置排序
         * @param type
         */
        var setOrder = function (type, asc) {
            var orderAsc = $scope.order.slice(0, 1);
            if (asc === undefined) {
                asc = orderAsc == '+' ? '-' : '+';
            }
            $scope.order = asc + type;
        };

        $scope.$on('setOrder', function (event, order) {
            setOrder(order);
        });


        $scope.$on('searchSmartFolder', function (event, keyword) {
            if (!keyword) {
                return;
            }
            var fileList = $filter('filter')($scope.fileData, {filename: keyword});
            if (!fileList || !fileList.length) {
                $scope.errorMsg = '未找到相关搜索结果';
            } else {
                $scope.keyword = keyword;
                $scope.fileData = fileList;
            }
        })


        /**
         * 所有操作
         * @type {{add: {name: string, index: number, callback: Function}, new_folder: {name: string, index: number, callback: Function}, lock: {name: string, index: number, callback: Function}, unlock: {name: string, index: number, callback: Function}, save: {name: string, index: number, callback: Function}, del: {name: string, index: number, callback: Function}, rename: {name: string, index: number, callback: Function}, order_by: {name: string, index: number, items: {order_by_file_name: {name: string, className: string, callback: Function}, order_by_file_size: {name: string, className: string, callback: Function}, order_by_file_type: {name: string, className: string, callback: Function}, order_by_last_edit_time: {name: string, className: string, callback: Function}}}}}
         */
        var allOpts = {
            'goto': {
                name: '位置',
                index:0,
                icon: 'icon_location',
                className: "goto",
                callback: function () {
                    var mountId = GKFileList.getOptFileMountId($scope, $rootScope);
                    var fullpath = $scope.selectedFile[0].fullpath;
                    var upPath = Util.String.dirName(fullpath);
                    var filename = $scope.selectedFile[0].filename;
                    GKPath.gotoFile(mountId, upPath, fullpath);
                }
            },
            'open_with': {
                name: '打开方式',
                index:0,
                icon: 'icon_open_with',
                className: "open_with",
                items:{}
            },
            'new_file':{
                name: '新建',
                className: "new_folder",
                icon: 'icon_newfolder',
                index:1,
                items: {
                    'new_folder': {
                        name: '新建文件夹',
                        index:0,
                        className: "new_folder",
                        callback: function () {
                            var isShare = $scope.partition == $scope.PAGE_CONFIG.file.sharepath ? 1 : 0;
                            $scope.$broadcast('fileNewFolderStart', isShare, function (new_file_name) {
                                var webpath = $scope.path ? $scope.path + '/' + new_file_name : new_file_name;
                                var params = {
                                    webpath: webpath,
                                    dir: 1,
                                    mountid: $scope.mountId
                                };
                                GK.createFolder(params).then(function () {
                                    $scope.$broadcast('fileNewFolderEnd');
                                    $rootScope.$broadcast('editFileSuccess','create',$scope.mountId,$scope.path,{fullpath:webpath})
                                }, function (error) {
                                    GKException.handleClientException(error);
                                });
                            });
                        }
                    },
                    'create':{
                        name: '创建公开文件夹',
                        index:1,
                        className: "create",
                        callback: function () {
                            GKModal.createTeamFolder($scope.mountId,'');
                        }
                    },
                    'create_sync_folder': {
                        name: '创建同步文件夹',
                        index:2,
                        className: "sync_folder",
                        callback: function () {
                            GKModal.backUp($scope.mountId,$rootScope.PAGE_CONFIG.file.fullpath);
                        }
                    }
                }
            },
            'unsubscribe': {
                index:2,
                name: '取消订阅',
                icon: 'icon_remove',
                className: "unsubscribe",
                callback: function () {
                   GKOpt.unsubscribe($rootScope.PAGE_CONFIG.mount.org_id);
                }
            },
            'nearby': {
                index:3,
                name: '附近',
                icon: 'icon_location',
                className: "nearby",
                callback: function () {
                    GKModal.nearBy();
                }
            },
            'manage': {
                index:4,
                name: '管理',
                icon: 'icon_setting',
                className: "manage",
                callback: function () {
                    GKOpen.manage($rootScope.PAGE_CONFIG.mount.org_id);
                }
            },
            'clear_trash': {
                index:5,
                name: '清空回收站',
                icon: 'icon_del',
                className: "clear_trash",
                callback: function () {
                    GKOpt.clearTrash($scope.PAGE_CONFIG.mount.mount_id);
                }
            },
            'revert': {
                index:6,
                name: '还原',
                icon: 'icon_recover',
                className: "revert",
                callback: function () {
                    var list = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        list.push({
                            webpath: value.fullpath
                        });
                    });
                    var param = {
                        mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                        list: list
                    };
                    GK.recover(param).then(function () {
                        angular.forEach($scope.selectedFile, function (value) {
                            angular.forEach($scope.fileData, function (file, key) {
                                if (value == file) {
                                    $scope.fileData.splice(key, 1);
                                }
                            })
                        });
                        $scope.selectedFile = [];
                        $scope.selectedIndex = [];
                    })
                }
            },
            'del_completely': {
                index:20,
                name: '彻底删除',
                className: "del_completely",
                icon: 'icon_disable',
                callback: function () {
                    var fullpaths = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        fullpaths.push(value.dir == 1 ? value.fullpath + '/' : value.fullpath);
                    });
                    RestFile.delCompletely($rootScope.PAGE_CONFIG.mount.mount_id, fullpaths).success(function () {
                        angular.forEach($scope.selectedFile, function (value) {
                            angular.forEach($scope.fileData, function (file, key) {
                                if (value == file) {
                                    $scope.fileData.splice(key, 1);
                                }
                            })
                        });
                        $scope.selectedFile = [];
                        $scope.selectedIndex = [];
                    }).error(function () {

                        });
                }
            },
            'sync': {
                index:8,
                name: '同步',
                className: "sync",
                icon: 'icon_sync',
                callback: function () {
                    toggleSync(0);
                }
            },
            'unsync': {
                index:9,
                name: '取消同步',
                className: "unsync",
                icon: 'icon_disable',
                callback: function () {
                    toggleSync(1);
                }
            },
            'paste': {
                index:10,
                name: '粘贴',
                className: "paste",
                icon: 'icon_paste',
                accesskeyText:'Ctrl+V',
                callback: function () {
                    var data = GKCilpboard.getData();
                    if (!data || !data.files || !data.mount_id) return;
                    var target = $rootScope.PAGE_CONFIG.file.fullpath;
                    if ($scope.selectedFile.length == 1) {
                        target = $scope.selectedFile[0].fullpath;
                    }

                    if (data.code == 'ctrlC') {
                        GKFileOpt.copy(target, $rootScope.PAGE_CONFIG.mount.mount_id, data.files, data.mount_id).then(function () {
                            refreahData();
                            //$scope.$broadcast('ctrlVEnd', getFileData('test12345'));
                            //GKCilpboard.clearData();
                        }, function (error) {
                            GKException.handleClientException(error);
                        });
                    } else if (data.code == 'ctrlX') {
                        GKFileOpt.move(target, $rootScope.PAGE_CONFIG.mount.mount_id, data.files, data.mount_id).then(function () {
                            refreahData();
                            //$scope.$broadcast('ctrlVEnd', getFileData('test123456'));
                            GKCilpboard.clearData();
                        }, function (error) {
                            GKException.handleClientException(error);
                        });
                    }
                }
            },
            'cut': {
                index:11,
                name: '剪切',
                className: "cut",
                icon: 'icon_cut',
                accesskeyText:'Ctrl+X',
                callback: function () {
                    if(!$scope.selectedFile || !$scope.selectedFile.length){
                        return;
                    }
                    var data = {
                        code: 'ctrlX',
                        mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                        files: getCilpFileData()
                    }
                    GKCilpboard.setData(data);
                }
            },
            'copy': {
                index:12,
                name: '复制',
                className: "copy",
                icon: 'icon_copy',
                accesskeyText:'Ctrl+C',
                callback: function () {
                    if(!$scope.selectedFile || !$scope.selectedFile.length){
                        return;
                    }
                    var data = {
                        code: 'ctrlC',
                        mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                        files: getCilpFileData()
                    };

                    GKCilpboard.setData(data);
                }
            },
            'add': {
                index:2,
                name: '添加',
                className: "add",
                icon: 'icon_download',
                callback: function () {
                    var addFiles = gkClientInterface.addFileDialog();
                    if (!addFiles || !addFiles.list || !addFiles.list.length) {
                        return;
                    }
                    var params = {
                        parent: $scope.path,
                        type: 'save',
                        list: addFiles.list,
                        mountid: $scope.mountId
                    };
                    GK.addFile(params).then(function () {
                        refreahData();
                    }, function (error) {
                        GKException.handleClientException(error);
                    })
                }
            },
            'lock': {
                index:14,
                name: '锁定',
                className: "lock",
                icon: 'icon_lock',
                callback: function () {
                    var file = $scope.selectedFile[0];
                    GK.lock({
                        webpath: file.fullpath,
                        mountid: $scope.mountId
                    }).then(function () {
                            file.lock = 1;
                            file.lock_member_name = $rootScope.PAGE_CONFIG.user.member_name;
                        })

                }
            },
            'unlock': {
                index:15,
                name: '解锁',
                className: "unlock",
                icon: 'icon_unlock',
                callback: function () {
                    var file = $scope.selectedFile[0];
                    if (file.lock_member_id != $rootScope.PAGE_CONFIG.member_id) {
                        alert(file.lock_member_name + ' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 ' + file.lock_member_name + ' 先将其解锁。');
                        return;
                    }
                    GK.unlock({
                        webpath: file.fullpath,
                        mountid: $scope.mountId
                    }).then(function () {
                            file.lock = 0;
                            file.lock_member_name = '';
                        })

                }
            },
            'save': {
                index:16,
                name: '保存',
                className: "save",
                icon: 'icon_save',
                accesskeyText:'Ctrl+S',
                callback: function () {
                    if(!$scope.selectedFile || !$scope.selectedFile.length){
                        return;
                    }
                    var files = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        files.push({
                            webpath: value.fullpath
                        })
                    });
                    var params = {
                        list: files,
                        mountid: GKFileList.getOptFileMountId($scope, $rootScope)
                    };

                    GK.saveToLocal(params);
                }
            },
            'del': {
                index: 21,
                name: '删除',
                className: "del",
                icon: 'icon_trash',
                accesskeyText:'Delete',
                callback: function () {
                    if(!$scope.selectedFile || !$scope.selectedFile.length){
                        return;
                    }
                    var fullpathes=[];
                    var mountId = GKFileList.getOptFileMountId($scope, $rootScope);
                    angular.forEach($scope.selectedFile, function (value) {
                        fullpathes.push(value.fullpath);
                    });
                    GKOpt.del(mountId,fullpathes);
                }
            },
            'rename': {
                index: 18,
                name: '重命名',
                className: "rename",
                icon: 'icon_rename',
                callback: function () {
                    var file = $scope.selectedFile[0];
                    $scope.$broadcast('fileEditNameStart', file, function (new_file_name) {
                        if (new_file_name === file.filename) {
                            $scope.$broadcast('fileEditNameEnd');
                        } else {
                            var newpath = Util.String.ltrim(('/' + file.fullpath).replace('/' + file.filename, '/' + new_file_name), '/');
                            GK.rename({
                                oldpath: file.fullpath,
                                newpath: newpath,
                                mountid: $scope.mountId
                            }).then(function () {
                                    file.fullpath = newpath;
                                    file.filename = Util.String.baseName(file.fullpath);
                                    file.ext = Util.String.getExt(file.filename);
                                    $scope.$broadcast('fileEditNameEnd');
                                }, function (error) {
                                    $scope.$broadcast('fileEditNameEnd');
                                    GKException.handleClientException(error);
                                });
                        }

                    });
                }
            },
            'view_property':{
                index: 19,
                name: '属性',
                className: "file_property",
                icon: 'icon_file_property',
                accesskeyText:'Ctrl+P',
                callback: function () {
                    if($scope.selectedFile.length!=1){
                        return;
                    }
                    var file = $scope.selectedFile[0],
                        parentFile = $rootScope.PAGE_CONFIG.file;
                    GKModal.filePropery($scope.mountId,file,parentFile);
                }
            },
            'order_by': {
                index: 20,
                name: '排序方式',
                className: "order_by",
                items: {
                    'order_by_file_name': {
                        name: '文件名',
                        className: 'order_by_file_name' + ($scope.order.indexOf('file_name') >= 0 ? 'current' : ''),
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('filename');
                            });
                        }
                    },
                    'order_by_file_size': {
                        name: '大小',
                        className: 'order_by_file_size' + ($scope.order.indexOf('file_size') >= 0 ? 'current' : ''),
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('filesize');
                            });
                        }
                    },
                    'order_by_file_type': {
                        name: '类型',
                        className: 'order_by_file_type' + ($scope.order.indexOf('file_type') >= 0 ? 'current' : ''),
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('ext');
                            });
                        }
                    },
                    'order_by_last_edit_time': {
                        name: '最后修改时间',
                        className: 'order_by_last_edit_time' + ($scope.order.indexOf('last_edit_time') >= 0 ? 'current' : ''),
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('last_edit_time');
                            })

                        }
                    }
                }
            }
        };

        $scope.rightOpts = [];

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

        var setOpts = function () {
            $rootScope.selectedFile = $scope.selectedFile;
            var isSearch = $scope.keyword.length ? true : false;
            if (isSearch) {
                $scope.filter = 'search';
            }
            var optKeys = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, $scope.selectedFile, $scope.partition, $scope.filter, $scope.PAGE_CONFIG.mount);
            $scope.opts = [];
            $scope.rightOpts = {};
            var topOptKeys = [];
            var excludeRightOpts = []; //右键要排除的操作
            var excludeOpts = ['open_with','view_property','order_by', 'paste', 'copy', 'cut']; // 顶部要排除的操作

            /**
             * 如果选择了文件，那么把currentOpts中的“同步”，“取消同步” 去掉
             */
            if ($scope.selectedFile.length) {
                var currentOpts = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, false, $scope.partition, $scope.filter, $scope.PAGE_CONFIG.mount);
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
                    getOpenWithMenu(GKFileList.getOptFileMountId($scope,$rootScope),$scope.selectedFile[0],allOpts);
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
                    var opt = allOpts[value];
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
                    var opt = allOpts[value];
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

        }
        /**
         * 操作
         * @type {Array}
         */
        $scope.$watch('selectedFile', setOpts, true);
        $scope.$watch('PAGE_CONFIG.file', setOpts, true);
        $scope.$watch('keyword', setOpts, true);
        $scope.$watch('order', function () {
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
        })

        /**
         * 获取剪切板的数据
         * @returns {Array}
         */
        var getCilpFileData = function () {
            var files = [];
            angular.forEach($rootScope.selectedFile, function (value) {
                files.push({
                    webpath: value.fullpath
                })
            });
            return files;
        };

        $scope.$on('shortCuts', function (event,shortcut) {
            var opt = GKOpt.getOptByShortCut(allOpts,shortcut);
            if(opt){
                opt['callback']();
            }
        });

        /**
         * 打开文件
         */
        $scope.$on('openFile', function ($event, file) {
            if (!$scope.PAGE_CONFIG.networkConnected && !file.cache) {
                return;
            }
            GK.open({
                mountid: GKFileList.getOptFileMountId($scope, $rootScope),
                webpath: file.fullpath
            });
        })

        /**
         * 打开文件位置
         */
        $scope.$on('goToFile', function ($event, file) {
            GKPath.gotoFile(GKFileList.getOptFileMountId($scope, $rootScope), file.fullpath);
        })

        /**
         * 拖拽
         */
        $scope.$on('dropFile', function ($event, file) {
            var toMountId = $scope.mountId,
                toFullpath = file.fullpath,
                fromMountId = $scope.mountId,
                fromFullpathes = [];

            angular.forEach($scope.selectedFile, function (value) {
                fromFullpathes.push({
                    webpath: value.fullpath
                });
            });
            var msg = '你确定要将 ' + Util.String.baseName(fromFullpathes[0]['webpath']) + (fromFullpathes.length > 1 ? '等' + fromFullpathes.length + '文件' : '') + ' 移动到 ' + Util.String.baseName(toFullpath) + ' 吗？';
            if (!confirm(msg)) {
                file.hover = false;
                return;
            }

            GKFileOpt.move(toFullpath, toMountId, fromFullpathes, fromMountId).then(function () {
                refreahData();
            }, function () {

            });
        })

        /**
         * 取消收藏
         */
        $scope.$on('unFav', function ($event) {
            GKFileList.removeAllSelectFile($scope);
        })

        $scope.showHint = false;
        if ($rootScope.PAGE_CONFIG.file.syncpath) {
            $scope.showHint = true;
        }

        $scope.$on('goToLocal', function () {
            gkClientInterface.open({
                mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                webpath: $rootScope.PAGE_CONFIG.file.fullpath
            });
        })

        $scope.$on('showSyncSetting', function () {
            GKDialog.openSetting('sync');
        })

        $scope.$on('UpdateWebpath', function (event, param) {
            $scope.$apply(function () {
                var upPath = Util.String.dirName(param.webpath);
                if (upPath == $scope.PAGE_CONFIG.file.fullpath) {
                    refreahData();
                }
            });
        })

        /**
         * 监听系统dragenter
         */
        $scope.$on('dropSysFile', function (event, files) {
            if (
                $scope.partition == GKPartition.subscribeFile
                ) {
                alert('不能在当前路径添加文件');
                return;
            }
            var params = {
                parent: $scope.path,
                type: 'save',
                list: files.list,
                mountid: $scope.mountId
            };
            GK.addFile(params).then(function () {
                refreahData();
            }, function (error) {
                GKException.handleClientException(error);
            })
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
                            refreahData(extraParam.fullpath);
                            break;
                    }
                }else{
                    var forEachFile = function(callback){
                        forEachFullpath(function(path){
                            angular.forEach($scope.fileData,function(value){
                                //console.log(value.fullpath === path && angular.isFunction(callback))
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

        /**
         * 订阅文件的滚动加载
         */
        $scope.scrollLoad = function(){
            if($scope.partition != GKPartition.subscribeFile){
                return;
            }

            var start = $scope.fileData.length;
            if(start>=totalCount) return;
            getFileData(start).then(function(list){
                $scope.fileData =  $scope.fileData.concat(list);
            })
        }

        $scope.$on('clearTrashSuccess',function(event,mountId){
            if($scope.mountId != mountId || $scope.filter != 'trash'){
                return;
            }
            refreahData();
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

            },200)
        }
    }]);



