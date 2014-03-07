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
    }])
    .filter('getMemberRoleName',[function(){
        return function(memberType){
            var roleName = '';
          if(memberType==0){
              roleName = '超级管理员';
          }else if(memberType==1){
              roleName = '管理员';
          }else if(memberType==2){
              roleName = '成员';
          }else{
              roleName = '订阅者';
          }
            return roleName;
        }
    }])
    .filter('getTipContent',['$filter',function($filter){
        return function(member){
            var src = $filter('getAvatarUrl')(member.member_id);
            var html = '<div class="member_info_wrapper">'
            html += '<div>';
            html += '<img src="'+src+'" class="avatar avatar_big" alt="" />';
            html += '</div>';
            html += '<div class="member_name">';
            html += member.member_name;
            html += '</div>';
            if(member.contact_email){
                html += '<div>';
                html += member.contact_email;
                html += '</div>';
            }
            if(member.contact_phone){
                html += '<div>';
                html += member.contact_phone;
                html += '</div>';
            }
            html += '</div>';
            return html;
        }
    }]);

