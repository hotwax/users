import { toastController } from '@ionic/vue';

// TODO Remove it when HC APIs are fully REST compliant
const hasError = (response: any) => {
  return typeof response.data != "object" || !!response.data._ERROR_MESSAGE_ || !!response.data._ERROR_MESSAGE_LIST_ || !!response.data.error;
}

const showToast = async (message: string, isButtonVisible: boolean, configButtons?: any) => {
  let defaultButtons = [{
    text: 'Dismiss',
    role: 'cancel'
  }]

  if(isButtonVisible){
    if (configButtons) defaultButtons.push(...configButtons);
  }else {
    defaultButtons = []
  }

  const toast = await toastController
    .create({
      message: message,
      duration: 3000,
      position: 'bottom',
      buttons: defaultButtons
    })
  return toast.present();
}

export { showToast, hasError }
