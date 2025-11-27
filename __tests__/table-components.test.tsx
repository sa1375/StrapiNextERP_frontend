// frontend/__tests__/table-components.test.tsx

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ColumnFilter from '@/components/ColumnFilter';
import { DataTable } from '@/components/data-table';
import { type ColumnDef } from '@tanstack/react-table';

describe('ColumnFilter', () => {
  it('opens popover, applies value, and clears', async () => {
    // Mock handler to capture filter value changes
    const onChange = jest.fn();

    // userEvent instance to simulate user interactions (clicks, typing, etc.)
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    // Render the ColumnFilter component with initial empty value
    const { rerender } = render(
      <ColumnFilter
        label={<span>Customer</span>}          // Label shown on the trigger
        value=""                               // Initial filter value
        onChange={onChange}                    // Callback when filter changes
        placeholder="Filter Customer..."       // Placeholder used in the input
      />,
    );

    // The trigger is rendered as a button (to open the popover)
    const trigger = screen.getByRole('button');
    await user.click(trigger); // Open the filter popover

    // After opening, the text input appears with the given placeholder
    const input = await screen.findByPlaceholderText('Filter Customer...');
    // Type a filter value
    await user.type(input, 'Alice');
    // Click the "Apply" button inside the popover
    await user.click(screen.getByRole('button', { name: /apply/i }));

    // onChange should be called with the new filter value
    expect(onChange).toHaveBeenCalledWith('Alice');

    /**
     * After applying a filter, the trigger usually changes:
     *  - either becomes a "Clear" button
     *  - or still remains the filter button but with different label/icon
     *
     * Here we:
     *  - Try to find a dedicated "Clear" button by name
     *  - If not found, fall back to the single button on screen
     */
    // Simulate parent updating the controlled value to "Alice"
    rerender(
      <ColumnFilter
        label={<span>Customer</span>}
        value="Alice"
        onChange={onChange}
        placeholder="Filter Customer..."
      />,
    );

    const clearButton =
      screen.queryByRole('button', { name: /clear/i }) ?? screen.getByRole('button');

    // Click the clear button to reset the filter
    await user.click(clearButton);

    // onChange should now have been called twice (initial apply + clear)
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenLastCalledWith('');
  });
});

describe('DataTable', () => {
  // Define a simple row type and two basic columns for the table
  type Row = { id: number; name: string };

  const columns: ColumnDef<Row>[] = [
    { accessorKey: 'id', header: 'ID' },      // Column showing row.id
    { accessorKey: 'name', header: 'Name' },  // Column showing row.name
  ];

  it('renders empty state when no data', () => {
    // Render the DataTable with no rows
    render(<DataTable columns={columns} data={[]} />);

    /**
     * The table implementation is expected to show an empty state message
     * when the `data` array is empty.
     */
    expect(screen.getByText('No results.')).toBeInTheDocument();
  });
});
