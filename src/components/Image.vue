<template>
  <img :src="imageUrl"/>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import defaultImageUrl from "@/assets/images/defaultImage.png";

const props = defineProps<{
  src?: string;
}>();

const resourceUrl = import.meta.env.VITE_RESOURCE_URL || '';
const imageUrl = ref(defaultImageUrl);

const checkIfImageExists = (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = function () {
      resolve(true);
    };
    img.onerror = function () {
      reject(false);
    };
    img.src = src;
  });
};

const setImageUrl = () => {
  if (!props.src) {
    imageUrl.value = defaultImageUrl;
    return;
  }

  if (props.src.indexOf('assets/') != -1) {
    // Assign directly in case of assets
    imageUrl.value = props.src;
  } else if (props.src.startsWith('http')) {
    // If starts with http, it is web url check for existence and assign
    checkIfImageExists(props.src).then(() => {
      imageUrl.value = props.src as string;
    }).catch(() => {
      console.warn("Image doesn't exist", props.src);
    });
  } else {
    // Image is from resource server, hence append to base resource url, check for existence and assign
    const sourceUrl = resourceUrl.concat(props.src);
    checkIfImageExists(sourceUrl).then(() => {
      imageUrl.value = sourceUrl;
    }).catch(() => {
      console.warn("Image doesn't exist", sourceUrl);
    });
  }
};

watch(() => props.src, setImageUrl, { immediate: true });
</script>
