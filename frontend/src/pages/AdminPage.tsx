import { Typography, Container } from '@mui/material';

const AdminPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        ⚙️ Panel Administracyjny
      </Typography>
      <Typography variant="body1">
        Tutaj będzie zarządzanie użytkownikami, rolami i kategoriami.
      </Typography>
    </Container>
  );
};

export default AdminPage;
