'use strict';

/* Services */

angular.module('gkClientIndex.services', [])
    .factory('GKPath', function () {
        return {
            getPath: function () {
                var paramArr = Array.prototype.slice.call(arguments);
                var params = {
                    path: paramArr[1],
                    view: paramArr[2]
                };
                return '/' + paramArr[0] + '?' + jQuery.param(params);
            }
        }
    })
/**
 * 对请求后返回的错误的处理
 */
    .factory('GKException', [function () {
        return {
            handleClientException: function (error) {
                alert(error.message);
            }
        }
    }])
    .factory('GK', ['$q', function ($q) {
        return {
            addFile: function (params) {
                var re = gkClientInterface.addFile(params);
                var deferred = $q.defer();
                if (re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            createFolder: function (params) {
                var re = gkClientInterface.createFolder(params);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            lock: function (params) {
                gkClientInterface.lock(params);
            },
            unlock: function (params) {
                gkClientInterface.unlock(params);
            },
            getUser: function () {
                return gkClientInterface.getUser();
            },
            saveToLocal: function (params) {
                gkClientInterface.saveToLocal(params);
            },
            del: function (params) {
                console.log(params);
                var re = gkClientInterface.del(params);
                console.log(re);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            rename: function (params) {
                var re = gkClientInterface.rename(params);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            copy: function (params) {
                var re = gkClientInterface.copy(params);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            move: function (params) {
                var re = gkClientInterface.move(params);
                console.log(re);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            open: function (params) {
                gkClientInterface.open(params);

            },
            selectPath: function (params) {
                return gkClientInterface.selectPath(params);
            },
            checkPathIsEmpty: function (params) {
                return gkClientInterface.checkPathIsEmpty(params);
            },
            setLinkPath: function (params) {
                var re = gkClientInterface.setLinkPath(params);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            removeLinkPath: function (params) {
                var re = gkClientInterface.removeLinkPath(params);
                var deferred = $q.defer();
                if (!re || re.error == 0) {
                    deferred.resolve(re);
                } else {
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            getRestHost: function () {
                return gkClientInterface.getRestHost();
            },
            getApiHost: function () {
                return gkClientInterface.getApiHost();
            },
            getToken: function () {
                return gkClientInterface.getToken();
            },
            getAuthorization: function (ver, webpath, date, mountid) {
                return gkClientInterface.getAuthorization(ver, webpath, date, mountid);
            },
            getApiAuthorization: function (params) {
                return gkClientInterface.getApiAuthorization(params);
            },
            getLocalSyncURI: function (params) {
                return gkClientInterface.getLocalSyncURI(params);
            }
        }
    }])
    .constant('FILE_SORTS', {
        'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'],
        'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
        'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
        'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd'],
        'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt'],
        'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
        'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
        'SORT_EXE': ['exe', 'bat', 'com']
    })
    .factory('GKFile', ['FILE_SORTS', 'GKMounts', function (FILE_SORTS, GKMounts) {
        var GKFile = {
            getMountById: function (mountID) {
                var context = this;
                return context.formatMountItem(GKMounts[mountID]);
            },
            dealTreeData: function (data, type, mountId) {
                var newData = [],
                    item,
                    label,
                    context = this;
                angular.forEach(data, function (value) {
                    if(type=='myfile' || type=='teamfile'){
                        if (!value.path) {
                            value = context.formatMountItem(value);

                            label = value.name;
                        } else {
                            value = context.formatFileItem(value);
                            label = value.filename;
                            mountId && angular.extend(value, {
                                mount_id: mountId
                            });
                        }
                        item = {
                            label: label,
                            isParent: true,
                            data: value
                        };
                    }else{
                        item = {
                            label: value.name,
                            isParent: false,
                            data: value,
                            iconNodeExpand:value.icon,
                            iconNodeCollapse:value.icon
                        };
                    }
                    newData.push(item);
                });
                return newData;
            },
            formatMountItem: function (mount) {
                var newMount = {
                    mount_id: mount.mountid,
                    name: mount.name ? mount.name : '我的资料库',
                    org_id: mount.orgid,
                    capacity: mount.total,
                    size: mount.use,
                    org_capacity: mount.orgtotal,
                    org_size: mount.orguse,
                    type: mount.type,
                    fullpath: ''
                };
                return newMount;
            },
            formatFileItem: function (value, source) {
                //console.log(value);
                var file;
                if (source == 'api') {
                    var ext = value.dir == 1 ? '' : Util.String.getExt(value.filename);
                    file = {
                        filename: value.filename,
                        filesize: parseInt(value.filesize),
                        ext: ext,
                        last_edit_time: parseInt(value.last_dateline),
                        fullpath: Util.String.rtrim(value.fullpath, '/'),
                        lock: value.lock || 0,
                        lock_member_name: value.lock_member_name || '',
                        lock_member_id: value.lock_member_id || 0,
                        dir: value.dir,
                        last_member_name: value.last_member_name || '',
                        creator_member_name: value.creator_member_name || ''
                    };
                } else {
                    var fileName = Util.String.baseName(value.path);
                    var ext = value.dir == 1 ? '' : Util.String.getExt(fileName);
                    file = {
                        filename: fileName,
                        filesize: parseInt(value.filesize),
                        ext: ext,
                        last_edit_time: parseInt(value.lasttime),
                        fullpath: value.path,
                        lock: value.lock,
                        lock_member_name: value.lockname,
                        lock_member_id: value.lockid,
                        dir: value.dir,
                        last_member_name: value.lastname,
                        creator_member_name: value.creatorname,
                        status: value.status
                    };
                }
                return file;
            },
            dealFileList: function (fileList, source) {
                var fileData = [], file, context = this;
                angular.forEach(fileList, function (value) {
                    file = context.formatFileItem(value, source);
                    fileData.push(file);
                });
                return fileData;
            },
            /**
             * 获取文件类型
             * @param type
             * @param dir
             */
            getFileType: function (type, dir) {
                return dir ? '文件夹' : GKFile.getFileTypeName(type);
            },
            getFileTypeName: function (type) {
                var typeName;
                switch (type) {
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
                        typeName = '文件';
                        break;
                }
                return typeName;
            },
            /**
             * 获取文件类型的前缀
             * @param filename
             * @param dir
             * @param share
             * @param local
             * @returns {string}
             */
            getFileIconSuffix: function (filename, dir, share, local) {
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
            }
        };
        return GKFile;
    }])
    .factory('GKCilpboard', [function () {
        var GKClipboard = {
            data: null,
            setData: function (data) {
                this.data = data;
            },
            getData: function () {
                return this.data;
            },
            clearData: function () {
                this.data = null;
            },
            isEmpty:function(){
                return !this.data;
            }
        };
        return GKClipboard
    }])
    .factory('GKOpt', ['GKCilpboard',function (GKCilpboard) {
        var GKOpt = {
            getOpts: function (currentFile, selectedFiles, partition, search) {
                var
                    currentOpts = this.getCurrentOpts(currentFile, partition, search),
                    multiOpts = this.getMultiSelectOpts(selectedFiles),
                    singleOpts = this.getSingleSelectOpts(selectedFiles);
                return this.getFinalOpts(currentOpts, multiOpts, singleOpts);
            },
            getFinalOpts: function () {
                var arr = Array.prototype.slice.call(arguments);
                return Array.prototype.concat.apply([], arr);

            },
            getCurrentOpts: function (currentFile, partition, search) {
                var context = this;
                if (search || partition =='smartfolder') {
                    return [];
                } else {
                    var opts =  ['add', 'new_folder', 'order_by','paste'];
                    if(GKCilpboard.isEmpty()){
                        context.disableOpt(opts,'paste');
                    }
                    return opts;
                }
            },
            getMultiSelectOpts: function (files) {
                if (!files || files.length <= 1) {
                    return [];
                }
                return ['del','cut','copy'];
            },
            getSingleSelectOpts: function (files) {
                if (!files || files.length != 1) {
                    return [];
                }
                var file = files[0];
                var opts = ['lock', 'unlock', 'save', 'del', 'rename','cut','copy'];
                if (file.dir == 1) {
                    this.disableOpt(opts, 'lock', 'unlock');
                } else {
                    if (file.lock == 1) {
                        this.disableOpt(opts, 'lock');
                    } else {
                        this.disableOpt(opts, 'unlock');
                    }
                }
                return opts;
            },
            disableOpt: function (opts) {
                var disableOpts = Array.prototype.slice.call(arguments).splice(1);
                var l = opts.length;
                for (var i = opts.length - 1; i >= 0; i--) {
                    if (disableOpts.indexOf(opts[i]) >= 0) {
                        opts.splice(i, 1);
                    }
                }
            }
        };
        return GKOpt
    }])
    .factory('RestFile', ['GK', '$http', function (GK, $http) {
        var restFile = {
            get: function (mount_id, fullpath) {
                var date = new Date().toUTCString();
                var method = 'GET';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: {
                        'x-gk-mount': mount_id,
                        'Date': date,
                        'Authorization': authorization
                    }
                })
            },
            remind: function (mount_id, fullpath, message) {
                var date = new Date().toUTCString();
                var method = 'REMIND';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: {
                        'x-gk-mount': mount_id,
                        'x-gk-bool': 1,
                        'Date': date,
                        'Authorization': authorization,
                        'Content-Type': "application/x-www-form-urlencoded"
                    },
                    data: jQuery.param({
                        message: message
                    })
                })
            }
        };

        return restFile;
    }
    ])
    .factory('GKApi', ['GK', '$http', function (GK, $http) {
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        var defaultParams = {
            token: GK.getToken()
        }
        var GKApi = {
            createSmartFolder: function (mount_id, name, condition, description) {
                var params = {
                    mount_id: mount_id,
                    name: name,
                    condition: condition,
                    description: description||''
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/file/save_search',
                    data:jQuery.param(params)
                });
            },
            searchFile: function (condition, mount_id) {

                var params = {
                    mount_id: mount_id,
                    condition: condition
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/file/search',
                    data: jQuery.param(params)
                });
            },
            smartFolderList:function(code){
                var params = {
                    code: code
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/file/search',
                    params: params
                });
            },
            starFileList:function(){
                var params = {};
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost() + '/1/file/favorites',
                    params: params
                });
            },
            recentFileList:function(){
                var params = {};
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost() + '/1/file/recent_modified',
                    params: params
                });
            },
            inboxFileList:function(){
                var params = {};
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost() + '/1/file/inbox',
                    params: params
                });
            },
            sideBar: function (mount_id, fullpath, type, start, date) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    type: type || '',
                    start: start || '',
                    date: date || ''
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost() + '/1/file/client_sidebar',
                    params: params
                });
            },
            setTag: function (mount_id, fullpath, keyword) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    keywords: keyword
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/file/keyword',
                    data: jQuery.param(params)
                });
            },
            update: function () {
                var params = {
                    dateline:Date.parse(new Date())/1000,
                    size:20
                };
               angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/updates/ls',
                    params: params
                });
            },
            teamInvitePending: function () {
                var sign = GK.getApiAuthorization(defaultParams);
                defaultParams.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost() + '/1/team/invite_pending',
                    params: defaultParams
                });
            },
            teamManage: function (data) {
                var params = {
                    org_id: data
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/updates/',
                    params:params
                });
            },
            teamQuit: function (data) {
                var params = {
                    org_id: data
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/team/quit',
                    params: params
                });
            },
            teamInviteReject: function (data, code) {
                var params = {
                    org_id: data,
                    code: code
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/team/invite_reject',
                    params: params
                });
            },
            teamInviteJoin: function (data, code) {
                var params = {
                    org_id: data,
                    code: code
                };
                angular.extend(params, defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost() + '/1/team/invite_accept',
                    params: params
                });
            },
            teamGroupsMembers:function(data){
                var params = {
                    org_id:data
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost()+'/1/team/groups_and_members',
                    params:params
                });
            },
            groupMember:function(data){
                var params = {
                    org_id:data
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost()+'/1/team/group_member',
                    params:params
                });
            },
            teamsearch:function(org_id,keyword){
                var params = {
                    org_id:org_id,
                    key:keyword
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost()+'/1/team/search',
                    params:params
                });
            },
            /**
             * 获取设备列表
             * @returns {*}
             */
            devicelist:function(){
                var sign = GK.getApiAuthorization(defaultParams);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/account/device_list',
                    params:params
                });
            },
            /**
             * 启用禁止设备
             * @returns {*}
             */
            toggledevice:function(device_id,state){
                var params = {
                    device_id:device_id,
                    state:state
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/account/toggle_device',
                    params:params
                });
            },
            /**
             * 删除设备
             * @returns {*}
             */
            deldevice:function(org_id,keyword){
                var params = {
                    device_id:device_id,
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/account/del_device',
                    params:params
                });
            },
        }
        return GKApi;
    }])
    .factory('GKMounts', ['$filter', function ($filter) {
        var GKMounts = [];
        var mounts = gkClientInterface.getSideTreeList({sidetype: 'org'})['list'];
        angular.forEach(mounts, function (value) {
            if (!value.name) {
                value.name = $filter('getPartitionName')('myfile');
            }
            GKMounts[value.mountid] = value;
        });
        return GKMounts;
    }
    ])
    .factory('GKMyMount', ['GKMounts', function ($filter, GKMounts) {
        var GKMyMount = null;
        angular.forEach(GKMounts, function (value) {
            if (value.orgid == 0) {
                GKMyMount = value;
            }
        });
        return GKMyMount;
    }
    ])
  /*  .factory('selectMemberModal',['$modal',function($modal){
        return {
            open:function(orgId){
                return $modal.open({
                    templateUrl: 'contact_index.html',
                    controller: function($scope, $modalInstance,orgId){
                        $scope.orgId = orgId;
                        $scope.selectedMembers = [];
                        $scope.selectedGroups = [];
                        $scope.ok = function () {
                            $modalInstance.close(scope.selectedMembers, $scope.selectedGroups);
                        };

                        $scope.cancel = function () {
                            $modalInstance.dismiss('cancel');
                        };
                        /**
                         * 获取组和成员
                         *
                        var temagroupsmember = function(){
                            var teamGroupsHttp = function(data) {
                                var deferred = $q.defer();
                                GKApi.teamGroupsMembers(data).success(function($http){
                                    var groupsAndMembers;
                                    groupsAndMembers = $http;
                                    deferred.resolve(groupsAndMembers);
                                })
                                return deferred.promise;
                            }
                            var promise = teamGroupsHttp($scope.orgId);
                            promise.then(function(data){
                                var groupsItem = []
                                    ,groupsItems = []
                                    ,conteamgroups = []
                                    ,conteamMembers = [];
                                conteamgroups = data.groups;
                                conteamMembers = data.members;
                                for(var key in groups){
                                    item.push(groups[key]);
                                }
                                for(var i = 0,len = item.length;i<len;i++){
                                    var data = [];
                                    data ={
                                        label:item[i].group_name,
                                        data:item[i].group_id
                                    }
                                    items.push(data);
                                }
                                $scope.conteamMembers = conteamMembers;
                                $scope.example =  items;
                                $scope.example_treedata =  $scope.example;
                            })
                        }
                        /**
                         * 获取成员
                         *
                        var temamember = function(){
                            $scope.contactTree = function(branch){
                                $scope.memberOrg = branch.group_name;
                            }
                            var groupMemberHttp = function(data) {
                                var deferred = $q.defer();
                                GKApi.groupMember(data).success(function($http){
                                    var member;
                                    member = $http;
                                    deferred.resolve(member);
                                })
                                return deferred.promise;
                            }
                            var promiseMember = teamGroupsHttp($scope.memberOrg);
                            promiseMember.then(function(data){
                                var conteamMembers = [];
                                conteamMembers = data.members;
                                $scope.conteamMembers = conteamMembers;
                            })
                        }
                        /**
                         * 搜索功能
                         *
                        var membersearch = function(){
                            $scope.conkeyup = function ($event,orgId) {
                                if ($event.keyCode === 13) {
                                    var keySearch = function(data,id) {
                                        var deferred = $q.defer();
                                        GKApi.teamsearch(data,id).success(function($http){
                                            var search;
                                            search = $http;
                                            deferred.resolve(search);
                                        })
                                        return deferred.promise;
                                    }
                                    var searchMember = keySearch($scope.context,$scope.orgId);
                                    searchMember.then(function(data){
                                        var newData = []
                                            ,sear = [];
                                        sear = data.search;
                                        for(var i = 0,len = sear.length;i<len;i++){
                                            if(sear[i].type !== "member"){
                                                newData.push(sear[i]);
                                            }
                                        }
                                        $scope.getkeytext =  newData;
                                        $scope.conteamMembers = $scope.getkeytext;
                                    })
                                }
                            }
                        }

                    },
                    resolve: {
                        orgId: function () {
                            return orgId;
                        }
                    }
                });
            }
        }
    }])
    .factory('GKSearch', [function () {
        return {
            showSearchSidebar:false,
            keyword:'',
            isShowSearchSidebar:function(){
                return this.showSearchSidebar;
            },
            getKeyWord:function(){
                return this.keyword;
            },
            setKeyWord:function(keyword){
                this.keyword = keyword;
            }
        }
    }])
/**
 * 客户端的回调函数
 */
    .factory('GKClientCallback',[function(){
        return GKClientCallback;
    }])
/**
 * 记录浏览历史，提供前进,后退功能
 */
    .factory('GKHistory', ['$q', '$location', '$rootScope', function ($q, $location, $rootScope) {
        return new GKHistory($q, $location, $rootScope);
    }])
;

var GKClientCallback = function(){

};

function GKFileSearch() {
}
GKFileSearch.prototype = {
    includeCondition: {},
    excludeCondition: {},
    condition: {},
    order: {},
    limit: {}
};
GKFileSearch.prototype.getCondition = function () {
    if (this.includeCondition) {
        this.condition['include'] = this.includeCondition;
    }
    if (this.excludeCondition) {
        this.condition['exclude'] = this.excludeCondition;
    }
    if (this.order) {
        this.condition['order'] = this.order;
    }
    if (this.limit) {
        this.condition['limit'] = this.limit;
    }
    return JSON.stringify(this.condition);
}
GKFileSearch.prototype.conditionIncludeKeyword = function (keyword) {
    this.includeCondition['keywords'] = ['text', keyword];
};
GKFileSearch.prototype.conditionIncludeDir = function (dir) {
    this.includeCondition['dir'] = ['eq',dir];
};

GKFileSearch.prototype.conditionIncludePath = function (path) {
    this.includeCondition['path'] = ['prefix', path];
};
GKFileSearch.prototype.conditionIncludeCreator = function (creator) {
    if (angular.isArray(creator)) {
        this.includeCondition['creator'] = ['in', creator];
    } else if (angular.isNumber(creator)) {
        this.includeCondition['creator'] = ['eq', creator];
    }
};
GKFileSearch.prototype.conditionIncludeModifier = function (modifier) {
    if (angular.isArray(modifier)) {
        this.includeCondition['modifier'] = ['in', modifier];
    } else if (angular.isNumber(creator)) {
        this.includeCondition['modifier'] = ['eq', modifier];
    }
};
GKFileSearch.prototype.conditionIncludeDateline = function (dateline, pre) {
    pre = angular.isDefined(pre) ? pre : 'gt';
    if (angular.isArray(dateline)) {
        pre = 'between'
    }
    this.includeCondition['dateline'] = [pre, dateline];
};
GKFileSearch.prototype.conditionIncludeLastDateline = function (lastDateline, pre) {
    pre = angular.isDefined(pre) ? pre : 'gt';
    if (angular.isArray(lastDateline)) {
        pre = 'between'
    }
    this.includeCondition['last_dateline'] = [pre, lastDateline];
};
GKFileSearch.prototype.conditionIncludeExtension = function (ext) {
    if (!angular.isArray(ext)) {
        ext = [ext];
    }
    this.includeCondition['extension'] = ['in', ext];
};
GKFileSearch.prototype.conditionIncludeFilesize = function (filesize, pre) {
    pre = angular.isDefined(pre) ? pre : 'gt';
    if (angular.isArray(dataline)) {
        pre = 'between'
    }
    this.includeCondition['filesize'] = [pre, filesize];
};
GKFileSearch.prototype.conditionExcludeCreator = function (creator) {
    if (!angular.isArray(creator)) {
        creator = [creator];
    }
    this.excludeCondition['creator'] = ['in', creator];
};
GKFileSearch.prototype.conditionExcludeModifier = function (modifier) {
    if (!angular.isArray(modifier)) {
        modifier = [modifier];
    }
    this.excludeCondition['modifier'] = ['in', modifier];
};
GKFileSearch.prototype.conditionExcludeKeywords = function (keyword) {
    this.excludeCondition['keywords'] = ['text', keyword];
};
GKFileSearch.prototype.conditionExcludeExtension = function (ext) {
    if (!angular.isArray(ext)) {
        ext = [ext];
    }
    this.excludeCondition['extension'] = ['in', ext];
};
GKFileSearch.prototype.conditionSetOrder = function (orderField, orderType) {
    this.order[orderField] = angular.isDefined(orderType) ? orderType : 'asc';
};
GKFileSearch.prototype.conditionSetLimit = function () {
    this.limit = [].slice.call(arguments);
};

function GKHistory($q, $location, $rootScope) {
    var self = this,
        update = true,
        history = [],
        current,
        reset = function () {
            history = [$location.search()];
            current = 0;
            update = true;
        },
        go = function (fwd) {
            var deferred = $q.defer();
            if ((fwd && self.canForward()) || (!fwd && self.canBack())) {
                update = false;
                $location.search(history[fwd ? ++current : --current]);
                return  deferred.resolve();
            }
            return deferred.reject();
        };
    this.canForward = function () {
        return current < history.length - 1;
    };
    this.canBack = function () {
        return current > 0;
    }
    this.back = function () {
        return go();
    }
    this.forward = function () {
        return go(true);
    }

    $rootScope.$on('$routeChangeSuccess', function ($s, $current) {
        var params = $current.params;
        if (jQuery.isEmptyObject(params)) return;
        var l = history.length,
            cwd = params;
        if (update) {
            current >= 0 && l > current + 1 && history.splice(current + 1);
            history[history.length - 1] != cwd && history.push(cwd);
            current = history.length - 1;
        }
        update = true;
    });
    reset();
}

