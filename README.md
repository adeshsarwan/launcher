# Smart Launcher

A customizable Android launcher built with Expo and React Native. It combines a calm home screen with app search, health tracking, weather, news, short-drama reels, notes, QR scanning, a flashlight, and PDF creation.

## Development

```bash
pnpm install
pnpm --filter @workspace/smart-launcher run typecheck
```

Run the Expo app through the configured Replit workflow or the package's `dev` script with the required Expo environment variables.

## API integration

External Astrology, Weather, and News credentials must remain server-side. Add their API contracts to `lib/api-spec/openapi.yaml`, implement proxy routes in `artifacts/api-server`, regenerate the shared API client, and call those generated hooks from the mobile app.