'use strict';

/* Filters */

angular.module('gkClientIndex.filters', [])

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

    .filter('getFileType',['GKFile',function(GKFile){
        return function(filename,dir,ext){
            var type =  GKFile.getFileIconSuffix(filename,dir);
            return dir==1 ? '文件夹' : ext+GKFile.getFileTypeName(type);
        }
    }]);

