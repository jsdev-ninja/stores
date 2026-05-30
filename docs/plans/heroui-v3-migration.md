# HeroUI v2 → v3 Migration — `apps/store`

> Branch: `chore/heroui-v3-migration` (off `main` @ `855a07d`)
> Authoritative sources: [Migration overview](https://heroui.com/docs/react/migration), [Full migration guide](https://heroui.com/docs/react/migration/full-migration), [Agent guide (full)](https://heroui.com/docs/react/migration/agent-guide-full), [Hooks migration](https://heroui.com/docs/react/migration/hooks), [Styling migration](https://heroui.com/docs/react/migration/styling), per-component pages under `/docs/react/migration/<component>`, [v3 release notes](https://heroui.com/docs/react/releases).

---

## 1. Summary

- **What:** Replace `@heroui/react ^2.8.0` (installed `2.8.7`) with v3 (`@heroui/react ^3.1.0` + `@heroui/styles ^3.1.0`) across 54 files in `apps/store`.
- **Why this is risky:** v3 is a paradigm rewrite, not a version bump — compound dot-notation everywhere (`Modal.Backdrop`, `Card.Content`, `Dropdown.Popover`, `Table.Content`, `Toast.Provider`); `useDisclosure` is replaced with `useOverlayState`; `classNames` slot prop is gone; v3 requires **React 19** and Tailwind v4 (we already have Tailwind v4, but React is still 18.2); `Image`, `Navbar`, `Snippet`, `User` are deleted (replace with native HTML); the `Button` API loses `color` and the v2 `variant` vocabulary (`solid|bordered|light|flat|faded|shadow`) — there are 127 `variant=` and 48 `color=` usages to rewrite.
- **How we sequence it:** one cross-cutting "config swap" commit puts the build into the deliberate broken state the official guide calls for. Then 7 wave commits convert files grouped by API risk (Button-only → Card → Table/Dropdown/Modal → AppBar rewrite → leftovers). Each wave aims for ≤8 files. Verification is `tsc` and `eslint`, **not** `vite build`, until the migration completes — per the official agent guide.
- **Critical pre-requisite:** **React must be upgraded to 19 BEFORE swapping HeroUI.** v3 will not install otherwise.
- **Reversible:** any time pre-merge via `git checkout main`. Mid-migration the dev server cannot run — that is expected.

## 2. Current state

### 2.1 Versions at branch root (`855a07d`)

| Package | Current | Target |
|---|---|---|
| `@heroui/react` | `^2.8.0` (installed `2.8.7`) | `^3.1.0` |
| `@heroui/styles` | — | `^3.1.0` (new) |
| `@heroui/theme` | (transitive only; not in `package.json`) | removed |
| `@heroui/button` | (transitive only; imported in `src/components/button.tsx`) | removed |
| `react`, `react-dom` | `^18.2.0` | `^19.0.0` |
| `tailwindcss` | `^4.0.0` | unchanged (already v4) |
| `react-aria-components` | `^1.2.0` | likely needs bump — v3 builds on v2 of RAC under the hood; verify peer at upgrade time |
| `framer-motion` | `^11.11.17` | **keep** — 6 app files import from `framer-motion` directly; v3 stops needing it as a peer but doesn't forbid us from keeping it for our own usage |

Files that import `framer-motion` (we are NOT removing this package):
- `apps/store/src/infra/modals/Base.tsx`
- `apps/store/src/components/FileDropzone/index.tsx`
- `apps/store/src/components/Modal/Modal.tsx`
- `apps/store/src/pages/store/ProfilePage/ProfilePage.tsx`
- `apps/store/src/pages/store/ProfilePage/ProfileForm.tsx`
- `apps/store/src/widgets/Modals/index.tsx`

### 2.2 CSS / theme infra (just landed @ `855a07d`)

`apps/store/src/index.css` (current):

```css
@import "tailwindcss";
@plugin './hero.ts';
@source '../../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
@custom-variant dark (&:is(.dark *));

@import "./themes/default.css";
```

`apps/store/src/hero.ts` (current):

```ts
import { heroui } from "@heroui/react";
export default heroui({
  layout: {},
});
```

`apps/store/src/themes/default.css` (current; only the HeroUI-adjacent bits — leave the rest):

```css
html body,
#root {
  min-height: 100dvh;
  --brand-primary: 262 83% 58%;   /* HSL triplet — our own variable, not consumed by HeroUI v2 or v3 */
}

@theme {
  /* Tailwind v4 compile-time tokens — independent of HeroUI */
  --color-hero: #ffffff;
  --color-hero-foreground: #0f172a;
  --shadow-card: ...;
}
```

Per-store overrides apply under `[data-store-theme="<id>"]` (set on `<html>` by `pages/store/StoreLayout.tsx`).

### 2.3 Provider call site

`apps/store/src/app/App.tsx`:

```tsx
import { HeroUIProvider, ToastProvider } from "@heroui/react";
...
<HeroUIProvider className="min-h-screen min-w-screen">
  <ToastProvider placement="top-center" />
  ...children...
</HeroUIProvider>
```

### 2.4 Inventory totals

- **55** files import from a HeroUI package (`/tmp/heroui-files.txt`).
- **54** of those import from `@heroui/react`; the 55th is `apps/store/src/hero.ts` itself, deleted in the setup commit.
- **1** imports from the sub-package `@heroui/button` (`apps/store/src/components/button.tsx`) — gets rewritten to `@heroui/react`.
- **3** files use `useDisclosure`: `AdminClientProfile.tsx`, `Orders/AdminOrderPickPage.tsx`, `Orders/AdminOrderPage.tsx`. All become `useOverlayState`.
- **127** v2-style `variant=` props and **48** v2-style `color=` props across Button/Chip/Alert/Spinner etc. — a sweep, not just imports.
- **117** `size=`/`radius=` prop occurrences — most `size=` survive, all `radius=` are removed (apply Tailwind `rounded-*`).
- Pages that exercise the heaviest v3 changes (compound rewrite): every Modal user (16 files), the AppBar (Navbar removal), all Card users (8 files), all Dropdown users (4 files), all Table users (12 files), all Select users (8 files).

---

## 3. v3 API delta — per component

> Each row captures only the components our codebase actually uses. v2 imports come from `@heroui/react`. v3 imports come from `@heroui/react` unless noted.

### 3.1 Renamed (still exists)

| v2 | v3 | Note |
|---|---|---|
| `Divider` | `Separator` | `orientation` survives; `radius`/`color` gone — use Tailwind |
| `Progress` | `ProgressBar` | compound (`ProgressBar.Track`/`Fill`/`Output`); `color="primary"` → `color="accent"` |
| `Textarea` | `TextArea` | capitalization change (PascalCase); no compound wrapper required for primitive use |
| `Autocomplete` + `AutocompleteItem` | `ComboBox` + `ListBox.Item` (closest behavior) **or** `Autocomplete` + `Autocomplete.Filter` + `ListBox.Item` (searchable-select) | Heavy rewrite (see §3.5) — most of our usages are "select with type-ahead" → use `ComboBox` |
| `NumberInput` | `NumberField` | compound (`NumberField.Group`/`Input`/`DecrementButton`/`IncrementButton`); `onValueChange` → `onChange` |
| `BreadcrumbItem` | `Breadcrumbs.Item` | nested under root |

### 3.2 Removed entirely (replace with native HTML + Tailwind)

| v2 | v3 replacement |
|---|---|
| `Image` | `<img>` with Tailwind classes. Migration of `radius`→`rounded-*`, `shadow`→`shadow-*`. We have **2** call sites: `components/FIleUpload/FileUpload.tsx`, plus implicit `<Image>` inside any custom card. |
| `Navbar` + `NavbarBrand` + `NavbarContent` + `NavbarItem` | `<nav>` / `<header>` / `<ul>` / `<li>` + Tailwind. Build a local `widgets/AppBar/AppBarShell.tsx` to keep markup encapsulated. **1** call site (`widgets/AppBar/index.tsx`) — 150-line rewrite. |
| `Snippet` | `<pre>` + `<code>` + `navigator.clipboard.writeText()` + `Button` + `Tooltip`. **1** call site (`widgets/AppBar/index.tsx`). |
| `User` | `<div className="inline-flex items-center gap-2"> <Avatar>...</Avatar> <span>name</span> </div>`. **2** call sites: `AdminUsersPage/index.tsx`, `Orders/AdminOrdersPage.tsx`. |

### 3.3 Compound-pattern rewrite (named exports replaced by dot-notation)

#### Modal — major rewrite (16 files)

**v2 shape:**

```tsx
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
const { isOpen, onOpen, onOpenChange } = useDisclosure();
<Button onPress={onOpen}>Open</Button>
<Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur" size="lg" scrollBehavior="inside">
  <ModalContent>
    {(onClose) => (
      <>
        <ModalHeader>Title</ModalHeader>
        <ModalBody>...</ModalBody>
        <ModalFooter><Button onPress={onClose}>Close</Button></ModalFooter>
      </>
    )}
  </ModalContent>
</Modal>
```

**v3 shape:**

```tsx
import { Modal, Button, useOverlayState } from "@heroui/react";
const state = useOverlayState();
<Modal state={state}>
  <Button onPress={state.open}>Open</Button>
  <Modal.Backdrop variant="blur">
    <Modal.Container size="lg" scroll="inside">
      <Modal.Dialog>
        <Modal.CloseTrigger />
        {({ close }) => (
          <>
            <Modal.Header><Modal.Heading>Title</Modal.Heading></Modal.Header>
            <Modal.Body>...</Modal.Body>
            <Modal.Footer><Button onPress={close}>Close</Button></Modal.Footer>
          </>
        )}
      </Modal.Dialog>
    </Modal.Container>
  </Modal.Backdrop>
</Modal>
```

Key prop moves: `backdrop` → `Modal.Backdrop` `variant`; `size`/`placement` → `Modal.Container`; `scrollBehavior` → `Modal.Container` `scroll`; `hideCloseButton` removed (use or omit `Modal.CloseTrigger`); `radius`/`shadow`/`motionProps`/`classNames` removed.

#### Card — 8 files

**v2:** `Card`, `CardHeader`, `CardBody`, `CardFooter` separate exports.

**v3:** `Card`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content` (replaces `CardBody`), `Card.Footer`. `isPressable` is gone — wrap content in `<button>`. `isHoverable`/`shadow`/`radius`/`isBlurred` → Tailwind.

```tsx
// v2
<Card isPressable shadow="sm" onPress={fn}>
  <CardBody>...</CardBody>
</Card>

// v3
<Card className="shadow-sm">
  <button type="button" className="w-full cursor-pointer text-left" onClick={fn}>
    <Card.Content>...</Card.Content>
  </button>
</Card>
```

#### Dropdown — 4 files

**v2:** `Dropdown`, `DropdownTrigger`, `DropdownMenu`, `DropdownItem`, `DropdownSection`.

**v3:** `Dropdown`, `Dropdown.Popover` **required wrapper**, `Dropdown.Menu`, `Dropdown.Item`, `Dropdown.Section`. `key` → `id`. Non-string `children` need `textValue`. `DropdownTrigger` is implicit (first child). `color="danger"` on an item → `variant="danger"`. `startContent` / `endContent` / `description` / `shortcut` props on items are gone — render children directly with `<Label>`, `<Description>`, `<Kbd slot="keyboard">`. `selectedIcon` → `Dropdown.ItemIndicator`. `showDivider` (Section) → separate `<Separator />`.

```tsx
// v2
<Dropdown>
  <DropdownTrigger><Button>Open</Button></DropdownTrigger>
  <DropdownMenu onAction={onAction}>
    <DropdownItem key="profile" startContent={<Icon/>}>Profile</DropdownItem>
  </DropdownMenu>
</Dropdown>

// v3
<Dropdown>
  <Button>Open</Button>
  <Dropdown.Popover>
    <Dropdown.Menu onAction={onAction}>
      <Dropdown.Item id="profile" textValue="Profile">
        <Icon />
        <Label>Profile</Label>
      </Dropdown.Item>
    </Dropdown.Menu>
  </Dropdown.Popover>
</Dropdown>
```

#### Select — 8 files

**v2:** `Select` + `SelectItem`, `selectedKeys`/`onSelectionChange`/`defaultSelectedKeys`, `label`/`description`/`errorMessage` as props.

**v3:** `Select` + child `Label` + `Select.Trigger` (with `Select.Value`/`Indicator`) + `Select.Popover` + `ListBox` + `ListBox.Item`. Props rename: `selectedKeys` → `value`, `onSelectionChange` → `onChange`, `defaultSelectedKeys` → `defaultValue`. `label`/`description`/`errorMessage` become sibling `<Label>`/`<Description>`/`<FieldError>` components. `color`/`size`/`radius`/`classNames` gone → Tailwind.

```tsx
// v2
<Select label="State" selectedKeys={selected} onSelectionChange={setSelected}>
  <SelectItem key="fl">Florida</SelectItem>
</Select>

// v3
<Select value={selected} onChange={setSelected}>
  <Label>State</Label>
  <Select.Trigger><Select.Value /><Select.Indicator /></Select.Trigger>
  <Select.Popover>
    <ListBox>
      <ListBox.Item id="fl" textValue="Florida">
        Florida
        <ListBox.ItemIndicator />
      </ListBox.Item>
    </ListBox>
  </Select.Popover>
</Select>
```

#### Table — 12 files

**v2:** `Table`, `TableHeader`, `TableColumn`, `TableBody`, `TableRow`, `TableCell` (named exports).

**v3:** `Table.ScrollContainer` → `Table.Content` (the actual `<table>`, receives selection/sort props) → `Table.Header`/`Column`/`Body`/`Row`/`Cell`/`Footer`. Optional `Table.ResizableContainer`, `Table.ColumnResizer`, `Table.LoadMore`.

```tsx
// v2
<Table>
  <TableHeader>
    <TableColumn>Name</TableColumn>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>Kate</TableCell></TableRow>
  </TableBody>
</Table>

// v3
<Table>
  <Table.ScrollContainer>
    <Table.Content aria-label="Members" className="min-w-[600px]">
      <Table.Header>
        <Table.Column isRowHeader>Name</Table.Column>
      </Table.Header>
      <Table.Body>
        <Table.Row><Table.Cell>Kate</Table.Cell></Table.Row>
      </Table.Body>
    </Table.Content>
  </Table.ScrollContainer>
</Table>
```

#### Tabs — 2 files

**v2:** `Tabs` + `Tab` named exports.

**v3:** `Tabs`, `Tabs.List` (inside `Tabs.ListContainer`), `Tabs.Tab` (each needs `id`, optional `Tabs.Indicator`), `Tabs.Panel` (matching `id`). `hideSeparator` removed — explicit `<Tabs.Separator />` if needed.

#### Toast — App.tsx + 3 call sites

**v2:** `<ToastProvider placement="top-center" />` + `addToast({ title, description, color, severity, timeout })`.

**v3:** `<Toast.Provider />` (placement set elsewhere — see open question in §8) + `toast()` function from `@heroui/react`. Helpers: `toast.success(title, { description })`, `toast.danger(...)`, `toast.warning(...)`, `toast.info(...)`. Variant rename: `error` → `danger`; `info` → `accent`.

```tsx
// v2
addToast({ title: "Saved", description: "All good", color: "success", timeout: 4000 });

// v3
toast.success("Saved", { description: "All good", timeout: 4000 });
```

#### Checkbox — 3 files

**v2:** `<Checkbox isSelected={x} onValueChange={fn}>Label text</Checkbox>` — flat.

**v3:** compound: `<Checkbox isSelected onChange>...<Checkbox.Control><Checkbox.Indicator/></Checkbox.Control><Checkbox.Content><Label>...</Label></Checkbox.Content></Checkbox>`. `onValueChange` → `onChange`. `color`/`size`/`radius` → Tailwind.

#### Tooltip — 2 files

**v2:** `<Tooltip content="...">child</Tooltip>` — `content` prop holds the popup.

**v3:** `<Tooltip><Trigger child/><Tooltip.Content>...</Tooltip.Content></Tooltip>`. `placement` moves to `Tooltip.Content`. `delay` stays.

#### Alert — 2 files

**v2:** `<Alert color="success" title="..." description="..." />` — flat.

**v3:** `<Alert status="success"><Alert.Indicator/><Alert.Content><Alert.Title>...</Alert.Title><Alert.Description>...</Alert.Description></Alert.Content></Alert>`. `color` → `status`. `isClosable` gone — render an external `CloseButton`.

#### Breadcrumbs — 1 file

**v2:** `<Breadcrumbs><BreadcrumbItem href="/">Home</BreadcrumbItem></Breadcrumbs>`.

**v3:** `<Breadcrumbs><Breadcrumbs.Item href="/">Home</Breadcrumbs.Item></Breadcrumbs>`. Item without `href` = current page indicator.

#### Avatar — 1 file (`AdminClientProfile.tsx`)

**v2:** `<Avatar src=".." name="JD" showFallback color="primary" isBordered />`.

**v3:** compound: `<Avatar><Avatar.Image src=".." alt="JD" /><Avatar.Fallback>JD</Avatar.Fallback></Avatar>`. `color="primary"` → `color="accent"`. `isBordered`/`radius` → Tailwind. `name` removed (compute initials manually).

#### Badge — 1 file (`AdminClientProfile.tsx`, ~6 usages)

**v2:** `<Badge content="5" color="primary"><Avatar/></Badge>` OR standalone `<Badge color="success">label</Badge>`.

**v3:** for anchored: `<Badge.Anchor><Avatar.../><Badge color="accent">5</Badge></Badge.Anchor>`. For standalone label use: `<Badge color="accent">label</Badge>` (children replace `content`). `primary` → `accent`. `variant="flat"` → `variant="soft"`. `isDot` removed (omit children). `isInvisible` removed (use ternary).

### 3.4 Props-level changes (no name change, but shape shift)

| Component | v2 prop | v3 |
|---|---|---|
| Button | `color="primary"` | **removed** — Button only has `variant`. Map `color="primary"` → `variant="primary"`, `color="danger"` → `variant="danger"`. |
| Button | `variant="light"\|"flat"\|"bordered"\|"faded"\|"shadow"\|"solid"` | Map to: `light/flat` → `variant="ghost"`, `bordered/faded` → `variant="outline"`, `shadow/solid` → `variant="primary"` (or `secondary`). |
| Button | `isLoading` | `isPending` |
| Button | `radius="full"` | `className="rounded-full"` |
| Button | `disableRipple`, `disableAnimation` | removed (no equivalent) |
| Spinner | `color="primary"` | `color="accent"`. Also `color="default"` → `color="current"`. |
| Spinner | `label="Loading"` | removed — render adjacent `<span>` |
| Spinner | `variant="gradient"\|"wave"\|"dots"\|"spinner"\|"simple"` | removed — single circular variant. |
| Chip | `color="primary"` | `color="accent"` |
| Chip | `variant="solid"\|"flat"\|"bordered"\|"faded"\|"shadow"\|"dot"` | `variant="primary"\|"secondary"\|"tertiary"\|"soft"` — map case-by-case. |
| Chip | `onClose`/`startContent`/`endContent` | removed — render children directly (icons + `<Chip.Label>`). |
| Chip | `radius` | `className="rounded-*"` |
| Link | `color`/`variant`/`size`/`underline`/`isExternal`/`showAnchorIcon` | **all removed** — v3 `Link` is a thin anchor primitive with `Link.Icon` subcomponent. We have only 1 import (`lib/router/components/Link.tsx` — a wrapper that re-exports `LinkProps`). Heaviest impact: the type re-export `LinkProps` may change shape. |
| Input | `label`/`description`/`errorMessage`/`isInvalid`/`isRequired`/`startContent`/`endContent`/`onValueChange`/`size`/`color`/`radius`/`classNames` | All gone from `Input` (primitive). For label/description/errors, wrap in `<TextField>` and add `<Label>`, `<Description>`, `<FieldError>` siblings. `onValueChange` → `onChange` (now native event, not value string). |
| TextArea | same removals as Input | use `<TextField>` wrapper if you need label/error |
| ButtonGroup | shape mostly preserved | `ButtonGroup.Separator` is a new explicit component (we don't currently use separators — no action needed for now). |

### 3.5 Autocomplete (we use it in 3 files: `AdminDiscountsPage`, `AdminOrderPage`, `AdminOrderPickPage`)

v2 shape is "Select with type-ahead input". The v3-closest equivalent in **shape** is **`ComboBox`** (inline input that opens a dropdown), not v3's renamed `Autocomplete` (which is a searchable select with explicit `useFilter`). Decision: **use `ComboBox`** for these three files. See §8 open questions if a use site needs the search-popover variant instead.

### 3.6 Hooks

| v2 hook | v3 |
|---|---|
| `useDisclosure()` returning `{ isOpen, onOpen, onClose, onOpenChange }` | `useOverlayState()` returning `{ isOpen, open(), close(), toggle(), setOpen(b) }`. Controlled form: `useOverlayState({ isOpen, onOpenChange })`. |
| `useSwitch`, `useInput`, `useCheckbox`, `useRadio` | removed — use compound parts. We don't import any of these. |
| `useDraggable`, `useClipboard`, `usePagination`, `useToast` | removed. We don't import these. |

### 3.7 Imports lost from `@heroui` sub-packages

`src/components/button.tsx` currently does:

```ts
import { Button as UiButton, ButtonProps } from "@heroui/button";
```

In v3 the sub-packages collapse into `@heroui/react`. Rewrite to:

```ts
import { Button as UiButton } from "@heroui/react";
import type { ButtonProps } from "@heroui/react";
```

Also: this file uses `forwardRef` — React 19 makes `forwardRef` optional (refs are a plain prop). Coders should leave `forwardRef` for now (still supported, just unnecessary) to keep the diff small. A follow-up cleanup can drop it.

---

## 4. File inventory — grouped by wave

Wave numbers reflect risk/blast-radius ordering: low-risk single-component files first, heavy compound rewrites last. Each wave is a single coder session. Waves 2–6 are independent (no overlap in test surface) and can run in parallel after Wave 0 (setup) and Wave 1.

| # | File | v2 components imported | Notes / dominant change |
|---|---|---|---|
| **W0** | `apps/store/package.json` | — | swap deps |
| **W0** | `apps/store/src/index.css` | — | rewrite imports |
| **W0** | `apps/store/src/hero.ts` | (deleted) | remove |
| **W0** | `apps/store/src/app/App.tsx` | `HeroUIProvider, ToastProvider` | remove Provider, swap Toast |
| **W0** | `apps/store/src/components/button.tsx` | `Button, ButtonProps` from `@heroui/button` | switch to `@heroui/react` |
| **W1** Button-only / Single-import files (8) | | | |
| W1 | `apps/store/src/components/EmptyState/EmptyState.tsx` | `Button` | swap `color="primary"` → `variant="primary"` |
| W1 | `apps/store/src/features/chatbot/ChatInput.tsx` | `Button, Input` | trivial |
| W1 | `apps/store/src/features/chatbot/ChatbotPanel.tsx` | `Button` | trivial |
| W1 | `apps/store/src/features/chatbot/ChatbotToggle.tsx` | `Button` | trivial |
| W1 | `apps/store/src/pages/store/HomePage/components/Header/index.tsx` | `Button` | trivial |
| W1 | `apps/store/src/pages/store/HomePage/components/Hero/index.tsx` | `Button` | trivial |
| W1 | `apps/store/src/pages/store/HomePage/components/OrderingOptions/index.tsx` | `Button` | trivial |
| W1 | `apps/store/src/widgets/UnPaidPendingOrder/UnPaidPendingOrder.tsx` | `Button` | trivial |
| **W2** Divider/Link/Chip/Tooltip/ButtonGroup (light renames + simple) (10) | | | |
| W2 | `apps/store/src/websites/balasistore/index.tsx` | `Divider` | `Divider` → `Separator` |
| W2 | `apps/store/src/websites/default/DefaultProductCard.tsx` | `Divider` | `Divider` → `Separator` |
| W2 | `apps/store/src/widgets/CategoryMenu/CategoryMenu.tsx` | `BreadcrumbItem, Breadcrumbs` | `BreadcrumbItem` → `Breadcrumbs.Item` |
| W2 | `apps/store/src/pages/store/UserOrdersPage/index.tsx` | `Chip, ChipProps` | Chip type+color rename; export type `ChipProps` survives |
| W2 | `apps/store/src/pages/store/ProfilePage/ProfileView.tsx` | `Chip` | trivial Chip rewrite |
| W2 | `apps/store/src/pages/admin/AdminLayout/Sidebar.tsx` | `Tooltip` | Tooltip compound rewrite |
| W2 | `apps/store/src/pages/admin/AdminLayout/Header.tsx` | `Button, Input` | trivial |
| W2 | `apps/store/src/widgets/Product/ProductCartButton.tsx` | `ButtonGroup, ButtonProps` | trivial; verify nested Button variants |
| W2 | `apps/store/src/lib/router/components/Link.tsx` | `Link as UiLink, LinkProps` | re-export wrapper; verify `LinkProps` shape change (heavy — v3 Link loses `color`/`variant`/`size`/`underline`/`isExternal`) |
| W2 | `apps/store/src/components/FIleUpload/FileUpload.tsx` | `Button, Image` | replace `Image` with `<img>` |
| **W3** Card-heavy storefront pages (5) | | | |
| W3 | `apps/store/src/features/auth/components/LoginForm/index.tsx` | `Card, CardBody, CardHeader, Link` | Card.Content rewrite + Link shape |
| W3 | `apps/store/src/features/auth/components/SignupForm/index.tsx` | `Card, CardBody, CardHeader, Link` | Card.Content rewrite + Link shape |
| W3 | `apps/store/src/pages/store/ProfilePage/ProfilePage.tsx` | `Card, CardBody, CardHeader, Divider, Button, addToast` | Card + Separator + `toast.success`; ALSO uses `framer-motion` directly (unchanged) |
| W3 | `apps/store/src/pages/store/HomePage/components/ContactForm/index.tsx` | `Button, Input, Textarea, addToast` | TextArea capitalization + `toast.*` rewrite |
| W3 | `apps/store/src/pages/store/ProfilePage/ProfileForm.tsx` | `Button, Input` | trivial; uses `framer-motion` (unchanged) |
| **W4** Cart / order / alert storefront pages (4) | | | |
| W4 | `apps/store/src/widgets/MinimumOrderAlert/MinimumOrderAlert.tsx` | `Alert, Progress` | Alert compound + Progress → ProgressBar |
| W4 | `apps/store/src/pages/store/ClientOrderPage/index.tsx` | `Card, CardBody, CardFooter, CardHeader, Chip, Divider, Progress, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow` | mid-heavy: Card + Chip + Separator + ProgressBar + Table compound |
| W4 | `apps/store/src/ui/Modal/Modal.tsx` | `Modal as UiModal, ModalProps, ModalContent, ModalHeader, ModalBody, ModalFooter, Button` | Modal rewrite + check what `ModalProps` becomes (likely `Modal.BackdropProps` or just `ComponentProps<typeof Modal>`) |
| W4 | `apps/store/src/widgets/Modals/CreateDeliveryNoteModal.tsx` | `Checkbox, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader` | Modal + Checkbox compound rewrite |
| **W5** Modal-heavy admin (5) | | | |
| W5 | `apps/store/src/widgets/Modals/CreateInvoiceModal.tsx` | `Modal*, Select, SelectItem` | Modal + Select compound |
| W5 | `apps/store/src/widgets/Modals/DeliveryNoteDetailsModal.tsx` | `Modal*, Input` | Modal compound + Input straightforward |
| W5 | `apps/store/src/widgets/Modals/InvoiceDetailsModal.tsx` | `Modal*, Input` | Modal compound + Input straightforward |
| W5 | `apps/store/src/widgets/Modals/SelectDateForDocumentModal.tsx` | `Modal*, Input` | Modal compound + Input straightforward |
| W5 | `apps/store/src/widgets/OrgPicker/OrgPicker.tsx` | `Button, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Modal*` | Modal + Dropdown compound — both heavy |
| **W6** Admin Tables / Selects / NumberInputs (8) | | | |
| W6 | `apps/store/src/pages/admin/AdminInventoryCertificateDetailPage.tsx` | `Button, Table*` | Table compound |
| W6 | `apps/store/src/pages/admin/AdminInventoryCertificatePage.tsx` | `Button, Input, Modal*, NumberInput, Select, SelectItem, Tab, Table*, Tabs, Textarea` | very heavy: 8 compound rewrites |
| W6 | `apps/store/src/pages/admin/AdminInvoicesPage/AdminInvoicesPage.tsx` | `Checkbox` | trivial |
| W6 | `apps/store/src/pages/admin/AdminSettingsPage/index.tsx` | `Button as HeroButton, Checkbox, Input` | aliased Button, Checkbox compound |
| W6 | `apps/store/src/pages/admin/AdminCreateOrderPage/AdminCreateOrderPage.tsx` | `Select, SelectItem` | Select compound |
| W6 | `apps/store/src/pages/admin/AdminProductsPage.tsx` | `Tab, Tabs` | Tabs compound |
| W6 | `apps/store/src/pages/admin/AdminSuppliersPage.tsx` | `Input, Modal*, Table*` | Modal + Table |
| W6 | `apps/store/src/pages/admin/AdminOrganizationsPage.tsx` | `Input, Modal*, Table*` | Modal + Table |
| **W7** Admin pages with the heaviest mixes (8) | | | |
| W7 | `apps/store/src/pages/admin/AdminOrganizationGroupsPage.tsx` | `Input, Modal*, Table*` | Modal + Table |
| W7 | `apps/store/src/pages/admin/AdminOrganizationDetailPage/AdminOrganizationDetailPage.tsx` | `Card*, Input, Modal*, Select, SelectItem, Tab, Table*, Tabs` | very heavy |
| W7 | `apps/store/src/pages/admin/AdminBudgetPage/AdminBudgetPage.tsx` | `Chip, Input, Modal*, Select, SelectItem, Spinner, Table*, Textarea` | very heavy: Spinner color rename + TextArea cap |
| W7 | `apps/store/src/pages/admin/AdminClientProfile/AdminClientProfile.tsx` | `Avatar, Badge, Button, Card*, Input, Modal*, Select, SelectItem, Spinner, useDisclosure` | very heavy + Avatar/Badge compound + `useDisclosure` → `useOverlayState` |
| W7 | `apps/store/src/pages/admin/AdminUsersPage/index.tsx` | `Dropdown*, Input, Pagination, Table*, User` | very heavy: Pagination compound rewrite + `User` removal + Dropdown + Table |
| W7 | `apps/store/src/pages/admin/AdminDiscountsPage/index.tsx` | `Autocomplete, AutocompleteItem, Button, Card*, Chip, Divider, Input, Select, SelectItem, Table*, Tooltip` | very heavy: Autocomplete → ComboBox + Card + Select + Table + Tooltip |
| W7 | `apps/store/src/pages/admin/Orders/AdminOrdersPages.tsx` | `Chip, ChipProps, Modal*` | mid |
| W7 | `apps/store/src/pages/admin/Orders/AdminOrderPickPage.tsx` | `Autocomplete, AutocompleteItem, Button, Card*, Chip, Input, Modal*, Table*, useDisclosure` | very heavy + `useDisclosure` |
| **W8** Largest admin order + the AppBar rewrite (3) — run **last** | | | |
| W8 | `apps/store/src/pages/admin/Orders/AdminOrderPage.tsx` | `Autocomplete, AutocompleteItem, Button, Card*, Chip, Divider, Input, Modal*, Select, SelectItem, Table*, useDisclosure` | extremely heavy — all major compound rewrites + `useDisclosure` |
| W8 | `apps/store/src/pages/admin/Orders/AdminOrderPageNew.tsx` | `Alert, Button, Card*, Chip, Dropdown*, Input, Modal*, Select, SelectItem, Table*, Textarea` | extremely heavy — Alert compound + Dropdown + Modal + Select + Table |
| W8 | `apps/store/src/pages/admin/Orders/AdminOrdersPage.tsx` | `Dropdown*, Input, Modal*, Pagination, Select, SelectItem, Table*, User` | very heavy: Pagination + `User` removal + Dropdown + Select + Table + Modal |
| **W9** Single largest single-file rewrite — `AppBar` (1) — run **last** alone | | | |
| W9 | `apps/store/src/widgets/AppBar/index.tsx` | `Dropdown*, Navbar, NavbarBrand, NavbarContent, NavbarItem, Snippet` | 150-line full rewrite: Navbar → native `<nav>/<header>/<ul>` + Snippet → `<pre>`+clipboard + Dropdown compound |

Total files migrated: 54 (excluding `hero.ts` deletion). Total waves: 10 (W0–W9). Each wave fits in one coder session.

---

## 5. Cross-cutting setup commit — W0

This commit is intentionally build-breaking. The official guide says to verify by `tsc`/`eslint`, not `vite build`, until W9 lands. Verify the dev server starts only after W9.

### 5.1 `apps/store/package.json`

```diff
-    "@heroui/react": "^2.8.0",
+    "@heroui/react": "^3.1.0",
+    "@heroui/styles": "^3.1.0",
-    "react": "^18.2.0",
-    "react-dom": "^18.2.0",
+    "react": "^19.0.0",
+    "react-dom": "^19.0.0",
```

Keep `framer-motion`, `react-aria-components`, `tailwindcss`, `tailwind-variants`. **Confirm `react-aria-components` peer with v3 at install time** — bump only if needed (most likely target: `^2.0.0`).

Run `pnpm install` (or your install command per the monorepo) to refresh the lockfile in this commit.

### 5.2 `apps/store/src/index.css`

```diff
 @import "tailwindcss";
-@plugin './hero.ts';
-@source '../../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}';
+@import "@heroui/styles";
 @custom-variant dark (&:is(.dark *));

 @import "./themes/default.css";
```

**Order matters** (per guide): `tailwindcss` BEFORE `@heroui/styles`.

### 5.3 `apps/store/src/hero.ts`

Delete the file. It will be unreferenced after the `index.css` change.

### 5.4 `apps/store/src/app/App.tsx`

```diff
-import { HeroUIProvider, ToastProvider } from "@heroui/react";
+import { Toast } from "@heroui/react";
 ...
-<HeroUIProvider className="min-h-screen min-w-screen">
-  <ToastProvider placement="top-center" />
+<div className="min-h-screen min-w-screen">
+  <Toast.Provider />
   ...children...
-</HeroUIProvider>
+</div>
```

**Note on `placement="top-center"`:** This was a `ToastProvider` prop in v2. The v3 `Toast.Provider` documented API does not expose `placement`; it's controlled by toast-instance options or by CSS. Resolution → see open question §8 (Q1).

### 5.5 `apps/store/src/components/button.tsx`

```diff
-import { Button as UiButton, ButtonProps } from "@heroui/button";
+import { Button as UiButton } from "@heroui/react";
+import type { ButtonProps } from "@heroui/react";
```

**Note**: `ButtonProps` shape is changing too (loses `color`, gains the v3 variant vocabulary). The wrapper itself doesn't need to know — all call sites of `src/components/button.tsx` already pass through `IButtonProps extends ButtonProps`, so types will surface failures at the call site, not here. That's good — it means W1–W9 will hit them where they matter.

### 5.6 Theme CSS — no change in W0

`apps/store/src/themes/default.css` stays. `--brand-primary` (HSL triplet) and the `@theme {}` Tailwind v4 tokens are independent of HeroUI. See §7 below for what may need adjusting later (NOT in W0).

### 5.7 Expected state after W0

- `tsc --noEmit` will show errors in all 54 consumer files.
- `eslint` will surface unresolved imports.
- DO NOT run `vite build` or `dev:test` until W9 is in. The agent guide is explicit about this: "Don't build to check for errors during migration."

---

## 6. Wave-by-wave plan

> **Each wave is one coder session.** Coder receives: the relevant § of this doc, the file list for the wave, the v3 API delta (§3). The coder must:
> 1. open each file, swap imports + JSX,
> 2. run `pnpm --filter store tsc --noEmit` (or equivalent) — there will still be errors in OTHER files, that's expected; the coder only owns the wave's files,
> 3. run `pnpm --filter store eslint <files-in-wave>`,
> 4. commit with a clear message: `chore(heroui-v3): wave N — <theme>`.

### W1 — Button-only files (8 files)

**Files:** see W1 rows in §4.
**What changes:**
- v2 `color="primary|secondary|success|warning|danger"` on `<Button>` → v3 `variant` directly. Mapping:
  - `color="primary"` (+ no variant) → `variant="primary"`
  - `color="default"` (+ no variant) → `variant="secondary"`
  - `color="danger"` → `variant="danger"`
  - `color="success"` → use `variant="primary"` + Tailwind `bg-green-600` (no semantic match; flag this for design review in §8 Q2)
  - `color="warning"` → `variant="secondary"` + Tailwind amber tint
- v2 `variant="light"` → v3 `variant="ghost"`
- v2 `variant="flat"` → v3 `variant="ghost"`
- v2 `variant="bordered"` → v3 `variant="outline"`
- v2 `variant="faded"` → v3 `variant="outline"`
- v2 `variant="shadow"` → v3 `variant="primary"` + Tailwind `shadow-lg`
- v2 `variant="solid"` → v3 `variant="primary"` (or `secondary` if it was the default semantic role)
- `isLoading` → `isPending`
- `radius="full"` → `className="rounded-full"`
- Remove `disableRipple`, `disableAnimation`
**Dependencies:** depends on W0 (deps + index.css).
**Risk:** low — small files, isolated. The `color="success"`/`color="warning"` semantic gap is the only judgment call; current behavior is colored CTAs in cart-related flows, so flag the mapping decision in §8 Q2 before W1 starts.

### W2 — Renames + simple compounds (10 files)

**Files:** see W2 rows.
**What changes:**
- `Divider` → `Separator` (import + JSX). Both files in `websites/*` are storefront markup — verify visual appearance after W9 smoke test.
- `BreadcrumbItem` → `Breadcrumbs.Item`.
- `Chip` color rename (`primary` → `accent`) + variant remap + remove `onClose`/`startContent`/`endContent` (lift into children with `<Chip.Label>`).
- `Tooltip` compound (one site in admin sidebar).
- `Image` → `<img>` (one site).
- `Link` (in `lib/router/components/Link.tsx`) — this is the **type re-export**: `LinkProps` shape changes (loses `color`, `variant`, `size`, `underline`, `isExternal`, `showAnchorIcon`). Confirm no caller relies on those props before W2 starts; if a caller does, plan to drop the offending prop or wrap in Tailwind.
- `ButtonGroup` — no API change beyond `Button` children getting variant rewrites.
**Dependencies:** W0.
**Risk:** medium — `Link.tsx` is the wildcard. The router's typed Link wrapper sits below routing logic; verify type compatibility before merging.

### W3 — Card-heavy storefront pages (5 files)

**Files:** see W3 rows.
**What changes:**
- `Card` + `CardBody` + `CardHeader` → `Card` + `Card.Content` + `Card.Header`. If a card uses an embedded `CardHeader>h1+h2` pattern, split into `Card.Title` + `Card.Description`.
- `isPressable` (if present) → wrap in `<button>`.
- `addToast({title, description, color, severity})` → `toast.success(title, { description })` / `toast.danger(...)` / etc. Variant rename `error→danger`, `info→accent`.
- `TextArea` capitalization fix.
- `Divider` → `Separator` (ProfilePage).
**Dependencies:** W0.
**Risk:** medium — these are visible storefront pages (LoginForm, SignupForm, ProfilePage). Smoke verification after W9.

### W4 — Storefront cart + order + alert + base modal wrapper (4 files)

**Files:** see W4 rows.
**What changes:**
- `MinimumOrderAlert.tsx`: `Alert` compound rewrite (`color` → `status`); `Progress` → `ProgressBar` compound.
- `ClientOrderPage`: full Card + Chip + Separator + ProgressBar + Table compound — biggest single file in this wave.
- `ui/Modal/Modal.tsx`: rewrite the wrapper to use `Modal.Backdrop`/`Container`/`Dialog` and re-export `Modal.Content = Modal.Dialog` if any callers reach for `Modal.Content`. Decide: is `ModalProps` exported anywhere? `grep -rn 'ModalProps' apps/store/src` — if so, rename to the v3 equivalent.
- `CreateDeliveryNoteModal`: Modal + Checkbox compound rewrite.
**Dependencies:** W0.
**Risk:** medium-high — the `ui/Modal/Modal.tsx` wrapper is referenced by at least 6 internal Modal call sites that DON'T import directly from `@heroui/react` (they use this wrapper). The wrapper rewrite must preserve the `Modal.Content` attached static if any caller uses it.

### W5 — Document/invoice modals + OrgPicker (5 files)

**Files:** see W5 rows.
**What changes:** Modal + Select + Dropdown compound rewrites. `OrgPicker.tsx` has both Modal AND Dropdown — the heaviest in this wave.
**Dependencies:** W0. Independent of W3/W4 (different files).
**Risk:** medium.

### W6 — Admin table/select/checkbox pages (8 files)

**Files:** see W6 rows.
**What changes:**
- `AdminInventoryCertificatePage.tsx` is the heaviest file in this wave: 8 compound rewrites (Modal, Select, NumberInput → NumberField, Tabs, Table, TextArea).
- `NumberInput` → `NumberField` (`onValueChange` → `onChange`).
- Remaining files are single-pattern.
**Dependencies:** W0.
**Risk:** medium.

### W7 — Admin pages with heaviest mixes (8 files)

**Files:** see W7 rows.
**What changes:** every compound rewrite, plus:
- `AdminClientProfile.tsx`: Avatar + Badge compound + `useDisclosure` → `useOverlayState`.
- `AdminUsersPage/index.tsx`: Pagination compound rewrite + `User` removal.
- `AdminDiscountsPage`: Autocomplete → ComboBox.
- `Orders/AdminOrderPickPage.tsx`: Autocomplete → ComboBox + `useDisclosure`.
**Dependencies:** W0.
**Risk:** high — every file here is feature-critical for admin workflows. Recommend running coders sequentially within W7 (not parallel) so we can verify each large file's typecheck pass before moving on.

### W8 — Largest admin order pages (3 files)

**Files:** `AdminOrderPage`, `AdminOrderPageNew`, `AdminOrdersPage`.
**What changes:** all of the above plus Pagination, `useDisclosure` × 2, `User` removal.
**Dependencies:** W0; ideally run AFTER W7 finishes so coders can lift any patterns established there.
**Risk:** high — `AdminOrderPage*` are the most heavily-used admin pages; if these don't compile, the build won't.

### W9 — AppBar full rewrite (1 file, run last alone)

**File:** `apps/store/src/widgets/AppBar/index.tsx`.
**What changes:**
- `Navbar` + `NavbarBrand` + `NavbarContent` + `NavbarItem` → native `<nav>/<header>/<ul>` with Tailwind.
- `Snippet` → `<pre>` + `<code>` + clipboard `Button`+`Tooltip` combo per the migration guide.
- `Dropdown` compound rewrite.
- Mobile menu state: `useState<boolean>` for open/closed; no `useDisclosure`-equivalent needed here.
**Dependencies:** W0. Independent of W1–W8.
**Risk:** high — this is the global navigation bar, visible on every page. Smoke verification mandatory.

### W10 — Verification commit

After W1–W9:
1. `pnpm --filter store tsc --noEmit` — must pass.
2. `pnpm --filter store lint` — must pass.
3. Sweep for stale imports of v2 names: `grep -rn 'ModalContent\|ModalBody\|ModalHeader\|ModalFooter\|DropdownTrigger\|DropdownMenu\|DropdownItem\|CardBody\|CardHeader\|CardFooter\|TableHeader\|TableColumn\|TableBody\|TableRow\|TableCell\|SelectItem\|AutocompleteItem\|BreadcrumbItem\|ToastProvider\|HeroUIProvider\|useDisclosure\|addToast\|NumberInput\|Textarea' apps/store/src --include='*.tsx' --include='*.ts'` — must be empty.
4. Sweep for stale `from "@heroui/theme"`, `from "@heroui/button"`: must be empty.
5. **Now** run `pnpm --filter store build` (vite). Resolve any runtime-only failures.
6. **Now** run `pnpm --filter store dev:test` on port 5175.
7. Manual smoke (see §9).

---

## 7. Theme infra interactions (just-landed PR)

### 7.1 `--brand-primary: 262 83% 58%`

This variable lives in `themes/default.css`. v2 HeroUI did not read it. v3 HeroUI reads `--accent`, `--accent-foreground`, `--surface`, `--overlay`, etc. **Conclusion: `--brand-primary` is OURS to keep** — it's used by app utilities, not by HeroUI. No action required.

### 7.2 HSL vs OKLCH

The v3 styling guide example uses OKLCH but does not forbid HSL or other CSS color formats; v3 also uses `color-mix(in oklab, ...)`. CSS variables hold whatever value you write into them and components evaluate them at use-time. The risk is only that some v3 components may produce derived colors via `color-mix(in oklab, var(--accent), ...)` which would warp an HSL input differently than the OKLCH originally designed against.

**Recommendation:** as a follow-up after the migration ships (not in W0–W9), evaluate whether `--brand-primary` should be reformatted to OKLCH so any future plumbing through `--accent` produces clean mixes. **Not blocking.** Open question in §8 Q3.

### 7.3 `@theme {}` Tailwind v4 block in `default.css`

Tailwind v4 `@theme {}` defines compile-time tokens (`--color-hero`, `--shadow-card`). v3 has its own tokens (`--accent`, `--surface`). These do not collide — different namespaces. The `@theme {}` block stays.

### 7.4 `[data-store-theme="<id>"]` scoping

Per-store theme overrides set CSS variables under `[data-store-theme="<id>"]`. v3 HeroUI components read CSS variables at runtime from the cascade — `[data-store-theme]` selectors are higher specificity than `:root` so overrides will apply normally. **No conflict expected.** Verify after W9 smoke by checking storefront with a real `data-store-theme` value set.

### 7.5 `@source '../../../node_modules/@heroui/theme/dist/**'`

Removed in W0. v3 ships styles via `@import "@heroui/styles"` — no `@source` scanning needed. The Tailwind v4 source scanner still discovers our app's classes automatically.

---

## 8. Risks & open questions

### Risks

- **High — React 19 upgrade is a hidden prerequisite.** v3 requires React 19. Our codebase is React 18.2. React 19 brings its own breakage (deprecated `forwardRef` is the main mild one; `react-dom/server` shape changes; some peer libs may not be 19-compatible yet — Sentry, Algoliasearch InstantSearch, react-redux 9.x are all in deps and need verification). The W0 commit must include the React bump alongside the HeroUI swap. Suggest running `pnpm --filter store why react` after the bump to catch dual-React-version situations.
- **High — `Button` API is the most-edited surface area.** 127 `variant=` + 48 `color=` usages, many in admin pages. The semantic mapping (especially `color="success"`/`color="warning"`) is a judgment call. W1 must lock the mapping rules BEFORE other waves so the codebase converges on one vocabulary.
- **High — Modal rewrite is structurally invasive.** 16 files use Modal. The `state={state}` + `Modal.Backdrop` + `Modal.Container` + render-props-with-`close` pattern is alien to v2 muscle memory; coders will make small mistakes (forgetting `Modal.Backdrop`, putting `size` on `Modal` instead of `Modal.Container`). Reviewers must spot-check every wave that touches a Modal.
- **Medium — `lib/router/components/Link.tsx` re-exports `LinkProps`.** v3's `Link` is much thinner. Any consumer of that wrapper that passes through `color`/`variant`/`underline` will type-error in the wave that hits them. Coder for that file must `grep -rn 'lib/router/components/Link' apps/store/src` and pre-survey props in use.
- **Medium — `react-aria-components ^1.2.0` is in app deps.** v3 HeroUI likely peers on RAC v2.x. A version conflict here would surface at `pnpm install`. Resolution: bump RAC to v2 as part of W0 if peer resolution fails.
- **Medium — `framer-motion` STAYS.** 6 app files use it directly. The migration guide says "remove framer-motion" but that applies only when v3 is the sole consumer. We are not removing it. Reviewer must double-check the W0 diff does not strip framer-motion from `package.json`.
- **Medium — `tailwind-variants` STAYS.** 9 app files use it for their own component variant system. Independent of HeroUI's removal of the same library internally.
- **Medium — `Toast.Provider` does not document a `placement` prop.** Our current code sets `placement="top-center"`. Loss of this prop means toasts may render in a different position post-migration. See Q1 below.
- **Medium — Per-component migration guides claim certain props are "removed" (e.g. `classNames` on Modal/Select/Card).** Coders may be tempted to keep them and silence TS errors. They must apply Tailwind className on the new compound parts instead — no `classNames` slot object is supported in v3.
- **Low — `eslint-plugin-boundaries` is currently disabled in the project** (per recent commits 968fafd / 61e158e). No boundary-rule risk for this migration.

### Open questions (require user input — flagged in pre-W0 review)

**Q1. Where should v3 toasts render?** v2 had `<ToastProvider placement="top-center" />`. The v3 `Toast.Provider` component does not document a `placement` prop. Options:
   - (a) Accept v3's default placement (likely `bottom-right` per the React Aria Components default).
   - (b) Style the placement via CSS (target `[role="region"][aria-label*="Notifications"]` or whatever the v3 portal element exposes — needs verification).
   - (c) Set placement per-toast as an option on each `toast.*()` call.
   Recommendation: ship (a) — accept the default — and revisit in a follow-up if it visibly regresses UX.

**Q2. How should we map v2 Button `color` semantics that don't exist in v3 `variant`?** v2 has `color="primary|secondary|success|warning|danger|default"`. v3 has `variant="primary|secondary|tertiary|outline|ghost|danger|danger-soft"`. There is no `success` or `warning` in v3 button variants. Two options:
   - (a) Strict map (`success`/`warning` → `variant="primary"` + Tailwind tint) — preserves visual treatment but loses semantic role.
   - (b) Custom Tailwind utility classes on those buttons, dropping `variant` entirely.
   Recommendation: (a) for now (smaller diff), revisit when the design system catches up.

**Q3. Should we reformat `--brand-primary` from HSL triplet to OKLCH?** Not blocking. Decide as a follow-up after the migration ships, when we can compare rendered colors side-by-side. **Recommendation: defer.**

**Q4. Coder concurrency vs. risk.** W1, W2, W3, W4, W5, W6, W7, W8, W9 are technically file-disjoint and could all run in parallel after W0. Practical recommendation: run **W1+W2 in parallel** (fast, low-risk), then **W3+W4+W5+W6 in parallel** (mid-risk, no overlap), then **W7+W8 sequentially** (high-risk, large files), then **W9 alone**. This reflects coder reliability more than file conflicts.

**Q5. Should the wrapper `src/components/button.tsx` survive?** It exists because we wanted a typed re-export from a sub-package. After W0 it re-exports from `@heroui/react`. The wrapper adds no value beyond name reservation. Recommendation: keep it through this migration (smaller diff), remove in a follow-up cleanup.

---

## 9. Test plan

### 9.1 Automated

- **Per-wave:** `pnpm --filter store tsc --noEmit` + `pnpm --filter store lint` on the wave's files. Wave passes when both succeed for those files (the rest of the codebase will still be red).
- **After W10:** full `tsc --noEmit` clean. Full `lint` clean. `vite build` succeeds.
- **No Vitest / Playwright tests exist** in `apps/store` (verified — no `*.test.*` / `*.spec.*` files in `src`, no `playwright-report` dir). There is nothing to update or run.

### 9.2 Manual smoke (after W10, on `dev:test` port 5175 against a test store)

Walk these specific flows. Each tests at least one Wave's surface:

| Flow | URL pattern | Verifies (waves) |
|---|---|---|
| Storefront home renders, header shows brand + nav | `/` | W9 (AppBar), W1 (Home Hero/Header Buttons) |
| Product catalog page loads, filter sidebar opens | `/catalog` | W2 (CategoryMenu Breadcrumbs), W1 (Buttons) |
| Product page Add-to-Cart button | `/product/<id>` | W1, W2 (ButtonGroup) |
| Cart drawer opens (Modal compound) | `/cart` | W4 (ui/Modal wrapper), W4 (MinimumOrderAlert) |
| Login form submits | `/login` | W3 (LoginForm Card+Link), W0 (toast) |
| Signup form submits | `/signup` | W3 (SignupForm Card+Link) |
| Contact form on home submits → toast appears | `/` | W3 (TextArea, toast.success) |
| Profile page → edit name → save → toast | `/profile` | W3 (Card, toast) |
| Orders list page (admin) | `/admin/orders` | W8 (AdminOrdersPage — Pagination, User removal, Modal, Dropdown, Table, Select) |
| Single order page (admin) → edit modal | `/admin/orders/<id>` | W8 (AdminOrderPage — heaviest single file) |
| Discounts page (admin) → autocomplete → ComboBox typing | `/admin/discounts` | W7 (Autocomplete → ComboBox) |
| User detail (admin) → modal opens, avatar+badge render | `/admin/users/<id>` | W7 (Avatar, Badge, useDisclosure → useOverlayState) |
| Per-store theme: visit a test store with `data-store-theme` set | `/` | §7.4 (CSS cascade still works) |

Check on each page:
- No console errors (especially "v2 component not found" / hydration mismatches).
- Visual: Card borders, Modal backdrops blur correctly, Button color/variant treatments match design.
- Tab/keyboard navigation still works in Modals, Dropdowns, Tables (React Aria heritage — should be intact).
- RTL: switch language to Hebrew; check that AppBar, Breadcrumbs, Table directions still flip. (v3.1 release notes mention "improved RTL support across Table, pickers, and MenuItem" — this is positive, but verify.)

### 9.3 Smoke goes wrong → fallback

`git checkout main && pnpm install` returns the tree to v2 cleanly. Mid-migration the branch is broken by design, but any reset to `main` recovers fully.

---

## 10. Rollback plan

- **Pre-merge:** `git checkout main` on the branch worktree. `pnpm install` to refresh deps. Done.
- **Post-merge but pre-deploy:** `git revert <merge-commit> --no-edit` then `pnpm install`. Done.
- **Post-deploy:** standard revert + redeploy via existing deploy script. No data-layer migration is touched by this branch — there's no schema state to undo.

The branch is wholly contained within `apps/store/**` and `package.json` (single app) + `pnpm-lock.yaml`. No `shared/`, no `functions/`, no Firestore rules, no production data are mutated.
