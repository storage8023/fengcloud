'use strict';

/* Controllers */

angular.module('gkClientIndex.controllers', ['angularBootstrapNavTree']).
    controller('leftSidebar', function ($scope) {

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
        var dealFileData = function (fileData,type) {
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
            console.log(branch);
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

    })
    .controller('fileBrowser', function ($scope, $routeParams,$location,$filter) {
        var pathArr = $location.path().split('/');
        var pageParams = {
            path:$routeParams?$routeParams.path||'':'',
            partition:pathArr[1],
            view:pathArr[3]
        };

        $scope.pageParams = pageParams;

        /**
         * 文件类型列表
         * @type {{SORT_SPEC: Array, SORT_MOVIE: Array, SORT_MUSIC: Array, SORT_IMAGE: Array, SORT_DOCUMENT: Array, SORT_CODE: Array, SORT_ZIP: Array, SORT_EXE: Array}}
         */
        var FILE_SORTS = {
            'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'],
            'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
            'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
            'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd'],
            'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt'],
            'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
            'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
            'SORT_EXE': ['exe', 'bat', 'com']
        };

        var fileList = gkClientInterface.getFileList({
            webpath:pageParams.path
        });

        /**
         * 获取文件类型的前缀
         * @param filename
         * @param dir
         * @param share
         * @param local
         * @returns {string}
         */
        var  getFileIconSuffix = function (filename, dir, share, local) {
            var suffix = '';
            var sorts = FILE_SORTS;
            if (dir) {
                suffix = 'folder';
                if (share > 0) {
                    if (local == 1) {
                        suffix = 'local_' + suffix;
                    } else if (local == 2) {
                        suffix = 'private_' + suffix;
                    } else {
                        suffix = 'shared_' + suffix;
                    }
                }
            } else {
                var ext = Util.String.getExt(filename);
                if (jQuery.inArray(ext, sorts['SORT_MOVIE']) > -1) {
                    suffix = 'movie';
                } else if (jQuery.inArray(ext, sorts['SORT_MUSIC']) > -1) {
                    suffix = 'music';
                } else if (jQuery.inArray(ext, sorts['SORT_IMAGE']) > -1) {
                    suffix = 'image';
                } else if (jQuery.inArray(ext, sorts['SORT_DOCUMENT']) > -1) {
                    suffix = 'document';
                } else if (jQuery.inArray(ext, sorts['SORT_ZIP']) > -1) {
                    suffix = 'compress';
                } else if (jQuery.inArray(ext, sorts['SORT_EXE']) > -1) {
                    suffix = 'execute';
                } else {
                    suffix = 'other';
                }
            }
            return suffix;
        };

        var getFileTypeName = function(type){
            var typeName;
            switch (type){
                case 'movie':
                    typeName = '视频';
                    break;
                case 'music':
                    typeName = '音频';
                    break;
                case 'image':
                    typeName = '图像';
                    break;
                case 'document':
                    typeName = '文档';
                    break;
                case 'compress':
                    typeName = '压缩文件';
                    break;
                case 'execute':
                    typeName = '可执行文件';
                    break;
                default:
                    typeName = '未知文件';
                    break;
            }
            return typeName;
        };

        /**
         * 获取文件类型
         * @param type
         * @param dir
         */
        var getFileType = function (type, dir) {
            return dir ? '文件夹' : getFileTypeName(type);
        };

        var fileData = [],file;
        /**
         * 文件列表数据
         */
        angular.forEach(fileList, function (value) {
            var type = getFileIconSuffix(value.name,value.dir);
            var ext = value.dir==1?'':Util.String.getExt(value.name);
            file = {
                file_name:Util.String.baseName(value.path),
                file_size:value.dir == 1 ? '-' : Util.Number.bitSize(value.filesize),
                file_type:ext+getFileType(type, value.dir),
                last_edit_time: $filter('date')(value.lasttime*1000, 'yyyy/M/d H:m'),
                file_icon:'icon_'+type,
                thumb:'img/icon/'+type+'128x128.png',
                path:value.path
            };
            fileData.push(file);
        });

        $scope.fileData = fileData;

        $scope.gridOptions = {
            data:'fileData',
            multiSelect:false,
            rowTemplate:'partials/file_row.html',
            headerRowTemplate:'partials/file_head_row.html',
            rowHeight:42,
            columnDefs: [
                {
                    field:'file_name',
                    displayName:'文件名',
                    cellTemplate:'partials/file_cell_name.html',
                    headerCellTemplate:'partials/file_head_cell.html'
                },
                {
                    field:'file_size',
                    displayName:'大小',
                    cellTemplate:'partials/file_cell_filesize.html',
                    headerCellTemplate:'partials/file_head_cell.html'
                },
                {
                    field:'file_type',
                    displayName:'文件类型',
                    cellTemplate:'partials/file_cell_filetype.html',
                    headerCellTemplate:'partials/file_head_cell.html'
                },
                {
                    field:'last_edit_time',
                    displayName:'最后修改时间',
                    cellTemplate:'partials/file_cell_last_edit_time.html',
                    headerCellTemplate:'partials/file_head_cell.html'
                }
            ]
        };

        $scope.multiSelect = false;

        /**
         * 当击文件
         * @param $event
         * @param file
         */

        var selectedFile = [], //当前已选中的条目
            selectFile;  //选中函数

        selectFile = function(file){
            if(!$scope.multiSelect && selectedFile && selectedFile.length ){
                angular.forEach(selectedFile,function(value){
                    value.selected = false;
                });
            }
            file.selected = true;
            selectedFile.push(file);
        };

        $scope.handleClick = function($event,file){
           selectFile(file);
        };

        /**
         * 双击文件
         * @param $event
         * @param file
         */
        $scope.handleDblClick = function($event,file){
            var param = [pageParams.partition,file.path,pageParams.view];
            var path = Util.String.rtrim(param.join('/'),'/');
            $location.path(Util.String.rtrim(param.join('/'),'/'));
        };

        var getPartitionName = function(partition){
           var partitionName = '';
            switch (partition){
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
        var getBreads = function(){
            var path = Util.String.rtrim(Util.String.ltrim(pageParams.path||'', '/'), '/'),breads = [], bread;
            if(path.length){
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
                    breads.push(bread);
                }
            }

            breads.unshift({
                name:getPartitionName(pageParams.partition),
                path:''
            });
            return breads;
        };

        $scope.breads = getBreads();

        /**
         * 改变视图
         */
        $scope.changeView = function(view){
            $location.path($location.path().replace(/\/(list|thumb)/,'/'+view));
        }

    });