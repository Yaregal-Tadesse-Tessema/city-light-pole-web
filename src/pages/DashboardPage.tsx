// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Grid, Paper, Text, Title, Table, Badge, Select, Stack, Group, Tabs, Button, Alert, Pagination, Center } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { IconPackage, IconShoppingCart, IconAlertTriangle, IconCarCrash, IconMapPin } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';

function useCountUp(targetValue: number, durationMs = 800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const target = Number.isFinite(targetValue) ? targetValue : 0;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    setValue(0);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetValue, durationMs]);

  return value;
}

const SUBCITIES = [
  'Addis Ketema',
  'Akaky Kaliti',
  'Arada',
  'Bole',
  'Gullele',
  'Kirkos',
  'Kolfe Keranio',
  'Lideta',
  'Nifas Silk-Lafto',
  'Yeka',
  'Lemi Kura',
];

const SUBCITY_KEYS: Record<string, string> = {
  'Addis Ketema': 'addisKetema',
  'Akaky Kaliti': 'akakyKaliti',
  'Arada': 'arada',
  'Bole': 'bole',
  'Gullele': 'gullele',
  'Kirkos': 'kirkos',
  'Kolfe Keranio': 'kolfeKeranio',
  'Lideta': 'lideta',
  'Nifas Silk-Lafto': 'nifasSilkLafto',
  'Yeka': 'yeka',
  'Lemi Kura': 'lemiKura',
};

const POLE_TYPE_ORDER = ['STANDARD', 'DECORATIVE', 'HIGH_MAST'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const [selectedSubcity, setSelectedSubcity] = useState<string | null>(null);
  const [selectedPoleTypeSubcity, setSelectedPoleTypeSubcity] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('pole');
  const [selectedStatus, setSelectedStatus] = useState<'faulty' | 'working' | 'inProgress'>('faulty');

  // Pagination states for the three bottom tables
  const [operationalPage, setOperationalPage] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const pageSize = 10;

  const getSubcityLabel = (subcity: string) =>
    t(`subcities.${SUBCITY_KEYS[subcity]}`, { defaultValue: subcity });

  const subcityOptions = useMemo(
    () =>
      SUBCITIES.map((subcity) => ({
        value: subcity,
        label: getSubcityLabel(subcity),
      })),
    [t],
  );

  const assetTypeLabels = useMemo(
    () => ({
      pole: t('assetTypes.pole'),
      park: t('assetTypes.park'),
      parking: t('assetTypes.parking'),
      museum: t('assetTypes.museum'),
      toilet: t('assetTypes.toilet'),
      football: t('assetTypes.football'),
      river: t('assetTypes.river'),
      assets: t('assetTypes.assets'),
    }),
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'faulty', label: t('statusOptions.faulty') },
      { value: 'working', label: t('statusOptions.working') },
      { value: 'inProgress', label: t('statusOptions.inProgress') },
    ],
    [t],
  );

  const poleTypeLabels = useMemo(
    () => ({
      STANDARD: t('poleTypes.types.standard'),
      DECORATIVE: t('poleTypes.types.decorative'),
      HIGH_MAST: t('poleTypes.types.highMast'),
    }),
    [t],
  );

  const assetStatusLabels = useMemo(
    () => ({
      OPERATIONAL: t('status.working'),
      FAULT_DAMAGED: t('status.faulty'),
      UNDER_MAINTENANCE: t('status.maintenance'),
      REPLACED: t('status.replaced'),
    }),
    [t],
  );

  const maintenanceStatusLabels = useMemo(
    () => ({
      STARTED: t('maintenanceStatuses.started'),
      COMPLETED: t('maintenanceStatuses.completed'),
    }),
    [t],
  );

  const { data: summary } = useQuery({
    queryKey: ['reports', 'summary'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/summary', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: accidentStats } = useQuery({
    queryKey: ['accidents', 'dashboard-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/accidents/dashboard-stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: faultyByDistrict } = useQuery({
    queryKey: ['reports', 'faulty-by-district', selectedSubcity, selectedAssetType],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (selectedSubcity) params.append('subcity', selectedSubcity);
      if (selectedAssetType) params.append('assetType', selectedAssetType);
      const res = await axios.get(`http://localhost:3011/api/v1/reports/faulty-by-district?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: polesByType, isLoading: isPoleTypeLoading } = useQuery({
    queryKey: ['reports', 'poles-by-type', selectedPoleTypeSubcity],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const params = new URLSearchParams();
      if (selectedPoleTypeSubcity) params.append('subcity', selectedPoleTypeSubcity);
      const queryString = params.toString() ? `?${params.toString()}` : '';
      const res = await axios.get(`http://localhost:3011/api/v1/reports/poles-by-type${queryString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: faultyAssets } = useQuery({
    queryKey: ['assets', 'faulty', selectedSubcity, selectedAssetType],
    queryFn: async () => {
      if (!selectedSubcity) return { items: [], total: 0 };
      const token = localStorage.getItem('access_token');

      // Determine the API endpoint based on asset type
      const endpoints: Record<string, string> = {
        pole: 'poles',
        park: 'parks',
        parking: 'parking-lots',
        museum: 'museums',
        toilet: 'public-toilets',
        football: 'football-fields',
        river: 'river-side-projects',
      };

      const endpoint = endpoints[selectedAssetType] || 'poles';

      // Fetch both FAULT_DAMAGED and UNDER_MAINTENANCE assets
      const [faultyRes, maintenanceRes] = await Promise.all([
        axios.get(`http://localhost:3011/api/v1/${endpoint}?${selectedAssetType === 'pole' ? 'subcity' : 'district'}=${encodeURIComponent(selectedSubcity)}&status=FAULT_DAMAGED&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://localhost:3011/api/v1/${endpoint}?${selectedAssetType === 'pole' ? 'subcity' : 'district'}=${encodeURIComponent(selectedSubcity)}&status=UNDER_MAINTENANCE&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Combine results
      const allAssets = [
        ...(faultyRes.data.items || []),
        ...(maintenanceRes.data.items || []),
      ];

      return {
        items: allAssets,
        total: allAssets.length,
      };
    },
    enabled: !!selectedSubcity && selectedStatus === 'faulty',
  });

  const { data: operationalAssets } = useQuery({
    queryKey: ['assets', 'operational', selectedSubcity, selectedAssetType],
    queryFn: async () => {
      if (!selectedSubcity) return { items: [], total: 0 };
      const token = localStorage.getItem('access_token');

      // Determine the API endpoint based on asset type
      const endpoints: Record<string, string> = {
        pole: 'poles',
        park: 'parks',
        parking: 'parking-lots',
        museum: 'museums',
        toilet: 'public-toilets',
        football: 'football-fields',
        river: 'river-side-projects',
      };

      const endpoint = endpoints[selectedAssetType] || 'poles';

      const res = await axios.get(`http://localhost:3011/api/v1/${endpoint}?${selectedAssetType === 'pole' ? 'subcity' : 'district'}=${encodeURIComponent(selectedSubcity)}&status=OPERATIONAL&limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        items: res.data.items || [],
        total: (res.data.items || []).length,
      };
    },
    enabled: !!selectedSubcity && selectedStatus === 'working',
  });


  // Fetch all maintenance schedules to count in-progress ones
  const { data: maintenanceSchedules } = useQuery({
    queryKey: ['maintenance', 'schedules', 'dashboard'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/maintenance/schedules?limit=10000&type=pole', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return Array.isArray(res.data) ? res.data : res.data.items || [];
    },
  });

  const { data: maintenanceBySubcity } = useQuery({
    queryKey: ['reports', 'maintenance-poles-by-subcity'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/maintenance-poles-by-subcity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: maintenanceByStreet } = useQuery({
    queryKey: ['reports', 'maintenance-poles-by-street'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/maintenance-poles-by-street', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: failedByStreet } = useQuery({
    queryKey: ['reports', 'failed-poles-by-street'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/failed-poles-by-street', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: failedBySubcity } = useQuery({
    queryKey: ['reports', 'failed-poles-by-subcity'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/failed-poles-by-subcity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: operationalByStreet } = useQuery({
    queryKey: ['reports', 'operational-poles-by-street'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/operational-poles-by-street', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: operationalBySubcity } = useQuery({
    queryKey: ['reports', 'operational-poles-by-subcity'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/operational-poles-by-subcity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });


  // Calculate in-progress maintenance count (all maintenances that are not completed)
  const inProgressMaintenanceCount = useMemo(() => {
    if (maintenanceSchedules && Array.isArray(maintenanceSchedules)) {
      return maintenanceSchedules.filter(schedule => schedule.status !== 'COMPLETED').length;
    }
    return 0;
  }, [maintenanceSchedules, t]);

  // Auto-seed maintenance schedules on component mount
  useEffect(() => {
    const autoSeed = async () => {
      if (user?.role === 'ADMIN') {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) return;

          console.log('🔍 Checking if seeding is needed...');

          // Check poles under maintenance
          const polesResponse = await axios.get('http://localhost:3011/api/v1/poles?status=UNDER_MAINTENANCE&limit=1000', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const polesUnderMaintenance = polesResponse.data.items || polesResponse.data || [];

          if (polesUnderMaintenance.length === 0) {
            console.log('✅ No poles under maintenance');
            return;
          }

          // Check existing schedules
          const schedulesResponse = await axios.get('http://localhost:3011/api/v1/maintenance/schedules?limit=10000&type=pole', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const existingSchedules = schedulesResponse.data.items || schedulesResponse.data || [];

          // Find poles needing schedules
          const polesWithSchedules = new Set(existingSchedules.map(s => s.poleCode));
          const polesNeedingSchedules = polesUnderMaintenance.filter(pole => !polesWithSchedules.has(pole.code));

          if (polesNeedingSchedules.length === 0) {
            console.log('✅ All poles already have maintenance schedules');
            return;
          }

          console.log(`🔧 Auto-seeding ${polesNeedingSchedules.length} maintenance schedules...`);

          // Create schedules in batches
          const batchSize = 5;
          let successCount = 0;

          for (let i = 0; i < polesNeedingSchedules.length; i += batchSize) {
            const batch = polesNeedingSchedules.slice(i, i + batchSize);

            await Promise.all(batch.map(async (pole) => {
              const scheduleData = {
                poleCode: pole.code,
                description: `Maintenance for pole ${pole.code} at ${pole.street}, ${pole.subcity}`,
                frequency: 'MONTHLY',
                startDate: new Date().toISOString().split('T')[0],
                endDate: null,
                status: 'STARTED',
                estimatedCost: Math.floor(Math.random() * 500) + 100,
                remark: `Auto-generated maintenance schedule for pole under maintenance`
              };

              try {
                await axios.post('http://localhost:3011/api/v1/maintenance/schedules', scheduleData, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
                successCount++;
              } catch (error) {
                console.error(`Failed for pole ${pole.code}:`, error.response?.data?.message);
              }
            }));

            // Small delay between batches
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          if (successCount > 0) {
            console.log(`✅ Auto-seeded ${successCount} maintenance schedules`);
            // Refresh the page to show new data
            setTimeout(() => window.location.reload(), 1000);
          }

        } catch (error) {
          console.error('Auto-seeding failed:', error);
        }
      }
    };

    // Only run auto-seeding once when component mounts
    autoSeed();
  }, [user]);

  const { data: lowStockItems } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/inventory/low-stock', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: pendingMaterialRequests } = useQuery({
    queryKey: ['material-requests', 'pending'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/material-requests?status=PENDING', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: pendingPurchaseRequests } = useQuery({
    queryKey: ['purchase-requests', 'pending'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/purchase-requests?status=PENDING', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  // Fetch all poles for map display
  const { data: allPoles } = useQuery({
    queryKey: ['poles', 'all'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/poles?limit=10000', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.items || [];
    },
  });

  // Reset pagination when data changes
  useEffect(() => {
    setOperationalPage(1);
  }, [operationalBySubcity, operationalByStreet]);

  useEffect(() => {
    setMaintenancePage(1);
  }, [maintenanceBySubcity, maintenanceByStreet]);

  useEffect(() => {
    setFailedPage(1);
  }, [failedBySubcity, failedByStreet]);

  const inProgressBySubcity = useMemo(() => {
    if (!maintenanceSchedules || !Array.isArray(maintenanceSchedules)) return [];

    const inProgressSchedules = maintenanceSchedules.filter(schedule => schedule.status !== 'COMPLETED');

    const grouped = inProgressSchedules.reduce((acc, schedule) => {
      const subcity = schedule.pole?.subcity || t('labels.unknown');
      acc[subcity] = (acc[subcity] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([subcity, count]) => ({
      subcity,
      count: count as number,
    }));
  }, [maintenanceSchedules]);

  const poleTypeChartData = useMemo(() => {
    const counts = new Map(
      (polesByType || []).map((item: any) => [item.poleType, Number(item.count || 0)]),
    );

    return POLE_TYPE_ORDER.map((type) => ({
      type,
      label: poleTypeLabels[type] || type,
      count: counts.get(type) ?? 0,
    }));
  }, [polesByType, poleTypeLabels]);
  const hasPoleTypeData = poleTypeChartData.some((entry) => entry.count > 0);

  const chartData = selectedStatus === 'faulty'
    ? faultyByDistrict?.map((item: any) => ({
        district: item.district,
        count: item.count,
      })) || []
    : selectedStatus === 'working'
    ? operationalBySubcity?.map((item: any) => ({
        subcity: getSubcityLabel(item.subcity),
        count: item.count,
      })) || []
    : inProgressBySubcity.map((item) => ({
        subcity: getSubcityLabel(item.subcity),
        count: item.count,
      }));

  const assetTypeLabel = assetTypeLabels[selectedAssetType as keyof typeof assetTypeLabels] || assetTypeLabels.assets;
  const statusTitle = selectedStatus === 'faulty'
    ? t('charts.subcityTitles.faulty')
    : selectedStatus === 'working'
    ? t('charts.subcityTitles.working')
    : t('charts.subcityTitles.inProgress');
  const statusNoData = selectedStatus === 'faulty'
    ? t('charts.noData.faulty')
    : selectedStatus === 'working'
    ? t('charts.noData.working')
    : t('charts.noData.inProgress');
  const statusDataKey = selectedStatus === 'faulty' ? 'district' : 'subcity';
  const statusBarColor = selectedStatus === 'faulty' ? '#dc3545' : selectedStatus === 'working' ? '#28a745' : '#ffa500';
  const secondaryHeaderLabel = selectedAssetType === 'park' ? t('tableHeaders.name') : t('tableHeaders.street');

  // Animated “indicator” numbers (top summary cards)
  const totalPolesAnimated = useCountUp(summary?.poles?.total || 0);
  const faultyPolesAnimated = useCountUp(summary?.poles?.faulty || 0);
  const inProgressMaintAnimated = useCountUp(inProgressMaintenanceCount || 0);
  const completedMaintAnimated = useCountUp(summary?.maintenance?.completed || 0);

  return (
    <Container size="xl" pt={{ base: 'xl', sm: 'xl' }} pb={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} order={1} mt={{ base: 'md', sm: 0 }}>{t('title')}</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder style={{ animation: 'dashFadeUp 420ms ease-out both' }}>
            <Text size="sm" c="dimmed">
              {t('totals.totalPoles')}
            </Text>
            <Text size="xl" fw={700} style={{ animation: 'dashPopIn 520ms ease-out both' }}>
              {totalPolesAnimated}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder style={{ animation: 'dashFadeUp 480ms ease-out both' }}>
            <Text size="sm" c="dimmed">
              {t('totals.faultyPoles')}
            </Text>
            <Text size="xl" fw={700} c="red" style={{ animation: 'dashPopIn 560ms ease-out both' }}>
              {faultyPolesAnimated}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder style={{ animation: 'dashFadeUp 540ms ease-out both' }}>
            <Text size="sm" c="dimmed">
              {t('totals.maintenance')}
            </Text>
            <Text size="xl" fw={700} c="orange" style={{ animation: 'dashPopIn 600ms ease-out both' }}>
              {inProgressMaintAnimated}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder style={{ animation: 'dashFadeUp 600ms ease-out both' }}>
            <Text size="sm" c="dimmed">
              {t('totals.completedMaintenance')}
            </Text>
            <Text size="xl" fw={700} c="green" style={{ animation: 'dashPopIn 640ms ease-out both' }}>
              {completedMaintAnimated}
            </Text>
          </Paper>
        </Grid.Col>
        {user?.role === 'ADMIN' && (
          <>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/material-requests?status=PENDING')}>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">
                      Pending Material Requests
                    </Text>
                    <Text size="xl" fw={700} c="orange">
                      {pendingMaterialRequests?.length || 0}
                    </Text>
                  </div>
                  <IconPackage size={24} color="orange" />
                </Group>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/purchase-requests?status=PENDING')}>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">
                      Pending Purchase Requests
                    </Text>
                    <Text size="xl" fw={700} c="yellow">
                      {pendingPurchaseRequests?.length || 0}
                    </Text>
                  </div>
                  <IconShoppingCart size={24} color="yellow" />
                </Group>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Paper p="md" withBorder style={{ cursor: 'pointer' }} onClick={() => navigate('/accidents')}>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" c="dimmed">
                      {t('accidents.totalLabel')}
                    </Text>
                    <Text size="xl" fw={700} c="red">
                      {accidentStats?.totalAccidents || 0}
                    </Text>
                  </div>
                  <IconCarCrash size={24} color="red" />
                </Group>
              </Paper>
            </Grid.Col>
          </>
        )}
      </Grid>


      {user?.role === 'ADMIN' && lowStockItems && lowStockItems.length > 0 && (
        <Alert
          icon={<IconAlertTriangle size={16} />}
          title={t('alerts.lowStock.title')}
          color="red"
          mt="xl"
          mb="md"
          withCloseButton
        >
          <Text size="sm" mb="xs">
            {t('alerts.lowStock.message', { count: lowStockItems.length })}
            <Button
              variant="subtle"
              size="xs"
              onClick={() => navigate('/inventory?lowStock=true')}
              ml="xs"
            >
              {t('alerts.lowStock.viewItems')}
            </Button>
          </Text>
        </Alert>
      )}

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 12 }}>
          <Paper p="md" withBorder>
            <Stack gap="md">
                <Group justify="space-between" wrap="wrap">
                  <Title order={3}>
                    {statusTitle}
                  </Title>
                  <Group gap="xs" wrap="wrap">
                    <Select
                      placeholder={t('filters.allSubcities')}
                      data={[
                        { value: '', label: t('filters.allSubcities') },
                        ...subcityOptions,
                      ]}
                      value={selectedSubcity ?? ''}
                      onChange={(value) => setSelectedSubcity(value && value.trim() ? value : null)}
                      style={{ minWidth: 220 }}
                    />
                    <Select
                      placeholder={t('filters.selectStatus')}
                      data={statusOptions}
                      value={selectedStatus}
                      onChange={(value) => setSelectedStatus((value as 'faulty' | 'working' | 'inProgress') || 'faulty')}
                      clearable={false}
                      style={{ minWidth: 220 }}
                    />
                  </Group>
                </Group>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={statusDataKey}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill={statusBarColor}
                      isAnimationActive
                      animationDuration={900}
                      animationEasing="ease-out"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  {statusNoData}
                </Text>
              )}
              {selectedSubcity && selectedStatus === 'faulty' && faultyAssets && faultyAssets.items && faultyAssets.items.length > 0 && (
                <Stack gap="xs" mt="md">
                  <Text fw={600} size="sm">
                    {t('assets.faultyHeading', {
                      assetType: assetTypeLabel,
                      subcity: getSubcityLabel(selectedSubcity),
                      count: faultyAssets.items.length,
                    })}
                  </Text>
                  <Table.ScrollContainer minWidth={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('tableHeaders.code')}</Table.Th>
                          <Table.Th>{secondaryHeaderLabel}</Table.Th>
                          <Table.Th>{t('tableHeaders.status')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {faultyAssets.items.slice(0, 10).map((asset: any) => {
                          const routes: Record<string, string> = {
                            pole: '/poles',
                            park: '/parks',
                            parking: '/parking-lots',
                            museum: '/museums',
                            toilet: '/public-toilets',
                            football: '/football-fields',
                            river: '/river-side-projects',
                          };
                          const route = routes[selectedAssetType] || '/poles';
                          const displayField = selectedAssetType === 'park' ? asset.name : asset.street;
                          
                          return (
                            <Table.Tr 
                              key={asset.code}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`${route}/${asset.code}`)}
                            >
                              <Table.Td>{asset.code}</Table.Td>
                              <Table.Td>{displayField}</Table.Td>
                              <Table.Td>
                                <Badge color="red">{assetStatusLabels[asset.status] ?? asset.status}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {faultyAssets.items.length > 10 && (
                    <Text size="xs" c="dimmed" ta="center">
                      {t('assets.showing', {
                        shown: 10,
                        total: faultyAssets.items.length,
                        label: t('assets.labels.faulty'),
                      })}
                      <Text 
                        component="span" 
                        c="blue" 
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          const routes: Record<string, string> = {
                            pole: '/poles',
                            park: '/parks',
                            parking: '/parking-lots',
                            museum: '/museums',
                            toilet: '/public-toilets',
                            football: '/football-fields',
                            river: '/river-side-projects',
                          };
                          const route = routes[selectedAssetType] || '/poles';
                          const paramName = selectedAssetType === 'pole' ? 'subcity' : 'district';
                          navigate(`${route}?${paramName}=${encodeURIComponent(selectedSubcity)}&status=FAULT_DAMAGED`);
                        }}
                      >
                        {t('actions.viewAll')}
                      </Text>
                    </Text>
                  )}
                </Stack>
              )}
              {selectedSubcity && selectedStatus === 'working' && operationalAssets && operationalAssets.items && operationalAssets.items.length > 0 && (
                <Stack gap="xs" mt="md">
                  <Text fw={600} size="sm">
                    {t('assets.workingHeading', {
                      assetType: assetTypeLabel,
                      subcity: getSubcityLabel(selectedSubcity),
                      count: operationalAssets.items.length,
                    })}
                  </Text>
                  <Table.ScrollContainer minWidth={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('tableHeaders.code')}</Table.Th>
                          <Table.Th>{secondaryHeaderLabel}</Table.Th>
                          <Table.Th>{t('tableHeaders.status')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {operationalAssets.items.slice(0, 10).map((asset: any) => {
                          const routes: Record<string, string> = {
                            pole: '/poles',
                            park: '/parks',
                            parking: '/parking-lots',
                            museum: '/museums',
                            toilet: '/public-toilets',
                            football: '/football-fields',
                            river: '/river-side-projects',
                          };
                          const route = routes[selectedAssetType] || '/poles';
                          const displayField = selectedAssetType === 'park' ? asset.name : asset.street;

                          return (
                            <Table.Tr
                              key={asset.code}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`${route}/${asset.code}`)}
                            >
                              <Table.Td>{asset.code}</Table.Td>
                              <Table.Td>{displayField}</Table.Td>
                              <Table.Td>
                                <Badge color="green">{assetStatusLabels[asset.status] ?? asset.status}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {operationalAssets.items.length > 10 && (
                    <Text size="xs" c="dimmed" ta="center">
                      {t('assets.showing', {
                        shown: 10,
                        total: operationalAssets.items.length,
                        label: t('assets.labels.working'),
                      })}
                      <Text
                        component="span"
                        c="blue"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => {
                          const routes: Record<string, string> = {
                            pole: '/poles',
                            park: '/parks',
                            parking: '/parking-lots',
                            museum: '/museums',
                            toilet: '/public-toilets',
                            football: '/football-fields',
                            river: '/river-side-projects',
                          };
                          const route = routes[selectedAssetType] || '/poles';
                          const paramName = selectedAssetType === 'pole' ? 'subcity' : 'district';
                          navigate(`${route}?${paramName}=${encodeURIComponent(selectedSubcity)}&status=OPERATIONAL`);
                        }}
                      >
                        {t('actions.viewAll')}
                      </Text>
                    </Text>
                  )}
                </Stack>
              )}
              {selectedSubcity && selectedStatus === 'inProgress' && inProgressBySubcity && inProgressBySubcity.length > 0 && (
                <Stack gap="xs" mt="md">
                  <Text fw={600} size="sm">
                    {t('maintenance.inProgressHeading', {
                      subcity: getSubcityLabel(selectedSubcity),
                      count: inProgressBySubcity.find(item => item.subcity === selectedSubcity)?.count || 0,
                    })}
                  </Text>
                  <Table.ScrollContainer minWidth={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('tableHeaders.poleCode')}</Table.Th>
                          <Table.Th>{t('tableHeaders.description')}</Table.Th>
                          <Table.Th>{t('tableHeaders.startDate')}</Table.Th>
                          <Table.Th>{t('tableHeaders.status')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {maintenanceSchedules
                          ?.filter(schedule => schedule.status !== 'COMPLETED' && schedule.pole?.subcity === selectedSubcity)
                          .slice(0, 10)
                          .map((schedule: any) => (
                            <Table.Tr
                              key={schedule.id}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/maintenance/${schedule.id}`)}
                            >
                              <Table.Td>{schedule.poleCode}</Table.Td>
                              <Table.Td>{schedule.description}</Table.Td>
                              <Table.Td>{new Date(schedule.startDate).toLocaleDateString()}</Table.Td>
                              <Table.Td>
                                <Badge color={schedule.status === 'STARTED' ? 'orange' : 'blue'}>
                                  {maintenanceStatusLabels[schedule.status] ?? schedule.status}
                                </Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {inProgressBySubcity.find(item => item.subcity === selectedSubcity)?.count > 10 && (
                    <Text size="xs" c="dimmed" ta="center">
                      {t('maintenance.showing', {
                        shown: 10,
                        total: inProgressBySubcity.find(item => item.subcity === selectedSubcity)?.count || 0,
                      })}
                      <Text
                        component="span"
                        c="blue"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/maintenance?subcity=${encodeURIComponent(selectedSubcity)}&status=inprogress`)}
                      >
                        {t('actions.viewAll')}
                      </Text>
                    </Text>
                  )}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 12 }} mt="xl">
          <Paper p="md" withBorder>
            <Title order={3} mb="md">
              {t('charts.streetTitle')}
            </Title>
            {failedByStreet && failedByStreet.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={failedByStreet.slice(0, 20)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="street"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#dc3545"
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                {t('charts.noStreetData')}
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 12 }}>
          <Paper p="md" withBorder>
            <Group justify="space-between" align="center" mb="md">
              <Group align="center">
                <Title order={3}>{t('poleTypes.title')}</Title>
              </Group>
              <Group gap="xs" align="center">
                <Select
                  placeholder={t('filters.allSubcities')}
                  data={[
                    { value: '', label: t('filters.allSubcities') },
                    ...subcityOptions,
                  ]}
                  value={selectedPoleTypeSubcity ?? ''}
                  onChange={(value) => setSelectedPoleTypeSubcity(value && value.trim() ? value : null)}
                  style={{ minWidth: 220 }}
                />
                <Text size="sm" c="dimmed">
                  {selectedPoleTypeSubcity
                    ? t('filters.filteredTo', { subcity: getSubcityLabel(selectedPoleTypeSubcity) })
                    : t('filters.citywide')}
                </Text>
              </Group>
            </Group>
            {isPoleTypeLoading ? (
              <Center py="xl">
                <Text>{t('poleTypes.loading')}</Text>
              </Center>
            ) : !hasPoleTypeData ? (
              <Text c="dimmed" ta="center" py="xl">
                {t('poleTypes.noData')}
              </Text>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={poleTypeChartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="#2563eb"
                    isAnimationActive
                    animationDuration={900}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Geographical Map Section */}
      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 12 }}>
          <Paper p="md" withBorder>
            <Group justify="space-between" align="center" mb="md">
              <Group align="center">
                <IconMapPin size={24} color="var(--mantine-color-blue-6)" />
                <Title order={3}>
                  {t('mapSection.title')}
                </Title>
              </Group>
              <Text size="sm" c="dimmed">
                {t('mapSection.helperText')}
              </Text>
            </Group>

            <Grid>
              {SUBCITIES.map((subcity) => {
                const polesInSubcity = allPoles?.filter((pole: any) => pole.subcity === subcity) || [];
                const operationalCount = polesInSubcity.filter((pole: any) => pole.status === 'OPERATIONAL').length;
                const faultyCount = polesInSubcity.filter((pole: any) => pole.status === 'FAULT_DAMAGED').length;
                const maintenanceCount = polesInSubcity.filter((pole: any) => pole.status === 'UNDER_MAINTENANCE').length;

                return (
                  <Grid.Col key={subcity} span={{ base: 12, sm: 6, lg: 3 }}>
                    <Paper
                      p="md"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        backgroundColor: operationalCount > 0 ? 'var(--mantine-color-green-0)' : 'var(--mantine-color-gray-0)',
                        border: operationalCount === polesInSubcity.length ? '2px solid var(--mantine-color-green-6)' : '1px solid var(--mantine-color-gray-3)',
                      }}
                      onClick={() => navigate(`/dashboard/poles-map?subcity=${encodeURIComponent(subcity)}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Stack gap="xs" align="center">
                        <Text fw={600} size="md" ta="center">
                          {getSubcityLabel(subcity)}
                        </Text>
                        <Group gap="xs" wrap="wrap" justify="center">
                          <Badge color="green" size="sm">
                            {operationalCount} {t('status.working')}
                          </Badge>
                          <Badge color="red" size="sm">
                            {faultyCount} {t('status.faulty')}
                          </Badge>
                          <Badge color="yellow" size="sm">
                            {maintenanceCount} {t('status.maintenance')}
                          </Badge>
                        </Group>
                        <Text size="sm" c="dimmed" ta="center">
                          {t('mapCard.totalLabel')}: {polesInSubcity.length} {t('mapCard.polesLabel')}
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                );
              })}
            </Grid>

            <Text size="xs" c="dimmed" ta="center" mt="md">
              {t('mapSection.detailText')}
            </Text>
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p={{ base: 'xs', sm: 'md' }} withBorder>
            <Title order={3} mb="md">
              {t('tables.operational')}
            </Title>
            <Tabs defaultValue="by-subcity">
              <Tabs.List>
                <Tabs.Tab value="by-subcity">{t('tables.tabs.bySubcity')}</Tabs.Tab>
                <Tabs.Tab value="by-street">{t('tables.tabs.byStreet')}</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="by-subcity" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('tableHeaders.subcity')}</Table.Th>
                        <Table.Th>{t('tableHeaders.count')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {operationalBySubcity && operationalBySubcity.length > 0 ? (
                        operationalBySubcity
                          .slice((operationalPage - 1) * pageSize, operationalPage * pageSize)
                          .map((item: any) => (
                            <Table.Tr
                              key={item.subcity}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/poles?subcity=${encodeURIComponent(item.subcity)}&status=OPERATIONAL`)}
                            >
                              <Table.Td>{getSubcityLabel(item.subcity)}</Table.Td>
                              <Table.Td>
                                <Badge color="green">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">{t('tables.noData.operational')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {operationalBySubcity && operationalBySubcity.length > pageSize && (
                  <Center mt="md">
                    <Pagination
                      value={operationalPage}
                      onChange={setOperationalPage}
                      total={Math.ceil(operationalBySubcity.length / pageSize)}
                      size="sm"
                    />
                  </Center>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="by-street" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('tableHeaders.street')}</Table.Th>
                        <Table.Th>{t('tableHeaders.count')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {operationalByStreet && operationalByStreet.length > 0 ? (
                        operationalByStreet
                          .slice((operationalPage - 1) * pageSize, operationalPage * pageSize)
                          .map((item: any) => (
                            <Table.Tr
                              key={item.street}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/poles?street=${encodeURIComponent(item.street)}&status=OPERATIONAL`)}
                            >
                              <Table.Td>{item.street}</Table.Td>
                              <Table.Td>
                                <Badge color="green">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">{t('tables.noData.operational')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {operationalByStreet && operationalByStreet.length > pageSize && (
                  <Center mt="md">
                    <Pagination
                      value={operationalPage}
                      onChange={setOperationalPage}
                      total={Math.ceil(operationalByStreet.length / pageSize)}
                      size="sm"
                    />
                  </Center>
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p={{ base: 'xs', sm: 'md' }} withBorder>
            <Title order={3} mb="md">
              {t('tables.maintenance')}
            </Title>
            <Tabs defaultValue="by-subcity">
              <Tabs.List>
                <Tabs.Tab value="by-subcity">{t('tables.tabs.bySubcity')}</Tabs.Tab>
                <Tabs.Tab value="by-street">{t('tables.tabs.byStreet')}</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="by-subcity" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('tableHeaders.subcity')}</Table.Th>
                        <Table.Th>{t('tableHeaders.count')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {maintenanceBySubcity && maintenanceBySubcity.length > 0 ? (
                        maintenanceBySubcity
                          .slice((maintenancePage - 1) * pageSize, maintenancePage * pageSize)
                          .map((item: any) => (
                            <Table.Tr
                              key={item.subcity}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/poles?subcity=${encodeURIComponent(item.subcity)}&status=UNDER_MAINTENANCE`)}
                            >
                              <Table.Td>{getSubcityLabel(item.subcity)}</Table.Td>
                              <Table.Td>
                                <Badge color="yellow">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">{t('tables.noData.maintenance')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {maintenanceBySubcity && maintenanceBySubcity.length > pageSize && (
                  <Center mt="md">
                    <Pagination
                      value={maintenancePage}
                      onChange={setMaintenancePage}
                      total={Math.ceil(maintenanceBySubcity.length / pageSize)}
                      size="sm"
                    />
                  </Center>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="by-street" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('tableHeaders.street')}</Table.Th>
                        <Table.Th>{t('tableHeaders.count')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {maintenanceByStreet && maintenanceByStreet.length > 0 ? (
                        maintenanceByStreet
                          .slice((maintenancePage - 1) * pageSize, maintenancePage * pageSize)
                          .map((item: any) => (
                            <Table.Tr
                              key={item.street}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/poles?street=${encodeURIComponent(item.street)}&status=UNDER_MAINTENANCE`)}
                            >
                              <Table.Td>{item.street}</Table.Td>
                              <Table.Td>
                                <Badge color="yellow">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">{t('tables.noData.maintenance')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {maintenanceByStreet && maintenanceByStreet.length > pageSize && (
                  <Center mt="md">
                    <Pagination
                      value={maintenancePage}
                      onChange={setMaintenancePage}
                      total={Math.ceil(maintenanceByStreet.length / pageSize)}
                      size="sm"
                    />
                  </Center>
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p={{ base: 'xs', sm: 'md' }} withBorder>
            <Title order={3} mb="md">
              {t('tables.failed')}
            </Title>
            <Tabs defaultValue="by-subcity">
              <Tabs.List>
                <Tabs.Tab value="by-subcity">{t('tables.tabs.bySubcity')}</Tabs.Tab>
                <Tabs.Tab value="by-street">{t('tables.tabs.byStreet')}</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="by-subcity" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('tableHeaders.subcity')}</Table.Th>
                        <Table.Th>{t('tableHeaders.count')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {failedBySubcity && failedBySubcity.length > 0 ? (
                        failedBySubcity
                          .slice((failedPage - 1) * pageSize, failedPage * pageSize)
                          .map((item: any) => (
                            <Table.Tr
                              key={item.subcity}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/poles?subcity=${encodeURIComponent(item.subcity)}&status=FAULT_DAMAGED`)}
                            >
                              <Table.Td>{getSubcityLabel(item.subcity)}</Table.Td>
                              <Table.Td>
                                <Badge color="red">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">{t('tables.noData.failed')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {failedBySubcity && failedBySubcity.length > pageSize && (
                  <Center mt="md">
                    <Pagination
                      value={failedPage}
                      onChange={setFailedPage}
                      total={Math.ceil(failedBySubcity.length / pageSize)}
                      size="sm"
                    />
                  </Center>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="by-street" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>{t('tableHeaders.street')}</Table.Th>
                        <Table.Th>{t('tableHeaders.count')}</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {failedByStreet && failedByStreet.length > 0 ? (
                        failedByStreet
                          .slice((failedPage - 1) * pageSize, failedPage * pageSize)
                          .map((item: any) => (
                            <Table.Tr
                              key={item.street}
                              style={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/poles?street=${encodeURIComponent(item.street)}&status=FAULT_DAMAGED`)}
                            >
                              <Table.Td>{item.street}</Table.Td>
                              <Table.Td>
                                <Badge color="red">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">{t('tables.noData.failed')}</Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                {failedByStreet && failedByStreet.length > pageSize && (
                  <Center mt="md">
                    <Pagination
                      value={failedPage}
                      onChange={setFailedPage}
                      total={Math.ceil(failedByStreet.length / pageSize)}
                      size="sm"
                    />
                  </Center>
                )}
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>

      <style>{`
        @keyframes dashFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dashPopIn {
          0% { transform: scale(0.98); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; }
        }
      `}</style>
    </Container>
  );
}
