import { Typography, Container } from '@mui/material';

const AddMemberPage = () => {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 2 }}>
        ➕ Dodaj Członka Klubu
      </Typography>
      <Typography variant="body1">
        Tutaj będzie formularz do dodawania nowych zawodników i trenerów z danymi osobowymi i czasem kontraktu.
      </Typography>
    </Container>
  );
};

export default AddMemberPage;
