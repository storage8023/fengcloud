'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' ,function ($scope, $location, GKPath) {

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
                    data: {
                        path: dataItem.path,
                        hash: dataItem.uuidhash
                    },
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
    .controller('fileBrowser', ['$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException','GKSession','GKFile', function ($scope, $routeParams, $location, $filter, GKPath, GK, GKException,GKSession,GKFile) {

        /**
         * 分析路径获取参数
         * @type {*}
         */
        var pathArr = $location.path().split('/');
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.partition = pathArr[1]; //当前的分区
        $scope.view = $routeParams ? $routeParams.view || '' : ''; //当前的视图模式

        /**
         * 文件列表数据
         */
        var fileList = gkClientInterface.getFileList({
            webpath: $scope.path
        });

        $scope.fileData = GKFile.dealFileList(fileList);


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
            $location.path($location.path().replace(/\/(list|thumb)/, '/' + view));
        }

        /**
         * 操作
         * @type {Array}
         */
        $scope.opts = [
            {
                name: 'add',
                text: '添加',
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
            {
                name: 'new_folder',
                text: '新建',
                callback: function () {

                    $scope.$broadcast('fileNewFolderStart', function (new_file_name) {
                        var webpath =  $scope.path ? $scope.path + '/' + new_file_name : new_file_name;
                        GK.createFolder({
                            webpath: webpath,
                            dir: 1
                        }).then(function () {
                                fileList = gkClientInterface.getFileList({
                                    webpath: $scope.path,
                                    newFileName:new_file_name
                                });
                                var newFileData = GKFile.dealFileList(fileList);
                                $scope.$broadcast('fileNewFolderEnd',newFileData,webpath);

                            }, function (error) {
                                GKException.handleClientException(error);
                            });
                    });
                }
            },
            {
                name: 'lock',
                text: '锁定',
                callback: function () {
                    var file = $scope.selectedFile[0];
                    GK.lock({
                        webpath: file.path
                    }).then(function () {
                            file.lock = 1;
                            file.lock_member_name = GKSession.username;
                            file.lock_member_id = GKSession.id;
                        }, function () {
                            GKException.handleClientException(error);
                        });
                }
            },
            {
                name: 'unlock',
                text: '解锁',
                callback:function(){
                    var file = $scope.selectedFile[0];
                    if(file.lock_member_id != GKSession.id){
                        alert(file.lock_member_name+' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 '+file.lock_member_name+' 先将其解锁。'+file.lock_member_name+' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 '+file.lock_member_name+' 先将其解锁。');
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
            {
                name: 'save',
                text: '另存为',
                callback:function(){
                    var files = [];
                    angular.forEach($scope.selectedFile,function(value){
                        files.push({
                            webpath:value.path
                        })
                    });
                    var params = {
                        list:files,
                        mount_id:GKSession.mount_id
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
            {
                name: 'del',
                text: '删除',
                callback:function(){
                    var files = [];
                    angular.forEach($scope.selectedFile,function(value){
                        files.push({
                            webpath:value.path
                        })
                    });
                    var params = {
                        list:files,
                        mount_id:GKSession.mount_id
                    };

                    GK.del(params).then(function () {
                        angular.forEach($scope.selectedFile,function(value){
                            angular.forEach($scope.fileData,function(file,key){
                                if(value == file){
                                    $scope.fileData.splice(key,1);
                                }
                            })
                        });
                    }, function () {
                        GKException.handleClientException(error);
                    });
                }
            },
            {
                name: 'rename',
                text: '重命名',
                callback:function(){
                    var file = $scope.selectedFile[0];
                    $scope.$broadcast('fileEditNameStart', file,function (new_file_name) {
                        var newpath = Util.String.ltrim(('/'+file.path).replace('/'+file.file_name,'/'+new_file_name),'/');
                        GK.rename({
                            oldpath: file.path,
                            newpath:newpath,
                            mount_id: GKSession.mount_id
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
            }
        ];

        $scope.selectedFile = [];

    }]);