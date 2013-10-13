'use strict';

/* Directives */


angular.module('gkClientIndex.directives', []).
    directive('finder', ['$location', 'GKPath', '$filter', function ($location, GKPath, $filter) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/file_list.html",
            scope: {
                fileData: '=',
                view: '=',
                partition: '=',
                order: '@'
            },
            link: function ($scope, $element, $attrs) {
                var selectedFile = [], //当前已选中的条目
                    selectedIndex = [], //已选中文件的索引
                    unSelectFile, //取消选中的函数
                    unSelectAllFile, //取消所有选中的文件
                    selectFile;  //选中函数

                selectFile = function (index, multiSelect) {
                    multiSelect = arguments[1] === undefined ? false : true;
                    if (!multiSelect && selectedFile && selectedFile.length) {
                        selectedIndex = [];
                        angular.forEach(selectedFile, function (value) {
                            value.selected = false;
                        });
                    }
                    $scope.fileData[index].selected = true;
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                };

                unSelectFile = function (index) {
                    $scope.fileData[index].selected = false;
                    angular.forEach(selectedIndex, function (value, key) {
                        if (value == index) {
                            selectedIndex.splice(key, 1);
                            selectedFile.splice(key, 1);
                        }
                    })
                };

                unSelectAllFile = function () {
                    angular.forEach(selectedIndex, function (value) {
                        unSelectFile(value);
                    });
                };

                $scope.handleClick = function ($event, index) {
                    var file = $scope.fileData[index];
                    if ($event.ctrlKey || $event.metaKey) {
                        if (file.selected) {
                            unSelectFile(index);
                        } else {
                            selectFile(index, true);
                        }
                    } else if ($event.shiftKey && selectedIndex.length) {
                        var lastIndex = 0;
                        if (selectedIndex.length) {
                            lastIndex = selectedIndex[selectedIndex.length - 1];
                        }

                        unSelectAllFile();

                        if (index > lastIndex) {
                            for (var i = lastIndex; i <= index; i++) {
                                selectFile(i, true);
                            }
                        } else if (index < lastIndex) {
                            for (var i = index; i <= lastIndex; i++) {
                                selectFile(i, true);
                            }
                        }

                    } else {
                        selectFile(index);
                    }

                };

                /**
                 * 双击文件
                 * @param $event
                 * @param file
                 */
                $scope.handleDblClick = function ($event, file) {
                    $location.path(GKPath.getPath($scope.partition, file.path, $scope.view));
                };

                /**
                 * 重新索引文件
                 * @param fileData
                 */
                var reIndex = function (fileData) {
                    var newSelectedIndex = [];
                    var newSelectedFile = [];
                    angular.forEach(fileData, function (value, key) {
                        angular.forEach(selectedFile, function (file) {
                            if (value == file) {
                                newSelectedIndex.push(key);
                                newSelectedFile.push(file);
                            }
                        });
                    });
                    selectedIndex = newSelectedIndex;
                    selectedFile = newSelectedFile;
                };

                /**
                 * 排序方式
                 * @type {string}
                 */
                if (!$scope.order) {
                    $scope.order = '+file_name';
                }

                $scope.orderType = $scope.order.slice(1);
                $scope.orderAsc = $scope.order.slice(0, 1);

                $scope.$watch('order', function () {
                    $scope.fileData = $filter('orderBy')($scope.fileData, $scope.order);
                    reIndex($scope.fileData);
                });


                $scope.setOrder = function (type) {
                    if ($scope.orderType == type) {
                        $scope.orderAsc = $scope.orderAsc == '+' ? '-' : '+';
                    } else {
                        $scope.orderType = type;
                        $scope.orderAsc = '+';
                    }
                    $scope.order = $scope.orderAsc + $scope.orderType;

                };


                /**
                 * enter 键
                 */
                $scope.enterPress = function () {
                    if (selectedFile && selectedFile.length) {
                        $location.path(GKPath.getPath($scope.partition, selectedFile[0].path, $scope.view));
                    }
                };

                var checkScroll = function(elem){
                    var scrollY = false;
                    var st = elem.scrollTop();
                    elem.scrollTop(st>0?-1:1);
                    if(elem.scrollTop() !== st){
                        scrollY = scrollY || true;
                    }
                    elem.scrollTop(st);
                    return scrollY;
                }
                var setListHeaderWidth = function () {
                    if(checkScroll($element.find('.list_body'))){
                        $element.find('.file_list_header').css('right', 16);
                    }else{
                        $element.find('.file_list_header').css('right', 0);
                    }
                };

                jQuery(window).bind('resize', function () {
                    setListHeaderWidth();
                });

                /**
                 * fix列表出现滚动条后列表头部对不齐的问题
                 */
                setTimeout(function(){
                    setListHeaderWidth();
                },0);

                var getColCount = function () {
                    var colCount = 4;
                    if ($scope.view == 'thumb' && $element.find('.file_item').size()) {
                        console.log($element.width());
                        console.log($element.find('.file_item').eq(0).outerWidth(true));
                        colCount = Math.floor($element.width() / $element.find('.file_item').eq(0).outerWidth(true));
                    }
                    return colCount;
                };

                /**
                 * up left 键
                 * @param $event
                 */
                $scope.upLeftPress = function ($event) {
                    /**
                     * 非所缩略图模式不激活左右键
                     */
                    if ($scope.view != 'thumb' && $event.keyCode == 37) {
                        return;
                    }
                    var step = 1;
                    if ($scope.view == 'thumb' && $event.keyCode == 38) {
                        step = getColCount();
                    }
                    var initIndex = $scope.fileData.length + step - 1;
                    if (selectedIndex.length) {
                        initIndex = Math.min.apply('', selectedIndex);
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }
                    unSelectAllFile();
                    selectFile(newIndex);
                };

                /**
                 * down right 键
                 * @param $event
                 */
                $scope.downRightPress = function ($event) {
                    /**
                     * 非所缩略图模式不激活左右键
                     */

                    if ($scope.view != 'thumb' && $event.keyCode == 39) {
                        return;
                    }
                    var step = 1;
                    if ($scope.view == 'thumb' && $event.keyCode == 40) {
                        step = getColCount();
                    }
                    var initIndex = -1 * step;
                    if (selectedIndex.length) {
                        initIndex = Math.min.apply('', selectedIndex);
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > $scope.fileData.length - 1) {
                        newIndex = $scope.fileData.length - 1;
                    }

                    unSelectAllFile();
                    selectFile(newIndex);
                };

                /**
                 * 监听键盘事件
                 */
                jQuery(document).bind('keydown', function ($event) {
                    $scope.$apply(function () {
                        switch ($event.keyCode) {
                            case 13:
                                $scope.enterPress();
                                break;
                            case 37:
                            case 38:
                                $scope.upLeftPress($event);
                                break;
                            case 39:
                            case 40:
                                $scope.downRightPress($event);
                                break
                        }
                    });

                });

                /**
                 * 右键
                 */
                jQuery.contextMenu({
                    selector: '.file_list .list_body',
                    animation: {
                        show: "show",
                        hide: "hide"
                    },
                    build: function (trigger, $event) {

                        var items = {};
                        var jqTarget = jQuery($event.target);
                        if (jqTarget.hasClass('file_item') || jqTarget.parents('.file_item').size()) {
                            items = {
                                'test': {
                                    name: 'test'
                                }
                            }
                        } else {
                            items = {
                                'new_folder': {
                                    name: '新建文件夹'
                                },
                                'order_by': {
                                    name: '排序方式',
                                    items: {
                                        'order_by_file_name': {
                                            name: '文件名',
                                            className: $scope.orderType == 'file_name' ? 'current' : '',
                                            callback: function () {
                                                $scope.$apply(function () {
                                                    $scope.setOrder('file_name');
                                                })

                                            }
                                        },
                                        'order_by_file_size': {
                                            name: '大小',
                                            className: $scope.orderType == 'file_size' ? 'current' : '',
                                            callback: function () {
                                                $scope.$apply(function () {
                                                    $scope.setOrder('file_size');
                                                })

                                            }
                                        },
                                        'order_by_file_type': {
                                            name: '类型',
                                            className: $scope.orderType == 'file_type' ? 'current' : '',
                                            callback: function () {
                                                $scope.$apply(function () {
                                                    $scope.setOrder('file_type');
                                                })

                                            }
                                        },
                                        'order_by_last_edit_time': {
                                            name: '最后修改时间',
                                            className: $scope.orderType == 'last_edit_time' ? 'current' : '',
                                            callback: function () {
                                                $scope.$apply(function () {
                                                    $scope.setOrder('last_edit_time');
                                                })

                                            }
                                        }
                                    }
                                }

                            }
                        }

                        return {
                            className: 'dropdown-menu',
                            callback: function (key, options) {

                            },
                            items: items
                        };
                    }
                });


            }
        };
    }])
    .directive('bread', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread.html",
            scope: {
                breads: '='
            },
            link: function () {

            }
        }
    }])
;
