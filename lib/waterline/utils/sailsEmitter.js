sailsEmitter = {};

function emitToSails (action, model_name, model_id, data) {
    // Work out our event key `live:<model name>:create`
    var redisEventKey = ['live', model_name, action];
    if (model_id) {
        redisEventKey.push(model_id);
    }
    redisEventKey = redisEventKey.join(':');

    if (sails) {
        sails.emit('echoToRedis', {
            event: redisEventKey,
            data: data
        });
    }
}

sailsEmitter.emitCreate = function (model_name, model_values) {
    emitToSails('create', model_name, undefined, model_values);
}

sailsEmitter.emitUpdate = function (model_name, model_id, model_values) {
    emitToSails('update', model_name, model_id, model_values);
}

sailsEmitter.emitDestroy = function (model_name, model_id) {
    emitToSails('destroy', model_name, model_id, model_id);
}

module.exports = sailsEmitter;