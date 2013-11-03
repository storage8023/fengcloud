'use strict';

/* Services */

angular.module('gkClientIndex.services', [])
    .constant('newsKey','gkNews')
    .factory('GKNews',['localStorageService','newsKey','GKApi','GKClientCallback','$filter',function(localStorageService,newsKey,GKApi,GKClientCallback,$filter){
        return {
            classify:function(news){
                var classifyNews = [],
                    context = this;
                    ;
                var now = new Date().valueOf();
                var today = $filter('date')(now,'yyyy-MM-dd');
                var yesterdayTimestamp = now-24*3600*1000;
                var yesterday = $filter('date')(yesterdayTimestamp,'yyyy-MM-dd');
                angular.forEach(news,function(value){
                    var date = value.date;
                    var dateText = date;
                    if(date == today){
                        dateText = '今天，'+$filter('date')(now,'MM-dd');
                    }else if(date == yesterday){
                        dateText = '昨天，'+$filter('date')(yesterdayTimestamp,'MM-dd');;
                    }
                    var existClassifyItem = context.getClassifyItemByDate(date,classifyNews);
                    if(!existClassifyItem){
                        existClassifyItem = {
                            date:date,
                            date_text:dateText,
                            list:[value]
                        }
                        classifyNews.push(existClassifyItem);
                    }else{
                        existClassifyItem['list'].push(value);
                    }
                });
                return classifyNews;
            },
            getClassifyItemByDate:function(date,classifyNews){
                if(!classifyNews || !classifyNews.length){
                    return null;
                }
                for(var i=0;i<classifyNews.length;i++){
                    var value = classifyNews[i];
                    if(value['date'] == date){
                        return value;
                        break;
                    }
                }
                return null;
            },
            requestNews:function(size,dateline){
                var context = this;
                 GKApi.update(size,dateline).success(function(data){
                    var news = data['updates'] || [];
                    var dateline = data['dateline'];
                    gkClientInterface.setMessageDate(dateline);
                    //测试数据
                    angular.forEach(news,function(value,key){
                        value.org_id = 1;
                        value.org_name = '够快科技';
                        if(key==2){
                            value.org_id = 2;
                            value.org_name = '测试团队';
                        }
                    });
                    context.addNews(news);
                })
            },
            getNews:function(){
                var news = localStorageService.get(newsKey);
                return news;
            },
            concatNews:function(oldClassifyNews,newClassifyNews){
                var context = this;
                if(!newClassifyNews || !newClassifyNews.length){
                    return oldClassifyNews;
                }
                var existItem;
                angular.forEach(newClassifyNews,function(value){
                    existItem = context.getClassifyItemByDate(value['date']);
                    if(existItem){
                        existItem['list'] =  existItem['list'].concat(value['list']);
                    }else{
                        oldClassifyNews.push(value);
                    }

                });
                return oldClassifyNews;
            },
            addNews:function(news){
                var oldNews = this.getNews();
                if(!oldNews || !oldNews.length){
                    localStorageService.add(newsKey,JSON.stringify(news));
                }else{
                   var newOldNews = oldNews.concat(news);
                    newOldNews = newOldNews.slice(0,100);
                    localStorageService.add(newsKey,JSON.stringify(newOldNews));
                }
            },
            appendNews:function(data){
                if(!data['list'] || !data['list'].length){
                    if(data['count']>0){
                        this.requestNews(data['count'])
                    }
                }else{
                    this.addNews(data['list']);
                }
            }
        }
    }])
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
    .constant('GKPartition', {
        myFile:'myfile',
        teamFile:'teamfile',
        smartFolder:'smartfolder'
    })
    .factory('GKFile', ['FILE_SORTS', 'GKMounts', function (FILE_SORTS, GKMounts) {
        var GKFile = {
            /**
             * 是否已同步
             * @param parentFile
             * @param file
             * @returns {boolean}
             */
            isSynced:function(parentFile,file){
                 if(!parentFile){
                     return false;
                 }
                if(parentFile.syncpath){
                    return true;
                }
                if(file && file.sync==1){
                    return true;
                }
                return false;
            },
            /**
             * 是否可对同步进行设置
             * @param parentFile
             * @param file
             * @returns {boolean}
             */
            isSyncable:function(parentFile,file){
                if(!this.isSynced(parentFile,file)){
                    return true;
                }
                if((parentFile.syncpath==='/'&&!file.fullpath)||parentFile.syncpath === file.fullpath || file.sync==1){
                    return true;
                }
                return false;
            },
            getMountById: function (mountID) {
                var context = this;
                if(GKMounts && GKMounts.length){
                    return context.formatMountItem(GKMounts[mountID]);
                }
                return null;
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
                    name: mount.name ? mount.name : '我的文件',
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
                        status: value.status,
                        sync:value.sync
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
    .factory('GKOpt', ['GKCilpboard','GKFile','GKPartition',function (GKCilpboard,GKFile,GKPartition) {
        var GKOpt = {
            setSyncOpt:function(opts,parentFile,file){
                if(!GKFile.isSyncable(parentFile,file)){
                    this.disableOpt(opts,'sync','unsync');
                }else{
                    if(GKFile.isSynced(parentFile,file)){
                        this.disableOpt(opts,'sync');
                    }else{
                        this.disableOpt(opts,'unsync');
                    }
                }
            },
            getOpts: function (currentFile, selectedFiles, partition, filter) {
                var opts,
                    partitionOpts,
                    multiOpts,
                    singleOpts,
                    currentOpts,
                    authOpts;

                partitionOpts =  this.getPartitionOpts(partition,filter);
                authOpts = this.getAuthOpts();
                if(!selectedFiles || !selectedFiles.length){
                    currentOpts =  this.getCurrentOpts(currentFile);
                    opts =  this.getFinalOpts(partitionOpts, currentOpts, authOpts);
                }else{
                        multiOpts = this.getMultiSelectOpts(selectedFiles);
                        singleOpts = this.getSelectOpts(currentFile,selectedFiles);
                       opts =  this.getFinalOpts(partitionOpts, multiOpts, singleOpts,authOpts);
               }
                return opts;
            },
            getDefaultOpts:function(){
               return ["add","new_folder",'clear_trash',"sync","unsync","paste", "rename", "save","del","cut", "copy", "lock", "unlock", 'del_completely','revert',"order_by"];
            },

            getFinalOpts: function () {
                var optsArr = Array.prototype.slice.call(arguments);
                var opts = this.getDefaultOpts();
                var optLen = opts.length;
                var optsArrLen = optsArr.length;
                for (var i = optLen - 1; i >= 0; i--) {
                    var value = opts[i];
                    for (var j = 0; j < optsArrLen; j++) {
                        var index = opts.indexOf(value);
                        if(optsArr[j].indexOf(value) < 0 && index>=0){
                            opts.splice(index, 1);
                        }
                    }
                }

                return opts;

            },
            getPartitionOpts:function(partition,filter){
                var opts = this.getDefaultOpts();
                switch (partition){
                    case GKPartition.myFile:
                    case GKPartition.teamFile:
                        if(filter =='trash'){
                            this.disableOpt(opts,"add","new_folder","sync","unsync","paste", "rename", "save","del","cut", "copy", "lock", "unlock","order_by");
                        }else{
                            this.disableOpt(opts,"clear_trash","revert","del_completely");
                        }
                        break;


                        break;
                    case (GKPartition.smartFolder || filter =='search'):
                        this.disableOpt(opts,'add','new_folder','sync','unsync','paste','copy','cut');
                        break;
                }

                return opts;
            },
            getAuthOpts:function(){
                var opts = this.getDefaultOpts();
                return opts;
            },

            getCurrentOpts: function (currentFile) {
                var opts = this.getDefaultOpts();
                this.disableOpt(opts, "rename", "save", "cut", "copy","lock", "unlock", "del",'revert','del_completely');
                if(GKCilpboard.isEmpty()){
                    this.disableOpt(opts,'paste');
                }
                this.setSyncOpt(opts,currentFile,currentFile);
                return opts;
            },
            getMultiSelectOpts: function (files) {
                var opts = this.getDefaultOpts();
                if (files && files.length > 1) {
                    this.disableOpt(opts,"save","sync","unsync", "rename" ,"lock", "unlock");
                }
                return opts;
            },
            getSelectOpts: function (currentFile,files) {
                var opts = this.getDefaultOpts();
                var context = this;
                angular.forEach(files,function(file){
                    context.disableOpt(opts,"add","new_folder","paste","order_by",'clear_trash');
                    if (file.dir == 1) {
                        context.disableOpt(opts, 'lock', 'unlock');
                        context.setSyncOpt(opts,currentFile,file);
                    } else {
                        context.disableOpt(opts, 'sync','unsync');
                        if (file.lock == 1) {
                            context.disableOpt(opts, 'lock');
                        } else {
                            context.disableOpt(opts, 'unlock');
                        }
                    }
                });
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
            },
            recycle:function(mount_id, fullpath,order,start,size){
                var date = new Date().toUTCString();
                var method = 'RECYCLE';
                var webpath = Util.String.encodeRequestUri(fullpath);
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                var headers = {
                        'x-gk-mount': mount_id,
                        'Date': date,
                        'Authorization': authorization,
                        'Content-Type': "application/x-www-form-urlencoded"
                    };
                if(angular.isDefined(order)){
                    headers['x-gk-order'] = order;
                }
                if(angular.isDefined(start)){
                    headers['x-gk-start'] = start;
                }
                if(angular.isDefined(size)){
                    headers['x-gk-size'] = size;
                }
                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: headers
                })
            },
            clear:function(mount_id){
                var date = new Date().toUTCString();
                var method = 'CLEAR';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded",
                    'Accept': '*/*'
                };
                return jQuery.ajax({
                    url:GK.getRestHost() + webpath,
                    dataType:'text',
                    type:method,
                    headers:headers
                });
//                return $http({
//                    method: method,
//                    url: GK.getRestHost() + webpath,
//                    headers: headers,
//                    responseType:'text'
//                })
            },
            delCompletely:function(mount_id,fullpaths){
                var date = new Date().toUTCString();
                var method = 'DELETECOMPLETELY';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                if(angular.isArray(fullpaths)){
                    fullpaths = fullpaths.join('|');
                }
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'x-gk-fullpaths':encodeURIComponent(fullpaths),
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };

                return $http({
                    method: method,
                    url: GK.getRestHost() + webpath,
                    headers: headers
                })
            },
            recover:function(mount_id,fullpaths,machine){
                var date = new Date().toUTCString();
                var method = 'RECOVER';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                if(angular.isArray(fullpaths)){
                    fullpaths = fullpaths.join('|');
                }
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'x-gk-machine':machine,
                    'x-gk-fullpaths':encodeURIComponent(fullpaths),
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded"
                };
                return jQuery.ajax({
                    url:GK.getRestHost() + webpath,
                    dataType:'text',
                    type:method,
                    headers:headers
                });
//                return $http({
//                    method: method,
//                    url: GK.getRestHost() + webpath,
//                    headers: headers
//                })
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
                return jQuery.ajax({
                    type: 'POST',
                    url: GK.getApiHost() + '/1/file/keyword',
                    data: params,
                    dataType:'text'
                });
//                return $http({
//                    method: 'POST',
//                    url: GK.getApiHost() + '/1/file/keyword',
//                    data: jQuery.param(params)
//                });
            },
            update: function (size,dateline) {
                size = angular.isDefined(size)?size:100;
                var params = {
                    size:size
                };
                if(angular.isDefined(dateline)){
                    params['dateline'] = dateline;
                }
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
                defaultParams.sign = sign;
                return $http({
                    method: 'POST',
                    url: GK.getApiHost()+'/1/account/device_list',
                    params:defaultParams
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
            deldevice:function(device_id){
                var params = {
                    device_id:device_id,
                };
                angular.extend(params,defaultParams);
                var sign = GK.getApiAuthorization(params);
                params.sign = sign;
                console.log(params);
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

/**
 * 客户端的回调函数
 */
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
    .factory('GKClientCallback',[function(){
        return gkClientCallback;
    }])
/**
 * 记录浏览历史，提供前进,后退功能
 */
    .factory('GKHistory', ['$q', '$location', '$rootScope', function ($q, $location, $rootScope) {
        return new GKHistory($q, $location, $rootScope);
    }])
    .factory('GKDialog', [function () {
        return {
            /**
             * 打开设置框
             */
            openSetting:function(){
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///'+UIPath+'/views/site.html';
                var data = {
                    url:url,
                    type:"normal",
                    width:760,
                    resize:1,
                    height:450
                }
                gkClientInterface.setMain(data);
            },
            /**
             * 打开传输列表
             */
            openTransfer:function(){
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///'+UIPath+'/views/queue.html';
                var data = {
                    url:url,
                    type:"normal",
                    width:800,
                    height:500,
                    resize:1
                }
                gkClientInterface.setMain(data);
            }
        }
    }
    ])
;

var gkClientCallback = {
    testCallback:function(param){

    },
    /**
     * 文件修改后的回调
     * @constructor
     */
    UpdateWebpath:function(){

    },
    /**
     * 有新的消息的回调
     * @constructor
     */
    UpdateMessage:function(param){
        var JSONparam = JSON.parse(param);
        var rootScope = jQuery(document).scope();
        rootScope.$broadcast('updateMessage',JSONparam);
    },
    /**
     * 发现新的附近的人的回调
     * @constructor
     */
    AddFindObject:function(){

    },
    ShowMessage:function(){
        var rootScope = jQuery(document).scope();
        rootScope.$broadcast('showMessage');
    }
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

