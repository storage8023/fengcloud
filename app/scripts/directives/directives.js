'use strict';

/* Directives */


angular.module('gkClientIndex.directives', [])
    .directive('finder', ['$location', 'GKPath', '$filter', '$templateCache', '$compile', function ($location, GKPath, $filter, $templateCache, $compile) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/file_list.html",
            scope: {
                fileData: '=',
                view: '=',
                partition: '=',
                order: '=',
                selectedFile: '=',
                rightOpts: '='
            },
            link: function ($scope, $element, $attrs) {
                var selectedFile = [], //当前已选中的条目
                    selectedIndex = [], //已选中文件的索引
                    unSelectFile, //取消选中的函数
                    unSelectAllFile, //取消所有选中的文件
                    selectFile,//选中函数
                    shiftLastIndex = 0 //shift键盘的起始点
                    ;

                selectFile = function (index, multiSelect) {
                    multiSelect = arguments[1] === undefined ? false : true;
                    if (!multiSelect && selectedFile && selectedFile.length) {
                        unSelectAllFile();
                    }
                    $scope.fileData[index].selected = true;
                    selectedFile.push($scope.fileData[index]);
                    selectedIndex.push(index);
                    $scope.selectedFile = selectedFile;
                };

                unSelectFile = function (index) {
                    $scope.fileData[index].selected = false;
                    var i = selectedIndex.indexOf(index);
                    if (i >= 0) {
                        selectedIndex.splice(i, 1);
                        selectedFile.splice(i, 1);
                    }
                };

                unSelectAllFile = function () {
                    for (var i = selectedIndex.length - 1; i >= 0; i--) {
                        unSelectFile(selectedIndex[i]);
                    }

                };

                $scope.handleClick = function ($event, index) {
                    var file = $scope.fileData[index];
                    if ($event.ctrlKey || $event.metaKey) {
                        if (file.selected) {
                            unSelectFile(index);
                        } else {
                            selectFile(index, true);
                        }
                    } else if ($event.shiftKey) {
                        var lastIndex = shiftLastIndex;
                        unSelectAllFile();
                        if (index > lastIndex) {
                            for (var i = lastIndex; i <= index; i++) {
                                console.log(i);
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
                    if (!$event.shiftKey) {
                        shiftLastIndex = index;
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
                 * 右键文件
                 * @param $event
                 * @param file
                 */
                $element.find('.list_body').bind('contextmenu',function($event){
                    $scope.$apply(function(){
                        var jqTarget = jQuery($event.target);
                        var fileItem = jqTarget.hasClass('file_item')?jqTarget:jqTarget.parents('.file_item');
                        if (fileItem.size()) {
                            console.log(fileItem.index());
                            selectFile(fileItem.index());
                        } else {
                            unSelectAllFile();
                        }
                    });

                });

                /**
                 * 重新索引文件
                 * @param fileData
                 * todo 对shiftlastindex的重新索引
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
                 * 监听order的变化
                 */
                $scope.$watch('order', function () {
                    $scope.fileData = $filter('orderBy')($scope.fileData, $scope.order);
                    reIndex($scope.fileData);
                });

                /**
                 * 设置order
                 * @param order
                 */
                $scope.setOrder = function(order){
                    $scope.$emit('setOrder',order);
                };

                /**
                 * enter 键
                 */
                $scope.enterPress = function () {
                    if (selectedFile && selectedFile.length) {
                        $location.path(GKPath.getPath($scope.partition, selectedFile[0].path, $scope.view));
                    }
                };

                var checkScroll = function (elem) {
                    var scrollY = false;
                    var st = elem.scrollTop();
                    elem.scrollTop(st > 0 ? -1 : 1);
                    if (elem.scrollTop() !== st) {
                        scrollY = scrollY || true;
                    }
                    elem.scrollTop(st);
                    return scrollY;
                }
                var setListHeaderWidth = function () {
                    if (checkScroll($element.find('.list_body'))) {
                        $element.find('.file_list_header').css('right', 16);
                    } else {
                        $element.find('.file_list_header').css('right', 0);
                    }
                };

                jQuery(window).bind('resize', function () {
                    setListHeaderWidth();
                });

                /**
                 * fix列表出现滚动条后列表头部对不齐的问题
                 */
                setTimeout(function () {
                    setListHeaderWidth();
                }, 0);

                var getColCount = function () {
                    var colCount = 4;
                    if ($scope.view == 'thumb' && $element.find('.file_item').size()) {
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
                    /**
                     * 初始index是最后一个
                     * @type {number}
                     */
                    var initIndex = $scope.fileData.length + step - 1;
                    /**
                     * 如果已经选中，则取已选中的最小一个
                     */
                    if (selectedIndex.length) {
                        initIndex = Math.min.apply('', selectedIndex);
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }

                    if ($event.shiftKey) {
                        for (var i = (initIndex > ($scope.fileData.length - 1) ? $scope.fileData.length - 1 : initIndex); i >= newIndex; i--) {
                            selectFile(i, true);
                        }
                    } else {
                        unSelectAllFile();
                        selectFile(newIndex);
                        shiftLastIndex = newIndex;
                    }
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
                    /**
                     * 初始index是第一个
                     * @type {number}
                     */
                    var initIndex = -1 * step;
                    /**
                     * 如果已经选中，则取已选中的最大一个
                     */
                    if (selectedIndex.length) {
                        initIndex = Math.max.apply('', selectedIndex);
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > $scope.fileData.length - 1) {
                        newIndex = $scope.fileData.length - 1;
                    }
                    if ($event.shiftKey) {
                        for (var i = (initIndex > 0 ? initIndex : 0); i <= newIndex; i++) {
                            selectFile(i, true);
                        }
                    } else {
                        unSelectAllFile();
                        selectFile(newIndex);
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * 监听键盘事件
                 */
                jQuery(document).bind('keydown', function ($event) {
                    var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
                    //console.log($event.keyCode);
                    $scope.$apply(function () {
                        switch ($event.keyCode) {
                            case 13: //enter
                                $scope.enterPress();
                                break;
                            case 37: //up
                            case 38: //left
                                $scope.upLeftPress($event);
                                break;
                            case 39: //down
                            case 40: //right
                                $scope.downRightPress($event);
                                break;
                            case 67: //c
                                if (ctrlKeyOn) {
                                    $scope.$emit('ctrlC');
                                }
                                $scope.view = 'thumb';
                                break;

                            case 86: //v
                                if (ctrlKeyOn) {
                                    $scope.$emit('ctrlV');
                                }
                                break;
                            case 88: //x
                                if (ctrlKeyOn) {
                                    $scope.$emit('ctrlX');
                                }
                                break;
                        }
                    });

                });

                /**
                 * 右键
                 */
                jQuery.contextMenu({
                    selector: '.file_list .list_body',
                    reposition: false,
                    animation: {
                        show: "show",
                        hide: "hide"
                    },
                    build: function (trigger, $event) {
                         //return $scope.$apply(function(){
                            var items = $scope.rightOpts;
                            return {
                                className: 'dropdown-menu',
                                callback: function (key, options) {

                                },
                                items: items
                            };
                         //});

                    }
                })

                /**
                 * 新建文件开始
                 */
                $scope.$on('fileNewFolderStart', function (event, callback) {
                    unSelectAllFile();
                    var newFileItem = $compile($templateCache.get('newFileItem.html'))($scope);
                    newFileItem.addClass('selected').prependTo($element.find('.list_body'));
                    var input = newFileItem.find('input[type="text"]');
                    var inputParent = input.parent();
                    var iElem = inputParent.find('i');
                    input.val('新建文件夹')[0].select();
                    input.bind('keydown', function (e) {
                        if (e.keyCode == 13) {
                            angular.isFunction(callback) && callback(input.val());
                            return false;
                        }
                    });

                    input.bind('blur', function () {
                        //angular.isFunction(callback) && callback(input.val());
                    })
                })

                /**
                 * 新建文件结束
                 */
                $scope.$on('fileNewFolderEnd', function (event, newFileData, newFilePath) {
                    $element.find('.file_item_edit').remove();
                    $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                    angular.forEach($scope.fileData, function (value, key) {
                        if (value.path === newFilePath) {
                            selectFile(key);
                        }
                    });
                })

                /**
                 * 重命名开始
                 */
                $scope.$on('fileEditNameStart', function (event, file, callback) {
                    var fileItem = $element.find('.file_item[data-path="' + file.path + '"]');
                    var input = jQuery('<input name="new_file_name" type="text" id="new_file_name" value="' + file.file_name + '" class="new_file_name form-control" />');
                    fileItem.addClass('file_item_edit');
                    fileItem.find('.name').hide().after(input);
                    input.focus();
                    input.bind('keydown', function (e) {
                        if (e.keyCode == 13) {
                            angular.isFunction(callback) && callback(input.val());
                            return false;
                        }
                    });
                    input.bind('blur', function () {
                        angular.isFunction(callback) && callback(input.val());
                    })
                })

                /**
                 * 重命名结束
                 */
                $scope.$on('fileEditNameEnd', function (event) {
                    var fileItem = $element.find('.file_item.file_item_edit');
                    fileItem.removeClass('file_item_edit');
                    fileItem.find('input[type="text"]').remove();
                    fileItem.find('.name').show();
                })

                /**
                 * ctrlV结束
                 */
                $scope.$on('ctrlVEnd', function (event, newFileData) {
                    $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                })
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
    .directive('toolbar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/toolbar.html",
            link: function ($scope, $element) {

            }
        }
    }])
    .directive('ngRightClick', function ($parse) {
        return function ($scope, $elemesnt, $attrs) {
            var fn = $parse($attrs.ngRightClick);
            $elemesnt.bind('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$events: event});
                });
            });
        };
    });
;
