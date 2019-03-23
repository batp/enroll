import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Tag } from 'src/models/tag.model';

@Injectable({
  providedIn: 'root'
})
export class RestService {

  private baseURI: string = 'https://trako3.herokuapp.com/';

  constructor(private httpClient: HttpClient) { }

  public getEquipmentInfo(uuid: string): Promise<Tag[]> {

    return new Promise((resolve, error) => {
      this.httpClient.get<Tag[]>(this.baseURI + 'liftequips.json?chip_id=' + uuid).subscribe(
        data => resolve(data),
        err => error(err)
      );
    })
  }

  public createEquipment(device: Tag): Promise<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
    };
    return new Promise((resolve, error) => {
      this.httpClient.post(this.baseURI + 'api/v1/liftequips/', device, httpOptions).subscribe(
        data => resolve(data),
        err => error(err)
      );
    });
  }
}