ScriptLoader.register('aui-base', [], function() {
    return {
        log: function(text) {
            console.log('module aui-base');
        }
    };
}, {
    fullPath: 'http://localhost:8081/modules/aui-base.js'
});