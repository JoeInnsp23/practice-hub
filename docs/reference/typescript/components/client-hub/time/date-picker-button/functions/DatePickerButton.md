[**practice-hub v0.1.0**](../../../../../README.md)

***

[practice-hub](../../../../../README.md) / [components/client-hub/time/date-picker-button](../README.md) / DatePickerButton

# Function: DatePickerButton()

> **DatePickerButton**(`__namedParameters`): `Element`

Defined in: [components/client-hub/time/date-picker-button.tsx:70](https://github.com/JoeInnsp23/practice-hub/blob/d308624649fa00a433a170aeda9a977cd5e01c3f/components/client-hub/time/date-picker-button.tsx#L70)

Enhanced date picker button for weekly timesheet navigation.
Displays the selected week range and provides a calendar popover for direct week selection.

**Features:**
- Shows current week range in button label (e.g., "Jan 13-19, 2025")
- Calendar popover with week-start-on-Monday configuration
- Automatically converts selected date to week start (Monday)
- Accessible keyboard navigation

**Usage:**
```tsx
<DatePickerButton
  selectedWeekStart={currentWeekStart}
  onWeekChange={(weekStart) => setCurrentWeekStart(weekStart)}
  displayFormat="full"
/>
```

## Parameters

### \_\_namedParameters

`DatePickerButtonProps`

## Returns

`Element`

## Examples

```ts
// Basic usage with full week range display
<DatePickerButton
  selectedWeekStart={new Date(2025, 0, 13)} // Monday Jan 13
  onWeekChange={(date) => console.log(date)}
/>
```

```ts
// Compact display without year
<DatePickerButton
  selectedWeekStart={currentWeekStart}
  onWeekChange={setCurrentWeekStart}
  displayFormat="short"
/>
```
