const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AnythingLLM = require("./AnythingLLM");
require('dotenv').config({ path: path.join(__dirname, '../.env') });

//const API_KEY = process.env.AnythingLLM_API_KEY;
//const BASE_URL = process.env.AnythingLLM_URL;

let slug = "test";
let thread = "22ce31e3-4ea0-4091-aea9-9ec5165a9a6a";

const allowedOrigins = new Set([
    'http://localhost:4200',
    'https://lw42f2qm-4200.use.devtunnels.ms'
]);

const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin;

    if (allowedOrigins.has(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    switch(req.method.toUpperCase()) {
        case "GET":
            GET(req, res);
            return;
        case "POST":
            POST(req, res);
            return;
        case "DELETE":
            return;
        case "OPTIONS":
            res.writeHead(204);
            res.end();
            return;
        default: {
            //method not recognized
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('Method Not Allowed');
            return;
        }
    }
});

async function GET(req, res) {
    switch(req.url) {
        case "/":
            return;
        default: {
            //incorrect endpoint
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Endpoint Not Found');
            return;
        }
    }
}

async function POST(req, res) {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk;
    });

    req.on('end', async () => {
        try {
            const data = JSON.parse(body);
            
            switch(req.url) {
                case "/chat":
                    console.log("chat", data);
                    AnythingLLM.stream(res, `/v1/workspace/${data.workspaceId}/thread/${data.threadId}/stream-chat`, data);
                    return;
                case "/chat-history":
                    console.log("history")
                    AnythingLLM.history(res, data);
                    return;
                case "/workspaces":
                    console.log("workspaces");
                    AnythingLLM.workspaces(res);
                    return;
                case "/new-thread":
                    console.log("new thread");
                    AnythingLLM.newThread(res, data.workspaceId);
                    return;
                default: {
                    //incorrect endpoint
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Endpoint Not Found');
                    return;
                }
            }
        } catch (error) {
            console.error("POST ERROR:", error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'API Request Failed' }));
        }
    });
} 

server.listen(process.env.PORT, process.env.HOSTNAME, () => {
    console.log(`Api running at http://${process.env.HOSTNAME}:${process.env.PORT}/`);
});

