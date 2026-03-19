# MobileTemplate Issues and Fixes

This document tracks issues discovered while building NoteBro (a note-taking app) using the MobileTemplate foundation. These issues and their fixes should be incorporated into the MobileTemplate to improve its readiness for new projects.

## Issues Discovered

### 1. Missing Dependencies in package.json

**Issue**: When building NoteBro, we needed to add `zustand` and `@react-native-async-storage/async-storage` for state management and persistence, but they weren't in the template's package.json.

**Impact**: Developers need to manually add these common dependencies, which slows down project setup.

**Fix**: Add commonly used dependencies to the template's package.json:
- `zustand` - Popular state management library
- `@react-native-async-storage/async-storage` - Local storage/persistence

**Status**: ✅ Fixed in NoteBro, needs to be added to Template

**Recommendation**: Consider adding these to Template's package.json as optional but commonly needed dependencies, or document them in README as "commonly needed" dependencies.

---

### 2. Missing FloatingActionButton Component

**Issue**: Many apps need a floating action button (FAB) for primary actions, but the template doesn't include one.

**Impact**: Developers need to create this component from scratch for each project.

**Fix**: Created `FloatingActionButton.tsx` component in NoteBro.

**Status**: ✅ Created in NoteBro, should be added to Template

**Recommendation**: Add `src/components/FloatingActionButton.tsx` to Template with documentation on usage.

---

### 3. Navigation Types Need Better Documentation

**Issue**: When adding new screens to navigation, it wasn't immediately clear how to properly extend the RootStackParamList type.

**Impact**: TypeScript errors and confusion when adding modal screens or nested navigation.

**Fix**: Updated navigation types in NoteBro to include modal screens in RootStackParamList.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Add examples in README showing:
- How to add a modal screen to RootStackParamList
- How to add screens to stack navigators
- How to navigate to modal screens

---

### 4. StyledCard Default Background Color

**Issue**: StyledCard defaults to white background (`#FFFFFF`), which doesn't work well with dark theme.

**Impact**: Cards appear white in dark mode unless developers remember to pass `backgroundColor={theme.card}`.

**Fix**: Updated all StyledCard usages in NoteBro to explicitly pass `backgroundColor={theme.card}`.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Consider making StyledCard use theme context automatically, or update default to use theme.card. Alternatively, document this clearly in README.

---

### 5. No Example of State Management Pattern

**Issue**: Template doesn't show how to set up state management with persistence (common need).

**Impact**: Developers need to figure out state management patterns themselves.

**Fix**: Created noteStore.ts in NoteBro using zustand with AsyncStorage persistence.

**Status**: ✅ Created in NoteBro

**Recommendation**: Add a sample store example in Template (e.g., `src/state/exampleStore.ts`) or document the pattern in README with code examples.

---

### 6. Missing TextInput Styling Utilities

**Issue**: When creating forms, TextInput components need consistent styling that works with themes.

**Impact**: Developers need to manually style TextInputs for each form.

**Fix**: Created styled TextInputs in NoteEditScreen with theme-aware styling.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Consider adding a `StyledTextInput` component to Template, or add examples in README showing how to style TextInputs with theme.

---

### 7. Empty State Pattern Not Included

**Issue**: Many apps need empty states (when lists are empty), but template doesn't show this pattern.

**Impact**: Developers need to create empty state UI from scratch.

**Fix**: Created empty state in NotesListScreen.

**Status**: ✅ Created in NoteBro

**Recommendation**: Add an `EmptyState` component to Template, or document the pattern in README with examples.

---

### 8. Date Formatting Utilities Missing

**Issue**: Apps often need to format dates/timestamps for display, but no utilities are provided.

**Impact**: Developers need to create date formatting functions themselves.

**Fix**: Created date formatting function in NotesListScreen.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Add a `dateUtils.ts` file to Template with common date formatting functions, or document recommended libraries.

---

### 9. List Item Interaction Patterns

**Issue**: Template doesn't show how to handle list item interactions (press, swipe, long-press).

**Impact**: Developers need to figure out interaction patterns themselves.

**Fix**: Implemented press and delete interactions in NotesListScreen.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Add examples in README showing:
- How to handle list item press
- How to add action buttons to list items
- How to prevent event bubbling when needed

---

### 10. Auto-save Pattern Not Documented

**Issue**: Many apps need auto-save functionality, but template doesn't show this pattern.

**Impact**: Developers need to implement auto-save from scratch.

**Fix**: Implemented auto-save on blur in NoteEditScreen.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Document auto-save patterns in README or add example in sample screens.

---

### 11. Zustand Store Usage Pattern

**Issue**: When using zustand stores, destructuring all values at once can cause issues with function references and React hooks dependencies.

**Impact**: "Cannot call a class as a function" errors when calling store functions, especially in useEffect dependencies.

**Fix**: Use zustand selectors instead of destructuring:
```typescript
// ❌ Bad - can cause issues
const { notes, addNote, updateNote } = useNoteStore();

// ✅ Good - stable references
const notes = useNoteStore((state) => state.notes);
const addNote = useNoteStore((state) => state.addNote);
const updateNote = useNoteStore((state) => state.updateNote);
```

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Document zustand best practices in Template README, showing both patterns and explaining when to use selectors vs destructuring.

---

### 12. Deprecated String Methods

**Issue**: Using deprecated `substr()` method for generating IDs.

**Impact**: Deprecation warnings and potential future compatibility issues.

**Fix**: Replaced `substr()` with `substring()` in noteStore.ts.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: Ensure Template code uses modern JavaScript methods and document best practices.

---

### 13. Missing React Native Component Imports

**Issue**: Using React Native components (like `Text`) without importing them causes "Cannot call a class as a function" errors.

**Impact**: Runtime errors when components are used but not imported, especially confusing error messages.

**Fix**: Added missing `Text` import to NoteEditScreen.tsx.

**Status**: ✅ Fixed in NoteBro

**Recommendation**: 
- Add ESLint rule to catch missing imports
- Document common React Native components in README
- Consider creating a components barrel export file for common components

---

### 14. Worklets Package Configuration for iOS Builds

**Issue**: Initial attempt to use a local `worklets-stub` folder caused CocoaPods to fail finding `RNWorklets` podspec during EAS iOS builds. React Native Reanimated 4.1.0 requires `react-native-worklets/plugin` in babel.config.js.

**Impact**: EAS builds for iOS failed with "Unable to find a specification for `RNWorklets`" error.

**Root Cause**: Template/NoteBro deviated from RemindBro's working configuration. RemindBro uses the real `react-native-worklets@^0.5.1` npm package, not a local stub.

**Fix**: 
- **Aligned with RemindBro**: Changed from `"react-native-worklets": "file:./worklets-stub"` to `"react-native-worklets": "^0.5.1"` (real npm package)
- Removed `react-native.config.js` (not needed with real package)
- Removed worklets override from package.json overrides (only `lightningcss` override remains)
- babel.config.js already correctly references `react-native-worklets/plugin`
- metro.config.js already has correct resolver configuration

**Status**: ✅ Fixed - Template and NoteBro now match RemindBro's working configuration

**Confirmed**: RemindBro successfully deploys to iOS using the real `react-native-worklets@^0.5.1` npm package. The real package includes native iOS headers (`JSISerializer.h`) required by `react-native-reanimated` for compilation. 

**Final Resolution**: 
- ✅ Template now uses the real `react-native-worklets@^0.5.1` npm package (matching RemindBro)
- ✅ Removed `worklets-stub` folder from Template (not needed - real package works)
- ✅ NoteBro successfully built and submitted to App Store using this configuration
- ✅ Template validated and ready for production use

---

## Summary of Recommended Template Enhancements

### High Priority
1. ✅ Add `zustand` and `@react-native-async-storage/async-storage` to package.json
2. ✅ Add `FloatingActionButton` component
3. ✅ Add example state store with persistence pattern
4. ✅ Improve navigation documentation with modal screen examples
5. ✅ Add `StyledTextInput` component or document TextInput styling
6. ✅ Document zustand usage patterns (selectors vs destructuring)

### Medium Priority
7. ✅ Add `EmptyState` component
8. ✅ Add date formatting utilities
9. ✅ Document list interaction patterns
10. ✅ Improve StyledCard to use theme by default or document clearly

### Low Priority
11. ✅ Document auto-save patterns
12. ✅ Add more code examples to README
13. ✅ Ensure modern JavaScript methods are used (no deprecated APIs)

## Notes

- All issues were discovered during actual app development, ensuring they're real-world problems
- Fixes were implemented and tested in NoteBro before documenting here
- Template should be updated incrementally to avoid breaking existing projects
- Error "Cannot call a class as a function" was resolved by using zustand selectors instead of destructuring

## Date

Issues tracked: 2024-12-19
Project: NoteBro (Note-taking app built from Template)
