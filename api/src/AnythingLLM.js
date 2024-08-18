const path = require('path');
const axios = require('axios');
require('dotenv').config();

async function request(method = "GET", url = "/", data = {}) {
    try {
        return await axios({
            method: method,
            url: `${process.env.AnythingLLM_URL}/${url}`,
            data: data,
            headers: {
                'Authorization': `Bearer ${process.env.AnythingLLM_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        if (error.code === "ECONNREFUSED") return console.error("AnythingLLM Refused To Connect");
        console.error("Request Error:", error);
    }
}
async function requestStream(url = "/", data = {}) {
    //returns a socket
    try {
        const response = await axios({
            method: "POST",
            url: `${process.env.AnythingLLM_URL}/${url}`,
            data: data,
            headers: {
                'Authorization': `Bearer ${process.env.AnythingLLM_API_KEY}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });
        if(response) return response.data.socket; 
    } catch (error) {
        if (error.code === "ECONNREFUSED") return console.error("AnythingLLM Refused To Connect");
        console.error("Stream Request Error:", error);
    }
}
async function stream(res, url = "/", data = {}) {
    if(!res) return -1;

    const socket = await requestStream(url, data);
    if(!socket) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end();
        return -1;
    }

    res.writeHead(200, {
        'Content-Type': 'application/json',
        'Transfer-Encoding': 'chunked'
    });

    socket.on('data', (chunk) => {
        const string = Buffer.from(chunk).toString('utf8');
        res.write(string);
    });

    socket.on('end', () => {
        res.end();
        //console.log("Stream ended");
    });

    socket.on('error', (error) => {
        console.error("Socket error:", error);
        res.end(JSON.stringify({ error: "Stream Error" }));
    });

    return 0;
}

async function getWorkspaces() {
    const response = await request("GET", "/v1/workspaces");
    if(!response) return -1;
    
    return response.data;
}
async function workspaces(res) {
    if(!res) return -1;

    const workspaceData = await getWorkspaces();

    if(workspaceData == -1) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to get workspaces');
        return -1;
    }

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(workspaceData.workspaces));
    return 0;
}
async function createNewThread(workspaceId) {
    const response = await request("POST", `/v1/workspace/${workspaceId}/thread/new`);
    if(!response) return -1;

    return response.data;
}
async function newThread(res, workspaceId) {
    if(!res) return -1;

    const threadData = await createNewThread(workspaceId);

    if(!threadData) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to create thread');
        return -1;
    }

    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(threadData));
    return 0;
}

async function getHistory(workspaceId, threadId) {
    const response = await request("GET", `/v1/workspace/${workspaceId}/thread/${threadId}/chats`);
    if(!response) return -1;
    
    return response.data;
}
async function history(res, data = {}) {
    if(!res) return -1;

    const historyData = await getHistory(data.workspaceId, data.threadId);

    if(historyData == -1) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Failed to get history');
        return -1;
    }

    //console.log(histroyData)
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(historyData.history.slice(-50)));
    return 0;
}

module.exports = {
    request, 
    stream,
    getWorkspaces,
    workspaces,
    history,
    newThread,
}