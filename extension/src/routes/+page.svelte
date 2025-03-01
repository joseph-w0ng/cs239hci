<script lang="ts">
    import { onMount } from 'svelte';
    let cookies: chrome.cookies.Cookie[] = [];
  
    onMount(() => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs.length) return;
        const url = tabs[0].url;
  
        chrome.cookies.getAll({ url }, (cookieArray) => {
          cookies = cookieArray; 
        });
      });
    });
  </script>
  
  <main>
    <h1>Cookies</h1>
    {#each cookies as cookie}
      <div>
        <strong>{cookie.name}:</strong> {cookie.value}
      </div>
    {/each}
  </main>