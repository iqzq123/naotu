"use strict";
( function () {
    // KityMinder.renderByData( url, fileType, domId, callback(kmInstance) );
    // domId: 渲染脑图的容器的 id
    // url: 文件的 HTTP 连接
    // fileType: 文件的类型（拓展名）
    // callback: 加载完成并渲染后回调的函数，里面有一个参数是当前的脑图实例。可以在这里去掉 loading

    var fileConf = {
        'km': {
            type: 'text',
            protocal: 'json'
        },
        'json': {
            type: 'text',
            protocal: 'json'
        },
        'xmind': {
            type: 'blob',
            protocal: 'xmind'
        },
        'mmap': {
            type: 'blob',
            protocal: 'mindmanager'
        },
        'mm': {
            type: 'text',
            protocal: 'freemind'
        }
    };

    var loadFile = function ( url, extension, minder, callback ) {
        if ( extension in fileConf ) {

            var conf = fileConf[ extension ];

            var xhr = new XMLHttpRequest();
            xhr.open( "get", url, true );
            xhr.responseType = conf.type;
            xhr.onload = function () {
                if ( this.status == 200 && this.readyState ) {
                    var data = this.response;
                    minder.importData( data, conf.protocal );
                    callback && callback( minder );
                }
            };
            xhr.send();

        }
    };

    var minder;

    KityMinder.renderByUrl = function ( domId, url, extension, callback ) {

        minder = minder || KM.getKityMinder( domId );

        loadFile( url, extension, minder, callback );
    };

} )();