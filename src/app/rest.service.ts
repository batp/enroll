import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export class Tag {
  constructor() {
    this.chip_id = "";
  }

  id: number;
  chip_id: string;
  label: string;
  brand: any;
  serial_num: string;
  comment: any;
  week_periodicity: number;
  month_periodicity: number;
  last_certifiction: string;
  sector: string;
  zone: string;
  check_day_id: number;
  parts_number: number;
  cmu_kg: number;
  length: number;
  status: number;
  created_at: string;
  updated_at: string
}

@Injectable({
  providedIn: 'root'
})
export class RestService {

  private baseURI: string = 'https://trako3.herokuapp.com/api/v1/';
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  };

  constructor(private httpClient: HttpClient) { }

  public getEquipmentInfo(uuid: string): Promise<Tag[]> {

    return new Promise((resolve, error) => {
      this.httpClient.get<Tag[]>(this.baseURI + 'liftequips?chip_id=' + uuid, this.httpOptions)
        .subscribe(
          data => resolve(data),
          err => error(err)
        );
    });
  }

  public setEquipmentStatus(id: number, status: number, comment?: string) {
    const body = { liftequip: { status, comment } };

    return new Promise((resolve, error) => {
      this.httpClient.put(this.baseURI + 'liftequips/' + id, body, this.httpOptions)
        .subscribe(
          data => resolve(data),
          err => error(err)
        );
    });
  }

  public createEquipment(tag: Partial<Tag>) {
    const body = { liftequip: { ...tag, status: 1, } };

    return new Promise((resolve, error) => {
      this.httpClient.post(this.baseURI + 'liftequips', body, this.httpOptions)
        .subscribe(
          data => resolve(data),
          err => error(err)
        );
    });
  }

}
