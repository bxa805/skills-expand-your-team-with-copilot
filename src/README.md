# Mergington High School Activities

A super simple website application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for activities
- Share activities with friends using Facebook, WhatsApp, or Copy link without
  logging in. Supported devices also offer a native Share button.
- Shared links highlight the selected activity. If automatic copying is
  unavailable, a selectable link is shown for manual copying.

## Development Guide

For detailed setup and development instructions, please refer to our [Development Guide](../docs/how-to-develop.md).

### Sharing checks

With Node.js 22 or newer, run `node --test src/tests/sharing.test.mjs` from the
repository root to check sharing links, clipboard fallbacks, and device sharing.
