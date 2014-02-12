angular.module("gkDragDrop",[])
    .directive('dragable',['$parse',function($parse){
        return function(scope, element, attrs){
            element.attr("draggable", false);
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
                var sendData = angular.toJson(dragData);

                e.dataTransfer.setData("text", sendData);
                e.dataTransfer.effectAllowed = 'move';
                scope.$apply(function () {
                    dragBeginFn(scope, {$event: e});
                });
            })

            var dragEndFn = $parse(attrs.dragEnd);
            element.on('dragend',function(event){
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
                console.log('newValue',newValue);
                dropable = newValue;
            });

            element.on('dragenter',function(event){
                if(!dropable) return false;
            })

            var dragOverFn = $parse(attrs.dragOver);
            element.on('dragover',function(event){
                if(!dropable) return;
                scope.$apply(function () {
                    dragOverFn(scope, {$event: event});
                });
            })

            var dragLeaveFn = $parse(attrs.dragLeave);
            element.on('dragleave',function(event){
                if(!dropable) return;
                scope.$apply(function () {
                    dragLeaveFn(scope, {$event: event});
                });
            })

            element.on('dragover',function(event){
                if(!dropable) return;
                event.stopPropagation();
                event.preventDefault();
            })

            var dropFn = $parse(attrs.dropSuccess);
            element.on('drop',function(event){
                if(!dropable) return;
                event.stopPropagation();
                event.preventDefault();
                dropFn(scope, {$event: event});
            })
        }
    }])
