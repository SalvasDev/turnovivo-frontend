import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UIProvider } from '@/context/UIContext';
import SuperAdminBusinessesClient, { type AdminUser, type BusinessAdmin } from './SuperAdminBusinessesClient';

const admin: AdminUser = { id: 'admin-1', email: 'admin.manager@turnovivo.com', role: 'ADMIN' };
const business: BusinessAdmin = {
  id: 'company-1', name: 'Premium barber', slug: 'premium-barber', ownerId: admin.id,
  ownerEmail: admin.email, active: true, createdAt: '2026-11-09T12:00:00Z',
};
const fetchMock = vi.fn<typeof fetch>();
let currentAdmins: AdminUser[];
let currentBusinesses: BusinessAdmin[];

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } });
}

function mutations() {
  return fetchMock.mock.calls.filter(([, init]) => init?.method && init.method !== 'GET');
}

function renderDashboard(businesses = currentBusinesses, admins = currentAdmins) {
  return render(<UIProvider><SuperAdminBusinessesClient token="super-admin-token" userEmail="super@turnovivo.com" initialBusinesses={businesses} initialAdmins={admins} /></UIProvider>);
}

async function openCompany(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Add company' }));
  return screen.getByRole('dialog', { name: 'New company' });
}

async function chooseOwner(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /OWNER ADMIN/ }));
  await user.click(screen.getByRole('option', { name: admin.email }));
}

async function openAction(user: ReturnType<typeof userEvent.setup>, action: string) {
  await user.click(screen.getByRole('button', { name: `Actions for ${business.name}` }));
  await user.click(screen.getByRole('menuitem', { name: action }));
}

describe('SuperAdminBusinessesClient', () => {
  beforeEach(() => {
    currentAdmins = [{ ...admin }];
    currentBusinesses = [{ ...business }];
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockImplementation(async (input, init) => {
      const path = new URL(String(input)).pathname;
      const method = init?.method ?? 'GET';
      const payload = init?.body ? JSON.parse(String(init.body)) : {};
      if (method === 'GET') return jsonResponse(path === '/businesses' ? currentBusinesses : currentAdmins);
      if (path === '/admin/users') {
        const created = { id: 'admin-2', email: payload.email, role: 'ADMIN' };
        currentAdmins.push(created);
        return jsonResponse(created, 201);
      }
      if (method === 'POST') {
        const created = { ...business, ...payload, id: 'company-2', ownerEmail: currentAdmins.find(item => item.id === payload.ownerId)?.email };
        currentBusinesses.push(created);
        return jsonResponse(created, 201);
      }
      currentBusinesses = currentBusinesses.map(item => item.id === business.id
        ? { ...item, ...(method === 'DELETE' ? { active: false } : payload) } : item);
      return method === 'DELETE' ? new Response(null, { status: 204 }) : jsonResponse(currentBusinesses[0]);
    });
  });

  afterEach(() => { vi.unstubAllGlobals(); });

  it('renders the Figma table, status badges and vertical actions without legacy forms', () => {
    renderDashboard();
    expect(screen.getByRole('heading', { name: 'Platform companies' })).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('columnheader').map(item => item.textContent)).toEqual(['Company', 'Status', 'Owner', 'Actions']);
    expect(screen.getByText('Active').parentElement).toHaveAttribute('data-color', 'success');
    expect(screen.getByText(admin.email)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Actions for/ }).querySelector('svg')).toHaveAttribute('viewBox', '0 0 4 16');
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens the admin modal, focuses Email and restores focus on Escape without a request', async () => {
    const user = userEvent.setup();
    renderDashboard();
    const trigger = screen.getByRole('button', { name: 'Add admin' });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'New admin' });
    await waitFor(() => expect(within(dialog).getByLabelText(/^Email/)).toHaveFocus());
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(mutations()).toHaveLength(0);
  });

  it('creates an admin through the authenticated existing endpoint and makes it selectable', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Add admin' }));
    await user.type(screen.getByLabelText(/^Email/), 'new@company.com');
    await user.type(screen.getByLabelText(/^Password/), 'Secure123');
    await user.click(screen.getByRole('button', { name: 'Create admin' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [url, init] = mutations()[0];
    expect(String(url)).toMatch(/\/admin\/users$/);
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer super-admin-token', 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init?.body))).toEqual({ email: 'new@company.com', password: 'Secure123' });
    await openCompany(user);
    await user.click(screen.getByRole('button', { name: /OWNER ADMIN/ }));
    expect(screen.getByRole('option', { name: 'new@company.com' })).toBeInTheDocument();
  });

  it('rejects passwords without a digit before calling the API', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Add admin' }));
    await user.type(screen.getByLabelText(/^Email/), 'new@company.com');
    await user.type(screen.getByLabelText(/^Password/), 'password');
    await user.click(screen.getByRole('button', { name: 'Create admin' }));
    expect(await screen.findByText('Use at least 8 characters, including one number.')).toBeInTheDocument();
    expect(mutations()).toHaveLength(0);
  });

  it('blocks duplicate submissions and dismissal while creating an admin', async () => {
    const user = userEvent.setup();
    let finish!: (response: Response) => void;
    fetchMock.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Add admin' }));
    await user.type(screen.getByLabelText(/^Email/), 'new@company.com');
    await user.type(screen.getByLabelText(/^Password/), 'Secure123');
    await user.dblClick(screen.getByRole('button', { name: 'Create admin' }));
    expect(mutations()).toHaveLength(1);
    expect(screen.getByRole('form')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeDisabled();
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute('readonly');
    await user.keyboard('{Escape}');
    expect(screen.getByRole('dialog', { name: 'New admin' })).toBeInTheDocument();
    await act(async () => { finish(jsonResponse({ id: 'admin-2', email: 'new@company.com', role: 'ADMIN' })); });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('retains form values after an API error and supports retry', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(jsonResponse({ message: ['Email already exists'] }, 409));
    renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Add admin' }));
    await user.type(screen.getByLabelText(/^Email/), 'new@company.com');
    await user.type(screen.getByLabelText(/^Password/), 'Secure123');
    await user.click(screen.getByRole('button', { name: 'Create admin' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Email already exists');
    expect(screen.getByLabelText(/^Email/)).toHaveValue('new@company.com');
    await user.click(screen.getByRole('button', { name: 'Create admin' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mutations()).toHaveLength(2);
  });

  it('creates a company with an automatically generated slug and the selected owner', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openCompany(user);
    await user.type(screen.getByLabelText(/^Name/), 'Barbería Centro');
    expect(screen.getByLabelText(/^SLUG URL/)).toHaveValue('barberia-centro');
    await chooseOwner(user);
    await user.click(screen.getByRole('button', { name: 'Create company' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const [url, init] = mutations()[0];
    expect(String(url)).toMatch(/\/businesses$/);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ name: 'Barbería Centro', slug: 'barberia-centro', ownerId: admin.id });
    expect(screen.getByText('Barbería Centro')).toBeInTheDocument();
  });

  it('preserves a manually edited slug and rejects invalid URL characters', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openCompany(user);
    await user.type(screen.getByLabelText(/^Name/), 'New company');
    await user.clear(screen.getByLabelText(/^SLUG URL/));
    await user.type(screen.getByLabelText(/^SLUG URL/), 'custom-url');
    await user.type(screen.getByLabelText(/^Name/), ' name');
    expect(screen.getByLabelText(/^SLUG URL/)).toHaveValue('custom-url');
    await user.type(screen.getByLabelText(/^SLUG URL/), '!');
    await chooseOwner(user);
    await user.click(screen.getByRole('button', { name: 'Create company' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Use lowercase letters, numbers and hyphens');
    expect(mutations()).toHaveLength(0);
  });

  it('preserves creation of a new owner while creating a company when no admins exist', async () => {
    const user = userEvent.setup();
    currentAdmins = [];
    renderDashboard([], []);
    await openCompany(user);
    expect(screen.getByRole('button', { name: /OWNER ADMIN/ })).toBeDisabled();
    await user.type(screen.getByLabelText(/^Name/), 'New company');
    await user.click(screen.getByRole('button', { name: 'Create a new owner' }));
    await user.type(screen.getByLabelText(/^Admin email/), 'owner@company.com');
    await user.type(screen.getByLabelText(/^Admin password/), 'Secure123');
    await user.click(screen.getByRole('button', { name: 'Create company' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    const requests = mutations();
    expect(requests).toHaveLength(2);
    expect(String(requests[0][0])).toMatch(/\/admin\/users$/);
    expect(JSON.parse(String(requests[1][1]?.body))).toMatchObject({ ownerId: 'admin-2' });
  });

  it('loads the existing business into the modal and saves edits with PUT', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openAction(user, 'Edit company');
    expect(screen.getByRole('dialog', { name: 'Edit company' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue(business.name);
    await user.clear(screen.getByLabelText(/^Name/));
    await user.type(screen.getByLabelText(/^Name/), 'Updated company');
    expect(screen.getByLabelText(/^SLUG URL/)).toHaveValue(business.slug);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(mutations()[0][1]?.method).toBe('PUT');
    expect(String(mutations()[0][0])).toMatch(/\/businesses\/company-1$/);
    expect(JSON.parse(String(mutations()[0][1]?.body))).toEqual({ name: 'Updated company', slug: business.slug, ownerId: admin.id });
  });

  it('does not deactivate a company when the confirmation is rejected', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openAction(user, 'Deactivate company');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Volver' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(mutations()).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Add company' })).toBeEnabled();
  });

  it('deactivates with DELETE only after confirmation and refreshes the badge', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await openAction(user, 'Deactivate company');
    expect(mutations()).toHaveLength(0);
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Sí, desactivar' }));
    expect(await screen.findByText('Inactive')).toBeInTheDocument();
    expect(mutations()[0][1]?.method).toBe('DELETE');
    expect(String(mutations()[0][0])).toMatch(/\/businesses\/company-1$/);
  });

  it('reactivates with the existing PUT payload', async () => {
    const user = userEvent.setup();
    currentBusinesses = [{ ...business, active: false }];
    renderDashboard();
    await openAction(user, 'Reactivate company');
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Sí, reactivar' }));
    expect(await screen.findByText('Active')).toBeInTheDocument();
    expect(mutations()[0][1]?.method).toBe('PUT');
    expect(JSON.parse(String(mutations()[0][1]?.body))).toEqual({ name: business.name, slug: business.slug, ownerId: business.ownerId, active: true });
  });
});