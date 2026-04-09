<template>
  <n-config-provider :theme="theme">
    <n-message-provider>
      <n-notification-provider>
        <n-dialog-provider>
          <app-layout />
        </n-dialog-provider>
      </n-notification-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { NConfigProvider, NMessageProvider, NNotificationProvider, NDialogProvider } from "naive-ui";
import AppLayout from "./components/AppLayout.vue";

const theme = ref(null);
</script>
