import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Table,
  TextInput,
  Select,
  Button,
  Group,
  Badge,
  Title,
  Pagination,
  ActionIcon,
  Modal,
  Text,
  Stack,
  Loader,
  Popover,
  Checkbox,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconEdit, IconTrash, IconHistory, IconFilter, IconArrowUp, IconArrowDown, IconArrowsSort } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import axios from 'axios';

export default function PolesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [subcity, setSubcity] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [streetFilter, setStreetFilter] = useState<string | null>(null);
  const [ledDisplayFilter, setLedDisplayFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'subcity' | 'street' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [poleToDelete, setPoleToDelete] = useState<string | null>(null);
  const [historyModalOpened, { open: openHistoryModal, close: closeHistoryModal }] = useDisclosure(false);
  const [selectedPoleCode, setSelectedPoleCode] = useState<string | null>(null);

  // Read URL query parameters on mount
  useEffect(() => {
    const urlSubcity = searchParams.get('subcity');
    const urlStatus = searchParams.get('status');
    const urlStreet = searchParams.get('street');
    
    if (urlSubcity) setSubcity(urlSubcity);
    if (urlStatus) setStatus(urlStatus);
    if (urlStreet) setStreetFilter(urlStreet);
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['poles', page, search, subcity, status, streetFilter, ledDisplayFilter, sortBy, sortDirection],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (subcity) params.append('subcity', subcity);
      if (status) params.append('status', status);
      if (streetFilter) params.append('street', streetFilter);
      if (ledDisplayFilter !== null) {
        params.append('hasLedDisplay', ledDisplayFilter === 'yes' ? 'true' : 'false');
      }
      if (sortBy) params.append('sortBy', sortBy);
      if (sortDirection) params.append('sortDirection', sortDirection);

      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/poles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  // Get unique subcities for filter dropdown (fetch all for dropdown options)
  const { data: allPolesData } = useQuery({
    queryKey: ['poles-all-for-subcities'],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/poles?page=1&limit=1000`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });
  const uniqueSubcities = Array.from(new Set((allPolesData?.items || []).map((p: any) => p.subcity).filter(Boolean))).sort();

  const STREETS = [
    'Africa Avenue',
    'Bole Road',
    'Airport Road',
    'Churchill Avenue',
    'Menelik II Avenue',
    'Haile Selassie Avenue',
    'Ras Desta Damtew Avenue',
    'Ras Mekonnen Avenue',
    'Ras Abebe Aregay Street',
    'Dejazmach Balcha Abanefso Street',
    'King George VI Street',
    'Queen Elizabeth II Street',
    'Mahatma Gandhi Street',
    'Sylvia Pankhurst Street',
    'Jomo Kenyatta Avenue',
    'Patrice Lumumba Street',
    'Nelson Mandela Avenue',
    'Julius Nyerere Street',
    'Samora Machel Street',
    'Kwame Nkrumah Street',
    'Ahmed Sekou Toure Street',
    'Gamal Abdel Nasser Street',
    'Jawaharlal Nehru Street',
    'Alexander Pushkin Avenue',
    'Cunningham Street',
    'Smuts Avenue',
    'Hachalu Hundessa Road',
    'Haile Gebreselassie Avenue',
    'Sahle Selassie Street',
    'Yohannes IV Street',
    'Tewodros II Street',
    'Menelik I Street',
    'Atse Yohannes Street',
    'Atse Tewodros Street',
    'Atse Menelik Street',
    'Atse Haile Selassie Street',
    'Adwa Street',
    'Alula Aba Nega Street',
    'Aba Kiros Street',
    'Aba Samuel Road',
    'Debre Zeit Road',
    'Jimma Road',
    'Ambo Road',
    'Dessie Road',
    'Gojjam Berenda Road',
    'Sidamo Road',
    'Wolaita Road',
    'Arsi Road',
    'Bale Road',
    'Borena Road',
    'Harar Road',
    'Wollo Sefer Road',
    'Mekelle Road',
    'Gondar Road',
    'Bahir Dar Road',
    'Dire Dawa Road',
    'Assab Road',
    'Djibouti Road',
    'Sudan Street',
    'Egypt Street',
    'Algeria Avenue',
    'Tunisia Street',
    'Morocco Street',
    'Libya Street',
    'Senegal Street',
    'Mali Street',
    'Niger Street',
    'Nigeria Street',
    'Ghana Street',
    'Benin Street',
    'Togo Street',
    'Cameroon Street',
    'Chad Street',
    'Congo Street',
    'Gabon Street',
    'Central African Republic Street',
    'South Africa Street',
    'Sierra Leone Street',
    'Liberia Street',
    'Ivory Coast Street',
    'Guinea Street',
    'Ethiopia Street',
    'Kenya Street',
    'Uganda Street',
    'Tanzania Street',
    'Rwanda Street',
    'Burundi Street',
    'Somalia Street',
    'Eritrea Street',
    'Djibouti Street',
    'Madagascar Avenue',
    'Mauritius Street',
    'Seychelles Street',
    'Comoros Street',
    'Mozambique Street',
    'Angola Street',
    'Namibia Street',
    'Botswana Street',
    'Zimbabwe Street',
    'Zambia Street',
    'Malawi Street',
    'Lesotho Street',
    'Swaziland Avenue',
    'Sao Tome and Principe Street',
    'Cape Verde Street',
    '20 Meter Road',
    '22 Meter Road',
    '30 Meter Road',
    '40 Meter Road',
    'Ring Road',
    'CMC Road',
    'Megenagna Road',
    'Summit Road',
    'Salite Mihret Road',
    'Yeka Road',
    'Kotebe Road',
    'Ayat Road',
    'Gurd Shola Road',
    'Kazanchis Road',
    'Mexico Square Road',
    'Meskel Square Road',
    'Saris Road',
    'Kaliti Road',
    'Akaki Road',
    'Tor Hailoch Road',
    'Asko Road',
    'Shiro Meda Road',
    'Entoto Road',
    'Piassa Road',
    'Arada Road',
    'Merkato Road',
    'Kolfe Road',
    'Jemo Road',
    'Gotera Road',
    'Lancha Road',
    'Kera Road',
    'Ayer Tena Road',
    'Lafto Road',
    'Nifas Silk Road',
    'Gerji Road',
    'Beshale Road',
    'Lebu Road',
    'Figa Road',
    'Chechela Road',
    'Bole Bulbula Road',
    'Addis Ketema Road',
    'Lideta Road',
    'Kirkos Road',
    'Yeka Abado Road',
    'Gulele Road',
    'Arat Kilo Road',
    'Sidist Kilo Road',
    'Sebategna Road',
    'Autobus Tera Road',
    'Shola Market Road',
    'Bole Medhanealem Road',
    'Megenagna Square Road',
    'St. Urael Road',
    'Atlas Road',
    'Edna Mall Road',
    'Friendship Building Road',
    'Ethiopian Airlines Road',
    'Millennium Hall Road',
    'African Union Road',
  ];

  // Use server-side paginated data directly
  const paginatedPoles = data?.items || [];
  const totalItems = data?.total || 0;
  const itemsPerPage = data?.limit || 10;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Handle sort click
  const handleSort = (column: 'subcity' | 'street') => {
    if (sortBy === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column with ascending direction
      setSortBy(column);
      setSortDirection('asc');
    }
    setPage(1); // Reset to first page when sorting
  };

  const { data: maintenanceHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['maintenance-history', selectedPoleCode],
    queryFn: async () => {
      if (!selectedPoleCode) return [];
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/poles/${selectedPoleCode}/maintenance-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
    enabled: !!selectedPoleCode && historyModalOpened,
  });

  const deleteMutation = useMutation({
    mutationFn: async (code: string) => {
      await apiClient.delete(`poles/${code}`);
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'Pole deleted successfully',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['poles'] });
      closeDeleteModal();
      setPoleToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to delete pole',
        color: 'red',
      });
    },
  });

  const handleDeleteClick = (code: string) => {
    setPoleToDelete(code);
    openDeleteModal();
  };

  const handleDeleteConfirm = () => {
    if (poleToDelete) {
      deleteMutation.mutate(poleToDelete);
    }
  };

  const handleShowHistory = (code: string) => {
    setSelectedPoleCode(code);
    openHistoryModal();
  };

  const isAdmin = user?.role === 'ADMIN';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'green';
      case 'FAULT_DAMAGED':
        return 'red';
      case 'UNDER_MAINTENANCE':
        return 'yellow';
      default:
        return 'gray';
    }
  };

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb={{ base: 'md', sm: 'xl' }} wrap="wrap">
        <Title order={1}>Light Poles</Title>
        {isAdmin && (
          <Button 
            onClick={() => navigate('/poles/new')}
            size="md"
          >
            Register Light Pole
          </Button>
        )}
      </Group>

      <Paper p={{ base: 'xs', sm: 'md' }} withBorder mb="md">
        <Stack gap="md">
          <TextInput
            placeholder="Search by code, street, or subcity"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Group grow>
            <Select
              placeholder="Subcity"
              data={[
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
              ]}
              value={subcity}
              onChange={(value) => {
                setSubcity(value);
                setPage(1);
              }}
              clearable
              searchable
            />
            <Select
              placeholder="Status"
              data={['OPERATIONAL', 'FAULT_DAMAGED', 'UNDER_MAINTENANCE']}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              clearable
            />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
            <Table.Tr>
              <Table.Th>Code</Table.Th>
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>Subcity</Text>
                  <Popover position="bottom" withArrow shadow="md" withinPortal>
                    <Popover.Target>
                      <ActionIcon
                        size="sm"
                        variant={subcity ? 'filled' : 'subtle'}
                        color={subcity ? 'blue' : 'gray'}
                      >
                        <IconFilter size={14} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text size="sm" fw={600}>Filter by Subcity</Text>
                        <Select
                          placeholder="Select subcity"
                          data={uniqueSubcities}
                          value={subcity}
                          onChange={(value) => {
                            setSubcity(value);
                            setPage(1);
                          }}
                          clearable
                          searchable
                        />
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={sortBy === 'subcity' ? 'blue' : 'gray'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('subcity');
                    }}
                  >
                    {sortBy === 'subcity' ? (
                      sortDirection === 'asc' ? (
                        <IconArrowUp size={14} />
                      ) : (
                        <IconArrowDown size={14} />
                      )
                    ) : (
                      <IconArrowsSort size={14} />
                    )}
                  </ActionIcon>
                </Group>
              </Table.Th>
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>Street</Text>
                  <Popover position="bottom" withArrow shadow="md" withinPortal>
                    <Popover.Target>
                      <ActionIcon
                        size="sm"
                        variant={streetFilter ? 'filled' : 'subtle'}
                        color={streetFilter ? 'blue' : 'gray'}
                      >
                        <IconFilter size={14} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text size="sm" fw={600}>Filter by Street</Text>
                        <Select
                          placeholder="Select street"
                          data={STREETS}
                          value={streetFilter}
                          onChange={(value) => {
                            setStreetFilter(value);
                            setPage(1);
                          }}
                          clearable
                          searchable
                          style={{ minWidth: 250 }}
                        />
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={sortBy === 'street' ? 'blue' : 'gray'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('street');
                    }}
                  >
                    {sortBy === 'street' ? (
                      sortDirection === 'asc' ? (
                        <IconArrowUp size={14} />
                      ) : (
                        <IconArrowDown size={14} />
                      )
                    ) : (
                      <IconArrowsSort size={14} />
                    )}
                  </ActionIcon>
                </Group>
              </Table.Th>
              <Table.Th>Power Rating</Table.Th>
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>Status</Text>
                  <Popover position="bottom" withArrow shadow="md" withinPortal>
                    <Popover.Target>
                      <ActionIcon
                        size="sm"
                        variant={status ? 'filled' : 'subtle'}
                        color={status ? 'blue' : 'gray'}
                      >
                        <IconFilter size={14} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text size="sm" fw={600}>Filter by Status</Text>
                        <Select
                          placeholder="Select status"
                          data={['OPERATIONAL', 'FAULT_DAMAGED', 'UNDER_MAINTENANCE']}
                          value={status}
                          onChange={(value) => {
                            setStatus(value);
                            setPage(1);
                          }}
                          clearable
                        />
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                </Group>
              </Table.Th>
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>LED Display</Text>
                  <Popover position="bottom" withArrow shadow="md" withinPortal>
                    <Popover.Target>
                      <ActionIcon
                        size="sm"
                        variant={ledDisplayFilter ? 'filled' : 'subtle'}
                        color={ledDisplayFilter ? 'blue' : 'gray'}
                      >
                        <IconFilter size={14} />
                      </ActionIcon>
                    </Popover.Target>
                    <Popover.Dropdown>
                      <Stack gap="xs">
                        <Text size="sm" fw={600}>Filter by LED Display</Text>
                        <Select
                          placeholder="Select option"
                          data={[
                            { value: 'yes', label: 'Yes' },
                            { value: 'no', label: 'No' },
                          ]}
                          value={ledDisplayFilter}
                          onChange={(value) => {
                            setLedDisplayFilter(value);
                            setPage(1);
                          }}
                          clearable
                        />
                      </Stack>
                    </Popover.Dropdown>
                  </Popover>
                </Group>
              </Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={7}>Loading...</Table.Td>
              </Table.Tr>
            ) : paginatedPoles.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>No poles found</Table.Td>
              </Table.Tr>
            ) : (
              paginatedPoles.map((pole: any) => (
                <Table.Tr 
                  key={pole.code}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/poles/${pole.code}`)}
                >
                  <Table.Td>{pole.code}</Table.Td>
                  <Table.Td>{pole.subcity}</Table.Td>
                  <Table.Td>{pole.street}</Table.Td>
                  <Table.Td>{pole.powerRatingWatt ? `${pole.powerRatingWatt}W` : '-'}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(pole.status)}>
                      {pole.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {pole.hasLedDisplay ? (
                      <Badge color="blue" variant="light">Yes</Badge>
                    ) : (
                      <Badge color="gray" variant="light">No</Badge>
                    )}
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs">
                      <Button
                        size="xs"
                        variant="light"
                        onClick={() => navigate(`/poles/${pole.code}`)}
                      >
                        View
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconHistory size={14} />}
                        onClick={() => handleShowHistory(pole.code)}
                      >
                        Show History
                      </Button>
                      {isAdmin && (
                        <>
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => navigate(`/poles/${pole.code}/edit`)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => handleDeleteClick(pole.code)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
          )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      {totalPages > 0 && (
        <Group justify="space-between" align="center" mt="md">
          <Text size="sm" c="dimmed">
            Showing {paginatedPoles.length > 0 ? ((page - 1) * itemsPerPage + 1) : 0} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems} poles
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
          />
        </Group>
      )}

      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title="Delete Light Pole"
        centered
      >
        <Text>Are you sure you want to delete this light pole? This action cannot be undone.</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
            Delete
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={historyModalOpened}
        onClose={() => {
          closeHistoryModal();
          setSelectedPoleCode(null);
        }}
        title={`Maintenance History - ${selectedPoleCode}`}
        size="xl"
        centered
      >
        {historyLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : maintenanceHistory && maintenanceHistory.length > 0 ? (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Description</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Cost</Table.Th>
                <Table.Th>Start Date</Table.Th>
                <Table.Th>End Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {maintenanceHistory.map((log: any) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{log.description}</Table.Td>
                  <Table.Td>
                    <Badge>{log.status}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {log.estimatedCost && parseFloat(log.estimatedCost) > 0
                      ? `$${parseFloat(log.estimatedCost).toFixed(2)}`
                      : log.cost && parseFloat(log.cost) > 0
                      ? `$${parseFloat(log.cost).toFixed(2)}`
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    {log.startDate
                      ? new Date(log.startDate).toLocaleDateString()
                      : '-'}
                  </Table.Td>
                  <Table.Td>
                    {log.completedDate
                      ? new Date(log.completedDate).toLocaleDateString()
                      : log.endDate
                      ? new Date(log.endDate).toLocaleDateString()
                      : '-'}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" p="xl">
            No maintenance history found for this pole.
          </Text>
        )}
      </Modal>
    </Container>
  );
}


