import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Grid, Paper, Text, Title, Table, Badge, Select, Stack, Group, Tabs, Button, Alert, Pagination, Center } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { IconPackage, IconShoppingCart, IconAlertTriangle, IconCarCrash } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';

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

const ASSET_TYPES = [
  { value: 'pole', label: 'Light Pole' },
  { value: 'park', label: 'Public Park', disabled: true },
  { value: 'parking', label: 'Parking Lot', disabled: true },
  { value: 'museum', label: 'Museum', disabled: true },
  { value: 'toilet', label: 'Public Toilet', disabled: true },
  { value: 'football', label: 'Football Field', disabled: true },
  { value: 'river', label: 'River Side Project', disabled: true },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedSubcity, setSelectedSubcity] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('pole');
  const [selectedStatus, setSelectedStatus] = useState<string>('Faulty');

  // Pagination states for the three bottom tables
  const [operationalPage, setOperationalPage] = useState(1);
  const [maintenancePage, setMaintenancePage] = useState(1);
  const [failedPage, setFailedPage] = useState(1);
  const pageSize = 10;

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
    enabled: !!selectedSubcity && selectedStatus === 'Faulty',
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
    enabled: !!selectedSubcity && selectedStatus === 'Working',
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
  }, [maintenanceSchedules]);

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
      const subcity = schedule.pole?.subcity || 'Unknown';
      acc[subcity] = (acc[subcity] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([subcity, count]) => ({
      subcity,
      count: count as number,
    }));
  }, [maintenanceSchedules]);

  const chartData = selectedStatus === 'Faulty'
    ? faultyByDistrict?.map((item: any) => ({
        district: item.district,
        count: item.count,
      })) || []
    : selectedStatus === 'Working'
    ? operationalBySubcity?.map((item: any) => ({
        subcity: item.subcity,
        count: item.count,
      })) || []
    : inProgressBySubcity;

  return (
    <Container size="xl" pt={{ base: 'xl', sm: 'xl' }} pb={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Title mb={{ base: 'md', sm: 'xl' }} order={1} mt={{ base: 'md', sm: 0 }}>Dashboard</Title>

      <Grid>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed">
              Total Poles
            </Text>
            <Text size="xl" fw={700}>
              {summary?.poles?.total || 0}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed">
              Faulty Poles
            </Text>
            <Text size="xl" fw={700} c="red">
              {summary?.poles?.faulty || 0}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed">
              In Progress Maintenances
            </Text>
            <Text size="xl" fw={700} c="orange">
              {inProgressMaintenanceCount}
            </Text>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Paper p="md" withBorder>
            <Text size="sm" c="dimmed">
              Completed Maintenance
            </Text>
            <Text size="xl" fw={700} c="green">
              {summary?.maintenance?.completed || 0}
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
                      Total Accidents
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
          title="Low Stock Alert"
          color="red"
          mb="md"
          withCloseButton
        >
          <Text size="sm" mb="xs">
            {lowStockItems.length} item(s) are below minimum threshold.
            <Button
              variant="subtle"
              size="xs"
              onClick={() => navigate('/inventory?lowStock=true')}
              ml="xs"
            >
              View Items
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
                  {selectedStatus === 'Faulty' ? 'Faulty Assets by Subcity' :
                   selectedStatus === 'Working' ? 'Working Light Poles by Subcity' :
                   'In Progress Maintenances by Subcity'}
                </Title>
                <Group gap="xs" wrap="wrap">
                  <Select
                    placeholder="Select Status"
                    data={['Faulty', 'Working', 'In Progress Maintenances']}
                    value={selectedStatus}
                    onChange={(value) => setSelectedStatus(value || 'Faulty')}
                    clearable={false}
                    style={{ minWidth: 200 }}
                  />
                </Group>
              </Group>
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={selectedStatus === 'Faulty' ? 'district' : 'subcity'}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill={selectedStatus === 'Faulty' ? '#dc3545' : selectedStatus === 'Working' ? '#28a745' : '#ffa500'} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  No {selectedStatus === 'Faulty' ? 'faulty assets' :
                    selectedStatus === 'Working' ? 'working light poles' :
                    'in progress maintenances'} found
                </Text>
              )}
              {selectedSubcity && selectedStatus === 'Faulty' && faultyAssets && faultyAssets.items && faultyAssets.items.length > 0 && (
                <Stack gap="xs" mt="md">
                  <Text fw={600} size="sm">
                    Faulty {ASSET_TYPES.find(t => t.value === selectedAssetType)?.label || 'Assets'} in {selectedSubcity} ({faultyAssets.items.length})
                  </Text>
                  <Table.ScrollContainer minWidth={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Code</Table.Th>
                          <Table.Th>{selectedAssetType === 'pole' ? 'Street' : selectedAssetType === 'park' ? 'Name' : 'Street'}</Table.Th>
                          <Table.Th>Status</Table.Th>
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
                                <Badge color="red">{asset.status}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {faultyAssets.items.length > 10 && (
                    <Text size="xs" c="dimmed" ta="center">
                      Showing 10 of {faultyAssets.items.length} faulty assets. 
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
                        View all
                      </Text>
                    </Text>
                  )}
                </Stack>
              )}
              {selectedSubcity && selectedStatus === 'Working' && operationalAssets && operationalAssets.items && operationalAssets.items.length > 0 && (
                <Stack gap="xs" mt="md">
                  <Text fw={600} size="sm">
                    Working {ASSET_TYPES.find(t => t.value === selectedAssetType)?.label || 'Assets'} in {selectedSubcity} ({operationalAssets.items.length})
                  </Text>
                  <Table.ScrollContainer minWidth={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Code</Table.Th>
                          <Table.Th>{selectedAssetType === 'pole' ? 'Street' : selectedAssetType === 'park' ? 'Name' : 'Street'}</Table.Th>
                          <Table.Th>Status</Table.Th>
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
                                <Badge color="green">{asset.status}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {operationalAssets.items.length > 10 && (
                    <Text size="xs" c="dimmed" ta="center">
                      Showing 10 of {operationalAssets.items.length} working assets.
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
                        View all
                      </Text>
                    </Text>
                  )}
                </Stack>
              )}
              {selectedSubcity && selectedStatus === 'In Progress Maintenances' && inProgressBySubcity && inProgressBySubcity.length > 0 && (
                <Stack gap="xs" mt="md">
                  <Text fw={600} size="sm">
                    In Progress Maintenances in {selectedSubcity} ({inProgressBySubcity.find(item => item.subcity === selectedSubcity)?.count || 0})
                  </Text>
                  <Table.ScrollContainer minWidth={400}>
                    <Table highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Pole Code</Table.Th>
                          <Table.Th>Description</Table.Th>
                          <Table.Th>Start Date</Table.Th>
                          <Table.Th>Status</Table.Th>
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
                                <Badge color={schedule.status === 'STARTED' ? 'orange' : 'blue'}>{schedule.status}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                  {inProgressBySubcity.find(item => item.subcity === selectedSubcity)?.count > 10 && (
                    <Text size="xs" c="dimmed" ta="center">
                      Showing 10 of {inProgressBySubcity.find(item => item.subcity === selectedSubcity)?.count} in progress maintenances.
                      <Text
                        component="span"
                        c="blue"
                        style={{ cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/maintenance?subcity=${encodeURIComponent(selectedSubcity)}&status=inprogress`)}
                      >
                        View all
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
              Faulty Assets by Street
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
                  <Bar dataKey="count" fill="#dc3545" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No faulty assets by street found
              </Text>
            )}
          </Paper>
        </Grid.Col>
      </Grid>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p={{ base: 'xs', sm: 'md' }} withBorder>
            <Title order={3} mb="md">
              Operational Light Poles
            </Title>
            <Tabs defaultValue="by-subcity">
              <Tabs.List>
                <Tabs.Tab value="by-subcity">By Subcity</Tabs.Tab>
                <Tabs.Tab value="by-street">By Street</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="by-subcity" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Subcity</Table.Th>
                        <Table.Th>Count</Table.Th>
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
                              <Table.Td>{item.subcity}</Table.Td>
                              <Table.Td>
                                <Badge color="green">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">No operational poles found</Text>
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
                        <Table.Th>Street</Table.Th>
                        <Table.Th>Count</Table.Th>
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
                            <Text c="dimmed" ta="center">No operational poles found</Text>
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
              Light Poles Under Maintenance
            </Title>
            <Tabs defaultValue="by-subcity">
              <Tabs.List>
                <Tabs.Tab value="by-subcity">By Subcity</Tabs.Tab>
                <Tabs.Tab value="by-street">By Street</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="by-subcity" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Subcity</Table.Th>
                        <Table.Th>Count</Table.Th>
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
                              <Table.Td>{item.subcity}</Table.Td>
                              <Table.Td>
                                <Badge color="yellow">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">No maintenance poles found</Text>
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
                        <Table.Th>Street</Table.Th>
                        <Table.Th>Count</Table.Th>
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
                            <Text c="dimmed" ta="center">No maintenance poles found</Text>
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
              Failed Light Poles
            </Title>
            <Tabs defaultValue="by-subcity">
              <Tabs.List>
                <Tabs.Tab value="by-subcity">By Subcity</Tabs.Tab>
                <Tabs.Tab value="by-street">By Street</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="by-subcity" pt="md">
                <Table.ScrollContainer minWidth={200}>
                  <Table highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Subcity</Table.Th>
                        <Table.Th>Count</Table.Th>
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
                              <Table.Td>{item.subcity}</Table.Td>
                              <Table.Td>
                                <Badge color="red">{item.count}</Badge>
                              </Table.Td>
                            </Table.Tr>
                          ))
                      ) : (
                        <Table.Tr>
                          <Table.Td colSpan={2}>
                            <Text c="dimmed" ta="center">No failed poles found</Text>
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
                        <Table.Th>Street</Table.Th>
                        <Table.Th>Count</Table.Th>
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
                            <Text c="dimmed" ta="center">No failed poles found</Text>
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
    </Container>
  );
}


