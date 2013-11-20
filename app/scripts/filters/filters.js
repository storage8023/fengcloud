'use strict';

/* Filters */

angular.module('gkClientIndex.filters', [])
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
    .filter('getPartitionName',[function(){
        return function(partition){
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
    .filter('getFileType',['GKFile',function(GKFile){
        return function(filename,dir,ext){
            var type =  GKFile.getFileIconSuffix(filename,dir);
            return dir==1 ? '文件夹' : ext+GKFile.getFileTypeName(type);
        }
    }])
;

