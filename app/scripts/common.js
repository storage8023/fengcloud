'use strict';
angular.module('GKCommon', ['GKCommon.directives', 'GKCommon.services', 'GKCommon.filters']);

/* Directives */
angular.module('GKCommon.directives', [])
    .directive('checkScrollBottoom', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope[attrs.checkScrollBottoom] = false;
                element.on('scroll.checkScrollBottoom', function () {
                    var _self = jQuery(this),
                        scrollH = jQuery.isWindow(this) ? document.body.scrollHeight : element[0].scrollHeight,
                        scrollT = _self.scrollTop();
                    var clientHeight = jQuery.isWindow(this) ? document.documentElement.clientHeight || document.body.clientHeight : this.clientHeight;
                    var realDistance = scrollH - scrollT - clientHeight;
                    if(realDistance<=0){
                        scope[attrs.checkScrollBottoom] = true;
                    }else{
                        scope[attrs.checkScrollBottoom] = false;
                    }
                });
                scope.$on('$destroy', function () {
                    element.off('.checkScrollBottoom');
                })
            }
        }
    }])
    .directive('gkAutocomplete', ['$compile','$document','$position','$timeout',function ($compile,$document,$position,$timeout) {
        var template = '<ul class="dropdown-menu" ng-show="showList" ng-mouseenter="mouseenter=true" ng-mouseleave="mouseenter=false">';
        template += '<li ng-repeat="item in resultList">';
        template += '<a href="javascript:;" ng-click="handleClick($index)" ng-mouseenter="handleMouseenter($index)" ng-class="{\'active\':item.preSelected}"><span ng-bind="item.value"></span></a>';
        template += '</li>';
        template += '</ul>';
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                ngModel: '=',
                gkAutocomplete:'='
            },
            controller:function($scope){
                $scope.resultList = [];
                $scope.preSelectedIndex = -1;


                $scope.preSelect = function(index){
                    if($scope.preSelectedItem){
                        $scope.preSelectedItem.preSelected = false;
                    }
                    if($scope.resultList[$scope.preSelectedIndex]){
                        $scope.resultList[$scope.preSelectedIndex].preSelected = false;
                    }
                    $scope.preSelectedIndex = index;
                    $scope.preSelectedItem = $scope.resultList[index];
                    $scope.preSelectedItem.preSelected = true;
                };

            },
            link: function (scope, element, attrs, ngModelController) {
                var list = [],
                    $body = $document.find('body'),
                    $listElem,
                    watching  = true;;


                scope.showList = false;

                $listElem = $compile(template)(scope).css({
                    'position':'absolute',
                    'display':'block',
                    'top':0,
                    'left':0,
                    'z-index':99,
                    'width':element.outerWidth()
                });
                $body.append($listElem);

                var setPosition = function(){
                    var position,
                        height,
                        ttHeight,
                        ttPosition,
                        buffer = 4;

                    position = $position.offset(element);
                    height = element.outerHeight();
                    ttHeight = $listElem.outerHeight();

                    ttPosition = {
                        top: position.top + height+2,
                        left: position.left
                    }

                    if (ttPosition.top + ttHeight > jQuery(window).height()) {
                        ttPosition.top = position.top - ttHeight-buffer;
                    }
                    $listElem.css(ttPosition);
                };

                var search = function(keyword){
                    var resultList = [];
                    angular.forEach(list,function(item){
                        if(item.value.indexOf(keyword)>=0){
                            resultList.push(item);
                        }
                    });

                    return resultList;
                };

                var show = function(){
                    scope.showList = true;
                    $timeout(function(){
                        setPosition();
                    })
                };

                var hide = function(){
                    scope.showList = false;
                };

                var select = function(index){
                    ngModelController.$setViewValue(scope.resultList[index].value);
                    ngModelController.$render();
                    element.focus();
                };

                scope.$watch('gkAutocomplete',function(val){
                    if(!angular.isArray(val)){
                        return;
                    }
                    scope.resultList = list = val;

                })

                scope.$watch('ngModel',function(val,oldVal){
                    if(!watching ) return;
                    if(val == oldVal) return;
                    scope.resultList = search(val);
                    if(scope.resultList.length){
                        show();
                        $timeout(function(){
                            setPosition();
                        })
                    }else{
                        hide();
                    }

                })

                element.on({
                    'focus.autocomplete':function(){
                        if(!scope.resultList.length) return;
                        $timeout(function(){
                            show();
                        })
                    },
                    'blur.autocomplete':function(event){
                        if(scope.mouseenter) return;
                        scope.$apply(function(){
                            hide();
                        })
                    }
                });

                scope.handleClick = function(){
                  watching = false;
                  select(scope.preSelectedIndex);
                    watching = true;
                    hide();
                };

                scope.handleMouseenter = function(index){
                    scope.preSelect(index);
                };

                var keyMap = {
                    "up": 38,
                    "down": 40,
                    "enter": 13
                };

//                $document.on('click.autocomplete',function(e){
//                    var $target = angular.element(e.target);
//                    if($target.is(element)){
//                        return;
//                    }
//                    scope.$apply(function(){
//                        hide();
//                    })
//                });

                $document.on('keydown.autocomplete',function(event){
                    var keyCode = event.keyCode;
                    switch(keyCode){
                        case keyMap.up:
                            if(scope.preSelectedIndex == 0){
                                scope.preSelect(scope.resultList.length-1);
                            }else{
                                scope.preSelect(--scope.preSelectedIndex);
                            }

                            break;
                        case keyMap.down:
                            if(scope.preSelectedIndex == scope.resultList.length-1){
                                scope.preSelect(0);
                            }else{
                                scope.preSelect(++scope.preSelectedIndex);
                            }
                            break;
                        case keyMap.enter:
                            select(scope.preSelectedIndex)
                            break;
                    }
                })

                scope.$on('$destroy',function(){
                    element.off('.autocomplete');
                    $listElem.remove();
                });
            }
        }
    }])
    .directive('jplayer', [function () {
        return {
            restrict: 'E',
            replace:true,
            template:'<div></div>',
            link: function (scope, element, attrs) {
                attrs.$observe('source',function(){
                    element.jPlayer({
                        ready: function (event) {
                            jQuery(this).jPlayer("setMedia", {
                                mp3:attrs.source
                            });
                        },
                        preload: 'metadata',
                        solution: 'flash',
                        swfPath: "bower_components/jPlayer",
                        supplied: "mp3",
                        wmode: "window",
                        smoothPlayBar: true
                    });
                })

                scope.$on('$destroy',function(){
                    element.jPlayer('destroy');
                })
            }
        }
    }])
    .directive('href', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                element.on('click', function (e) {
                    var href = jQuery.trim(attrs.href);
                    if (href && href.indexOf('#') != 0 && !/^javascript:.*?$/.test(href)) {
                        if (href.indexOf('http') != 0 && href.indexOf('https') != 0) {
                            href = 'http://' + href;
                        }
                        var url = gkClientInterface.getUrl({
                            sso: 0,
                            url: href
                        });
                        gkClientInterface.openUrl(url);
                        e.preventDefault();
                    }
                })
                scope.$on('$destroy', function () {
                    element.off('click');
                })

            }
        }
    }])
    .directive('tipOverPopup', [function () {
        return {
            restrict: 'EA',
            replace: true,
            scope: { title: '@', content: '@', placement: '@', isOpen: '&' },
            templateUrl: 'views/tip_over_popup.html'
        }
    }])
    .directive('tipOver', ['$compile', '$timeout', '$document', '$position', function ($compile, $timeout, $document, $position) {
        var directiveName = 'tip-over',
            startSym = '{{',
            endSym = '}}';
        var template =
            '<' + directiveName + '-popup ' +
                'content="' + startSym + 'tt_content' + endSym + '" ' +
                'placement="' + startSym + 'tt_placement' + endSym + '" ' +
                'is-open="tt_isOpen"' +
                '>' +
                '</' + directiveName + '-popup>';
        return {
            restrict: 'EA',
            scope: true,
            link: function link(scope, element, attrs) {
                var type = 'tipOver',
                    prefix = 'tipOver';
                var tooltip = $compile(template)(scope);
                var $body;
                var popupTimeout;
                var appendToBody = true;
                var hideTimer;

                // By default, the tooltip is not open.
                // TODO add ability to start tooltip opened
                scope.tt_isOpen = false;

                function toggleTooltipBind() {
                    if (!scope.tt_isOpen) {
                        showTooltipBind();
                    } else {
                        hideTooltipBind();
                    }
                }

                // Show the tooltip with delay if specified, otherwise show it immediately
                function showTooltipBind() {
                    if (hideTimer) {
                        $timeout.cancel(hideTimer);
                    }
                    popupTimeout = $timeout(show, 200);
                }

                function hideTooltipBind() {
                    if (hideTimer) {
                        $timeout.cancel(hideTimer);
                        hideTimer = null;
                    }
                    $timeout.cancel(popupTimeout);
                    hideTimer = $timeout(hide, 50);
                }

                // Show the tooltip popup element.
                function show() {
                    var position,
                        ttWidth,
                        ttHeight,
                        ttPosition;

                    // Don't show empty tooltips.
                    if (!scope.tt_content) {
                        return;
                    }

                    // If there is a pending remove transition, we must cancel it, lest the
                    // tooltip be mysteriously removed.


                    // Set the initial positioning.
                    tooltip.css({ top: 0, left: 0, display: 'block' });

                    // Now we add it to the DOM because need some info about it. But it's not
                    // visible yet anyway.
                    if (appendToBody) {
                        $body = $body || $document.find('body');
                        $body.append(tooltip);
                    }

                    // Get the position of the directive element.
                    position = appendToBody ? $position.offset(element) : $position.position(element);

                    // Get the height and width of the tooltip so we can center it.
                    ttWidth = tooltip.prop('offsetWidth');
                    ttHeight = tooltip.prop('offsetHeight');

                    // Calculate the tooltip's top and left coordinates to center it with
                    // this directive.
                    switch (scope.tt_placement) {
                        case 'right':
                            ttPosition = {
                                top: position.top + position.height / 2 - ttHeight / 2,
                                left: position.left + position.width
                            };
                            break;
                        case 'bottom':
                            ttPosition = {
                                top: position.top + position.height,
                                left: position.left + position.width / 2 - ttWidth / 2
                            };
                            break;
                        case 'left':
                            ttPosition = {
                                top: position.top + position.height / 2 - ttHeight / 2,
                                left: position.left - ttWidth
                            };
                            break;
                        default:
                            ttPosition = {
                                top: position.top - ttHeight,
                                left: position.left + position.width / 2 - ttWidth / 2
                            };
                            break;
                    }

                    ttPosition.top += 'px';
                    ttPosition.left += 'px';

                    // Now set the calculated positioning.
                    tooltip.css(ttPosition);

                    // And show the tooltip.
                    scope.tt_isOpen = true;

                    tooltip.on('mouseenter', function () {
                        if (hideTimer) {
                            $timeout.cancel(hideTimer);
                            hideTimer = null;
                        }
                    });

                    tooltip.on('mouseleave', function () {
                        hideTooltipBind();
                    });

                }

                // Hide the tooltip popup element.
                function hide() {
                    // First things first: we don't show it anymore.
                    scope.tt_isOpen = false;

                    //if tooltip is going to be shown after delay, we must cancel this
                    $timeout.cancel(popupTimeout);

                    // And now we remove it from the DOM. However, if we have animation, we
                    // need to wait for it to expire beforehand.
                    tooltip.remove();
                }


                //element.off('mouseenter',showTooltipBind);
                //element.off('mouseleave',hideTooltipBind);
                element.on('mouseenter', showTooltipBind);
                element.on('mouseleave', hideTooltipBind);


                /**
                 * Observe the relevant attributes.
                 */
                attrs.$observe(type, function (val) {
                    scope.tt_content = val;
                });

                attrs.$observe(prefix + 'Placement', function (val) {
                    scope.tt_placement = angular.isDefined(val) ? val : 'top';
                });

                // if a tooltip is attached to <body> we need to remove it on
                // location change as its parent scope will probably not be destroyed
                // by the change.
                if (appendToBody) {
                    scope.$on('$locationChangeSuccess', function closeTooltipOnLocationChangeSuccess() {
                        if (scope.tt_isOpen) {
                            hide();
                        }
                    });
                }

                // Make sure tooltip is destroyed and removed.
                scope.$on('$destroy', function onDestroyTooltip() {
                    $body = null;
                    element.off('mouseenter', showTooltipBind);
                    element.off('mouseleave', hideTooltipBind);
                    tooltip.off('mouseenter').off('mouseleave');
                    if (scope.tt_isOpen) {
                        hide();
                    } else {
                        tooltip.remove();
                    }
                    tooltip = null;
                });
            }
        }
    }])
    .directive('insertTo', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $scope.$watch($attrs['insertTo'],function (input) {
                    if(!input) return;
                    var inputPos
                    var insertPos = $attrs['insertPos'];
                    var val = $scope[$attrs.ngModel];
                    if(jQuery.isNumeric(insertPos)){
                        inputPos = [insertPos,0];
                        //$attrs['insertPos'] = undefined;
                    }else{
                        inputPos = Util.Input.getCurSor($element[0]).split('|');
                    }
                    var isInsert = inputPos[1] != val.length ? 1 : 0;
                    var l = val.substr(0, inputPos[0]);
                    var r = val.substr(inputPos[1], val.length);
                    val = l + input + r;
                    $scope[$attrs.ngModel] = val;
                    var curPos = $attrs.cursorPos;
                    if(!jQuery.isNumeric(curPos)){
                        if(isInsert){
                            curPos =  parseInt(inputPos[0]) + (input).length;
                        }else{
                            curPos =  val.length;
                        }
                    }
                    $timeout(function () {
                        Util.Input.moveCur($element[0],curPos);
                    });
                    $scope[$attrs.insertTo] = '';
                });
            }
        }
    }])
    .directive('focusMe', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                scope.$watch(attrs.focusMe, function (value) {
                    if (value === true) {
                        element[0].focus();
                        scope[attrs.focusMe] = false;
                    }
                });
            }
        };
    })
    .directive('inputGroup', [function () {
        return {
            restrict: 'C',
            link: function ($scope, $element) {
                $element.find('input[type="text"],input[type="password"]').on('focus', function () {
                    $element.addClass('input-group-focus');
                })
                $element.find('input[type="text"],input[type="password"]').on('blur', function () {
                    $element.removeClass('input-group-focus');
                })
            }
        }
    }])
    .directive('avatar', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                gkSrc: '@'
            },
            template: '<img src="images/default_photo.png" error-src="images/default_photo.png" ng-src="{{gkSrc}}" />'
        }
    }])
    .directive('groupPhoto', [function () {
        return {
            restrict: 'E',
            replace: true,

            scope: {
                gkSrc: '@'
            },
            template: '<img src="images/default_group.png" error-src="images/default_group.png" ng-src="{{gkSrc}}" />'
        }
    }])
    .directive('teamLogo', [function () {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                gkSrc: '@'
            },
            template: '<img src="images/default_logo.png" error-src="images/default_logo.png" ng-src="{{gkSrc}}" />'
        }
    }])
    .directive('preventDragDrop', [function () {
        return {
            restrict: 'A',
            link: function ($scope, $element, $attrs) {
                $element.on('dragstart', function (event) {
                    var jTarget = jQuery(event.target);
                    if (!jTarget.attr('draggable') && !jTarget.parents('[draggable]').size()) {
                        event.preventDefault();
                    }
                })
                $element.on('dragover', function (event) {
                    event.preventDefault();
                });
                $element.on('dragenter', function (event) {
                    event.preventDefault();
                });
                $element.on('drop', function (event) {
                    event.preventDefault();
                });
            }
        }
    }])
    .directive('gkOnload', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.gkOnload);
            $element.on('load', function () {
                $scope.$apply(function () {
                    fn($scope, {$event: event});
                });
            })
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
    .directive('errorSrc', [function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                var errorSrc = attrs.errorSrc;
                element.on('error', function () {
                    if (errorSrc) {
                        element.attr('src', attrs.errorSrc);
                    } else {
                        element.css('display', 'none');
                    }

                });
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
    .directive('scrollLoad', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                var triggerDistance = 0;
                var disableScroll = false;
                if (attrs.triggerDistance != null) {
                    $scope.$watch(attrs.triggerDistance, function (value) {
                        return triggerDistance = parseInt(value || 0, 10);
                    });
                }

                if (attrs.disableScroll != null) {
                    $scope.$watch(attrs.disableScroll, function (value) {
                        return disableScroll = !!value;
                    });
                }

                var direction = 'down';
                if (attrs.triggerDirection) {
                    direction = attrs.triggerDirection;
                }
                var startScrollTop = 0;
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
                    realDistance = direction == 'down' ? (scrollH - scrollT - clientHeight) : scrollT;
                    if (realDistance <= triggerDistance && !disableScroll) {
                        if (!isScrollDown && direction == 'up') {
                            if ($rootScope.$$phase) {
                                return $scope.$eval(attrs.scrollLoad);
                            } else {
                                return $scope.$apply(attrs.scrollLoad);
                            }
                        } else if (isScrollDown && direction == 'down') {
                            if ($rootScope.$$phase) {
                                return $scope.$eval(attrs.scrollLoad);
                            } else {
                                return $scope.$apply(attrs.scrollLoad);
                            }
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
    .directive('ngDragend', ['$parse', function ($parse) {
        return function ($scope, $element, $attrs) {
            var fn = $parse($attrs.ngDragend);
            $element.on('dragend', function (event) {
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
            scope: { list: '=', onSelect: '&', 'isOpen': '&'},
            template: '<ul class="dropdown-menu input_tip_list" ng-show="isOpen()">'
                + '<li ng-repeat="item in list"><a  ng-mouseenter="handleMouseEnter($index)" ng-click="handleClick($event,$index)" ng-class="item.selected?\'active\':\'\'" title="{{item.member_name}}" href="javascript:void(0)">{{item.member_name}}</a></li>'
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

                $scope.handleMouseEnter = function ($index) {
                    preSelectItem($index);

                };
                $scope.handleClick = function ($event, $index) {
                    //preSelectItem(key);
                    selectItem();
                    $event.stopPropagation();
                };

                $document.bind('keydown', function (e) {
                    if (!$scope.isOpen()) {
                        return;
                    }
                    $scope.$apply(function () {

                        var key_code = e.keyCode;
                        if (!$scope.list || !$scope.list.length) return;
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
                            var itemHeight = $element.find('li:eq(0)').height();
                            var scrollTop = $element.find('li:eq(' + newIndex + ')').position().top;
                            if (newIndex == 0) {
                                $element.scrollTop(0);
                            } else if (newIndex == ($scope.list.length - 1)) {
                                $element.scrollTop(scrollTop);
                            } else {
                                if (step == -1) {
                                    var jTop = scrollTop;
                                    if (jTop >= -itemHeight && jTop < 0) {
                                        jTop.scrollTop(jTop.scrollTop() + jTop);
                                    }
                                } else {
                                    var jTop = scrollTop - $element.height();
                                    if (jTop >= 0 && jTop < itemHeight) {
                                        $element.scrollTop($element.scrollTop() + itemHeight + jTop);
                                    }
                                }
                            }
                            e.preventDefault();
                        } else if (key_code == 13) {
                            selectItem();
                            e.preventDefault();
                        }
                    });
                })
            }
        };
    }])
    .directive('inputTip', [ '$compile', '$parse', '$document', '$timeout', '$interval', function ($compile, $parse, $document, $timeout, $interval) {
        var template =
            '<input-tip-popup ' +
                'list="it_list" ' +
                'on-select="it_onSelect(item)" ' +
                'is-open="it_isOpen"' +
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
                    $timeout(function () {
                        setPosition();
                        inputtip.css('display', 'block');
                    }, 0);
                };

                var lastQ;
                /**
                 * 隐藏提示框
                 */
                var hide = function () {
                    $scope.it_isOpen = false;
                    lastQ = null;
                };


                $scope.$watch($attrs.ngModel, function (newValue, oldeValue) {
                    if (!newValue && newValue !== oldeValue) {
                        hide();
                    }
                });
                var inputPos, val, lastIndex;

                var checkAt = function () {
                    val = $scope[$attrs.ngModel];
                    var cursor = Util.Input.getCurSor($element[0]);
                    inputPos = cursor.split('|');
                    var leftStr = val.slice(0, inputPos[0]); //截取光标左边的所有字符
                    lastIndex = leftStr.lastIndexOf(watchStr); //获取光标左边字符最后一个@字符的位置
                    if (lastIndex < 0) {
                        hide();
                        return;
                    }
                    var q = leftStr.slice(lastIndex + 1, leftStr.length); //获取@与光标位置之间的字符
                    if (q === lastQ) return;
                    //如果@与光标之间有空格，隐藏提示框
                    if (jQuery.trim(q).length != q.length) {
                        hide();
                        return;
                    }
                    var resultList = [];
                    if (!q.length) {
                        resultList = $scope.remindMembers;
                    } else {
                        if ($scope.remindMembers && $scope.remindMembers.length) {
                            angular.forEach($scope.remindMembers, function (value) {
                                if (value.short_name && value.short_name.toLowerCase().indexOf(q.toLowerCase()) === 0) {
                                    resultList.unshift(value);
                                } else if (value.member_name.toLowerCase().indexOf(q.toLowerCase()) != -1) {
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
                    lastQ = q;
                };

                $scope.it_list = [];
                $scope.it_index = 0;
                var timer;
                $element.bind('focus',function () {
                    if (timer) {
                        $interval.cancel(timer);
                    }
                    timer = $interval(function () {
                        checkAt();
                    }, 100);
                }).bind('blur', function () {
                    if (timer) {
                        $interval.cancel(timer);
                    }
                })

                var insertChar = function (input) {
                    input += ' ';
                    var newVal = $scope[$attrs.ngModel];
                    var newInputPos = inputPos;
                    var isInsert = newInputPos[1] != newVal.length;
                    newVal = newVal.substr(0, lastIndex + 1) + input + newVal.substr(inputPos[1], newVal.length);
                    $scope[$attrs.ngModel] = newVal;
                    $timeout(function () {
                        if (isInsert) {
                            Util.Input.moveCur(elem, parseInt(inputPos[0]) + (input).length);
                        } else {
                            Util.Input.moveCur(elem, $scope[$attrs.ngModel].length);
                        }
                    }, 0)

                };


                $scope.$on('$locationChangeSuccess', function () {
                    if (timer) {
                        $interval.cancel(timer);
                    }
                    if ($scope.it_isOpen) {
                        hide();
                    }
                });

                $scope.$on('$destroy', function () {
                    if (timer) {
                        $interval.cancel(timer);
                    }
                    inputtip.remove();
                    if ($scope.it_isOpen) {
                        hide();
                    }
                });

                $scope.it_onSelect = function (item) {
                    insertChar(item.member_name);
                };
            }
        }
    }])
;
/* Services */
angular.module('GKCommon.services', [])
    .constant('newsKey', 'gkNews')
    .constant('FILE_SORTS', {
        'SORT_SPEC': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf','ai','cdr','psd','dmg','iso','md','ipa','apk'],
        'SORT_MOVIE': ['mp4', 'mkv', 'rm', 'rmvb', 'avi', '3gp', 'flv', 'wmv', 'asf', 'mpeg', 'mpg', 'mov', 'ts', 'm4v'],
        'SORT_MUSIC': ['mp3', 'wma', 'wav', 'flac', 'ape', 'ogg', 'aac', 'm4a'],
        'SORT_IMAGE': ['jpg', 'png', 'jpeg', 'gif', 'psd', 'bmp','ai','cdr'],
        'SORT_DOCUMENT': ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf', 'odt', 'rtf', 'ods', 'csv', 'odp', 'txt'],
        'SORT_CODE': ['js', 'c', 'cpp', 'h', 'cs', 'vb', 'vbs', 'java', 'sql', 'ruby', 'php', 'asp', 'aspx', 'html', 'htm', 'py', 'jsp', 'pl', 'rb', 'm', 'css', 'go', 'xml', 'erl', 'lua', 'md'],
        'SORT_ZIP': ['rar', 'zip', '7z', 'cab', 'tar', 'gz', 'iso'],
        'SORT_EXE': ['exe', 'bat', 'com']
    })
    .factory('GKFrame', ['$window', function ($window) {
        function GKFrame(frameName) {
            if (!$window.frames[frameName]) {
                return;
            }
            return $window.frames[frameName];
        }

        return GKFrame;
    }])
    .factory('GKWindowCom', ['$window', function ($window) {
        var GKWindowCom = {
            post: function (windowName, data) {
                var win = gkClientInterface.getWindow({name: windowName});
                if (!win) return;
                win.postMessage(data, '*');
            },
            message: function (callback) {
                $window.addEventListener('message', callback, false);
            }
        };
        return GKWindowCom;
    }])

    .factory('GKException', [function () {
        var GKException = {
            getAjaxError: function (request, textStatus, errorThrown) {
                var error = {
                    code: 0,
                    msg: '出错了'
                };
                if (request.responseText) {
                    var result = JSON.parse(request.responseText);
                    angular.extend(error, {
                        code: result.error_code,
                        msg: result.error_msg || request.responseText
                    })
                } else {
                    error.code = request.status;
                    if (textStatus === 'timeout') {
                        error.msg = '网络连接超时';
                    } else {
                        switch (request.status) {
                            case 0:
                            case 404:
                                error.msg = '网络未连接或当前网络不支持HTTPS安全连接，请在“设置”中关闭HTTPS安全连接后重试';
                                break;
                            case 401:
                                error.msg = '网络连接超时或当前网络不支持HTTPS安全连接，请在“设置”中关闭HTTPS安全连接后重试';
                                break;
                            case 501:
                            case 502:
                                error.msg = '服务器繁忙, 请稍候重试';
                                break;
                            case 503:
                            case 504:
                                error.msg = '因您的操作太过频繁, 操作已被取消';
                                break;
                            default:
                                error.msg = request.statusText;
                                break;
                        }
                    }
                }
                return error;
            },
            getAjaxErrorMsg: function (request) {
                var errorMsg = '';
                if (request.responseText) {
                    var result = JSON.parse(request.responseText);
                    errorMsg = result.error_msg ? result.error_msg : request.responseText;
                } else {
                    switch (request.status) {
                        case 0:
                        case 404:
                            errorMsg = '网络未连接或当前网络不支持HTTPS安全连接，请在“设置”中关闭HTTPS安全连接后重试';
                            break;
                        case 401:
                            errorMsg = '网络连接超时或当前网络不支持HTTPS安全连接，请在“设置”中关闭HTTPS安全连接后重试';
                            break;
                        case 501:
                        case 502:
                            errorMsg = '服务器繁忙, 请稍候重试';
                            break;
                        case 503:
                        case 504:
                            errorMsg = '因您的操作太过频繁, 操作已被取消';
                            break;
                        default:
                            errorMsg = request.status + ':' + request.statusText;
                            break;
                    }
                }
                return errorMsg;
            },
            getClientErrorMsg: function (error) {
                return error.message;
            },
            getAjaxErroCode: function (request) {
                var code = 0;
                if (request.responseText) {
                    var result = JSON.parse(request.responseText);
                    code = result.error_code || 0;
                } else {
                    code = request.status || 0;
                }
                return code;
            },
            handleClientException: function (error) {
                alert(error.message);
            },
            handleAjaxException: function (request, textStatus, errorThrown) {
                var errorMsg = this.getAjaxError(request, textStatus, errorThrown)['msg'];
                alert(errorMsg);
            }
        };

        return GKException;
    }])
    .factory('GKMount', ['GKPartition',function (GKPartition) {
        /**
         * 格式化mount数据
         * @param mount
         */
        var isMember = function (mount) {
            return mount && true;
        };

        var isAdmin = function (mount) {
            return mount && mount.type < 2;
        };

        var isSuperAdmin = function (mount) {
            return mount && mount.type < 1;
        };

        var formatMountItem = function (mount) {
            var properties = {};
            if (mount.property) {
                properties = JSON.parse(mount.property);
                if (!properties.permissions) {
                    properties.permissions = [];
                }
            }
            var partition = GKPartition.getPartitionByMountType(mount.type,mount.ent_id);
            var newMount = {
                partition:partition,
                mount_id: mount.mountid,
                ent_id: mount.ent_id,
                name: mount.name ? mount.name : '我的文件',
                org_id: mount.orgid,
                capacity: mount.total,
                size: mount.use,
                org_capacity: mount.orgtotal,
                org_size: mount.orguse,
                type: mount.type,
                fullpath: '',
                logo: mount.orgphoto,
                member_count: mount.membercount,
                subscriber_count: mount.subscribecount,
                hasFolder: 1,
                trash_size: mount.size_recycle,
                trash_dateline: mount.dateline_recycle,
                property: properties,
                storage_point: mount.storage_point,
                compare: mount.compare
                //hasFolder:mount.hasfolder||0
            };
            return newMount;
        };
        var getMounts = function () {
            var re = gkClientInterface.getSideTreeList({sidetype: 'org'});
            if (re && re['list']) {
                return re['list'].map(function (mount) {
                    return formatMountItem(mount);
                })
            } else {
                return [];
            }

        };

        var mounts = getMounts();

        var GKMount = {
            refreshMounts: function () {
                mounts = getMounts();
            },
            isMember: isMember,
            isAdmin: isAdmin,
            isSuperAdmin: isSuperAdmin,
            formatMountItem: formatMountItem,
            /**
             * 获取所有的mount
             * @returns {Array}
             */
            getMounts: function () {
                return mounts;
            },
            /**
             * 根据id获取mount
             * @param id
             * @returns {null}
             */
            getMountById: function (id) {
                var mount = null;
                angular.forEach(mounts, function (value) {
                    if (value.mount_id == id) {
                        mount = value;
                        return false;
                    }
                })
                return mount;
            },
            checkMountExsit: function (id) {
                return !!this.getMountById(id);
            },
            /**
             * 根据云库id获取mount
             * @param orgId
             * @returns {null}
             */
            getMountByOrgId: function (orgId) {
                var mount = null;
                angular.forEach(mounts, function (value) {
                    if (value.org_id == orgId) {
                        mount = value;
                        return false;
                    }
                })
                return mount;
            },
            /**
             * 获取个人的mount
             * @returns {null}
             */
            getMyMount: function () {
                var myMount = null;
                angular.forEach(mounts, function (value) {
                    if (value.org_id == 0) {
                        myMount = value;
                        return false;
                    }
                })
                return myMount;n
            },
            /**
             * 获取我的云库的mount
             * @returns {Array}
             */
            getOrgMounts: function () {
                var orgMounts = [];
                angular.forEach(mounts, function (value) {
                    if (!value.ent_id) {
                        orgMounts.push(value);
                    }
                })
                return orgMounts;
            },
            addMount: function (newMount, $scope) {
                var mountItem = formatMountItem(newMount);
                mounts.push(mountItem);
                return mountItem;
            },
            editMount: function (mountId, param) {
                var mount = this.getMountById(mountId);
                if (!mount) {
                    return;
                }
                angular.extend(mount, param);
                return mount;
            },
            removeMountByOrgId: function (orgId) {
                var mount = this.getMountByOrgId(orgId);
                if (mount) {
                    Util.Array.removeByValue(mounts, mount);
                }
                return mount;
            },
            removeOrgSubscribeList: function ($scope, orgId) {
                var mount = this.removeMountByOrgId(orgId);
                if (!mount) return;
                angular.forEach($scope.orgSubscribeList, function (value, key) {
                    if (value.data.org_id == orgId) {
                        $scope.orgSubscribeList.splice(key, 1);
                        return false;
                    }
                });
            },
            removeEntFileList: function ($scope, orgId, entId) {
                var mount = this.removeMountByOrgId(orgId);
                if (!mount) return;
                if (!$scope.entTreeList[entId]) return;
                var list = $scope.entTreeList[entId].data;
                angular.forEach(list, function (value, key) {
                    if (value.data.org_id == orgId) {
                        list.splice(key, 1);
                        return false;
                    }
                });

                angular.forEach($scope.allTreeList, function (value, key) {
                     if (value.data.org_id == orgId){
                         $scope.allTreeList.splice(key, 1);
                        return false;
                    }
                });
            },
            removeTeamList: function ($scope, orgId) {
                var mount = this.removeMountByOrgId(orgId);
                if (!mount) return;
                angular.forEach($scope.orgTreeList, function (value, key) {
                    if (value.data.org_id == orgId) {
                        $scope.orgTreeList.splice(key, 1);
                        return false;
                    }
                });
                angular.forEach($scope.allTreeList, function (value, key) {
                    if (value.data.org_id == orgId) {
                        $scope.allTreeList.splice(key, 1);
                        return false;
                    }
                });

            },
            removeJoinTeamList: function ($scope, orgId) {
                var mount = this.removeMountByOrgId(orgId);
                if (!mount) return;
                angular.forEach($scope.joinOrgTreeList, function (value, key) {
                    if (value.data.org_id == orgId) {
                        $scope.joinOrgTreeList.splice(key, 1);
                        return false;
                    }
                });
            }
        };

        return GKMount;

    }
    ])
    .factory('GKDialog', [function () {
        return {
            chat: function (mountId, fullpath, atMember) {
                mountId = angular.isDefined(mountId) ? mountId : 0;
                fullpath = angular.isDefined(fullpath) ? fullpath : '';
                atMember = angular.isDefined(atMember) ? atMember : '';
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/chat.html#/?mountid=' + mountId + '&fullpath=' + encodeURIComponent(fullpath) + '&at=' + encodeURIComponent(atMember);
                var data = {
                    url: url,
                    type: 'single',
                    width: 900,
                    resize: 1,
                    height: 580
                };
                gkClientInterface.setMain(data);
            },
            /**
             * 打开设置框
             */
            openSetting: function (tab) {
                tab = angular.isDefined(tab) ? tab : '';
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/setting.html#/?tab=' + tab;
                var data = {
                    url: url,
                    type: "sole",
                    width: 794,
                    resize: 0,
                    height: 490
                }
                gkClientInterface.setMain(data);
            },
            /**
             * 打开传输列表
             */
            openTransfer: function () {
                var UIPath = gkClientInterface.getUIPath();
                var url = 'file:///' + UIPath + '/transfer.html';
                var data = {
                    url: url,
                    type: "sole",
                    width: 794,
                    height: 490,
                    resize: 0
                }
                gkClientInterface.setMain(data);
            },
            openUrl: function (url, param) {
                if (!url) return;
                var defaultParam = {
                    type: "sole",
                    width: 794,
                    height: 490,
                    resize: 1
                };
                var param = angular.extend({}, defaultParam, param);
                param.url = url;
                gkClientInterface.setMain(param);
            }
        }
    }
    ])
    .factory('GKAuth', [function () {
        var GKAuth = {
            getPermissions:function(mount){
                var permissions;
                if(mount && !jQuery.isEmptyObject(mount)){
                    permissions =mount.property?mount.property.permissions || []:[];
                }else{
                    permissions = [];
                }
                return permissions;
            },
            check:function(mount,partition){
                var auths = Array.prototype.slice.call(arguments).slice(2);
                var hasAuth = true;
                var permissions = this.getPermissions(mount,partition);
                for(var i=0;i<auths.length;i++){
                    if(permissions.indexOf(auths[i])<0){
                        hasAuth = false;
                        break;
                    }
                }
                return hasAuth;
            }
        };
        return GKAuth;
    }])
    .factory('GKApi', ['$http', function ($http) {
        $http.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded";
        var defaultParams = {};
        var GKApi = {
            sendValidEmail:function(email){
                var params = {
                    token: gkClientInterface.getToken(),
                    email: email
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/resend_mail',
                    dataType: 'json',
                    data: params
                })
            },
            getAppKey: function (orgId, appId) {
                var params = {
                    token: gkClientInterface.getToken(),
                    org_id: orgId,
                    a_id: appId
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/generate_request_key',
                    dataType: 'json',
                    data: params
                })
            },
            apps: function (orgId) {
                var params = {
                    token: gkClientInterface.getToken(),
                    org_id: orgId
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/apps',
                    dataType: 'json',
                    data: params
                })
            },
            dragUpload: function (mountId, fullpath) {
                var params = {
                    token: gkClientInterface.getToken(),
                    mount_id: mountId,
                    fullpath: fullpath
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/drag_upload',
                    dataType: 'json',
                    data: params
                })
            },
            resetMessage: function (ids) {
                var params = {
                    token: gkClientInterface.getToken(),
                    ids: ids
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/updates/get_updates',
                    dataType: 'json',
                    data: params
                })
            },
            delCompletely: function (mount_id, fullpaths) {
                var params = {
                    mount_id: mount_id,
                    fullpaths: fullpaths,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/del_completely',
                    dataType: 'json',
                    data: params
                })
            },
            clear: function (mount_id) {
                var params = {
                    mount_id: mount_id,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/clear',
                    dataType: 'json',
                    data: params
                })
            },
            recycle: function (mount_id, fullpath) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/recycle',
                    dataType: 'json',
                    data: params
                })
            },
            info: function (mount_id, fullpath, extParam) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    token: gkClientInterface.getToken()
                };
                if (extParam && typeof extParam == 'object') {
                    angular.extend(params, extParam);
                }
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/info',
                    dataType: 'json',
                    data: params
                })
            },
            pendingMembers: function (orgId) {
                var params = {
                    org_id: orgId,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/pending_members',
                    dataType: 'json',
                    data: params
                })
            },
            subscriberList: function (orgId, start, limit) {
                var params = {
                    org_id: orgId,
                    start: start,
                    limit: limit,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/subscribe_member',
                    dataType: 'json',
                    data: params
                })
            },
            publish: function (mountId, fullpath,deadline) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    deadline:deadline,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/get_file_link',
                    dataType: 'json',
                    data: params
                })
            },
            markMilestone: function (mountId, fullpath, message,isSendToChat) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    message: message,
                    chat:isSendToChat,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/milestone_chat_tag',
                    dataType: 'json',
                    data: params
                })
            },
            editPassword: function (oldPassword, newPassword) {
                var params = {
                    password: oldPassword,
                    newpassword: newPassword,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/set_password',
                    dataType: 'json',
                    data: params
                })
            },
            mounts: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/account/mount',
                    dataType: 'json',
                    data: params
                })
            },
            addToFav: function (mountId, fullpath, type) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    favorite_type: type,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/favorites_add',
                    dataType: 'json',
                    data: params
                })
            },
            removeFromFav: function (mountId, fullpath, type) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    favorite_type: type,
                    token: gkClientInterface.getToken()
                };
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/favorites_delete',
                    dataType: 'json',
                    data: params
                })
            },
            delCollaboration: function (mountId, fullpath, collaboration) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    collaboration: collaboration,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: gkClientInterface.getApiHost() + '/1/file/delete_collaboration',
                    data: params
                });
            },
            userInfo: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/account/info',
                    data: params
                });
            },
            regist: function (name, email, password, user_license_check) {
                var params = {
                    name: name,
                    email: email,
                    password: password,
                    user_license_chk: user_license_check,
                    disable_next_login: 1,
                    token: gkClientInterface.getToken()
                };
                return jQuery.ajax({
                    type: 'POST',
                    dataType: 'json',
                    url: gkClientInterface.getSiteDomain() + '/account/regist_submit',
                    data: jQuery.param(params)
                });
            },
            getSmartFolder: function (code) {
                var params = {
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    method: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/search_condition',
                    data: params
                });
            },
            removeSmartFolder: function (code) {
                var params = {
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/remove_search',
                    data: params
                })
            },
            updateSmartFolder: function (code, name, condition, description) {
                var params = {
                    code: code,
                    name: name,
                    condition: condition,
                    description: description || '',
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/edit_search',
                    data: params
                })
            },
            createSmartFolder: function (mount_id, name, condition, description) {
                var params = {
                    mount_id: mount_id,
                    name: name,
                    condition: condition,
                    description: description || '',
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/save_search',
                    data: params
                })
            },
            searchFile: function (condition, mount_id) {
                var params = {
                    mount_id: mount_id,
                    condition: condition,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/search',
                    data: params
                });
            },
            smartFolderList: function (code) {
                var params = {
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/search',
                    data: params
                });
            },
            starFileList: function (type) {
                var params = {
                    favorite_type: type,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/favorites',
                    data: params
                });
            },
            recentVisitList: function () {
                var params = {
                    size: 100,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/recent_modified',
                    data: params
                });
            },
            recentFileList: function () {
                var params = {
                    size: 100,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/recent_modified',
                    data: params
                });
            },
            inboxFileList: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/inbox',
                    data: params
                });
            },
            setTag: function (mount_id, fullpath, keyword) {
                var params = {
                    mount_id: mount_id,
                    fullpath: fullpath,
                    keywords: keyword,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/file/keyword',
                    data: params,
                    dataType: 'text'
                });
            },
            update: function (size, dateline) {
                size = angular.isDefined(size) ? size : 100;
                var params = {
                    size: size,
                    token: gkClientInterface.getToken()
                };
                if (angular.isDefined(dateline)) {
                    params['dateline'] = dateline;
                }
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/updates/ls',
                    data: params
                });
            },
            newUpdate: function (dateline) {
                var params = {
                    dateline: dateline || 0,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/updates/ls_newer',
                    data: params
                });
            },
            updateAct: function (id, opt) {
                var params = {
                    id: id,
                    opt: opt,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/updates/do_action',
                    data: params
                });
            },
            teamInvitePending: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/invite_pending',
                    data: params
                });
            },
            teamManage: function (data) {
                var params = {
                    org_id: data,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/updates/',
                    data: params
                });
            },
            teamQuit: function (org_id) {
                var params = {
                    org_id: org_id,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/team/quit',
                    data: params
                });
            },
            teamInviteReject: function (orgId, code) {
                var params = {
                    org_id: orgId,
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/team/invite_reject',
                    data: params
                });
            },
            teamInviteJoin: function (orgId, code) {
                var params = {
                    org_id: orgId,
                    code: code,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/team/invite_accept',
                    data: params
                });
            },
            teamGroupsMembers: function (orgId) {
                var params = {
                    org_id: orgId,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    async: false,
                    dataType: 'json',
                    url: gkClientInterface.getApiHost() + '/1/team/groups_and_members',
                    data: params
                });
            },
            groupMember: function (data) {
                var params = {
                    org_id: data,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/group_member',
                    data: params
                });
            },
            teamsearch: function (org_id, keyword) {
                var params = {
                    org_id: org_id,
                    key: keyword,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/team/search',
                    data: params

                });
            },
            /**
             * 获取设备列表
             * @returns {*}
             */
            devicelist: function () {
                var params = {
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/device_list',
                    data: params

                });
            },
            /**
             * 启用禁止设备
             * @returns {*}
             */
            toggleDevice: function (device_id, state) {
                var params = {
                    state: state,
                    device_id: device_id,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/toggle_device',
                    data: params
                });
            },
            /**
             * 删除设备
             * @returns {*}
             */
            delDevice: function (device_id) {
                var params = {
                    device_id: device_id,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/del_device',
                    data: params
                });
            },
            disableNewDevice: function (state) {
                var params = {
                    state: state,
                    token: gkClientInterface.getToken()
                };
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/disable_new_device',
                    data: params
                });
            },
            list: function (mountId, fullpath, start, size, dir) {
                var params = {
                    mount_id: mountId,
                    fullpath: fullpath,
                    start: start || 0,
                    size: size || 0,
                    token: gkClientInterface.getToken(),
                };
                if (angular.isDefined(dir)) {
                    params.dir = dir;
                }
                angular.extend(params, defaultParams);
                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'GET',
                    url: gkClientInterface.getApiHost() + '/1/file/ls',
                    data: params
                });
            },
            servers: function (type) {
                var params = {
                    type: type,
                    token: gkClientInterface.getToken()
                };

                var sign = gkClientInterface.getApiAuthorization(params);
                params.sign = sign;
                return jQuery.ajax({
                    type: 'POST',
                    url: gkClientInterface.getApiHost() + '/1/account/servers',
                    dataType: 'json',
                    data: params
                });
            }
        }
        return GKApi;
    }])
    .factory('GKI18n',['gettextCatalog',function(gettextCatalog){
        return{
            getText: function (strText) {
                return gettextCatalog.getString(strText)
            },
            getReplaceText:function(strText,replaceStrArr){
                return gettextCatalog.getString(strText,replaceStrArr)
            }
        }
    }])
;
angular.module('GKCommon.filters', [])
    .filter('strLen', function () {
        return function (str) {
            return Util.String.strLen(str);
        }
    })
    .filter('limitSize', function () {
        return function (input, start, size) {
            if (!angular.isArray(input)) return input;
            if (size < 0) return;

            start = parseInt(start);
            size = parseInt(size)

            var out = [], i, n, absStart, len = input.length;
            absStart = Math.abs(start >= 0 ? start : start + 1);
            if (absStart + size > input.length) {
                size = input.length - absStart;
            }
            if (start < 0) {
                for (i = len + start; i > len + start - size; i--) {
                    out.unshift(input[i]);
                }
            } else {
                for (i = start; i < start + size; i++) {
                    out.push(input[i]);
                }
            }
            return out;
        }
    })
    .filter('orderObjectBy', function () {
        return function (input, attribute) {
            if (!angular.isObject(input)) return input;
            var array = [];
            for (var objectKey in input) {
                array.push(input[objectKey]);
            }

            array.sort(function (a, b) {
                a = parseInt(a[attribute]);
                b = parseInt(b[attribute]);
                return a - b;
            });
            return array;
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
                dateText = '今天，' +$filter('date')(dateline, 'HH:mm');
            } else if (date == yesterday) {
                dateText = '昨天，' + $filter('date')(dateline, 'HH:mm');
            } else {
                dateText = $filter('date')(dateline, 'yyyy年M月d日');
            }
            return dateText;
        }
    })
    .filter('timeAgo', function ($filter) {
        return function (dateline) {
            var now = new Date().valueOf();
            var today = $filter('date')(now, 'yyyy-MM-dd');
            var yesterdayTimestamp = now - 24 * 3600 * 1000;
            var yesterday = $filter('date')(yesterdayTimestamp, 'yyyy-MM-dd');
            var date = $filter('date')(dateline, 'yyyy-MM-dd');
            var dateText = '';
            if (date == today) {
                dateText = '今天，'+ $filter('date')(dateline, 'HH:mm');
            } else if (date == yesterday) {
                dateText = '昨天，' + $filter('date')(dateline, 'HH:mm');
            } else {
                dateText = $filter('date')(dateline, 'yyyy年M月d日 HH:mm');
            }
            return dateText;
        }
    })
    .filter('getAvatarUrl', ['$rootScope',function ($rootScope) {
        var siteDomain = $rootScope && $rootScope.siteDomain ? $rootScope.siteDomain : gkClientInterface.getSiteDomain();
        return function (memberId, isThumb, isUsername) {
            if (memberId == 0) {
                return 'images/unknow_photo.png';
            }
            isUsername = angular.isDefined(isUsername) ? isUsername : false;
            isThumb = angular.isDefined(isThumb) ? isThumb : 1;
            if (isUsername) {
                return siteDomain + '/index/avatar?name=' + memberId + '&thumb=' + isThumb;
            } else {
                return siteDomain + '/index/avatar?id=' + memberId + '&thumb=' + isThumb;
            }

        }
    }])
    .filter('formatFileSize', function () {
        return function (filesize, dir) {
            return dir == 1 ? '-' : Util.Number.bitSize(filesize);
        }
    })
    .filter('bitSize', function () {
        return Util.Number.bitSize;
    })
    .filter('baseName', function () {
        return Util.String.baseName;
    })
    .filter('getPercent', function () {
        return function (val, total) {
            return Math.round(val / total * 100) + '%';
        }
    })
    .filter('getFileIconSuffix', ['FILE_SORTS', function (FILE_SORTS) {
        return function (filename, dir, share, sync) {
            var suffix = '';
            var sorts = FILE_SORTS;
            if (dir == 1) {
                suffix = 'folder';
                if (sync == 1) {
                    suffix = 'sync_' + suffix;
                }
                if (share > 0) {
                    suffix = 'shared_' + suffix;
                }
            } else {
                var ext = Util.String.getExt(filename);
                if (jQuery.inArray(ext, sorts['SORT_SPEC']) > -1) {
                    suffix = ext;
                } else if (jQuery.inArray(ext, sorts['SORT_MOVIE']) > -1) {
                    suffix = 'movie';
                } else if (jQuery.inArray(ext, sorts['SORT_MUSIC']) > -1) {
                    suffix = 'music';
                } else if (jQuery.inArray(ext, sorts['SORT_IMAGE']) > -1) {
                    suffix = 'image';
                } else if (jQuery.inArray(ext, sorts['SORT_DOCUMENT']) > -1) {
                    suffix = 'document';
                } else if (jQuery.inArray(ext, sorts['SORT_ZIP']) > -1) {
                    suffix = 'compress';
                } else if (jQuery.inArray(ext, sorts['SORT_EXE']) > -1) {
                    suffix = 'execute';
                } else {
                    suffix = 'other';
                }
            }
            return suffix;
        }
    }])
    .filter('getThumbUrl', ['$rootScope',function ($rootScope) {
        var siteDomain = $rootScope && $rootScope.siteDomain ? $rootScope.siteDomain : gkClientInterface.getSiteDomain();
        return function (hash, filehash) {
            return siteDomain + '/index/thumb?hash=' + hash + '&filehash=' + filehash;
        }
    }])
    .filter('getFileIcon', ['$filter', function ($filter) {
        return function (filename, dir, share, sync) {
            return 'icon_' + $filter('getFileIconSuffix')(filename, dir, share, sync);
        }
    }])
    .filter('getFileThumb', ['$filter', function ($filter) {
        return function (filename, dir, share, sync) {
            return 'images/icon/' + $filter('getFileIconSuffix')(filename, dir, share, sync) + '128x128.png';
        }
    }])
    .filter('formatCount', [function () {
        return function (count, max) {
            max = angular.isDefined(max) ? max : 99;
            if (count > max) {
                return max + '+';
            } else {
                return count;
            }
        }
    }])
    .directive('sizeAdjust', ['$timeout', '$window', function ($timeout, $window) {
        return {
            require: 'ngModel',
            restrict: 'A, C',
            link: function (scope, element, attrs, ngModel) {

                // cache a reference to the DOM element
                var ta = element[0],
                    $ta = element;

                // ensure the element is a textarea, and browser is capable
                if (ta.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
                    return;
                }

                // set these properties before measuring dimensions
                $ta.css({
                    'overflow': 'hidden',
                    'overflow-y': 'hidden',
                    'word-wrap': 'break-word'
                });

                // force text reflow
                var text = ta.value;
                ta.value = '';
                ta.value = text;

                var appendText = attrs.sizeAdjust,
                    append = appendText === '\\n' ? '\n' : appendText,
                    $win = angular.element($window),
                    mirrorStyle = 'position: absolute; top: -999px; right: auto; bottom: auto; left: 0 ;' +
                        'overflow: hidden; -webkit-box-sizing: content-box;' +
                        '-moz-box-sizing: content-box; box-sizing: content-box;' +
                        'min-height: 0 !important; height: 0 !important; padding: 0;' +
                        'word-wrap: break-word; border: 0;',
                    $mirror = angular.element('<textarea tabindex="-1" ' +
                        'style="' + mirrorStyle + '"/>').data('elastic', true),
                    mirror = $mirror[0],
                    taStyle = getComputedStyle(ta),
                    resize = taStyle.getPropertyValue('resize'),
                    borderBox = taStyle.getPropertyValue('box-sizing') === 'border-box' ||
                        taStyle.getPropertyValue('-moz-box-sizing') === 'border-box' ||
                        taStyle.getPropertyValue('-webkit-box-sizing') === 'border-box',
                    boxOuter = !borderBox ? {width: 0, height: 0} : {
                        width: parseInt(taStyle.getPropertyValue('border-right-width'), 10) +
                            parseInt(taStyle.getPropertyValue('padding-right'), 10) +
                            parseInt(taStyle.getPropertyValue('padding-left'), 10) +
                            parseInt(taStyle.getPropertyValue('border-left-width'), 10),
                        height: parseInt(taStyle.getPropertyValue('border-top-width'), 10) +
                            parseInt(taStyle.getPropertyValue('padding-top'), 10) +
                            parseInt(taStyle.getPropertyValue('padding-bottom'), 10) +
                            parseInt(taStyle.getPropertyValue('border-bottom-width'), 10)
                    },
                    minHeightValue = parseInt(taStyle.getPropertyValue('min-height'), 10),
                    heightValue = parseInt(taStyle.getPropertyValue('height'), 10),
                    minHeight = Math.max(minHeightValue, heightValue) - boxOuter.height,
                    maxHeight = parseInt(taStyle.getPropertyValue('max-height'), 10),
                    mirrored,
                    active,
                    copyStyle = ['font-family',
                        'font-size',
                        'font-weight',
                        'font-style',
                        'letter-spacing',
                        'line-height',
                        'text-transform',
                        'word-spacing',
                        'text-indent'];

                // exit if elastic already applied (or is the mirror element)
                if ($ta.data('elastic')) {
                    return;
                }

                // Opera returns max-height of -1 if not set
                maxHeight = maxHeight && maxHeight > 0 ? maxHeight : 9e4;

                // append mirror to the DOM
                if (mirror.parentNode !== document.body) {
                    angular.element(document.body).append(mirror);
                }

                // set resize and apply elastic
                $ta.css({
                    'resize': (resize === 'none' || resize === 'vertical') ? 'none' : 'horizontal'
                }).data('elastic', true);

                /*
                 * methods
                 */

                function initMirror() {
                    mirrored = ta;
                    // copy the essential styles from the textarea to the mirror
                    taStyle = getComputedStyle(ta);
                    angular.forEach(copyStyle, function (val) {
                        mirrorStyle += val + ':' + taStyle.getPropertyValue(val) + ';';
                    });
                    mirror.setAttribute('style', mirrorStyle);
                }

                function adjust() {
                    var taHeight,
                        mirrorHeight,
                        width,
                        overflow;

                    if (mirrored !== ta) {
                        initMirror();
                    }

                    // active flag prevents actions in function from calling adjust again
                    if (!active) {
                        active = true;

                        mirror.value = ta.value + append; // optional whitespace to improve animation
                        mirror.style.overflowY = ta.style.overflowY;

                        taHeight = ta.style.height === '' ? 'auto' : parseInt(ta.style.height, 10);

                        // update mirror width in case the textarea width has changed
                        width = parseInt(getComputedStyle(ta).getPropertyValue('width'), 10) - boxOuter.width;
                        mirror.style.width = width + 'px';

                        mirrorHeight = mirror.scrollHeight;

                        if (mirrorHeight > maxHeight) {
                            mirrorHeight = maxHeight;
                            overflow = 'scroll';
                        } else if (mirrorHeight < minHeight) {
                            mirrorHeight = minHeight;
                        }
                        mirrorHeight += boxOuter.height;

                        ta.style.overflowY = overflow || 'hidden';

                        if (taHeight !== mirrorHeight) {
                            ta.style.height = mirrorHeight + 'px';
                            scope.$emit('elastic:resize', $ta);
                        }

                        // small delay to prevent an infinite loop
                        $timeout(function () {
                            active = false;
                        }, 1);

                    }
                }

                function forceAdjust() {
                    active = false;
                    adjust();
                }

                /*
                 * initialise
                 */

                // listen
                if ('onpropertychange' in ta && 'oninput' in ta) {
                    // IE9
                    ta['oninput'] = ta.onkeyup = adjust;
                } else {
                    ta['oninput'] = adjust;
                }

                $win.bind('resize', forceAdjust);

                scope.$watch(function () {
                    return ngModel.$modelValue;
                }, function (newValue) {
                    forceAdjust();
                });

                $timeout(adjust);

                /*
                 * destroy
                 */

                scope.$on('$destroy', function () {
                    $mirror.remove();
                    $win.unbind('resize', forceAdjust);
                });
            }
        };

    }]);
;


/**
 * 客户端的回调
 * @param name
 * @param params
 */
var gkClientCallback = function (name, param) {
    console.log('gkClientCallback', arguments);
    if (typeof name !== 'string') {
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    var JSONparam;
    if (param) {
        JSONparam = JSON.parse(param);
    }
    rootScope.$broadcast(name, JSONparam);
};

/**
 * 网站的回调
 * @param name
 * @param params
 */
var gkSiteCallback = function (name, params) {
    console.log('gkSiteCallback', arguments);
    if (typeof name !== 'string') {
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    rootScope.$broadcast(name, params);
};

var gkFrameCallback = function (name, params) {
    console.log('gkFrameCallback', arguments);
    if (typeof name !== 'string') {
        name = String(name);
    }
    var rootScope = jQuery(document).scope();
    rootScope.$broadcast(name, params);
};


// 获取一个元素的所有css属性的patch, $(el).css()
jQuery.fn.css2 = jQuery.fn.css;
jQuery.fn.css = function () {
    if (arguments.length) return jQuery.fn.css2.apply(this, arguments);
    var attr = ['font-family', 'font-size', 'font-weight', 'font-style', 'color',
        'text-transform', 'text-decoration', 'letter-spacing', 'box-shadow',
        'line-height', 'text-align', 'vertical-align', 'direction', 'background-color',
        'background-image', 'background-repeat', 'background-position',
        'background-attachment', 'opacity', 'width', 'height', 'top', 'right', 'bottom',
        'left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border-top-width', 'border-right-width', 'border-bottom-width',
        'border-left-width', 'border-top-color', 'border-right-color',
        'border-bottom-color', 'border-left-color', 'border-top-style',
        'border-right-style', 'border-bottom-style', 'border-left-style', 'position',
        'display', 'visibility', 'z-index', 'overflow-x', 'overflow-y', 'white-space',
        'clip', 'float', 'clear', 'cursor', 'list-style-image', 'list-style-position',
        'list-style-type', 'marker-offset'];
    var len = attr.length, obj = {};
    for (var i = 0; i < len; i++)
        obj[attr[i]] = jQuery.fn.css2.call(this, attr[i]);
    return obj;
};


CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius, fill, stroke) {
    if (typeof stroke == "undefined") {
        stroke = true;
    }
    if (typeof radius === "undefined") {
        radius = 5;
    }
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
    if (stroke) {
        this.stroke();
    }
    if (fill) {
        this.fill();
    }
};