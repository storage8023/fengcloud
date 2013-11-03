

'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('initClient',['$rootScope',function($rootScope){
        $rootScope.PAGE_CONFIG = {
            user:gkClientInterface.getUser(),
            file:{},
            mount:{},
            condition:''
        };

    }])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile', '$rootScope', function ($scope, $location, GKPath, GKFile, $rootScope) {
        var sideOrgList = gkClientInterface.getSideTreeList({sidetype: 'org'})['list'];
        var myMount = {}, //我的空间
            orgMount = []; //团队的空间
        angular.forEach(sideOrgList, function (value) {
            if (value.orgid == 0) {
                myMount = value;
            } else {
                orgMount.push(value);
            }
        });

        /**
         * 个人的文件
         * @type {*}
         */

        var getTrashNode = function(mount_id){
            var node = {
                label: "回收站",
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
        myTreeData[0]['children'] = GKFile.dealTreeData(gkClientInterface.getFileList({webpath: '', dir: 1, mountid: myMount.mountid})['list'], 'myfile', myMount.mountid);
        if(!myTreeData[0]['children']) myTreeData[0]['children'] = [];
        myTreeData[0]['children'].push(getTrashNode(myMount.mountid));
        $scope.treeList = myTreeData;

        /**
         * 团队的文件
         */

        $scope.orgTreeList = GKFile.dealTreeData(orgMount, 'teamfile');

        /**
         * 智能文件夹
         * @type {*}
         */
        var smartFolders = gkClientInterface.getSideTreeList({sidetype: 'magic'})['list'];
        if (!smartFolders) smartFolders = [];
        smartFolders.unshift({
            name: '我接收的文件',
            condition: 'inbox',
            icon:'icon_inbox'
        });
        smartFolders.unshift({
            name: '星标文件',
            condition: 'star',
            icon:'icon_star'
        });

        smartFolders.unshift({
            name: '最近修改的文件',
            condition: 'recent',
            icon:'icon_recent'
        });

        $scope.smartTreeList = GKFile.dealTreeData(smartFolders, 'magic');

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
                $rootScope.PAGE_CONFIG.mount = GKFile.getMountById(branch.data.mount_id);
            } else if (partition == 'smartfolder') {
                pararm['condition'] = branch.data.condition;
                $rootScope.PAGE_CONFIG.condition = branch.data.condition;
            } else {
                return;
            }
            $location.search(pararm);
            $rootScope.PAGE_CONFIG.file = branch.data;

        };

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if (branch.expanded) {
                var list = gkClientInterface.getFileList({webpath: branch.data.fullpath, dir: 1, mountid: branch.data.mount_id || 0})['list'];
                branch.children = GKFile.dealTreeData(list, $location.search().partition, branch.data.mount_id);
            }
        };

    }])
    .controller('fileBrowser', ['$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException', 'GKFile', 'GKCilpboard', 'GKOpt', '$rootScope', '$modal', 'GKApi', '$q','GKSearch','RestFile',function ($scope, $routeParams, $location, $filter, GKPath, GK, GKException, GKFile, GKCilpboard, GKOpt, $rootScope, $modal, GKApi,$q,GKSearch,RestFile) {


        /**
         * 分析路径获取参数
         * @type {*}
         */
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.condition = $routeParams.condition || ''; //当前的分区
        $scope.partition = $routeParams.partition || 'myfile'; //当前的分区
        $scope.view = $routeParams ? $routeParams.view || 'list' : 'list'; //当前的视图模式
        $scope.order = '+file_name';
        $scope.filter = $routeParams.filter || '';
        /**
         * 文件列表数据
         */
        var getFileData = function () {
            var fileList,
                source = 'client',
                deferred = $q.defer();;
            if ($scope.partition == 'myfile' || $scope.partition == 'teamfile') {
                if($scope.filter == 'trash'){
                    source = 'api';
                    RestFile.recycle($routeParams.mountid, '').success(function(data){
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){

                    })
                }else{
                    var re = gkClientInterface.getFileList({
                        webpath: $scope.path,
                        mountid: $routeParams.mountid
                    });

                    fileList = re['list'];
                    angular.extend($rootScope.PAGE_CONFIG.file,{
                        sharepath:re['sharepath']||'',
                        syncpath:re['syncpath']||''
                    })

                    deferred.resolve(GKFile.dealFileList(fileList, source));
                }

            } else {
                source = 'api';

                if ($scope.condition == 'inbox') {
                    GKApi.inboxFileList($scope.condition).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                } else if ($scope.condition == 'star') {
                    GKApi.starFileList($scope.condition).success(function (data) {
                        fileList = data['list'];

                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                } else if ($scope.condition == 'recent') {
                    GKApi.recentFileList($scope.condition).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                } else {
                    GKApi.smartFolderList($scope.condition).success(function (data) {
                        fileList = data['list'];
                        deferred.resolve(GKFile.dealFileList(fileList, source));
                    }).error(function(){
                            deferred.reject();
                        });
                }
            }
            return deferred.promise;
        };

        $scope.fileData = [];
        getFileData().then(function(list){
            $scope.fileData = list;
        });

        /**
         * 当击文件
         * @param $event
         * @param file
         */

        var selectedFile = [], //当前已选中的条目
            selectFile;  //选中函数

        selectFile = function (file) {
            if (!$scope.multiSelect && selectedFile && selectedFile.length) {
                angular.forEach(selectedFile, function (value) {
                    value.selected = false;
                });
            }
            file.selected = true;
            selectedFile.push(file);
        };

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
                    } else { ////文件夹不为空

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

        var refreahData = function () {
            getFileData().then(function(newFileData){
                //console.log(newFileData);
                $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
            })

        };

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
                        console.log(1);
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
                        mountid: $routeParams.mountid
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
                            mountid: $routeParams.mountid
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
                        mountid: $routeParams.mountid
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
                        mountid: $routeParams.mountid
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
                        mountid: $routeParams.mountid
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
                        mountid: $routeParams.mountid
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
                                mountid: $routeParams.mountid
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

        /**
         * 已选中的文件
         * @type {Array}
         */
        $scope.selectedFile = [];
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

        $scope.keyword = '';
        $scope.$on('searchFileSuccess', function ($event, resultList, keyword) {
            $scope.fileData = GKFile.dealFileList(resultList, 'api');
            $scope.keyword = keyword;
            //console.log($scope.keyword);
        })

        $scope.$on('searchFileCancel', function ($event) {
            $scope.keyword = '';
            refreahData();
        })
    }])
    .controller('rightSidebar', ['$scope', 'RestFile', '$rootScope', 'GKApi', '$http', '$location','GKSearch',function ($scope, RestFile, $rootScope, GKApi, $http, $location,GKSearch) {
        var gird = /[,;；，\s]/g;
        $scope.$on('$locationChangeSuccess',function(){
            $scope.partition = $location.search().partition;
        })

        /**
         * 监听已选择的文件
         */
        $scope.file = {}; //当前选择的文件
        $scope.shareMembers = []; //共享参与人
        $scope.remarks = []; //讨论
        $scope.histories = []; //历史
        $scope.remindMembers = [];//可@的成员列表
        $scope.$watch('selectedFile', function () {
            $scope.inputingRemark = false;
            if (!$scope.selectedFile || !$scope.selectedFile.length) {

            } else if ($scope.selectedFile.length == 1) {
                var searchParams = $location.search();
                $scope.file = $scope.selectedFile[0];
                var fullpath = $scope.file.dir==1?$scope.file.fullpath+'/':$scope.file.fullpath;
                RestFile.get(searchParams.mountid, fullpath).success(function (data) {
                    var tag = data.tag || '';
                    $scope.file.tag = jQuery.trim(tag);
                    angular.forEach(tag.split(gird),function(value){
                        if(value && $scope.file.formatTag.indexOf(value)<0){
                            $scope.file.formatTag.push(value);
                        }
                    });
                    console.log($scope.file.formatTag);
                });

                GKApi.sideBar(searchParams.mountid, fullpath).success(function (data) {
                    $scope.shareMembers = data.share_members;
                    $scope.remarks = data.remark;
                    $scope.histories = data.history;
                    $scope.remindMembers = data.remind_members;

                });
            } else {

            }
        }, true);

        $scope.showSearch = false;
        $scope.$watch(function(){
            return GKSearch.isShowSearchSidebar();
        },function(newValue){
            $scope.showSearch = newValue;
        });

    }])
    .controller('header', ['$scope', 'GKPath', '$location', '$filter', 'GKMounts', 'GKHistory', 'GKApi', '$rootScope','$document','$compile','$timeout', 'GKSearch','GKDialog',function ($scope, GKPath, $location, $filter, GKMounts, GKHistory, GKApi, $rootScope,$document,$compile,$timeout,GKSearch, GKDialog) {

        /**
         * 面包屑
         */
        var getBreads = function () {
            var path = Util.String.rtrim(Util.String.ltrim($scope.path, '/'), '/'), breads = [], bread;
            if (path.length) {
                var paths = path.split('/');
                for (var i = 0; i < paths.length; i++) {
                    bread = {
                        name: paths[i]
                    };
                    var fullpath = '';
                    for (var j = 0; j <= i; j++) {
                        fullpath += paths[j] + '/'
                    }
                    fullpath = Util.String.rtrim(fullpath, '/');
                    bread.path = fullpath;
                    bread.url = '#' + GKPath.getPath($scope.partition, bread.path, $scope.view);
                    breads.push(bread);
                }
            }
            var name = '', currentMountId = $location.search().mountid;
            if (currentMountId && GKMounts[currentMountId]) {
                name = GKMounts[currentMountId]['name'];
            }
            breads.unshift({
                name: name,
                url: '#' + GKPath.getPath($scope.partition, '', $scope.view)
            });

            return breads;
        };

        $scope.canBack = false;
        $scope.canForward = false;
        $scope.path = '';
        $scope.view = '';
        $scope.partition = '';
        $scope.mount_id = 0;
        /**
         * 分析路径获取参数
         * @type {*}
         */
        $scope.$on('$locationChangeSuccess', function () {
            var pathArr = $location.path().split('/');
            var params = $location.search();
            $scope.partition = params.partition; //当前的分区
            $scope.view = params.view || 'list'; //当前的视图模式
            $scope.path = params.path || '';  //当前的文件路径
            $scope.mount_id = params.mountid;  //当前的文件路径
            $scope.breads = getBreads();
            $scope.canBack = GKHistory.canBack();
            $scope.canForward = GKHistory.canForward();
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
        $scope.searchState = '';
        $scope.searchScope = 'path';
        $scope.setSearchScope = function (searchScope,success,error) {
            $scope.searchScope = searchScope;
        }

        var invokeSearchFile = function(condition,success,error){
            $scope.searchState = 'loading';
            GKApi.searchFile(condition,$scope.mount_id).success(function (data) {
                $scope.searchState = 'end';
                data && data.list && $rootScope.$broadcast('searchFileSuccess', data.list, $scope.keyword);
                if(angular.isFunction(success)){
                    success();
                }
            }).error(function () {
                    $scope.searchState = 'end';
                    if(angular.isFunction(error)){
                        error();
                    }
                });
        };

        $scope.searchFile = function () {
            if (!$scope.keyword || !$scope.keyword.length || $scope.searchState == 'loading') {
                return;
            }
            var fileSearch = new GKFileSearch();
            fileSearch.conditionIncludeKeyword($scope.keyword);
            fileSearch.conditionIncludePath($scope.searchScope == 'path' ? $scope.path : '');
            var condition = fileSearch.getCondition()
            invokeSearchFile(condition,function(){
                GKSearch.setKeyWord($scope.keyword);
                GKSearch.showSearchSidebar = true;
            });
        };


        $scope.$on('invokeSearch',function($event,condition){
            console.log(condition);
            invokeSearchFile(condition);
        })

        $scope.cancelSearch = function ($event) {
            $scope.searchState = '';
            $scope.keyword = '';
            GKSearch.showSearchSidebar = false;
            $rootScope.$broadcast('searchFileCancel');
            $event.stopPropagation();
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
                    return;
                }
            },{
                item:"退出",
                menuclick:function(){
                    return;
                }
            }
        ];
    }]);


/**
 * news
 */
angular.module('gkNewsApp.controllers', [])
    .controller("newsCtrl", ['$filter', '$scope', 'GKApi', '$http','$q', function ($filter, $scope, GKApi, $http,$q) {
        /**
         * 服务器过来的数据处理
         */
        $scope.upDate = function(){
            var updateHttp = function() {
                var deferred = $q.defer();
                GKApi.update().success(function ($http){
                    var message = [];
                    message = $http;
                    console.log($http);
                    deferred.resolve(message);
                })
                return deferred.promise;
            }
            var promiseMember = updateHttp();
            promiseMember.then(function(data){
                var newdata = [];
                newdata = data.updates;

                /**
                 * 过滤出相同日期
                 * 新消息news
                 * @compare()
                 */
                function compare(dateObj) {
                    var results = []
                        , i = 0
                        , j = 0
                        , len = dateObj.length;
                    results[0] = new Array();
                    results[0].push(dateObj[0]);
                    for (; i < len - 1; i++) {
                        var next = dateObj[i + 1], k = 0, klen = results[j].length;
                        var value = results[j][results[j].length - 1];
                        if (value.date === next.date) {
                            results[j].push(next);
                        }
                        else {
                            j++;
                            results[j] = new Array();
                            results[j].push(next);
                        }
                    }
                    return results;
                }
                /**
                 * 返回日期的时间戳
                 * 新消息news
                 * @fetchDateline()
                 */
                function fetchDateline(date) {
                    var year = date.getFullYear()
                        , month = date.getMonth() + 1 < 10 ? "0" + date.getMonth() + 1 : date.getMonth() + 1
                        , day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
                    return year + '/' + month + '/' + day;
                }
                /**
                 *   日期按yyyy-MM-dd格式输出
                 *   新消息news
                 *   @filterDay()
                 */
                Date.prototype.format = function (format) {
                    var o = {
                        "M+": this.getMonth() + 1, //month
                        "d+": this.getDate(), //day
                        "h+": this.getHours(), //hour
                        "m+": this.getMinutes(), //minute
                        "s+": this.getSeconds(), //second
                        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
                        "S": this.getMilliseconds() //millisecond
                    };
                    if (/(y+)/.test(format)) format = format.replace(RegExp.$1,
                        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
                    for (var k in o)if (new RegExp("(" + k + ")").test(format))
                        format = format.replace(RegExp.$1,
                            RegExp.$1.length == 1 ? o[k] :
                                ("00" + o[k]).substr(("" + o[k]).length));
                    return format;
                };

                Date.prototype.yesterformat = function (yesterformat) {
                    var o = {
                        "M+": this.getMonth() + 1, //month
                        "d+": this.getDate() - 1, //day
                        "h+": this.getHours(), //hour
                        "m+": this.getMinutes(), //minute
                        "s+": this.getSeconds(), //second
                        "q+": Math.floor((this.getMonth() + 3) / 3), //quarter
                        "S": this.getMilliseconds() //millisecond
                    };
                    if (/(y+)/.test(yesterformat)) yesterformat = yesterformat.replace(RegExp.$1,
                        (this.getFullYear() + "").substr(4 - RegExp.$1.length));
                    for (var k in o)if (new RegExp("(" + k + ")").test(yesterformat))
                        yesterformat = yesterformat.replace(RegExp.$1,
                            RegExp.$1.length == 1 ? o[k] :
                                ("00" + o[k]).substr(("" + o[k]).length));
                    return yesterformat;
                };

                /**
                 * 过滤今天，昨天或者以前
                 * 新消息news
                 * @filterDay()
                 */
                function filterDay(filter, dates) {
                    var date = filter('date');
                    var printDateNew = [];
                    var d = new Date();
                    var nowDate = new Date(Date.parse(fetchDateline(d))).getTime() / 1000 - d.getTimezoneOffset();
                    var yesterDate = nowDate - 3600 * 24;
                    for (var i = 0; i < dates.length; i++) {
                        var printDate = [];
                        var currentDate = dates[i][0].dateline;
                        if (currentDate >= nowDate) {
                            for (var j = 0; j < dates[i].length; j++) {
                                if (j === 0) {
                                    var newsDay = new Date().format('MM-dd');
                                    printDate.push({'date': '今天， ' + newsDay, "dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                                } else {
                                    printDate.push({"dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                                }
                            }
                            printDateNew.push(printDate);
                        }
                        else if (currentDate >= yesterDate) {
                            for (var j = 0; j < dates[i].length; j++) {
                                if (j === 0) {
                                    var yesterDay = new Date().yesterformat('MM-dd');
                                    printDate.push({"date": '昨天， ' + yesterDay, "dateline": dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                                } else {
                                    printDate.push({"dateline": dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                                }
                            }
                            printDateNew.push(printDate);
                        } else {
                            for (var j = 0; j < dates[i].length; j++) {
                                if (j === 0) {
                                    printDate.push({'date': dates[i][j]['date'], "dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                                } else {
                                    printDate.push({"dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                                }
                            }
                            printDateNew.push(printDate);
                        }
                    }
                    return printDateNew;
                }
                /**
                 * 再次加载消息
                 */
                var againNew = function (filter, dates) {
                    var date = filter('date');
                    var printDateNew = [];
                    var d = new Date();
                    var nowDate = new Date(Date.parse(fetchDateline(d))).getTime() / 1000 - d.getTimezoneOffset();
                    var yesterDate = nowDate - 3600 * 24;
                    for (var i = 0; i < dates.length; i++) {
                        var printDate = [];
                        var currentDate = dates[i][0].dateline;
                        if (lastime === dates[0][0].date) {
                            for (var j = 0; j < dates[i].length; j++) {
                                printDate.push({"dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                            }
                            printDateNew.push(printDate);
                        } else if (currentDate >= yesterDate) {
                            for (var j = 0; j < dates[i].length; j++) {
                                if (j === 0) {
                                    var yesterDay = new Date().yesterformat('MM-dd');
                                    printDate.push({"date": '昨天， ' + yesterDay, "dateline": dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                                } else {
                                    printDate.push({"dateline": dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                                }
                            }
                            printDateNew.push(printDate);
                        } else {
                            for (var j = 0; j < dates[i].length; j++) {
                                if (j === 0) {
                                    printDate.push({'date': dates[i][j]['date'], "dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                                } else {
                                    printDate.push({"dateline": dates[i][j]['dateline'], render_text: dates[i][j]['render_text']});
                                }
                            }
                            printDateNew.push(printDate);
                        }
                    }
                    return printDateNew;
                };
                /**
                 * 最后一条消息的时间戳
                 * @param filter
                 * @param dates
                 */
                var lasttime = function (dates) {
                    var last = [];
                    for (var i = 0; i < dates.length; i++) {
                        if (i = dates.length - 1) {

                                    last.push({"dateline": dates[i].dateline, "date": dates[i].date});

                        }
                    }
                    return last;
                };
                 /**
                 * 单击向上向下滑动按钮
                 * 新消息new
                 * button - #newsbtn
                 */
                if(newdata.length === 0){
                    $scope.newsShow = 'noNews';
                }else{
                    var filterData = compare(newdata) //过滤出相同日期
                        ,equalData = filterDay($filter, filterData);
                    $scope.equalDataNew = equalData;
                    $scope.newsShow = 'yesNews';
                    $scope.lasttimelabel = lasttime(newdata);

                }
             })
        }
        $scope.upDate();

        /**
         *   按footer收取
         */
         var newsControls = function(){
             jQuery("#newsPackUp").click(function(){
                 jQuery(".news-wrapper").slideUp(500);
             });
         };
         newsControls();
    }]);

/**
 * personal
 */
angular.module("gkPersonalApp.controllers", [])
    .controller("personalCtrl", ['$scope', 'GKApi', '$http', function ($scope, GKApi, $http) {
        /**
         * B,KB,MB,GB,TB,PB
         * @param num
         * @param decimal
         * @returns {*}
         */
        function bitSize(num, decimal) {
            if (typeof(num) != 'number') {
                num = Number(num);
            }
            if (typeof(decimal) != 'number') {
                decimal = 2;
            }
            if (num < 0) {
                return '';
            }
            var type = new Array('B', 'KB', 'MB', 'GB', 'TB', 'PB');
            var j = 0;
            while (num >= 1024) {
                if (j >= 5)
                    return num + type[j];
                num = num / 1024;
                j++;
            }
            if (num == 0) {
                return num;
            } else {
                var dec = 1;
                for (var i = 0; i < decimal; i++) {
                    dec = dec * 10;
                }
                return Math.round(num * dec) / dec + type[j];
            }
        }

        var invitePendingHttp = function () {
            GKApi.teamInvitePending().success(function ($http, data) {
                $scope.createTeamData = data.invite_pending;
            });
        }

        /**
         *  团队信息处理
         */
        var perside = function (data) {
            var newData = []
            for (var i = 0, len = data.length; i < len; i++) {
                if (data[i].orgid > 0) {
                    if (data[i].type === 0) {
                        newData.push({ "name": data[i].name, "admin": "超级管理员", "management": "管理", "org_id": data[i].orgid, " orgphoto": data[i].orgphoto});
                    } else if (data[i].type === 1) {
                        newData.push({ "name": data[i].name, "admin": "管理员", "management": "管理", "quit": "退出", " orgphoto": data[i].orgphoto});
                    } else {
                        newData.push({ "name": data[i].name, "quit": "退出", " orgphoto": data[i].orgphoto});
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
                , oldData = data;
            if (data.member_phone == '') {
                guserData.push({"member_email": data.member_email, "member_name": data.member_name, "member_id": data.member_id,"member_phone": '电话：' + '13308923581', "photourl": data.photourl});
            } else {
                guserData.push({"member_email": data.member_email, "member_name": data.member_name, "member_id": data.member_id,"member_phone": '电话：' +data.member_phone,"photourl": data.photourl}); //data.member_phone
            }
            return guserData;
        }
        var perHavaNoteam = function (scope, havajoin, nojoin) {
            if (havajoin.length === 0 && nojoin.length === 0) {
                scope.haveNoTeam = 'noTeam';
            } else {
                scope.haveNoTeam = 'haveTeam';
            }
        }
        $scope.permanagement = function (data) {
            GKApi.teamManage(data).success(function ($http) {

            });
        }
        $scope.perquit = function (data) {
            GKApi.teamQuit(data).success(function ($http) {

            });
        }
        $scope.perinvitereject = function (data, code) {
            GKApi.teamInviteReject(data, code).success(function ($http) {

            });
        }
        $scope.setupteam = function ($scope) {

            var data = {
                url: '/mount/create_team',
                sso: 1
            }
            var dataUrl = gkClientInterface.setGetUrl(data);
            //console.log(daptaUrl);
            var params = {
                url: dataUrl,
                type: "child",
                width: 900,
                height: 600
            }
            gkClientInterface.setMain(params);

        }
        $scope.sitOpen = function ($scope) {
            var data = {
                url:"file:///F:/fengcloud/app/views/site.html",
                type:"child",
                width:760,
                height:450
            }
            gkClientInterface.setMain(data);
        }

    var perCtrl = function(){
        //个人信息
        $scope.guser_info = guserInformation(JSON.parse(gkClientInterface.getUserInfo()))[0];
        //团队信息
        $scope.per_gSideTreeList = gkClientInterface.getSideTreeList({"sidetype":"org"}).list;
        $scope.perNewgSideTreeList = perside($scope.per_gSideTreeList);
        console.log( $scope.perNewgSideTreeList);
        $scope.perUseBitSize = useBitSize($scope.per_gSideTreeList);
        $scope.size_space = bitSize($scope.perUseBitSize[0].use);
        //打开窗口
        invitePendingHttp();
        perHavaNoteam($scope, $scope.guser_info, $scope.createTeamData);
        //关闭窗口
        jQuery(".personal-close-button").click(function(){
            gkClientInterface.setClose();
        })
    }
    perCtrl();
}]);

/**
 * site
 */
angular.module("gkSiteApp.controllers", [])
    .controller("siteCtrl",['$scope', 'GKApi', '$http','$q', function ($scope,GKApi, $http,$q) {
        var time = null;
        /**
         * 选择语言处理
         */
        $scope.siteChangeLanguage = function () {
            $scope.items = [
                {name: '默认', type: 0 },
                {name: '中文', type: 1 },
                {name: '英文', type: 2 }
            ];
            $scope.changeLanguage = JSON.parse(gkClientInterface.getLanguage());
            $scope.item = $scope.items[$scope.changeLanguage.type];
        }
        /**
         * 打开设置
         * 数据处理
         */
        $scope.SiteOpen = function () {
            $scope.siteSidebar = 'contentUniversal';
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
        $scope.siteadvancepathdlg = function(){
            var configPath = gkClientInterface.selectPath(true);
            if(configPath !== ''){
                $scope.configpath= configPath;
                $scope.configPathInter = configPath;
            }
        }
        /**
         * 左侧栏单击事件
         */
        $scope.siteuniversal = function () {
            $scope.siteSidebar = 'contentUniversal';
            $scope.universal = true;
            $scope.device = "";
            $scope.synchronous = "";
            $scope.network = "";
            $scope.advanced = "";
        }
        $scope.sitedevice = function () {
            $scope.siteSidebar = 'contentdevice';
            $scope.device = true;
            $scope.universal = "";
            $scope.synchronous = "";
            $scope.network = "";
            $scope.advanced = "";
        }
        $scope.sitesynchronous = function () {
            $scope.siteSidebar = 'contentSynchronous';
            $scope.synchronous = true;
            $scope.universal = "";
            $scope.device = "";
            $scope.network = "";
            $scope.advanced = "";
        }
        $scope.sitenetwork = function () {
            $scope.siteSidebar = 'contentNetwork';
            $scope.network = true;
            $scope.universal = "";
            $scope.device = "";
            $scope.synchronous = "";
            $scope.advanced = "";
        }
        $scope.siteadvanced = function () {
            $scope.siteSidebar = 'contentAdvanced';
            $scope.advanced = true;
            $scope.universal = "";
            $scope.device = "";
            $scope.synchronous = "";
            $scope.network = "";
        }
        $scope.siteSyncData = function(){
            var sildbarSyncData = [],
                syncData = [];
            var data;
            data = {
                type:"sync"
            }
            $scope.sildbarSync = JSON.parse(gkClientInterface.getTransList(data));
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
        $scope.siteSyncAgainData = function(){
            var time = setInterval(function(){
                $scope.siteSyncData();
            }, 3000);
        }
        $scope.siteSyncAgainData();
        $scope.siteSildbarSync = function(){
            $scope.siteSyncData();
            $scope.siteSyncAgainData();
        }
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
        var siteSyncStop = function(data){
            var sync = [];
            for(var i= 0,len = data.length;i<len;i++){
                sync.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,num:data[i].num,finish:'暂停同步'});
            }
            return sync;
        }
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
            var siteDivices = []
                ,siteDivicesData = [];
            $scope.divices = data;
            siteDivices =  $scope.divices.devices;
            for(var i = 0,len = siteDivices.length;i<len;i++){
                siteDivicesData.push({allow_edit:siteDivices[i].allow_edit,device_id:siteDivices[i].device_id,device_name:siteDivices[i].device_name,last_activity:siteDivices[i].last_activity,os_name:siteDivices[i].os_name,os_version:siteDivices[i].os_version,startban:'禁止'});
            }
            $scope.sitedivices = siteDivicesData;
        })
        $scope.siteSyncDelete = function(device_id,index){
            GKApi.deldevice(device_id).success(function (){

            })
            $scope.sitedivices.splice(index, 1);
        }
        $scope.banstart = "禁用";
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
    .controller('queueCtrl', function ($scope) {
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
        function bitSize(num, decimal) {
            if (typeof(num) != 'number') {
                num = Number(num);
            }
            if (typeof(decimal) != 'number') {
                decimal = 2;
            }
            if (num < 0) {
                return '';
            }
            var type = new Array('B', 'KB', 'MB', 'GB', 'TB', 'PB');
            var j = 0;
            while (num >= 1024) {
                if (j >= 5)
                    return num + type[j];
                num = num / 1024;
                j++;
            }
            if (num == 0) {
                return num;
            } else {
                var dec = 1;
                for (var i = 0; i < decimal; i++) {
                    dec = dec * 10;
                }
                return Math.round(num * dec) / dec + type[j];
            }
        }

        /**
         * 上传下载处理数据
         * * @param data
         * @returns {Array}
         */
        var queusData = function(data){
            var newdata = []
                ,yesdata = [];
            for(var i = 0,len = data.length; i<len;i++){
                if(data[i].status === 3){
                    var filesizePos = (data[i].pos/data[i].filesize)*100 + '%'
                        ,posSize = bitSize(data[i].pos);
                    yesdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,filesize:data[i].filesize,time:data[i].time,status:data[i].status,filesizepos:filesizePos,possize:posSize});
                }else{
                    var filesizePos = (data[i].pos/data[i].filesize)*100 + '%'
                        ,posSize = bitSize(data[i].filesize);
                    newdata.push({webpath:data[i].webpath,path:data[i].path,dir:data[i].dir,pos:data[i].pos,filesize:data[i].filesize,time:data[i].time,status:data[i].status,filesizepos:filesizePos,possize:posSize});
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
            var newdata = [];
            for(var i = 0,len = data.length; i<len;i++){
                if(data[i].time ===0 ){
                    newdata.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,status:"同步完成",num:data[i].num});
                }else{
                    newdata.push({webpath:data[i].webpath,path:data[i].path,mountid:data[i].mountid,status:data[i].num+"项正在同步",num:data[i].num,time:data[i].time});
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
            sildbarUploadData =  $scope.sildbarUpload.list;
            if($scope.sildbarUpload.download === 0){
                $scope.downloadspeek = 0;
            }else{
                $scope.downloadspeek = bitSize($scope.sildbarUpload.download);
            }
            if( $scope.sildbarUpload.upload === 0 ){
                $scope.uploadspeek = 0;
            }else{
                $scope.uploadspeek = bitSize($scope.sildbarUpload.upload);
            }
            $scope.upload = queusData(sildbarUploadData);
        }
        $scope.getTransListtime();
        $scope.queueinterface = function(){
            var time1 = setInterval(function() {
                $scope.getTransListtime();
            },2000);
        }
        $scope.queueinterface();
        $scope.queusSildbarUpload = function(){
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
                $scope.downloadspeek = bitSize($scope.sildbarDownload.download);
            }
            if( $scope.sildbarDownload.upload === 0 ){
                $scope.uploadspeek = 0;
            }else{
                $scope.uploadspeek = bitSize($scope.sildbarDownload.upload);
            }
            $scope.download = queusData(sildbarDownloadData);
        }
        $scope.queueinterfaceDownload = function(){
            var time2 = setInterval(function() {
                $scope.downloadDataProcessing();
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
                $scope.downloadspeek = bitSize($scope.sildbarSync.download);
            }
            if( $scope.sildbarSync.upload === 0 ){
                $scope.uploadspeek = 0;
            }else{
                $scope.uploadspeek = bitSize($scope.sildbarSync.upload);
            }
            $scope.sync = queusSync(sildbarSyncData);
        }
        $scope.queueinterfaceSync = function(){
            var time3 = setInterval(function() {
                $scope.SynchronousDataProcessing();
            },2000);
        }
        $scope.queueinterfaceSync();
        $scope.queusSildbarSync = function(){
            $scope.SynchronousDataProcessing();
            $scope.queueinterfaceSync();
        }
        $scope.queueClose = function(){
            gkClientInterface.setClose();
        }
    });




