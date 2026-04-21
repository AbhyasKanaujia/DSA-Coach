# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Sidebar navigation component with desktop and mobile responsive design
- Mobile drawer navigation with bottom sheet style
- Layout component for consistent page structure
- Lucide React icons for consistent cross-platform rendering
- `Settings` placeholder page at `/settings` showing user preferences
- Terminal-style breadcrumbs in the header (`~/dsa_coach/…`), rendered on mobile and desktop
- Real streak from `user.stats.streak`; active state derived from `lastActiveDate`
- Real user info (name, avatar initial) in the header avatar menu

### Changed

- Updated app name to "~/dsa_coach" with accent color on "~/"
- Mobile bottom bar with hamburger menu icon
- Unified `Sidebar` for mobile and desktop via responsive Tailwind;
- `AuthController.getProfile` returns the full sanitized user (matches login response)

### Fixed

- Base-element CSS moved into `@layer base` so Tailwind utilities win on `<button>`

## [0.0.0] - Initial Release

### Added

- Initial project setup with React, Vite, and Tailwind CSS
- Authentication flow with login/signup
- API layer with interceptors
- Basic routing structure with guards
- Placeholder pages for Dashboard, Review, Library, AddCard, Stats
- Testing infrastructure with Jest and React Testing Library
- MSW for API mocking
- OKLCH color system for theming