angular.module("gkDragDrop",[])
    .directive('dragable',['$parse','$document',function($parse,$document){
        return function(scope, element, attrs){
            var helper;
            element.attr("draggable", false);

            scope.$watch(function(){
                return scope.$eval(attrs.dragable);
            }, function (newValue) {
                element.attr("draggable", newValue);
            });

            var dragData = '';
            attrs.$observe('dragData',function(val){
                dragData = val;
            })
            var dragBeginFn = $parse(attrs.dragBegin);
            element.on('dragstart.gkDragDrop',function(event){
                var e = event.originalEvent;
                scope.$apply(function () {
                    dragBeginFn(scope, {$event: e});
                });
                helper = angular.element($parse(attrs.dragHelper)(scope)());
                var sendData = angular.toJson(dragData);
                e.dataTransfer.effectAllowed = 'move';
                $document.find('body').append(helper);
                helper.css({
                    'position':'absolute',
                    'z-index':99999,
                    'top': e.pageY,
                    'left': e.pageX
                })
            })

            element.on('drag.gkDragDrop',function(event){
                var e = event.originalEvent;
                helper&&helper.css({
                    'top': e.pageY,
                    'left': e.pageX
                })
            })

            var dragEndFn = $parse(attrs.dragEnd);
            element.on('dragend.gkDragDrop',function(event){
                helper&&helper.remove();
                scope.$apply(function () {
                    dragEndFn(scope, {$event: event});
                });
            })

            scope.$on('$destory',function(){
                element.off('dragstart.gkDragDrop');
                element.off('drag.gkDragDrop');
                element.off('dragend.gkDragDrop');
            })
        }
    }])
    .directive('dropable',['$parse',function($parse){
        return function(scope, element, attrs){
            var dropable = false;
            scope.$watch(function(){
                return scope.$eval(attrs.dropable);
            }, function (newValue) {
                dropable = newValue;
            });

            var dragEnterFn = $parse(attrs.dragEnter);
            element.on('dragenter.gkDragDrop',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(!dropable) return false;
                scope.$apply(function () {
                    dragEnterFn(scope, {$event: event});
                });
            })

            var dragOverFn = $parse(attrs.dragOver);
            element.on('dragover.gkDragDrop',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                e.dataTransfer.dropEffect = 'move';
                if(!dropable) return;
                scope.$apply(function () {
                    dragOverFn(scope, {$event: event});
                });
                event.preventDefault();
            })

            var dragLeaveFn = $parse(attrs.dragLeave);
            element.on('dragleave.gkDragDrop',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(!dropable) return;
                scope.$apply(function () {
                    dragLeaveFn(scope, {$event: event});
                });
            })


            var dropFn = $parse(attrs.dropSuccess);
            element.on('drop.gkDragDrop',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(!dropable) return;
                event.preventDefault();
                dropFn(scope, {$event: e});
            })

            scope.$on('$destory',function(){
                element.off('dragenter.gkDragDrop');
                element.off('dragover.gkDragDrop');
                element.off('dragleave.gkDragDrop');
                element.off('drop.gkDragDrop');
            })
        }
    }])
