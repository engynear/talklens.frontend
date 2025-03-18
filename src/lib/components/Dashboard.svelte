<script lang="ts">
    import { selectedChat } from "$lib/stores/stores";
  </script>
  
  {#if $selectedChat}
    <h2 class="text-xl font-bold">Аналитика чата</h2>
    <p class="text-gray-600">Здесь будут метрики общения...</p>
  {:else}
    <button class="bg-blue-500 text-white px-6 py-3 rounded-lg text-lg">
      Подключить чат
    </button>
  {/if}
  