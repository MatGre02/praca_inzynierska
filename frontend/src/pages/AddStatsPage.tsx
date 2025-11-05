import { Typography, Container } from '@mui/material';

const AddStatsPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        📊 Dodaj Statystyki
      </Typography>
      <Typography variant="body1">
        Tutaj będzie formularz do dodawania statystyk zawodnika - bramki, żółte/czerwone kartki, minuty rozegrane, treningi, czyste konta.
      </Typography>
    </Container>
  );
};

export default AddStatsPage;
