import * as crypto from "crypto";
import { Role, User } from "../models/user";
import { Response, RequestHandler } from "express";
import { AuthTokenFootprint } from "../models/authToken";
import { Database } from "../database";
import { r, RFeed } from "rethinkdb-ts";
import { socket } from "zeromq";
import { HelpResponse } from "./responses";

var Tnet = require('tnet');
const grip = require('grip');
const expressGrip = require('express-grip');
expressGrip.configure({
    gripProxyRequired: true,
    gripProxies: [{ 'control_uri': 'http://pushpin:5561',}]
});

export const StreamMiddleware:RequestHandler = async (request, response, next) => {
    let shouldStream = (request.header('stream') ? true : false);
    response.locals._shouldStream = shouldStream;
    
    next();
};
    
export const shouldStream = (response: Response): User => {
    return response.locals._shouldStream;
}

export const createStream = (response: Response, channel: string, dbStream :RFeed, modifier: (err: any, row: any) => string) => {
    if(!shouldStream(response)) { return; }
    
    response.header('Grip-Hold', 'stream');
    response.header('Grip-Channel', channel);
    console.log("New stream listener: ", channel);
    
    let stream = new Stream(channel, dbStream, modifier);
    StreamWorker.addStream(stream);
}

class Stream {
    constructor(channel: string, changestream: RFeed, mappingFunction: (err: any, row: any) => string) {
        this.channel = channel;
        this.changestream = changestream;
        this.map = mappingFunction;
        this.ready = false;
        this.refCount = 0;

        this.stop = () => {throw "Not ready"};
    }
    public channel: string;
    public changestream: RFeed;
    public map: (err: any, row: any) => string;
    public stop: () => Promise<void>;
    public ready: boolean;
    public refCount: number;
}

export class StreamWorker {
    private static runningStreams: Stream[] = [];

    public static addStream(stream: Stream) {
        if(StreamWorker.hasStream(stream.channel))
            return;
    
        console.log("NEW STREAM: ", stream.channel);
        
        stream.changestream.run(Database.connection)
        .then(cursor => {
            stream.stop = cursor.close.bind(cursor);
            stream.ready = true;
            StreamWorker.runningStreams.push(stream);

            cursor.each((err, row) => {
                try {
                    expressGrip.publish(stream.channel, new grip.HttpStreamFormat(HelpResponse.jsonWrap(stream.map(err,row))));
                } catch { console.log("EXCEPTION: ", row); }
            });
        });
    }

    public static start() {
        let sock = socket("xpub");
        sock.connect("tcp://pushpin:5562");
    
        sock.on('message', function(msg:Buffer) {
            let channel = msg.slice(1).toString();
            switch(msg[0]) {
            case 0:
                console.log('UNSUB: ', channel);
                StreamWorker.onUnsubscribe(channel)
                break;
            case 1:
                console.log('SUB: ', channel);
                StreamWorker.onSubscribe(channel);
                break;
            }
        });
    }

    private static hasStream(channel: string): boolean {
        for(let i = 0; i < StreamWorker.runningStreams.length; i++) {
            if(StreamWorker.runningStreams[i].channel == channel)
                return true;
        }
        return false;
    }

    private static onSubscribe(channel: string) {
        for(let i = 0; i < StreamWorker.runningStreams.length; i++) {
            let stream = StreamWorker.runningStreams[i];
            if(stream.channel == channel) {
                stream.refCount++;
                console.log(`Now ${stream.refCount} listeners on channel: ${stream.channel}`);
                StreamWorker.runningStreams[i] = stream;
            }
        }
    }
    private static onUnsubscribe(channel: string) {
        for(let i = 0; i < StreamWorker.runningStreams.length; i++) {
            let stream = StreamWorker.runningStreams[i];
            if(stream.channel == channel) {
                if(--stream.refCount < 1 && stream.ready) {
                    console.log("Stopping DB changefeed on channel: ", stream.channel);
                    stream.stop();
                    StreamWorker.runningStreams.splice(i,1);
                    i--;
                    continue;
                }
                else {
                    console.log(`Now ${stream.refCount} listeners on channel: ${stream.channel}`);
                }
                StreamWorker.runningStreams[i] = stream;
            }
        }
    }

}