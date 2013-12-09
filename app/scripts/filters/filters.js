'use strict';

/* Filters */

angular.module('gkClientIndex.filters', [])
    .filter('replaceSpace', function () {
        return function (filename) {
            return filename.replace(/\s/g," ");
        }
    })
    .filter('dateAgo', function ($filter) {
        return function (dateline) {
            var now = new Date().valueOf();
            var today = $filter('date')(now, 'yyyy-MM-dd');
            var yesterdayTimestamp = now - 24 * 3600 * 1000;
            var yesterday = $filter('date')(yesterdayTimestamp, 'yyyy-MM-dd');
            var date = $filter('date')(dateline, 'yyyy-MM-dd');
            var dateText = '';
            if (date == today) {
                dateText = '今天，' + $filter('date')(now, 'M月d日');
            } else if (date == yesterday) {
                dateText = '昨天，' + $filter('date')(yesterdayTimestamp, 'M月d日');
            }else{
                dateText =$filter('date')(dateline, 'yyyy年M月d日');
            }
            return dateText;
        }
    })
    .filter('getAvatarUrl', function () {
        return function (memberId,isThumb) {
            isThumb = angular.isDefined(isThumb)?isThumb:1;
            return gkClientInterface.getSiteDomain()+'/index/avatar?id='+memberId+'&thumb='+isThumb;
        }
    })
    .filter('formatFileSize', function () {
        return function (filesize, dir) {
            return dir == 1 ? '-' : Util.Number.bitSize(filesize);
        }
    })
    .filter('bitSize', function(){
        return Util.Number.bitSize;
    })
    .filter('baseName', function(){
        return Util.String.baseName;
    })
    .filter('getPercent',function(){
        return function(val,total){
            return Math.round(val/total * 100)+'%';
        }
    })
    .filter('getSmartIcon',['GKFilter',function(GKFilter){
        return function(favorites,filter){
          var type = GKFilter.getFilterType(filter);
          var classes = 'icon_'+filter;
          if(favorites.indexOf(type)>=0){
              classes += ' added';
          }
          return classes;
        }
    }])
    .filter('getPartitionName',[function(){
        return function(partition){
            var partitionName = '';
            switch (partition) {
                case 'myfile':
                    partitionName = '我的文件';
                    break;
                case 'teamfile':
                    partitionName = '云库的文件';
                    break;
                case 'smartfolder':
                    partitionName = '智能文件夹';
                    break;
                default :
                    partitionName = '我的文件';
                    break;
            }
            return partitionName;
        }
    }])
    .filter('getFileIcon',['GKFile',function(GKFile){
          return function(filename,dir,share,sync){
              return'icon_'+GKFile.getFileIconSuffix(filename,dir,share,sync);
          }
    }])
    .filter('getFileThumb',['GKFile',function(GKFile){
        return function(filename,dir,share,sync){
            return  'images/icon/' + GKFile.getFileIconSuffix(filename,dir,share,sync) + '128x128.png';
        }
    }])
    .filter('getThumbUrl',[function(GKFile){
        return function(hash,filehash){
            return  gkClientInterface.getSiteDomain() + '/index/thumb?hash=' + hash + '&filehash=' + filehash;
        }
    }])
    .filter('getFileType',['GKFile',function(GKFile){
        return function(filename,dir,ext){
            var type =  GKFile.getFileIconSuffix(filename,dir);
            return dir==1 ? '文件夹' : ext+GKFile.getFileTypeName(type);
        }
    }])
;

