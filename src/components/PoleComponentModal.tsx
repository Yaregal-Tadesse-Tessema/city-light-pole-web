import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  Modal,
  Stack,
  Select,
  NumberInput,
  TextInput,
  Button,
  Group,
  Text,
  Table,
  ActionIcon,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconPlus } from '@tabler/icons-react';
import { componentsApi, poleComponentsApi, COMPONENT_STATUSES } from '../api/components';

interface PoleComponentModalProps {
  opened: boolean;
  onClose: () => void;
  poleCode: string;
  mode: 'add' | 'addBulk' | 'edit' | 'remove';
  assignment?: any;
  onSuccess?: () => void;
}

const STATUS_OPTIONS = COMPONENT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }));

export default function PoleComponentModal({
  opened,
  onClose,
  poleCode,
  mode,
  assignment,
  onSuccess,
}: PoleComponentModalProps) {
  const queryClient = useQueryClient();
  const [componentId, setComponentId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [installationDate, setInstallationDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(assignment?.status || 'INSTALLED');
  const [removeQuantity, setRemoveQuantity] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (assignment && (mode === 'edit' || mode === 'remove')) {
      setQuantity(assignment.quantity ?? 1);
      setStatus(assignment.status || 'INSTALLED');
      setNotes(assignment.notes || '');
    }
  }, [assignment, mode]);

  // Bulk add
  const [bulkItems, setBulkItems] = useState<Array<{ componentId: string; quantity: number; installationDate: string }>>([]);

  // Fetch all components (including inactive ones, since removed components might be inactive)
  const { data: componentsData } = useQuery({
    queryKey: ['components', 'all'],
    queryFn: () => componentsApi.list({ limit: 500 }),
    enabled: opened && (mode === 'add' || mode === 'addBulk'),
  });

  // Fetch existing pole components to check which are already active
  const { data: existingPoleComponentsData } = useQuery({
    queryKey: ['pole-components', poleCode, 'for-filter'],
    queryFn: () => poleComponentsApi.list(poleCode, { includeRemoved: true }),
    enabled: opened && (mode === 'add' || mode === 'addBulk'),
  });

  // Extract components array from API response (handle different response formats)
  const components = Array.isArray(componentsData)
    ? componentsData
    : componentsData?.items ?? componentsData?.data ?? (componentsData ? [componentsData] : []);
  
  // Extract existing pole components array from API response
  const existingPoleComponents = Array.isArray(existingPoleComponentsData)
    ? existingPoleComponentsData
    : existingPoleComponentsData?.items ?? existingPoleComponentsData?.data ?? (existingPoleComponentsData ? [existingPoleComponentsData] : []);
  
  // Get component IDs that are already INSTALLED (active) on this pole
  // Only filter if we have existing pole components data
  let activeComponentIds = new Set<string>();
  if (Array.isArray(existingPoleComponents) && existingPoleComponents.length > 0) {
    const activeIds = existingPoleComponents
      .filter((pc: any) => pc && pc.status === 'INSTALLED')
      .map((pc: any) => {
        // Try componentId first, then component.id
        const id = pc.componentId || pc.component?.id;
        return id ? String(id) : null;
      })
      .filter((id: any) => id != null);
    activeComponentIds = new Set(activeIds as string[]);
  }

  // Filter out components that are already active (INSTALLED) on this pole
  // Convert all IDs to strings for consistent comparison
  const componentOptions = (Array.isArray(components) ? components : [])
    .filter((c: any) => {
      if (!c || !c.id) return false;
      const componentIdStr = String(c.id);
      return !activeComponentIds.has(componentIdStr);
    })
    .map((c: any) => ({
      value: c.id,
      label: `${c.name} (${c.type})`,
    }));

  const addMutation = useMutation({
    mutationFn: () => {
      // Validate that the component is not already active
      if (Array.isArray(existingPoleComponents) && existingPoleComponents.length > 0) {
        const activeIds = new Set(
          existingPoleComponents
            .filter((pc: any) => pc && pc.status === 'INSTALLED')
            .map((pc: any) => {
              const id = pc.componentId || pc.component?.id;
              return id ? String(id) : null;
            })
            .filter((id: any) => id != null) as string[]
        );
        
        const componentIdStr = componentId ? String(componentId) : null;
        if (componentIdStr && activeIds.has(componentIdStr)) {
          throw new Error('Cannot add a component that is already active on this pole');
        }
      }

      return poleComponentsApi.add(poleCode, {
        componentId: componentId!,
        quantity,
        installationDate: installationDate,
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Component assigned', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['pole-components', poleCode] });
      queryClient.invalidateQueries({ queryKey: ['pole', poleCode] });
      onSuccess?.();
      onClose();
      resetForm();
    },
    onError: (e: any) => {
      notifications.show({ title: 'Error', message: e.response?.data?.message || e.message || 'Failed', color: 'red' });
    },
  });

  const bulkAddMutation = useMutation({
    mutationFn: () => {
      // Validate that no components being added are already active
      if (Array.isArray(existingPoleComponents) && existingPoleComponents.length > 0) {
        const activeIds = new Set(
          existingPoleComponents
            .filter((pc: any) => pc && pc.status === 'INSTALLED')
            .map((pc: any) => {
              const id = pc.componentId || pc.component?.id;
              return id ? String(id) : null;
            })
            .filter((id: any) => id != null) as string[]
        );
        
        const invalidItems = bulkItems.filter((i) => {
          if (!i.componentId) return false;
          return activeIds.has(String(i.componentId));
        });
        if (invalidItems.length > 0) {
          throw new Error('Cannot add components that are already active on this pole');
        }
      }

      return poleComponentsApi.bulkAdd(
        poleCode,
        bulkItems.map((i) => ({
          componentId: i.componentId,
          quantity: i.quantity,
          installationDate: i.installationDate || undefined,
        })),
      );
    },
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Components assigned', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['pole-components', poleCode] });
      queryClient.invalidateQueries({ queryKey: ['pole', poleCode] });
      onSuccess?.();
      onClose();
      setBulkItems([]);
    },
    onError: (e: any) => {
      notifications.show({ title: 'Error', message: e.response?.data?.message || e.message || 'Failed', color: 'red' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      poleComponentsApi.update(poleCode, assignment?.componentId || assignment?.component?.id, { quantity, status, notes }),
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Assignment updated', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['pole-components', poleCode] });
      queryClient.invalidateQueries({ queryKey: ['pole', poleCode] });
      onSuccess?.();
      onClose();
    },
    onError: (e: any) => {
      notifications.show({ title: 'Error', message: e.response?.data?.message || 'Failed', color: 'red' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () =>
      poleComponentsApi.remove(poleCode, assignment?.componentId || assignment?.component?.id, removeQuantity),
    onSuccess: () => {
      notifications.show({ title: 'Success', message: 'Component removed', color: 'green' });
      queryClient.invalidateQueries({ queryKey: ['pole-components', poleCode] });
      queryClient.invalidateQueries({ queryKey: ['pole', poleCode] });
      onSuccess?.();
      onClose();
    },
    onError: (e: any) => {
      notifications.show({ title: 'Error', message: e.response?.data?.message || 'Failed', color: 'red' });
    },
  });

  const resetForm = () => {
    setComponentId(null);
    setQuantity(1);
    setInstallationDate('');
    setNotes('');
  };

  const addBulkRow = () => {
    setBulkItems([...bulkItems, { componentId: '', quantity: 1, installationDate: '' }]);
  };

  const removeBulkRow = (idx: number) => {
    setBulkItems(bulkItems.filter((_, i) => i !== idx));
  };

  const updateBulkRow = (idx: number, field: string, value: any) => {
    const next = [...bulkItems];
    next[idx] = { ...next[idx], [field]: value };
    setBulkItems(next);
  };

  const getTitle = () => {
    if (mode === 'add') return 'Add Component to Pole';
    if (mode === 'addBulk') return 'Bulk Add Components';
    if (mode === 'edit') return 'Update Assignment';
    return 'Remove Component';
  };

  return (
    <Modal opened={opened} onClose={onClose} title={getTitle()} size={mode === 'addBulk' ? 'xl' : 'md'} centered>
      <Stack>
        {mode === 'add' && (
          <>
            <Select
              label="Component"
              placeholder="Select component"
              data={componentOptions}
              value={componentId}
              onChange={setComponentId}
              searchable
              required
            />
            <NumberInput label="Quantity" min={1} value={quantity} onChange={(v) => setQuantity(Number(v) || 1)} />
            <TextInput
              type="date"
              label="Installation Date"
              value={installationDate}
              onChange={(e) => setInstallationDate(e.currentTarget.value)}
              required
            />
            <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => addMutation.mutate()}
                loading={addMutation.isPending}
                disabled={!componentId || !installationDate}
              >
                Add
              </Button>
            </Group>
          </>
        )}

        {mode === 'addBulk' && (
          <>
            <Button variant="light" leftSection={<IconPlus size={16} />} onClick={addBulkRow}>
              Add Row
            </Button>
            {bulkItems.length > 0 && (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Component</Table.Th>
                    <Table.Th>Qty</Table.Th>
                    <Table.Th>Date</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {bulkItems.map((row, idx) => (
                    <Table.Tr key={idx}>
                      <Table.Td>
                        <Select
                          data={componentOptions}
                          value={row.componentId}
                          onChange={(v) => updateBulkRow(idx, 'componentId', v)}
                          placeholder="Select"
                          searchable
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          min={1}
                          value={row.quantity}
                          onChange={(v) => updateBulkRow(idx, 'quantity', Number(v) || 1)}
                          style={{ width: 80 }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <TextInput
                          type="date"
                          value={row.installationDate}
                          onChange={(e) => updateBulkRow(idx, 'installationDate', e.currentTarget.value)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon color="red" variant="light" onClick={() => removeBulkRow(idx)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
            <Group justify="flex-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={() => bulkAddMutation.mutate()}
                loading={bulkAddMutation.isPending}
                disabled={bulkItems.length === 0 || bulkItems.some((i) => !i.componentId)}
              >
                Add All
              </Button>
            </Group>
          </>
        )}

        {mode === 'edit' && assignment && (
          <>
            <Text size="sm" c="dimmed">
              {assignment.component?.name} ({assignment.component?.type})
            </Text>
            <NumberInput
              label="Quantity"
              min={1}
              value={quantity}
              onChange={(v) => setQuantity(Number(v) || 1)}
            />
            <Select
              label="Status"
              data={STATUS_OPTIONS}
              value={status}
              onChange={(v) => setStatus(v || 'INSTALLED')}
            />
            <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.currentTarget.value)} />
            <Group justify="flex-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => updateMutation.mutate()} loading={updateMutation.isPending}>
                Update
              </Button>
            </Group>
          </>
        )}

        {mode === 'remove' && assignment && (
          <>
            <Text size="sm" c="dimmed">
              {assignment.component?.name} — Current quantity: {assignment.quantity}
            </Text>
            <NumberInput
              label="Quantity to remove (leave empty to remove all)"
              min={1}
              max={assignment.quantity}
              value={removeQuantity ?? ''}
              onChange={(v) => setRemoveQuantity(v ? Number(v) : undefined)}
              placeholder={`Max: ${assignment.quantity}`}
            />
            <Group justify="flex-end">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                color="red"
                onClick={() => removeMutation.mutate()}
                loading={removeMutation.isPending}
              >
                Remove
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
