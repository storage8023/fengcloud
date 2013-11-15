'use strict';

/* Directives */

angular.module('gkClientIndex.directives', [])
    .directive('preventDragDrop',[function(){
        return function ($scope, $element, $attrs) {
            $element.on('drop', function (event) {
                console.log(event);
                event.preventDefault();
            });
        };
    }])
    .directive('ngDrop', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngDrop);
            $element.on('drop', function (event) {
                $scope.$apply(function () {
                    fn($scope, {$event: event});
                });
            });
        };
    }])
    .directive('uiSelectable', ['uiSelectableConfig','GKFileList',function (uiSelectableConfig,GKFileList) {
        return {
            restrict:'A',
            require: ['ngModel'],
            link:function (scope, element, attrs, ctrlArr) {

                var ngModel = ctrlArr[0];
                var uiSelectableDragDropCtrl = ctrlArr[1];

                function combineCallbacks(first,second){
                    if( second && (typeof second === "function") ){
                        return function(e,ui){
                            first(e,ui);
                            second(e,ui);
                        };
                    }
                    return first;
                }
                var opts = { filter: 'li' };
                angular.extend(opts, uiSelectableConfig);

                var callbacks = {
                    selected: null,
                    selecting: null,
                    start: null,
                    stop: null,
                    unselected: null,
                    unselecting: null
                };

                if (ngModel) {
                    ngModel.$render = function() {
                        element.selectable( "refresh" );
                    };
                    callbacks.selected = function(e, ui) {
                        scope.$apply(function(){
                            GKFileList.select(scope,jQuery(ui.selected).index(),true);
                        })
                    };
                    callbacks.stop = function(e, ui) {

                    };
                    callbacks.start = function(e, ui) {
                        scope.$apply(function(){
                            GKFileList.unSelectAll(scope);
                        })
                    };
                    callbacks.unselected = function(e, ui) {
                        scope.$apply(function(){
                            GKFileList.unSelect(scope,jQuery(ui.selected).index());
                        })
                    };
//                    callbacks.selecting = function(e, ui) {
//                        var offsetParent = $(ui.selecting).offsetParent();
//                        var position = $(ui.selecting).position();
//                        var grid = position.top - offsetParent.height();
//                        if(grid-20>0){
//                            offsetParent.scrollTop(grid);
//                        }
//                    };
                }

                angular.forEach(callbacks, function(value, key ){
                    opts[key] = combineCallbacks(value, opts[key]);
                });
               //console.log(opts);
                element.selectable(opts);
            }
        };
    }])
    .directive('errorSrc',[function(){
        return {
            restrict: 'A',
            link:function(scope, element,attrs){
                element.on('error', function() {
                    element.attr('src', attrs.errorSrc);
                });
            }
        }
    }])
    .directive('href', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function () {
                    var href = attrs['href'];
                    var targetElem = element;
                    if (!targetElem.hasClass('gk_blank') && /\/storage#!files:(0|1):(.*?)(:(.*):.*)??$/.test(href)) {
                        if (!RegExp.$2 && !RegExp.$2.length && !RegExp.$4 && !RegExp.$4.length) {
                            //gkClientInterface.openSyncDir();
                        } else {
                            var dir = 0, path = '', uppath = '', file = '';
                            if (RegExp.$2 && RegExp.$2.length) {
                                uppath = decodeURIComponent(RegExp.$2);
                            }
                            if (RegExp.$4 && RegExp.$4.length) {
                                file = decodeURIComponent(RegExp.$4);
                                if (Util.String.lastChar(file) === '/') {
                                    dir = 1;
                                }
                                file = Util.String.rtrim(file, '/');
                            } else {
                                dir = 1;
                            }
                            path = (uppath.length ? uppath + '/' : '') + file;
//                            if (dir) {
//                                gkClientInterface.openSyncDir(path + '/');
//                            } else {
//                                gkClientInterface.openPathWithSelect(path);
//                            }
                        }
                        return false;
                    } else if ($.trim(href) != '' && $.trim(href).indexOf('#') != 0 && !/^javascript:.*?$/.test(href)) {
                        var param = {
                            url: href,
                            sso: 0
                        };
                        if ($rootScope.PAGE_CONFIG && $rootScope.PAGE_CONFIG.member || targetElem.data('sso') == 1) {
                            param.sso = 1;
                        }
                        var url = gkClientInterface.getUrl(param);
                        gkClientInterface.openUrl(url);
                        return false;
                    }
                })
            }
        }
    }])
    .directive('closeWindowButton', [function () {
        return {
            restrict: 'E',
            template: '<button class="close_window"><i class="icon16x16 icon_close_window"></i></button>',
            link: function (scope, element) {
                element.on('click', function () {
                    gkClientInterface.closeWindow();
                })
            }
        }
    }])
    .directive('loadingEllipsis', ['$interval', function ($interval) {
        return {
            replace: true,
            restrict: 'E',
            template: '<span ng-bind="ellipsis" style="margin: 0 0 0 3px"></span>',
            link: function ($scope) {
                var cell = '. ';
                $scope.ellipsis = '';
                var max = cell.length * 3;
                $interval(function () {
                    if ($scope.ellipsis.length >= max) {
                        $scope.ellipsis = '';
                    } else {
                        $scope.ellipsis += cell;
                    }
                }, 500)
            }
        }
    }])
    .directive('nearbySidebar', ['$rootScope', 'GKFind', function ($rootScope, GKFind) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: 'views/nearby_sidebar.html',
            link: function (scope) {
                scope.nearbyMembers = [
                    {
                        ip: "10.0.0.12",
                        name: "郑中周",
                        photo: "http://oss.aliyuncs.com/gkavatar2/a6/a6b08af6549a31c50f4d26754dfe93a82129ea56.jpg",
                        port: 1001,
                        type: "user",
                        userid: 167
                    }
                ];
                scope.nearbyTeams = [];

                scope.$on('AddFindObject', function (event, obj) {
                    scope.$apply(function () {
                        var type = obj['type'];
                        if (type == 'user') {
                            scope.nearbyMembers.unshift(obj)
                        } else if (type = 'org') {
                            scope.nearbyTeams.unshift(obj);
                        }
                        //scope.$digest();
                    })

                })

                scope.$on('removeFindObject', function (event, obj) {
                    var type = obj['type'];
                    if (type == 'user') {
                        scope.nearbyTeams.unshift(obj)
                    } else if (type = 'org') {
                        scope.nearbyTeams.unshift(obj);
                    }
                    scope.$digest();
                })

                scope.toogleFind = function () {
                    GKFind.toogleFind();
                };


            }
        }
    }])
    .directive('nearbyMember', [function () {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                photo: '@',
                name: '@',
                uid: '@',
                ip: '@',
                port: '@'
            },
            template: '<div class="slide-down member">'
                + '<img class="photo" ng-src="{{photo}}" alt="{{name}}"/>'
                + '<span class="name" title="{{name}}" ng-bind="name"></span>'
                + '</div>',
            link: function () {

            }
        }
    }])
    .directive('nearbyTeam', [function () {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                name: '@',
                orgId: '@',
                logo: '@'
            },
            template: '<div class="slide-down group">'
                + '<img class="photo" ng-src="{{logo}}" alt="{{name}}"/>'
                + '<span class="name" title="{{name}}" ng-bind="name"></span>'
                + '</div>',
            link: function () {

            }
        }
    }])
    .directive('scrollLoad', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                var triggerDistance = 0;
                var disableScroll = false;
                if (attrs.triggerDistance != null) {
                    $scope.$watch(attrs.triggerDistance, function (value) {
                        return triggerDistance = parseInt(value, 10);
                    });
                }

                if (attrs.disableScroll != null) {
                    $scope.$watch(attrs.disableScroll, function (value) {
                        return disableScroll = !!value;
                    });
                }

                var startScrollTop = $element.scrollTop();
                $element.on('scroll.scrollLoad', function (e) {
                    var _self = jQuery(this),
                        realDistance = 0,
                        scrollH = 0,
                        scrollT = 0,
                        isScrollDown = false;
                    scrollH = jQuery.isWindow(this) ? document.body.scrollHeight : $element[0].scrollHeight;
                    scrollT = _self.scrollTop();
                    isScrollDown = scrollT > startScrollTop;
                    var clientHeight = jQuery.isWindow(this) ? document.documentElement.clientHeight || document.body.clientHeight : this.clientHeight;
                    realDistance = scrollH - scrollT - clientHeight;
                    if (isScrollDown //向下滚动才触发
                        && realDistance <= triggerDistance && !disableScroll) {
                        if ($rootScope.$$phase) {
                            return $scope.$eval(attrs.scrollLoad);
                        } else {
                            return $scope.$apply(attrs.scrollLoad);
                        }
                    }
                    startScrollTop = scrollT;
                });
                $scope.$on('$destroy', function () {
                    $element.off('scroll.scrollLoad');
                })
            }
        }
    }])

    .directive('nofileRightSidebar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/nofile_right_sidebar.html",
            link: function ($scope, $element) {

            }
        }
    }])
    .directive('member', ['$compile', '$rootScope', 'GKDialog','GKModal','GKNews', 'GKApi',function ($compile, $rootScope, GKDialog,GKModal,GKNews,GKApi) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/member.html",
            scope: {
                user: '='
            },
            link: function ($scope, $element) {

                $scope.newsOpen = function () {
                    GKModal.news(GKNews,GKApi);
                };

                $scope.personalOpen = function ($scope) {
                    GKDialog.openSetting('account');
                };
            }
        }
    }])
    .directive('rightSidebar', ['GKFilter','RestFile', '$rootScope', 'GKApi', '$http', '$location', 'GKSearch', 'GKFileList', 'GKPartition', function (GKFilter,RestFile, $rootScope, GKApi, $http, $location, GKSearch, GKFileList, GKPartition) {
        return {
            replace: true,
            restrict: 'E',
            scope: {
                selectedFile: '=',
                path: '=',
                mountId: '=',
                filter: '=',
                partition: '=',
                keyword: '='
            },
            templateUrl: "views/right_sidebar.html",
            link: function ($scope, $element) {
                $scope.PAGE_CONFIG = $rootScope.PAGE_CONFIG;
                $scope.GKPartition = GKPartition;
                /**
                 * 监听已选择的文件
                 */
                $scope.shareMembers = []; //共享参与人
                $scope.remarks = []; //讨论
                $scope.histories = []; //历史
                $scope.remindMembers = [];//可@的成员列表
                $scope.file = null;

                $scope.$watch('[selectedFile,path]', function (newValue, oldValue) {
                    if (!newValue[0] || !newValue[0].length) {
                        if ($scope.PAGE_CONFIG.filter == 'search') {
                            $scope.file = null;
                            $scope.showSearch = true;
                        } else {
                            $scope.file = $scope.PAGE_CONFIG.file; //当前
                        }

                    } else if (newValue[0].length == 1) {
                        $scope.file = newValue[0][0];
                        $scope.showSearch = false;
                    } else { //多选
                        $scope.file = null;
                        $scope.showSearch = false;
                    }
                }, true)

                var gird = /[,;；，\s]/g;
                $scope.$watch('file', function (newValue, oldValue) {
                    ///console.logconsole.log(arguments);
                    if (!newValue || !oldValue || newValue === oldValue) {
                        return;
                    }
                    var fullpath = $scope.file.dir == 1 ? $scope.file.fullpath + '/' : $scope.file.fullpath;
                    var formatTag = [];
                    RestFile.get($scope.mountId, fullpath).success(function (data) {
                        var tag = data.tag || '';
                        $scope.file.tag = jQuery.trim(tag);
                        angular.forEach(tag.split(gird), function (value) {
                            if (value && formatTag.indexOf(value) < 0) {
                                formatTag.push(value);
                            }
                        });
                        $scope.file.formatTag = formatTag;
                    });

                    GKApi.sideBar($scope.mountId, fullpath).success(function (data) {
                        $scope.shareMembers = data.share_members;
                        $scope.remarks = data.remark;
                        $scope.histories = data.history;
                        $scope.remindMembers = data.remind_members;
                    });
                })
                $scope.sidebar = 'nofile';
                $scope.$watch('[partition,selectedFile,filter,file]', function (newValue, oldValue) {
                    var selected = newValue[1] || [];
                    if (newValue[2] == 'search' && !selected.length) {
                        $scope.sidebar = 'search';
                    } else if (selected.length > 1) {
                        $scope.sidebar = 'multifile';
                    } else if (selected.length == 1 || newValue[3].fullpath) {
                        $scope.sidebar = 'singlefile';
                    } else {
                        $scope.sidebar = 'nofile';
                        if(!$scope.filter){
                            $scope.sidbarData = {
                                title: $rootScope.PAGE_CONFIG.mount.name,
                                tip: '将文稿，照片，视频等文件保存在我的文件夹里，文件将自动备份到云端。可以使用手机，平板来访问它们，使设备之间无缝，无线连接',
                                photo: "",
                                attrHtml: '',
                                menus: null
                            };
                            if ($scope.partition == GKPartition.myFile) {
                                $scope.sidbarData.photo = $rootScope.PAGE_CONFIG.user.avatar;
                                $scope.sidbarData.atrrHtml = '已经使用 ' + Util.Number.bitSize($rootScope.PAGE_CONFIG.mount.size);

                            } else {
                                $scope.sidbarData.photo = $rootScope.PAGE_CONFIG.mount.logo;
                                if($scope.partition == GKPartition.teamFile){
                                    $scope.sidbarData.atrrHtml = '成员 ' + $rootScope.PAGE_CONFIG.mount.member_count + ',订阅 ' + $rootScope.PAGE_CONFIG.mount.subscriber_count + '人';
                                    $scope.sidbarData.menus = [
                                        {
                                            text: '在线访问',
                                            name: 'visit_website',
                                            click: function () {

                                            }
                                        },
                                        {
                                            text: '团队二维码',
                                            name: 'team_qr',
                                            click: function () {

                                            }
                                        },
                                        {
                                            text: '成员与分组',
                                            name: 'member_group',
                                            click: function () {

                                            }
                                        },
                                        {
                                            text: '订阅者',
                                            name: 'subscriber',
                                            click: function () {

                                            }
                                        },
                                        {
                                            text: '管理团队',
                                            name: 'manage_team',
                                            click: function () {

                                            }
                                        }
                                    ];
                                }else{
                                    $scope.sidbarData.menus = [
                                        {
                                            text: '在线访问',
                                            name: 'visit_website',
                                            click: function () {

                                            }
                                        },
                                        {
                                            text: '团队二维码',
                                            name: 'team_qr',
                                            click: function () {

                                            }
                                        }
                                    ];
                                }


                            }
                        }else{
                            $scope.sidbarData = {
                                title: GKFilter.getFilterName($scope.filter),
                                tip: GKFilter.getFilterTip($scope.filter),
                                icon:$scope.filter
                            };
                        }
                    }
                }, true)
            }
        }
    }])
    .directive('singlefileRightSidebar', ['RestFile', '$location', '$timeout', 'GKApi', '$rootScope', function (RestFile, $location, $timeout, GKApi, $rootScope) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/singlefile_right_sidebar.html",
            link: function ($scope, $element) {

                $scope.inputingRemark = false;
                $scope.postText = '';

                /**
                 * 取消发布备注
                 */
                $scope.cancelPostRemark = function () {
                    $scope.postText = '';
                    $scope.inputingRemark = false;
                };

                /**
                 * 发布讨论
                 */
                $scope.postRemark = function (postText) {
                    if (!postText || !postText.length) return;
                    var fullpath = $scope.file.dir == 1 ? $scope.file.fullpath + '/' : $scope.file.fullpath;
                    RestFile.remind($location.search().mountid, fullpath, postText).success(function (data) {
                        $scope.postText = '';
                        $scope.inputingRemark = false;
                        if (data && data.length) {
                            $scope.remarks.unshift(data[0]);
                        }

                    }).error(function () {

                        });
                };

                $scope.folded = false;
                /**
                 * 显示及缩小文件信息框
                 */
                $scope.toggleFileInfoWrapper = function () {
                    $scope.folded = !$scope.folded;
                };

                $scope.insertAt = function () {
                    var input = '@';
                    var val = $scope.postText;
                    var jqTextarea = $element.find('.post_wrapper textarea');
                    var input_pos = Util.Input.getCurSor(jqTextarea[0]).split('|');
                    var is_insert = input_pos[1] != val.length ? 1 : 0;
                    var l = val.substr(0, input_pos[0]);
                    var r = val.substr(input_pos[1], val.length);
                    val = l + input + r;
                    $scope.postText = val;
                    $timeout(function () {
                        if (is_insert) {
                            Util.Input.moveCur(jqTextarea[0], parseInt(input_pos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(jqTextarea[0], val.length);
                        }
                    }, 0);

                }

                $scope.showEditShareDialog = function () {
                    var selectModal = selectMemberModal.open(PAGE_CONFIG.mount.org_id);
                    selectModal.result.then(function (selectedMembers, selectedGroups) {

                    }, function () {

                    })
                };

                $scope.handleKeyDown = function (e) {
                    if (e.keyCode == 13 & (e.ctrlKey || e.metaKey)) {
                        $scope.postRemark($scope.postText);
                    }
                };

                $scope.$watch('file.formatTag', function (value, oldValue) {
                    if (!angular.isDefined(value)
                        || !angular.isDefined(oldValue)
                        || value == oldValue) {
                        return;
                    }
                    var fullpath = $scope.file ? $scope.file.fullpath || '' : '';
                   if(!value){
                       value = '';
                   }

                    GKApi.setTag($rootScope.PAGE_CONFIG.mount.mount_id,fullpath, value.join(' ')).success(function () {

                    }).error(function () {

                        });
                }, true);


            }
        }
    }])
    .directive('multifileRightSidebar', [function () {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/multifile_right_sidebar.html",
            link: function ($scope, $element) {

            }
        }
    }])
    .directive('finder', ['$location', 'GKPath', '$filter', '$templateCache', '$compile', '$rootScope', 'GKFileList', function ($location, GKPath, $filter, $templateCache, $compile, $rootScope, GKFileList) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/file_list.html",
            scope: {
                fileData: '=',
                view: '=',
                partition: '=',
                filter: '@',
                order: '=',
                selectedFile: '=',
                rightOpts: '=',
                keyword: '@',
                selectedPath: '@'
            },
            link: function ($scope, $element) {
                var shiftLastIndex = 0; //shift键盘的起始点

                if ($scope.selectedPath) {
                    angular.forEach($scope.selectedPath.split('|'), function (value) {
                        GKFileList.selectByPath($scope,value);
                    });
                }


                /**
                 * 处理点击
                 * @param $event
                 * @param index
                 */
                $scope.handleClick = function ($event, index) {
                    var file = $scope.fileData[index];
                    if ($event.ctrlKey || $event.metaKey) {
                        if (file.selected) {
                            GKFileList.unSelect($scope,index);
                        } else {
                            GKFileList.select($scope,index, true);
                        }
                    } else if ($event.shiftKey) {
                        var lastIndex = shiftLastIndex;
                        GKFileList.unSelectAll($scope)
                        if (index > lastIndex) {
                            for (var i = lastIndex; i <= index; i++) {
                                GKFileList.select($scope,i, true);
                            }
                        } else if (index < lastIndex) {
                            for (var i = index; i <= lastIndex; i++) {
                                GKFileList.select($scope,i, true);
                            }
                        }

                    } else {
                        GKFileList.select($scope,index);
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
                $scope.handleDblClick = function (file) {
                    /**
                     * 文件夹
                     */
                    if ($scope.filter == 'trash') {
                        return;
                    }
                    if (file.dir == 1) {
                        var params = $location.search();
                        $location.search({
                            path: file.fullpath,
                            view: $scope.view,
                            partition: params.partition,
                            mountid: params.mountid
                        });
                    } else {
                        $scope.$emit('openFile', file);
                    }
                };

                /**
                 * 根据rightOpts的变化重置右键
                 */
                $scope.$watch('rightOpts', function () {
                    jQuery.contextMenu('destroy', '.file_list .list_body');
                    /**
                     * 设置右键菜单
                     */
                    jQuery.contextMenu({
                        selector: '.file_list .list_body',
                        reposition: false,
                        zIndex: 99,
                        animation: {
                            show: "show",
                            hide: "hide"
                        },
                        items: $scope.rightOpts
                    });
                });

                /**
                 * 右键文件
                 * @param $event
                 * @param file
                 */
                $scope.handleRightClick = function ($event) {
                    var jqTarget = jQuery($event.target);
                    var fileItem = jqTarget.hasClass('file_item') ? jqTarget : jqTarget.parents('.file_item');
                    if (fileItem.size()) {
                        var index = fileItem.index();
                        if (!$scope.fileData[index].selected) {
                            GKFileList.select($scope,index);
                        }
                    } else {
                        GKFileList.unSelectAll($scope);
                    }
                };


                /**
                 * 监听order的变化
                 */
                $scope.$watch('order', function () {
                    $scope.fileData = $filter('orderBy')($scope.fileData, $scope.order);
                    GKFileList.reIndex($scope.fileData);
                });

                /**
                 * 设置order
                 * @param order
                 */
                $scope.setOrder = function (order) {
                    $scope.$emit('setOrder', order);
                };

                /**
                 * enter 键
                 */
                $scope.enterPress = function () {
                    if ($scope.selectedFile && $scope.selectedFile.length) {
                        $scope.handleDblClick($scope.selectedFile[0]);
                    }
                };

                /**
                 * fix列表出现滚动条后列表头部对不齐的问题
                 */
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
                        $element.find('.file_list_header').css('right', 8);
                    } else {
                        $element.find('.file_list_header').css('right', 0);
                    }
                };
                jQuery(window).bind('resize', function () {
                    setListHeaderWidth();
                });
                setTimeout(function () {
                    setListHeaderWidth();
                }, 0);

                /**
                 * 获取缩略图模式下每行的列数
                 * @returns {number}
                 */
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
                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >= 0) {
                        return;
                    }
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
                    var selectedIndex = GKFileList.getSelectedIndex();
                    if (selectedIndex.length) {
                        initIndex = Math.min.apply('', selectedIndex);
                    }
                    var newIndex = initIndex - step;
                    if (newIndex < 0) {
                        newIndex = 0;
                    }

                    if ($event.shiftKey) {
                        for (var i = (initIndex > ($scope.fileData.length - 1) ? $scope.fileData.length - 1 : initIndex); i >= newIndex; i--) {
                            GKFileList.select($scope,i, true);
                        }
                    } else {
                        GKFileList.unSelectAll($scope);
                        GKFileList.select($scope,newIndex);
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * down right 键
                 * @param $event
                 */
                $scope.downRightPress = function ($event) {
                    if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) >= 0) {
                        return;
                    }
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
                    var selectedIndex = GKFileList.getSelectedIndex();
                    if (selectedIndex.length) {
                        initIndex = Math.max.apply('', selectedIndex);
                    }
                    var newIndex = initIndex + step;
                    if (newIndex > $scope.fileData.length - 1) {
                        newIndex = $scope.fileData.length - 1;
                    }
                    if ($event.shiftKey) {
                        for (var i = (initIndex > 0 ? initIndex : 0); i <= newIndex; i++) {
                            GKFileList.select($scope,i, true);
                        }
                    } else {
                        GKFileList.unSelectAll($scope);
                        GKFileList.select($scope,newIndex, true);
                        shiftLastIndex = newIndex;
                    }
                };

                /**
                 * 监听键盘事件
                 */
                jQuery(document).off('keydown.shortcut').on('keydown.shortcut', function ($event) {
                    $scope.$apply(function () {
                        var ctrlKeyOn = $event.ctrlKey || $event.metaKey;
                        switch ($event.keyCode) {
                            case 13: //enter
                                if (['INPUT', 'TEXTAREA'].indexOf($event.target.nodeName) < 0) {
                                    $scope.enterPress();
                                }
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
                 * 新建文件开始
                 */
                $scope.$on('fileNewFolderStart', function (event, callback) {
                    GKFileList.unSelectAll($scope);
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
                        angular.isFunction(callback) && callback(input.val());
                    })
                });

                /**
                 * 新建文件结束
                 */
                $scope.$on('fileNewFolderEnd', function (event, newFileData, newFilePath) {
                    $element.find('.file_item_edit').remove();
                    $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                    angular.forEach($scope.fileData, function (value, key) {
                        if (value.fullpath === newFilePath) {
                            GKFileList.select($scope,key);
                        }
                    });
                });

                /**
                 * 重命名开始
                 */
                $scope.$on('fileEditNameStart', function (event, file, callback) {
                    var fileItem = $element.find('.file_item[data-fullpath="' + file.fullpath + '"]');
                    var input = jQuery('<input name="new_file_name" type="text" id="new_file_name" value="' + file.filename + '" class="new_file_name form-control" />');
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
                });

                /**
                 * 重命名结束
                 */
                $scope.$on('fileEditNameEnd', function (event) {
                    var fileItem = $element.find('.file_item.file_item_edit');
                    fileItem.removeClass('file_item_edit');
                    fileItem.find('input[type="text"]').remove();
                    fileItem.find('.name').show();
                });

                /**
                 * ctrlV结束
                 */
                $scope.$on('ctrlVEnd', function (event, newFileData) {
                    $scope.fileData = $filter('orderBy')(newFileData, $scope.order);
                });

                /**
                 * 监听mousedown事件
                 * @param event
                 */
                $scope.handleMouseDown = function (event) {
                    var $target = jQuery(event.target);
                    if (!$target.hasClass('file_item') && !$target.parents('.file_item').size()) {
                        GKFileList.unSelectAll($scope);
                    }
                };

                /**drag drop **/
                $scope.getHelper = function(){
                    //return $scope.$apply(function(){
                        return '<div class="helper">'+$scope.selectedFile.length+'</div>';
                    //})
                };
                $scope.dragState = function(event,ui,$index){

                };
                $scope.handleOver = function(event,ui,file){
                    file.hover = true;
                };

                $scope.handleOut = function(event,ui,file){
                    file.hover = false;
                };

                $scope.handleDrop = function(event,ui,file){
                   $scope.$emit('dropFile',file);
                };

                $scope.handleSysDrop = function(event){
                    console.log(event.originalEvent.dataTransfer.files);
                };
            }
        };
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
    .directive('ngRightClick', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngRightClick);
            $element.bind('contextmenu', function (event) {
                $scope.$apply(function () {
                    event.preventDefault();
                    fn($scope, {$event: event});
                });
            });
        };
    }])
    .directive('inputTipPopup', ['$document', '$parse', '$timeout', function ($document, $parse, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            scope: { list: '=', onSelect: '&'},
            template: '<ul class="dropdown-menu input_tip_list">'
                + '<li ng-repeat="(key,item) in list"><a  ng-mouseenter="handleMouseEnter(key)" ng-click="handleClick(key)" ng-class="item.selected?\'active\':\'\'" title="{{item.name}}" href="javascript:void(0)">{{item.name}}</a></li>'
                + '</ul>',
            link: function ($scope, $element, $attrs) {
                var index = 0;
                var selectItem = function () {
                    if (!$scope.list[index]) return;
                    if ($scope.onSelect != null) {
                        $scope.onSelect({item: $scope.list[index]})
                    }

                    if ($scope.list[index]) {
                        $scope.list[index].selected = false;
                        index = 0;
                    }
                };
                var preSelectItem = function (newIndex) {
                    if (!$scope.list || !$scope.list.length) return;
                    angular.forEach($scope.list, function (value) {
                        if (value.selected) {
                            value.selected = false;
                        }
                    });
                    $scope.list[newIndex].selected = true;
                    index = newIndex;
                };

                $scope.handleMouseEnter = function (key) {

                    preSelectItem(key);
                };
                $scope.handleClick = function (key) {
                    //preSelectItem(key);
                    selectItem();
                };
                $document.bind('keydown', function (e) {
                    $scope.$apply(function () {
                        var key_code = e.keyCode;
                        if (!$scope.list || !$scope.list) return;
                        var listLength = $scope.list.length;
                        var step = 1;
                        if (key_code == 38 || key_code == 40) { //up
                            if (key_code == 38) {
                                step = -1;
                            }
                            var newIndex = index + step;
                            if (newIndex < 0) {
                                newIndex = listLength - 1;
                            } else if (newIndex > listLength - 1) {
                                newIndex = 0;
                            }
                            preSelectItem(newIndex);
                            e.preventDefault();
                        } else if (key_code == 13 || key_code == 32) {
                            selectItem();
                            e.preventDefault();
                        }
                    });
                })

            }
        };
    }])
    .directive('inputTip', [ '$compile', '$parse', '$document', '$position', '$timeout', function ($compile, $parse, $document, $position, $timeout) {
        var template =
            '<input-tip-popup ' +
                'list="it_list" ' +
                'on-select="it_onSelect(item)"' +
                '>' +
                '</input-tip-popup>';
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {

                var watchStr = $attrs.inputTip;
                var placementArr = $attrs.inputTipPlacement.split(' ');
                var placement = {
                    v: placementArr[0],
                    h: placementArr[1]
                };
                var inputtip = $compile(template)($scope);
                var elem = $element[0];
                /**
                 * 是否appendToBody
                 * @TODO 可定制
                 */
                var appendToBody = true;
                $scope.it_isOpen = false;
                var $body;


                var setPosition = function (jqTextarea, hintWrapper) {
                    var position,
                        ttWidth,
                        ttHeight,
                        ttPosition;

                    //获取textarea的相对位置
                    //position = appendToBody ? $position.offset($element) : $position.position($element);

                    ttWidth = inputtip.outerWidth();
                    ttHeight = inputtip.outerHeight();

                    /**
                     * 获取光标在输入框的位置
                     * @type {*}
                     */
                    var lineHeight = 4;
                    var cursorPosition = Util.Input.getInputPositon(elem);
                    var ttPosition = {
                        top: cursorPosition.top + lineHeight,
                        left: cursorPosition.left
                    }

                    if (ttPosition.top + ttHeight > jQuery(window).height()) {
                        ttPosition.top = ttPosition.top - ttHeight - lineHeight - parseInt($element.css('line-height').replace('px'));
                    }

                    if (ttPosition.left + ttWidth > jQuery(window).width()) {
                        ttPosition.left = ttPosition.left - ttWidth;
                    }

                    ttPosition.top += 'px';
                    ttPosition.left += 'px';
                    inputtip.css(ttPosition);
                };

                /**
                 * 显示提示框
                 */
                var show = function () {
                    var selected = false;
                    angular.forEach($scope.it_list, function (value) {
                        if (value.selected) {
                            selected = true;
                        }
                    });
                    if (!selected && $scope.it_list) {
                        $scope.it_list[0].selected = true;
                    }
                    if (appendToBody) {
                        $body = $body || $document.find('body');
                        $body.append(inputtip);
                    } else {
                        //TODO
                    }

                    /**
                     * 设置位置
                     */
                    $scope.it_isOpen = true;
                    setTimeout(function () {
                        setPosition();
                        inputtip.css('display', 'block');
                    }, 0);
                };

                /**
                 * 隐藏提示框
                 */
                var hide = function () {
                    $scope.it_isOpen = false;
                    inputtip.remove();
                };

                $scope.$on('$locationChangeSuccess', function () {
                    if ($scope.it_isOpen) {
                        hide();
                    }
                });

                $scope.$on('$destroy', function () {
                    if ($scope.it_isOpen) {
                        hide();
                    } else {
                        inputtip.remove();
                    }
                });
                var inputPos, val, lastIndex;

                var checkAt = function () {
                    $scope.$apply(function () {
                        val = $scope.postText;
                        var cursor = Util.Input.getCurSor($element[0]);
                        inputPos = cursor.split('|');
                        var leftStr = val.slice(0, inputPos[0]); //截取光标左边的所有字符
                        lastIndex = leftStr.lastIndexOf(watchStr); //获取光标左边字符最后一个@字符的位置
                        if (lastIndex < 0) {
                            hide();
                            return;
                        }
                        var q = leftStr.slice(lastIndex + 1, leftStr.length); //获取@与光标位置之间的字符

                        //如果@与光标之间有空格，隐藏提示框
                        if ($.trim(q).length != q.length) {
                            hide();
                            return;
                        }
                        var resultList = [];
                        if (!q.length) {
                            resultList = $scope.remindMembers;
                        } else {
                            if ($scope.remindMembers && $scope.remindMembers.length) {
                                angular.forEach($scope.remindMembers, function (value) {
                                    if (value.short_name && value.short_name.indexOf(q) === 0) {
                                        resultList.unshift(value);
                                    } else if (value.name.indexOf(q) != -1) {
                                        resultList.push(value);
                                    }
                                });
                            }
                        }
                        if (!resultList || !resultList.length) {
                            hide();
                        } else {
                            $scope.it_list = resultList;
                            show();
                        }
                    });
                };

                $scope.it_list = [];
                $scope.it_index = 0;
                var timer;
                $element.bind('focus',function () {
                    if (timer) {
                        clearInterval(timer);
                    }
                    timer = setInterval(checkAt, 200);
                }).bind('blur', function () {
                        if (timer) {
                            clearInterval(timer);
                        }
                    })


                var insertChar = function (input) {
                    input += ' ';
                    var newVal = $scope.postText;
                    var newInputPos = inputPos;
                    var isInsert = newInputPos[1] != newVal.length;
                    newVal = newVal.substr(0, lastIndex + 1) + input + newVal.substr(inputPos[1], newVal.length);
                    $scope.postText = newVal;
                    $timeout(function () {
                        if (isInsert) {
                            Util.Input.moveCur(elem, parseInt(inputPos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(elem, $scope.postText.length);
                        }
                    }, 0)

                };
                $scope.it_onSelect = function (item) {
                    insertChar(item.name);
                };


            }
        }
    }])
    .directive('rightTagInput', ['$parse', function ($parse) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function ($scope, $element, $attrs, $ngModel) {
                if (!$ngModel) {
                    return;
                }
                jQuery($element).tagsInput({
                    'height': 'auto',
                    'width': '225px',
                    'interactive': true,
                    'onAddTag': function (tag) {
                        $scope.addTag(tag);
                    },
                    'onRemoveTag': function (tag) {
                        $scope.removeTag(tag);
                    },
                    'onChange': function (input, d, c) {

                    }
                })
            }
        }
    }])
    .directive('breadsearch', ['$location', '$timeout', 'GKSearch', function ($location, $timeout, GKSearch) {
        return {
            replace: true,
            restrict: 'E',
            templateUrl: "views/bread_and_search.html",
            link: function ($scope, $element) {
                var bread = $element.find('.bread');
                var searchIcon = $element.find('.icon-search');
                var eleWidth = $element.width();
                var hideBread = $element.find('.hide_bread');
                /**
                 * 显示搜索模式
                 * @param $event
                 */
                $scope.showSearch = function ($event) {
                    if (jQuery($event.target).hasClass('bread_list')
                        || jQuery($event.target).parents('.bread_list').size()
                        || jQuery($event.target).hasClass('searching_label')
                        || jQuery($event.target).parents('.searching_label').size()
                        || jQuery($event.target).hasClass('hide_bread')
                        || jQuery($event.target).parents('.hide_bread').size()) {
                        return;
                    }
                    $scope.searchState = 'start';
                    $element.find('input[name="keyword"]').focus();
                };

                $scope.hideBreads = [];

                var setBreadUI = function () {
                    var breadWidth = $element.find('.bread').width();
                    $element.find('.bread_list .bread_item a').css({'max-width': breadWidth});
                    var breadListWidth = $element.find('.bread_list').width();
                    while (breadListWidth > breadWidth) {
                        if ($element.find('.bread_list .bread_item:visible').size() == 1) {
                            break;
                        }
                        var hideBread = $scope.breads[$scope.hideBreads.length];
                        if (hideBread) {
                            $scope.hideBreads.unshift($scope.breads[$scope.hideBreads.length]);
                            $element.find('.bread_list .bread_item:visible').eq(0).hide();
                            breadListWidth = $element.find('.bread_list').width();
                        }
                    }
                };

                $scope.$watch('breads', function () {
                    $scope.hideBreads = [];
                    $element.find('.bread_list .bread_item:hidden').show();
                    $timeout(function () {
                        setBreadUI();
                    }, 0);
                })

                var oldBreadWidth = $element.find('.bread').width();
                jQuery(window).bind('resize', function () {
                    $scope.$apply(function () {
                        var grid = $element.find('.bread').width() - oldBreadWidth;
                        if (grid > 0) {
                            var lastHideBread = $element.find('.bread_list .bread_item:hidden').last();
                            if (lastHideBread.size()) {
                                if (grid >= lastHideBread.outerWidth()) {
                                    $scope.hideBreads.splice(0, 1);
                                    lastHideBread.show();
                                }
                            }
                        } else {
                            $timeout(function () {
                                setBreadUI();
                            }, 0)
                        }
                    })
                })


                /**
                 * 点击面包屑后的跳转
                 * @param bread
                 * @param $event
                 */
                $scope.selectBread = function ($event, bread) {
                    var params = $location.search();
                    $location.search({
                        path: bread.path || '',
                        view: params.view,
                        mountid: params.mountid,
                        partition: params.partition,
                        filter: bread.filter
                    });
                    $event.stopPropagation();
                };

                /**
                 * 搜索的范围
                 * @type {string}
                 */
                $scope.searchScope = 'path';
                $scope.setSearchScope = function (searchScope) {
                    $scope.searchScope = searchScope;
                }

                $scope.$watch(function () {
                    return GKSearch.getSearchState();
                }, function (newValue, oldValue) {
                    if (newValue == oldValue) {
                        return;
                    }
                    $scope.searchState = newValue;
                });

                $scope.searchFile = function () {
                    if (!$scope.keyword || !$scope.keyword.length || $scope.searchState == 'loading') {
                        return;
                    }
                    var fileSearch = new GKFileSearch();
                    fileSearch.conditionIncludeKeyword($scope.keyword);
                    fileSearch.conditionIncludePath($scope.searchScope == 'path' ? $scope.path : '');
                    var condition = fileSearch.getCondition();
                    GKSearch.setCondition(condition);
                    var search = $location.search();
                    $location.search(angular.extend(search, {
                        filter: 'search',
                        keyword: $scope.keyword
                    }));
                };
                var resetSearch = function () {
                    $scope.keyword = '';
                    $scope.searchState = '';
                    GKSearch.reset();
                };

                $scope.cancelSearch = function ($event) {
                    resetSearch();
                    var search = $location.search();
                    $location.search(angular.extend(search, {
                        filter: '',
                        keyword: ''
                    }));
                    if ($event) {
                        $event.stopPropagation();
                    }
                };


                /**
                 * 监听mousedown 如果没有进行搜索，取消搜索模式
                 */
                $('body').bind('mousedown', function (event) {
                    $scope.$apply(function () {
                        if (
                            $(event.target).hasClass('bread_and_search_wrapper')
                                || $(event.target).parents('.bread_and_search_wrapper').size()
                                || $scope.searchState == 'loading'
                                || $scope.searchState == 'end'
                            ) {
                            return;
                        }
                        resetSearch();
                    })
                })

                $scope.$on('$routeChangeSuccess', function (event, current, previous) {
                    var previousParams = previous.params;
                    var currentParams = current.params;
                    if (previousParams.partition + previousParams.path !== currentParams.partition + currentParams.path) {
                        resetSearch();
                    }
                });

            }
        }
    }])
/**
 * 搜索的侧边栏
 */
    .directive('searchRightSidebar', ['GKApi', '$rootScope', '$modal', 'GKSearch', 'FILE_SORTS', '$location', 'GKSmartFolder', 'GKMount', function (GKApi, $rootScope, $modal, GKSearch, FILE_SORTS, $location, GKSmartFolder, GKMount) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/search_right_sidebar.html",
            link: function ($scope, $element, $attrs) {
                var condition = '';
                if ($scope.partition == 'smartfolder' && $scope.filter == 'search') {
                    GKApi.getSmartFolder($scope.keyword).success(function (data) {
                        if (data && data.condition) {
                            condition = data.condition;
                            GKSearch.setCondition(condition);
                        }
                    }).error(function () {

                        })
                }

                /**
                 * 文件扩展名列表
                 * @type {Array}
                 */
                $scope.extensions = [
                    {
                        name: '任意',
                        value: ''
                    },
                    {
                        name: '文件夹',
                        value: 'dir=1'
                    },
                    {
                        name: '文件',
                        value: 'dir=0'
                    },
                    {
                        name: '图片',
                        value: 'extensions=' + FILE_SORTS['SORT_IMAGE'].join('|')
                    },
                    {
                        name: '视频',
                        value: 'extensions=' + FILE_SORTS['SORT_MOVIE'].join('|')
                    },
                    {
                        name: '音频',
                        value: 'extensions=' + FILE_SORTS['SORT_MUSIC'].join('|')
                    },
                    {
                        name: 'PDF',
                        value: 'extensions=pdf'
                    },
                    {
                        name: 'Word文档',
                        value: 'extensions=doc|docx'
                    },
                    {
                        name: 'Excel表格',
                        value: 'extensions=xls|xlsx'
                    },
                    {
                        name: 'PowerPoint演示文档',
                        value: 'extensions=ppt|pptx'
                    }
                ];


                var getTimeStamp = function (date) {
                    return Date.parse(date) / 1000;
                };

                var getCondition = function () {
                    var fileSearch = new GKFileSearch();
                    fileSearch.conditionIncludeKeyword(GKSearch.getKeyWord());
                    fileSearch.conditionIncludePath($rootScope.PAGE_CONFIG.file.fullpath || '');
                    if ($scope.extension.value) {
                        var tem = $scope.extension.value.split('=');
                        if (tem[0] == 'dir') {
                            fileSearch.conditionIncludeDir(tem[1]);
                        } else if (tem[0] == 'extensions') {
                            fileSearch.conditionIncludeExtension(tem[1].split('|'));
                        }
                    }
                    var fromCreateDateline = 0,
                        toCreateDateline = 0,
                        toEditDateline = 0,
                        fromEditDateline = 0;
                    if ($scope.fromCreateDate) {
                        fromCreateDateline = getTimeStamp($scope.fromCreateDate);
                    }
                    if ($scope.toCreateDate) {
                        toCreateDateline = getTimeStamp($scope.toCreateDate);
                    }
                    if (fromCreateDateline && toCreateDateline) {
                        fileSearch.conditionIncludeDateline([fromCreateDateline, toCreateDateline]);
                    } else if (fromCreateDateline) {
                        fileSearch.conditionIncludeDateline(fromCreateDateline, 'gt');
                    } else if (toCreateDateline) {
                        fileSearch.conditionIncludeDateline(toCreateDateline, 'lt');
                    }

                    if ($scope.fromEditDate) {
                        fromEditDateline = getTimeStamp($scope.fromEditDate);
                    }
                    if ($scope.toEditDate) {
                        toEditDateline = getTimeStamp($scope.toEditDate);
                    }
                    if (fromEditDateline && toEditDateline) {
                        fileSearch.conditionIncludeLastDateline([fromEditDateline, toEditDateline]);
                    } else if (fromEditDateline) {
                        fileSearch.conditionIncludeLastDateline(fromEditDateline, 'gt');
                    } else if (toEditDateline) {
                        fileSearch.conditionIncludeLastDateline(toEditDateline, 'lt');
                    }
                    if ($scope.creator) {
                        fileSearch.conditionIncludeCreator($scope.creator.split(','));
                    }
                    if ($scope.modifier) {
                        fileSearch.conditionIncludeModifier($scope.modifier.split(','));
                    }
                    var condition = fileSearch.getCondition();
                    return condition;
                };
                var smartFolderName = '';
                if ($scope.partition == 'smartfolder') {
                    smartFolderName = GKSmartFolder.getFolderByCode($scope.keyword)['name'];
                    $scope.smartFolderName = smartFolderName;
                }

                $scope.disabledSave = true;
                $scope.$watch('[creator,modifier,fromCreateDate,toCreateDate,fromEditDate,toEditDate,extension]', function (newValue, oldValue) {
                    if (newValue != oldValue) {
                        var condition = getCondition();
                        GKSearch.setCondition(condition);
                        $rootScope.$broadcast('invokeSearch');
                    }
                }, true);

                if ($scope.partition == 'smartfolder') {
                    $scope.$watch('smartFolderName', function (newValue, oldValue) {
                        if (newValue == smartFolderName && getCondition() == condiiton) {
                            $scope.disabledSave = true;
                        } else {
                            $scope.disabledSave = false;
                        }
                    })
                }

                var getSelectExtension = function (dir, ext) {
                    var selectedValue;
                    var selectedExtension;

                    if (dir === null && ext === null) {
                        selectedValue = '';
                    } else if (ext) {
                        selectedValue = 'extensions=' + ext.join('|');
                    } else {
                        selectedValue = 'dir=' + dir;
                    }
                    angular.forEach($scope.extensions, function (value) {
                        if (value.value == selectedValue) {
                            selectedExtension = value;
                            return false;
                        }
                    })
                    return selectedExtension;
                };

                $scope.$watch(function () {
                    return GKSearch.getCondition();
                }, function (newValue, oldValue) {
//                    console.log(newVale == oldValue);
//                    if(newVale == oldValue){
//                        return;
//                    }
                    $scope.searchKeyword = GKSearch.getKeyWord();

                    $scope.searchPath = GKSearch.getConditionField('path');
                    var creator = GKSearch.getConditionField('creator');
                    $scope.creator = creator ? creator.split(' ') : '';
                    var modifier = GKSearch.getConditionField('modifier');
                    $scope.modifier = modifier ? modifier.split(' ') : '';

                    var dateline = GKSearch.getConditionField('dateline');
                    if (dateline) {
                        $scope.fromCreateDate = dateline[0] ? $filter('date')(dateline[0] * 1000, 'yyyy-MM-dd') : '';
                        $scope.toCreateDate = dateline[1] ? $filter('date')(dateline[1] * 1000, 'yyyy-MM-dd') : '';
                    }
                    var lastDateline = GKSearch.getConditionField('last_dateline');
                    if (lastDateline) {
                        $scope.fromEditDate = lastDateline[0] ? $filter('date')(lastDateline[0] * 1000, 'yyyy-MM-dd') : '';
                        $scope.toEditDate = lastDateline[1] ? $filter('date')(lastDateline[1] * 1000, 'yyyy-MM-dd') : '';
                    }
                    var dir = GKSearch.getConditionField('dir');
                    var extension = GKSearch.getConditionField('extension');
                    $scope.extension = getSelectExtension(dir, extension);

                    if ($scope.partition == 'smartfolder') {
                        if ($scope.smartFolderName == smartFolderName && newValue == condiiton) {
                            $scope.disabledSave = true;
                        } else {
                            $scope.disabledSave = false;
                        }
                    }

                })

                /**
                 * 创建智能文件夹
                 */
                $scope.saveSearch = function () {
                    if (!$scope.smartFolderName) {
                        alert('智能文件夹名不能为空');
                        return;
                    }
                    var condition = getCondition();
                    GKApi.createSmartFolder($rootScope.PAGE_CONFIG.mount.mount_id, $scope.smartFolderName, condition).success(function (data) {
                        if (data && data.code) {
                            $rootScope.$broadcast('addSmartFolder', $scope.smartFolderName, data.code);
                        }
                    }).error(function () {

                        });
                };

                /**
                 * 删除智能文件夹
                 */
                $scope.cancelSmartFolder = function () {
                    if (!confirm('你确定要关闭该智能文件夹？')) {
                        return;
                    }
                    GKApi.removeSmartFolder($scope.keyword).success(function (data) {
                        $rootScope.$broadcast('removeSmartFolder', $scope.keyword)
                        $location.search({
                            mountid: GKMount.getMyMount()['mount_id'],
                            path: '',
                            partition: 'myfile'
                        });

                    }).error(function () {

                        });
                };

                /**
                 * 保存智能文件夹
                 */
                $scope.saveSmartFolder = function () {
                    alert('接口未实现');
                    return;
                    GKApi.updateSmartFolder($scope.keyword).success(function (data) {
                    }).error(function () {

                        });
                };

            }
        }
    }])

/**
 * 选中人的输入框
 */
    .directive('inputMember', ['GKApi', '$rootScope', function (GKApi, $rootScope) {
        return {
            restrict: 'E',
            replace: true,
            scope: {

            },
            templateUrl: "views/input_member.html",
            link: function (scope, element, attrs) {
                $scope.$watch('tags', function (newValue, oldValue) {
                    if (newValue === oldValue) {
                        return;
                    }
                    GKApi.teamsearch($rootScope.PAGE_CONFIG.mount.org_id, 'test').then(function (data) {

                    });
                });
            }
        }
    }])
    .directive('inputDatepicker', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                isOpen: "@",
                ngModel: '='
            },
            template: '<div class="form-control input-datepicker">'
                + '<input type="text" datepicker-popup="yyyy年M月d日" show-weeks="false" ng-model="ngModel" is-open="false" current-text="今天" toggle-weeks-text="周" clear-text="清空" close-text="关闭"/>'
                //+'<i class="calendar" ng-class="isOpen=true"></i>'
                + '</div>',
            link: function ($scope, $element, $attrs) {
                $scope.isOpen = false;
            }
        }
    }])
    .directive('resize', ['$document', '$window', function ($document, $window) {
        return {
            restrict: 'E',
            replace: true,
            template: '<div class="resize" ng-style="style" ng-class="moving?\'moving\':\'\'"></div>',
            link: function ($scope, $element, $attrs) {
                $scope.moving = false;

                $element.bind('mousedown', function (e) {
                    $scope.$apply(function () {
                        $scope.moving = true;
                        $document.find('body').addClass('resizing');
                        $document.bind('mousemove.resize', function (e) {
                            $scope.$apply(function () {
                                if (e.pageX < 80) {
                                    return false;
                                }
                                if ($scope.moving) {
                                    $scope.style = {
                                        left: e.pageX - 1
                                    }
                                }

                            })

                        })
                    });
                })

                var setPosition = function (width) {
                    if (width < 80) {
                        width = 80;
                    }
                    if ($document.width() - width < 650) {
                        width = $document.width() - 650;
                    }
                    $document.find('.left_sidebar').css('width', width);
                    $document.find('.main').css('left', width);
                    $scope.style = {
                        left: width - 1
                    }
                };

                $document.bind('mouseup', function (e) {
                    $scope.$apply(function () {
                        if ($scope.moving) {
                            setPosition(e.pageX);
                        }
                        $document.find('body').removeClass('resizing');
                        $scope.moving = false;
                        $document.unbind('mouseup.resize');
                    });
                })

                jQuery(window).bind('resize', function () {
                    var max = jQuery(window).width() - 650;
                    if (max < 0) {
                        return;
                    }
                    if ($document.find('.left_sidebar').width() > max) {
                        $scope.style = {
                            left: max - 1
                        }
                        setPosition(max);
                    }
                })

            }
        }
    }])

    .directive('commonRightSidebar', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/common_right_sidebar.html"
        }
    }])
    .directive('filterRightSidebar', [function () {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "views/filter_right_sidebar.html"
        }
    }])

;
