export function mergePlaybackQueries(obj1: any, obj2: any) {
    const query = Object.assign({}, obj1, obj2);

    return query;
}
