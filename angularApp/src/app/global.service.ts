import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  private _apiDomain: string = 'https://lw42f2qm-3000.use.devtunnels.ms'; //https://lw42f2qm-3000.use.devtunnels.ms

  constructor() { }

  get apiDomain(): string {
    return this._apiDomain;
  }
}
