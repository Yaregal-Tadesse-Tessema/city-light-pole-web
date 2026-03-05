import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Modal,
  Stack,
  Select,
  NumberInput,
  Button,
  Group,
  Text,
  Badge,
  Table,
  ActionIcon,
  Alert,
  Loader,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

interface MaterialRequestModalProps {
  opened: boolean;
  onClose: () => void;
  maintenanceScheduleId: number;
  onSuccess?: () => void;
}

interface MaterialItem {
  itemCode: string;
  quantity: number;
  itemName?: string;
  available?: boolean;
  availableQuantity?: number;
  needsPurchase?: boolean;
}

export default function MaterialRequestModal({
  opened,
  onClose,
  maintenanceScheduleId,
  onSuccess,
}: MaterialRequestModalProps) {
  const { t } = useTranslation('materialRequestModal');
  const [items, setItems] = useState<MaterialItem[]>([]);
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const { data: inventoryItems, isLoading: loadingInventory } = useQuery({
    queryKey: ['inventory-items'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('http://localhost:3011/api/v1/inventory?limit=1000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.items || [];
    },
    enabled: opened,
  });

  const checkAvailabilityMutation = useMutation({
    mutationFn: async (itemsToCheck: MaterialItem[]) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:3011/api/v1/inventory/check-availability',
        {
          items: itemsToCheck.map((item) => ({
            itemCode: item.itemCode,
            quantity: item.quantity,
          })),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      return response.data;
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (requestData: any) => {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        'http://localhost:3011/api/v1/material-requests',
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      notifications.show({
        title: t('notifications.successTitle'),
        message: t('notifications.successMessage'),
        color: 'green',
      });
      onSuccess?.();
      onClose();
      setItems([]);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: error.response?.data?.message || t('notifications.errorMessage'),
        color: 'red',
      });
    },
  });

  const handleAddItem = () => {
    if (!selectedItemCode || quantity <= 0) {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.validation.selectItem'),
        color: 'red',
      });
      return;
    }

    const item = inventoryItems?.find((inv: any) => inv.code === selectedItemCode);
    if (!item) return;

    // Check if item already added
    if (items.some((i) => i.itemCode === selectedItemCode)) {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.validation.duplicateItem'),
        color: 'red',
      });
      return;
    }

    const newItem: MaterialItem = {
      itemCode: selectedItemCode,
      quantity,
      itemName: item.name,
      available: item.currentStock >= quantity,
      availableQuantity: item.currentStock,
      needsPurchase: item.currentStock < quantity,
    };

    setItems([...items, newItem]);
    setSelectedItemCode(null);
    setQuantity(1);
  };

  const handleRemoveItem = (itemCode: string) => {
    setItems(items.filter((item) => item.itemCode !== itemCode));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      notifications.show({
        title: t('notifications.errorTitle'),
        message: t('notifications.validation.noItems'),
        color: 'red',
      });
      return;
    }

    // Check availability
    const availabilityResults = await checkAvailabilityMutation.mutateAsync(items);
    
    // Update items with availability info
    const updatedItems = items.map((item) => {
      const result = availabilityResults.find((r: any) => r.itemCode === item.itemCode);
      return {
        ...item,
        available: result?.available || false,
        availableQuantity: result?.availableQuantity || 0,
        needsPurchase: result?.needsPurchase || false,
      };
    });

    setItems(updatedItems);

    // Create material request
    createRequestMutation.mutate({
      maintenanceScheduleId,
      items: items.map((item) => ({
        itemCode: item.itemCode,
        quantity: item.quantity,
      })),
    });
  };

  const inventoryOptions =
    inventoryItems?.map((item: any) => ({
      value: item.code,
      label: `${item.code} - ${item.name} (${t('form.stockLabel')}: ${item.currentStock} ${item.unitOfMeasure})`,
    })) || [];

  const usageItems = items.filter((item) => item.available);
  const purchaseItems = items.filter((item) => !item.available);

  return (
      <Modal
        opened={opened}
        onClose={onClose}
        title={t('title')}
        size="xl"
        centered
      >
        <Stack>
        <Alert color="blue">
          {t('alerts.summary')}
        </Alert>

        <Group grow>
          <Select
            label={t('form.inventoryItemLabel')}
            placeholder={t('form.selectItemPlaceholder')}
            data={inventoryOptions}
            value={selectedItemCode}
            onChange={setSelectedItemCode}
            searchable
            disabled={loadingInventory}
          />
          <NumberInput
            label={t('form.quantityLabel')}
            placeholder={t('form.quantityPlaceholder')}
            min={0.01}
            value={quantity}
            onChange={(value) => setQuantity(Number(value) || 1)}
            style={{ flex: '0 0 120px' }}
          />
              <Button
                onClick={handleAddItem}
                style={{ alignSelf: 'flex-end' }}
                disabled={!selectedItemCode || quantity <= 0}
              >
                {t('form.addButton')}
              </Button>
            </Group>

        {items.length > 0 && (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('tableHeaders.item')}</Table.Th>
                <Table.Th>{t('tableHeaders.quantity')}</Table.Th>
                <Table.Th>{t('tableHeaders.available')}</Table.Th>
                <Table.Th>{t('tableHeaders.status')}</Table.Th>
                <Table.Th>{t('tableHeaders.action')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <Table.Tr key={item.itemCode}>
                  <Table.Td>{item.itemName || item.itemCode}</Table.Td>
                  <Table.Td>{item.quantity}</Table.Td>
                  <Table.Td>
                    {item.availableQuantity !== undefined
                      ? `${item.availableQuantity} ${t('tableHeaders.available')}`
                      : t('tableStatus.checking')}
                  </Table.Td>
                  <Table.Td>
                    {item.available ? (
                      <Badge color="green">{t('tableStatus.availableUsage')}</Badge>
                    ) : (
                      <Badge color="orange">{t('tableStatus.needsPurchase')}</Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <ActionIcon
                      color="red"
                      variant="light"
                      onClick={() => handleRemoveItem(item.itemCode)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}

        {usageItems.length > 0 && (
          <Alert color="green" icon={<IconCheck size={16} />}>
            {t('alerts.usageAvailable', { count: usageItems.length })}
          </Alert>
        )}

        {purchaseItems.length > 0 && (
          <Alert color="orange" icon={<IconX size={16} />}>
            {t('alerts.needsPurchase', { count: purchaseItems.length })}
          </Alert>
        )}

        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={onClose}>
            {t('buttons.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            loading={createRequestMutation.isPending || checkAvailabilityMutation.isPending}
            disabled={items.length === 0}
          >
            {t('buttons.createRequest')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
