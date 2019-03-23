import { Component } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

import { BLE } from '@ionic-native/ble/ngx';

import { Mutex, MutexInterface } from 'async-mutex';

import { RestService } from 'src/app/rest-service.service'
import { Tag } from 'src/models/tag.model';
import { BLEDevice } from 'src/models/bledevice.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  providers: [BLE,]
})
export class HomePage {

  public tag: Tag;
  private mutex: Mutex;
  private devices: BLEDevice[] = [];

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private restService: RestService,
    private bleService: BLE,
  ) {
    this.mutex = new Mutex();
    this.tag = new Tag();
  }

  public async scanClicked() {
    const loading = await this.loadingController.create({
      message: 'recherche de balise'
    });
    loading.present();

    this.scanForDevices();
    setTimeout(async () => {
      this.bleService.stopScan();
      loading.dismiss();
      if (this.tag.chip_id === "") {
        const alert = await this.alertController.create({
          header: 'Erreur',
          message: 'Aucune balise détectée',
          buttons: ['OK'],
        });
        alert.present();
      }
    }, 10000);
  }

  public async saveClicked() {
    const toast = await this.toastController.create({
      message: 'Envoi en cours',
      position: 'top',
      color: 'primary',
      duration: 1000,
    });
    toast.present();
    this.restService.createEquipment(this.tag)
      .then(async () => {
        const successToast = await this.toastController.create({
          message: 'Balise créée',
          position: 'top',
          color: 'success',
          duration: 1000,
        });
        successToast.present();
        this.clearForm();
      })
      .catch(async (err) => {
        const failToast = await this.toastController.create({
          message: 'Erreur ' + JSON.stringify(err),
          position: 'top',
          color: 'danger',
          duration: 3500,
        });
        failToast.present();
        this.clearForm();
      })
  }

  private async scanForDevices() {
    this.clearForm();

    this.bleService.startScan([]).subscribe(
      device => this.handleDiscoveredDevice(device),
      error => this.handleBLEError(error)
    )
  }

  private async handleDiscoveredDevice(ble: BLEDevice) {
    if (this.devices.filter(dev => dev.id === ble.id).length > 0) {
      // equipment exists only update its rssi;
      const release: MutexInterface.Releaser = await this.mutex.acquire();
      this.devices = this.devices.map<BLEDevice>(dev => {
        if ((dev.id === ble.id) && (dev.rssi < ble.rssi)) {
          dev.rssi = ble.rssi;
        }
        return dev;
      });
      this.updateEquipments();
      release();
    } else {
      const { id } = ble;
      // equipments has not be seen in this scan
      this.restService.getEquipmentInfo(id)
        .then(async (tags: Tag[]) => {
          if (tags && tags.length > 0) {
            // tag is already enrolled
          } else {
            const release: MutexInterface.Releaser = await this.mutex.acquire();
            this.devices.push(ble);
            this.updateEquipments();
            release();
          }
        })
        .catch(err => {
          // this.debug += JSON.stringify(err);
        });
    }
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
    this.tag = new Tag();
    this.devices = [];
  }

  private updateEquipments() {
    this.devices = this.devices.sort((a: BLEDevice, b: BLEDevice) => a.rssi - b.rssi);
    this.tag.chip_id = this.devices[0].id;
  }

}
