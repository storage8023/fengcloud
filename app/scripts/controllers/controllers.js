'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('initClient',['$rootScope','GKNews','$scope','GKMount','$location','GKFile',function($rootScope,GKNews,$scope,GKMount,$location,GKFile){
        $rootScope.PAGE_CONFIG = {
            user:gkClientInterface.getUser(),
            file:{},
            mount:{},
            filter:''
        };
        /**
         * 页面载入时请求消息
         */
        GKNews.requestNews();

        /**
         * 监听消息的通知
         */
        $scope.$on('updateMessage',function(e,data){
            GKNews.appendNews(data);
        })

        /**
         * 监听打开消息的通知
         */
        $scope.$on('showMessage',function(e,data){
            if(!$rootScope.showNews){
                $rootScope.showNews = true;
                $rootScope.$digest()
            }
        })

        /**
         * 监听路径的改变
         */
        $scope.$on('$locationChangeSuccess',function($s,$current){
            var param = $location.search();
            var extend = {
                filter:param.filter||'',
                partition:param.partition,
                view:param.view
            };
            if(['myfile','teamfile'].indexOf(param.partition)>=0){
                extend.file = GKFile.getFileInfo(param.mountid,param.path);
                extend.mount = GKMount.getMountById(param.mountid)
            }else{
                extend.file = {};
                extend.mount = {};
            }
            angular.extend($rootScope.PAGE_CONFIG,extend);
        })

    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', 'GKSmartFolder','GKMount','GKFilter',function ($scope, $location, GKPath, GKFile, $rootScope,GKSmartFolder,GKMount,GKFilter) {

        var myMount = GKMount.getMyMount(), //我的空间
            orgMount = GKMount.getOrgMounts(); //团队的空间

        /**
         * 个人的文件
         * @type {*}
         */

        var getTrashNode = function(mount_id){
            var node = {
                label: GKFilter.getFilterName('trash'),
                isParent:false,
                data: {
                    fullpath: '',
                    filter:'trash',
                    mount_id: mount_id
                },
                iconNodeExpand:'icon_trash',
                iconNodeCollapse:'icon_trash'
            };
            return node;
        };


        /**
         * 个人的文件
         * @type {*}
         */
        var myTreeData = GKFile.dealTreeData([myMount], 'myfile');
        myTreeData[0]['children'] = GKFile.dealTreeData(GKFile.getFileList(myMount.mount_id,'',1), 'myfile', myMount.mount_id);
        if(!myTreeData[0]['children']) myTreeData[0]['children'] = [];
        myTreeData[0]['children'].push(getTrashNode(myMount.mount_id));
        $scope.treeList = myTreeData;

        /**
         * 团队的文件
         */

        $scope.orgTreeList = GKFile.dealTreeData(orgMount, 'teamfile');

        /**
         * 智能文件夹
         * @type {*}
         */
        var smartFolders = GKSmartFolder.getFolders();
        $scope.smartTreeList = GKFile.dealTreeData(smartFolders, 'magic');

        $scope.$on('removeSmartFolder',function($event,code){
            GKSmartFolder.removeSmartFolderByCode(code);
            angular.forEach($scope.smartTreeList,function(value,key){
                if(value.data.condition == code){
                    $scope.smartTreeList.splice(key,1);
                    return false;
                }
            });
            $scope.treeList[0].selected = true;
            $scope.handleSelect($scope.treeList[0],'myfile');
        })

        $scope.$on('addSmartFolder',function($event,name,code){
            console.log(name);
            GKSmartFolder.addSmartFolder(name,code);
            var newSmartFolder = GKFile.dealTreeData([{name:name,condition:code}], 'magic')[0];
            $scope.smartTreeList.push(newSmartFolder);
            newSmartFolder.selected = true;
            $scope.handleSelect(newSmartFolder,'smartfolder');

        })


        /**
         * 初始选中
         * @type {*}
         */
        $scope.selectedMyBranch = null;
        $scope.selectedOrgBranch = null;
        $scope.selectedSmartBranch = null;
        $scope.initSelectedBranch = $scope.treeList[0];
        var unSelectAllBranch = function (partition) {
            if (partition != 'myfile' && $scope.selectedMyBranch) {
                $scope.selectedMyBranch.selected = false;
                $scope.selectedMyBranch = null;
            }
            if (partition != 'teamfile' && $scope.selectedOrgBranch) {
                $scope.selectedOrgBranch.selected = false;
                $scope.selectedOrgBranch = null;
            }
            if (partition != 'smartfolder' && $scope.selectedSmartBranch) {
                $scope.selectedSmartBranch.selected = false;
                $scope.selectedSmartBranch = null;
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
            if (partition == 'myfile' || partition == 'teamfile') {
                pararm['path'] = branch.data.fullpath;
                pararm['mountid'] = branch.data.mount_id;
                pararm['filter'] = branch.data.filter||'';
            } else if (partition == 'smartfolder') {
                pararm['filter'] = branch.data.filter;
                if(pararm['filter'] =='search'){
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
                var list = GKFile.getFileList(branch.data.mount_id,branch.data.fullpath,1);
                branch.children = GKFile.dealTreeData(list, $location.search().partition, branch.data.mount_id);
                if(!branch.children)  branch.children = [];
                if(branch.data.org_id !=0 && !branch.data.fullpath){
                    branch.children.push(getTrashNode(branch.data.mount_id));
                }
            }
        };

    }])
    .controller('fileBrowser', ['$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException', 'GKFile', 'GKCilpboard', 'GKOpt', '$rootScope', '$modal', 'GKApi', '$q','GKSearch','RestFile','GKFileList',function ($scope, $routeParams, $location, $filter, GKPath, GK, GKException, GKFile, GKCilpboard, GKOpt, $rootScope, $modal, GKApi,$q,GKSearch,RestFile,GKFileList) {
        /**
         * 打开时会有一次空跳转
         */
       if(!$routeParams.partition) return;

        GKFileList.setSelectFile();
        /**
         * 分析路径获取参数
         * @type {*}
         */
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.partition = $routeParams.partition || 'myfile'; //当前的分区
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
            if ($scope.partition == 'myfile' || $scope.partition == 'teamfile') {
                /**
                 * 回收站
                 */
                if($scope.filter == 'trash'){
                    source = 'api';
                    RestFile.recycle($scope.mountId, '').success(function(data){
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){

                    })
                    /**
                     * 搜索
                     */
                }else if($scope.filter=='search'){
                    source = 'api';
                    GKSearch.setSearchState('loading');
                    var condition = GKSearch.getCondition();
                    GKApi.searchFile(condition,$scope.mountId).success(function (data) {
                        GKSearch.setSearchState('end');
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function () {
                            GKSearch.setSearchState('end');
                        });
                    /**
                     * 获取文件列表
                     */
                }else{
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
                    }).error(function(){
                            deferred.reject();
                        });

                    /**
                     * 加星标的文件
                     */
                } else if ($scope.filter == 'star') {
                    GKApi.starFileList($scope.filter).success(function (data) {
                        fileList = data['list'];

                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                    /**
                     * 最近访问的文件
                     */
                } else if ($scope.filter == 'recent') {
                    GKApi.recentFileList($scope.filter).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                } else {
                    /**
                     * 智能文件夹
                     */
                    GKApi.smartFolderList($scope.keyword).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                }
            }
            return deferred.promise;
        };


        /**
         * 通过路径选中文件
         * @param path
         */
//        var selectFileByPath = function(path){
//            angular.forEach($scope.fileData,function(value){
//                if(value.fullpath === path){
//                    selectFile(value);
//                }
//            });
//        }

        /**
         * 刷新列表数据
         */
        var refreahData = function () {
            getFileData().then(function(newFileData){
                $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
//                if($scope.selectedpath){
//                    var selectPathArr = $scope.selectedpath.split('|');
//                    angular.forEach(selectPathArr,function(value){
//                        $scope.multiSelect = true;
//                        selectFileByPath(value);
//                        $scope.multiSelect = false;
//                    });
//                }
            })

        };

        /**
         * 监听侧边栏的搜索
         */
        $scope.$on('invokeSearch',function($event){
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
            if($scope.selectedFile&&$scope.selectedFile.length==1){
                setParentFile = false;
                file = $scope.selectedFile[0];
            }else{
                file = $rootScope.PAGE_CONFIG.file;
            }
            if (isSync) { //取消同步
                if (!confirm('确定取消同步"' + file.filename + '" 吗？取消后，两个文件夹将来发生的变化不会相互同步。')) {
                    return;
                }
                params = {
                    webpath: file.fullpath,
                    mount_id: $rootScope.PAGE_CONFIG.mount.mount_id
                }
                GK.removeLinkPath(params).then(function () {
                    if(setParentFile){
                        file.syncpath = '';
                    }else{
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
                    if(setParentFile){
                        file.syncpath = file.fullpath;
                    }else{
                        file.sync = 1;
                    }
                }, function () {

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
            'clear_trash':{
                name: '清空回收站',
                callback: function () {
                    RestFile.clear($rootScope.PAGE_CONFIG.mount.mount_id).success(function(){
                        refreahData();
                    }).error(function(){
                            console.log(2);
                        });
                }
            },
            'revert':{
                name: '还原',
                callback: function () {
                    var fullpaths = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        fullpaths.push(value.dir==1?value.fullpath+'/':value.fullpath);
                    });
                    RestFile.recover($rootScope.PAGE_CONFIG.mount.mount_id,fullpaths,'').success(function(){
                        //console.log(1);
                        angular.forEach($scope.selectedFile, function (value) {
                            angular.forEach($scope.fileData, function (file, key) {
                                if (value == file) {
                                    $scope.fileData.splice(key, 1);
                                }
                            })
                        });
                        $scope.selectedFile = [];
                        $scope.selectedIndex = [];
                    }).error(function(){

                        });
                }
            },
            'del_completely':{
                name: '彻底删除',
                callback: function () {
                    var fullpaths = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        fullpaths.push(value.dir==1?value.fullpath+'/':value.fullpath);
                    });
                    RestFile.delCompletely($rootScope.PAGE_CONFIG.mount.mount_id,fullpaths).success(function(){
                        angular.forEach($scope.selectedFile, function (value) {
                            angular.forEach($scope.fileData, function (file, key) {
                                if (value == file) {
                                    $scope.fileData.splice(key, 1);
                                }
                            })
                        });
                        $scope.selectedFile = [];
                        $scope.selectedIndex = [];
                    }).error(function(){

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
                    if(!data || !data.files || !data.mount_id) return;
                    var params = {
                        target: $rootScope.PAGE_CONFIG.file.fullpath,
                        targetmountid: $rootScope.PAGE_CONFIG.mount.mount_id,
                        from_mountid: data.mount_id,
                        from_list: data.files
                    };
                    if (data.code == 'ctrlC') {
                        GK.copy(params).then(function () {
                            refreahData();
                            //$scope.$broadcast('ctrlVEnd', getFileData('test12345'));
                            //GKCilpboard.clearData();
                        }, function (error) {
                            GKException.handleClientException(error);
                        });
                    } else if (data.code == 'ctrlX') {
                        GK.move(params).then(function () {
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
                            getFileData().then(function(newFileData){
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
                name: '另存为',
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
            if(isSearch){
                $scope.filter = 'search';
            }
            var optKeys = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, $scope.selectedFile, $scope.partition, $scope.filter);
            $scope.opts = [];
            $scope.rightOpts = {};
            var topOptKeys=[];
            var excludeRightOpts = ['add','sync','unsync']; //右键要排除的操作
            var excludeOpts = ['order_by','paste','copy','cut']; // 顶部要排除的操作


            /**
             * 如果选择了文件，那么把currentOpts中的“同步”，“取消同步” 去掉
             */
            if($scope.selectedFile.length){
                var currentOpts = GKOpt.getOpts($rootScope.PAGE_CONFIG.file, false, $scope.partition, $scope.filter);
                angular.forEach(['sync','unsync'],function(value){
                    var index = currentOpts.indexOf(value);
                    if(index>=0){
                        currentOpts.splice(index,1);
                    }
                })
                topOptKeys = jQuery.unique(currentOpts.concat(optKeys)).reverse();
            }else{
                topOptKeys = optKeys;
            }

            /**
             * unique后会顺序会反转，所以要reverse
             * @type {*}
             */

            angular.forEach(topOptKeys, function (value) {
                if (excludeOpts.indexOf(value) < 0) {
                    $scope.opts.push(angular.extend(allOpts[value], {key: value}));
                }
            });

            angular.forEach(optKeys, function (value) {
                if (excludeRightOpts.indexOf(value) < 0) {
                    $scope.rightOpts[value] = allOpts[value];
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
        var getCilpFileData = function(){
            var files = [];
            angular.forEach($rootScope.selectedFile,function(value){
                files.push({
                    webpath:value.fullpath
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

    }])
    .controller('header', ['$scope', 'GKPath', '$location', '$filter', 'GKHistory', 'GKApi', '$rootScope','$document','$compile','$timeout','GKDialog','GKFind',function ($scope, GKPath, $location, $filter, GKHistory, GKApi, $rootScope,$document,$compile,$timeout, GKDialog,GKFind) {
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
            $scope.path = $rootScope.PAGE_CONFIG.file.fullpath ||'';
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

	    $scope.queueOpen = function(){
             GKDialog.openTransfer();
	    }

        $scope.items = [
            {
               item: "访问网站",
                menuclick:function(){
                    var url = gkClientInterface.setGetUrl({
                        sso:1,
                        url:'/storage'
                    });
                    gkClientInterface.openUrl(url);
                }
            },{
                item:"设置",
                menuclick:function(){
                    GKDialog.openSetting();
                }
            },{
                item:"帮助",
                menuclick:function(){
                    var url = gkClientInterface.setGetUrl({
                        sso:1,
                        url:'/help'
                    });
                    gkClientInterface.openUrl(url);
                }
            },{
                item:"关于",
                menuclick:function(){
                    var url = gkClientInterface.setGetUrl({
                        sso:1,
                        url:'/about'
                    });
                    gkClientInterface.openUrl(url);
                }
            },{
                item:"注销",
                menuclick:function(){
                    gkClientInterface.logOff();
                }
            },{
                item:"退出",
                menuclick:function(){
                    gkClientInterface.quit();
                }
            }
        ];

        $rootScope.showNearBy = false;
        $scope.toogleNearBy = function(){
            GKFind.toogleFind();
        };

    }]);

/**
 * personal
 */
angular.module("gkPersonalApp.controllers", [])
    .controller("personalCtrl", ['$scope', 'GKApi', '$http','GKDialog','$q',function ($scope, GKApi, $http,GKDialog,$q){
        /**
         *待加入团队
         */
        var invitePendingHttp = function () {
            var deferred = $q.defer();
            GKApi.teamInvitePending().success(function ($http) {
                var message = [];
                message = $http.invite_pending;
                deferred.resolve(message);
            });
            return deferred.promise;
        }
        var promiseMember = invitePendingHttp();
        promiseMember.then(function(data){
            var handleData = [];
            for(var i = 0,len = data.length;i<len;i++){
                handleData.push({org_id:data[i].org_id,
                                org_name:data[i].org_name,
                                code:data[i].code,
                                type:'待加入',
                                join:'加入',
                                refuse:'拒绝'
                });
            }
            $scope.createTeamData = handleData;
            $scope.perjoin = function(id,code){
                var joinData = [],
                    joinHandleData = [];
                GKApi.teamInviteJoin(id,code).success(function ($http) {

                });
                joinData = $scope.createTeamData;
                for(var i = 0,len = joinData.length;i<len;i++){
                    if(joinData[i].org_id === id){
                        joinHandleData.push({org_id:joinData[i].org_id,
                            org_name:joinData[i].org_name,
                            code:joinData[i].code,
                            type:'已加入'
                        });
                    }else{
                        joinHandleData.push(joinData[i]);
                    }
                }
                $scope.createTeamData = joinHandleData;
            }
            $scope.perinvitereject = function(id,code){
                var joinData = [],
                    joinHandleData = [];
                GKApi.teamInviteReject(id,code).success(function ($http) {

                });
                joinData = $scope.createTeamData;
                for(var i = 0,len = joinData.length;i<len;i++){
                    if(joinData[i].org_id !== id){
                        joinHandleData.push(joinData[i]);
                    }
                }
                $scope.createTeamData = joinHandleData;
            }
        });

        /**
         * 修改个人信息
         */
        $scope.modifyInformation = function(){
            var data = {
                url: '/my ',
                sso: 1
            }
            var dataUrl = gkClientInterface.setGetUrl(data);
            var params = {
                url:dataUrl,
                type:"normal",
                width:760,
                resize:1,
                height:450
            }
            gkClientInterface.setMain(params);
        }

        /**
         * 管理团队
         */
         $scope.permanagement = function(id){
             var urlData = '/manage?org_id='+id;
             var data = {
                 url: urlData,
                 sso: 1
             }
             var dataUrl = gkClientInterface.setGetUrl(data);
             var params = {
                 url:dataUrl,
                 type:"normal",
                 width:760,
                 resize:1,
                 height:450
             }
             gkClientInterface.setMain(params);
        }

        /**
         * 退出团队
         */
        $scope.perquit = function(id){
            var r=confirm("确定退出团队？");
            if (r==true)
            {
                GKApi.teamQuit(id).success(function ($http) {

                });
            }
        }

        /**
         *创建团队跳转
         @param $scope
         */
        $scope.setupteam = function ($scope) {
            var data = {
                url: '/mount/create_team',
                sso: 1
            }
            var dataUrl = gkClientInterface.setGetUrl(data);
            var params = {
                url:dataUrl,
                type:"normal",
                width:760,
                resize:1,
                height:450
            }
            gkClientInterface.setMain(params);
        }

        /**
         *注销账号
         */
        $scope.peraccount = function(){
            gkClientInterface.setLogoff();
        }

        /**
         * 打开设置页
         * @param $scope
         */
        $scope.sitOpen = function ($scope) {
            GKDialog.openSetting("contentdevice");
        }

        /**
         *  团队信息处理
         */
        var perside = function (data) {
            var newData = []
            for (var i = 0, len = data.length; i < len; i++) {
                if (data[i].orgid > 0) {
                    if (data[i].type === 0) {
                        newData.push({ "name": data[i].name, "admin": "超级管理员", "management": "管理", "org_id": data[i].orgid, "orgphoto": data[i].orgphoto});
                    } else if (data[i].type === 1) {
                        newData.push({ "name": data[i].name, "admin": "管理员", "management": "管理", "quit": "退出", "orgphoto": data[i].orgphoto});
                    } else {
                        newData.push({ "name": data[i].name, "quit": "退出", "orgphoto": data[i].orgphoto});
                    }
                }
            }
            return newData;
        }

        /**
         * 个人硬盘已使用处理
         * @param data
         * @returns {Array}
         */
        var useBitSize = function (data) {
            var usesize = [];
            for (var i = 0, len = data.length; i < len; i++) {
                if (data[i].orgid === 0) {
                    usesize.push({"use": data[i].use});
                }
            }
            return usesize;
        }

        /**
         * 个人信息处理
         *  @type {*}
         */
        var guserInformation = function (data) {
            var guserData = []
                guserData.push({"member_email": data.member_email, "member_name": data.member_name, "member_id": data.member_id,"member_phone": '电话：' +data.member_phone,"photourl": data.photourl});
            return guserData;
        }
        var perHavaNoteam = function (scope, havajoin, nojoin) {
            if (havajoin.length === 0 && nojoin.length === 0) {
                scope.haveNoTeam = 'noTeam';
            } else {
                scope.haveNoTeam = 'haveTeam';
            }
        }

    var perCtrl = function(){
        //个人信息
        $scope.guser_info = guserInformation(JSON.parse(gkClientInterface.getUserInfo()))[0];
        //团队信息
        $scope.per_gSideTreeList = gkClientInterface.getSideTreeList({"sidetype":"org"}).list;
        $scope.perNewgSideTreeList = perside($scope.per_gSideTreeList);
        $scope.perUseBitSize = useBitSize($scope.per_gSideTreeList);
        $scope.size_space = Util.Number.bitSize($scope.perUseBitSize[0].use);
        //打开窗口
        invitePendingHttp();
        perHavaNoteam($scope, $scope.guser_info, $scope.createTeamData);
    }
    perCtrl();

    /**
     * 关闭窗口
     */
    $scope.perclose = function(){
        gkClientInterface.setClose();
    }

}]);

/**
 * site
 */
angular.module("gkSiteApp.controllers", [])
    .controller("siteCtrl",['$scope', 'GKApi', '$http','$q','$location', function ($scope,GKApi, $http,$q,$location) {
        var time = null;
        /**
         * 选择语言处理
         */
        $scope.siteChangeLanguage = function () {
            $scope.items = [
                {name: '简体中文', type: 0 },
                {name: '英文', type: 1 }
            ];
            $scope.changeLanguage = JSON.parse(gkClientInterface.getLanguage());
            $scope.item = $scope.items[$scope.changeLanguage.type];
        }

        /**
         * 打开设置
         * 数据处理
         */
        $scope.SiteOpen = function () {
            $scope.siteChangeLanguage();
            $scope.getsitedata = JSON.parse(gkClientInterface.getClientInfo());
            $scope.startStop = $scope.getsitedata.startsync;
            $scope.configpath = $scope.getsitedata.configpath;
            $scope.auto = (typeof $scope.getsitedata.auto === 'number') ? $scope.getsitedata.auto === 1 ? true : false : $scope.getsitedata.auto;
            $scope.prompt = (typeof $scope.getsitedata.prompt === 'number') ? $scope.getsitedata.prompt === 1 ? true : false : $scope.getsitedata.prompt;
            $scope.recycle = (typeof $scope.getsitedata.recycle === 'number') ? $scope.getsitedata.recycle === 1 ? true : false : $scope.getsitedata.recycle;
            $scope.local = (typeof $scope.getsitedata.local === 'number') ? $scope.getsitedata.local === 1 ? true : false : $scope.getsitedata.local;
            $scope.https = (typeof $scope.getsitedata.https === 'number') ? $scope.getsitedata.https === 1 ? true : false : $scope.getsitedata.https;
            $scope.proxy = (typeof $scope.getsitedata.proxy === 'number') ? $scope.getsitedata.proxy === 1 ? true : false : $scope.getsitedata.proxy
        }
        $scope.SiteOpen();
        /**
         *设置代理
         */
        $scope.siteagent = function () {
            gkClientInterface.setSettings();
        }
        /**
         * 清除缓存
         */
        $scope.siteClearCache = function () {
            var r=confirm("确定要清除缓存数据？");
            if (r==true)
            {
                gkClientInterface.setClearCache();
            }
        }

        /**
         * 移动数据处理
         */
        $scope.siteadvancepathdlg = function(){
            var configPath = gkClientInterface.selectPath(true);
            if(configPath !== ''){
                $scope.configpath= configPath;
                $scope.configPathInter = configPath;
            }
        }

        /**
         * sync数据处理
         */
        $scope.siteSyncData = function(){
            var sildbarSyncData = [],
                syncData = [];
            var data;
            data = {
                type:"sync"
            }
            $scope.sildbarSync = JSON.parse(gkClientInterface.getTransList(data));
            console.log($scope.sildbarSync);
            syncData = $scope.sildbarSync.list;
            if( $scope.startStop ===1){
                $scope.sync = siteSyncStart(syncData);
                $scope.startsync = "暂停所有同步";
            }else{
                $scope.sync = siteSyncStop(syncData);
                $scope.startsync = "恢复所有同步";
            }
            $scope.siteSyncClick = function(data){
                if( data === "暂停所有同步" ){
                    $scope.sync = siteSyncStart(syncData);
                    $scope.startsync = "暂停所有同步";
                    $scope.startStop = 1;
                    gkClientInterface.setStartSync();
                }else{
                    $scope.sync = siteSyncStop(syncData);
                    $scope.startsync = "恢复所有同步";
                    $scope.startStop = 0;
                    gkClientInterface.setStopSync();
                }
            }
        }

        /**
         * 3秒刷新数据
         */
        $scope.siteSyncAgainData = function(){
            var time = setInterval(function(){
                $scope.$apply(function(){
                    $scope.siteSyncData();
                });
            }, 3000);
        }
        $scope.siteSyncAgainData();

        /**
         * 左侧栏同步单击事件
         */
        $scope.siteSildbarSync = function(){
            $scope.siteSyncData();
            $scope.siteSyncAgainData();
        }

        /**
         * 接口数据再处理
         * @param data
         * @returns {Array}
         */
        var siteSyncStart = function(data){
            var sync = [];
            for(var i= 0,len = data.length;i<len;i++){
                if(!data[i].num){
                    sync.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,num:data[i].num,finish:'完成同步'});
                }else{
                    sync.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,num:data[i].num,finish:data[i].num+'项正在同步'});
                }
            }
            return sync;
        }

        /**
         * 暂停数据处理
         * @param data
         * @returns {Array}
         */
        var siteSyncStop = function(data){
            var sync = [];
            for(var i= 0,len = data.length;i<len;i++){
                sync.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,num:data[i].num,finish:'暂停同步'});
            }
            return sync;
        }

        /**
         * 取消同步数据处理
         * @param webpath
         * @param mountid
         */
        $scope.syncCancel = function(index,webpath,mountid){
            var r=confirm("取消同步的话，该同步文件夹会消失");
            var data = {
                webpath:webpath,
                mountid:mountid
            }
            if (r==true)
            {
                $scope.sync.splice(index, 1);
                gkClientInterface.setRemoveLinkPaths(data);
            }
        }
        /**
         * device数据处理
         */
        $scope.deviceSildeButton = function(){
            var deviceListHttp = function() {
                var deferred = $q.defer();
                GKApi.devicelist().success(function ($http){
                    var message = [];
                    message = $http;
                    deferred.resolve(message);
                })
                return deferred.promise;
            }
            var promiseMember = deviceListHttp();
            promiseMember.then(function(data){
                var siteDevices = []
                    ,siteDevicesData = [];
                $scope.devices = data;
                siteDevices =  $scope.devices.devices;
                for(var i = 0,len = siteDevices.length;i<len;i++){
                    if(siteDevices[i].is_current_device === 0){
                        if(siteDevices[i].state === "1"){
                            if(siteDevices[i].allow_delete === 1){
                                siteDevicesData.push({allow_edit:siteDevices[i].allow_edit,
                                    allow_delete:siteDevices[i].allow_delete,
                                    device_id:siteDevices[i].device_id,
                                    device_name:siteDevices[i].device_name,
                                    last_activity:siteDevices[i].last_activity,
                                    os_name:siteDevices[i].os_name,
                                    os_version:siteDevices[i].os_version,
                                    state:siteDevices[i].state,
                                    startban:'禁止',
                                    deleban:'删除'
                                });
                            }else{
                                siteDevicesData.push({allow_edit:siteDevices[i].allow_edit,
                                    allow_delete:siteDevices[i].allow_delete,
                                    device_id:siteDevices[i].device_id,
                                    device_name:siteDevices[i].os_name,
                                    last_activity:siteDevices[i].last_activity,
                                    os_name:siteDevices[i].device_name,
                                    os_version:'浏览器',
                                    state:siteDevices[i].state,
                                    startban:'禁止',
                                });
                            }
                        }else if(siteDevices[i].allow_delete === 1){
                            siteDevicesData.push({allow_edit:siteDevices[i].allow_edit,
                                allow_delete:siteDevices[i].allow_delete,
                                device_id:siteDevices[i].device_id,
                                device_name:siteDevices[i].device_name,
                                last_activity:siteDevices[i].last_activity,
                                os_name:siteDevices[i].os_name,
                                os_version:siteDevices[i].os_version,
                                state:siteDevices[i].state,
                                startban:'激活',
                                startbancolor:'starblue',
                                devicesicon:'deviceiconclick',
                                deleban:'删除'
                            });
                        }else{
                            siteDevicesData.push({allow_edit:siteDevices[i].allow_edit,
                                allow_delete:siteDevices[i].allow_delete,
                                device_id:siteDevices[i].device_id,
                                device_name:siteDevices[i].os_name,
                                last_activity:siteDevices[i].last_activity,
                                os_name:siteDevices[i].device_name,
                                os_version:'浏览器',
                                state:siteDevices[i].state,
                                startban:'激活',
                                devicesicon:'deviceiconclick',
                                startbancolor:'starblue'
                            });
                        }
                    }
                    else{
                        siteDevicesData.push({allow_edit:siteDevices[i].allow_edit,
                            allow_delete:siteDevices[i].allow_delete,
                            device_id:siteDevices[i].device_id,
                            device_name:siteDevices[i].device_name,
                            last_activity:siteDevices[i].last_activity,
                            os_name:siteDevices[i].os_name,
                            os_version:siteDevices[i].os_version,
                            currentban:"当前设备"
                        });
                    }
                }
                $scope.sitedevices = siteDevicesData;

                /**
                 * 启动禁止数据处理
                 * @param state
                 * @param device_id
                 * @param startbandata
                 */
                $scope.banstart = function(state,device_id,startbandata,del){
                    var banstartDevices = [],
                        bansitedevices = [];
                    banstartDevices =   $scope.sitedevices;
                    if(state === '0'){
                        GKApi.toggledevice(state,device_id).success(function(){

                        })
                        for(var i = 0,len = banstartDevices.length;i<len;i++){
                            if( banstartDevices[i].device_id === device_id){
                                if(siteDevices[i].allow_delete === 1){
                                    bansitedevices.push({allow_edit:siteDevices[i].allow_edit,
                                        allow_delete:siteDevices[i].allow_delete,
                                        device_id:siteDevices[i].device_id,
                                        device_name:siteDevices[i].device_name,
                                        last_activity:siteDevices[i].last_activity,
                                        os_name:siteDevices[i].os_name,
                                        os_version:siteDevices[i].os_version,
                                        state:'1',
                                        startban:'禁止',
                                        deleban:'删除'
                                    });
                                }else{
                                    bansitedevices.push({allow_edit:siteDevices[i].allow_edit,
                                        allow_delete:siteDevices[i].allow_delete,
                                        device_id:siteDevices[i].device_id,
                                        device_name:siteDevices[i].os_name,
                                        last_activity:siteDevices[i].last_activity,
                                        os_name:siteDevices[i].device_name,
                                        os_version:'浏览器',
                                        state:'1',
                                        startban:'禁止',
                                    });
                                }
                            }else{
                                bansitedevices.push(banstartDevices[i]);
                            }
                            $scope.sitedevices = bansitedevices;
                        }
                    }else if(state === '1'){
                        if(del === '1'){
                            var r=confirm("禁止此设备会导致设备无法登录");
                            if (r===true)
                            {
                                GKApi.toggledevice(state,device_id).success(function (){

                                })
                                for(var i = 0,len = banstartDevices.length;i<len;i++){
                                    if( banstartDevices[i].device_id === device_id){
                                        if(siteDevices[i].allow_delete === 1){
                                            bansitedevices.push({allow_edit:siteDevices[i].allow_edit,
                                                allow_delete:siteDevices[i].allow_delete,
                                                device_id:siteDevices[i].device_id,
                                                device_name:siteDevices[i].device_name,
                                                last_activity:siteDevices[i].last_activity,
                                                os_name:siteDevices[i].os_name,
                                                os_version:siteDevices[i].os_version,
                                                state:'0',
                                                startban:'激活',
                                                devicesicon:'deviceicon',
                                                startbancolor:'starblueclick',
                                                deleban:'删除'
                                            });
                                        }else{
                                            bansitedevices.push({allow_edit:siteDevices[i].allow_edit,
                                                allow_delete:siteDevices[i].allow_delete,
                                                device_id:siteDevices[i].device_id,
                                                device_name:siteDevices[i].os_name,
                                                last_activity:siteDevices[i].last_activity,
                                                os_name:siteDevices[i].device_name,
                                                os_version:'浏览器',
                                                state:'0',
                                                startban:'激活',
                                                devicesicon:'deviceiconclick',
                                                startbancolor:'starblue'
                                            });
                                        }
                                    }else{
                                        bansitedevices.push(banstartDevices[i]);
                                    }
                                }
                                $scope.sitedevices = bansitedevices;
                            }
                        }else if(del === '0'){
                            var r=confirm("禁止网页版会导致所有设备都无法以网页方式登录");
                            if (r==true)
                            {
                                GKApi.toggledevice(state,device_id).success(function (){
                                })
                                for(var i = 0,len = banstartDevices.length;i<len;i++){
                                    if( banstartDevices[i].device_id === device_id){
                                        if(siteDevices[i].allow_delete === 1){
                                            bansitedevices.push({allow_edit:siteDevices[i].allow_edit,
                                                allow_delete:siteDevices[i].allow_delete,
                                                device_id:siteDevices[i].device_id,
                                                device_name:siteDevices[i].device_name,
                                                last_activity:siteDevices[i].last_activity,
                                                os_name:siteDevices[i].os_name,
                                                os_version:siteDevices[i].os_version,
                                                state:'0',
                                                startban:'激活',
                                                startbancolor:'starblue',
                                                devicesicon:'deviceiconclick',
                                                deleban:'删除'
                                            });
                                        }else{
                                            bansitedevices.push({allow_edit:siteDevices[i].allow_edit,
                                                allow_delete:siteDevices[i].allow_delete,
                                                device_id:siteDevices[i].device_id,
                                                device_name:siteDevices[i].os_name,
                                                last_activity:siteDevices[i].last_activity,
                                                os_name:siteDevices[i].device_name,
                                                os_version:'浏览器',
                                                state:'0',
                                                devicesicon:'deviceiconclick',
                                                startban:'激活',
                                                startbancolor:'starblue'
                                            });
                                        }
                                    }else{
                                        bansitedevices.push(banstartDevices[i]);
                                    }
                                }

                            }
                            $scope.sitedevices = bansitedevices;
                        }
                    }
                }
                $scope.changeNewDevice = function(){

                }
            })


            /**
             * 删除数据处理
             * @param device_id
             * @param index
             */
            $scope.siteSyncDelete = function(device_id,index){
                var r=confirm("删除此设备会在列表中把该条记录删除");
                if (r==true)
                {
                    GKApi.deldevice(device_id).success(function (){
                    })
                    $scope.sitedevices.splice(index, 1);
                }
            }
        }



        /**
         * 左侧栏单击事件
         */
        $scope.siteSidebar = 'contentUniversal';
        $scope.univerDevice = function(){
            if($location.search().tab === 'contentdevice'){
                $scope.deviceSildeButton();
                $scope.device = true;
                $scope.siteSidebar = 'contentdevice';
                $scope.universal = "false";
                $scope.synchronous = "";
                $scope.network = "";
                $scope.advanced = "";
            }
        }
        $scope.univerDevice();
        $scope.siteuniversal = function () {
            $scope.universal = true;
            $scope.siteSidebar = 'contentUniversal';
            $scope.device = "false";
            $scope.synchronous = "";
            $scope.network = "";
            $scope.advanced = "";
        }
        $scope.sitedevice = function () {
            $scope.device = true;
            $scope.siteSidebar = 'contentdevice';
            $scope.universal = "false";
            $scope.synchronous = "";
            $scope.network = "";
            $scope.advanced = "";
        }
        $scope.sitesynchronous = function () {
            $scope.siteSidebar = 'contentSynchronous';
            $scope.synchronous = true;
            $scope.universal = "false";
            $scope.device = "false";
            $scope.network = "";
            $scope.advanced = "";
        }
        $scope.sitenetwork = function () {
            $scope.siteSidebar = 'contentNetwork';
            $scope.network = true;
            $scope.universal = "false";
            $scope.device = "false";
            $scope.synchronous = "";
            $scope.advanced = "";
        }
        $scope.siteadvanced = function () {
            $scope.siteSidebar = 'contentAdvanced';
            $scope.advanced = true;
            $scope.universal = "false";
            $scope.device = "false";
            $scope.synchronous = "";
            $scope.network = "";
        }


        /**
         * 按确定保存数据，关闭窗口，
         */
        $scope.postUserInfo = function () {
            $scope.item = $scope.item.type;
            var language = {type: $scope.item};
            var userInfo = {
                auto: (typeof $scope.auto !== 'number' ) ? $scope.auto === true ? 1 : 0 : $scope.auto.auto,
                prompt: (typeof $scope.prompt !== 'number') ? $scope.prompt === true ? 1 : 0 : $scope.prompt,
                recycle: (typeof  $scope.recycle !== 'number') ? $scope.recycle === true ? 1 : 0 : $scope.recycle,
                local: (typeof $scope.local !== 'number') ? $scope.local === true ? 1 : 0 : $scope.local,
                https: (typeof $scope.https !== 'number') ? $scope.https === true ? 1 : 0 : $scope.https,
                proxy: (typeof  $scope.proxy !== 'number') ? $scope.proxy === true ? 1 : 0 : $scope.proxy,
                configpath: $scope.configPathInter,
                startsync: $scope.startStop
            };
            gkClientInterface.setClientInfo(userInfo);
            gkClientInterface.setChangeLanguage(language);
            gkClientInterface.setClose();
        }

        /**
         *   按取消不保存数据，关闭窗口
         */
        $scope.closeUserInfo = function () {
            gkClientInterface.setClose();
        }
    }]);

angular.module("gkQueueApp.controllers", [])
    .controller('queueCtrl', ['$scope',function ($scope) {
        var time1 = null,
            time2 = null,
            time3 = null;
        $scope.openContent = "上传";
        $scope.open = function(value) {
            if (value === "上传") {
                this.openContent = "上传";
                $scope.showUploadBg = true;
                $scope.showDownloadBg = false;
                $scope.showSyncBg = false;
            } else if (value === "下载") {
                this.openContent = "下载";
                $scope.showDownloadBg = true;
                $scope.showUploadBg = false;
                $scope.showSyncBg = false;
            }else  if (value === "同步"){
                this.openContent = "同步";
                $scope.showDownloadBg = false;
                $scope.showUploadBg = false;
                $scope.showSyncBg = true;
            }
        }

        /**
         * 上传下载处理数据
         * * @param data
         * @returns {Array}
         */
        var queusData = function(data){
            var newdata = []
                ,finishdata = []
                ,nofinishdata = [];
            for(var i = 0,len = data.length; i<len;i++){
                if(data[i].status === 3){
                    var posSize = Util.Number.bitSize(data[i].filesize);
                    finishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                        filesize:data[i].filesize,time:data[i].time,status:data[i].status,finishData:"上传完成",
                        possize:posSize,valuecolor:"downuploadcolor",finishbar:"progressbar",mountid:data[i].mountid});
                }else if(data[i].status === 2){
                    var filesizePos = parseInt((data[i].pos/data[i].filesize)*100)
                        ,posSize = Util.Number.bitSize(data[i].filesize);
                    nofinishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                        filesize:data[i].filesize,time:data[i].time,status:data[i].status,finishData:"继续等待",
                        filesizepos:filesizePos,possize:posSize,valuecolor:"waitcolor",delelist:'queuedelelist',type:"upload",mountid:data[i].mountid});
                }else{
                    var filesizePos = parseInt((data[i].pos/data[i].filesize)*100)
                        ,posSize = Util.Number.bitSize(data[i].filesize);
                    if(data[i].time === ' '){
                        nofinishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                            filesize:data[i].filesize,time:'网络异常',status:data[i].status,filesizepos:filesizePos,
                            possize:posSize,delelist:'queuedelelist',type:"upload",mountid:data[i].mountid});
                    }else{
                        nofinishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                            filesize:data[i].filesize,time:data[i].time,status:data[i].status,filesizepos:filesizePos,
                            possize:posSize,delelist:'queuedelelist',type:"upload",mountid:data[i].mountid});
                    }

                }
            }
            for(var i = 0,len = nofinishdata.length;i<len;i++){
                if(len !== 0){
                    newdata.push(nofinishdata[i]);
                }
            }
            for(var i = 0,len = finishdata.length;i<len;i++){
                if(len !== 0){
                    newdata.push(finishdata[i]);
                }
            }
            return newdata;
        }
        var queusDatadown = function(data){
            var newdata = []
                ,finishdata = []
                ,nofinishdata = [];
            for(var i = 0,len = data.length; i<len;i++){
                if(data[i].status === 3){
                    var posSize = Util.Number.bitSize(data[i].filesize);
                    finishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                        filesize:data[i].filesize,time:data[i].time,status:data[i].status,finishData:"下载完成",
                        possize:posSize,valuecolor:"downuploadcolor",finishbar:"progressbar",mountid:data[i].mountid});
                }else if(data[i].status === 2){
                    var filesizePos = parseInt((data[i].pos/data[i].filesize)*100)
                        ,posSize = Util.Number.bitSize(data[i].filesize);
                    nofinishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                        filesize:data[i].filesize,time:data[i].time,status:data[i].status,finishData:"继续等待",
                        filesizepos:filesizePos,possize:posSize,valuecolor:"waitcolor",delelist:'queuedelelist',type:"download",mountid:data[i].mountid});
                }else{
                    var filesizePos = parseInt((data[i].pos/data[i].filesize)*100)
                        ,posSize = Util.Number.bitSize(data[i].filesize);
                    if(data[i].time === ' '){
                        nofinishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                            filesize:data[i].filesize,time:'网络异常',status:data[i].status,filesizepos:filesizePos
                            ,possize:posSize,delelist:'queuedelelist',type:"download",mountid:data[i].mountid});
                    }else{
                        nofinishdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,
                            filesize:data[i].filesize,time:data[i].time,status:data[i].status,filesizepos:filesizePos
                            ,possize:posSize,delelist:'queuedelelist',type:"download",mountid:data[i].mountid});
                    }
                }
            }
            for(var i = 0,len = nofinishdata.length;i<len;i++){
                if(len !== 0){
                    newdata.push(nofinishdata[i]);
                }
            }
            for(var i = 0,len = finishdata.length;i<len;i++){
                if(len !== 0){
                    newdata.push(finishdata[i]);
                }
            }
            return newdata;
        }
        /**
         * 同步
         * @param data
         * @returns {Array}
         */
        var queusSync = function(data){
            var newdata = []
            for(var i = 0,len = data.length; i<len;i++){
                if(data[i].num ===0 ){
                    newdata.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,
                        status:"同步完成",num:data[i].num,valuecolor:"downuploadcolor"});
                }else{
                    newdata.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,
                        status:data[i].num+"项正在同步",num:data[i].num,time:data[i].time});
                }
            }
            return newdata;
        }

        /**
         * 上传
         */
        $scope.getTransListtime = function() {
            var sildbarUploadData = [];
            var data;
            data = {
                type:"upload"
            }
            $scope.sildbarUpload = JSON.parse(gkClientInterface.getTransList(data));
            console.log($scope.sildbarUpload);
            sildbarUploadData =  $scope.sildbarUpload.list;
            if($scope.sildbarUpload.download === 0){
                $scope.downloadspeek = 0;
            }else{
                $scope.downloadspeek = Util.Number.bitSize($scope.sildbarUpload.download);
            }
            if( $scope.sildbarUpload.upload === 0 ){
                $scope.uploadspeek = 0;
            }else{
                $scope.uploadspeek = Util.Number.bitSize($scope.sildbarUpload.upload);
            }
            $scope.upload = queusData(sildbarUploadData);
        }
        $scope.getTransListtime();
        $scope.queueinterface = function(){
            var time1 = setInterval(function() {
                $scope.$apply(function(){
                    $scope.getTransListtime();
                });
            },2000);
        }
        $scope.queueinterface();
        $scope.queusSildbarUpload = function(){
            $scope.getTransListtime();
            $scope.queueinterface();
        }
        /**
         *下载
         */
        $scope.downloadDataProcessing = function(){
            var sildbarDownloadData = [];
            var data;
            data = {
                type:"download"
            }
            $scope.sildbarDownload = JSON.parse(gkClientInterface.getTransList(data));
            console.log($scope.sildbarDownload);
            sildbarDownloadData =  $scope.sildbarDownload.list;
            if($scope.sildbarDownload.download === 0){
                $scope.downloadspeek = 0;
            }else{
                $scope.downloadspeek = Util.Number.bitSize($scope.sildbarDownload.download);
            }
            if( $scope.sildbarDownload.upload === 0 ){
                $scope.uploadspeek = 0;
            }else{
                $scope.uploadspeek = Util.Number.bitSize($scope.sildbarDownload.upload);
            }
            $scope.download = queusDatadown(sildbarDownloadData);
        }
        $scope.queueinterfaceDownload = function(){
            var time2 = setInterval(function() {
                $scope.$apply(function(){
                    $scope.downloadDataProcessing();
                });
            },2000);
        }
        $scope.queueinterfaceDownload();
        $scope.queusSildbarDownload = function(){
            $scope.downloadDataProcessing();
            $scope.queueinterfaceDownload();
        }
        /**
         * 同步
         */
        $scope.SynchronousDataProcessing = function(){
            var sildbarSyncData = [];
            var data;
            data = {
                type:"sync"
            }
            $scope.sildbarSync = JSON.parse(gkClientInterface.getTransList(data));
            sildbarSyncData =  $scope.sildbarSync.list;
            if($scope.sildbarSync.download === 0){
                $scope.downloadspeek = 0;
            }else{
                $scope.downloadspeek = Util.Number.bitSize($scope.sildbarSync.download);
            }
            if( $scope.sildbarSync.upload === 0 ){
                $scope.uploadspeek = 0;
            }else{
                $scope.uploadspeek = Util.Number.bitSize($scope.sildbarSync.upload);
            }
            $scope.sync = queusSync(sildbarSyncData);
        }
        $scope.queueinterfaceSync = function(){
            var time3 = setInterval(function(){
                $scope.$apply(function(){
                    $scope.SynchronousDataProcessing();
                });
            },2000);
        }
        $scope.queueinterfaceSync();
        $scope.queusSildbarSync = function(){
            $scope.SynchronousDataProcessing();
            $scope.queueinterfaceSync();
        }
        $scope.queueDelete = function(index,data,type,mountid){
            var r=confirm("确定终止上传文件");
            var data = {
                webpath:data,
                mountid:mountid,
                type:type
            }
            if (r==true)
            {
                $scope.upload.splice(index, 1);
                gkClientInterface.setRmoveTrans(data);
            }
        }
        $scope.queueDownDelete = function(index,data,type,mountid){
            var r=confirm("确定终止下载文件");
            var data = {
                webpath:data,
                mountid:mountid,
                type:type
            }
            if (r==true)
            {
                $scope.upload.splice(index, 1);
                gkClientInterface.setRmoveTrans(data);
            }
        }
        $scope.queueClose = function(){
            gkClientInterface.setClose();
        }
    }]);



