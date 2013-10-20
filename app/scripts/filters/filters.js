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
    .filter('getPartitionName',function(){
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
    })
;

