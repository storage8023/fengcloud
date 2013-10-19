'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKSession', 'GKFile', function ($scope, $location, GKPath, GKSession, GKFile) {

        /**
         * 对获取的树数据进行再处理
         */
        var dealTreeData = function (data, type) {
            var newData = [], item, dataItem;
            for (var i = 0; i < data.length || 0; i++) {
                dataItem = data[i];
                item = {
                    label: dataItem.name,
                    data: dataItem
                };
                newData.push(item);
            }
            return newData;
        };

        /**
         * 对获取的文件数据进行再处理
         * @param fileData
         */
        var dealFileData = function (fileData, type) {
            var newData = [], item, dataItem;
            for (var i = 0; i < fileData.length || 0; i++) {
                dataItem = fileData[i];
                item = {
                    label: Util.String.baseName(dataItem.path),
                    data: dataItem,
                    expanded: false
                };
                newData.push(item);
            }
            return newData;
        };

        $scope.treeList = [
            { "label": "我的文件", data: {path: ''}, "children": dealFileData(gkClientInterface.getFileList({webpath: '', dir: 1, mountid: 1}), 'org')},
            { "label": "团队的文件", "children": dealTreeData(gkClientInterface.getSideTreeList({sidetype: 'org'}), 'org')},
            { "label": "其他存储", "children": dealTreeData(gkClientInterface.getSideTreeList({sidetype: 'other'}), 'other')},
            { "label": "智能文件夹", "children": dealTreeData(gkClientInterface.getSideTreeList({sidetype: 'magic'}), 'magic')}
        ];

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleSelect = function (branch) {
            GKSession.File = GKFile.dealFileList([branch.data])[0];
            $location.path(GKPath.getPath('myfile ', branch.data.path, 'list'));

        };

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if (branch.expanded) {
                branch.children = dealFileData(gkClientInterface.getFileList({webpath: branch.data.path, dir: 1, mountid: 1}));
            }
        };

    }])
    .controller('fileBrowser', ['$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException', 'GKSession', 'GKFile', 'GKCilpboard', 'GKOpt', '$rootScope', function ($scope, $routeParams, $location, $filter, GKPath, GK, GKException, GKSession, GKFile, GKCilpboard, GKOpt, $rootScope) {
        /**
         * 当前的用户及文件信息
         * @type {*}
         */
        $scope.GKSesssion = GKSession;

        /**
         * 分析路径获取参数
         * @type {*}
         */
        var pathArr = $location.path().split('/');
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.partition = pathArr[1]; //当前的分区
        $scope.view = $routeParams ? $routeParams.view || '' : ''; //当前的视图模式
        $scope.order = '+file_name';
        /**
         * 文件列表数据
         */
        var getFileData = function (debug) {
            var fileList = gkClientInterface.getFileList({
                webpath: $scope.path,
                debug: debug
            });
            return GKFile.dealFileList(fileList);
        };

        $scope.fileData = getFileData();


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


        var getPartitionName = function (partition) {
            var partitionName = '';
            switch (partition) {
                case 'myfile':
                    partitionName = '我的文件';
                    break;
                case 'teamfile':
                    partitionName = '团队的文件';
                    break;
                case 'smartfolder':
                    partitionName = '智能文件夹';
                    break;
                default :
                    partitionName = '我的文件';
                    break;
            }
            return partitionName;
        };

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
                    bread.url = '#' + GKPath.getPath($scope.partition, $scope.path, $scope.view);
                    breads.push(bread);
                }
            }

            breads.unshift({
                name: getPartitionName($scope.partition),
                url: '#' + GKPath.getPath($scope.partition, '', $scope.view)
            });
            return breads;
        };

        $scope.breads = getBreads();

        /**
         * 改变视图
         */
        $scope.changeView = function (view) {
            $scope.view = view;
        }

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
        })

        var openFile = function (mount_id, webpath) {
            GK.open({
                mount_id: mount_id,
                webpath: webpath
            });
        };

        var allOpts = {
            'add': {
                name: '添加',
                index: 0,
                callback: function () {
                    var addFiles = gkClientInterface.addFileDialog();
                    if (!addFiles || !addFiles.list || !addFiles.list.length) {
                        return;
                    }
                    var params = {
                        webpath: $scope.path,
                        list: addFiles.list
                    };

                    GK.addFile(params).then(function () {

                    }, function (error) {
                        GKException.handleClientException(error);
                    })
                }
            },
            'new_folder': {
                name: '新建',
                index: 1,
                callback: function () {
                    $scope.$broadcast('fileNewFolderStart', function (new_file_name) {
                        var webpath = $scope.path ? $scope.path + '/' + new_file_name : new_file_name;
                        GK.createFolder({
                            webpath: webpath,
                            dir: 1
                        }).then(function () {
                                var newFileData = getFileData();
                                $scope.$broadcast('fileNewFolderEnd', newFileData, webpath);

                            }, function (error) {
                                GKException.handleClientException(error);
                            });
                    });
                }
            },
            'lock': {
                name: '锁定',
                index: 2,
                callback: function () {
                    var file = $scope.selectedFile[0];
                    GK.lock({
                        webpath: file.path
                    }).then(function () {
                            file.lock = 1;
                            file.lock_member_name = GKSession.User.username;
                            file.lock_member_id = GKSession.User.id;
                        }, function () {
                            GKException.handleClientException(error);
                        });
                }
            },
            'unlock': {
                name: '解锁',
                index: 3,
                callback: function () {
                    var file = $scope.selectedFile[0];
                    if (file.lock_member_id != GKSession.User.id) {
                        alert(file.lock_member_name + ' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 ' + file.lock_member_name + ' 先将其解锁。');
                        return;
                    }
                    GK.unlock({
                        webpath: file.path
                    }).then(function () {
                            file.lock = 0;
                            file.lock_member_name = 0;
                            file.lock_member_id = 0;
                        }, function () {
                            GKException.handleClientException(error);
                        });
                }
            },
            'save': {
                name: '另存为',
                index: 4,
                callback: function () {
                    var files = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        files.push({
                            webpath: value.path
                        })
                    });
                    var params = {
                        list: files,
                        mount_id: GKSession.User.mount_id
                    };

                    GK.saveToLocal(params).then(function () {
                        file.lock = 0;
                        file.lock_member_name = 0;
                        file.lock_member_id = 0;
                    }, function () {
                        GKException.handleClientException(error);
                    });
                }
            },
            'del': {
                name: '删除',
                index: 5,
                callback: function () {
                    var files = [];
                    angular.forEach($scope.selectedFile, function (value) {
                        files.push({
                            webpath: value.path
                        })
                    });
                    var params = {
                        list: files,
                        mount_id: GKSession.User.mount_id
                    };
                    var confirmMsg = '确定要删除' + ($scope.selectedFile.length == 1 ? '“' + $scope.selectedFile[0].file_name + '”' : '这' + $scope.selectedFile.length + '个文件（夹）') + '吗?';
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
                    }, function () {
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
                        var newpath = Util.String.ltrim(('/' + file.path).replace('/' + file.file_name, '/' + new_file_name), '/');
                        GK.rename({
                            oldpath: file.path,
                            newpath: newpath,
                            mount_id: GKSession.User.mount_id
                        }).then(function () {
                                file.path = newpath;
                                file.file_name = Util.String.baseName(file.path);
                                $scope.$broadcast('fileEditNameEnd');
                            }, function (error) {
                                $scope.$broadcast('fileEditNameEnd');
                                GKException.handleClientException(error);
                            });
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
                                setOrder('file_name');
                            });

                        }
                    },
                    'order_by_file_size': {
                        name: '大小',
                        className: $scope.order.indexOf('file_size') >= 0 ? 'current' : '',
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('file_size');
                            });
                        }
                    },
                    'order_by_file_type': {
                        name: '类型',
                        className: $scope.order.indexOf('file_type') >= 0 ? 'current' : '',
                        callback: function () {
                            $scope.$apply(function () {
                                setOrder('file_type');
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
         * 操作
         * @type {Array}
         */
        $scope.$watch('selectedFile', function () {
            $rootScope.selectedFile = $scope.selectedFile;
            var optKeys = GKOpt.getOpts(GKSession.File, $scope.selectedFile);
            $scope.opts = [];
            $scope.rightOpts = {};
            var excludeRightOpts = ['add']; //右键要排除的操作
            var excludeOpts = ['order_by']; // 顶部要排除的操作
            angular.forEach(optKeys, function (value) {
                if (excludeOpts.indexOf(value) < 0) {
                    $scope.opts.push(angular.extend(allOpts[value], {key: value}));
                }
            });
            var rightOptKeys = [];
            if (!$scope.selectedFile || !$scope.selectedFile.length) {
                rightOptKeys = GKOpt.getCurrentOpts(GKSession.File);
            } else if ($scope.selectedFile.length == 1) {
                rightOptKeys = GKOpt.getSingleSelectOpts($scope.selectedFile);
            } else {
                rightOptKeys = GKOpt.getMultiSelectOpts($scope.selectedFile);
            }

            angular.forEach(rightOptKeys, function (value) {
                if (excludeRightOpts.indexOf(value) < 0) {
                    $scope.rightOpts[value] = allOpts[value];
                }
            });

        }, true);

        $scope.$watch('order', function () {
            angular.forEach($scope.rightOpts['order_by']['items'], function (value, key) {
                if (key == 'order_by_' + $scope.order.slice(1)) {
                    value['className'] = 'current';
                } else {
                    value['className'] = '';
                }
            });

        })

        /**
         * 已选中的文件
         * @type {Array}
         */
        $scope.selectedFile = [];

        /**
         * ctrl-C的 处理函数
         */
        $scope.$on('ctrlC', function () {
            var data = {
                code: 'ctrlC',
                mount_id: GKSession.User.mount_id,
                files: $scope.selectedFile
            };
            GKCilpboard.setData(data);
        });

        /**
         * ctrl-X的 处理函数
         */
        $scope.$on('ctrlX', function () {
            var data = {
                code: 'ctrlX',
                mount_id: GKSession.User.mount_id,
                files: $scope.selectedFile
            }
            GKCilpboard.setData(data);
        });

        /**
         * ctrl-V的 处理函数
         */
        $scope.$on('ctrlV', function () {
            var data = GKCilpboard.getData();
            console.log(data);
            var params = {
                target: $scope.path,
                targetmountid: GKSession.User.mount_id,
                from_mountid: data.mount_id,
                from_list: data.files
            };
            if (data.code == 'ctrlC') {
                GK.copy(params).then(function () {
                    $scope.$broadcast('ctrlVEnd', getFileData('test12345'));
                    //GKCilpboard.clearData();
                }, function () {
                    GKException.handleClientException(error);
                });
            } else if (data.code == 'ctrlX') {
                GK.move(params).then(function () {
                    $scope.$broadcast('ctrlVEnd', getFileData('test123456'));
                    //GKCilpboard.clearData();
                }, function () {
                    GKException.handleClientException(error);
                });
            }
        });

        /**
         * 设置同步状态
         */
        $scope.toggleSync = function () {
            var sync = 1;
            var new_local_uri = GK.selectPath();
            var trimPath = Util.String.rtrim(Util.String.rtrim(new_local_uri, '/'), '\\\\');
            var currentFilename = Util.String.baseName(GKSession.File.path);
            if (!confirm('你确定要将文件夹' + currentFilename + '与' + trimPath + '进行绑定')) {
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
                mountid: 0
            });
            if (isNotEmpty == 1) {

            }
            if (sync) {
                params = {
                    webpath: GKSession.File.path,
                    fullpath: new_local_uri,
                    mount_id: GKSession.mountId,
                    overwrite: 1
                };
                GK.setLinkPath(params);
            } else {
                params = {
                    webpath: GKSession.File.path,
                    mount_id: GKSession.mountId
                }
                GK.removeLinkPath(params);
            }
        };
    }])

    .controller('rightSidebar', ['$scope', 'GKSession', 'RestFile', '$rootScope', 'GKApi', '$http', function ($scope, GKSession, RestFile, $rootScope, GKApi, $http) {
        $scope.GKSession = GKSession;
        var gird = /[,;；，\s]/g;
        /**
         * 监听已选择的文件
         */
        $scope.file = {}; //当前选择的文件
        $scope.shareMembers = []; //共享参与人
        $scope.remarks = []; //讨论
        $scope.histories = []; //历史
        $scope.inputingRemark = false;
        $scope.remindMembers = [];//可@的成员列表
        $scope.$watch('selectedFile', function () {
            $scope.inputingRemark = false;
            if (!$scope.selectedFile || !$scope.selectedFile.length) {

            } else if ($scope.selectedFile.length == 1) {
                $scope.file = $scope.selectedFile[0];
                var mount_id = 175625, fullpath = '100.gif';
                RestFile.get(mount_id, fullpath).success(function (data) {
                    var tag = data.tag || '';
                    $scope.file.tag = tag;
                    $scope.file.formatTag = tag.replace(gird, ',');
                });

//                GKApi.sideBar(GKSession.mount_id,$scope.file.path).success(function(data){
                $http.get('json/test.json').success(function (data) {
                    $scope.shareMembers = data.share_members;
                    $scope.remarks = data.remark;
                    $scope.histories = data.history;
                    $scope.remindMembers = data.remind_members;
                });
            } else {

            }
        }, true);

        /**
         * 添加注释
         * @param tag
         */
        $scope.addTag = function (tag) {
            var newTag = $scope.file.tag + ' ' + tag;

        };

        /**
         * 删除注释
         * @param tag
         */
        $scope.removeTag = function (tag) {
            var newTag = $scope.file.tag.replace(new RegExp(tag + '([,;；，\\s]|$)', 'g'), '');
        };

        /**
         * 取消发布备注
         */
        $scope.cancelPostRemark = function () {
            $scope.postText = '';
            $scope.inputingRemark = false;
        };

        /**
         * 发布讨论
         */
        $scope.postRemark = function () {
            if(!$scope.postText.length) return;
            //RestFile.remind(GKSession.mount_id,$scope.file.path,$scope.postText).success(function(data){
            $http.get('json/testRemind.json').success(function (data) {
                $scope.postText = '';
                $scope.inputingRemark = false;
                if (data && data.length) {
                    $scope.remarks.unshift(data[0]);
                }

            }).error(function(){

                });
        };

        $scope.folded = false;
        /**
         * 显示及缩小文件信息框
         */
        $scope.toggleFileInfoWrapper = function(){
            $scope.folded = !$scope.folded;
        };
    }])
;