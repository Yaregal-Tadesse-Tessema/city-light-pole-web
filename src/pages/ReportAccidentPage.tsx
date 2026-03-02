import { useNavigate } from 'react-router-dom';
import { Container, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import PublicAccidentReportForm from '../components/PublicAccidentReportForm';

export default function ReportAccidentPage() {
  const navigate = useNavigate();

  return (
    <Container size="xl" py="xl">
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Group>
      <PublicAccidentReportForm />
    </Container>
  );
}
