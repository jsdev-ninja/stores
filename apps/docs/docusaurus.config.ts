import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Storebrix Docs',
  tagline: 'Single source of truth for the @jsdev-store platform',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://storebrix.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  baseUrl: '/',

  organizationName: 'jsdev-ninja',
  projectName: 'stores',

  onBrokenLinks: 'throw',

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'he'],
    localeConfigs: {
      en: {label: 'English', direction: 'ltr', htmlLang: 'en'},
      he: {label: 'עברית', direction: 'rtl', htmlLang: 'he'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/', // serve docs at the site root
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/jsdev-ninja/stores/tree/main/apps/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Storebrix Docs',
      logo: {
        alt: 'Storebrix Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/jsdev-ninja/stores',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Modules',
              to: '/modules/ledger',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Storebrix. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
