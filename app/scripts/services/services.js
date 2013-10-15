'use strict';

/* Services */

angular.module('gkClientIndex.services', [])
    .factory('GKPath', function() {
       return {
           getPath:function(){
               var paramArr = Array.prototype.slice.call(arguments);
               return '/'+paramArr.join('/');
           }
       }
    })
/**
 * 对请求后返回的错误的处理
 */
    .factory('GKException',[function(){
        return {
            handleClientException:function(error){
                alert(error.message);
            },
            handleAjaxException:function(){

            }
        }
    }])
    .factory('GK',['$q',function($q){
        return {
           addFile:function(params){
               var re =  gkClientInterface.addFile(params);
               var deferred = $q.defer();
               if(re.error == 0 ){
                   deferred.resolve(re);
               }else{
                   deferred.reject(re);
               }
               return deferred.promise;
           },
           createFolder:function(params){
               var re =  gkClientInterface.addFile(params);
               var deferred = $q.defer();
               if(re.error == 0 ){
                   deferred.resolve(re);
               }else{
                   deferred.reject(re);
               }
               return deferred.promise;
           },
            lock:function(params){
                var re =  gkClientInterface.lock(params);
                var deferred = $q.defer();
                if(re.error == 0 ){
                    deferred.resolve(re);
                }else{
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            unlock:function(){
                var re =  gkClientInterface.unlock(params);
                var deferred = $q.defer();
                if(re.error == 0 ){
                    deferred.resolve(re);
                }else{
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            getUser:function(){
                return gkClientInterface.getUser();
            },
            saveTolocal:function(params){
                gkClientInterface.saveToLocal(params);
            },
            del:function(params){
                var re =  gkClientInterface.unlock(params);
                var deferred = $q.defer();
                if(!re || re.error == 0 ){
                    deferred.resolve(re);
                }else{
                    deferred.reject(re);
                }
                return deferred.promise;
            },
            rename:function(params){
                var re =  gkClientInterface.rename(params);
                var deferred = $q.defer();
                if(!re || re.error == 0 ){
                    deferred.resolve(re);
                }else{
                    deferred.reject(re);
                }
                return deferred.promise;
            }
        }
    }])
    .factory('GKSession',['GK',function(GK){
        return GK.getUser()
    }])

    .factory('GKFile',[function(){
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

        var GKFile =  {
            dealFileList:function(fileList){
                var fileData = [], file;
                angular.forEach(fileList, function (value) {
                    var fileName = Util.String.baseName(value.path);
                    var type = GKFile.getFileIconSuffix(fileName, value.dir);
                    var ext = value.dir == 1 ? '' : Util.String.getExt(fileName);
                    file = {
                        file_name: fileName,
                        file_size: value.dir == 1 ? '-' : Util.Number.bitSize(value.filesize),
                        file_type: ext + GKFile.getFileType(type, value.dir),
                        last_edit_time: value.lasttime * 1000,
                        file_icon: 'icon_' + type,
                        thumb: 'images/icon/' + type + '128x128.png',
                        path: value.path,
                        lock: value.lock,
                        lock_member_name: value.lockname,
                        lock_member_id: value.lockid
                    };
                    fileData.push(file);
                });
                return fileData;
            },
            /**
             * 获取文件类型
             * @param type
             * @param dir
             */
            getFileType:function(type, dir){
                return dir ? '文件夹' : GKFile.getFileTypeName(type);
            },
            getFileTypeName : function (type) {
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
                        typeName = '未知文件';
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
             getFileIconSuffix : function (filename, dir, share, local) {
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
;