'use strict';

angular.module('gkChat', [])
    .controller('initChat',[function(){

    }])
    .factory('chat', [function () {
       var chat = {
            add:function(){
                var date = new Date().toUTCString();
                var method = 'CLEAR';
                var webpath = Util.String.encodeRequestUri('');
                var authorization = GK.getAuthorization(method, webpath, date, mount_id);
                var headers = {
                    'x-gk-mount': mount_id,
                    'Date': date,
                    'Authorization': authorization,
                    'Content-Type': "application/x-www-form-urlencoded",
                    'Accept': '*/*'
                };
                return jQuery.ajax({
                    url: GK.getRestHost() + '/post-message',
                    dataType: 'text',
                    type: method,
                    headers: headers
                });
            },
            get:function(){

            }
       };
       return chat;
    }])

