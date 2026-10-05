'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light';

export type ThemePresetKey =
  | 'nova'
  | 'professional'
  | 'ocean'
  | 'forest'
  | 'violet'
  | 'custom';

export type SidebarStyle = 'default' | 'subtle' | 'glass';
export type SurfaceStyle = 'flat' | 'bordered' | 'elevated';
export type BorderStrength = 'subtle' | 'medium' | 'strong';
export type RadiusOption = 'compact' | 'medium' | 'rounded';

export interface BrandColors {
  primary: string;
  accent: string;
  ai: string;
}

export interface InterfaceCustomization {
  sidebarStyle: SidebarStyle;
  surfaceStyle: SurfaceStyle;
  borderStrength: BorderStrength;
  radius: RadiusOption;
}

export interface ThemePresetDefinition {
  key: ThemePresetKey;
  name: string;
  description: string;
  brand: BrandColors;
  interface: InterfaceCustomization;
}

export interface DerivedSemanticTokens {
  bg: string;
  sidebar: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  textInverse: string;

  primary: string;
  primaryHover: string;
  primaryActive: string;
  primarySoft: string;
  primaryBorder: string;
  primaryForeground: string;
  focusRing: string;

  accent: string;
  accentSoft: string;

  ai: string;
  aiHover: string;
  aiSoft: string;
  aiBorder: string;
  aiText: string;
  aiForeground: string;

  success: string;
  successSoft: string;
  successBorder: string;
  successForeground: string;

  warning: string;
  warningSoft: string;
  warningBorder: string;
  warningForeground: string;

  danger: string;
  dangerSoft: string;
  dangerBorder: string;
  dangerForeground: string;

  info: string;
  infoSoft: string;
  infoBorder: string;
  infoForeground: string;

  radius: string;
}

export const THEME_PRESETS: Record<Exclude<ThemePresetKey, 'custom'>, ThemePresetDefinition> = {
  nova: {
    key: 'nova',
    name: 'Nova Default',
    description: 'Terracotta & Muted Olive',
    brand: {
      primary: '#C85A3F',
      accent: '#68745A',
      ai: '#8B5CF6',
    },
    interface: {
      sidebarStyle: 'default',
      surfaceStyle: 'bordered',
      borderStrength: 'subtle',
      radius: 'medium',
    },
  },
  professional: {
    key: 'professional',
    name: 'Professional Slate',
    description: 'Corporate Slate Blue & Sky',
    brand: {
      primary: '#1E40AF',
      accent: '#0284C7',
      ai: '#7C3AED',
    },
    interface: {
      sidebarStyle: 'subtle',
      surfaceStyle: 'bordered',
      borderStrength: 'medium',
      radius: 'compact',
    },
  },
  ocean: {
    key: 'ocean',
    name: 'Ocean Breeze',
    description: 'Teal & Deep Cyan',
    brand: {
      primary: '#0284C7',
      accent: '#0D9488',
      ai: '#6366F1',
    },
    interface: {
      sidebarStyle: 'default',
      surfaceStyle: 'bordered',
      borderStrength: 'subtle',
      radius: 'medium',
    },
  },
  forest: {
    key: 'forest',
    name: 'Forest Emerald',
    description: 'Emerald & Sage',
    brand: {
      primary: '#059669',
      accent: '#65A30D',
      ai: '#7C3AED',
    },
    interface: {
      sidebarStyle: 'default',
      surfaceStyle: 'bordered',
      borderStrength: 'subtle',
      radius: 'rounded',
    },
  },
  violet: {
    key: 'violet',
    name: 'Royal Violet',
    description: 'Deep Violet & Lavender',
    brand: {
      primary: '#7C3AED',
      accent: '#A855F7',
      ai: '#EC4899',
    },
    interface: {
      sidebarStyle: 'default',
      surfaceStyle: 'bordered',
      borderStrength: 'subtle',
      radius: 'rounded',
    },
  },
};

// Helper: Convert HEX to RGBA
export function hexToRgba(hex: string, alpha: number): string {
  if (!hex || typeof hex !== 'string') return `rgba(99, 102, 241, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper: Convert HEX to RGB object
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let cleanHex = (hex || '#6366F1').replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return { r: 99, g: 102, b: 241 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Helper: Calculate relative luminance according to W3C WCAG 2.1
export function calculateLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Helper: Contrast ratio between two hex colors
export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Helper: Determine high-contrast foreground text for any background
export function calculateAccessibleForeground(bgHex: string): string {
  const contrastWithWhite = getContrastRatio(bgHex, '#FFFFFF');
  return contrastWithWhite >= 3.0 ? '#FFFFFF' : '#0F172A';
}

// Helper: Adjust color lightness
export function adjustLightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (val: number) => Math.min(255, Math.max(0, val));
  const newR = clamp(r + amount);
  const newG = clamp(g + amount);
  const newB = clamp(b + amount);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

// Core Derivation Engine: Turns brand & interface inputs into full semantic tokens
export function deriveSemanticTokens(
  brand: BrandColors,
  interfaceOpt: InterfaceCustomization
): DerivedSemanticTokens {
  const primary = brand.primary || '#C85A3F';
  const accent = brand.accent || '#68745A';
  const ai = brand.ai || '#8B5CF6';

  const radiusMap = {
    compact: '4px',
    medium: '8px',
    rounded: '12px',
  };
  const radius = radiusMap[interfaceOpt.radius] || '8px';

  return {
    bg: '#F7F5F0',
    sidebar: '#EFECE6',
    surface: '#FFFFFF',
    surfaceMuted: '#F3EFE7',
    surfaceElevated: '#FFFFFF',
    border: '#E6E1D8',
    borderSubtle: '#EEEAE2',
    borderStrong: '#D1C9BC',

    // High-contrast, sharp, modern text
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    textDisabled: '#94A3B8',
    textInverse: '#FFFFFF',

    // Primary accent derived roles
    primary: primary,
    primaryHover: adjustLightness(primary, -15),
    primaryActive: adjustLightness(primary, -25),
    primarySoft: hexToRgba(primary, 0.08),
    primaryBorder: hexToRgba(primary, 0.22),
    primaryForeground: calculateAccessibleForeground(primary),
    focusRing: hexToRgba(primary, 0.35),

    // Secondary accent derived roles
    accent: accent,
    accentSoft: hexToRgba(accent, 0.10),

    // AI derived roles
    ai: ai,
    aiHover: adjustLightness(ai, -15),
    aiSoft: hexToRgba(ai, 0.10),
    aiBorder: hexToRgba(ai, 0.22),
    aiText: '#6D28D9',
    aiForeground: '#FFFFFF',

    // FIXED Semantic status colors
    success: '#68745A',
    successSoft: 'rgba(104, 116, 90, 0.12)',
    successBorder: 'rgba(104, 116, 90, 0.25)',
    successForeground: '#4A543F',

    warning: '#D97706',
    warningSoft: 'rgba(217, 119, 6, 0.10)',
    warningBorder: 'rgba(217, 119, 6, 0.25)',
    warningForeground: '#B45309',

    danger: '#DC2626',
    dangerSoft: 'rgba(220, 38, 38, 0.10)',
    dangerBorder: 'rgba(220, 38, 38, 0.25)',
    dangerForeground: '#991B1B',

    info: '#0284C7',
    infoSoft: 'rgba(2, 132, 199, 0.10)',
    infoBorder: 'rgba(2, 132, 199, 0.25)',
    infoForeground: '#0369A1',

    radius: radius,
  };
}

// Apply derived semantic tokens directly to the DOM root as CSS custom properties
export function applyThemeToDOM(
  presetKey: ThemePresetKey,
  customBrand?: BrandColors,
  customInterface?: InterfaceCustomization
) {
  if (typeof document === 'undefined') return;

  const basePreset = THEME_PRESETS[presetKey === 'custom' ? 'nova' : presetKey] || THEME_PRESETS.nova;

  const brand: BrandColors = {
    primary: customBrand?.primary || basePreset.brand.primary,
    accent: customBrand?.accent || basePreset.brand.accent,
    ai: customBrand?.ai || basePreset.brand.ai,
  };

  const interfaceOpt: InterfaceCustomization = {
    sidebarStyle: customInterface?.sidebarStyle || basePreset.interface.sidebarStyle,
    surfaceStyle: customInterface?.surfaceStyle || basePreset.interface.surfaceStyle,
    borderStrength: customInterface?.borderStrength || basePreset.interface.borderStrength,
    radius: customInterface?.radius || basePreset.interface.radius,
  };

  const tokens = deriveSemanticTokens(brand, interfaceOpt);
  const root = document.documentElement;

  root.style.setProperty('--nova-bg', tokens.bg);
  root.style.setProperty('--nova-sidebar', tokens.sidebar);
  root.style.setProperty('--nova-surface', tokens.surface);
  root.style.setProperty('--nova-elevated', tokens.surfaceElevated);
  root.style.setProperty('--nova-deep', tokens.surfaceMuted);
  root.style.setProperty('--nova-border', tokens.border);
  root.style.setProperty('--nova-border-subtle', tokens.borderSubtle);
  root.style.setProperty('--nova-border-strong', tokens.borderStrong);

  root.style.setProperty('--nova-text-primary', tokens.textPrimary);
  root.style.setProperty('--nova-text-secondary', tokens.textSecondary);
  root.style.setProperty('--nova-text-muted', tokens.textMuted);
  root.style.setProperty('--nova-text-disabled', tokens.textDisabled);
  root.style.setProperty('--nova-text-inverse', tokens.textInverse);

  root.style.setProperty('--nova-accent', tokens.primary);
  root.style.setProperty('--nova-accent-hover', tokens.primaryHover);
  root.style.setProperty('--nova-accent-subtle', tokens.primarySoft);
  root.style.setProperty('--nova-accent-border', tokens.primaryBorder);
  root.style.setProperty('--nova-accent-text', tokens.primary);
  root.style.setProperty('--nova-accent-foreground', tokens.primaryForeground);

  // Sync legacy mapping tokens so buttons & components throughout workspace adapt immediately
  root.style.setProperty('--color-accent', tokens.primary);
  root.style.setProperty('--color-accent-hover', tokens.primaryHover);
  root.style.setProperty('--color-accent-subtle', tokens.primarySoft);
  root.style.setProperty('--color-accent-border', tokens.primaryBorder);

  root.style.setProperty('--nova-ai', tokens.ai);
  root.style.setProperty('--nova-ai-subtle', tokens.aiSoft);
  root.style.setProperty('--nova-ai-border', tokens.aiBorder);
  root.style.setProperty('--nova-ai-text', tokens.aiText);
  root.style.setProperty('--nova-ai-foreground', tokens.aiForeground);

  root.style.setProperty('--nova-success', tokens.success);
  root.style.setProperty('--nova-success-subtle', tokens.successSoft);
  root.style.setProperty('--nova-success-border', tokens.successBorder);
  root.style.setProperty('--nova-success-text', tokens.successForeground);

  root.style.setProperty('--nova-warning', tokens.warning);
  root.style.setProperty('--nova-warning-subtle', tokens.warningSoft);
  root.style.setProperty('--nova-warning-border', tokens.warningBorder);
  root.style.setProperty('--nova-warning-text', tokens.warningForeground);

  root.style.setProperty('--nova-danger', tokens.danger);
  root.style.setProperty('--nova-danger-subtle', tokens.dangerSoft);
  root.style.setProperty('--nova-danger-border', tokens.dangerBorder);
  root.style.setProperty('--nova-danger-text', tokens.dangerForeground);

  root.style.setProperty('--nova-info', tokens.info);
  root.style.setProperty('--nova-info-subtle', tokens.infoSoft);
  root.style.setProperty('--nova-info-border', tokens.infoBorder);
  root.style.setProperty('--nova-info-text', tokens.infoForeground);

  root.style.setProperty('--radius-md', tokens.radius);
}

const LOCAL_STORAGE_KEY = 'nova_active_workspace_theme';

interface ThemeContextType {
  themePreset: ThemePresetKey;
  brandColors: BrandColors;
  interfaceCustomization: InterfaceCustomization;
  setThemePreset: (preset: ThemePresetKey) => void;
  setCustomBrand: (brand: Partial<BrandColors>) => void;
  setCustomInterface: (interfaceOpt: Partial<InterfaceCustomization>) => void;
  resetToDefault: () => void;
  applyTheme: () => void;
  isDirty: boolean;
  derivedTokens: DerivedSemanticTokens;
}

const defaultBrand: BrandColors = THEME_PRESETS.nova.brand;
const defaultInterface: InterfaceCustomization = THEME_PRESETS.nova.interface;

const ThemeContext = createContext<ThemeContextType>({
  themePreset: 'nova',
  brandColors: defaultBrand,
  interfaceCustomization: defaultInterface,
  setThemePreset: () => {},
  setCustomBrand: () => {},
  setCustomInterface: () => {},
  resetToDefault: () => {},
  applyTheme: () => {},
  isDirty: false,
  derivedTokens: deriveSemanticTokens(defaultBrand, defaultInterface),
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreset, setThemePresetState] = useState<ThemePresetKey>('nova');
  const [brandColors, setBrandColorsState] = useState<BrandColors>(defaultBrand);
  const [interfaceCustomization, setInterfaceCustomizationState] = useState<InterfaceCustomization>(defaultInterface);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.themePreset) {
          const preset = parsed.themePreset as ThemePresetKey;
          const brand = parsed.brandColors || (THEME_PRESETS[preset === 'custom' ? 'nova' : preset] || THEME_PRESETS.nova).brand;
          const interfaceOpt = parsed.interfaceCustomization || (THEME_PRESETS[preset === 'custom' ? 'nova' : preset] || THEME_PRESETS.nova).interface;

          setThemePresetState(preset);
          setBrandColorsState(brand);
          setInterfaceCustomizationState(interfaceOpt);
          applyThemeToDOM(preset, brand, interfaceOpt);
          return;
        }
      }
    } catch {
      // Fallback to default
    }
    applyThemeToDOM('nova', defaultBrand, defaultInterface);
  }, []);

  const setThemePreset = (preset: ThemePresetKey) => {
    setThemePresetState(preset);
    setIsDirty(true);
    if (preset !== 'custom') {
      const presetDef = THEME_PRESETS[preset] || THEME_PRESETS.nova;
      setBrandColorsState(presetDef.brand);
      setInterfaceCustomizationState(presetDef.interface);
      applyThemeToDOM(preset, presetDef.brand, presetDef.interface);
    }
  };

  const setCustomBrand = (partialBrand: Partial<BrandColors>) => {
    setThemePresetState('custom');
    setIsDirty(true);
    const updatedBrand = { ...brandColors, ...partialBrand };
    setBrandColorsState(updatedBrand);
    applyThemeToDOM('custom', updatedBrand, interfaceCustomization);
  };

  const setCustomInterface = (partialInterface: Partial<InterfaceCustomization>) => {
    setThemePresetState('custom');
    setIsDirty(true);
    const updatedInterface = { ...interfaceCustomization, ...partialInterface };
    setInterfaceCustomizationState(updatedInterface);
    applyThemeToDOM('custom', brandColors, updatedInterface);
  };

  const applyTheme = () => {
    applyThemeToDOM(themePreset, brandColors, interfaceCustomization);
    setIsDirty(false);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          themePreset,
          brandColors,
          interfaceCustomization,
        })
      );
    } catch (e) {
      console.error('Failed to persist theme to localStorage', e);
    }
  };

  const resetToDefault = () => {
    setThemePresetState('nova');
    setBrandColorsState(THEME_PRESETS.nova.brand);
    setInterfaceCustomizationState(THEME_PRESETS.nova.interface);
    setIsDirty(false);
    applyThemeToDOM('nova', THEME_PRESETS.nova.brand, THEME_PRESETS.nova.interface);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {}
  };

  const derivedTokens = deriveSemanticTokens(brandColors, interfaceCustomization);

  return (
    <ThemeContext.Provider
      value={{
        themePreset,
        brandColors,
        interfaceCustomization,
        setThemePreset,
        setCustomBrand,
        setCustomInterface,
        resetToDefault,
        applyTheme,
        isDirty,
        derivedTokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
