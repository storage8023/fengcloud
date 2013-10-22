'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree'])
    .controller('leftSidebar', ['$scope', '$location', 'GKPath' , 'GKFile','$rootScope', function ($scope, $location, GKPath, GKFile,$rootScope) {
        $rootScope.PAGE_CONFIG = {};
        $rootScope.PAGE_CONFIG.user = $rootScope.User = gkClientInterface.getUser();
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

        var sideOrgList = gkClientInterface.getSideTreeList({sidetype: 'org'})['list'];
        var myMount = {},orgMount=[];
        angular.forEach(sideOrgList,function(value){
            if(value.orgid==0){
                myMount=value;
            }else{
                orgMount.push(value);
            }
        });
        $rootScope.PAGE_CONFIG.mountId = myMount.mountid;
        $scope.treeList = [
            { "label": "我的文件", data: {path: ''}, "children": dealFileData(gkClientInterface.getFileList({webpath: '', dir: 1, mountid: myMount.mountid})['list'], 'org')},
            { "label": "团队的文件", "children": dealTreeData(orgMount)},
            { "label": "智能文件夹", "children": dealTreeData(gkClientInterface.getSideTreeList({sidetype: 'magic'})['list'], 'magic')}
        ];

        $scope.initialSelection = $scope.treeList[0];

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleSelect = function (branch) {
            $rootScope.PAGE_CONFIG.mountId = myMount.mountid;
            $rootScope.PAGE_CONFIG.file =  $rootScope.File = GKFile.dealFileList([branch.data])[0];
            $location.search({
                path:branch.data.path,
                view:'list'
            });
        };

        /**
         * 选中树节点的处理函数
         * @param branch
         */
        $scope.handleExpand = function (branch) {
            if (branch.expanded) {
                branch.children = dealFileData(gkClientInterface.getFileList({webpath: branch.data.path, dir: 1, mountid: $rootScope.PAGE_CONFIG.mountId})['list']);
            }
        };

    }])
    .controller('fileBrowser', ['$scope', '$routeParams', '$location', '$filter', 'GKPath', 'GK', 'GKException', 'GKFile', 'GKCilpboard', 'GKOpt', '$rootScope', function ($scope, $routeParams, $location, $filter, GKPath, GK, GKException, GKFile, GKCilpboard, GKOpt, $rootScope) {
        /**
         * 分析路径获取参数
         * @type {*}
         */
        var pathArr = $location.path().split('/');
        $scope.path = $routeParams ? $routeParams.path || '' : '';  //当前的文件路径
        $scope.partition = pathArr[1]; //当前的分区
        $scope.view =  $routeParams ? $routeParams.view || 'list' : 'list'; //当前的视图模式
        $scope.order = '+file_name';

        /**
         * 文件列表数据
         */
        var getFileData = function (debug) {
            var fileList = gkClientInterface.getFileList({
                webpath: $scope.path,
                mountid: $rootScope.PAGE_CONFIG.mountId
            })['list'];
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

        var openFile = function (mount_id, webpath) {
            GK.open({
                mount_id: mount_id,
                webpath: webpath
            });
        };

        /**
         * 所有操作
         * @type {{add: {name: string, index: number, callback: Function}, new_folder: {name: string, index: number, callback: Function}, lock: {name: string, index: number, callback: Function}, unlock: {name: string, index: number, callback: Function}, save: {name: string, index: number, callback: Function}, del: {name: string, index: number, callback: Function}, rename: {name: string, index: number, callback: Function}, order_by: {name: string, index: number, items: {order_by_file_name: {name: string, className: string, callback: Function}, order_by_file_size: {name: string, className: string, callback: Function}, order_by_file_type: {name: string, className: string, callback: Function}, order_by_last_edit_time: {name: string, className: string, callback: Function}}}}}
         */
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
                        parent: $scope.path,
                        type:'save',
                        list: addFiles.list,
                        mountid:$rootScope.PAGE_CONFIG.mountId
                    };
                    GK.addFile(params).then(function () {
                        var newFileData = getFileData();
                        $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
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
                       var params = {
                           webpath: webpath,
                           dir: 1,
                           mountid:$rootScope.PAGE_CONFIG.mountId
                       };
                        GK.createFolder(params).then(function () {
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
                        webpath: file.path,
                        mountid:$rootScope.PAGE_CONFIG.mountId
                    }).then(function () {
                            file.lock = 1;
                            file.lock_member_name = $rootScope.User.username;
                            file.lock_member_id = $rootScope.User.id;
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
                    if (file.lock_member_id != $rootScope.User.id) {
                        alert(file.lock_member_name + ' 已经锁定了这个文件。你只能以只读方式查看它。如果你需要修改它，请让 ' + file.lock_member_name + ' 先将其解锁。');
                        return;
                    }
                    GK.unlock({
                        webpath: file.path,
                        mountid:$rootScope.PAGE_CONFIG.mountid
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
                        mountid: $rootScope.PAGE_CONFIG.mountId
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
                            webpath: value.path
                        })
                    });
                    var params = {
                        list: files,
                        mountid:  $rootScope.PAGE_CONFIG.mountId
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
                            mountid: $rootScope.PAGE_CONFIG.mountId
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
         * 已选中的文件
         * @type {Array}
         */
        $scope.selectedFile = [];
        $scope.rightOpts = [];
        /**
         * 操作
         * @type {Array}
         */
        $scope.$watch('selectedFile', function () {
            $rootScope.selectedFile = $scope.selectedFile;
            var optKeys = GKOpt.getOpts($rootScope.File, $scope.selectedFile);
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
                rightOptKeys = GKOpt.getCurrentOpts($rootScope.File);
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
         * ctrl-C的 处理函数
         */
        $scope.$on('ctrlC', function () {
            var data = {
                code: 'ctrlC',
                mount_id: $rootScope.User.mount_id,
                files: $rootScope.selectedFile
            };
            GKCilpboard.setData(data);
        });

        /**
         * ctrl-X的 处理函数
         */
        $scope.$on('ctrlX', function () {
            var data = {
                code: 'ctrlX',
                mount_id: $rootScope.User.mount_id,
                files: $scope.selectedFile
            }
            GKCilpboard.setData(data);
        });

        /**
         * ctrl-V的 处理函数
         */
        $scope.$on('ctrlV', function () {
            var data = GKCilpboard.getData();
            var params = {
                target: $scope.path,
                targetmountid: $rootScope.User.mount_id,
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
            var currentFilename = Util.String.baseName($rootScope.File.path);
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
                    webpath: $rootScope.File.path,
                    fullpath: new_local_uri,
                    mount_id: $rootScope.mountId,
                    overwrite: 1
                };
                GK.setLinkPath(params);
            } else {
                params = {
                    webpath: $rootScope.File.path,
                    mount_id: $rootScope.mountId
                }
                GK.removeLinkPath(params);
            }
        };
    }])
    .controller('rightSidebar', ['$scope', 'RestFile', '$rootScope', 'GKApi', '$http', function ($scope, RestFile, $rootScope, GKApi, $http) {
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
    .controller('header',['$scope','GKPath','$location','$filter',function($scope,GKPath,$location,$filter){

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
                    bread.url = '#' + GKPath.getPath($scope.partition,bread.path,$scope.view);
                    breads.push(bread);
                }
            }

            breads.unshift({
                name: $filter('getPartitionName')($scope.partition),
                url: '#' + GKPath.getPath($scope.partition, '',$scope.view)
            });
            return breads;
        };

        /**
         * 分析路径获取参数
         * @type {*}
         */
        $scope.$on('$locationChangeSuccess', function(){
            var pathArr = $location.path().split('/');
            var params = $location.search();
            $scope.partition = pathArr[1]; //当前的分区
            $scope.view = params.view||'list'; //当前的视图模式
            $scope.path =  params.path||'';  //当前的文件路径
            $scope.breads = getBreads();
        });

    }]);

    /**
     * news
     */
angular.module('gkNewsApp.controllers',['gkClientIndex.services'])
    .controller("newsCtrl",['$filter','$scope', '$rootScope','GKApi','$location','$http','GK',function($filter,$scope ,$rootScope,GKApi,$location,$http,GK){

        GKApi.upda(function(data){
            $scope.foo = data;
            $scope.haide = $scope.foo.array[0].dateline;
            alert($scope.haide);
        });


    /**
     * 过滤出相同日期
     * 新消息news
     * @compare()
     */

    function compare(dateObj) {
        var results = []
            ,i = 0
            ,j = 0
            ,len = dateObj.length;
        results[0] = new Array();
        results[0].push( dateObj[0] );
        for(;i<len - 1;i++){
            var next = dateObj[i+1],k = 0,klen = results[j].length;
            var value = results[j][results[j].length - 1];
            if(value.date === next.date){
                results[j].push(next);
            }
            else{
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
            ,month = date.getMonth() + 1 < 10 ? "0" + date.getMonth() + 1 : date.getMonth() + 1
            ,day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
        return year+'/'+month+'/'+ day;
    }

    /**
     *   日期按yyyy-MM-dd格式输出
     *   新消息news
     *   @filterDay()
     */
    Date.prototype.format =function(format)
    {
        var o = {
            "M+" : this.getMonth()+1, //month
            "d+" : this.getDate(), //day
            "h+" : this.getHours(), //hour
            "m+" : this.getMinutes(), //minute
            "s+" : this.getSeconds(), //second
            "q+" : Math.floor((this.getMonth()+3)/3), //quarter
            "S" : this.getMilliseconds() //millisecond
        };
        if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
            (this.getFullYear()+"").substr(4- RegExp.$1.length));
        for(var k in o)if(new RegExp("("+ k +")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length==1? o[k] :
                    ("00"+ o[k]).substr((""+ o[k]).length));
        return format;
    };

    Date.prototype.yesterformat =function(yesterformat)
    {
        var o = {
            "M+" : this.getMonth()+1, //month
            "d+" : this.getDate()-1, //day
            "h+" : this.getHours(), //hour
            "m+" : this.getMinutes(), //minute
            "s+" : this.getSeconds(), //second
            "q+" : Math.floor((this.getMonth()+3)/3), //quarter
            "S" : this.getMilliseconds() //millisecond
        };
        if(/(y+)/.test(yesterformat)) yesterformat=yesterformat.replace(RegExp.$1,
            (this.getFullYear()+"").substr(4- RegExp.$1.length));
        for(var k in o)if(new RegExp("("+ k +")").test(yesterformat))
            yesterformat = yesterformat.replace(RegExp.$1,
                RegExp.$1.length==1? o[k] :
                    ("00"+ o[k]).substr((""+ o[k]).length));
        return yesterformat;
    };

    /**
     * 过滤今天，昨天或者以前
     * 新消息news
     * @filterDay()
     */
    function filterDay(filter,dates) {
        var date = filter('date');
        var printDateNew = [];
        var d = new Date();
        var nowDate = new Date(Date.parse(fetchDateline(d))).getTime() /1000- d.getTimezoneOffset();
        var yesterDate = nowDate -  3600 * 24;
        for(var i = 0;i<dates.length;i++){
            var printDate = [];
            var currentDate = dates[i][0].dateline;
            if( currentDate >= nowDate ){
                for(var j = 0;j<dates[i].length;j++){
                    if(j === 0){
                        var newsDay = new Date().format('MM-dd');
                        printDate.push({'date':'今天， '+newsDay, "dateline":dates[i][j]['dateline'],render_text: dates[i][j]['render_text']});
                    }else{
                        printDate.push({"dateline":dates[i][j]['dateline'],render_text: dates[i][j]['render_text']});
                    }
                }
                printDateNew.push(printDate);
            }
            else if( currentDate >= yesterDate ){
                for(var j = 0;j<dates[i].length;j++){
                    if(j === 0){
                        var yesterDay = new Date().yesterformat('MM-dd');
                        printDate.push({"date":'昨天， '+yesterDay,"dateline":dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                    }else{
                        printDate.push({"dateline":dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                    }
                }
                printDateNew.push(printDate);
            }else {
                for(var j = 0;j<dates[i].length;j++){
                    if(j === 0){
                        printDate.push({'date': dates[i][j]['date'],"dateline":dates[i][j]['dateline'],  render_text: dates[i][j]['render_text']});
                    }else{
                        printDate.push({"dateline":dates[i][j]['dateline'],  render_text: dates[i][j]['render_text']});
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

        var  againNew = function(filter,dates) {
            var date = filter('date');
            var printDateNew = [];
            var d = new Date();
            var nowDate = new Date(Date.parse(fetchDateline(d))).getTime() /1000- d.getTimezoneOffset();
            var yesterDate = nowDate -  3600 * 24;
            for(var i = 0;i<dates.length;i++){
                var printDate = [];
                var currentDate = dates[i][0].dateline;
                if(lastime === dates[0][0].date){
                    for(var j = 0;j<dates[i].length;j++){
                        printDate.push({"dateline":dates[i][j]['dateline'],render_text: dates[i][j]['render_text']});
                    }
                    printDateNew.push(printDate);
                } else if( currentDate >= yesterDate ){
                    for(var j = 0;j<dates[i].length;j++){
                        if(j === 0){
                            var yesterDay = new Date().yesterformat('MM-dd');
                            printDate.push({"date":'昨天， '+yesterDay,"dateline":dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                        }else{
                            printDate.push({"dateline":dates[i][j]['dateline'], "render_text": dates[i][j]['render_text']});//代表昨天
                        }
                    }
                    console.log(yesterDate);
                    printDateNew.push(printDate);
                }else {
                    for(var j = 0;j<dates[i].length;j++){
                        if(j === 0){
                            printDate.push({'date': dates[i][j]['date'],"dateline":dates[i][j]['dateline'],  render_text: dates[i][j]['render_text']});
                        }else{
                            printDate.push({"dateline":dates[i][j]['dateline'],  render_text: dates[i][j]['render_text']});
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
        var lasttime = function(filter,dates){
            var last = [];
            for(var i = 0;i<dates.length;i++){
                if(i = dates.length-1){
                    for(var j = 0;j<dates[i].length;j++){
                        if(j === dates[i].length-1 ){
                            last.push({"dateline":dates[i][j].dateline,"date":dates[i][j].date});
                        }
                    }
                }
            }
            return last;
        };

        /**
         * 消息再处理
         */
    var newMessage = function($scope){
        var newGetMessageData = JSON.parse(GKUpdates())
       ,data = newGetMessageData.updates
       ,filterData = compare(data);
        $scope.equalDataNew = filterDay($filter, filterData);
         $scope.lasttimelabel = lasttime(data);
         if(newGetMessageData.update_count>0){
                $scope.newsShow = 'yesNews';
         }else{
                $scope.newsShow = 'noNews';
         }
    };


     /**
     * 单击向上向下滑动按钮
     * 新消息news
     * button - #newsbtn
     */
     var newsControls = function(){
     jQuery("#newsbtn").click(function(){
     //      newMessage();
           jQuery(".news-wrapper").slideToggle(500);
     });
     jQuery("#newsPackUp").click(function(){
         jQuery(".news-wrapper").slideUp(500);
     });
     };
     newsControls();

     $scope.newsScroll = function(){

     }
 /* var newsControls = function(){
        jQuery("#newsbtn").click(function(){
            var data = 0 // gGetMessage()
                ,filterData = compare(data) //过滤出相同日期
                ,equalData = filterDay($filter, filterData);
            $scope.equalDataNew = equalData;
            $scope.newsbtn = 'SideUp';
            jQuery(".news-wrapper").slideToggle(500);
        });
        jQuery("#newsPackUp").click(function(){
            jQuery(".news-wrapper").slideUp(500);
        });
    };
    newsControls();*/
}]);

    /**
     * personal
     */
angular.module("gkPersonalApp.controllers",[])
    .controller("personalCtrl",function($scope){
    var gUserInfo = [
        {
            "org_id":1,
            "id":2,
            "email":"xugetest1@126.com",
            "username":"海浩",
            "org_username":"123",
            "photourl":"http://oss.aliyuncs.com/gkavatar2/39/398fd1f3fb5f3f7b1077d623c5ade70b1c63b50b.jpg",
            "mount_id":2,
            "capacity":0,
            "size":59321948,
            "org_name":"web开发组",
            "org_size":108209585,
            "call":88888888
        }
    ];
    $scope.gSideTreeList = [
        {
            "sidetype":0,
            "name":"够快科技"
        },
        {
            "sidetype":1,
            "name":"够快科技"
        },
        {
            "sidetype":2,
            "name":"够快科技"
        }
    ];

    function bitSize(num,  decimal) {
        if (typeof(num) != 'number') {
            num = Number(num);
        }
        if (typeof(decimal) != 'number'){
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

    function perside(data){
        var newData = [];
        for(var i = 0, len = data.length;i<len;i++){
            if(data[i].sidetype === 0){
                newData.push({ "name":"够快科技","admin":"超级管理员","management":"管理"});
            }else if(data[i].sidetype === 1){
                newData.push({ "name":"够快科技","admin":"管理员","management":"管理"});
            }else{
                newData.push(data[i]);
            }
        }
        return newData;
    }
    //个人信息
    $scope.guser_info = gUserInfo[0];
    $scope.size_space = bitSize($scope.guser_info.size);
    //团队信息
    $scope.per_gSideTreeList = $scope.gSideTreeList;
    $scope.pernewgSideTreeList = perside($scope.per_gSideTreeList);
    //团队信息再处理
    console.log($scope.pernewgSideTreeList);
});

    /**
     * site
     */
angular.module("gkSiteApp.controllers",[])
    .controller("siteCtrl",function($scope) {
        $scope.userInfo = {
            'auto': 1,
            'prompt': 1,
            'recycle': 1,
            'syncicon': 1,
            'classic': 0
        };
        $scope.postUserInfo = function() {
            var userInfo = {
                auto: (typeof $scope.userInfo.auto !== 'number' ) ? $scope.userInfo.auto === true ? 1 : 0 : $scope.userInfo.auto,
                prompt: (typeof $scope.userInfo.prompt !== 'number') ? $scope.userInfo.prompt === true ? 1 : 0 : $scope.userInfo.prompt,
                recycle: (typeof $scope.userInfo.recycle !== 'number') ? $scope.userInfo.recycle === true ? 1 : 0 : $scope.userInfo.recycle,
                syncicon: (typeof $scope.userInfo.syncicon !== 'number') ? $scope.userInfo.syncicon === true ? 1 : 0 : $scope.userInfo.syncicon,
                classic: (typeof $scope.userInfo.classic !== 'number') ? $scope.userInfo.classic === true ? 1 : 0 : $scope.userInfo.classic
            };
            //gkClientInterface.sSetClientInfo(userInfo);
            console.log(userInfo);
        }
    });

    /**
     * contact
     */
angular.module("gkContactApp.controllers",['angularBootstrapNavTree'])
    .controller('contactCtrl', function($scope) {
        $scope.groups = [
            {
                group_name: '够快科技',
                group_id:222,
                children: [
                    {

                        data:111,
                        label: '人事部'
                    }
                ]
            },
            {
                group_name: '牛逼哄哄',
                group_id:222,
                children: [
                    {
                        group_name: '书生部',
                        group_id:111
                    }
                ]
            }
        ];

        $scope.group = [
            {
                name:'海浩',
                email:'123456@qq.com',
                id:123
            },
            {
                name:'xx',
                email:'123456@qq.com'
            }
        ];
        $scope.contactTree = function(branch) {
            $scope.output = branch.data;
        };

        function fetchData(serverData) {
            var i = 0
                ,len = serverData.length
                ,item = '';
            for(;i<len;i++){
                item = JSON.stringify(serverData[i]).replace(/group_name/gi,'label').replace(/group_id/gi, 'data');
                serverData.splice(i,1,JSON.parse(item));
            }
            return serverData;
        }
        //点击选择分组按钮
        jQuery('.selectGroup').click ( function() {
            var selectGroupButton =  jQuery('.contact-content-team').find('.contact-content-normal');
            if(jQuery(this).data('group') === '选择') {
                selectGroupButton.text('选择');
                jQuery(this).data('group','确定');
            }else{
                selectGroupButton.text('确定');
                jQuery(this).data('group','选择');
            }

        });
        //点击单选选择和确定按钮
        jQuery('.contact-content-group').click( function(e) {
            if(jQuery('.selectGroup').data('group') === "选择") return;
            if(e.target.className === "contact-content-normal") {
                (jQuery(e.target).text() === "选择") ? jQuery(e.target).text('确定') : jQuery(e.target).text('选择');
            }
        });
        //点击确定提交按钮
        $scope.perPostShare = function() {
            var shareData = [];
            $.each(jQuery('.contact-content-team'), function() {
                if(jQuery(this).find('.contact-content-normal').text() === '确定') {
                    shareData.push(
                        {
                            name: $scope.group[jQuery(this).index()].name,
                            email: $scope.group[jQuery(this).index()].email,
                            id: $scope.group[jQuery(this).index()].id
                        }
                    )
                }
            });
            // console.log(shareData);
        };
        $scope.example_treedata = fetchData($scope.groups);
    });

    /**
     * viewmember
     */
angular.module("gkViewmemberApp.controllers",['angularBootstrapNavTree'])
    .controller('viewmemberCtrl', function($scope) {
        $scope.groups = [
            {
                group_name: '够快科技',
                group_id:222,
                children: [
                    {

                        data:111,
                        label: '人事部'
                    }
                ]
            },
            {
                group_name: '牛逼哄哄',
                group_id:222,
                children: [
                    {
                        group_name: '书生部',
                        group_id:111
                    }
                ]
            }
        ];
        $scope.group = [
            {
                name:'海浩',
                email:'123456@qq.com',
                id:123
            },
            {
                name:'xx',
                email:'123456@qq.com'
            }
        ];
        $scope.contactTree = function(branch) {
            $scope.output = branch.data;
        };

        function fetchData(serverData) {
            var i = 0
                ,len = serverData.length
                ,item = '';
            for(;i<len;i++){
                item = JSON.stringify(serverData[i]).replace(/group_name/gi,'label').replace(/group_id/gi, 'data');
                serverData.splice(i,1,JSON.parse(item));
            }
            return serverData;
        }
        $scope.example_treedata = fetchData($scope.groups);
    });

    /**
 * sharingseggings
 */
angular.module("gkSharingsettingsApp.controllers",[])
    .controller('sharingsettingsCtrl', function($scope) {
        $scope.sharingsettings = [
            {
                name:'大哥',
                email:'123456qq.com',
                id:123
            },
            {
                name:'小弟',
                email:'123456@qq.com',
                id:123
            }
        ]
        console.log($scope.sharingsettings);
    });


