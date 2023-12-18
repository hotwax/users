import { toastController } from '@ionic/vue';
import { Plugins } from '@capacitor/core';
import { translate } from '@hotwax/dxp-components';

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

const fileToImage = async (file: any) => {
  const blob = new Blob([file], {
    type: "image/png"
  })

  const result = await blob.arrayBuffer()
  return result
}

export { copyToClipboard, showToast, isValidEmail, isValidPassword, fileToImage }
