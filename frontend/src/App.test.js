// App.test.js
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import '@testing-library/jest-dom';

describe('App Component', () => {
  beforeEach(() => {
    render(<App />);
  });

  test('renders Add New Configuration form by default', () => {
    expect(screen.getByText(/Add New Configuration/i)).toBeInTheDocument();
  });

  test('validates the name field to allow only letters', async () => {
    // Find the name input field using its label.
    const nameInput = screen.getByLabelText(/Name \*/i);

    // Enter a valid name.
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John Doe');
    expect(nameInput).toHaveValue('John Doe');

    // Clear and enter an invalid name with numbers.
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'John123');

    // Trigger blur so that Formik runs validation.
    await userEvent.tab();

    // The validation error should appear.
    const errorMessage = await screen.findByText(/Name must contain only letters/i);
    expect(errorMessage).toBeInTheDocument();
  });
});
