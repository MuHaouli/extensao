import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders analysis title on /analise', () => {
  render(
    <MemoryRouter initialEntries={['/analise']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/análise facial em tempo real/i)).toBeInTheDocument();
});
