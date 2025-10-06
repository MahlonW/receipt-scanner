// Application configuration
export const APP_CONFIG = {
  // Application version - increment this when making breaking changes
  VERSION: '0.3.0',
  
  // Version compatibility settings
  VERSION_CHECK: {
    // Enable version checking
    ENABLED: true,
    
    // Show warning for minor version differences (e.g., 1.0.0 vs 1.1.0)
    WARN_ON_MINOR_DIFF: true,
    
    // Show error for major version differences (e.g., 1.0.0 vs 2.0.0)
    ERROR_ON_MAJOR_DIFF: true,
    
    // Allow users to proceed despite version mismatches
    ALLOW_OVERRIDE: true,
  },
  
  // Supported file formats
  SUPPORTED_FORMATS: {
    EXCEL: ['.xlsx', '.xls'],
    IMAGES: ['image/*'],
  },
  
  // Default settings
  DEFAULTS: {
    CURRENCY: 'Dollar',
    DATE_FORMAT: 'MM/DD/YYYY',
    TAX_RATE: 0.0,
    AUTO_CATEGORIZE: true,
    INCLUDE_DESCRIPTIONS: true,
    DUPLICATE_DETECTION: true,
    EXPORT_FORMAT: 'detailed',
  },
  
  // API settings
  API: {
    TIMEOUT: 30000, // 30 seconds
    MAX_RETRIES: 3,
  },
  
  // UI settings
  UI: {
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
  },
} as const;

// Version comparison utilities
export class VersionManager {
  /**
   * Parse version string into major, minor, patch numbers
   */
  static parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0,
    };
  }

  /**
   * Compare two version strings
   * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
   */
  static compareVersions(v1: string, v2: string): number {
    const parsed1 = this.parseVersion(v1);
    const parsed2 = this.parseVersion(v2);

    if (parsed1.major !== parsed2.major) {
      return parsed1.major - parsed2.major;
    }
    if (parsed1.minor !== parsed2.minor) {
      return parsed1.minor - parsed2.minor;
    }
    return parsed1.patch - parsed2.patch;
  }

  /**
   * Check if versions are compatible
   */
  static isCompatible(appVersion: string, fileVersion: string): {
    compatible: boolean;
    type: 'major' | 'minor' | 'patch' | 'same';
    message: string;
  } {
    const comparison = this.compareVersions(appVersion, fileVersion);
    const appParsed = this.parseVersion(appVersion);
    const fileParsed = this.parseVersion(fileVersion);

    // Same version
    if (comparison === 0) {
      return {
        compatible: true,
        type: 'same',
        message: 'Versions match perfectly',
      };
    }

    // Major version difference
    if (appParsed.major !== fileParsed.major) {
      return {
        compatible: false,
        type: 'major',
        message: `Major version mismatch: App v${appVersion} vs File v${fileVersion}. This may cause compatibility issues.`,
      };
    }

    // Minor version difference
    if (appParsed.minor !== fileParsed.minor) {
      return {
        compatible: false,
        type: 'minor',
        message: `Minor version difference: App v${appVersion} vs File v${fileVersion}. Some features may not work as expected.`,
      };
    }

    // Patch version difference
    return {
      compatible: true,
      type: 'patch',
      message: `Patch version difference: App v${appVersion} vs File v${fileVersion}. This should be fine.`,
    };
  }

  /**
   * Get version check requirements based on config
   */
  static shouldShowWarning(compatibility: ReturnType<typeof VersionManager.isCompatible>): boolean {
    if (!APP_CONFIG.VERSION_CHECK.ENABLED) return false;
    if (compatibility.compatible) return false;

    if (compatibility.type === 'major' && APP_CONFIG.VERSION_CHECK.ERROR_ON_MAJOR_DIFF) {
      return true;
    }
    if (compatibility.type === 'minor' && APP_CONFIG.VERSION_CHECK.WARN_ON_MINOR_DIFF) {
      return true;
    }

    return false;
  }
}

export default APP_CONFIG;
