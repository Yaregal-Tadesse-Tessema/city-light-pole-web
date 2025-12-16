import { useQuery } from '@tanstack/react-query';
import { Container, Grid, Paper, Text, Title, Table, Badge } from '@mantine/core';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

export default function DashboardPage() {
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
    queryKey: ['reports', 'faulty-by-district'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:3011/api/v1/reports/faulty-by-district', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
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

  const chartData = faultyByDistrict?.map((item: any) => ({
    district: item.district,
    count: item.count,
  })) || [];

  return (
    <Container size="xl" py="xl">
      <Title mb="xl">Dashboard</Title>

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
            <Title order={3} mb="md">
              Faulty Poles by Subcity
            </Title>
            {chartData && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="district" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Text c="dimmed" ta="center" py="xl">
                No faulty poles found
              </Text>
            )}
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

      {faultyByDistrict && faultyByDistrict.length > 0 && (
        <Paper p="md" withBorder mt="xl">
          <Title order={3} mb="md">
            Faulty Poles by District
          </Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Subcity</Table.Th>
                <Table.Th>Faulty Count</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {faultyByDistrict.map((item: any) => (
                <Table.Tr key={item.district}>
                  <Table.Td>{item.district}</Table.Td>
                  <Table.Td>
                    <Badge color="red">{item.count}</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}


