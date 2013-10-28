﻿var module;

module = angular.module('contactSlideTree', []);

module.directive('contactslideTree', function($timeout) {
    return {
        restrict: 'E',
        templateUrl: 'tree_template.html',
        scope: {
            treeData: '=',
            onSelect: '&',
            initialSelection: '=',
            onExpand: '&'
        },
        link: function(scope, element, attrs) {
            var expand_level, for_each_branch, on_treeData_change, select_branch, selected_branch,expand_branch;
            if (attrs.iconExpand == null) {
                attrs.iconExpand = 'icon-plus';
            }
            if (attrs.iconCollapse == null) {
                attrs.iconCollapse = 'icon-minus';
            }
            if (attrs.iconLeaf == null) {
                attrs.iconLeaf = 'icon-chevron-right';
            }
            if (attrs.expandLevel == null) {
                attrs.expandLevel = '3';
            }
            expand_level = parseInt(attrs.expandLevel, 10);
            scope.header = attrs.header;
            if (!scope.treeData) {
                alert('no treeData defined for the tree!');
            }
            if (scope.treeData.length == null) {
                if (treeData.label != null) {
                    scope.treeData = [treeData];
                } else {
                    alert('treeData should be an array of root branches');
                }
            }
            for_each_branch = function(f) {
                var do_f, root_branch, _i, _len, _ref, _results;
                do_f = function(branch, level) {
                    var child, _i, _len, _ref, _results;
                    f(branch, level);
                    if (branch.children != null) {
                        _ref = branch.children;
                        _results = [];
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            child = _ref[_i];
                            _results.push(do_f(child, level + 1));
                        }
                        return _results;
                    }
                };
                _ref = scope.treeData;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    root_branch = _ref[_i];
                    _results.push(do_f(root_branch, 1));
                }
                return _results;
            };
            for_each_branch(function(b, level) {
                b.level = level;
                //return b.expanded = b.level < expand_level;
                return b.expanded = b.children !== undefined;
            });
            selected_branch = null;
            select_branch = function(branch) {
                if (branch !== selected_branch) {
                    if (selected_branch != null) {
                        selected_branch.selected = false;
                    }
                    branch.selected = true;
                    selected_branch = branch;
                    if (branch.onSelect != null) {
                        return $timeout(function() {
                            return branch.onSelect(branch);
                        });
                    } else {
                        if (scope.onSelect != null) {
                            return $timeout(function() {
                                return scope.onSelect({
                                    branch: branch
                                });
                            });
                        }
                    }
                }
            };
            expand_branch = function(branch){
                //console.log(branch);return;
                branch.expanded = !branch.expanded;
                if (branch.onExpand != null) {
                    return $timeout(function() {
                        return branch.onExpand(branch);
                    });
                } else {
                    if (scope.onExpand != null) {
                        return $timeout(function() {
                            return scope.onExpand({
                                branch: branch
                            });
                        });
                    }
                }
            }
            scope.clicks_branch = function($event,branch) {
                if(!angular.element($event.target).hasClass('tree-icon')){
                    if (branch !== selected_branch) {
                        return select_branch(branch);
                    }
                }else{
                    return expand_branch(branch);
                }

            };
            scope.dblclicks_branch = function(branch){
                expand_branch(branch);
                select_branch(branch);
            }
            scope.tree_rows = [];
            on_treeData_change = function() {
                var add_branch_to_list, root_branch, _i, _len, _ref, _results;
                scope.tree_rows = [];
                for_each_branch(function(branch) {
                    if (branch.children) {
                        if (branch.children.length > 0) {
                            return branch.children = branch.children.map(function(e) {
                                if (typeof e === 'string') {
                                    return {
                                        label: e,
                                        children: []
                                    };
                                } else {
                                    return e;
                                }
                            });
                        }
                    } else {
                        return branch.children = [];
                    }
                });
                for_each_branch(function(b, level) {
                    if (!b.uid) {
                        return b.uid = "" + Math.random();
                    }
                });
                add_branch_to_list = function(level, branch, visible) {
                    var child, child_visible, tree_icon, _i, _len, _ref, _results;
                    if (branch.expanded == null) {
                        branch.expanded = false;
                    }
                    if (!branch.children || branch.children.length === 0) {
                        tree_icon = attrs.iconLeaf;
                    } else {
                        if (branch.expanded) {
                            tree_icon = attrs.iconCollapse;
                        } else {
                            tree_icon = attrs.iconExpand;
                        }
                    }
                    scope.tree_rows.push({
                        level: level,
                        branch: branch,
                        label: branch.label,
                        tree_icon: tree_icon,
                        visible: visible
                    });
                    if (branch.children != null) {
                        _ref = branch.children;
                        _results = [];
                        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                            child = _ref[_i];
                            child_visible = visible && branch.expanded;
                            _results.push(add_branch_to_list(level + 1, child, child_visible));
                        }
                        return _results;
                    }
                };
                _ref = scope.treeData;
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    root_branch = _ref[_i];
                    _results.push(add_branch_to_list(1, root_branch, true));
                }
                return _results;
            };
            if (attrs.initialSelection != null) {
                for_each_branch(function(b) {
                    if (b.label === attrs.initialSelection) {
                        return select_branch(b);
                    }
                });
            }
            return scope.$watch('treeData', on_treeData_change, true);
        }
    };
});