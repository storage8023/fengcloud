/**
 * Created by huangzb on 2014/5/18.
 */

angular.module("gk.window", ["gk.window.tpls", "gk.window.transition","gk.window.ui"]);
angular.module("gk.window.tpls", ["template/gkwindow/backdrop.html","template/gkwindow/window.html"]);
angular.module('gk.window.transition', [])

angular.module('gk.window.ui', ['gk.window.transition'])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
    .factory('gkStackedMap', function () {
        return {
            createNew: function () {
                var stack = [];

                return {
                    add: function (key, value) {
                        stack.push({
                            key: key,
                            value: value
                        });
                    },
                    get: function (key) {
                        for (var i = 0; i < stack.length; i++) {
                            if (key == stack[i].key) {
                                return stack[i];
                            }
                        }
                    },
                    keys: function() {
                        var keys = [];
                        for (var i = 0; i < stack.length; i++) {
                            keys.push(stack[i].key);
                        }
                        return keys;
                    },
                    top: function () {
                        return stack[stack.length - 1];
                    },
                    remove: function (key) {
                        var idx = -1;
                        for (var i = 0; i < stack.length; i++) {
                            if (key == stack[i].key) {
                                idx = i;
                                break;
                            }
                        }
                        return stack.splice(idx, 1)[0];
                    },
                    removeTop: function () {
                        return stack.splice(stack.length - 1, 1)[0];
                    },
                    length: function () {
                        return stack.length;
                    }
                };
            }
        };
    })

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
    .directive('gkWinBackdrop', ['$timeout', function ($timeout) {
        return {
            restrict: 'EA',
            replace: true,
            templateUrl: 'template/gkwindow/backdrop.html',
            link: function (scope) {

                scope.animate = false;

                //trigger CSS transitions
                $timeout(function () {
                    scope.animate = true;
                });
            }
        };
    }])

    .directive('gkWindow', ['gkWinStack', '$timeout', function (gkWinStack, $timeout) {
        return {
            restrict: 'EA',
            scope: {
                index: '@',
                animate: '='
            },
            replace: true,
            transclude: true,
            templateUrl: 'template/gkwindow/window.html',
            link: function (scope, element, attrs) {
                scope.windowClass = attrs.windowClass || '';

                $timeout(function () {
                    // trigger CSS transitions
                    scope.animate = true;
                    // focus a freshly-opened modal
                    element[0].focus();
                });

                scope.close = function (evt) {
                    var modal = gkWinStack.getTop();
                    if (modal && modal.value.backdrop && modal.value.backdrop != 'static' && (evt.target === evt.currentTarget)) {
                        evt.preventDefault();
                        evt.stopPropagation();
                        gkWinStack.dismiss(modal.key, 'backdrop click');
                    }
                };
            }
        };
    }])

    .factory('gkWinStack', ['$transition', '$timeout', '$document', '$compile', '$rootScope', 'gkStackedMap',
        function ($transition, $timeout, $document, $compile, $rootScope, gkStackedMap) {

            var OPENED_MODAL_CLASS = 'modal-open';

            var backdropDomEl, backdropScope;
            var openedWindows = gkStackedMap.createNew();
            var gkWinStack = {};

            function backdropIndex() {
                var topBackdropIndex = -1;
                var opened = openedWindows.keys();
                for (var i = 0; i < opened.length; i++) {
                    if (openedWindows.get(opened[i]).value.backdrop) {
                        topBackdropIndex = i;
                    }
                }
                return topBackdropIndex;
            }

            $rootScope.$watch(backdropIndex, function(newBackdropIndex){
                if (backdropScope) {
                    backdropScope.index = newBackdropIndex;
                }
            });

            function removeModalWindow(gkWindowInstance) {

                var body = $document.find('body').eq(0);
                var modalWindow = openedWindows.get(gkWindowInstance).value;

                //clean up the stack
                openedWindows.remove(gkWindowInstance);

                //remove window DOM element
                removeAfterAnimate(modalWindow.modalDomEl, modalWindow.modalScope, 0, checkRemoveBackdrop);
                body.toggleClass(OPENED_MODAL_CLASS, openedWindows.length() > 0);
            }

            function checkRemoveBackdrop() {
                //remove backdrop if no longer needed
                if (backdropDomEl && backdropIndex() == -1) {
                    var backdropScopeRef = backdropScope;
                    removeAfterAnimate(backdropDomEl, backdropScope, 150, function () {
                        backdropScopeRef.$destroy();
                        backdropScopeRef = null;
                    });
                    backdropDomEl = undefined;
                    backdropScope = undefined;
                }
            }

            function removeAfterAnimate(domEl, scope, emulateTime, done) {
                // Closing animation
                scope.animate = false;

                var transitionEndEventName = $transition.transitionEndEventName;
                if (transitionEndEventName) {
                    // transition out
                    var timeout = $timeout(afterAnimating, emulateTime);

                    domEl.bind(transitionEndEventName, function () {
                        $timeout.cancel(timeout);
                        afterAnimating();
                        scope.$apply();
                    });
                } else {
                    // Ensure this call is async
                    $timeout(afterAnimating, 0);
                }

                function afterAnimating() {
                    if (afterAnimating.done) {
                        return;
                    }
                    afterAnimating.done = true;

                    domEl.remove();
                    if (done) {
                        done();
                    }
                }
            }

            $document.bind('keydown', function (evt) {
                var modal;

                if (evt.which === 27) {
                    modal = openedWindows.top();
                    if (modal && modal.value.keyboard) {
                        $rootScope.$apply(function () {
                            gkWinStack.dismiss(modal.key);
                        });
                    }
                }
            });

            gkWinStack.open = function (gkWindowInstance, modal) {

                openedWindows.add(gkWindowInstance, {
                    deferred: modal.deferred,
                    modalScope: modal.scope,
                    backdrop: modal.backdrop,
                    keyboard: modal.keyboard
                });

                var body = $document.find('body').eq(0),
                    currBackdropIndex = backdropIndex();

                if (currBackdropIndex >= 0 && !backdropDomEl) {
                    backdropScope = $rootScope.$new(true);
                    backdropScope.index = currBackdropIndex;
                    backdropDomEl = $compile('<div gk-win-backdrop></div>')(backdropScope);
                    body.append(backdropDomEl);
                }

                var angularDomEl = angular.element('<div gk-window></div>');
                angularDomEl.attr('window-class', modal.windowClass);
                angularDomEl.attr('index', openedWindows.length() - 1);
                angularDomEl.attr('animate', 'animate');
                angularDomEl.html(modal.content);

                var modalDomEl = $compile(angularDomEl)(modal.scope);
                openedWindows.top().value.modalDomEl = modalDomEl;
                body.append(modalDomEl);
                body.addClass(OPENED_MODAL_CLASS);
            };

            gkWinStack.close = function (gkWindowInstance, result) {
                var modalWindow = openedWindows.get(gkWindowInstance).value;
                if (modalWindow) {
                    modalWindow.deferred.resolve(result);
                    removeModalWindow(gkWindowInstance);
                }
            };

            gkWinStack.dismiss = function (gkWindowInstance, reason) {
                var modalWindow = openedWindows.get(gkWindowInstance).value;
                if (modalWindow) {
                    modalWindow.deferred.reject(reason);
                    removeModalWindow(gkWindowInstance);
                }
            };

            gkWinStack.dismissAll = function (reason) {
                var topModal = this.getTop();
                while (topModal) {
                    this.dismiss(topModal.key, reason);
                    topModal = this.getTop();
                }
            };

            gkWinStack.getTop = function () {
                return openedWindows.top();
            };

            return gkWinStack;
        }])

    .provider('gkWindow', function () {

        var gkWindowProvider = {
            options: {
                backdrop: true, //can be also false or 'static'
                keyboard: true
            },
            $get: ['$injector', '$rootScope', '$q', '$http', '$templateCache', '$controller', 'gkWinStack',
                function ($injector, $rootScope, $q, $http, $templateCache, $controller, gkWinStack) {

                    var gkWindow = {};

                    function getTemplatePromise(options) {
                        return options.template ? $q.when(options.template) :
                            $http.get(options.templateUrl, {cache: $templateCache}).then(function (result) {
                                return result.data;
                            });
                    }

                    function getResolvePromises(resolves) {
                        var promisesArr = [];
                        angular.forEach(resolves, function (value, key) {
                            if (angular.isFunction(value) || angular.isArray(value)) {
                                promisesArr.push($q.when($injector.invoke(value)));
                            }
                        });
                        return promisesArr;
                    }

                    gkWindow.open = function (modalOptions) {

                        var modalResultDeferred = $q.defer();
                        var modalOpenedDeferred = $q.defer();

                        //prepare an instance of a modal to be injected into controllers and returned to a caller
                        var gkWindowInstance = {
                            result: modalResultDeferred.promise,
                            opened: modalOpenedDeferred.promise,
                            close: function (result) {
                                gkWinStack.close(gkWindowInstance, result);
                            },
                            dismiss: function (reason) {
                                gkWinStack.dismiss(gkWindowInstance, reason);
                            }
                        };

                        //merge and clean up options
                        modalOptions = angular.extend({}, gkWindowProvider.options, modalOptions);
                        modalOptions.resolve = modalOptions.resolve || {};

                        //verify options
                        if (!modalOptions.template && !modalOptions.templateUrl) {
                            throw new Error('One of template or templateUrl options is required.');
                        }

                        var templateAndResolvePromise =
                            $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


                        templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {

                            var modalScope = (modalOptions.scope || $rootScope).$new();
                            modalScope.$close = gkWindowInstance.close;
                            modalScope.$dismiss = gkWindowInstance.dismiss;

                            var ctrlInstance, ctrlLocals = {};
                            var resolveIter = 1;

                            //controllers
                            if (modalOptions.controller) {
                                ctrlLocals.$scope = modalScope;
                                ctrlLocals.gkWindowInstance = gkWindowInstance;
                                angular.forEach(modalOptions.resolve, function (value, key) {
                                    ctrlLocals[key] = tplAndVars[resolveIter++];
                                });

                                ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                            }

                            gkWinStack.open(gkWindowInstance, {
                                scope: modalScope,
                                deferred: modalResultDeferred,
                                content: tplAndVars[0],
                                backdrop: modalOptions.backdrop,
                                keyboard: modalOptions.keyboard,
                                windowClass: modalOptions.windowClass
                            });

                        }, function resolveError(reason) {
                            modalResultDeferred.reject(reason);
                        });

                        templateAndResolvePromise.then(function () {
                            modalOpenedDeferred.resolve(true);
                        }, function () {
                            modalOpenedDeferred.reject(false);
                        });

                        return gkWindowInstance;
                    };

                    return gkWindow;
                }]
        };

        return gkWindowProvider;
    });


angular.module("template/gkwindow/backdrop.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/gkwindow/backdrop.html",
        "<div class=\"modal-backdrop  gk_window_backdrop\" ng-class=\"{in: animate} \" ng-style=\"{'z-index': 1040 + index*10}\"></div>");
}]);

angular.module("template/gkwindow/window.html", []).run(["$templateCache", function($templateCache) {
    $templateCache.put("template/gkwindow/window.html",
            "<div tabindex=\"-1\" class=\"modal {{ windowClass }}\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10, display: 'block'}\" ng-click=\"close($event)\">\n" +
            "    <div class=\"modal-dialog\"><div class=\"modal-content\" ng-transclude></div></div>\n" +
            "</div>");
}]);