# Changelog - Android XML Layout Editor

## v2.14.0

### Feature: H5 to Android XML Converter
- **Convert H5 (HTML/CSS) to Android XML Layout** (`convertH5ToXml` command):
  - Parse complete HTML pages (including `<head>`, `<style>`, `<body>`)
  - Map HTML tags to Android components:
    - `div/section/article` → `LinearLayout`
    - `span/p/h1-h6` → `TextView`
    - `input` → `EditText` (with type mapping: password/email/number/phone/url)
    - `button` → `Button`
    - `img` → `ImageView`
    - `select` → `Spinner`
    - `ul/ol/li` → `LinearLayout` (list structure)
  - Map CSS properties to Android attributes:
    - `width/height` → `layout_width/layout_height` (supports px, %, vw, vh, rem)
    - `margin/padding` → `layout_margin/padding` (all directions)
    - `color` → `textColor`
    - `font-size` → `textSize` (px → sp conversion)
    - `font-weight` → `textStyle`
    - `background/background-color` → `background`
    - `display:none` → `visibility="gone"`
  - Support inline `style` attributes and `<style>` tag CSS rules
  - Support `id` → `@+id/`, `placeholder` → `hint`, `src` → `@drawable/`
  - Generate valid Android XML with proper `LinearLayout` root wrapper
- **Command**: `Ctrl+Shift+P` → "Android Layout Editor: Convert H5 to Android XML" (available when HTML file is open)
- **Output**: Creates `res/layout/{filename}.xml` and opens in Layout Editor

## v2.13.0

### Feature 1: XML Formatting & Refactoring
- **DocumentFormattingEditProvider** (`FmtProvider`): Register for XML files in `res/layout/`. Press Shift+Alt+F to format:
  - Normalize indentation to 4 spaces
  - Sort `android:` attributes alphabetically
  - Normalize self-closing tags for leaf elements
- **Commands**:
  - `formatDocument`: Format current XML layout file
  - `extractToString`: Extract selected text to `res/values/strings.xml`, replace with `@string/name`
  - `extractToDimen`: Extract selected dimension value to `res/values/dimens.xml`, replace with `@dimen/name`
  - `wrapWithLayout`: Wrap selected XML with chosen layout (LinearLayout/ConstraintLayout/FrameLayout/ScrollView)
  - `unwrapLayout`: Remove outer layout tag from selected XML

### Feature 2: Performance Analysis Panel
- **Webview-based performance panel** (`showPerformancePanel` command):
  - **Layout Depth**: Calculate and visualize max nesting depth with depth bars
  - **View Count Breakdown**: Count layouts vs views with percentage distribution
  - **Measure/Layout Pass Estimates**: Estimate measure/layout passes based on max depth
  - **Overdraw Analysis**: Detect background color overdraw warnings

### Feature 3: Resource Management Enhancement
- **Resource Autocomplete** (`RsrcProvider`): Scan workspace `res/` directory for `@drawable/`, `@layout/`, `@string/`, `@dimen/` references. Triggered after typing `@type/`.
- **Resource Preview Hover** (`HoverProvider`): Show resource type, filename, and value preview on hover for `@drawable/`, `@layout/`, `@string/`, `@dimen/` references.

## v2.12.0
- Visual layout editor with drag-and-drop design
- XML validation, lint & best practices
- Multi-file navigation (DocumentLinkProvider, DefinitionProvider, ReferenceProvider)
- Material 3 theme with seed color picker
- Responsive multi-screen preview
- Attribute completion and property editing
- Resource drag-drop support
- Layout bounds visualization
- Device preview presets
- Layout Inspector with depth indicators
- Code snippets & templates
- Export to image
- Accessibility checker
