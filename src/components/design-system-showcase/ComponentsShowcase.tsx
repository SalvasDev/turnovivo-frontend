'use client';

import { useState } from 'react';
import { type CalendarDate } from '@internationalized/date';
import { I18nProvider, Menu, MenuItem, MenuTrigger, Popover } from 'react-aria-components';
import { APP_LOCALE } from '@/config/app';
import { getBusinessToday } from '@/domain/format';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DatePicker,
  Divider,
  FormModal,
  Icon,
  Input,
  Select,
  Skeleton,
  Spinner,
  Table,
  Toast,
  type BadgeColor,
  type ButtonColor,
  type ButtonVariant,
  type ConfirmDialogVariant,
  type DateAvailability,
  type DateValue,
  type TableColumn,
  type ToastVariant,
} from '@/design-system';
import { useUI } from '@/context/UIContext';
import slotStyles from '../appointment-grid/slot-card/SlotCard.module.css';
import styles from './Showcase.module.css';

const variants: ButtonVariant[] = ['filled', 'outlined', 'text'];
const colors: ButtonColor[] = ['brand', 'green', 'red', 'gold', 'neutral'];
const badgeColors: BadgeColor[] = ['success', 'error', 'warning', 'info'];
const toastVariants: ToastVariant[] = ['success', 'info', 'warning', 'error', 'loading'];
const dialogVariants: ConfirmDialogVariant[] = ['confirm', 'info', 'destructive'];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sampleAvailability = (date: DateValue): DateAvailability => {
  const pattern: DateAvailability[] = ['available', 'available', 'waitlist', 'none', 'available', 'blocked', 'none'];
  return pattern[date.day % pattern.length];
};

interface Row {
  id: string;
  time: string;
  status: 'Available' | 'Reserved' | 'Hold';
  client: string;
}

const rows: Row[] = [
  { id: '1', time: '9:00 – 9:30 AM', status: 'Available', client: '-' },
  { id: '2', time: '9:30 – 10:00 AM', status: 'Reserved', client: 'c-1042' },
  { id: '3', time: '10:00 – 10:30 AM', status: 'Hold', client: 'Assigning...' },
];

const statusColor: Record<Row['status'], BadgeColor> = { Available: 'success', Reserved: 'error', Hold: 'warning' };

function Demo({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={styles.demo} aria-label={title}>
      <h3 className={styles.subTitle}>{title}</h3>
      {children}
    </section>
  );
}

export default function ComponentsShowcase() {
  const { success, info, loading } = useUI();
  const [date, setDate] = useState<CalendarDate | null>(null);
  const [dialog, setDialog] = useState<ConfirmDialogVariant | null>(null);
  const [dialogPending, setDialogPending] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPending, setModalPending] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const columns: TableColumn<Row>[] = [
    { id: 'time', header: 'Slot', isRowHeader: true, renderCell: (row) => row.time },
    { id: 'status', header: 'Status', renderCell: (row) => <Badge color={statusColor[row.status]}>{row.status}</Badge> },
    { id: 'client', header: 'Client ID', renderCell: (row) => row.client },
    {
      id: 'actions',
      header: <span className={styles.srOnly}>Actions</span>,
      width: '12%',
      renderCell: (row) => (
        <MenuTrigger>
          <Button iconOnly variant="text" color="neutral" size="small" aria-label={`Actions for ${row.time}`}>
            <Icon name="moreVertical" />
          </Button>
          <Popover placement="bottom end" offset={8} className={styles.actionPopover}>
            <Menu aria-label={`Actions for ${row.time}`} className={styles.actionMenu}>
              {['View details', 'Edit appointment', 'Cancel appointment'].map((action) => (
                <MenuItem key={action} className={styles.actionItem} onAction={() => info(`${action}: ${row.time}`)}>
                  {action}
                </MenuItem>
              ))}
            </Menu>
          </Popover>
        </MenuTrigger>
      ),
    },
  ];

  const confirmDialog = async () => {
    setDialogPending(true);
    await wait(1500);
    setDialogPending(false);
    setDialog(null);
    success('Action confirmed.');
  };

  const submitModal = async (event: React.FormEvent) => {
    event.preventDefault();
    setModalPending(true);
    await wait(1500);
    setModalPending(false);
    setModalOpen(false);
    success('Form submitted.');
  };

  return (
    <section className={styles.section} aria-labelledby="components-title">
      <h2 id="components-title" className={styles.sectionTitle}>Components</h2>
      <p className={styles.lead}>
        Built on React Aria for keyboard, focus and screen reader behavior. Every interactive state below is live.
      </p>

      <Demo title="Button · variants and colors">
        <div className={styles.matrix} role="group" aria-label="Button variants by color">
          {variants.map((variant) => (
            <div key={variant} className={styles.row}>
              <code className={styles.rowLabel}>{variant}</code>
              {colors.map((color) => (
                <Button key={color} variant={variant} color={color}>{color}</Button>
              ))}
            </div>
          ))}
          {/* Disabled overrides the palette, so one sample per variant covers every color. */}
          <div className={styles.row}>
            <code className={styles.rowLabel}>disabled</code>
            {variants.map((variant) => (
              <Button key={variant} variant={variant} isDisabled>{variant}</Button>
            ))}
          </div>
        </div>
      </Demo>

      <Demo title="Button · sizes, icons and states">
        <div className={styles.row}>
          <Button size="large">Large</Button>
          <Button size="medium">Medium</Button>
          <Button size="small">Small</Button>
          <Button startIcon={<Icon name="add" />}>Start icon</Button>
          <Button variant="outlined" endIcon={<Icon name="chevronRight" />}>End icon</Button>
          <Button iconOnly aria-label="More options" variant="text" color="neutral" size="small"><Icon name="moreVertical" /></Button>
          <Button isDisabled>Disabled</Button>
          <Button isPending pendingLabel="Saving">Pending</Button>
        </div>
        <div className={styles.row}>
          <Button onPress={() => wait(2000)} pendingLabel="Processing">Async action (2s)</Button>
          <Button variant="outlined" lockOnPress pendingLabel="Locked">Lock on press</Button>
          <p className={styles.note}>
            Returning a promise from <code>onPress</code> locks the button and shows a spinner until it settles, so
            double clicks never fire twice.
          </p>
        </div>
      </Demo>

      <Demo title="Badge">
        {(['light', 'solid'] as const).map((appearance) => (
          <div key={appearance} className={styles.row}>
            <code className={styles.rowLabel}>{appearance}</code>
            {badgeColors.map((color) => (
              <Badge key={color} color={color} appearance={appearance}>{color}</Badge>
            ))}
          </div>
        ))}
      </Demo>

      <Demo title="Avatar and Spinner">
        <div className={styles.row}>
          <Avatar name="Ada Lovelace" />
          <Avatar variant="initials" name="Grace Hopper" />
          <Divider className={styles.vDivider} aria-orientation="vertical" />
          <Spinner size="small" />
          <Spinner size="medium" />
          <Spinner size="large" label="Loading example" />
        </div>
      </Demo>

      <Demo title="Form fields">
        <div className={styles.fields}>
          <Input label="Email" placeholder="name@company.com" helperText="We never share your email." isRequired />
          <Input label="Password" type="password" defaultValue="short" state="error" errorMessage="Use at least 8 characters." />
          <Input label="Company" defaultValue="Barberia Premium" state="success" helperText="Name is available." />
          <Input label="Slug" defaultValue="barberia-premium" isDisabled />
          <Select
            label="Owner"
            placeholder="Select an admin"
            options={[
              { id: 'admin-1', label: 'admin@turnovivo.com' },
              { id: 'admin-2', label: 'manager@turnovivo.com' },
            ]}
          />
          <Select
            label="Disabled select"
            placeholder="Unavailable"
            isDisabled
            options={[{ id: 'admin-1', label: 'admin@turnovivo.com' }]}
          />
          <I18nProvider locale={APP_LOCALE}>
            <DatePicker
              label="Appointment date"
              helperText="Open the calendar to see availability per day."
              value={date}
              onChange={setDate}
              minValue={getBusinessToday()}
              getDateAvailability={sampleAvailability}
            />
          </I18nProvider>
        </div>
      </Demo>

      <Demo title="Card">
        <div className={styles.cards}>
          <Card title="9:00 AM" badges={[{ children: 'Available', color: 'success' }]} action={{ children: 'Reserve', variant: 'filled', onPress: () => wait(1500) }} />
          <Card title="9:30 AM" badges={[{ children: 'Your turn', color: 'success', appearance: 'solid' }]} action={{ children: 'Cancel appointment', variant: 'outlined' }} />
          <Card title="10:00 AM" badges={[{ children: 'On hold', color: 'warning' }, { children: 'Waiting', color: 'warning', appearance: 'solid' }]} action={{ children: 'On hold for you', isDisabled: true }} />
          <Card title="10:30 AM" data-slot-status="blocked" className={slotStyles.slotCard} badges={[{ children: 'Cancelled', color: 'error' }]} action={{ children: 'Cancelled', isDisabled: true }} />
        </div>
      </Demo>

      <Demo title="Toast">
        <div className={styles.toasts}>
          {toastVariants.map((variant) => (
            <Toast key={variant} variant={variant} isDismissible={false}>
              {variant === 'loading' ? 'Saving changes...' : `This is a ${variant} message.`}
            </Toast>
          ))}
          {!dismissed && (
            <Toast variant="info" onDismiss={() => setDismissed(true)}>Dismissible notification.</Toast>
          )}
        </div>
        <div className={styles.row}>
          <Button
            variant="outlined"
            onPress={async () => {
              const stop = loading('Syncing...');
              await wait(1500);
              stop();
              success('Synced.');
            }}
          >
            Trigger live toast
          </Button>
        </div>
      </Demo>

      <Demo title="Dialogs">
        <div className={styles.row}>
          {dialogVariants.map((variant) => (
            <Button key={variant} variant="outlined" color={variant === 'destructive' ? 'red' : 'brand'} onPress={() => setDialog(variant)}>
              Open {variant}
            </Button>
          ))}
          <Button onPress={() => setModalOpen(true)}>Open form modal</Button>
        </div>
        <p className={styles.note}>
          Confirm keeps Cancel and Confirm actions; Info is acknowledgement-only; Destructive uses the danger
          treatment. While <code>isPending</code> is true, the confirm button shows progress and dismissal is locked.
        </p>
        <ConfirmDialog
          isOpen={dialog !== null}
          variant={dialog ?? 'confirm'}
          title={dialog === 'destructive' ? 'Delete company' : dialog === 'info' ? 'Heads up' : 'Confirm booking'}
          description="Confirming waits 1.5 seconds so you can see the pending state."
          confirmText={dialog === 'destructive' ? 'Delete' : 'Confirm'}
          isPending={dialogPending}
          onConfirm={() => { void confirmDialog(); }}
          onCancel={() => setDialog(null)}
        />
        <FormModal isOpen={modalOpen} title="New admin" isPending={modalPending} onClose={() => setModalOpen(false)}>
          <form className={styles.modalForm} onSubmit={submitModal} aria-busy={modalPending}>
            <Input label="Email" type="email" isRequired isReadOnly={modalPending} autoFocus />
            <Button type="submit" isPending={modalPending} pendingLabel="Creating admin">Create admin</Button>
          </form>
        </FormModal>
      </Demo>

      <Demo title="Table">
        <div className={styles.tables}>
          <Table caption="Example appointment slots" columns={columns} items={rows} getRowId={(row) => row.id} />
          <Table caption="Empty state example" columns={columns} items={[]} getRowId={(row) => row.id} emptyMessage="No appointments available." />
        </div>
      </Demo>

      <Demo title="Themes side by side">
        <div className={styles.themes}>
          {(['light', 'dark'] as const).map((theme) => (
            <div key={theme} data-theme={theme} className={styles.themePanel} role="group" aria-label={`${theme} theme preview`}>
              <code>{theme}</code>
              <div className={styles.row}>
                <Button>Primary</Button>
                <Button variant="outlined">Secondary</Button>
                <Button isDisabled>Disabled</Button>
                <Badge color="success">Available</Badge>
              </div>
              <Input label="Search" placeholder="Search appointments" />
              <div className={styles.skeletonSamples}>
                <Skeleton variant="circular" width="var(--size-40)" height="var(--size-40)" />
                <Skeleton variant="rectangular" height="var(--size-32)" />
                <Skeleton variant="text" width="72%" />
                <Skeleton variant="text" width="48%" isAnimated={false} />
              </div>
            </div>
          ))}
        </div>
      </Demo>
    </section>
  );
}
