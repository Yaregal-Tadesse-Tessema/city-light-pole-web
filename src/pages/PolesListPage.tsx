import { useState, useEffect, useMemo } from 'react';
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
import { IconEdit, IconTrash, IconHistory, IconEye, IconFilter, IconArrowUp, IconArrowDown, IconArrowsSort } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/client';
import axios from 'axios';

export default function PolesListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useTranslation('polesList');
  const { t: tCommon } = useTranslation('common');
  const { t: tDashboard } = useTranslation('dashboard');
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [subcity, setSubcity] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [streetFilter, setStreetFilter] = useState<string | null>(null);
  const [localAreaNameFilter, setLocalAreaNameFilter] = useState('');
  const [localAreaNameAmFilter, setLocalAreaNameAmFilter] = useState('');
  const [sortBy, setSortBy] = useState<'subcity' | 'street' | 'localAreaName' | 'localAreaNameAm' | null>(null);
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
    queryKey: [
      'poles',
      page,
      limit,
      search,
      subcity,
      status,
      streetFilter,
      localAreaNameFilter,
      localAreaNameAmFilter,
      sortBy,
      sortDirection,
    ],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');

      // Special handling for REPLACED status - query pole replacements instead
      if (status === 'REPLACED') {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        const res = await axios.get(`http://localhost:3011/api/v1/pole-replacements?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Transform replacement data to look like pole data for display
        const replacements = res.data.items || res.data;
        const transformedData = {
          ...res.data,
          items: await Promise.all(replacements.map(async (replacement: any) => {
            // Get the old pole details
            try {
              const poleRes = await axios.get(`http://localhost:3011/api/v1/poles/${replacement.oldPoleCode}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const pole = poleRes.data;

              // Add replacement info to the pole data
              return {
                ...pole,
                replacementInfo: {
                  newPoleCode: replacement.newPoleCode,
                  replacementDate: replacement.replacementDate,
                  replacementReason: replacement.replacementReason,
                  replacedBy: replacement.replacedBy,
                }
              };
            } catch (error) {
              // If old pole not found, return minimal data
              return {
                code: replacement.oldPoleCode,
                status: 'REPLACED',
                subcity: t('labels.unknown'),
                street: t('labels.unknown'),
                replacementInfo: {
                  newPoleCode: replacement.newPoleCode,
                  replacementDate: replacement.replacementDate,
                  replacementReason: replacement.replacementReason,
                  replacedBy: replacement.replacedBy,
                }
              };
            }
          }))
        };

        return transformedData;
      }

      // Normal poles query for other statuses
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search) params.append('search', search);
      if (subcity) params.append('subcity', subcity);
      if (status && status !== 'REPLACED') params.append('status', status);
      if (streetFilter) params.append('street', streetFilter);
      if (localAreaNameFilter.trim()) params.append('localAreaName', localAreaNameFilter.trim());
      if (localAreaNameAmFilter.trim()) params.append('localAreaNameAm', localAreaNameAmFilter.trim());
      if (sortBy) params.append('sortBy', sortBy);
      if (sortDirection) params.append('sortDirection', sortDirection);

      const res = await axios.get(`http://localhost:3011/api/v1/poles?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const subcityOptions = useMemo(() => ([
    { value: 'Addis Ketema', label: tDashboard('subcities.addisKetema') },
    { value: 'Akaky Kaliti', label: tDashboard('subcities.akakyKaliti') },
    { value: 'Arada', label: tDashboard('subcities.arada') },
    { value: 'Bole', label: tDashboard('subcities.bole') },
    { value: 'Gullele', label: tDashboard('subcities.gullele') },
    { value: 'Kirkos', label: tDashboard('subcities.kirkos') },
    { value: 'Kolfe Keranio', label: tDashboard('subcities.kolfeKeranio') },
    { value: 'Lideta', label: tDashboard('subcities.lideta') },
    { value: 'Nifas Silk-Lafto', label: tDashboard('subcities.nifasSilkLafto') },
    { value: 'Yeka', label: tDashboard('subcities.yeka') },
    { value: 'Lemi Kura', label: tDashboard('subcities.lemiKura') },
  ]), [tDashboard]);

  const subcityLabelMap = useMemo(
    () => new Map(subcityOptions.map((item) => [item.value, item.label])),
    [subcityOptions],
  );

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

  const statusOptions = useMemo(() => ([
    { value: 'OPERATIONAL', label: t('statusLabels.OPERATIONAL') },
    { value: 'FAULT_DAMAGED', label: t('statusLabels.FAULT_DAMAGED') },
    { value: 'UNDER_MAINTENANCE', label: t('statusLabels.UNDER_MAINTENANCE') },
    { value: 'REPLACED', label: t('statusLabels.REPLACED') },
  ]), [t]);

  const getStatusLabel = (status?: string) =>
    status ? t(`statusLabels.${status}`, { defaultValue: status }) : t('labels.none');

  const getMaintenanceStatusLabel = (status?: string) =>
    status ? t(`maintenanceStatuses.${status}`, { defaultValue: status }) : t('labels.none');

  const getSubcityLabel = (value?: string) =>
    value ? (subcityLabelMap.get(value) || value) : t('labels.unknown');

  // Use server-side paginated data directly
  const paginatedPoles = data?.items || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);
  const showingFrom = paginatedPoles.length > 0 ? (page - 1) * limit + 1 : 0;
  const showingTo = paginatedPoles.length > 0 ? Math.min(page * limit, totalItems) : 0;

  // Handle sort click
  const handleSort = (column: 'subcity' | 'street' | 'localAreaName' | 'localAreaNameAm') => {
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
        title: t('notifications.deleteSuccessTitle'),
        message: t('notifications.deleteSuccessMessage'),
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['poles'] });
      closeDeleteModal();
      setPoleToDelete(null);
    },
    onError: (error: any) => {
      notifications.show({
        title: t('notifications.deleteErrorTitle'),
        message: error.response?.data?.message || t('notifications.deleteErrorMessage'),
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
        <Title order={1}>{t('title')}</Title>
        {isAdmin && (
          <Button 
            onClick={() => navigate('/poles/new')}
            size="md"
          >
            {t('registerButton')}
          </Button>
        )}
      </Group>

      <Paper p={{ base: 'xs', sm: 'md' }} withBorder mb="md">
        <Stack gap="md">
          <TextInput
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Group grow>
            <Select
              placeholder={t('filters.subcityPlaceholder')}
              data={subcityOptions}
              value={subcity}
              onChange={(value) => {
                setSubcity(value);
                setPage(1);
              }}
              clearable
              searchable
            />
            <Select
              placeholder={t('filters.statusPlaceholder')}
              data={statusOptions}
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              clearable
            />
          </Group>
          <Group grow>
            <TextInput
              placeholder={t('filters.localArea')}
              value={localAreaNameFilter}
              onChange={(e) => {
                setLocalAreaNameFilter(e.target.value);
                setPage(1);
              }}
            />
            <TextInput
              placeholder={t('filters.localAreaAm')}
              value={localAreaNameAmFilter}
              onChange={(e) => {
                setLocalAreaNameAmFilter(e.target.value);
                setPage(1);
              }}
            />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={600}>
          <Table highlightOnHover>
            <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('tableHeaders.code')}</Table.Th>
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>{t('tableHeaders.subcity')}</Text>
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
                        <Text size="sm" fw={600}>{t('filters.filterBySubcity')}</Text>
                        <Select
                          placeholder={t('filters.selectSubcity')}
                          data={subcityOptions}
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
                  <Text>{t('tableHeaders.street')}</Text>
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
                        <Text size="sm" fw={600}>{t('filters.filterByStreet')}</Text>
                        <Select
                          placeholder={t('filters.selectStreet')}
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
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>{t('tableHeaders.localArea')}</Text>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={sortBy === 'localAreaName' ? 'blue' : 'gray'}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSort('localAreaName');
                    }}
                  >
                    {sortBy === 'localAreaName' ? (
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
              <Table.Th>{t('tableHeaders.powerRating')}</Table.Th>
              <Table.Th onClick={(e) => e.stopPropagation()}>
                <Group gap="xs" wrap="nowrap">
                  <Text>{t('tableHeaders.status')}</Text>
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
                        <Text size="sm" fw={600}>{t('filters.filterByStatus')}</Text>
                        <Select
                          placeholder={t('filters.selectStatus')}
                          data={statusOptions}
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
              <Table.Th>{t('tableHeaders.actions')}</Table.Th>
              {status === 'REPLACED' && (
                <>
                  <Table.Th>{t('tableHeaders.newPoleCode')}</Table.Th>
                  <Table.Th>{t('tableHeaders.replacementDate')}</Table.Th>
                  <Table.Th>{t('tableHeaders.reason')}</Table.Th>
                </>
              )}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading ? (
              <Table.Tr>
                <Table.Td colSpan={status === 'REPLACED' ? 10 : 7}>{tCommon('loading')}</Table.Td>
              </Table.Tr>
            ) : paginatedPoles.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={status === 'REPLACED' ? 10 : 7}>{t('noPoles')}</Table.Td>
              </Table.Tr>
            ) : (
              paginatedPoles.map((pole: any) => (
                <Table.Tr 
                  key={pole.code}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/poles/${pole.code}`)}
                >
                  <Table.Td>{pole.code}</Table.Td>
                  <Table.Td>{getSubcityLabel(pole.subcity)}</Table.Td>
                  <Table.Td>{pole.street}</Table.Td>
                  <Table.Td>
                    {[pole.localAreaName, pole.localAreaNameAm].filter(Boolean).join(' / ') || t('labels.none')}
                  </Table.Td>
                  <Table.Td>{pole.powerRatingWatt ? `${pole.powerRatingWatt}W` : t('labels.none')}</Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(pole.status)}>
                      {getStatusLabel(pole.status)}
                    </Badge>
                  </Table.Td>
                  <Table.Td onClick={(e) => e.stopPropagation()}>
                    <Group gap="xs">
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        title={t('actionTitles.view')}
                        onClick={() => navigate(`/poles/${pole.code}`)}
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="blue"
                        size="sm"
                        title={t('actionTitles.history')}
                        onClick={() => handleShowHistory(pole.code)}
                      >
                        <IconHistory size={16} />
                      </ActionIcon>
                      {isAdmin && (
                        <>
                          <ActionIcon
                            color="blue"
                            variant="light"
                            title={t('actionTitles.edit')}
                            onClick={() => navigate(`/poles/${pole.code}/edit`)}
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            color="red"
                            variant="light"
                            title={t('actionTitles.delete')}
                            onClick={() => handleDeleteClick(pole.code)}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </>
                      )}
                    </Group>
                  </Table.Td>
                  {status === 'REPLACED' && pole.replacementInfo && (
                    <>
                      <Table.Td>{pole.replacementInfo.newPoleCode}</Table.Td>
                      <Table.Td>
                        {new Date(pole.replacementInfo.replacementDate).toLocaleDateString()}
                      </Table.Td>
                      <Table.Td>
                        <Badge color="orange" variant="light">
                          {pole.replacementInfo.replacementReason}
                        </Badge>
                      </Table.Td>
                    </>
                  )}
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
            {t('summary', { from: showingFrom, to: showingTo, total: totalItems })}
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
        title={t('deleteModal.title')}
        centered
      >
        <Text>{t('deleteModal.description')}</Text>
        <Group justify="flex-end" mt="xl">
          <Button variant="outline" onClick={closeDeleteModal}>
            {t('deleteModal.cancel')}
          </Button>
          <Button color="red" onClick={handleDeleteConfirm} loading={deleteMutation.isPending}>
            {t('deleteModal.confirm')}
          </Button>
        </Group>
      </Modal>

      <Modal
        opened={historyModalOpened}
        onClose={() => {
          closeHistoryModal();
          setSelectedPoleCode(null);
        }}
        title={t('historyModal.title', { code: selectedPoleCode || '' })}
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
                  <Table.Th>{t('historyModal.tableHeaders.description')}</Table.Th>
                  <Table.Th>{t('historyModal.tableHeaders.status')}</Table.Th>
                  <Table.Th>{t('historyModal.tableHeaders.cost')}</Table.Th>
                  <Table.Th>{t('historyModal.tableHeaders.startDate')}</Table.Th>
                  <Table.Th>{t('historyModal.tableHeaders.endDate')}</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {maintenanceHistory.map((log: any) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{log.description}</Table.Td>
                  <Table.Td>
                    <Badge>{getMaintenanceStatusLabel(log.status)}</Badge>
                  </Table.Td>
                  <Table.Td>
                    {log.estimatedCost && parseFloat(log.estimatedCost) > 0
                      ? `${parseFloat(log.estimatedCost).toFixed(2)}`
                      : log.cost && parseFloat(log.cost) > 0
                      ? `${parseFloat(log.cost).toFixed(2)}`
                      : t('labels.none')}
                  </Table.Td>
                  <Table.Td>
                    {log.startDate
                      ? new Date(log.startDate).toLocaleDateString()
                      : t('labels.none')}
                  </Table.Td>
                  <Table.Td>
                    {log.completedDate
                      ? new Date(log.completedDate).toLocaleDateString()
                      : log.endDate
                      ? new Date(log.endDate).toLocaleDateString()
                      : t('labels.none')}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        ) : (
          <Text c="dimmed" ta="center" p="xl">
            {t('historyModal.noHistory')}
          </Text>
        )}
      </Modal>
    </Container>
  );
}
