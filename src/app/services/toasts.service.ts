import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  public toasts = [];

  constructor() {
    this.clear();
  }

  public add(message: string, time = 50000): string {
    const toast = {
      id: this.createId(),
      message,
      time,
      timerId: time > 0 ? setTimeout(() => this.removeById(toast.id), time) : -1
    };

    // See if this message is already shown
    const sameMessageIndex = this.toasts.findIndex(t => t.message === toast.message);
    if (sameMessageIndex === -1) {
      // Brand new message: show it
      this.toasts.push(toast);
    } else {
      // Message already exists: replace it with new toasts
      this.toasts[sameMessageIndex] = toast;
    }

    return toast.id;
  }

  public removeById(id: string) {
    this.toasts = this.toasts.filter(function(toast) {
      return toast.id !== id;
    });
  }

  public clear() {
    this.toasts = [];
  }

  private createId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  public getTime(toast: any): string {
    return toast.time + 'ms';
  }
}
