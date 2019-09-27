import { Response } from 'express';

export class HelpResponse {
    public static disallowed(response: Response) {
        response.status(403).send("Disallowed");
    };
    
    public static error(response: Response, error = "Internal server error") {
        response.status(500).send(error);
    };
}