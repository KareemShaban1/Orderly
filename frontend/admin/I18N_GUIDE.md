# Multi-Language Support Guide

## Overview

The admin frontend now supports multiple languages (English and Arabic) with RTL (Right-to-Left) support for Arabic.

## How to Use Translations

### 1. Import the translation hook

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('nav.dashboard')}</h1>;
}
```

### 2. Translation Keys

Translation keys are organized by feature area:
- `common.*` - Common UI elements (buttons, labels, etc.)
- `nav.*` - Navigation items
- `auth.*` - Authentication related
- `dashboard.*` - Dashboard page
- `branches.*` - Branches management
- `menu.*` - Menu management
- `orders.*` - Orders management
- `pos.*` - POS module
- `analytics.*` - Analytics page
- `settings.*` - Settings page
- `superAdmin.*` - Super admin features

### 3. Example Usage

```tsx
import { useTranslation } from 'react-i18next';

function OrdersPage() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('orders.title')}</h1>
      <button>{t('common.save')}</button>
      <p>{t('orders.noOrders')}</p>
    </div>
  );
}
```

### 4. Language Switcher

The language switcher is already integrated into:
- Login page (top right)
- Layout header (next to user info)

Users can switch between English (EN) and Arabic (AR) at any time.

### 5. RTL Support

When Arabic is selected:
- Document direction automatically changes to RTL
- RTL class is added to the HTML element
- Tailwind's RTL utilities can be used: `rtl:space-x-reverse`, `rtl:text-right`, etc.

### 6. Adding New Translations

1. Add the key to `src/i18n/locales/en.json`
2. Add the Arabic translation to `src/i18n/locales/ar.json`
3. Use the key in your component with `t('your.key')`

### 7. Language Context

If you need to check the current language or RTL status:

```tsx
import { useLanguage } from '../contexts/LanguageContext';

function MyComponent() {
  const { currentLanguage, isRTL, changeLanguage } = useLanguage();
  
  // currentLanguage: 'en' | 'ar'
  // isRTL: boolean
  // changeLanguage: (lang: string) => void
}
```

## Files Structure

```
frontend/admin/src/
├── i18n/
│   ├── config.ts          # i18n configuration
│   └── locales/
│       ├── en.json        # English translations
│       └── ar.json        # Arabic translations
├── contexts/
│   └── LanguageContext.tsx # Language context provider
└── components/
    └── LanguageSwitcher.tsx # Language switcher component
```

## Next Steps

To add translations to other pages:
1. Import `useTranslation` hook
2. Replace hardcoded strings with `t('key')` calls
3. Add missing keys to translation files if needed

## Notes

- Language preference is saved in localStorage
- The system detects browser language on first visit
- Default language is English if no preference is set










