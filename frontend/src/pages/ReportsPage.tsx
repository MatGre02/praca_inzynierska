import { Typography, Container } from '@mui/material';

const ReportsPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        📈 Raporty
      </Typography>
      <Typography variant="body1">
        Tutaj będą raporty zawodników w formacie JSON/CSV.
      </Typography>
    </Container>
  );
};

export default ReportsPage;
