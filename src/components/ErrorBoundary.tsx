import { Component, ReactNode } from 'react';
import { Container, Paper, Title, Text, Button, Stack } from '@mantine/core';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
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
      return (
        <Container size="md" py="xl">
          <Paper withBorder p="xl">
            <Stack>
              <Title order={2} c="red">Something went wrong</Title>
              <Text>{this.state.error?.message || 'An unexpected error occurred'}</Text>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}










