import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    modal: {
        message: string,
        acceptText: string
        cancelText: string
    };
    resolve: any;
    reject: any;

    constructor() { }

    add(message: string, acceptText = 'Yes', cancelText = 'No'): Promise<boolean> {
        this.modal = {
            message: message,
            acceptText: acceptText,
            cancelText: cancelText,
        };

        return new Promise<boolean>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }

    accept(): void {
        this.resolve();
        this.modal = null;
    }

    cancel(): void {
        this.reject();
        this.modal = null;
    }
}