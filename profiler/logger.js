

export function info_log(message) {
    const date = new Date();
    const timestampInMs = date.getTime();
    const timestampInS = timestampInMs / 1000 
    console.log(`INFO [${timestampInS}000] ${message}`)
}
