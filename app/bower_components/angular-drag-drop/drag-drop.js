angular.module("gkDragDrop",[])
    .directive('dragable',['$parse','$document',function($parse,$document){
        return function(scope, element, attrs){
            element.attr("draggable", false);
          var helper;
            attrs.$observe("dragable", function (newValue) {
                element.attr("draggable", newValue);
            });
            var dragData = '';
            attrs.$observe('dragData',function(val){
                dragData = val;
            })
            var dragBeginFn = $parse(attrs.dragBegin);
            element.on('dragstart',function(event){
                var e = event.originalEvent;
                scope.$apply(function () {
                    dragBeginFn(scope, {$event: e});
                });
                helper = angular.element($parse(attrs.dragHelper)(scope)());
                var sendData = angular.toJson(dragData);
                e.dataTransfer.setData("text", 'GK_DRAG_DROP');
                e.dataTransfer.effectAllowed = 'move';
                $document.find('body').append(helper);
                helper.css({
                    'position':'absolute',
                    'z-index':99999,
                    'top': e.pageY,
                    'left': e.pageX
                })
            })

            element.on('drag',function(event){
                var e = event.originalEvent;
                helper&&helper.css({
                    'top': e.pageY,
                    'left': e.pageX
                })
            })

            var dragEndFn = $parse(attrs.dragEnd);
            element.on('dragend',function(event){
                helper&&helper.remove();
                scope.$apply(function () {
                    dragEndFn(scope, {$event: event});
                });
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

            element.on('dragenter',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(data !== 'GK_DRAG_DROP') return;
                if(!dropable) return false;
            })

            var dragOverFn = $parse(attrs.dragOver);
            element.on('dragover',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(data !== 'GK_DRAG_DROP') return;
                if(!dropable) return;
                scope.$apply(function () {
                    dragOverFn(scope, {$event: event});
                });
            })

            var dragLeaveFn = $parse(attrs.dragLeave);
            element.on('dragleave',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(data !== 'GK_DRAG_DROP') return;
                if(!dropable) return;
                scope.$apply(function () {
                    dragLeaveFn(scope, {$event: event});
                });
            })

            element.on('dragover',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(data !== 'GK_DRAG_DROP') return;
                if(!dropable) return;
                event.stopPropagation();
                event.preventDefault();
            })

            var dropFn = $parse(attrs.dropSuccess);
            element.on('drop',function(event){
                var e = event.originalEvent;
                var data = e.dataTransfer.getData('text');
                if(data !== 'GK_DRAG_DROP') return;
                if(!dropable) return;
                event.stopPropagation();
                event.preventDefault();
                dropFn(scope, {$event: e});
            })
        }
    }])
