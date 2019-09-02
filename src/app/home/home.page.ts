import { Component } from '@angular/core';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';

import { BLE } from '@ionic-native/ble/ngx';

import { Mutex, MutexInterface } from 'async-mutex';

import { RestService, Tag } from 'src/app/rest.service'
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
    this.tag.label = "";
    this.tag.last_certification = "";
    this.tag.month_periodicity = -1;
    this.tag.brand = "";
    this.tag.serial_num = "";
    this.tag.cmu_kg = -1;
    this.tag.length = -1;
    this.tag.human_id = "";
    this.tag.famille = "";
  }

  public async scanClicked() {
    const loading = await this.loadingController.create({
      message: 'recherche de balise'
    });
    loading.present();

    this.scanForDevices();
    setTimeout(async () => {
      this.bleService.stopScan();
      this.tag.chip_id = (this.devices.length > 0) ? this.devices[0].id : "";
      loading.dismiss();
      if (this.tag.chip_id === "") {
        const alert = await this.alertController.create({
          header: 'Erreur',
          message: 'Aucune nouvelle balise détectée (vérifiez que le bluetooth est activé)',
          buttons: ['OK'],
        });
        alert.present();
      }
    }, 10000);
  }

  public async saveClicked() {

    if ( this.tag.human_id === "" || this.tag.human_id == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "L'identification de la balise est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

    if ( this.tag.serial_num === "" || this.tag.serial_num == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "Le numéro de série de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

    if ( this.tag.brand === "" || this.tag.brand == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "La marque de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }
    if ( this.tag.month_periodicity === -1 || this.tag.month_periodicity == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "La fréquence de contrôle de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

    if ( this.tag.label === "" || this.tag.label == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "Une désignation de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

    if ( this.tag.last_certification === "" || this.tag.last_certification == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: 'La date de derniere certification est obligatoire',
        buttons: ['OK'],
      });
      alert.present();

      return;
    }


    if ( this.tag.famille === "" || this.tag.famille == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "La famille de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

    if ( this.tag.cmu_kg === -1 || this.tag.cmu_kg == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "La charge utile maximale de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

    if ( this.tag.length === -1 || this.tag.length == null ) {
      const alert = await this.alertController.create({
        header: 'Erreur',
        message: "La longueur de l'équipement est obligatoire",
        buttons: ['OK'],
      });
      alert.present();
      return;
    }

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

  public cancelClicked() {
    this.clearForm();
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
    this.devices = this.devices.sort((a: BLEDevice, b: BLEDevice) => b.rssi - a.rssi);
  }

}
