import { useNavigate } from 'react-router-dom';
import { Container, Button, Group } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import PublicAccidentReportForm from '../components/PublicAccidentReportForm';
import { useTranslation } from 'react-i18next';
import LanguageSelector from '../components/LanguageSelector';

export default function ReportAccidentPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('reportAccident');

  return (
    <Container size="xl" py="xl">
      <Group mb="xs" style={{ justifyContent: 'space-between' }}>
        <LanguageSelector size="sm" />
      </Group>
      <Group mb="xl">
        <Button
          variant="default"
          leftSection={<IconArrowLeft size={16} />}
          onClick={() => navigate('/')}
        >
          {t('backButton')}
        </Button>
      </Group>
      <PublicAccidentReportForm />
    </Container>
  );
}
