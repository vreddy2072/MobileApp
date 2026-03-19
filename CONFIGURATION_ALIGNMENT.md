# MobileTemplate Configuration Alignment with RemindBro

This document tracks how MobileTemplate is aligned with RemindBro's proven working configuration to avoid environment setup issues.

## Key Principle

**MobileTemplate should match RemindBro's working configuration exactly** for all core dependencies and build settings. This ensures that projects built from MobileTemplate will work without environment debugging.

## Configuration Comparison

### ✅ Aligned Configurations

| Component | RemindBro | MobileTemplate | Status |
|-----------|-----------|----------|--------|
| Expo SDK | 54.0.12 | 54.0.12 | ✅ Match |
| React Native | 0.81.4 | 0.81.4 | ✅ Match |
| React | 19.1.0 | 19.1.0 | ✅ Match |
| react-native-reanimated | ~4.1.1 | ~4.1.1 | ✅ Match |
| react-native-worklets | ^0.5.1 | ^0.5.1 | ✅ Match (real npm package, not stub) |
| NativeWind | ^4.1.23 | ^4.1.23 | ✅ Match |
| iOS deployment target | 15.1 | 15.1 | ✅ Match |
| New Architecture | Enabled | Enabled | ✅ Match |
| babel.config.js | react-native-worklets/plugin | react-native-worklets/plugin | ✅ Match |
| metro.config.js | Same config | Same config | ✅ Match |
| package.json overrides | lightningcss only | lightningcss only | ✅ Match |

### ⚠️ Differences (Intentional)

| Component | RemindBro | MobileTemplate | Reason |
|-----------|-----------|----------------|--------|
| Dependencies | Many app-specific | Minimal core only | MobileTemplate is stripped down |
| Scripts | Includes test scripts | Basic scripts only | MobileTemplate is minimal |
| app.json plugins | Many plugins | Core plugins only | MobileTemplate is minimal |

## Critical Dependencies

These dependencies **must match** RemindBro exactly:

```json
{
  "expo": "54.0.12",
  "react-native": "0.81.4",
  "react": "19.1.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-worklets": "^0.5.1",
  "nativewind": "^4.1.23"
}
```

## Build Configuration

### iOS Build Settings
- **deploymentTarget**: `15.1` (must match)
- **newArchEnabled**: `true` (must match)
- **excludeArchitectures**: `[]` (must match)
- **flipper**: `false` (must match)

### Package.json Overrides
```json
{
  "overrides": {
    "lightningcss": "1.30.1"
  }
}
```

**Note**: Use the real `react-native-worklets@^0.5.1` npm package (NOT a local stub). RemindBro successfully builds with the real package which includes native iOS headers required by react-native-reanimated.

## When Adding New Projects

1. Copy MobileTemplate folder
2. Update `package.json` name and version
3. Update `app.json` with project-specific values
4. Run `npm install` (will install exact versions matching RemindBro)
5. Build should work without environment issues

## Verification Checklist

MobileTemplate validation status:
- [x] All critical dependencies match RemindBro versions
- [x] iOS build configuration matches RemindBro
- [x] babel.config.js matches RemindBro
- [x] metro.config.js matches RemindBro
- [x] package.json overrides match RemindBro
- [x] EAS iOS build succeeds (✅ Validated with NoteBro)
- [x] EAS iOS submit succeeds (✅ Validated with NoteBro)
- [x] eas.json includes submit configuration (✅ Added)

## History

### Issue #14: Worklets Configuration
- **Problem**: MobileTemplate used local stub, causing CocoaPods errors
- **Solution**: Aligned with RemindBro's use of real `react-native-worklets@^0.5.1` package
- **Date**: 2024-11-12
- **Status**: ✅ Resolved

### Issue #15: Missing Submit Profile in eas.json
- **Problem**: `eas submit` command failed with "Missing submit profile in eas.json: production"
- **Solution**: Added `submit` section to eas.json matching RemindBro's structure
- **Date**: 2024-11-12
- **Status**: ✅ Resolved
- **Note**: Each project needs to set their own `ascAppId` in the submit.production.ios section when ready to submit to App Store

### MobileTemplate Validation (2024-11-12)
- **Validated Through**: NoteBro app development and deployment
- **Results**: ✅ EAS iOS build successful, ✅ App Store submission successful
- **Status**: MobileTemplate is production-ready
- **Worklets-stub**: Removed from MobileTemplate (not needed - real npm package works)

