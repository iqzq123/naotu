"use strict";
( function () {
    var minder;

    /**
     * 从指定的 URL 加载一个脑图到指定的 Dom 容器中
     *
     * @param  {Object} option 选项
     *
     *    option.target   {string}   [Required] Dom 容器的 id
     *    option.url      {string}   [Required] 脑图文件的地址
     *    option.type     {string}   [Required] 脑图文件的类型（拓展名，支持的值为："mm"|"xmind"|"mmap"|"km"）
     *    option.success  {Function} 加载并渲染成功完成后的回调
     *    option.progress {Function} 加载或渲染过程中的回调，其中回调参数 percent 表示进度百分比（0 - 100）
     *    option.error    {Function} 加载或渲染过程中失败的回调
     *
     * @return {KityMinder} 脑图的实例
     */
    KityMinder.load = function ( option ) {
        // 把整个加载过程的进度比例分配到下载过程和渲染过程中
        var downloadPercentTotal = 50,
            renderPercentTotal = 100 - downloadPercentTotal;

        var target = option.target,
            url = option.url,
            type = option.type,
            successCall = option.success || emptyCall,
            progressCall = option.progress || emptyCall,
            errorCall = option.error || emptyCall;

        if ( !( type in fileConf ) ) {
            throw new Error( '不支持的脑图格式：' + type );
        }

        minder = minder || KM.getKityMinder( target );

        // 渲染进度通知
        function onRenderProgress( e ) {
            progressCall( downloadPercentTotal + renderPercentTotal * e.progress );
        }

        // 渲染完成通知（也是整个加载过程完成）
        function onRenderComplete( e ) {
            progressCall( 100 );
            successCall( minder );
            // 渲染完成需要自动解绑
            minder.off( 'renderprogress', onRenderProgress );
            minder.off( 'rendercomplete', onRenderComplete );
        }

        // 注册渲染事件
        minder.on( 'renderprogress', onRenderProgress );
        minder.on( 'rendercomplete', onRenderComplete );

        //TODO: 事件好了之后删掉下面一行
        // minder.on( 'import', function () {
        //     minder.fire( 'rendercomplete' );
        // } );

        loadFile( url, type, minder, function ( eventType, e, xhr ) {
            switch ( eventType ) {

            case 'abort':
            case 'error':
                errorCall( 'Fail to download: ' + option.url );
                break;

            case 'progress':
                if ( e.lengthComputable ) {
                    progressCall( downloadPercentTotal * e.loaded / e.total );
                }
                break;
            case 'load':
                if ( xhr.status == 200 && xhr.readyState == 4 /* DONE */ ) {
                    progressCall( downloadPercentTotal );
                    minder.importData( xhr.response, fileConf[ type ].protocal );
                }
            }
        } );

        return minder;
    };

    function emptyCall() {}

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

    function loadFile( url, extension, minder, callback ) {
        var conf, xhr;

        var xhrCall = function ( info ) {
            return function ( e ) {
                callback( info, e, xhr );
            }
        };

        if ( extension in fileConf ) {
            conf = fileConf[ extension ];
            xhr = new XMLHttpRequest();
            xhr.open( "GET", url, true );
            xhr.responseType = conf.type;
            xhr.addEventListener( 'load', xhrCall( 'load' ) );
            xhr.addEventListener( 'progress', xhrCall( 'progress' ) );
            xhr.addEventListener( 'error', xhrCall( 'error' ) );
            xhr.addEventListener( 'abort', xhrCall( 'abort' ) );
            xhr.send();
        }
    };

} )();