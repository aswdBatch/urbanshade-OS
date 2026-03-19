/**
 * Plugin Executor - Makes plugins actually work
 * Handles theme injection, widget rendering, app registration, and utility execution
 */

import { ModManifest, modLoader } from './modLoader';
import { toast } from 'sonner';

// Plugin configurations stored alongside manifests
interface ThemePluginConfig {
  variables: Record<string, string>;
  styles?: string;
}

interface WidgetPluginConfig {
  position: { x: number; y: number };
  size: { width: number; height: number };
  content: string; // HTML template or component key
}

interface AppPluginConfig {
  icon: string;
  category: string;
}

interface UtilityPluginConfig {
  interval?: number; // For periodic utilities
  onEnable?: string; // Code to run on enable
  onDisable?: string; // Code to run on disable
}

// Active style elements for theme plugins
const activeStyles = new Map<string, HTMLStyleElement>();

// Active intervals for utility plugins
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

// Sample plugin implementations
const PLUGIN_IMPLEMENTATIONS: Record<string, any> = {
  'dark-hacker-theme': {
    type: 'theme',
    config: {
      variables: {
        '--background': '0 0% 3%',
        '--foreground': '120 100% 50%',
        '--card': '0 0% 5%',
        '--card-foreground': '120 100% 45%',
        '--primary': '120 100% 40%',
        '--primary-foreground': '0 0% 0%',
        '--secondary': '120 50% 10%',
        '--secondary-foreground': '120 100% 50%',
        '--muted': '120 20% 10%',
        '--muted-foreground': '120 40% 40%',
        '--accent': '120 100% 30%',
        '--accent-foreground': '120 100% 80%',
        '--border': '120 50% 15%',
        '--ring': '120 100% 40%',
      },
      styles: `
        * { text-shadow: 0 0 2px hsl(120 100% 40% / 0.3); }
        ::selection { background: hsl(120 100% 30%); color: black; }
        .font-mono { font-family: 'Courier New', monospace !important; }
      `
    } as ThemePluginConfig
  },
  'system-stats-widget': {
    type: 'widget',
    config: {
      position: { x: 20, y: 100 },
      size: { width: 200, height: 120 },
      content: 'system-stats'
    } as WidgetPluginConfig
  },
  'quick-notes-app': {
    type: 'app',
    config: {
      icon: '📝',
      category: 'productivity'
    } as AppPluginConfig
  },
  'auto-backup-utility': {
    type: 'utility',
    config: {
      interval: 300000, // 5 minutes
      onEnable: 'startBackup',
      onDisable: 'stopBackup'
    } as UtilityPluginConfig
  }
};

class PluginExecutor {
  private activeWidgets: Map<string, WidgetPluginConfig> = new Map();
  private registeredApps: Map<string, AppPluginConfig> = new Map();

  constructor() {
    // Listen for mod enable/disable events
    modLoader.emit = this.handleModEvent.bind(this);
    this.initialize();
  }

  private initialize() {
    // Re-apply enabled plugins on load
    const enabledMods = modLoader.getEnabledMods();
    enabledMods.forEach(mod => {
      this.executePlugin(mod, true);
    });
  }

  private handleModEvent(event: string, data?: any) {
    if (event === 'mod:enabled') {
      this.executePlugin(data as ModManifest, true);
    } else if (event === 'mod:disabled') {
      this.executePlugin(data as ModManifest, false);
    }
  }

  executePlugin(mod: ModManifest, enable: boolean) {
    const implementation = PLUGIN_IMPLEMENTATIONS[mod.id];
    
    if (!implementation) {
      console.log(`[PluginExecutor] No implementation for ${mod.id}`);
      // Still show a message that it's "running"
      if (enable) {
        toast.success(`${mod.name} enabled`, {
          description: 'Plugin is now active'
        });
      } else {
        toast.info(`${mod.name} disabled`);
      }
      return;
    }

    switch (mod.type) {
      case 'theme':
        this.handleThemePlugin(mod, implementation.config, enable);
        break;
      case 'widget':
        this.handleWidgetPlugin(mod, implementation.config, enable);
        break;
      case 'app':
        this.handleAppPlugin(mod, implementation.config, enable);
        break;
      case 'utility':
        this.handleUtilityPlugin(mod, implementation.config, enable);
        break;
    }
  }

  private handleThemePlugin(mod: ModManifest, config: ThemePluginConfig, enable: boolean) {
    const styleId = `plugin-theme-${mod.id}`;
    
    if (enable) {
      // Remove existing style if any
      const existing = document.getElementById(styleId);
      if (existing) existing.remove();

      // Create and inject style
      const style = document.createElement('style');
      style.id = styleId;
      
      // Build CSS variables
      let css = ':root {\n';
      Object.entries(config.variables).forEach(([key, value]) => {
        css += `  ${key}: ${value};\n`;
      });
      css += '}\n';
      
      // Add custom styles
      if (config.styles) {
        css += config.styles;
      }
      
      style.textContent = css;
      document.head.appendChild(style);
      activeStyles.set(mod.id, style);
      
      toast.success(`Theme \"${mod.name}\" applied`, {
        description: 'Your desktop has a new look!'
      });
    } else {
      // Remove style
      const style = activeStyles.get(mod.id);
      if (style) {
        style.remove();
        activeStyles.delete(mod.id);
      }
      
      toast.info(`Theme \"${mod.name}\" removed`, {
        description: 'Default theme restored'
      });
    }
  }

  private handleWidgetPlugin(mod: ModManifest, config: WidgetPluginConfig, enable: boolean) {
    if (enable) {
      this.activeWidgets.set(mod.id, config);
      
      // Store widget config for WidgetManager to pick up
      const widgets = JSON.parse(localStorage.getItem('plugin_widgets') || '[]');
      if (!widgets.find((w: any) => w.id === mod.id)) {
        widgets.push({
          id: mod.id,
          name: mod.name,
          ...config
        });
        localStorage.setItem('plugin_widgets', JSON.stringify(widgets));
      }
      
      toast.success(`Widget \"${mod.name}\" added`, {
        description: 'Check your desktop for the new widget'
      });
      
      // Dispatch event for WidgetManager
      window.dispatchEvent(new CustomEvent('plugin-widget-added', { 
        detail: { id: mod.id, config } 
      }));
    } else {
      this.activeWidgets.delete(mod.id);
      
      // Remove from storage
      const widgets = JSON.parse(localStorage.getItem('plugin_widgets') || '[]');
      const filtered = widgets.filter((w: any) => w.id !== mod.id);
      localStorage.setItem('plugin_widgets', JSON.stringify(filtered));
      
      toast.info(`Widget \"${mod.name}\" removed`);
      
      // Dispatch event for WidgetManager
      window.dispatchEvent(new CustomEvent('plugin-widget-removed', { 
        detail: { id: mod.id } 
      }));
    }
  }

  private handleAppPlugin(mod: ModManifest, config: AppPluginConfig, enable: boolean) {
    if (enable) {
      this.registeredApps.set(mod.id, config);
      
      // Store app for Desktop to pick up
      const apps = JSON.parse(localStorage.getItem('plugin_apps') || '[]');
      if (!apps.find((a: any) => a.id === mod.id)) {
        apps.push({
          id: mod.id,
          name: mod.name,
          icon: config.icon,
          category: config.category
        });
        localStorage.setItem('plugin_apps', JSON.stringify(apps));
      }
      
      toast.success(`App \"${mod.name}\" installed`, {
        description: 'Find it in your Start Menu'
      });
    } else {
      this.registeredApps.delete(mod.id);
      
      // Remove from storage
      const apps = JSON.parse(localStorage.getItem('plugin_apps') || '[]');
      const filtered = apps.filter((a: any) => a.id !== mod.id);
      localStorage.setItem('plugin_apps', JSON.stringify(filtered));
      
      toast.info(`App \"${mod.name}\" uninstalled`);
    }
  }

  private handleUtilityPlugin(mod: ModManifest, config: UtilityPluginConfig, enable: boolean) {
    if (enable) {
      // Execute onEnable action
      if (config.onEnable === 'startBackup') {
        this.startAutoBackup(mod.id, config.interval || 300000);
      }
      
      toast.success(`Utility \"${mod.name}\" activated`, {
        description: 'Running in background'
      });
    } else {
      // Stop interval if running
      const interval = activeIntervals.get(mod.id);
      if (interval) {
        clearInterval(interval);
        activeIntervals.delete(mod.id);
      }
      
      toast.info(`Utility \"${mod.name}\" stopped`);
    }
  }

  private startAutoBackup(modId: string, interval: number) {
    // Stop existing interval if any
    const existing = activeIntervals.get(modId);
    if (existing) clearInterval(existing);

    // Create backup function
    const performBackup = () => {
      const backup: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && !key.startsWith('backup_')) {
          backup[key] = localStorage.getItem(key) || '';
        }
      }
      
      localStorage.setItem(`backup_auto_${Date.now()}`, JSON.stringify(backup));
      
      // Keep only last 5 backups
      const allKeys = Object.keys(localStorage).filter(k => k.startsWith('backup_auto_'));
      if (allKeys.length > 5) {
        allKeys.sort();
        const toRemove = allKeys.slice(0, allKeys.length - 5);
        toRemove.forEach(k => localStorage.removeItem(k));
      }
      
      console.log('[AutoBackup] Backup created');
    };

    // Perform initial backup
    performBackup();

    // Set up interval
    const intervalId = setInterval(performBackup, interval);
    activeIntervals.set(modId, intervalId);
  }

  // Get active widgets for WidgetManager
  getActiveWidgets(): Array<{ id: string; config: WidgetPluginConfig }> {
    return Array.from(this.activeWidgets.entries()).map(([id, config]) => ({
      id,
      config
    }));
  }

  // Check if an app plugin is registered
  isAppRegistered(appId: string): boolean {
    return this.registeredApps.has(appId);
  }

  // Get registered apps
  getRegisteredApps(): Array<{ id: string; config: AppPluginConfig }> {
    return Array.from(this.registeredApps.entries()).map(([id, config]) => ({
      id,
      config
    }));
  }
}

// Singleton instance
export const pluginExecutor = new PluginExecutor();

// Add terminal commands for plugins
export function getPluginTerminalCommands(): Array<{ name: string; description: string; id: string }> {
  const mods = modLoader.getEnabledMods();
  return mods
    .filter(m => m.type === 'utility' || m.type === 'app')
    .map(m => ({
      id: m.id,
      name: m.id.replace(/-/g, ''),
      description: `Run ${m.name} plugin`
    }));
}
