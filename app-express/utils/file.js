import fs from "fs";



function readCachedFile(mapFileDataByName, fileName, format=null) {
    if (fs.existsSync(fileName)) {
        let cached = mapFileDataByName[fileName];
        const stats = fs.statSync(fileName);

        if (!cached || cached.mtime !== stats.mtime) {
            cached = mapFileDataByName[fileName] = {
                data: fs.readFileSync(fileName, "utf-8"),
                mtime: stats.mtime
            }
        }
        if (!format || format === 'text') {
            return cached.data;
        }
        else if (format === 'list') {
            if (!cached.list) {
                cached.list = cached.data ? JSON.parse(cached.data) : [];
            }
            return cached.list;
        }
        else if (format === 'object') {
            if (!cached.object) {
                cached.object = cached.data ? JSON.parse(cached.data) : {};
            }
            return cached.object;
        }
        throw Error(`Unexpected data format: ${format}`);
    }
    return mapFileDataByName[fileName] = null;
}


export {
    readCachedFile
}
