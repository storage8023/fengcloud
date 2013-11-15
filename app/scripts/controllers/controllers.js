'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('initClient', ['$rootScope', 'GKNews', '$scope', 'GKMount', '$location', 'GKFile', 'GKPartition', function ($rootScope, GKNews, $scope, GKMount, $location, GKFile, GKPartition) {
        $rootScope.PAGE_CONFIG = {
            user: gkClientInterface.getUser(),
            file: {},
            mount: {},
            filter: ''
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
                $rootScope.showNews = true;
                $rootScope.$digest()
            }
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

    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', 'GKSmartFolder', 'GKMount', 'GKFilter', 'GKPartition', 'GKModal', 'GK','GKFileList','GKFileOpt', function ($scope, $location, GKPath, GKFile, $rootScope, GKSmartFolder, GKMount, GKFilter, GKPartition, GKModal, GK,GKFileList,GKFileOpt) {
        $scope.GKPartition = GKPartition;
        var myMount = GKMount.getMyMount(), //我的空间
            orgMount = GKMount.getOrgMounts(),//团队的空间
            subscribeMount = GKMount.getSubscribeMounts(); //订阅的团队

        /**
         * 个人的文件
         * @type {*}
         */

        var getTrashNode = function (mount_id) {
            var node = {
                label: GKFilter.getFilterName('trash'),
                isParent: false,
                dropAble:false,
                data: {
                    fullpath: '',
                    filter: 'trash',
                    mount_id: mount_id
                },
                iconNodeExpand: 'icon_trash',
                iconNodeCollapse: 'icon_trash'
            };
            return node;
        };


        /**
         * 个人的文件
         * @type {*}
         */
        var myTreeData = GKFile.dealTreeData([myMount], GKPartition.myFile);
//        myTreeData[0]['children'] = GKFile.dealTreeData(GKFile.getFileList(myMount.mount_id,'',1), 'myfile', myMount.mount_id);
//        if(!myTreeData[0]['children']) myTreeData[0]['children'] = [];
//        myTreeData[0]['children'].push(getTrashNode(myMount.mount_id));
        $scope.treeList = myTreeData;

        /**
         * 团队的文件
         */

        $scope.orgTreeList = GKFile.dealTreeData(orgMount, GKPartition.teamFile);

        $scope.orgSubscribeList = GKFile.dealTreeData(subscribeMount, GKPartition.teamFile);

        /**
         * 智能文件夹
         * @type {*}
         */
        var smartFolders = GKSmartFolder.getFolders();
        $scope.smartTreeList = GKFile.dealTreeData(smartFolders, GKPartition.smartFolder);

        $scope.$on('removeSmartFolder', function ($event, code) {
            GKSmartFolder.removeSmartFolderByCode(code);
            angular.forEach($scope.smartTreeList, function (value, key) {
                if (value.data.condition == code) {
                    $scope.smartTreeList.splice(key, 1);
                    return false;
                }
            });
            $scope.treeList[0].selected = true;
            $scope.handleSelect($scope.treeList[0], GKPartition.myFile);
        })

        $scope.$on('addSmartFolder', function ($event, name, code) {
            GKSmartFolder.addSmartFolder(name, code);
            var newSmartFolder = GKFile.dealTreeData([
                {name: name, condition: code}
            ], GKPartition.smartFolder)[0];
            $scope.smartTreeList.push(newSmartFolder);
            newSmartFolder.selected = true;
            $scope.handleSelect(newSmartFolder, 'smartfolder');

        })


        /**
         * 初始选中
         * @type {*}
         */
        $scope.selectedMyBranch = null;
        $scope.selectedOrgBranch = null;
        $scope.selectedSmartBranch = null;
        $scope.selectedSubscribleBranch = null;
        $scope.initSelectedBranch = $scope.treeList[0];
        var unSelectAllBranch = function (partition) {
            if (partition != GKPartition.myFile && $scope.selectedMyBranch) {
                $scope.selectedMyBranch.selected = false;
                $scope.selectedMyBranch = null;
            }
            if (partition != GKPartition.teamFile && $scope.selectedOrgBranch) {
                $scope.selectedOrgBranch.selected = false;
                $scope.selectedOrgBranch = null;
            }
            if (partition != GKPartition.smartFolder && $scope.selectedSmartBranch) {
                $scope.selectedSmartBranch.selected = false;
                $scope.selectedSmartBranch = null;
            }
            if (partition != GKPartition.subscribeFile && $scope.selectedSubscribleBranch) {
                $scope.selectedSubscribleBranch.selected = false;
                $scope.selectedSubscribleBranch = null;
            }
        };

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleSelect = function (branch, partition) {
            if (partition != $location.search().partition) {
                unSelectAllBranch(partition);
            }
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

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if (branch.expanded) {
                var list = GKFile.getFileList(branch.data.mount_id, branch.data.fullpath, 1);
                branch.children = GKFile.dealTreeData(list, $location.search().partition, branch.data.mount_id);
                if (!branch.children)  branch.children = [];
                if (!branch.data.fullpath && !branch.data.filter) {
                    branch.children.push(getTrashNode(branch.data.mount_id));
                }
            }
        };


        $scope.handleAdd = function (partition) {
            if (partition == GKPartition.myFile) {
                var backupDialog = GKModal.backUp();
                backupDialog.result.then(function (param) {
                    $location.search(param);
                })
            } else if (partition == GKPartition.teamFile) {
                var createTeamDialog = GKModal.createTeam();
                createTeamDialog.result.then(function (orgId) {
                    gkClientInterface.notice({type: 'getOrg', 'org_id': orgId}, function (param) {
                        $scope.$apply(function(){
                            var newOrg = JSON.parse(param);
                            newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], GKPartition.teamFile)[0];
                            $scope.orgTreeList.push(newOrg);
                        });

                    })
                })
            } else if (partition == GKPartition.subscribeFile) {
                var nearbyDialog = GKModal.nearBy();
                nearbyDialog.opened.then(function(){
                    $rootScope.$on('subscribeTeamSuccess',function(event,orgId){
                        gkClientInterface.notice({type: 'getOrg', 'org_id': orgId}, function (param) {
                            $scope.$apply(function(){
                                var newOrg = JSON.parse(param);
                                newOrg = GKFile.dealTreeData([GKMount.addMount(newOrg)], GKPartition.subscribeFile)[0];
                                $scope.orgSubscribeList.push(newOrg);
                            });
                        })
                    })
                })
            }
        };

        $scope.handleDrop = function(branch){
           var selectedFile = GKFileList.getSelectedFile();
            var file = branch.data;
            var toFullpath = file.fullpath,
                toMountId = file.mount_id,
                fromFullpathes = [],
                fromMountId = $rootScope.PAGE_CONFIG.mount.mount_id;
            angular.forEach(selectedFile,function(value){
                fromFullpathes.push({
                    webpath:value.fullpath
                });
            });
            if(file.mount_id == $rootScope.PAGE_CONFIG.mount.mount_id){
                GKFileOpt.move(toFullpath,toMountId,fromFullpathes,fromMountId);
            }else{
                GKFileOpt.copy(toFullpath,toMountId,fromFullpathes,fromMountId);
            }
        };
    }])
    .controller('fileBrowser', ['$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException', 'GKFile', 'GKCilpboard', 'GKOpt', '$rootScope', '$modal', 'GKApi', '$q', 'GKSearch', 'RestFile', 'GKFileList', 'GKPartition','GKFileOpt', function ($scope, $routeParams, $location, $filter, GKPath, GK, GKException, GKFile, GKCilpboard, GKOpt, $rootScope, $modal, GKApi, $q, GKSearch, RestFile, GKFileList, GKPartition,GKFileOpt) {
        /**
         * 打开时会有一次空跳转
         */
        if (!$routeParams.partition) return;

        /**
         * 分析路径获取参数
         * @type {*}
         */
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.partition = $routeParams.partition || GKPartition.myFile; //当前的分区
        $scope.view = $routeParams ? $routeParams.view || 'list' : 'list'; //当前的视图模式
        $scope.order = '+file_name'; //当前的排序
        $scope.filter = $routeParams.filter || ''; //当前的筛选 [search|trash]
        $scope.selectedpath = $routeParams.selectedpath || ''; //当前目录已选中的文件的路径，允许多选，用|分割
        $scope.fileData = []; //文件列表的数据
        $scope.selectedFile = []; //当前目录已选中的文件数据
        $scope.mountId = $routeParams.mountid || $rootScope.PAGE_CONFIG.mount.mount_id;
        $scope.keyword = $routeParams.keyword || '';
        /**
         * 文件列表数据
         */
        var getFileData = function () {
            var fileList,
                source = 'client',
                deferred = $q.defer();
            /**
             * 我的文件和团队文件夹
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
                    }).error(function () {

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
                    }).error(function () {
                            GKSearch.setSearchState('end');
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
                    }).error(function () {
                            deferred.reject();
                        });

                    /**
                     * 加星标的文件
                     */
                } else if ($scope.filter == 'star') {
                    GKApi.starFileList($scope.filter).success(function (data) {
                        fileList = data['list'];

                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function () {
                            deferred.reject();
                        });
                    /**
                     * 最近访问的文件
                     */
                } else if ($scope.filter == 'recent') {
                    GKApi.recentFileList($scope.filter).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function () {
                            deferred.reject();
                        });
                } else {
                    /**
                     * 智能文件夹
                     */
                    GKApi.smartFolderList($scope.keyword).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function () {
                            deferred.reject();
                        });
                }
            }
            return deferred.promise;
        };


        /**
         * 刷新列表数据
         */
        var refreahData = function () {
            getFileData().then(function (newFileData) {
                $scope.fileData = $filter('orderBy')(newFileData, $scope.order);

            })
        };

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
                    if (setParentFile) {
                        file.syncpath = '';
                    } else {
                        file.sync = 0;
                    }

                });
            } else {
                var syncDialog = $modal.open({
                    templateUrl: 'views/set_sync.html',
                    backdrop: false,
                    windowClass: 'sync_settiong_dialog',
                    controller: function ($scope, $modalInstance) {
                        $scope.filename = file.filename || file.name;
                        $scope.localURI = GK.getLocalSyncURI({
                            mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                            webpath: file.fullpath
                        });
                        $scope.reSetLocalPath = function () {
                            var newPath = GK.selectPath({
                                path: $scope.localURI,
                                disable_root: true
                            });
                            if (newPath) {
                                $scope.localURI = newPath;
                            }
                        };
                        $scope.ok = function () {
                            $modalInstance.close($scope.localURI);
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                    },
                    resolve: {

                    }
                });

                syncDialog.result.then(function (new_local_uri) {
                    var trimPath = Util.String.rtrim(Util.String.rtrim(new_local_uri, '/'), '\\\\');
                    var currentFilename = Util.String.baseName(file.fullpath);
                    if (!confirm('你确定要将文件夹' + currentFilename + '与' + trimPath + '进行同步？')) {
                        return;
                    }
                    var params = {};
                    /**
                     * 检测选择呢的文件夹是否为空
                     */
                    var isNotEmpty = GK.checkPathIsEmpty({
                        path: new_local_uri,
                        type: 'fullpath',
                        dir: 1,
                        mountid: $rootScope.PAGE_CONFIG.mount.mount_id
                    });

                    if (isNotEmpty == 1) { //文件夹为空
                        params = {
                            webpath: file.fullpath,
                            fullpath: new_local_uri,
                            mountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                            overwrite: 1
                        };
                        GK.setLinkPath(params);
                    } else { //文件夹不为空

                    }
                    if (setParentFile) {
                        file.syncpath = file.fullpath;
                    } else {
                        file.sync = 1;
                    }
                });
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


        /**
         * 所有操作
         * @type {{add: {name: string, index: number, callback: Function}, new_folder: {name: string, index: number, callback: Function}, lock: {name: string, index: number, callback: Function}, unlock: {name: string, index: number, callback: Function}, save: {name: string, index: number, callback: Function}, del: {name: string, index: number, callback: Function}, rename: {name: string, index: number, callback: Function}, order_by: {name: string, index: number, items: {order_by_file_name: {name: string, className: string, callback: Function}, order_by_file_size: {name: string, className: string, callback: Function}, order_by_file_type: {name: string, className: string, callback: Function}, order_by_last_edit_time: {name: string, className: string, callback: Function}}}}}
         */
        var allOpts = {
            'create': {
                name: '创建',
                callback: function () {

                }
            },
            'unsubscribe': {
                name: '取消订阅',
                callback: function () {

                }
            },
            'nearby': {
                name: '附近',
                callback: function () {

                }
            },
            'manage': {
                name: '管理',
                callback: function () {

                }
            },
            'clear_trash': {
                name: '清空回收站',
                callback: function () {
                    RestFile.clear($rootScope.PAGE_CONFIG.mount.mount_id).success(function () {
                        refreahData();
                    }).error(function () {
                        });
                }
            },
            'revert': {
                name: '还原',
                callback: function () {
                    var fullpaths = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        fullpaths.push(value.dir == 1 ? value.fullpath + '/' : value.fullpath);
                    });
                    RestFile.recover($rootScope.PAGE_CONFIG.mount.mount_id, fullpaths, '').success(function () {
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
            'del_completely': {
                name: '彻底删除',
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
                name: '同步',
                callback: function () {
                    toggleSync(0);
                }
            },
            'unsync': {
                name: '取消同步',
                callback: function () {
                    toggleSync(1);
                }
            },
            'paste': {
                name: '粘贴',
                callback: function () {
                    var data = GKCilpboard.getData();
                    if (!data || !data.files || !data.mount_id) return;
                    var target = $rootScope.PAGE_CONFIG.file.fullpath;
                    if ($scope.selectedFile.length == 1) {
                        target = $scope.selectedFile[0].fullpath;
                    }

                    if (data.code == 'ctrlC') {
                        GKFileOpt.copy(target,$rootScope.PAGE_CONFIG.mount.mount_id,data.files,data.mount_id).then(function () {
                            refreahData();
                            //$scope.$broadcast('ctrlVEnd', getFileData('test12345'));
                            //GKCilpboard.clearData();
                        }, function (error) {
                            GKException.handleClientException(error);
                        });
                    } else if (data.code == 'ctrlX') {
                        GKFileOpt.move(target,$rootScope.PAGE_CONFIG.mount.mount_id,data.files,data.mount_id).then(function () {
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
                name: '剪切',
                callback: function () {
                    var data = {
                        code: 'ctrlX',
                        mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                        files: getCilpFileData()
                    }
                    GKCilpboard.setData(data);
                }
            },
            'copy': {
                name: '复制',
                callback: function () {
                    var data = {
                        code: 'ctrlC',
                        mount_id: $rootScope.PAGE_CONFIG.mount.mount_id,
                        files: getCilpFileData()
                    };

                    GKCilpboard.setData(data);
                }
            },
            'add': {
                name: '添加',
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
            'new_folder': {
                name: '新建',
                callback: function () {
                    $scope.$broadcast('fileNewFolderStart', function (new_file_name) {
                        var webpath = $scope.path ? $scope.path + '/' + new_file_name : new_file_name;
                        var params = {
                            webpath: webpath,
                            dir: 1,
                            mountid: $scope.mountId
                        };
                        GK.createFolder(params).then(function () {
                            getFileData().then(function (newFileData) {
                                $scope.$broadcast('fileNewFolderEnd', newFileData, webpath);
                            })
                        }, function (error) {
                            GKException.handleClientException(error);
                        });
                    });
                }
            },
            'lock': {
                name: '锁定',
                callback: function () {
                    var file = $scope.selectedFile[0];
                    GK.lock({
                        webpath: file.fullpath,
                        mountid: $scope.mountId
                    })
                    file.lock = 1;
                    file.lock_member_name = $rootScope.PAGE_CONFIG.user.member_name;
                }
            },
            'unlock': {
                name: '解锁',
                callback: function () {
                    var file = $scope.selectedFile[0];
                    if (file.lock_member_id != $rootScope.PAGE_CONFIG.member_id) {
                        alert(file.lock_member_name + ' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 ' + file.lock_member_name + ' 先将其解锁。');
                        return;
                    }
                    GK.unlock({
                        webpath: file.fullpath,
                        mountid: $scope.mountId
                    })
                    file.lock = 0;
                    file.lock_member_name = '';
                }
            },
            'save': {
                name: '保存到',
                callback: function () {
                    var files = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        files.push({
                            webpath: value.fullpath
                        })
                    });
                    var params = {
                        list: files,
                        mountid: $scope.mountId
                    };

                    GK.saveToLocal(params);
                }
            },
            'del': {
                name: '删除',
                index: 5,
                callback: function () {
                    var files = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        files.push({
                            webpath: value.fullpath
                        })
                    });
                    var params = {
                        list: files,
                        mountid: $scope.mountId
                    };
                    var confirmMsg = '确定要删除' + ($scope.selectedFile.length == 1 ? '“' + $scope.selectedFile[0].filename + '”' : '这' + $scope.selectedFile.length + '个文件（夹）') + '吗?';
                    if (!confirm(confirmMsg)) {
                        return;
                    }
                    GK.del(params).then(function () {
                        angular.forEach($scope.selectedFile, function (value) {
                            angular.forEach($scope.fileData, function (file, key) {
                                if (value == file) {
                                    $scope.fileData.splice(key, 1);
                                }
                            })
                        });
                        $scope.selectedFile = [];
                        $scope.selectedIndex = [];
                    }, function (error) {
                        GKException.handleClientException(error);
                    });
                }
            },
            'rename': {
                name: '重命名',
                index: 6,
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
            'order_by': {
                name: '排序方式',
                index: 7,
                items: {
                    'order_by_file_name': {
                        name: '文件名',
                        className: $scope.order.indexOf('file_name') >= 0 ? 'current' : '',
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('filename');
                            });
                        }
                    },
                    'order_by_file_size': {
                        name: '大小',
                        className: $scope.order.indexOf('file_size') >= 0 ? 'current' : '',
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('filesize');
                            });
                        }
                    },
                    'order_by_file_type': {
                        name: '类型',
                        className: $scope.order.indexOf('file_type') >= 0 ? 'current' : '',
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('ext');
                            });
                        }
                    },
                    'order_by_last_edit_time': {
                        name: '最后修改时间',
                        className: $scope.order.indexOf('last_edit_time') >= 0 ? 'current' : '',
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
            var excludeOpts = ['order_by', 'paste', 'copy', 'cut']; // 顶部要排除的操作

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
                    topOptKeys = jQuery.unique(currentOpts.concat(optKeys)).reverse();
                }

            } else {
                topOptKeys = optKeys;
            }

            var extendOpt = function (opt, key, isRightOpt) {
                var extendParam = {};
                if (!isRightOpt) {
                    extendParam['key'] = key;
                }
                /**
                 * 团队文件夹的根目录 将 删除 改为 退出
                 */
                if ($scope.partition == GKPartition.teamFile && key == 'del' && !$rootScope.PAGE_CONFIG.file.fullpath) {
                    extendParam['name'] = '退出';
                }
                return angular.extend(opt, extendParam);
            }


            /**
             * unique后会顺序会反转，所以要reverse
             * @type {*}
             */
            angular.forEach(topOptKeys, function (value) {
                if (excludeOpts.indexOf(value) < 0) {
                    if (allOpts[value]) {
                        var item = extendOpt(allOpts[value], value, false);
                        $scope.opts.push(item);
                    }

                }
            });

            angular.forEach(optKeys, function (value) {
                if (excludeRightOpts.indexOf(value) < 0) {
                    if (allOpts[value]) {
                        var item = extendOpt(allOpts[value], value, true);
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

        /**
         * ctrl-C的 处理函数
         */
        $scope.$on('ctrlC', function () {
            allOpts['copy']['callback']();
        });

        /**
         * ctrl-X的 处理函数
         */
        $scope.$on('ctrlX', function () {
            allOpts['cut']['callback']();
        });

        /**
         * ctrl-V的 处理函数
         */
        $scope.$on('ctrlV', function () {
            allOpts['paste']['callback']();
        });

        /**
         * 打开文件
         */
        $scope.$on('openFile', function ($event, file) {
            GK.open({
                mountid: $location.search().mountid,
                webpath: file.fullpath
            });
        })

        $scope.$on('dropFile', function ($event, file) {
          var toMountId = $scope.mountId,
              toFullpath = file.fullpath,
              fromMountId = $scope.mountId,
              fromFullpathes = [];
            angular.forEach($scope.selectedFile,function(value){
                fromFullpathes.push({
                    webpath:value.fullpath
                });
            });
           GKFileOpt.move(toFullpath,toMountId,fromFullpathes,fromMountId).then(function(){
               refreahData();
           },function(){

           });
        })
    }])
    .controller('header', ['$scope', 'GKPath', '$location', '$filter', 'GKHistory', 'GKApi', '$rootScope', '$document', '$compile', '$timeout', 'GKDialog', 'GKFind', function ($scope, GKPath, $location, $filter, GKHistory, GKApi, $rootScope, $document, $compile, $timeout, GKDialog, GKFind) {
        $scope.testCallback = function () {
            gkClient.gTest(JSON.stringify({a: 1}), function () {
                console.log(arguments);
            }, function () {
                console.log(arguments);
            })
        }

        $scope.canBack = false;
        $scope.canForward = false;

        /**
         * 判断前进后退按钮的状态
         * @type {*}
         */
        $scope.$on('$locationChangeSuccess', function () {
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
                item: "访问网站",
                menuclick: function () {
                    var url = gkClientInterface.getUrl({
                        sso: 1,
                        url: '/storage'
                    });
                    gkClientInterface.openUrl(url);
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
                item: "注销",
                menuclick: function () {
                    gkClientInterface.logOff();
                }
            },
            {
                item: "退出",
                menuclick: function () {
                    gkClientInterface.quit();
                }
            }
        ];

        $scope.showTransfer = function () {
            GKDialog.openTransfer();
        };

    }]);



