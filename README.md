# MageObsidian — Vite Build Harness

[![Latest Version](https://img.shields.io/packagist/v/mage-obsidian/component-modern-frontend.svg?style=flat-square)](https://packagist.org/packages/mage-obsidian/component-modern-frontend)
[![CI](https://github.com/mage-obsidian/component-modern-frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/mage-obsidian/component-modern-frontend/actions/workflows/ci.yml)
[![License](https://img.shields.io/packagist/l/mage-obsidian/component-modern-frontend.svg?style=flat-square)](https://packagist.org/packages/mage-obsidian/component-modern-frontend)

📚 [Documentation](https://mage-obsidian.jeanmarcos.dev/) · 🚀 [Live demo](https://mage-obsidian-demo.jeanmarcos.dev/) · 💬 [Discussions](https://github.com/mage-obsidian/module-modern-frontend/discussions)

The **entry point** to [MageObsidian](https://github.com/mage-obsidian/module-modern-frontend), a modern frontend for Magento 2 built on Vite, Tailwind CSS 4 and Vue. This Composer package ships the `vite/` build harness (`vite.config.js`, `package.json`) and maps it into your Magento root, pulling in the core module as a dependency.

## Installation

```bash
composer require mage-obsidian/component-modern-frontend
pnpm --prefix vite install
bin/magento setup:upgrade
bin/magento mage-obsidian:frontend:config --generate
```

Full guide: [Getting started](https://mage-obsidian.jeanmarcos.dev/getting-started/installation/).

## Usage

From the `vite/` directory created in your Magento root:

```bash
mage-obsidian:build-themes                                # build all themes
mage-obsidian:build-themes --theme <theme>                # build one theme
mage-obsidian:build-themes --theme <theme> --dev-server   # Vite dev server + HMR
```

The heavy lifting (theme inheritance, precompilation, JS interceptors) lives in the [`mage-obsidian` npm package](https://github.com/mage-obsidian/js-package-utils) that this harness imports.

## Support the project

If MageObsidian saves you time, consider [buying me a coffee](https://ko-fi.com/Q5Q816Z9WN). ❤️
