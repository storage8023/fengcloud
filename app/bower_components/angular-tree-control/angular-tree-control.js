(function ( angular ) {
    'use strict';
    
    angular.module( 'treeControl', [] )
        .directive( 'treecontrol', ['$compile', function( $compile ) {
            /**
             * @param cssClass - the css class
             * @param addClassProperty - should we wrap the class name with class=""
             */
            function classIfDefined(cssClass, addClassProperty) {
                if (cssClass) {
                    if (addClassProperty)
                        return 'class="' + cssClass + '"';
                    else
                        return cssClass;
                }
                else
                    return "";
            }
            
            function ensureDefault(obj, prop, value) {
                if (!obj.hasOwnProperty(prop))
                    obj[prop] = value;
            }
            
            return {
                restrict: 'EA',
                require: "treecontrol",
                transclude: true,
                scope: {
                    treeModel: "=",
                    selectedNode: "=?",
                    onSelection: "&",
                    options: "=?"
                },
                controller: function( $scope ) {
                    $scope.options = $scope.options || {};
                    ensureDefault($scope.options, "nodeChildren", "children");
                    ensureDefault($scope.options, "dirSelectable", "true");
                    ensureDefault($scope.options, "injectClasses", {});
                    ensureDefault($scope.options.injectClasses, "ul", "");
                    ensureDefault($scope.options.injectClasses, "li", "");
                    ensureDefault($scope.options.injectClasses, "iExpanded", "");
                    ensureDefault($scope.options.injectClasses, "iCollapsed", "");
                    ensureDefault($scope.options.injectClasses, "iLeaf", "");
                    ensureDefault($scope.options.injectClasses, "label", "");
                    ensureDefault($scope.options, "equality", function (a, b) {
                        if (a === undefined || b === undefined)
                            return false;
                        a = angular.copy(a); a[$scope.options.nodeChildren] = [];
                        b = angular.copy(b); b[$scope.options.nodeChildren] = [];
                        return angular.equals(a, b);
                    });

                    $scope.expandedNodes = {};

                    $scope.headClass = function(node) {
                        if (!node[$scope.options.nodeChildren] || node[$scope.options.nodeChildren].length === 0)
                            return "tree-leaf"
                        if ($scope.expandedNodes[this.$id])
                            return "tree-expanded";
                        else
                            return "tree-collapsed";
                    };

                    $scope.iBranchClass = function() {
                        if ($scope.expandedNodes[this.$id])
                            return classIfDefined($scope.options.injectClasses.iExpanded);
                        else
                            return classIfDefined($scope.options.injectClasses.iCollapsed);
                    };

                    $scope.nodeExpanded = function() {
                        return !!$scope.expandedNodes[this.$id];
                    };

                    $scope.selectNodeHead = function() {
                        $scope.expandedNodes[this.$id] = ($scope.expandedNodes[this.$id] === undefined ? this.node : undefined);
                    };

                    $scope.selectNodeLabel = function( selectedNode ){
                        if (selectedNode[$scope.options.nodeChildren] && selectedNode[$scope.options.nodeChildren].length > 0 &&
                            !$scope.options.dirSelectable) {
                            this.selectNodeHead();
                        }
                        else {
                            $scope.selectedScope = this.$id;
                            $scope.selectedNode = selectedNode;
                            if ($scope.onSelection)
                                $scope.onSelection({node: selectedNode});
                        }
                    };

                    $scope.selectedClass = function() {
                        return (this.$id == $scope.selectedScope)?"tree-selected":"";
                    };

                    //tree template
                    var template =
                        '<ul '+classIfDefined($scope.options.injectClasses.ul, true)+'>' +
                            '<li ng-repeat="node in node.' + $scope.options.nodeChildren+'" ng-class="headClass(node)" '+classIfDefined($scope.options.injectClasses.li, true)+'>' +
                            '<i class="tree-branch-head" ng-class="iBranchClass()" ng-click="selectNodeHead(node)"></i>' +
                            '<i class="tree-leaf-head '+classIfDefined($scope.options.injectClasses.iLeaf, false)+'"></i>' +
                            '<div class="tree-label '+classIfDefined($scope.options.injectClasses.label, false)+'" ng-class="selectedClass()" ng-click="selectNodeLabel(node)" tree-transclude></div>' +
                            '<treeitem ng-if="nodeExpanded()"></treeitem>' +
                            '</li>' +
                            '</ul>';

                    return {
                        template: $compile(template)
                    }
                },
                compile: function(element, attrs, childTranscludeFn) {
                    return function ( scope, element, attrs, treemodelCntr ) {

                        scope.$watch("treeModel", function updateNodeOnRootScope(newValue) {
                            if (angular.isArray(newValue)) {
                                console.log(angular.isDefined(scope.node) && angular.equals(scope.node[scope.options.nodeChildren], newValue));
                                if (angular.isDefined(scope.node) && angular.equals(scope.node[scope.options.nodeChildren], newValue))
                                    return;
                                scope.node = {};
                                scope.node[scope.options.nodeChildren] = newValue;
                            }
                            else {
                                if (angular.equals(scope.node, newValue))
                                    return;
                                scope.node = newValue;
                            }
                        });

                        //Rendering template for a root node
                        treemodelCntr.template( scope, function(clone) {
                            element.html('').append( clone );
                        });
                        // save the transclude function from compile (which is not bound to a scope as apposed to the one from link)
                        // we can fix this to work with the link transclude function with angular 1.2.6. as for angular 1.2.0 we need
                        // to keep using the compile function
                        scope.$treeTransclude = childTranscludeFn;
                    }
                }
            };
        }])
        .directive("treeitem", function() {
            return {
                restrict: 'E',
                require: "^treecontrol",
                link: function( scope, element, attrs, treemodelCntr) {
                    // Rendering template for the current node
                    treemodelCntr.template(scope, function(clone) {
                        element.html('').append(clone);
                    });
                }
            }
        })
        .directive("treeTransclude", function() {
            return {
                link: function(scope, element, attrs, controller) {
                    angular.forEach(scope.expandedNodes, function (node, id) {
                        if (scope.options.equality(node, scope.node)) {
                            scope.expandedNodes[scope.$id] = scope.node;
                            scope.expandedNodes[id] = undefined;
                        }
                    });

                    if (scope.options.equality(scope.node, scope.selectedNode)) {
                        scope.selectNodeLabel(scope.node);
                    }

                    scope.$treeTransclude(scope, function(clone) {
                        element.empty();
                        element.append(clone);
                    });
                }
            }
        });
})( angular );
