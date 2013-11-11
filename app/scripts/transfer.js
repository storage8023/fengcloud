/**
 * Created by admin on 13-11-4.
 */
angular.module('gkClientTransfer', ['gkClientIndex.services','ui.bootstrap','gkClientIndex.filters'])
    .controller('transferCtrl',['$scope','$location',function($scope,$location){
        $scope.tabs = [
            {
                name:'upload',
                title:'上传',
                icon:'icon_upload_white',
                directive:'tabUpload'
            },
            {
                name:'download',
                title:'下载',
                icon:'icon_download_white',
                directive:'tabDownload'
            },
            {
                name:'sync',
                title:'同步',
                icon:'icon_sync2_white',
                directive:'tabSync'
            }
        ];

        $scope.selectedTab = $scope.tabs[0];
        var search = $location.search();
        if(search.tab){
            $scope.selectedTab = Util.Array.getObjectByKeyValue($scope.tabs,'name',search.tab) || $scope.tabs[0];
        }

        $scope.selectTab = function(tab){
            $scope.selectedTab = tab;
        };

        $scope.cancel = function(){
            gkClientInterface.closeWindow();
        };

    }])

/**
 * 设置-上传
 */
    .directive('tabUpload',['GKQueue',function(GKQueue){
        return {
            restrict: 'E',
            templateUrl:'views/tab_queue.html',
            scope:{
                selectedTab:'='
            },
            link:function($scope){
                $scope.thead = ['文件','状态','剩余时间'];
                GKQueue.getQueueList($scope,'upload');
                $scope.removeTransfer = function(file){
                    var param = {
                        type:'upload',
                        mountid:file.mountid,
                        webpath:file.webpath
                    };
                    gkClientInterface.removeTrans(param);
                }
            }
        }
    }])
/**
 * 设置-下载
 */
    .directive('tabDownload',['GKQueue',function(GKQueue){
        return {
            restrict: 'E',
            templateUrl:'views/tab_queue.html',
            scope:{
                selectedTab:'='
            },
            link:function($scope){
                $scope.thead = ['文件','状态','剩余时间'];
                GKQueue.getQueueList($scope,'download');
                $scope.removeTransfer = function(file){
                    var param = {
                        type:'download',
                        mountid:file.mountid,
                        webpath:file.webpath
                    };

                    var re = gkClientInterface.removeTrans(param);
                    console.log(re);
                    //Util.Array.removeByValue($scope.fileList,file);
                }
            }
        }
    }])
/**
 * 设置-同步
 */
    .directive('tabSync',['GKQueue',function(GKQueue){
        return {
            restrict: 'E',
            templateUrl:'views/tab_queue.html',
            scope:{
                selectedTab:'='
            },
            link:function($scope){
                $scope.thead = ['同步目录','同步状态','剩余时间'];
                GKQueue.getQueueList($scope,'sync');
            }
        }
    }])

;