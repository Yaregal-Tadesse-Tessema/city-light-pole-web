import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Paper,
  Title,
  Stack,
  Group,
  Badge,
  Text,
  Button,
  ActionIcon,
  Tooltip,
  LoadingOverlay,
  Tabs,
} from '@mantine/core';
import { IconBell, IconCheck, IconTrash, IconEye } from '@tabler/icons-react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import axios from 'axios';

export default function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications', user.id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/notifications/user/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread', user.id],
    queryFn: async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(`http://localhost:3011/api/v1/notifications/user/${user.id}/unread-count`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:3011/api/v1/notifications/${notificationId}/read`, {
        userId: user.id,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', user.id] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('access_token');
      await axios.patch(`http://localhost:3011/api/v1/notifications/user/${user.id}/read-all`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
    onSuccess: () => {
      notifications.show({
        title: 'Success',
        message: 'All notifications marked as read',
        color: 'green',
      });
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread', user.id] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'blue';
      default:
        return 'gray';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return '📉';
      case 'purchase_completed':
        return '✅';
      case 'issue_created':
        return '🚨';
      case 'maintenance_created':
        return '🔧';
      default:
        return '📢';
    }
  };

  const filteredNotifications = notificationsData?.filter((notification: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !notification.isRead;
    if (activeTab === 'read') return notification.isRead;
    return true;
  }) || [];

  return (
    <Container size="xl" py={{ base: 'md', sm: 'xl' }} px={{ base: 'xs', sm: 'md' }}>
      <Group justify="space-between" mb="lg">
        <Group>
          <IconBell size={32} style={{ color: '#667eea' }} />
          <div>
            <Title size="h1">Notifications</Title>
            <Text c="dimmed">
              {unreadCount || 0} unread notifications
            </Text>
          </div>
        </Group>

        {unreadCount > 0 && (
          <Button
            variant="light"
            color="blue"
            onClick={() => markAllAsReadMutation.mutate()}
            loading={markAllAsReadMutation.isPending}
          >
            Mark All as Read
          </Button>
        )}
      </Group>

      <Paper withBorder>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="all">
              All ({notificationsData?.length || 0})
            </Tabs.Tab>
            <Tabs.Tab value="unread">
              Unread ({unreadCount || 0})
            </Tabs.Tab>
            <Tabs.Tab value="read">
              Read ({(notificationsData?.length || 0) - (unreadCount || 0)})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value={activeTab} pt="md">
            <LoadingOverlay visible={isLoading} />
            <Stack gap="sm">
              {filteredNotifications.length === 0 ? (
                <Text ta="center" py="xl" c="dimmed">
                  No notifications found
                </Text>
              ) : (
                filteredNotifications.map((notification: any) => (
                  <Paper
                    key={notification.id}
                    withBorder
                    p="md"
                    style={{
                      backgroundColor: notification.isRead ? '#f8f9fa' : 'white',
                      borderLeft: `4px solid ${
                        notification.isRead ? '#dee2e6' : '#667eea'
                      }`,
                    }}
                  >
                    <Group justify="space-between" mb="xs">
                      <Group>
                        <Text size="lg">{getTypeIcon(notification.type)}</Text>
                        <div>
                          <Text fw={600}>{notification.title}</Text>
                          <Group gap="xs">
                            <Badge
                              color={getPriorityColor(notification.priority)}
                              size="sm"
                            >
                              {notification.priority.toUpperCase()}
                            </Badge>
                            <Text size="xs" c="dimmed">
                              {new Date(notification.createdAt).toLocaleString()}
                            </Text>
                          </Group>
                        </div>
                      </Group>

                      {!notification.isRead && (
                        <Tooltip label="Mark as read">
                          <ActionIcon
                            color="blue"
                            variant="light"
                            onClick={() => markAsReadMutation.mutate(notification.id)}
                            loading={markAsReadMutation.isPending}
                          >
                            <IconCheck size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>

                    <Text>{notification.message}</Text>

                    {notification.data && (
                      <Text size="sm" c="dimmed" mt="xs">
                        Related data: {JSON.stringify(notification.data)}
                      </Text>
                    )}
                  </Paper>
                ))
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
