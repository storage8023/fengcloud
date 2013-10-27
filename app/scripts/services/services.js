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
            selectPath: function () {
                return gkClientInterface.selectPath();
            },
            checkPathIsEmpty: function (params) {
                return gkClientInterface.selectPath(params);
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
            }
        }
    }])
    .constant('FILE_SORTS',{
        'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'],
        'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
        'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
        'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd'],
        'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt'],
        'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
        'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
        'SORT_EXE': ['exe', 'bat', 'com']
    })
    .factory('GKFile', ['FILE_SORTS','GKMounts',function (FILE_SORTS,GKMounts) {
        var GKFile = {
            getMountById:function(mountID){
                return GKMounts[mountID];
            },
            dealTreeData:function(data,type,mountId){
                var newData = [],
                    item,
                    label,
                    context = this;
                        angular.forEach(data,function(value){
                    if(!value.path){
                        value = context.formatMountItem(value);

                        label = value.name;
                    }else{
                        value = context.formatFileItem(value);
                        label = value.filename;
                        mountId && angular.extend(value,{
                            mount_id:mountId
                        });
                    }
                    item = {
                        label: label,
                        isParent:true,
                        data: value
                    };

                    newData.push(item);
                });
                return newData;
            },
            formatMountItem:function(mount){
                var newMount = {
                    mount_id: mount.mountid,
                    name: mount.name?mount.name:'我的资料库',
                    org_id:  mount.orgid,
                    capacity:mount.total,
                    size:mount.use,
                    org_capacity:  mount.orgtotal,
                    org_size: mount.orguse,
                    type:  mount.type,
                    fullpath:''
                };
                return newMount;
            },
            formatFileItem:function(value,source){
              //console.log(value);
              var file;
              if(source == 'api'){
                  var ext = value.dir == 1 ? '' : Util.String.getExt(value.filename);
                  file = {
                      filename: value.filename,
                      filesize: parseInt(value.filesize),
                      ext:ext,
                      last_edit_time: parseInt(value.last_dateline),
                      fullpath: Util.String.rtrim(value.fullpath,'/'),
                      lock: value.lock || 0,
                      lock_member_name: value.lock_member_name || '',
                      lock_member_id: value.lock_member_id || 0,
                      dir: value.dir,
                      last_member_name: value.last_member_name || '',
                      creator_member_name: value.creator_member_name || ''
                  };
              }else{
                  var fileName = Util.String.baseName(value.path);
                  var ext = value.dir == 1 ? '' : Util.String.getExt(fileName);
                  file = {
                      filename: fileName,
                      filesize: parseInt(value.filesize),
                      ext:ext,
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
            dealFileList: function (fileList,source) {
                var fileData = [], file,context = this;
                angular.forEach(fileList, function (value) {
                    file = context.formatFileItem(value,source);
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
            }
        };
        return GKClipboard
    }])
    .factory('GKOpt', [function () {
        var GKOpt = {
            getOpts: function (currentFile, selectedFiles,partition,search) {
                var
                    currentOpts = this.getCurrentOpts(currentFile,partition,search),
                    multiOpts = this.getMultiSelectOpts(selectedFiles),
                    singleOpts = this.getSingleSelectOpts(selectedFiles);
                return this.getFinalOpts(currentOpts, multiOpts, singleOpts);
            },
            getFinalOpts: function () {
                var arr = Array.prototype.slice.call(arguments);
                return Array.prototype.concat.apply([], arr);

            },
            getCurrentOpts: function (currentFile,partition,search) {
                if(search){
                    return [];
                }else{
                    return ['add', 'new_folder', 'order_by'];
                }
            },
            getMultiSelectOpts: function (files) {
                if (!files || files.length <= 1) {
                    return [];
                }
                return ['del'];
            },
            getSingleSelectOpts: function (files) {
                if (!files || files.length != 1) {
                    return [];
                }
                var file = files[0];
                var opts = ['lock', 'unlock', 'save', 'del', 'rename'];
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
            searchFile:function(keyword,path,mount_id){
                var buildCondition = function(){
                    var condition = {
                        'include':{
                            'path':['prefix',path],
                            'keywords' : ['text', keyword]
                        }
                    };
                    return JSON.stringify(condition);
                }
                var params = {
                    mount_id: mount_id,
                    condition: buildCondition()
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
            sideBar: function (mount_id, fullpath, type, start, date) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    type: type,
                    start: start,
                    date: date
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
            upda: function () {
                var params = {
                    dateline:1382683932,
                    size:5
                };
               angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
               console.log(params);
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/updates/ls',
                    params:params
                });
           },
           teamInvitePending:function(){
                var sign = GK.getApiAuthorization(defaultParams);
                defaultParams.sign = sign;
                return $http({
                    method: 'GET',
                    url: GK.getApiHost()+'/1/team/invite_pending',
                    params:defaultParams
                });
           },
            teamManage:function(data){
                var params = {
                   org_id:data
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/updates/',
                    params:params
                });
            },
            teamQuit:function(data){
                var params = {
                    org_id:data
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/team/quit',
                    params:params
                });
            },
            teamInviteReject:function(data,code){
                var params = {
                    org_id:data,
                    code:code
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/team/invite_reject',
                    params:params
                });
            },
            teamInviteJoin:function(data,code){
                var params = {
                    org_id:data,
                    code:code
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/team/invite_accept',
                    params:params
                });
            },
            teamGroupsMembers:function(){
                var params = {
                    org_id:4444
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
            groupmember:function(data){
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
    .factory('GKMyMount', ['GKMounts',function ($filter,GKMounts) {
        var GKMyMount = null;
        angular.forEach(GKMounts, function (value) {
            if (value.orgid==0) {
                GKMyMount = value;
            }
        });
        return GKMyMount;
    }
    ])
/**
 * 记录浏览历史，提供前进,后退功能
 */
    .factory('GKHistory', ['$q','$location','$rootScope',function ($q,$location,$rootScope) {
        return new GKHistory($q,$location,$rootScope);
    }])
;
function GKHistory($q,$location,$rootScope){
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
    this.canBack = function(){
        return current > 0;
    }
    this.back = function(){
        return go();
    }
    this.forward = function(){
        return go(true);
    }

    $rootScope.$on('$routeChangeSuccess', function ($s,$current) {
        var params = $current.params;
        if(jQuery.isEmptyObject(params)) return;
        var l = history.length,
            cwd =params;
        if (update) {
            current >= 0 && l > current + 1 && history.splice(current+1);
            history[history.length-1] != cwd && history.push(cwd);
            current = history.length - 1;
        }
        update = true;
    });
    reset();
}

