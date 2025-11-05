import { Typography, Container } from '@mui/material';

const EventsPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        📅 Kalendarz Wydarzeń
      </Typography>
      <Typography variant="body1">
        Tutaj będzie kalendarz z możliwością dodawania i zarządzania wydarzeniami.
      </Typography>
    </Container>
  );
};

export default EventsPage;
