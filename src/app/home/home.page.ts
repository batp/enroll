import { Component } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

import { BLE } from '@ionic-native/ble/ngx';

import { Mutex, MutexInterface } from 'async-mutex';

import { RestService } from 'src/app/rest-service.service'
import { TagCreate } from 'src/models/tag.model';
import { BLEDevice } from 'src/models/bledevice.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private restService: RestService,
    private ble: BLE,
  ) {
    this.mutex = new Mutex();
  }

  private mutex: Mutex;
  public tag: TagCreate;

  public async scanClicked() {
    const loading = await this.loadingController.create({
      message: 'recherche des équipements'
    });
    loading.present();

    this.scanForDevices();
    setTimeout(async () => {
      this.ble.stopScan();
      loading.dismiss();
      /*if (!this.selectedEquipment) {
        const alert = await this.alertController.create({
          header: 'Erreur',
          message: 'Aucun équipement trouvé',
          buttons: ['OK'],
        });
        alert.present();
      }
      */
    }, 10000);
  }

  public async scanForDevices() {
    this.clearForm();

    this.ble.startScan([]).subscribe(
      device => this.handleDiscoveredDevice(device),
      error => this.handleBLEError(error)
    )
  }

  private async handleDiscoveredDevice(ble: BLEDevice) {

  }

  private async handleBLEError(err: any) {
    const alert = await this.alertController.create({
      header: 'Erreur',
      message: 'Une erreur BLE c\'est produite: ' + JSON.stringify(err),
      buttons: ['OK'],
    });
    alert.present();
  }

  private clearForm() {

  }
}
