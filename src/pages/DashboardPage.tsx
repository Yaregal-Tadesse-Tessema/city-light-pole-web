import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container, Grid, Paper, Text, Title, Table, Badge, Select, Stack, Group, Tabs } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
  const [selectedSubcity, setSelectedSubcity] = useState<string | null>(null);
  const [selectedAssetType, setSelectedAssetType] = useState<string>('pole');

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
    enabled: !!selectedSubcity,
  });

  const { data: maintenanceCost } = useQuery({
    queryKey: ['reports', 'maintenance-cost'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/maintenance-cost', {
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

  const chartData = faultyByDistrict?.map((item: any) => ({
    district: item.district,
    count: item.count,
  })) || [];

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
              Open Issues
            </Text>
            <Text size="xl" fw={700} c="orange">
              {summary?.issues?.open || 0}
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
      </Grid>

      <Grid mt="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper p="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between" wrap="wrap">
                <Title order={3}>
                  Faulty Assets by Subcity
                </Title>
                <Group gap="xs" wrap="wrap">
                  <Select
                    placeholder="Select Asset Type"
                    data={ASSET_TYPES}
                    value={selectedAssetType}
                    onChange={(value) => {
                      setSelectedAssetType(value || 'pole');
                      setSelectedSubcity(null); // Reset subcity when asset type changes
                    }}
                    clearable={false}
                    style={{ minWidth: 180 }}
                  />
                  <Select
                    placeholder="Select Subcity"
                    data={['All', ...SUBCITIES]}
                    value={selectedSubcity || 'All'}
                    onChange={(value) => setSelectedSubcity(value === 'All' ? null : value)}
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
                      dataKey="district" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  No faulty assets found
                </Text>
              )}
              {selectedSubcity && faultyAssets && faultyAssets.items && faultyAssets.items.length > 0 && (
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
            </Stack>
          </Paper>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper p="md" withBorder>
            <Title order={3} mb="md">
              Maintenance Cost Summary
            </Title>
            <Text size="lg" fw={700}>
              ${maintenanceCost?.totalCost?.toFixed(2) || '0.00'}
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Total Cost
            </Text>
            <Text size="lg" fw={700} mt="md">
              ${maintenanceCost?.averageCost?.toFixed(2) || '0.00'}
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Average Cost
            </Text>
            <Text size="lg" fw={700} mt="md">
              {maintenanceCost?.count || 0}
            </Text>
            <Text size="sm" c="dimmed" mt="xs">
              Total Logs
            </Text>
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
                        operationalBySubcity.map((item: any) => (
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
                        operationalByStreet.map((item: any) => (
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
                        maintenanceBySubcity.map((item: any) => (
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
                        maintenanceByStreet.map((item: any) => (
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
                        failedBySubcity.map((item: any) => (
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
                        failedByStreet.map((item: any) => (
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
              </Tabs.Panel>
            </Tabs>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
}


