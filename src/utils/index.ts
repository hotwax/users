import { toastController } from '@ionic/vue';
import { Plugins } from '@capacitor/core';
import { translate } from '@hotwax/dxp-components';
import Papa from 'papaparse'
import saveAs from "file-saver";

const showToast = async (message: string, configButtons?: any) => {
  const defaultButtons = [{
    text: 'Dismiss',
    role: 'cancel'
  }]

  if (configButtons) defaultButtons.push(...configButtons);

  const toast = await toastController
    .create({
      message: message,
      duration: 3000,
      position: 'top',
      buttons: defaultButtons
    })
  return toast.present();
}


const copyToClipboard = async (value: string, text?: string) => {
  const { Clipboard } = Plugins;

  await Clipboard.write({
    string: value,
  }).then(() => {
    text ? showToast(translate(text)) : showToast(translate("Copied", { value }));
  });
}

const isValidEmail = (email : string) => {
  // Regular expression pattern for a valid email address
  const emailPattern = /^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
  return emailPattern.test(email);
}
const isValidPassword = (password : string) => {
  // Regular expression pattern for a valid password
  const passwordPattern = /^.*(?=.{5,})(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).*$/;
  return passwordPattern.test(password);
}

const generateInternalId = (name: string) => {
  return name.trim().toUpperCase().split(' ').join('_');
}

// Here we have created a JsonToCsvOption which contains the properties which we can pass to jsonToCsv function

interface JsonToCsvOption {
  parse?: object | null;
  encode?: object | null;
  name?: string;
  download?: boolean;
}

const jsonToCsv = (file: any, options: JsonToCsvOption = {}) => {
  const csv = Papa.unparse(file, {
    ...options.parse
  });
  const encoding = {
    type: String,
    default: "utf-8",
    ...options.encode
  };
  const blob = new Blob([csv], {
    type: "application/csvcharset=" + JSON.stringify(encoding)
  });
  if (options.download) {
    saveAs(blob, options.name ? options.name : "default.csv");
  }
  return blob;
}

export { copyToClipboard, showToast, generateInternalId, isValidEmail, isValidPassword, jsonToCsv }
