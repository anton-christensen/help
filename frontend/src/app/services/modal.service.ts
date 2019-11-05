import {Injectable} from '@angular/core';

interface ModalBtn {
  text: string;
  type: 'positive' | 'negative' | 'neutral';
}

@Injectable({
    providedIn: 'root'
})
export class ModalService {
    public modal: {
        message: string,
        leftSide: ModalBtn
        rightSide: ModalBtn
    };
    private _resolve: any;
    private _reject: any;

    constructor() { }

    add(message: string, leftSide: ModalBtn, rightSide: ModalBtn): Promise<ModalBtn> {
        this.modal = {
          message,
          leftSide,
          rightSide,
        };

        return new Promise<ModalBtn>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }

    public resolve(btn: ModalBtn): void {
        this._resolve(btn);
        this.modal = null;
    }

    public reject(): void {
        this._reject();
        this.modal = null;
    }
}
