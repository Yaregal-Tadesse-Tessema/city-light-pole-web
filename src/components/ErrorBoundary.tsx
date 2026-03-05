import { Component, ReactNode } from 'react';
import { Container, Paper, Title, Text, Button, Stack } from '@mantine/core';
import { withTranslation, WithTranslation } from 'react-i18next';

interface Props extends WithTranslation {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <Container size="md" py="xl">
          <Paper withBorder p="xl">
            <Stack>
              <Title order={2} c="red">{t('errorBoundary.title')}</Title>
              <Text>{this.state.error?.message || t('errorBoundary.message')}</Text>
              <Button onClick={() => window.location.reload()}>
                {t('errorBoundary.reload')}
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }
    return this.props.children;
  }
}

export default withTranslation('errorBoundary')(ErrorBoundary);










