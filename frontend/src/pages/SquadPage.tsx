import { Typography, Container } from '@mui/material';

const SquadPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        👥 Kadra Meczowa
      </Typography>
      <Typography variant="body1">
        Tutaj będzie zarządzanie kadrą meczową (max 18 zawodników).
      </Typography>
    </Container>
  );
};

export default SquadPage;
