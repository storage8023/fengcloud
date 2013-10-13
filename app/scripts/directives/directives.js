'use strict';

/* Directives */


angular.module('gkClientIndex.directives', []).
    directive('finder', ['$location','GKPath',function ($location,GKPath) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/file_list.html",
            scope:{
                fileData: '=',
                view:'=',
                partition:'=',
                order:'@'
            },
            link:function($scope, $element, $attrs){
                $element.focus();

                var selectedFile = [], //当前已选中的条目
                    selectedIndex = [], //已选中文件的索引
                    unSelectFile, //取消选中的函数
                    unSelectAllFile, //取消所有选中的文件
                    selectFile;  //选中函数

                selectFile = function(index,multiSelect){
                    multiSelect = arguments[1] === undefined?false:true;
                    if(!multiSelect && selectedFile && selectedFile.length ){
                        selectedIndex = [];
                        angular.forEach(selectedFile,function(value){
                            value.selected = false;
                        });
                    }
                    $scope.fileData[index].selected = true;
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                };

                unSelectFile = function(index){
                    $scope.fileData[index].selected = false;
                    angular.forEach(selectedIndex,function(value,key){
                        if(value == index){
                            selectedIndex.splice(key,1);
                            selectedFile.splice(key,1);
                        }
                    })
                }

                unSelectAllFile = function(){
                    angular.forEach(selectedIndex,function(value){
                        unSelectFile(value);
                    });
                }
                $scope.handleClick = function($event,index){
                    var file = $scope.fileData[index];
                    if($event.ctrlKey || $event.metaKey){
                        if(file.selected){
                            unSelectFile(index);
                        }else{
                            selectFile(index,true);
                        }
                    }else if($event.shiftKey && selectedIndex.length){
                        var lastIndex = 0;
                        if(selectedIndex.length){
                            lastIndex = selectedIndex[selectedIndex.length-1];
                        }

                        unSelectAllFile();

                        if(index>lastIndex){
                          for(var i=lastIndex;i<=index;i++){
                                selectFile(i,true);
                            }
                        }else if(index<lastIndex){
                            for(var i=index;i<=lastIndex;i++){
                                selectFile(i,true);
                            }
                        }

                    }else{
                        selectFile(index);
                    }

                };

                /**
                 * 双击文件
                 * @param $event
                 * @param file
                 */
                $scope.handleDblClick = function($event,file){
                    $location.path(GKPath.getPath($scope.partition,file.path,$scope.view));
                };

                /**
                 * 排序方式
                 * @type {string}
                 */
                if(!$scope.order){
                    $scope.order = '+file_name';
                }

                $scope.orderType = $scope.order.slice(1);
                $scope.orderAsc =  $scope.order.slice(0,1);

                $scope.setOrder = function(type){
                    if($scope.orderType == type){
                        $scope.orderAsc = $scope.orderAsc == '+'?'-':'+';
                    }else{
                        $scope.orderType = type;
                        $scope.orderAsc = '+';
                    }
                };

                /**
                 * enter 键
                 */
                $scope.enterPress = function(){
                    if(selectedFile && selectedFile.length){
                        $location.path(GKPath.getPath($scope.partition,selectedFile[0].path,$scope.view));
                    }
                }

                /**
                 * up left 键
                 * @param $event
                 */
                $scope.upLeftPress = function($event){
                    /**
                     * 非所缩略图模式不激活左右键
                     */
                    if($scope.view !='thumb' && $event.keyCode==37){
                        return;
                    }
                    var initIndex = $scope.fileData.length;
                    if(selectedIndex.length){
                        initIndex = Math.min.apply('',selectedIndex);
                    }
                    var newIndex = initIndex - 1;
                    if(newIndex<0){
                        return;
                    }
                    unSelectAllFile();
                    selectFile(newIndex);
                }

                /**
                 * down right 键
                 * @param $event
                 */
                $scope.downRightPress = function($event){
                    /**
                     * 非所缩略图模式不激活左右键
                     */

                    if($scope.view !='thumb' && $event.keyCode==39){
                        return;
                    }
                    var initIndex = -1;
                    if(selectedIndex.length){
                        initIndex = Math.min.apply('',selectedIndex);
                    }
                    var newIndex = initIndex + 1;
                    if(newIndex>$scope.fileData.length-1){
                        return;
                    }

                    unSelectAllFile();
                    selectFile(newIndex);
                }

            }
        };
    }])
    .directive('bread',[function(){
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread.html",
            scope:{
                breads: '='
            },
            link:function(){

            }
        }
    }])
;
