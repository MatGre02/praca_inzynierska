import { Typography, Container } from '@mui/material';

const StatsPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        📊 Statystyki
      </Typography>
      <Typography variant="body1">
        Tutaj będzie dodawanie i edycja statystyk zawodników.
      </Typography>
    </Container>
  );
};

export default StatsPage;
