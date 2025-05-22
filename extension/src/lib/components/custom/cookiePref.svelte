<!-- CookiePreferences.svelte -->
<script lang="ts">
    import { onMount } from 'svelte';
    import { Card } from '../ui/card';
    import { Switch } from '../ui/switch';
    import Button from '../ui/button/button.svelte';
    import * as Dialog from '../ui/dialog';
    import { Settings, Cookie, BarChart3, Target, Shield } from 'lucide-svelte';
    import Badge from '../ui/badge/badge.svelte';
  
    // Check for browser environment
    const isBrowser = typeof window !== 'undefined';
  
    interface CookieCategory {
      id: 'functional' | 'analytics' | 'marketing';
      name: string;
      description: string;
      icon: any;
      essential: boolean;
      defaultValue: boolean;
    }
  
    const cookieCategories: CookieCategory[] = [
      {
        id: 'functional',
        name: 'Functional Cookies',
        description: 'Enable basic website functionality like user preferences, language settings, and login status. These are necessary for the website to work properly.',
        icon: Settings,
        essential: false,
        defaultValue: true
      },
      {
        id: 'analytics',
        name: 'Analytics Cookies',
        description: 'Help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps improve user experience.',
        icon: BarChart3,
        essential: false,
        defaultValue: false
      },
      {
        id: 'marketing',
        name: 'Marketing Cookies',
        description: 'Used to track visitors across websites to display relevant and engaging advertisements. May be set by third-party advertising partners.',
        icon: Target,
        essential: false,
        defaultValue: false
      }
    ];
  
    let preferences = $state({
      functional: true,
      analytics: false,
      marketing: false
    });
  
    let isLoading = $state(false);
    let saveSuccess = $state(false);
  
    onMount(() => {
      loadPreferences();
    });
  
    async function loadPreferences() {
      if (!isBrowser) return;
  
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.get(['cookiePreferences'], (result) => {
            if (result.cookiePreferences) {
              preferences = { ...preferences, ...result.cookiePreferences };
            }
          });
        } else {
          const stored = localStorage.getItem('cookiePreferences');
          if (stored) {
            preferences = { ...preferences, ...JSON.parse(stored) };
          }
        }
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      }
    }
  
    async function savePreferences() {
      if (!isBrowser) return;
  
      isLoading = true;
      saveSuccess = false;
  
      try {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.set({ cookiePreferences: preferences }, () => {
            console.log('Cookie preferences saved:', preferences);
            isLoading = false;
            saveSuccess = true;
            
            setTimeout(() => {
              saveSuccess = false;
            }, 2000);
            if (chrome.runtime) {
              chrome.runtime.sendMessage({ 
                action: 'updateCookiePreferences', 
                preferences 
              });
            }
          });
        } else {
          localStorage.setItem('cookiePreferences', JSON.stringify(preferences));
          console.log('Cookie preferences saved to localStorage:', preferences);
          isLoading = false;
          saveSuccess = true;
          
          setTimeout(() => {
            saveSuccess = false;
          }, 2000);
        }
      } catch (error) {
        console.error('Error saving cookie preferences:', error);
        isLoading = false;
      }
    }
  
    function togglePreference(categoryId: 'functional' | 'analytics' | 'marketing') {
      preferences[categoryId] = !preferences[categoryId];
      savePreferences();
    }
  
    function resetToDefaults() {
      preferences = {
        functional: true,
        analytics: false,
        marketing: false
      };
      savePreferences();
    }
  
    export function getPreferences() {
      return preferences;
    }
  </script>
  
  <Dialog.Root>
    <Dialog.Trigger>
      <Button variant="outline" size="sm" class="flex items-center gap-1 px-2">
        <Shield class="h-3 w-3" />
        <span class="hidden sm:inline">Preferences</span>
        <span class="sm:hidden">Prefs</span>
      </Button>
    </Dialog.Trigger>
    
    <Dialog.Content class="max-w-3xl max-h-[90vh] overflow-y-auto">
      <Dialog.Header>
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <Dialog.Close>
              <Button variant="outline" size="sm" class="flex items-center gap-1">
                <span>← Back</span>
              </Button>
            </Dialog.Close>
            
            <Button variant="outline" size="sm" onclick={resetToDefaults} disabled={isLoading}>
              Reset to Defaults
            </Button>
          </div>
          
          <div class="flex items-center gap-2">
            {#if saveSuccess}
              <span class="text-sm text-green-600 flex items-center gap-1">
                <Shield class="h-3 w-3" />
                Preferences saved!
              </span>
            {/if}
            
            {#if isLoading}
              <span class="text-sm text-gray-500">Saving...</span>
            {/if}
          </div>
        </div>
        
        <Dialog.Title class="flex items-center gap-2">
          <Cookie class="h-5 w-5" />
          Cookie Preferences
        </Dialog.Title>
        <Dialog.Description>
          Control which types of cookies you want to allow. Your preferences will be saved and applied across the website.
        </Dialog.Description>
      </Dialog.Header>
  
      <div class="space-y-4">
        <Card class="p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-start gap-3">
              <div class="rounded-full bg-green-100 p-2">
                <Shield class="h-4 w-4 text-green-600" />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold">Essential Cookies</h3>
                  <Badge variant="secondary" class="text-xs">Always On</Badge>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                  Required for basic website functionality like security, authentication, and remembering your preferences. These cannot be disabled.
                </p>
              </div>
            </div>
            <Switch checked={true} disabled={true} />
          </div>
        </Card>
  
        {#each cookieCategories as category}
          <Card class="p-4 transition-all duration-200 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex items-start gap-3">
                <div class="rounded-full bg-blue-100 p-2">
                  <svelte:component this={category.icon} class="h-4 w-4 text-blue-600" />
                </div>
                <div class="flex-1">
                  <h3 class="font-semibold">{category.name}</h3>
                  <p class="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
              <Switch 
                checked={preferences[category.id]} 
                onCheckedChange={() => togglePreference(category.id)}
                disabled={isLoading}
              />
            </div>
          </Card>
        {/each}
  
        <Card class="p-3 bg-gray-50">
          <h4 class="text-sm font-medium mb-2">Current Settings:</h4>
          <div class="flex flex-wrap gap-2">
            <Badge variant={preferences.functional ? "default" : "secondary"}>
              Functional: {preferences.functional ? 'Enabled' : 'Blocked'}
            </Badge>
            <Badge variant={preferences.analytics ? "default" : "secondary"}>
              Analytics: {preferences.analytics ? 'Enabled' : 'Blocked'}
            </Badge>
            <Badge variant={preferences.marketing ? "default" : "secondary"}>
              Marketing: {preferences.marketing ? 'Enabled' : 'Blocked'}
            </Badge>
          </div>
        </Card>
      </div>
    </Dialog.Content>
  </Dialog.Root>
  
  <style>
    :global(.cookie-preference-card:hover) {
      background-color: #f9fafb;
    }
  </style>